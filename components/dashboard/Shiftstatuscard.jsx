// components/dashboard/BottomTabBar.jsx
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TabItem = ({ icon, label, isActive, onPress }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {isActive && <View style={styles.activeIndicator} />}
    <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
      {icon}
    </Text>
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const BottomTabBar = ({ activeTab = "home", onTabPress, onFabPress }) => {
  const leftTabs = [
    { key: "home", icon: "⌂", label: "Home" },
    { key: "schedule", icon: "📅", label: "Schedule" },
  ];

  const rightTabs = [
    { key: "payslip", icon: "💵", label: "Payslip" },
    { key: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabGroup}>
        {leftTabs.map((tab) => (
          <TabItem
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress?.(tab.key)}
          />
        ))}
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={onFabPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>🎙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabGroup}>
        {rightTabs.map((tab) => (
          <TabItem
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress?.(tab.key)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70 + (Platform.OS === "ios" ? 16 : 0),
    backgroundColor: PrismColors.cardBg,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
    paddingHorizontal: PrismSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: PrismColors.border,
    ...PrismShadows.card,
  },
  tabGroup: {
    flex: 1,
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PrismSpacing.sm,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PrismColors.gold,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.45,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.medium,
  },
  tabLabelActive: {
    color: PrismColors.navy,
    fontWeight: PrismTypography.bold,
  },
  fabContainer: {
    width: 70,
    alignItems: "center",
    marginTop: -30,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PrismColors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: PrismColors.cardBg,
    ...PrismShadows.button,
  },
  fabIcon: {
    fontSize: 22,
  },
});

export default BottomTabBar;
