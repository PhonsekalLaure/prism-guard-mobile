import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrismColors } from "@/constants/prismTheme";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import {
  getDateKey,
  getMonthKey,
  isDateRangeScheduled,
  parseDateKey,
} from "@/utils/leaveDates";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function getInitialMonth(selectedDate, minDate) {
  const parsed = parseDateKey(selectedDate) || parseDateKey(minDate) || new Date();
  return {
    month: parsed.getMonth(),
    year: parsed.getFullYear(),
  };
}

function getMonthLabel(year, month) {
  return MONTH_FORMATTER.format(new Date(year, month, 1));
}

function compareDateKeys(left, right) {
  return String(left || "").localeCompare(String(right || ""));
}

function getMonthPartsFromKey(monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number);
  return { year, month: month - 1 };
}

function getMonthKeysBetween(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [];

  const keys = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const final = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= final) {
    keys.push(getMonthKey(cursor.getFullYear(), cursor.getMonth()));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

export default function ScheduledLeaveDatePicker({
  visible,
  title,
  selectedDate,
  minDate,
  maxDate,
  selectableMode = "scheduled",
  rangeStartDate,
  onSelect,
  onClose,
}) {
  const initialMonth = useMemo(
    () => getInitialMonth(selectedDate, minDate),
    [minDate, selectedDate],
  );
  const [month, setMonth] = useState(initialMonth.month);
  const [year, setYear] = useState(initialMonth.year);
  const [scheduleCache, setScheduleCache] = useState({});
  const [loadingMonthKeys, setLoadingMonthKeys] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setMonth(initialMonth.month);
    setYear(initialMonth.year);
  }, [initialMonth.month, initialMonth.year, visible]);

  const visibleMonthKey = getMonthKey(year, month);

  const loadMonth = useCallback(async (monthKey) => {
    if (
      !visible
      || scheduleCache[monthKey]
    ) {
      return;
    }

    const target = getMonthPartsFromKey(monthKey);
    setLoadingMonthKeys((prev) => [...new Set([...prev, monthKey])]);
    setError("");
    try {
      const result = await fetchMonthlySchedule(target);
      setScheduleCache((prev) => ({
        ...prev,
        [monthKey]: {
          scheduledDates: result.scheduledDates || [],
          absentDates: result.absentDates || [],
        },
      }));
    } catch (err) {
      setError(err.message || "Could not load scheduled dates.");
    } finally {
      setLoadingMonthKeys((prev) => prev.filter((key) => key !== monthKey));
    }
  }, [scheduleCache, visible]);

  useEffect(() => {
    loadMonth(visibleMonthKey);
  }, [loadMonth, visibleMonthKey]);

  useEffect(() => {
    if (!visible || !rangeStartDate) return;

    const visibleMonthEnd = getDateKey(
      year,
      month,
      new Date(year, month + 1, 0).getDate(),
    );
    getMonthKeysBetween(rangeStartDate, visibleMonthEnd)
      .filter((monthKey) => monthKey !== visibleMonthKey)
      .forEach(loadMonth);
  }, [loadMonth, month, rangeStartDate, visible, visibleMonthKey, year]);

  const scheduledSet = useMemo(
    () => new Set(scheduleCache[visibleMonthKey]?.scheduledDates || []),
    [scheduleCache, visibleMonthKey],
  );
  const absentSet = useMemo(
    () => new Set(scheduleCache[visibleMonthKey]?.absentDates || []),
    [scheduleCache, visibleMonthKey],
  );
  const hasLoadedVisibleMonth = Object.prototype.hasOwnProperty.call(
    scheduleCache,
    visibleMonthKey,
  );
  const allLoadedScheduledDates = useMemo(
    () => Object.values(scheduleCache).flatMap((item) => item.scheduledDates || []),
    [scheduleCache],
  );
  const allLoadedSelectableDates = useMemo(() => {
    if (selectableMode !== "sick") return allLoadedScheduledDates;
    return Object.values(scheduleCache).flatMap((item) => [
      ...(item.scheduledDates || []),
      ...(item.absentDates || []),
    ]);
  }, [allLoadedScheduledDates, scheduleCache, selectableMode]);
  const isLoading = loadingMonthKeys.includes(visibleMonthKey);
  const selectableCount = selectableMode === "sick"
    ? scheduledSet.size + absentSet.size
    : scheduledSet.size;
  const hasNoSelectableDates = hasLoadedVisibleMonth && !isLoading && selectableCount === 0;

  const hasLoadedDateRange = useCallback((startDate, endDate) => (
    getMonthKeysBetween(startDate, endDate).every((monthKey) => (
      Object.prototype.hasOwnProperty.call(scheduleCache, monthKey)
    ))
  ), [scheduleCache]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    cells.push({ day: prevDays - i, current: false });
  }
  for (let i = 1; i <= daysInMonth; i += 1) {
    cells.push({ day: i, current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      day: cells.length - daysInMonth - firstDay + 1,
      current: false,
    });
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else {
      setMonth((value) => value - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else {
      setMonth((value) => value + 1);
    }
  };

  const getDisabledReason = (dateKey) => {
    if (isLoading) {
      return "loading";
    }
    if (minDate && compareDateKeys(dateKey, minDate) < 0) {
      return "before-minimum";
    }
    if (maxDate && compareDateKeys(dateKey, maxDate) > 0) {
      return "after-maximum";
    }
    const isSelectableDate = selectableMode === "sick"
      ? scheduledSet.has(dateKey) || absentSet.has(dateKey)
      : scheduledSet.has(dateKey);
    if (!isSelectableDate) {
      return "not-scheduled";
    }
    if (
      rangeStartDate
      && compareDateKeys(dateKey, rangeStartDate) >= 0
      && !hasLoadedDateRange(rangeStartDate, dateKey)
    ) {
      return "loading";
    }
    if (
      rangeStartDate
      && compareDateKeys(dateKey, rangeStartDate) >= 0
      && !isDateRangeScheduled(rangeStartDate, dateKey, allLoadedSelectableDates)
    ) {
      return "range-has-off-day";
    }
    return null;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.monthButton} onPress={handlePrevMonth}>
            <Feather name="chevron-left" size={18} color={PrismColors.navy} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{getMonthLabel(year, month)}</Text>
          <TouchableOpacity style={styles.monthButton} onPress={handleNextMonth}>
            <Feather name="chevron-right" size={18} color={PrismColors.navy} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={PrismColors.navy} />
            <Text style={styles.loadingText}>Loading scheduled dates...</Text>
          </View>
        ) : null}
        {hasNoSelectableDates ? (
          <Text style={styles.emptyText}>
            {selectableMode === "sick"
              ? "No sick leave eligible dates were found for this month."
              : "No scheduled shift days were found for this month."}
          </Text>
        ) : null}

        <View style={styles.weekHeader}>
          {DAYS.map((day) => (
            <Text key={day} style={styles.weekLabel}>{day}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell, index) => {
            const dateKey = cell.current ? getDateKey(year, month, cell.day) : null;
            const disabledReason = dateKey ? getDisabledReason(dateKey) : "outside-month";
            const isDisabled = Boolean(disabledReason);
            const isSelected = dateKey === selectedDate;

            return (
              <TouchableOpacity
                key={`${cell.day}-${index}`}
                style={styles.cell}
                disabled={!cell.current || isDisabled}
                onPress={() => {
                  if (!dateKey || isDisabled) return;
                  onSelect?.(dateKey);
                  onClose?.();
                }}
              >
                <View
                  style={[
                    styles.dayCircle,
                    !cell.current && styles.outsideCircle,
                    isDisabled && cell.current && styles.disabledCircle,
                    isSelected && styles.selectedCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.current && styles.outsideText,
                      isDisabled && cell.current && styles.disabledText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PrismColors.navy }]} />
            <Text style={styles.legendText}>
              {selectableMode === "sick" ? "Sick leave eligible day" : "Scheduled shift day"}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#cbd5e1" }]} />
            <Text style={styles.legendText}>No shift / unavailable</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
  },
  sheet: {
    position: "absolute",
    left: 18,
    right: 18,
    top: "18%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: PrismColors.navy,
  },
  loadingRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748b",
  },
  errorText: {
    fontSize: 12,
    color: "#b91c1c",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  weekHeader: {
    flexDirection: "row",
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 5,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  outsideCircle: {
    backgroundColor: "transparent",
  },
  disabledCircle: {
    backgroundColor: "#f1f5f9",
    opacity: 0.35,
  },
  selectedCircle: {
    backgroundColor: PrismColors.navy,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "700",
    color: PrismColors.navy,
  },
  outsideText: {
    color: "#cbd5e1",
  },
  disabledText: {
    color: "#cbd5e1",
  },
  selectedText: {
    color: "#fff",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#64748b",
  },
});
