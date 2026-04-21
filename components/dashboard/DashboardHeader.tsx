// components/DashboardHeader.tsx
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
interface DashboardHeaderProps {
  officerName?: string;
  dateString?: string;
  hasNotification?: boolean;
  onBellPress?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  officerName = "Officer",
  dateString = "",
  hasNotification = true,
  onBellPress,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PrismColors.navy} />

      {/* Top Row: Logo + Bell */}
      <View style={styles.topRow}>
        <View style={styles.logoArea}>
          <View style={styles.shieldIcon}>
            <Text style={styles.shieldText}>⬡</Text>
          </View>
          <Text style={styles.appName}>PRISM-Guard</Text>
        </View>

        <TouchableOpacity
          style={styles.bellWrapper}
          onPress={onBellPress}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {hasNotification && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      {/* Officer Name + Date */}
      <View style={styles.welcomeArea}>
        <Text style={styles.officerName}>{officerName}</Text>
        <View style={styles.dateRow}>
          <Text style={styles.calendarIcon}>📅</Text>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PrismColors.navy,
    paddingTop: PrismSpacing.xl + 8,
    paddingHorizontal: PrismSpacing.base,
    paddingBottom: PrismSpacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...PrismShadows.header,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: PrismSpacing.base,
  },
  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
  },
  shieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PrismColors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldText: {
    fontSize: 18,
    color: PrismColors.navy,
  },
  appName: {
    fontSize: PrismTypography.md,
    fontWeight: PrismTypography.bold,
    color: PrismColors.gold,
    letterSpacing: 1.2,
  },
  bellWrapper: {
    position: "relative",
    padding: PrismSpacing.xs,
  },
  bellIcon: {
    fontSize: 22,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: PrismColors.gold,
    borderWidth: 1.5,
    borderColor: PrismColors.navy,
  },
  welcomeArea: {
    gap: PrismSpacing.xs,
  },
  officerName: {
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.white,
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.xs,
  },
  calendarIcon: {
    fontSize: 13,
  },
  dateText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textLight,
    fontWeight: PrismTypography.medium,
  },
});

export default DashboardHeader;
