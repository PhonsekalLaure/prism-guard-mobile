// components/dashboard/DashboardHeader.jsx
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  StatusBar,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DashboardHeader = ({
  officerName = "Officer",
  dateString = "",
  hasNotification = true,
  onBellPress,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PrismColors.navy} />

      <View style={styles.topRow}>
        <View style={styles.logoArea}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Logo.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.appName}>PRISM-Guard</Text>
        </View>

        <TouchableOpacity
          style={styles.bellWrapper}
          onPress={onBellPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {hasNotification && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

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
  // larger, fixed logo size to match header title visually
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: PrismSpacing.md,
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
