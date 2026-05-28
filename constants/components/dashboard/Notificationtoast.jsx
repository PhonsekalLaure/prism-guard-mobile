// components/dashboard/NotificationToast.jsx
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const NotificationToast = ({
  visible = false,
  icon = "📍",
  title = "Notification",
  message = "",
  type = "success",
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const accentColor =
    type === "success"
      ? PrismColors.success
      : type === "error"
        ? PrismColors.danger
        : PrismColors.warning;

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY }], opacity }]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: accentColor + "22", borderColor: accentColor },
        ]}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 56,
    left: PrismSpacing.base,
    right: PrismSpacing.base,
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.md,
    gap: PrismSpacing.md,
    zIndex: 1000,
    overflow: "hidden",
    ...PrismShadows.card,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: PrismRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  message: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    marginTop: 2,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: PrismRadius.lg,
    borderBottomLeftRadius: PrismRadius.lg,
  },
});

export default NotificationToast;
