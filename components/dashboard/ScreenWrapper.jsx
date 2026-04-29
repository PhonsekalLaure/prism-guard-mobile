import BottomTabBar from "@/components/dashboard/Bottomtabbar";
import { PrismColors } from "@/constants/prismTheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenWrapper({ children, activeTabKey = "home" }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(activeTabKey);

  const handleTabPress = (key) => {
    setActiveTab(key);
    router.replace(`/(tabs)/${key === "home" ? "" : key}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>{children}</View>
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PrismColors.navy },
  screen: { flex: 1, backgroundColor: PrismColors.offWhite },
});
