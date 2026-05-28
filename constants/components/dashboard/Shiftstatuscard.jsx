// components/dashboard/ShiftStatusCard.jsx
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ShiftStatusCard = ({ shiftStart, shiftEnd, location, isOnDuty }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.badge,
            isOnDuty ? styles.badgeActive : styles.badgeInactive,
          ]}
        >
          <Text style={styles.badgeText}>
            {isOnDuty ? "ON DUTY" : "OFF DUTY"}
          </Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Shift Start</Text>
          <Text style={styles.infoValue}>{shiftStart}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Shift End</Text>
          <Text style={styles.infoValue}>{shiftEnd}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {location}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    marginHorizontal: PrismSpacing.base,
    marginTop: PrismSpacing.base,
    marginBottom: PrismSpacing.md,
    padding: PrismSpacing.md,
    ...PrismShadows.card,
  },
  statusRow: {
    alignItems: "center",
    marginBottom: PrismSpacing.md,
  },
  badge: {
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.xs,
    borderRadius: PrismRadius.full,
  },
  badgeActive: {
    backgroundColor: PrismColors.success + "22",
    borderWidth: 1,
    borderColor: PrismColors.success,
  },
  badgeInactive: {
    backgroundColor: PrismColors.border,
    borderWidth: 1,
    borderColor: PrismColors.textSecondary,
  },
  badgeText: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: PrismColors.border,
  },
});

export default ShiftStatusCard;
