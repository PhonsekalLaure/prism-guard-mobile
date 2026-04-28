import BottomTabBar from "@/components/dashboard/Bottomtabbar";
import { PrismColors } from "@/constants/prismTheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenWrapper({ children, activeTabKey = "home" }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(activeTabKey);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === "home") router.replace("/(tabs)");
    if (tab === "schedule") router.replace("/(tabs)/schedule");
    if (tab === "payslip") router.replace("/(tabs)/payslip");
    if (tab === "profile") router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {children}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onFabPress={() => console.log("FAB pressed")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PrismColors.navy },
  screen: { flex: 1, backgroundColor: PrismColors.offWhite },
});
