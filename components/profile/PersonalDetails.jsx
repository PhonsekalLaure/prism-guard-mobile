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

function InfoRow({ icon, label, value, editable, onChangeText }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={NAVY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TextInput
          style={[styles.infoValue, editable && styles.infoValueEditable]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          selectTextOnFocus={editable}
        />
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
  onEditModeChange,
  onSave,
}) {
  const [email, setEmail] = useState(emailFromAuth);
  const [phone, setPhone] = useState(phoneFromProfile);
  const [address, setAddress] = useState(addressFromProfile);
  const [emergencyName, setEmergencyName] = useState(emergencyNameFromProfile);
  const [emergencyNum, setEmergencyNum] = useState(emergencyNumFromProfile);

  // Update state when props load in (async from AsyncStorage)
  useEffect(() => {
    if (emailFromAuth) setEmail(emailFromAuth);
  }, [emailFromAuth]);
  useEffect(() => {
    if (phoneFromProfile) setPhone(phoneFromProfile);
  }, [phoneFromProfile]);
  useEffect(() => {
    if (addressFromProfile) setAddress(addressFromProfile);
  }, [addressFromProfile]);
  useEffect(() => {
    if (emergencyNameFromProfile) setEmergencyName(emergencyNameFromProfile);
  }, [emergencyNameFromProfile]);
  useEffect(() => {
    if (emergencyNumFromProfile) setEmergencyNum(emergencyNumFromProfile);
  }, [emergencyNumFromProfile]);

  const handleToggle = () => {
    if (editMode && onSave) {
      onSave({ email, phone, address, emergencyName, emergencyNum });
    }
    onEditModeChange?.(!editMode);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>Personal Details</Text>
        <TouchableOpacity onPress={handleToggle}>
          <Ionicons
            name={editMode ? "save-outline" : "create-outline"}
            size={18}
            color={GOLD}
          />
        </TouchableOpacity>
      </View>

      <InfoRow
        icon="mail-outline"
        label="Email"
        value={email}
        editable={editMode}
        onChangeText={setEmail}
      />
      <InfoRow
        icon="call-outline"
        label="Mobile Number"
        value={phone}
        editable={editMode}
        onChangeText={setPhone}
      />
      <InfoRow
        icon="location-outline"
        label="Address"
        value={address}
        editable={editMode}
        onChangeText={setAddress}
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
        value={emergencyNum}
        editable={editMode}
        onChangeText={setEmergencyNum}
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
  infoLabel: { fontSize: 10, color: "#999", marginBottom: 2 },
  infoValue: { fontSize: 13, color: NAVY, fontWeight: "500", padding: 0 },
  infoValueEditable: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    color: "#333",
    paddingBottom: 2,
  },
});
