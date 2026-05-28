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

const TimeInButton = ({ isOnDuty = false, onPress, disabled = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOnDuty && !disabled) {
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
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }

    pulseAnim.setValue(1);
    pulseOpacity.setValue(disabled ? 0.25 : 0);
  }, [disabled, isOnDuty, pulseAnim, pulseOpacity]);

  const animatePress = (toValue) => {
    Animated.spring(pressScale, {
      toValue,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
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
            isOnDuty && styles.buttonActive,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={() => animatePress(0.92)}
          onPressOut={() => animatePress(1)}
          activeOpacity={0.85}
          disabled={disabled}
        >
          {disabled ? (
            <ActivityIndicator
              size="small"
              color={isOnDuty ? PrismColors.navy : PrismColors.gold}
            />
          ) : (
            <Text style={[styles.buttonIcon, isOnDuty && styles.buttonIconActive]}>
              {isOnDuty ? "STOP" : "GO"}
            </Text>
          )}

          <Text style={[styles.buttonLabel, isOnDuty && styles.buttonLabelActive]}>
            {disabled ? "CHECKING" : isOnDuty ? "TIME OUT" : "TIME IN"}
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
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PrismColors.goldDim,
    borderWidth: 2,
    borderColor: PrismColors.gold,
  },
  pulseRingChecking: {
    borderWidth: 4,
  },
  button: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PrismColors.navy,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...PrismShadows.button,
    borderWidth: 3,
    borderColor: PrismColors.navyLight,
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
  buttonIcon: {
    fontSize: 20,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.gold,
  },
  buttonIconActive: {
    color: PrismColors.navy,
  },
  buttonLabel: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.gold,
    letterSpacing: 1.5,
  },
  buttonLabelActive: {
    color: PrismColors.navy,
  },
});

export default TimeInButton;
