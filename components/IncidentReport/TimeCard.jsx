import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const formatDateTime = (date) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = dayNames[date.getDay()];
  const month = monthNames[date.getMonth()];
  const dateNum = date.getDate();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}, ${month} ${dateNum} | ${hours}:${minutes} ${ampm}`;
};

const TimeCard = () => {
  const [timeStr, setTimeStr] = useState(formatDateTime(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(formatDateTime(new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name="time-outline" size={22} color={PrismColors.navy} />
      </View>
      <View>
        <Text style={styles.label}>TIME OF INCIDENT</Text>
        <Text style={styles.value}>{timeStr}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: 15,
    padding: PrismSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderLeftWidth: 4,
    borderLeftColor: PrismColors.navy,
    marginBottom: PrismSpacing.md,
    ...PrismShadows.card,
  },
  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(9, 50, 105, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
});

export default TimeCard;
