// components/profile/ProfileCard.jsx
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NAVY = "#0d2550";
const GOLD = "#c9a84c";

export default function ProfileCard({
  name,
  rank,
  employeeId,
  avatarUri,
  onEditAvatar,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: avatarUri || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.cameraBtn} onPress={onEditAvatar}>
          <Ionicons name="camera" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.name}>{name || "Officer"}</Text>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank || "SECURITY GUARD"}</Text>
      </View>
      <Text style={styles.employeeId}>
        ID: {employeeId || "PRISM-2024-001"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: NAVY,
    marginBottom: 12,
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: GOLD,
    backgroundColor: "#1a3a6b",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: GOLD,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: NAVY,
  },
  name: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 6 },
  rankBadge: {
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 6,
  },
  rankText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  employeeId: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
});
