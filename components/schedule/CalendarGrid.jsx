import { PrismColors } from "@/constants/prismTheme";
import { getDateKey } from "@/utils/scheduleDates";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TODAY_COLOR = "#2d9cdb";

export default function CalendarGrid({
  month = 1,
  year = 2026,
  selectedDay,
  scheduledDates = [],
  lateDates = [],
  absentDates = [],
  onDayPress,
}) {
  const scheduledSet = new Set(scheduledDates);
  const lateSet = new Set(lateDates);
  const absentSet = new Set(absentDates);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === month && today.getFullYear() === year;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  while (cells.length % 7 !== 0)
    cells.push({
      day: cells.length - daysInMonth - firstDay + 1,
      current: false,
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const isToday = cell.current && cell.day === todayDate;
          const isSelected = cell.current && cell.day === selectedDay;
          const dateKey = cell.current ? getDateKey(year, month, cell.day) : null;
          const isScheduled = cell.current && scheduledSet.has(dateKey);
          const isLate = cell.current && lateSet.has(dateKey);
          const isAbsent = cell.current && absentSet.has(dateKey);
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              onPress={() => cell.current && onDayPress?.(cell.day, dateKey)}
            >
              <View
                style={[
                  styles.dayCircle,
                  isLate && styles.lateCircle,
                  isAbsent && styles.absentCircle,
                  isToday && styles.todayCircle,
                  isSelected && styles.selectedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !cell.current && styles.dimText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
              <View style={styles.markerRow}>
                {isScheduled && (
                  <View style={[styles.dot, styles.scheduledDot, isToday && styles.dotToday]} />
                )}
                {isLate && <View style={[styles.dot, styles.lateDot]} />}
                {isAbsent && <View style={[styles.dot, styles.absentDot]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: PrismColors.navy }]}
          />
          <Text style={styles.legendText}>Scheduled Shift</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: TODAY_COLOR }]}
          />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.lateDot]} />
          <Text style={styles.legendText}>Late</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.absentDot]} />
          <Text style={styles.legendText}>Absent</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: "row", marginBottom: 8 },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    alignItems: "center",
    marginBottom: 6,
    minHeight: 40,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  lateCircle: { borderColor: "#f39c12" },
  absentCircle: { borderColor: "#e74c3c" },
  todayCircle: { backgroundColor: TODAY_COLOR },
  selectedCircle: { backgroundColor: PrismColors.navy },
  dayText: { fontSize: 13, color: PrismColors.navy, fontWeight: "500" },
  dimText: { color: "#ccc" },
  todayText: { color: "#fff", fontWeight: "700" },
  selectedText: { color: PrismColors.white, fontWeight: "700" },
  markerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
    height: 7,
    marginTop: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scheduledDot: { backgroundColor: PrismColors.navy },
  lateDot: { backgroundColor: "#f39c12" },
  absentDot: { backgroundColor: "#e74c3c" },
  dotToday: { backgroundColor: TODAY_COLOR },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#666" },
});
