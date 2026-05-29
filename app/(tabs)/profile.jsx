// app/(tabs)/profile.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import LogoutModal from "@/components/profile/LogoutModal";
import MyDocuments from "@/components/profile/MyDocuments";
import PersonalDetails from "@/components/profile/PersonalDetails";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileToast from "@/components/profile/ProfileToast";
import { useProfile } from "@/hooks/useProfile";
import authService from "@/services/authService";

const NAVY = "#0d2550";

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

  const [showLogout, setShowLogout] = useState(false);
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
          rank={profile?.position || "SECURITY OFFICER"}
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
        <TouchableOpacity
          style={styles.btnLogout}
          onPress={() => setShowLogout(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.btnLogoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.4 (Build 220)</Text>
      </ScrollView>

      {/* ── Modals ── */}
      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          setShowLogout(false);
          await authService.logout();
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
});
