import { PrismColors } from "@/constants/prismTheme";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

function getInitials(value = "") {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HQ";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export default function DeploymentCard({
  location,
  address,
  avatarUrl,
  timeStart,
  timeEnd,
  status = "ACTIVE",
  title = "SCHEDULED DEPLOYMENT",
  emptyMessage = "No deployment found for this date.",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowAvatar = Boolean(avatarUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          {shouldShowAvatar ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Text style={styles.icon}>{getInitials(location || address)}</Text>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.location}>{location}</Text>
          {!!address && <Text style={styles.address}>{address}</Text>}
          {!!timeStart && !!timeEnd && (
            <Text style={styles.time}>
              {timeStart} - {timeEnd}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#2ecc71" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  icon: { fontSize: 13, fontWeight: "800", color: PrismColors.navy },
  details: { flex: 1 },
  location: { fontSize: 15, fontWeight: "700", color: PrismColors.navy },
  address: { fontSize: 12, color: "#999", marginTop: 2 },
  time: {
    fontSize: 12,
    color: PrismColors.gold,
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: { color: "#777", fontSize: 13, marginTop: 10 },
});
