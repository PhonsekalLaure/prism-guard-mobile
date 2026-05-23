import BottomTabBar from "@/components/dashboard/Bottomtabbar";
import { PrismColors } from "@/constants/prismTheme";
import { useRouter, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_TAB_KEYS = ["home", "schedule", "payslip", "profile", "report"];

export default function ScreenWrapper({ children, activeTabKey = "home" }) {
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[1] || "home";
  const normalizedTab = currentTab === "index" ? "home" : currentTab;
  const activeTab = NAV_TAB_KEYS.includes(normalizedTab)
    ? normalizedTab
    : activeTabKey;

  const handleTabPress = (key) => {
    router.replace(`/(tabs)/${key === "home" ? "" : key}`);
  };

  const handleFabPress = () => {
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
