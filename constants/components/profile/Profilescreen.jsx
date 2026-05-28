// app/(tabs)/profile.jsx  (or wherever you place it)
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ProfileCard     from "@/components/profile/ProfileCard";
import PersonalDetails from "@/components/profile/PersonalDetails";
import MyDocuments     from "@/components/profile/MyDocuments";
import SecurityAccount from "@/components/profile/SecurityAccount";
import PasswordModal   from "@/components/profile/PasswordModal";
import LogoutModal     from "@/components/profile/LogoutModal";
import ProfileToast    from "@/components/profile/ProfileToast";

const NAVY = "#0d2550";

export default function ProfileScreen({ navigation }) {
  const [showPassModal, setShowPassModal]   = useState(false);
  const [showLogout,    setShowLogout]      = useState(false);
  const [toast,         setToast]           = useState({
    visible: false, icon: "checkmark-circle", title: "", message: "",
  });

  const showToast = (icon, title, message) => {
    setToast({ visible: true, icon, title, message });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
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
          name="Juan Cruz"
          rank="SECURITY OFFICER I"
          employeeId="PRISM-2024-001"
          onEditAvatar={() => showToast("camera-outline", "Edit Photo", "Feature coming soon.")}
        />

        {/* ── Personal Details ── */}
        <PersonalDetails
          onSave={(data) => {
            console.log("Saved personal details:", data);
            showToast("checkmark-circle", "Changes Saved", "Your profile has been updated.");
          }}
        />

        {/* ── My Documents ── */}
        <MyDocuments
          onDocPress={(doc) =>
            showToast("document-outline", doc.name, doc.meta)
          }
        />

        {/* ── Security & Account ── */}
        <SecurityAccount onChangePassword={() => setShowPassModal(true)} />

        {/* ── Logout Button ── */}
        <TouchableOpacity style={styles.btnLogout} onPress={() => setShowLogout(true)}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.btnLogoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.4 (Build 220)</Text>
      </ScrollView>

      {/* ── Modals ── */}
      <PasswordModal
        visible={showPassModal}
        onClose={() => setShowPassModal(false)}
        onSave={() =>
          showToast("checkmark-circle", "Success", "Password updated successfully.")
        }
      />
      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          setShowLogout(false);
          // await authService.logout();
          navigation?.replace("Login");
        }}
      />

      {/* ── Toast (always on top) ── */}
      <ProfileToast {...toast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: {
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBack: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
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
  btnLogoutText: { color: "#fff", fontWeight: "700", letterSpacing: 1.5, fontSize: 14 },
  version: { textAlign: "center", color: "#aaa", fontSize: 10, marginBottom: 8 },
});