// components/profile/SecurityAccount.jsx
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NAVY = "#0d2550";

function SecurityRow({ icon, label, sub, right, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.secRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.secLeft}>
        <FontAwesome5 name={icon} size={15} color={NAVY} solid />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.secLabel}>{label}</Text>
          {sub ? <Text style={styles.secSub}>{sub}</Text> : null}
        </View>
      </View>
      {right}
    </Wrapper>
  );
}

export default function SecurityAccount({ onChangePassword, onChangeEmail, currentEmail }) {
  return (
    <View style={styles.card}>
      <Text style={styles.titleText}>Security & Account</Text>

      <SecurityRow
        icon="lock"
        label="Change Password"
        onPress={onChangePassword}
        right={<Ionicons name="chevron-forward" size={14} color="#ccc" />}
      />

      <View style={styles.divider} />

      <SecurityRow
        icon="mail-bulk"
        label="Change Email"
        sub={currentEmail || "No email on file"}
        onPress={onChangeEmail}
        right={<Ionicons name="chevron-forward" size={14} color="#ccc" />}
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
  titleText: {
    fontSize: 13,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  secLeft: { flexDirection: "row", alignItems: "center" },
  secLabel: { fontSize: 13, color: NAVY, fontWeight: "500" },
  secSub: { fontSize: 10, color: "#999", marginTop: 1 },
  divider: { height: 1, backgroundColor: "#f0f0f0" },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  activeBadgeText: { fontSize: 10, fontWeight: "600", color: "#2e7d32" },
});
