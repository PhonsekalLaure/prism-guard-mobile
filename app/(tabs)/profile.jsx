// app/(tabs)/profile.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import PasswordModal from "@/components/profile/PasswordModal";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileToast from "@/components/profile/ProfileToast";
import SecurityAccount from "@/components/profile/SecurityAccount";
import { useProfile } from "@/hooks/useProfile";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { PrismColors } from "@/constants/prismTheme";
import authService from "@/services/authService";

const NAVY = PrismColors.navy;

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
  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState("request");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
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
      setEmailCode("");
      setEmailStep("request");
      setEmailError("");
      setEmailStatus("");
    }
  }, [showEmailModal, email]);

  const logoutToLogin = async () => {
    await authService.logout();
    await refreshAccess();
    router.replace("/login");
  };

  const handleRequestEmailChange = async () => {
    const trimmedEmail = String(newEmail || "").trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setEmailError("");
      setEmailStatus("");
      setEmailLoading(true);
      const result = await authService.changeEmail(trimmedEmail);
      if (result.alreadyConfirmed) {
        setShowEmailModal(false);
        showToast(
          "mail",
          "Email unchanged",
          result.message || "Email address is already confirmed.",
        );
        return;
      }

      setEmailStep("confirm");
      setEmailStatus(
        result.message || "Enter the code sent to your new email address.",
      );
    } catch (err) {
      setEmailError(err?.message || "Could not request email change.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!emailCode.trim()) {
      setEmailError("Please enter the confirmation code.");
      return;
    }

    try {
      setEmailError("");
      setEmailStatus("");
      setEmailLoading(true);
      await authService.confirmEmailChange(emailCode.trim());
      setShowEmailModal(false);
      await logoutToLogin();
    } catch (err) {
      setEmailError(err?.message || "Could not confirm email change.");
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
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
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
          saving={profileSaving}
          onEditModeChange={setEditMode}
          onSave={async (data) => {
            setProfileSaving(true);
            try {
              const result = await authService.updateProfile(data);
              if (result.profile) {
                setProfile(result.profile);
              }
              showToast(
                "checkmark-circle",
                "Changes Saved",
                "Your profile has been updated."
              );
            } finally {
              setProfileSaving(false);
            }
          }}
          onSaveError={(err) => {
            showToast(
              "alert-circle",
              "Update Failed",
              err?.message || "Couldn't save profile changes. Try again."
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
              {emailStep === "request"
                ? "Enter your new email address. We'll send a confirmation code there."
                : "Enter the confirmation code sent to your new email address. After confirmation, you'll be logged out."}
            </Text>
            {emailStep === "request" ? (
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
            ) : (
              <>
                <Text style={styles.pendingEmailText}>{newEmail}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmation code"
                  placeholderTextColor="#999"
                  value={emailCode}
                  onChangeText={setEmailCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            )}
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            {emailStatus ? <Text style={styles.successText}>{emailStatus}</Text> : null}
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
                onPress={
                  emailStep === "request"
                    ? handleRequestEmailChange
                    : handleConfirmEmailChange
                }
                disabled={emailLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {emailLoading
                    ? "Please wait..."
                    : emailStep === "request"
                      ? "Send Code"
                      : "Confirm Email"}
                </Text>
              </TouchableOpacity>
            </View>
            {emailStep === "confirm" ? (
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleRequestEmailChange}
                disabled={emailLoading}
              >
                <Text style={styles.resendText}>Resend code</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      <PasswordModal
        visible={showPassModal}
        onClose={() => setShowPassModal(false)}
        onSave={async ({ currentPassword, newPassword, confirmPassword }) => {
          await authService.changePassword(currentPassword, newPassword, confirmPassword);
          showToast(
            "checkmark-circle",
            "Password Updated",
            "Please log in again with your new password.",
          );
          await logoutToLogin();
        }}
      />

      {/* ── Modals ── */}
      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          setShowLogout(false);
          await logoutToLogin();
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
  headerSpacer: {
    width: 36,
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
  pendingEmailText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
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
