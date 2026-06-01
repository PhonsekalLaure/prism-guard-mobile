// components/dashboard/BottomTabBar.jsx
import { Feather } from "@expo/vector-icons";
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
    accessibilityState={{ selected: isActive }}
  >
    {isActive && <View style={styles.activeIndicator} />}
    <Feather
      name={icon}
      size={20}
      color={isActive ? PrismColors.navy : PrismColors.textSecondary}
      style={[styles.tabIcon, !isActive && styles.tabIconInactive]}
    />
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const BottomTabBar = ({
  activeTab = "home",
  isFabActive = false,
  onTabPress,
  onFabPress,
}) => {
  const leftTabs = [
    { key: "home", icon: "home", label: "Home" },
    { key: "schedule", icon: "calendar", label: "Schedule" },
  ];

  const rightTabs = [
    { key: "payslip", icon: "credit-card", label: "Payslip" },
    { key: "profile", icon: "user", label: "Profile" },
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
          style={[styles.fab, isFabActive && styles.fabActive]}
          onPress={onFabPress}
          activeOpacity={0.85}
        >
          <Feather
            name="file-text"
            size={19}
            color={isFabActive ? PrismColors.navy : "#FFFFFF"}
          />
          <Text style={[styles.fabLabel, isFabActive && styles.fabLabelActive]}>
            Report
          </Text>
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
    marginBottom: 2,
  },
  tabIconInactive: {
    opacity: 0.45,
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
    width: 80,
    alignItems: "center",
    marginTop: -24,
  },
  fab: {
    width: 72,
    height: 58,
    borderRadius: 18,
    backgroundColor: PrismColors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: PrismColors.cardBg,
    gap: 2,
    ...PrismShadows.button,
  },
  fabActive: {
    backgroundColor: PrismColors.gold,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: PrismTypography.bold,
  },
  fabLabelActive: {
    color: PrismColors.navy,
  },
});

export default BottomTabBar;
