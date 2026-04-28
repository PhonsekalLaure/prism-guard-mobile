// app/login.tsx
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { useRouter } from "expo-router";
import { useState } from "react";
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

// ── Forgot Password Modal ─────────────────────────────────────────────────────
const ForgotPasswordModal = ({ visible, onClose }) => {
  const [email, setEmail] = useState("");

  const handleSend = () => {
    onClose();
    setEmail("");
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.modalIcon}>🔓</Text>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <Text style={styles.modalText}>
            Enter your Employee ID or Registered Email. We will send you a reset
            link.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="Email / ID"
              placeholderTextColor={PrismColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSend}>
            <Text style={styles.primaryBtnText}>SEND LINK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Login Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = () => {
    // TODO: connect to your API
    console.log("Login:", email, password);

    router.replace("/(tabs)");
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
        {/* Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>PRISM-Guard</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Value"
              placeholderTextColor={PrismColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Value"
              placeholderTextColor={PrismColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁" : "🙈"}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => setShowForgot(true)}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 PRISM-GUARD System</Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PrismColors.navy,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PrismSpacing.xl,
    paddingVertical: PrismSpacing.xxl,
  },

  // Brand
  brandSection: {
    alignItems: "center",
    marginBottom: PrismSpacing.xxl,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PrismSpacing.md,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appTitle: {
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.white,
    letterSpacing: 2,
    marginTop: PrismSpacing.sm,
  },

  // Card
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
  passwordInput: {
    paddingRight: PrismSpacing.xl,
  },
  eyeBtn: {
    padding: PrismSpacing.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Buttons
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
  forgotBtn: {
    alignItems: "center",
    marginTop: PrismSpacing.md,
  },
  forgotText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.navy,
    fontWeight: PrismTypography.medium,
    textDecorationLine: "underline",
  },

  // Footer
  footer: {
    marginTop: PrismSpacing.xl,
    fontSize: PrismTypography.xs,
    color: PrismColors.textLight,
    textAlign: "center",
  },

  // Modal
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
  closeBtnText: {
    fontSize: 18,
    color: PrismColors.textSecondary,
  },
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
