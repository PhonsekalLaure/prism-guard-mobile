import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import { AnnouncementItem } from "@/components/dashboard/AnnouncementList";
import {
  PrismColors,
  PrismRadius,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { fetchAllAnnouncements } from "@/services/announcementsService";

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAnnouncements = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await fetchAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message || "Could not load announcements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnnouncements({ silent: true });
  };

  return (
    <ScreenWrapper activeTabKey="home">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={PrismColors.gold} />
          <Text style={styles.stateText}>Loading announcements</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Could not load announcements</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAnnouncements()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          )}
          ListEmptyComponent={(
            <View style={styles.centerState}>
              <Text style={styles.stateTitle}>No announcements</Text>
              <Text style={styles.stateText}>There are no announcements yet.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <AnnouncementItem
              title={item.title}
              preview={item.preview}
              priority={item.priority}
              onPress={() => router.push(`/announcement/${item.id}`)}
            />
          )}
        />
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
  listContent: {
    padding: PrismSpacing.base,
    gap: PrismSpacing.md,
    paddingBottom: 40,
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
