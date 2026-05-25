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
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationIcon(type = "") {
  if (type.includes("approved")) return "checkmark-circle-outline";
  if (type.includes("rejected") || type.includes("cancelled")) {
    return "alert-circle-outline";
  }
  if (type.includes("reliever")) return "shield-checkmark-outline";
  return "notifications-outline";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await fetchNotifications({ limit: 50 });
      setItems(result.notifications);
    } catch (err) {
      setError(err.message || "Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications({ silent: true });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications({ silent: true });
  };

  const handlePress = async (item) => {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      setItems((current) => current.map((notification) => (
        notification.id === item.id
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      )));
    }

    const route = item.event?.metadata?.route;
    const screen = item.event?.metadata?.screen;
    if (route === "/(tabs)/leave" || screen === "leave") {
      router.push("/(tabs)/leave");
    }
  };

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <ScreenWrapper activeTabKey="home">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={styles.iconButton}
          disabled={unreadCount === 0}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={22}
            color={unreadCount > 0 ? PrismColors.gold : PrismColors.textLight}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={PrismColors.gold} />
          <Text style={styles.stateText}>Loading notifications</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Could not load notifications</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          )}
          ListEmptyComponent={(
            <View style={styles.centerState}>
              <Text style={styles.stateTitle}>No notifications</Text>
              <Text style={styles.stateText}>You are all caught up.</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const event = item.event || {};
            return (
              <TouchableOpacity
                style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
                onPress={() => handlePress(item)}
                activeOpacity={0.75}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name={getNotificationIcon(event.type)}
                    size={20}
                    color={PrismColors.navy}
                  />
                </View>
                <View style={styles.notificationBody}>
                  <View style={styles.notificationTopRow}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {event.title || "Notification"}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatNotificationTime(event.created_at || item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={3}>
                    {event.message || ""}
                  </Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
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
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: PrismSpacing.md,
    backgroundColor: PrismColors.white,
    borderRadius: PrismRadius.md,
    padding: PrismSpacing.base,
    borderWidth: 1,
    borderColor: PrismColors.border,
    ...PrismShadows.card,
  },
  unreadCard: {
    borderColor: PrismColors.gold,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PrismColors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBody: {
    flex: 1,
    gap: PrismSpacing.xs,
  },
  notificationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
  },
  notificationTitle: {
    flex: 1,
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
  },
  notificationTime: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.xs,
  },
  notificationMessage: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PrismColors.gold,
    marginTop: PrismSpacing.xs,
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
