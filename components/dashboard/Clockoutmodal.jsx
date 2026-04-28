// components/dashboard/ClockOutModal.jsx
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ClockOutModal = ({ visible = false, onCancel, onConfirm }) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Text style={styles.modalIcon}>🚪</Text>
          </View>

          <Text style={styles.title}>End Shift?</Text>
          <Text style={styles.body}>
            Are you sure you want to clock out? This will end your current
            session.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: PrismColors.overlayDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PrismSpacing.xl,
  },
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.xl,
    padding: PrismSpacing.xl,
    width: "100%",
    alignItems: "center",
    ...PrismShadows.header,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PrismColors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PrismSpacing.base,
    borderWidth: 2,
    borderColor: PrismColors.border,
  },
  modalIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.textPrimary,
    marginBottom: PrismSpacing.sm,
  },
  body: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: PrismSpacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: PrismSpacing.md,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: PrismSpacing.md,
    borderRadius: PrismRadius.md,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: PrismColors.offWhite,
    borderWidth: 1,
    borderColor: PrismColors.border,
  },
  confirmBtn: {
    backgroundColor: PrismColors.navy,
    ...PrismShadows.button,
    shadowColor: PrismColors.navy,
  },
  cancelText: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textSecondary,
    letterSpacing: 0.5,
  },
  confirmText: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.gold,
    letterSpacing: 0.5,
  },
});

export default ClockOutModal;
