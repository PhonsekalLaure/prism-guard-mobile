import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "expo-router";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.type;
  const accessToken = params.access_token;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [success, setSuccess] = useState(false);

  const isRecoveryLink = type === "recovery" && accessToken;

  useEffect(() => {
    if (!isRecoveryLink) {
      setNotification(
        "The reset link is invalid or expired. Please request a new link from login.",
      );
    }
  }, [isRecoveryLink]);

  const handleSubmit = async () => {
    if (!isRecoveryLink) return;

    if (!newPassword || !confirmPassword) {
      setNotification("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setNotification("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setNotification("");

    try {
      const response = await fetch(`${BASE_URL}/api/mobile/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, password: newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setNotification(data.message || "Password updated. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 2800);
    } catch (err) {
      setNotification(err?.message || "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandSection}>
          <Text style={styles.appTitle}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a new password for your account.
          </Text>
        </View>

        <View style={styles.card}>
          {notification ? <Text style={styles.notificationText}>{notification}</Text> : null}

          {!success ? (
            <>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={PrismColors.textSecondary}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNew((value) => !value)}
                >
                  <Ionicons
                    name={showNew ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={PrismColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={PrismColors.textSecondary}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((value) => !value)}
                >
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={PrismColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading || !isRecoveryLink}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Updating..." : "Set New Password"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successBody}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Password updated</Text>
              <Text style={styles.successText}>
                Your password was reset successfully. Redirecting to login...
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.replace("/login")}
              >
                <Text style={styles.secondaryBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.secondaryLinkText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PrismColors.navy },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: PrismSpacing.xl,
    paddingTop: 56,
    paddingBottom: PrismSpacing.xxl,
  },
  brandSection: { alignItems: "center", marginBottom: PrismSpacing.md },
  appTitle: {
    fontSize: 28,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.white,
    marginBottom: PrismSpacing.sm,
  },
  subtitle: {
    fontSize: PrismTypography.sm,
    color: PrismColors.offWhite,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 22,
  },
  card: {
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.xl,
    padding: PrismSpacing.xl,
    width: "100%",
    ...PrismShadows.header,
  },
  notificationText: {
    textAlign: "center",
    color: PrismColors.textPrimary,
    marginBottom: PrismSpacing.md,
  },
  inputLabel: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.semiBold,
    color: PrismColors.textPrimary,
    marginBottom: PrismSpacing.xs,
    marginTop: PrismSpacing.sm,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PrismColors.border,
    borderRadius: PrismRadius.sm,
    paddingHorizontal: PrismSpacing.md,
    marginBottom: PrismSpacing.sm,
    backgroundColor: PrismColors.offWhite,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: PrismTypography.base,
    color: PrismColors.textPrimary,
  },
  eyeBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: PrismColors.gold,
    borderRadius: PrismRadius.md,
    paddingVertical: PrismSpacing.md,
    alignItems: "center",
    marginTop: PrismSpacing.md,
    ...PrismShadows.button,
  },
  primaryBtnText: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.white,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    marginTop: PrismSpacing.md,
    paddingVertical: PrismSpacing.md,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
  secondaryLink: {
    marginTop: PrismSpacing.md,
    alignItems: "center",
  },
  secondaryLinkText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.navy,
    textDecorationLine: "underline",
  },
  successBody: {
    alignItems: "center",
    paddingVertical: PrismSpacing.lg,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: PrismSpacing.md,
  },
  successTitle: {
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.navy,
    marginBottom: PrismSpacing.sm,
  },
  successText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});