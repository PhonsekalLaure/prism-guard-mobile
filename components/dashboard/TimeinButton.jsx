// components/dashboard/TimeInButton.jsx
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TimeInButton = ({
  isOnDuty = false,
  onPress,
  disabled = false,
  compact = false,
  noShiftToday = false,
  clockInLocked = false,
  clockInWindowClosed = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const isUnavailable = noShiftToday || clockInLocked || clockInWindowClosed;

  useEffect(() => {
    if (disabled) {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.25);
      return undefined;
    }

    const baseOpacity = isUnavailable ? 0.45 : 0.6;
    pulseAnim.setValue(1);
    pulseOpacity.setValue(baseOpacity);

    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.55,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: baseOpacity,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [disabled, isUnavailable, pulseAnim, pulseOpacity]);

  const animatePress = (toValue) => {
    Animated.spring(pressScale, {
      toValue,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Animated.View
        style={[
          styles.pulseRing,
          compact && styles.pulseRingCompact,
          isOnDuty && styles.pulseRingActive,
          isUnavailable && styles.pulseRingNoShift,
          disabled && styles.pulseRingChecking,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseOpacity,
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            compact && styles.buttonCompact,
            isOnDuty && styles.buttonActive,
            isUnavailable && styles.buttonNoShift,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={() => animatePress(0.92)}
          onPressOut={() => animatePress(1)}
          activeOpacity={0.85}
          disabled={disabled}
        >
          {isUnavailable ? (
            <Text
              style={[
                styles.buttonIcon,
                compact && styles.buttonIconCompact,
                styles.buttonIconNoShift,
              ]}
            >
              {clockInWindowClosed ? "END" : "LOCK"}
            </Text>
          ) : disabled ? (
            <ActivityIndicator
              size="small"
              color={isOnDuty ? PrismColors.navy : PrismColors.gold}
            />
          ) : (
            <Text
              style={[
                styles.buttonIcon,
                compact && styles.buttonIconCompact,
                isOnDuty && styles.buttonIconActive,
              ]}
            >
              {isOnDuty ? "STOP" : "GO"}
            </Text>
          )}

          <Text
            style={[
              styles.buttonLabel,
              compact && styles.buttonLabelCompact,
              isOnDuty && styles.buttonLabelActive,
              isUnavailable && styles.buttonLabelNoShift,
            ]}
          >
            {noShiftToday ? "NO SHIFT TODAY" : clockInWindowClosed ? "WINDOW CLOSED" : clockInLocked ? "OPENS SOON" : disabled ? "CHECKING" : isOnDuty ? "TIME OUT" : "TIME IN"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: PrismSpacing.xxl,
  },
  containerCompact: {
    marginVertical: 0,
  },
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PrismColors.goldDim,
    borderWidth: 2,
    borderColor: PrismColors.gold,
  },
  pulseRingCompact: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(125, 211, 252, 0.22)",
    borderColor: "#7DD3FC",
  },
  pulseRingActive: {
    backgroundColor: "rgba(230, 178, 21, 0.22)",
    borderColor: PrismColors.goldLight,
  },
  pulseRingNoShift: {
    backgroundColor: "rgba(220, 38, 38, 0.18)",
    borderColor: "#DC2626",
  },
  pulseRingChecking: {
    borderWidth: 4,
  },
  button: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PrismColors.navy,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    ...PrismShadows.button,
    borderWidth: 3,
    borderColor: PrismColors.navyLight,
  },
  buttonCompact: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#BAE6FD",
    borderColor: "#7DD3FC",
    borderWidth: 2,
  },
  buttonActive: {
    backgroundColor: PrismColors.gold,
    borderColor: PrismColors.goldLight,
    shadowColor: PrismColors.gold,
  },
  buttonDisabled: {
    opacity: 0.82,
    borderWidth: 5,
  },
  buttonNoShift: {
    backgroundColor: "#DC2626",
    borderColor: "#991B1B",
    opacity: 0.85,
  },
  buttonIcon: {
    fontSize: 20,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.gold,
  },
  buttonIconNoShift: {
    color: "#F8FAFB",
    marginBottom: 6,
  },
  buttonLabelNoShift: {
    color: "#F8FAFB",
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  buttonIconCompact: {
    fontSize: 15,
    color: PrismColors.navy,
  },
  buttonIconActive: {
    color: PrismColors.navy,
  },
  buttonLabel: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.gold,
    letterSpacing: 1.5,
    textAlign: "center",
    lineHeight: 16,
  },
  buttonLabelCompact: {
    fontSize: 10,
    color: PrismColors.navy,
    letterSpacing: 0.8,
    textAlign: "center",
    lineHeight: 14,
  },
  buttonLabelActive: {
    color: PrismColors.navy,
  },
});

export default TimeInButton;
