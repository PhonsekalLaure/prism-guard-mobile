// components/profile/PersonalDetails.jsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const NAVY = "#0d2550";
const GOLD = "#c9a84c";
const MOBILE_LOCAL_REGEX = /^9\d{9}$/;

function getLocalPhilippineMobile(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("63")) return digits.slice(2, 12);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

function formatPhilippineMobileDisplay(value = "") {
  const local = getLocalPhilippineMobile(value);
  return local ? "+63" + local : "";
}

function sanitizeLocalMobile(value = "") {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function validateLocalMobile(value, { required = false, label = "Mobile number" } = {}) {
  if (!value) return required ? label + " is required." : "";
  if (!MOBILE_LOCAL_REGEX.test(value)) {
    return label + " must be a 10-digit Philippine mobile number starting with 9.";
  }
  return "";
}

function InfoRow({
  icon,
  label,
  value,
  editable,
  onChangeText,
  keyboardType = "default",
  maxLength,
  prefix,
  hint,
  error,
}) {
  const input = (
    <TextInput
      style={[
        styles.infoValue,
        editable && styles.infoValueEditable,
        editable && prefix && styles.mobileTextInput,
      ]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      selectTextOnFocus={editable}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
  );

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={NAVY} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {editable && prefix ? (
          <View style={[styles.mobileInputWrap, error && styles.inputError]}>
            <Text style={styles.mobilePrefix}>{prefix}</Text>
            {input}
          </View>
        ) : input}
        {editable && hint ? <Text style={styles.infoHint}>{hint}</Text> : null}
        {editable && error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

export default function PersonalDetails({
  emailFromAuth = "",
  phoneFromProfile = "",
  addressFromProfile = "",
  emergencyNameFromProfile = "",
  emergencyNumFromProfile = "",
  editMode = false,
  saving = false,
  onEditModeChange,
  onSave,
  onSaveError,
}) {
  const [email, setEmail] = useState(emailFromAuth);
  const [phone, setPhone] = useState(getLocalPhilippineMobile(phoneFromProfile));
  const [address, setAddress] = useState(addressFromProfile);
  const [emergencyName, setEmergencyName] = useState(emergencyNameFromProfile);
  const [emergencyNum, setEmergencyNum] = useState(getLocalPhilippineMobile(emergencyNumFromProfile));
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setEmail(emailFromAuth || "");
  }, [emailFromAuth]);
  useEffect(() => {
    if (!editMode) setPhone(getLocalPhilippineMobile(phoneFromProfile));
  }, [phoneFromProfile, editMode]);
  useEffect(() => {
    if (!editMode) setAddress(addressFromProfile || "");
  }, [addressFromProfile, editMode]);
  useEffect(() => {
    if (!editMode) setEmergencyName(emergencyNameFromProfile || "");
  }, [emergencyNameFromProfile, editMode]);
  useEffect(() => {
    if (!editMode) setEmergencyNum(getLocalPhilippineMobile(emergencyNumFromProfile));
  }, [emergencyNumFromProfile, editMode]);

  const handlePhoneChange = (value) => {
    setPhone(sanitizeLocalMobile(value));
    setFieldErrors((current) => ({ ...current, phone: "" }));
  };

  const handleEmergencyNumberChange = (value) => {
    setEmergencyNum(sanitizeLocalMobile(value));
    setFieldErrors((current) => ({ ...current, emergencyNum: "" }));
  };

  const handleToggle = async () => {
    if (saving) return;

    if (!editMode) {
      setPhone(getLocalPhilippineMobile(phoneFromProfile));
      setEmergencyName(emergencyNameFromProfile || "");
      setEmergencyNum(getLocalPhilippineMobile(emergencyNumFromProfile));
      setFieldErrors({});
      onEditModeChange?.(true);
      return;
    }

    const nextErrors = {
      phone: validateLocalMobile(phone, { required: true, label: "Mobile number" }),
      emergencyNum: validateLocalMobile(emergencyNum, {
        required: false,
        label: "Emergency contact number",
      }),
    };
    setFieldErrors(nextErrors);

    if (nextErrors.phone || nextErrors.emergencyNum) return;

    if (onSave) {
      try {
        await onSave({
          phone: "+63" + phone,
          emergencyName,
          emergencyNum: emergencyNum ? "+63" + emergencyNum : "",
        });
      } catch (err) {
        onSaveError?.(err);
        return;
      }
    }
    setFieldErrors({});
    onEditModeChange?.(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>Personal Details</Text>
        <TouchableOpacity onPress={handleToggle} disabled={saving}>
          <Ionicons
            name={editMode ? "save-outline" : "create-outline"}
            size={18}
            color={saving ? "#aaa" : GOLD}
          />
        </TouchableOpacity>
      </View>

      <InfoRow
        icon="mail-outline"
        label="Email"
        value={email}
        editable={false}
        onChangeText={setEmail}
      />
      <InfoRow
        icon="location-outline"
        label="Address"
        value={address}
        editable={false}
        onChangeText={setAddress}
      />
      <InfoRow
        icon="call-outline"
        label="Mobile Number"
        value={editMode ? phone : formatPhilippineMobileDisplay(phoneFromProfile)}
        editable={editMode}
        onChangeText={handlePhoneChange}
        keyboardType="number-pad"
        maxLength={10}
        prefix="+63"
        hint="Enter 10 digits starting with 9."
        error={fieldErrors.phone}
      />
      <InfoRow
        icon="heart-outline"
        label="Emergency Contact Name"
        value={emergencyName}
        editable={editMode}
        onChangeText={setEmergencyName}
      />
      <InfoRow
        icon="call-outline"
        label="Emergency Contact Number"
        value={editMode ? emergencyNum : formatPhilippineMobileDisplay(emergencyNumFromProfile)}
        editable={editMode}
        onChangeText={handleEmergencyNumberChange}
        keyboardType="number-pad"
        maxLength={10}
        prefix="+63"
        hint="Optional. Enter 10 digits starting with 9."
        error={fieldErrors.emergencyNum}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleText: {
    fontSize: 13,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 10, color: "#999", marginBottom: 2 },
  infoValue: { fontSize: 13, color: NAVY, fontWeight: "500", padding: 0 },
  infoValueEditable: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    color: "#333",
    paddingBottom: 2,
  },
  mobileInputWrap: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  mobilePrefix: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  mobileTextInput: {
    flex: 1,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  inputError: {
    borderBottomColor: "#dc2626",
  },
  infoHint: {
    color: "#777",
    fontSize: 10,
    marginTop: 3,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 10,
    marginTop: 3,
  },
});
