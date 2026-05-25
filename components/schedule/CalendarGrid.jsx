import { PrismColors } from "@/constants/prismTheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarGrid({
  month = 1,
  year = 2026,
  selectedDay,
  scheduledDates = [],
  onDayPress,
}) {
  const scheduledSet = new Set(scheduledDates);
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
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              onPress={() => cell.current && onDayPress?.(cell.day, dateKey)}
            >
              <View
                style={[
                  styles.dayCircle,
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
              {isScheduled && (
                <View style={[styles.dot, isToday && styles.dotToday]} />
              )}
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
            style={[styles.legendDot, { backgroundColor: PrismColors.gold }]}
          />
          <Text style={styles.legendText}>Today</Text>
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
  cell: { width: "14.28%", alignItems: "center", marginBottom: 6 },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: { backgroundColor: PrismColors.gold },
  selectedCircle: { backgroundColor: PrismColors.navy },
  dayText: { fontSize: 13, color: PrismColors.navy, fontWeight: "500" },
  dimText: { color: "#ccc" },
  todayText: { color: "#fff", fontWeight: "700" },
  selectedText: { color: PrismColors.white, fontWeight: "700" },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PrismColors.navy,
    marginTop: 1,
  },
  dotToday: { backgroundColor: PrismColors.gold },
  legend: { flexDirection: "row", gap: 16, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#666" },
});
