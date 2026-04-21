// components/TimeInButton.tsx
import {
    PrismColors,
    PrismShadows,
    PrismSpacing,
    PrismTypography,
} from "@/constants/prismTheme";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface TimeInButtonProps {
  isOnDuty?: boolean;
  onPress?: () => void;
}

const TimeInButton: React.FC<TimeInButtonProps> = ({
  isOnDuty = false,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isOnDuty) {
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
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [isOnDuty]);

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Main button */}
      <TouchableOpacity
        style={[styles.button, isOnDuty && styles.buttonActive]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.buttonIcon, isOnDuty && styles.buttonIconActive]}>
          {isOnDuty ? "⏻" : "◎"}
        </Text>
        <Text
          style={[styles.buttonLabel, isOnDuty && styles.buttonLabelActive]}
        >
          {isOnDuty ? "TIME OUT" : "TIME IN"}
        </Text>
      </TouchableOpacity>
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
  buttonIcon: {
    fontSize: 28,
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
