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

const ShiftStatusCard = ({
  shiftStart,
  shiftEnd,
  location,
  isOnDuty,
  hasDeployment = true,
  isCheckingDeployment = false,
  clockInTime = null,
  clockInStatus = null,
  dutyTimingLabel = null,
  hasRemainingTime = false,
}) => {
  const isLateClockIn = clockInStatus === "late";

  if (isCheckingDeployment) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyTitle}>Checking deployment</Text>
        <Text style={styles.emptyText}>
          Please wait while we confirm your assignment.
        </Text>
      </View>
    );
  }

  if (!hasDeployment) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyTitle}>No active deployment</Text>
        <Text style={styles.emptyText}>
          You are currently not assigned to a site.
        </Text>
      </View>
    );
  }

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
      {isOnDuty ? (
        <View
          style={[
            styles.dutySummary,
            hasRemainingTime ? styles.dutySummaryWarning : styles.dutySummaryReady,
          ]}
        >
          <View style={styles.dutySummaryItem}>
            <Text style={styles.dutySummaryLabel}>On duty since</Text>
            <Text style={styles.dutySummaryValue}>{clockInTime || shiftStart}</Text>
            {isLateClockIn ? (
              <Text style={styles.lateClockInText}>Late clock-in</Text>
            ) : null}
          </View>
          <View style={styles.dutySummaryDivider} />
          <View style={styles.dutySummaryItem}>
            <Text style={styles.dutySummaryLabel}>Time-out status</Text>
            <Text style={styles.dutySummaryValue}>
              {dutyTimingLabel || "Checking schedule"}
            </Text>
          </View>
        </View>
      ) : null}
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: PrismSpacing.xl,
  },
  emptyTitle: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
    marginBottom: PrismSpacing.xs,
  },
  emptyText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    textAlign: "center",
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
  dutySummary: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: PrismSpacing.md,
    borderRadius: PrismRadius.md,
    borderWidth: 1,
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.sm,
  },
  dutySummaryWarning: {
    backgroundColor: PrismColors.warning + "12",
    borderColor: PrismColors.warning + "55",
  },
  dutySummaryReady: {
    backgroundColor: PrismColors.success + "12",
    borderColor: PrismColors.success + "55",
  },
  dutySummaryItem: {
    flex: 1,
  },
  dutySummaryLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    marginBottom: 2,
  },
  dutySummaryValue: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  lateClockInText: {
    marginTop: 2,
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    color: PrismColors.danger,
  },
  dutySummaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: PrismColors.border,
    marginHorizontal: PrismSpacing.md,
  },
});

export default ShiftStatusCard;
