// components/profile/LogoutModal.jsx
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NAVY = "#0d2550";

export default function LogoutModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            <Ionicons name="log-out-outline" size={32} color="#c62828" />
          </View>
          <Text style={styles.title}>Log Out?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to log out of your account?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onCancel}
            >
              <Text style={styles.btnCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.btnDangerText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 36,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffebee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: NAVY,
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },
  actions: { flexDirection: "row", gap: 12, width: "100%" },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  btnCancel: { backgroundColor: "#f0f0f0" },
  btnCancelText: { color: NAVY, fontWeight: "700", fontSize: 13 },
  btnDanger: { backgroundColor: "#c62828" },
  btnDangerText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
