// components/profile/ProfileToast.jsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { PrismColors } from "@/constants/prismTheme";

const NAVY = PrismColors.navy;
const GOLD = "#c9a84c";

export default function ProfileToast({ visible, icon, title, message }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, visible]);

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <View style={styles.toastIcon}>
        <Ionicons name={icon || "checkmark-circle"} size={22} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toastTitle}>{title}</Text>
        <Text style={styles.toastMsg}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 70,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  toastTitle: { color: NAVY, fontWeight: "700", fontSize: 13 },
  toastMsg: { color: "#6f7785", fontSize: 11, marginTop: 1 },
});
