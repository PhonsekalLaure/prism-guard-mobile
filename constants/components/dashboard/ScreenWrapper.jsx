import BottomTabBar from "@/components/dashboard/Bottomtabbar";
import { PrismColors } from "@/constants/prismTheme";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { useFocusEffect, useRouter, useSegments } from "expo-router";
import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_TAB_KEYS = ["home", "schedule", "payslip", "profile", "report"];

export default function ScreenWrapper({ children, activeTabKey = "home" }) {
  const router = useRouter();
  const segments = useSegments();
  const {
    deployment,
    deploymentLoading,
    profileLoading,
    refreshAccess,
  } = useActiveDeploymentAccess();
  const currentTab = segments[1] || "home";
  const normalizedTab = currentTab === "index" ? "home" : currentTab;
  const activeTab = NAV_TAB_KEYS.includes(normalizedTab)
    ? normalizedTab
    : activeTabKey;
  const accessLoaded = !profileLoading && !deploymentLoading;
  const canAccessDeploymentTabs = accessLoaded && Boolean(deployment);
  const guardedTabs = ["schedule", "earnings", "payslip"];
  const canAccessReport = canAccessDeploymentTabs;

  useFocusEffect(
    useCallback(() => {
      refreshAccess();
    }, [refreshAccess]),
  );

  const handleTabPress = (key) => {
    if (guardedTabs.includes(key)) {
      if (profileLoading || deploymentLoading) {
        Alert.alert("Checking Access", "Please try again in a moment.");
        return;
      }

      if (!canAccessDeploymentTabs) {
        Alert.alert("No Access", "You have no access to this right now.");
        return;
      }
    }

    router.replace(`/(tabs)/${key === "home" ? "" : key}`);
  };

  const handleFabPress = () => {
    if (profileLoading || deploymentLoading) {
      Alert.alert("Checking Access", "Please try again in a moment.");
      return;
    }

    if (!canAccessReport) {
      Alert.alert("No Access", "You have no access to this right now.");
      return;
    }

    router.push("/(tabs)/report");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>{children}</View>
      <BottomTabBar
        activeTab={activeTab}
        isFabActive={activeTab === "report"}
        onTabPress={handleTabPress}
        onFabPress={handleFabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PrismColors.navy },
  screen: { flex: 1, backgroundColor: PrismColors.offWhite },
});
