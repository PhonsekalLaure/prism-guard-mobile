// components/ShiftStatusCard.tsx
import {
    PrismColors,
    PrismRadius,
    PrismShadows,
    PrismSpacing,
    PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ShiftStatusCardProps {
  shiftStart?: string;
  shiftEnd?: string;
  location?: string;
  isOnDuty?: boolean;
}

const ShiftStatusCard: React.FC<ShiftStatusCardProps> = ({
  shiftStart = "07:00",
  shiftEnd = "19:00",
  location = "",
  isOnDuty = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.label}>CURRENT SHIFT</Text>

        <View style={styles.timeRow}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={styles.shiftTime}>
            {shiftStart} - {shiftEnd}
          </Text>
        </View>

        {location ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : null}
      </View>

      <View
        style={[styles.badge, isOnDuty ? styles.badgeActive : styles.badgeOff]}
      >
        <Text
          style={[
            styles.badgeText,
            isOnDuty ? styles.badgeTextActive : styles.badgeTextOff,
          ]}
        >
          {isOnDuty ? "ON DUTY" : "OFF DUTY"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    paddingHorizontal: PrismSpacing.base,
    paddingVertical: PrismSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: PrismSpacing.base,
    marginTop: PrismSpacing.lg,
    ...PrismShadows.card,
  },
  info: {
    gap: 4,
    flex: 1,
  },
  label: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.semiBold,
    color: PrismColors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.xs,
  },
  clockIcon: {
    fontSize: 14,
  },
  shiftTime: {
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.medium,
  },
  badge: {
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.xs,
    borderRadius: PrismRadius.full,
  },
  badgeOff: {
    backgroundColor: PrismColors.offWhite,
    borderWidth: 1,
    borderColor: PrismColors.border,
  },
  badgeActive: {
    backgroundColor: PrismColors.goldDim,
    borderWidth: 1,
    borderColor: PrismColors.gold,
  },
  badgeText: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    letterSpacing: 0.8,
  },
  badgeTextOff: {
    color: PrismColors.textSecondary,
  },
  badgeTextActive: {
    color: PrismColors.gold,
  },
});

export default ShiftStatusCard;
