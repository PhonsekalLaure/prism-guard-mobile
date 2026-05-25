// components/profile/PasswordModal.jsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

  const rules = {
    length: newPass.length >= 8,
    upper: /[A-Z]/.test(newPass) && /[a-z]/.test(newPass),
    num: /[0-9]/.test(newPass),
    symbol: /[!@#$%^&*]/.test(newPass),
  };
  const allValid = Object.values(rules).every(Boolean);
  const canSubmit = allValid && newPass === confirm && current !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave && onSave({ current, newPass });
    // Reset fields
    setCurrent("");
    setNewPass("");
    setConfirm("");
    onClose();
  };

  const handleClose = () => {
    setCurrent("");
    setNewPass("");
    setConfirm("");
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
        <View style={styles.sheet}>
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
            <RuleItem met={rules.length} label="Min. 8 Characters" />
            <RuleItem met={rules.upper} label="Uppercase & Lowercase" />
            <RuleItem met={rules.num} label="Number (0-9)" />
            <RuleItem met={rules.symbol} label="Symbol (!@#$)" />
          </View>

          {/* Confirm password */}
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor="#bbb"
            value={confirm}
            onChangeText={setConfirm}
          />

          <TouchableOpacity
            style={[styles.btnUpdate, !canSubmit && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.btnUpdateText}>UPDATE PASSWORD</Text>
          </TouchableOpacity>
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
