import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import authService from "@/services/authService";
import {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
} from "@/utils/passwordPolicy";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ForgotPasswordModal = ({ visible, onClose }) => {
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState("request");

  const resetState = () => {
    setIdentifier("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStatus("");
    setError("");
    setSending(false);
    setStep("request");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSend = async () => {
    if (!identifier.trim()) {
      setError("Please enter your registered email or employee ID.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setStatus("");
      const result = await authService.forgotPassword(identifier.trim());
      setStep("verify");
      setStatus(
        result.message ||
          "If an account exists, a password reset code has been sent.",
      );
    } catch (err) {
      setError(err?.message || "Unable to send reset code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (!identifier.trim() || !code.trim() || !newPassword || !confirmPassword) {
      setError("Please enter your code and new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    try {
      setSending(true);
      setError("");
      setStatus("");
      const result = await authService.resetPasswordWithCode(
        identifier.trim(),
        code.trim(),
        newPassword,
      );
      setStatus(result.message || "Password updated successfully.");
      setTimeout(handleClose, 1800);
    } catch (err) {
      setError(err?.message || "Unable to reset password. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalIcon}>🔓</Text>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <Text style={styles.modalText}>
            Enter your Employee ID or Registered Email. We will send you a reset
            code.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="Email / ID"
              placeholderTextColor={PrismColors.textSecondary}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={step === "request"}
            />
          </View>
          {step === "verify" ? (
            <>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Reset code"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="New password"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={PrismColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm password"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color={PrismColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {status ? <Text style={styles.successText}>{status}</Text> : null}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              styles.modalPrimaryBtn,
              sending && { opacity: 0.7 },
            ]}
            onPress={step === "request" ? handleSend : handleReset}
            disabled={sending}
          >
            <Text style={styles.primaryBtnText}>
              {sending
                ? step === "request"
                  ? "Sending..."
                  : "Updating..."
                : step === "request"
                  ? "SEND CODE"
                  : "RESET PASSWORD"}
            </Text>
          </TouchableOpacity>
          {step === "verify" ? (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleSend}
              disabled={sending}
            >
              <Text style={styles.forgotText}>Resend code</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { refreshAccess } = useActiveDeploymentAccess();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [confirmSetupPin, setConfirmSetupPin] = useState("");
  const [rememberedProfile, setRememberedProfile] = useState(null);
  const [pinMode, setPinMode] = useState(false);
  const [pinLoading, setPinLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinSetupSaving, setPinSetupSaving] = useState(false);
  const [error, setError] = useState("");
  const [pinSetupError, setPinSetupError] = useState("");

  const navigateHome = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.replace("/(tabs)");
    }, 900);
  };

  useEffect(() => {
    let active = true;

    async function loadPinState() {
      try {
        const state = await authService.getPinLoginState();
        if (!active) return;
        setRememberedProfile(state.profile || null);
        setPinMode(state.enabled);
      } catch {
        if (!active) return;
        setRememberedProfile(null);
        setPinMode(false);
      } finally {
        if (active) setPinLoading(false);
      }
    }

    loadPinState();
    return () => {
      active = false;
    };
  }, []);

  const refreshBeforeHome = async () => {
    try {
      await refreshAccess();
    } catch (_err) {
      // ignore refresh errors here; protected screens will retry through their services
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await authService.login(email, password);
      await refreshBeforeHome();
      const pinState = await authService.getPinLoginState();
      setRememberedProfile(pinState.profile || null);
      if (!pinState.enabled) {
        setShowPinSetup(true);
        return;
      }
      navigateHome();
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinUnlock = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError("Enter your 4-digit PIN.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await authService.unlockWithPin(pin);
      await refreshBeforeHome();
      navigateHome();
    } catch (err) {
      setError(err?.message || "Could not unlock with PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseEmailInstead = () => {
    setPinMode(false);
    setPin("");
    setError("");
  };

  const handleForgetPin = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setPinMode(false);
      setRememberedProfile(null);
      setPin("");
      setError("PIN removed. Sign in with your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(setupPin)) {
      setPinSetupError("PIN must be exactly 4 digits.");
      return;
    }
    if (setupPin !== confirmSetupPin) {
      setPinSetupError("PINs do not match.");
      return;
    }

    try {
      setPinSetupSaving(true);
      setPinSetupError("");
      await authService.setPinLogin(setupPin);
      setShowPinSetup(false);
      setSetupPin("");
      setConfirmSetupPin("");
      navigateHome();
    } catch (err) {
      setPinSetupError(err?.message || "Could not save PIN.");
    } finally {
      setPinSetupSaving(false);
    }
  };

  const handleSkipPinSetup = async () => {
    await authService.clearPinLogin();
    setShowPinSetup(false);
    setSetupPin("");
    setConfirmSetupPin("");
    setPinSetupError("");
    navigateHome();
  };

  const rememberedName = [
    rememberedProfile?.first_name,
    rememberedProfile?.last_name,
  ].filter(Boolean).join(" ").trim();

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
          <Image
            source={require("@/assets/images/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>PRISM-Guard</Text>
        </View>

        <View style={styles.card}>
          {pinMode ? (
            <>
              <Text style={styles.pinTitle}>Enter Guard PIN</Text>
              {rememberedName ? (
                <Text style={styles.pinProfileText}>{rememberedName}</Text>
              ) : null}
              <Text style={styles.inputLabel}>PIN</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  placeholder="4-digit PIN"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={pin}
                  onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handlePinUnlock}
                disabled={loading || pinLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Unlocking..." : "Unlock"}
                </Text>
              </TouchableOpacity>

              <View style={styles.pinActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleUseEmailInstead}
                  disabled={loading}
                >
                  <Text style={styles.secondaryBtnText}>Use email instead</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleForgetPin}
                  disabled={loading}
                >
                  <Text style={styles.secondaryBtnText}>Forget PIN</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={PrismColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={PrismColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              {rememberedProfile ? (
                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => {
                    setPinMode(true);
                    setError("");
                  }}
                >
                  <Text style={styles.forgotText}>Use PIN instead</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => setShowForgot(true)}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.footer}>© 2026 PRISM-GUARD System</Text>
      </ScrollView>

      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalTitle}>Login Successful</Text>
            <Text style={styles.modalText}>Welcome back! Redirecting...</Text>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showPinSetup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>#</Text>
            <Text style={styles.modalTitle}>Set Guard PIN</Text>
            <Text style={styles.modalText}>
              Create a 4-digit PIN for faster sign in on this device.
            </Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.pinInput]}
                placeholder="New PIN"
                placeholderTextColor={PrismColors.textSecondary}
                value={setupPin}
                onChangeText={(value) => setSetupPin(value.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.pinInput]}
                placeholder="Confirm PIN"
                placeholderTextColor={PrismColors.textSecondary}
                value={confirmSetupPin}
                onChangeText={(value) => setConfirmSetupPin(value.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
            {pinSetupError ? <Text style={styles.errorText}>{pinSetupError}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryBtn, styles.modalPrimaryBtn, pinSetupSaving && { opacity: 0.7 }]}
              onPress={handleSavePin}
              disabled={pinSetupSaving}
            >
              <Text style={styles.primaryBtnText}>
                {pinSetupSaving ? "Saving..." : "SAVE PIN"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleSkipPinSetup}
              disabled={pinSetupSaving}
            >
              <Text style={styles.forgotText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ForgotPasswordModal
        visible={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor:  "#0a3d80" },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: PrismSpacing.xl,
    paddingTop: 56,
    paddingBottom: PrismSpacing.xxl,
  },
  brandSection: { alignItems: "center", marginBottom: PrismSpacing.md },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 0,
    transform: [{ scale: 1.16 }],
  },
  appTitle: {
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.white,
    letterSpacing: 2,
    marginTop: -PrismSpacing.xxl,
  },
  card: {
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.xl,
    padding: PrismSpacing.xl,
    width: "100%",
    ...PrismShadows.header,
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
  inputIcon: {
    fontSize: 16,
    marginRight: PrismSpacing.sm,
    color: PrismColors.textSecondary,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: PrismTypography.base,
    color: PrismColors.textPrimary,
  },
  passwordInput: { paddingRight: PrismSpacing.md },
  pinInput: { textAlign: "center", letterSpacing: 8, fontWeight: PrismTypography.bold },
  pinTitle: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.extraBold,
    textAlign: "center",
    marginBottom: PrismSpacing.xs,
  },
  pinProfileText: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    textAlign: "center",
    marginBottom: PrismSpacing.md,
  },
  pinActions: {
    flexDirection: "row",
    gap: PrismSpacing.sm,
    marginTop: PrismSpacing.md,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: PrismColors.border,
    borderRadius: PrismRadius.md,
    paddingVertical: PrismSpacing.sm,
    alignItems: "center",
    backgroundColor: PrismColors.offWhite,
  },
  secondaryBtnText: {
    color: PrismColors.navy,
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
  },
  eyeBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: { display: "none" },
  errorText: {
    color: "red",
    fontSize: PrismTypography.xs,
    marginBottom: PrismSpacing.sm,
    textAlign: "center",
  },
  successText: {
    color: "#0f8a3a",
    fontSize: PrismTypography.xs,
    marginBottom: PrismSpacing.sm,
    textAlign: "center",
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: PrismColors.gold,
    borderRadius: PrismRadius.md,
    paddingVertical: PrismSpacing.md,
    alignItems: "center",
    marginTop: PrismSpacing.md,
    ...PrismShadows.button,
  },
  modalPrimaryBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: PrismColors.goldLight,
  },
  primaryBtnText: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.white,
    letterSpacing: 0.5,
  },
  forgotBtn: { alignItems: "center", marginTop: PrismSpacing.md },
  forgotText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.navy,
    fontWeight: PrismTypography.medium,
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: PrismSpacing.xl,
    fontSize: PrismTypography.xs,
    color: PrismColors.textLight,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: PrismColors.overlayDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PrismSpacing.xl,
  },
  modalCard: {
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.xl,
    padding: PrismSpacing.xl,
    width: "100%",
    alignItems: "center",
    ...PrismShadows.header,
  },
  closeBtn: {
    position: "absolute",
    top: PrismSpacing.md,
    right: PrismSpacing.md,
    padding: PrismSpacing.xs,
  },
  closeBtnText: { fontSize: 18, color: PrismColors.textSecondary },
  modalIcon: {
    fontSize: 36,
    marginBottom: PrismSpacing.md,
    marginTop: PrismSpacing.sm,
  },
  modalTitle: {
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.textPrimary,
    marginBottom: PrismSpacing.sm,
  },
  modalText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: PrismSpacing.lg,
  },
});
