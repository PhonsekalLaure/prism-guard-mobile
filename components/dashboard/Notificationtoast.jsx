// components/dashboard/NotificationToast.jsx
import { Ionicons } from "@expo/vector-icons";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const TYPE_CONFIG = {
  success: {
    color: PrismColors.success,
    icon: "checkmark-circle-outline",
  },
  error: {
    color: PrismColors.danger,
    icon: "alert-circle-outline",
  },
  warning: {
    color: PrismColors.warning,
    icon: "warning-outline",
  },
};

const normalizeIconName = (icon, type) => {
  if (!icon || icon === "!" || icon.length <= 2) {
    return TYPE_CONFIG[type]?.icon || TYPE_CONFIG.success.icon;
  }

  return icon;
};

const NotificationToast = ({
  visible = false,
  icon,
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
  }, [opacity, translateY, visible]);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.success;
  const accentColor = config.color;
  const iconName = normalizeIconName(icon, type);

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY }], opacity }]}
      pointerEvents="none"
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={[styles.iconBox, { backgroundColor: accentColor + "22" }]}>
        <Ionicons name={iconName} size={22} color={accentColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 56,
    left: PrismSpacing.base,
    right: PrismSpacing.base,
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.md,
    gap: PrismSpacing.md,
    zIndex: 1000,
    overflow: "hidden",
    ...PrismShadows.card,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: PrismRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  message: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
});

export default NotificationToast;
