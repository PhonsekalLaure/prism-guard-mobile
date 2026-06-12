// app/(tabs)/profile.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import LogoutModal from "@/components/profile/LogoutModal";
import MyDocuments from "@/components/profile/MyDocuments";
import PersonalDetails from "@/components/profile/PersonalDetails";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileToast from "@/components/profile/ProfileToast";
import SecurityAccount from "@/components/profile/SecurityAccount";
import { useProfile } from "@/hooks/useProfile";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { PrismColors } from "@/constants/prismTheme";
import {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
} from "@/utils/passwordPolicy";
import authService from "@/services/authService";

const NAVY = PrismColors.navy;

function PasswordResetModal({ visible, identifier, onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const resetState = () => {
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStatus("");
    setError("");
    setLoading(false);
    setCodeSent(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const sendCode = useCallback(async () => {
    const target = String(identifier || "").trim();
    if (!target) {
      setError("No email or employee ID found for this account.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatus("");
      const result = await authService.forgotPassword(target);
      setCodeSent(true);
      setStatus(
        result.message ||
          "If an account exists, a password reset code has been sent.",
      );
    } catch (err) {
      setError(err?.message || "Unable to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (visible && !codeSent && !loading) {
      sendCode();
    }
  }, [visible, codeSent, loading, sendCode]);

  const handleReset = async () => {
    const target = String(identifier || "").trim();
    if (!target || !code.trim() || !newPassword || !confirmPassword) {
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
      setLoading(true);
      setError("");
      setStatus("");
      const result = await authService.resetPasswordWithCode(
        target,
        code.trim(),
        newPassword,
      );
      onSuccess(result.message || "Password updated successfully.");
      handleClose();
    } catch (err) {
      setError(err?.message || "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <Text style={styles.modalText}>
            Enter the reset code sent to your registered email, then create a new password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Reset code"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <View style={styles.passwordInputRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="New password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNewPassword((value) => !value)}
            >
              <Ionicons
                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordInputRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword((value) => !value)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {status ? <Text style={styles.successText}>{status}</Text> : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Please wait..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={sendCode}
            disabled={loading}
          >
            <Text style={styles.resendText}>Resend code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    setProfile,          // ← make sure useProfile exposes this
    fullName,
    displayId,
    email,
    phone,
    address,
    emergencyName,
    emergencyNum,
  } = useProfile();
  const { refreshAccess } = useActiveDeploymentAccess();

  const [showLogout, setShowLogout] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    icon: "checkmark-circle",
    title: "",
    message: "",
  });

  const showToast = (icon, title, message) => {
    setToast({ visible: true, icon, title, message });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3200);
  };

  useEffect(() => {
    if (showEmailModal) {
      setNewEmail(email || "");
      setEmailError("");
    }
  }, [showEmailModal, email]);

  const handleRequestEmailChange = async () => {
    const trimmedEmail = String(newEmail || "").trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setEmailError("");
      setEmailLoading(true);
      const result = await authService.changeEmail(trimmedEmail);
      setShowEmailModal(false);
      showToast(
        "mail",
        "Email change requested",
        result.message || "Please confirm your new email address.",
      );
    } catch (err) {
      setEmailError(err?.message || "Could not request email change.");
    } finally {
      setEmailLoading(false);
    }
  };

 const onEditAvatar = async (uri) => {
  try {
    showToast('camera-outline', 'Uploading…', 'Updating your profile photo.');

    const { avatar_url } = await authService.updateAvatar(uri); // ← goes through your API

    setProfile((prev) => ({ ...prev, avatar_url }));
    showToast('checkmark-circle', 'Photo Updated', 'Your new photo is saved.');
  } catch (err) {
    console.error('Avatar upload failed:', err);
    showToast('alert-circle', 'Upload Failed', 'Couldn\'t save photo. Try again.');
  }
};

  return (
    <ScreenWrapper activeTabKey="profile">
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <ProfileCard
          name={fullName}
          rank={profile?.position || "SECURITY GUARD"}
          employeeId={displayId}
          avatarUri={profile?.avatar_url}
          editable={editMode}
          onEditAvatar={onEditAvatar}   // ← now passes the URI up from ProfileCard
        />

        {/* ── Personal Details ── */}
        <PersonalDetails
          emailFromAuth={email}
          phoneFromProfile={phone}
          addressFromProfile={address}
          emergencyNameFromProfile={emergencyName}
          emergencyNumFromProfile={emergencyNum}
          editMode={editMode}
          onEditModeChange={setEditMode}
          onSave={(data) => {
            console.log("Saved:", data);
            showToast(
              "checkmark-circle",
              "Changes Saved",
              "Your profile has been updated."
            );
          }}
        />

        {/* ── My Documents ── */}
        <MyDocuments
          onDocPress={(doc) =>
            showToast("document-outline", doc.name, doc.meta)
          }
        />

        {/* ── Logout ── */}
        <SecurityAccount
          currentEmail={email}
          onChangePassword={() => setShowPassModal(true)}
          onChangeEmail={() => setShowEmailModal(true)}
        />

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={() => setShowLogout(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.btnLogoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.4 (Build 220)</Text>
      </ScrollView>

      <Modal transparent visible={showEmailModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <Text style={styles.modalText}>
              Enter your new email address to request an email change. Your current email will remain active until you confirm the new one.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="New email address"
              placeholderTextColor="#999"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setShowEmailModal(false)}
                disabled={emailLoading}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, emailLoading && { opacity: 0.7 }]}
                onPress={handleRequestEmailChange}
                disabled={emailLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {emailLoading ? "Requesting..." : "Request Email Change"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PasswordResetModal
        visible={showPassModal}
        identifier={email || displayId}
        onClose={() => setShowPassModal(false)}
        onSuccess={(message) =>
          showToast(
            "checkmark-circle",
            "Password Updated",
            message || "Your password has been updated.",
          )
        }
      />

      {/* ── Modals ── */}
      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          setShowLogout(false);
          await authService.logout();
          await refreshAccess();
          router.replace("/login");
        }}
      />

      {/* ── Toast ── */}
      <ProfileToast {...toast} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scroll: { flex: 1, backgroundColor: "#f0f2f5" },
  scrollContent: { paddingBottom: 40 },
  btnLogout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#c62828",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  btnLogoutText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1.5,
    fontSize: 14,
  },
  version: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 10,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    color: "#444",
    lineHeight: 20,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#f2f3f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 10,
    color: "#c62828",
    fontSize: 13,
  },
  successText: {
    marginBottom: 10,
    color: "#0f8a3a",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  passwordInputRow: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 46,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 9,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f2f3f5",
  },
  secondaryBtnText: {
    color: "#333",
    fontWeight: "700",
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: NAVY,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  resendBtn: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
