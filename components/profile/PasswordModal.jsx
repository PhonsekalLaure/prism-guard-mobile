// components/profile/PasswordModal.jsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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
import {
  PASSWORD_REQUIREMENTS,
  PASSWORD_POLICY_MESSAGE,
} from "@/utils/passwordPolicy";

const NAVY = "#0d2550";
const GOLD = "#c9a84c";

function RuleItem({ met, label }) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={13}
        color={met ? "#2e7d32" : "#aaa"}
      />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
}

export default function PasswordModal({ visible, onClose, onSave }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(newPass),
  }));
  const allValid = rules.every((rule) => rule.met);
  const canSubmit = allValid && newPass === confirm && current !== "";

  const resetFields = () => {
    setCurrent("");
    setNewPass("");
    setConfirm("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError("");
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!current || !newPass || !confirm) {
      setError("All password fields are required.");
      return;
    }
    if (newPass !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (!allValid) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSave?.({
        currentPassword: current,
        newPassword: newPass,
        confirmPassword: confirm,
      });
      resetFields();
      onClose();
    } catch (err) {
      setError(err?.message || "Unable to update password. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              <View style={styles.bar} />
              <Text style={styles.title}>Change Password</Text>

              {/* Current password */}
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor="#bbb"
                  value={current}
                  onChangeText={setCurrent}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showCurrent ? "eye" : "eye-off"}
                    size={18}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* New password */}
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password"
                  placeholderTextColor="#bbb"
                  value={newPass}
                  onChangeText={setNewPass}
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showNew ? "eye" : "eye-off"}
                    size={18}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* Strength rules */}
              <View style={styles.strengthBox}>
                {rules.map((rule) => (
                  <RuleItem key={rule.key} met={rule.met} label={rule.label} />
                ))}
              </View>

              {/* Confirm password */}
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirm}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#bbb"
                  value={confirm}
                  onChangeText={setConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirm ? "eye" : "eye-off"}
                    size={18}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btnUpdate, (!canSubmit || loading) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
              >
                <Text style={styles.btnUpdateText}>
                  {loading ? "UPDATING..." : "UPDATE PASSWORD"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 36,
  },
  bar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: NAVY,
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: NAVY,
  },
  eyeBtn: { position: "absolute", right: 12 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  strengthBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  ruleText: { fontSize: 12, color: "#aaa" },
  ruleTextMet: { color: "#2e7d32" },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 10,
  },
  btnUpdate: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnUpdateText: {
    color: GOLD,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontSize: 13,
  },
});
