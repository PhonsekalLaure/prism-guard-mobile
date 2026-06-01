import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { fetchAnnouncementById } from "@/services/announcementsService";

function formatAnnouncementDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnnouncement = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAnnouncementById(id);
      if (!data) throw new Error("Announcement not found.");
      setAnnouncement(data);
    } catch (err) {
      setError(err.message || "Could not load announcement.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAnnouncement();
  }, [loadAnnouncement]);

  return (
    <ScreenWrapper activeTabKey="home">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement</Text>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={PrismColors.gold} />
          <Text style={styles.stateText}>Loading announcement</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Could not load announcement</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnnouncement}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{announcement.title}</Text>
            {!!announcement.createdAt && (
              <Text style={styles.date}>
                {formatAnnouncementDate(announcement.createdAt)}
              </Text>
            )}
            <Text style={styles.body}>
              {announcement.content || announcement.preview || "No details available."}
            </Text>
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PrismColors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PrismSpacing.base,
    paddingVertical: PrismSpacing.base,
  },
  headerTitle: {
    color: PrismColors.white,
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.bold,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: PrismSpacing.base,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.md,
    borderWidth: 1,
    borderColor: PrismColors.border,
    padding: PrismSpacing.lg,
    ...PrismShadows.card,
  },
  title: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.bold,
    marginBottom: PrismSpacing.sm,
  },
  date: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    marginBottom: PrismSpacing.lg,
  },
  body: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    lineHeight: 22,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PrismSpacing.xl,
    gap: PrismSpacing.sm,
  },
  stateTitle: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    textAlign: "center",
  },
  stateText: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: PrismSpacing.sm,
    backgroundColor: PrismColors.navy,
    borderRadius: PrismRadius.sm,
    paddingHorizontal: PrismSpacing.lg,
    paddingVertical: PrismSpacing.sm,
  },
  retryText: {
    color: PrismColors.white,
    fontWeight: PrismTypography.bold,
  },
});
