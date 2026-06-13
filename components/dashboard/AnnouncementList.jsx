// components/dashboard/AnnouncementList.jsx
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const URGENCY_META = {
  normal: {
    label: "Normal",
    badgeStyle: "urgencyBadgeNormal",
    textStyle: "urgencyTextNormal",
  },
  important: {
    label: "Important",
    badgeStyle: "urgencyBadgeImportant",
    textStyle: "urgencyTextImportant",
  },
  urgent: {
    label: "Urgent",
    badgeStyle: "urgencyBadgeUrgent",
    textStyle: "urgencyTextUrgent",
  },
};

function getUrgencyMeta(priority) {
  return URGENCY_META[priority] || URGENCY_META.normal;
}

export const AnnouncementItem = ({ title, preview, priority = "normal", onPress }) => {
  const urgency = getUrgencyMeta(priority);

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrapper}>
        <Text style={styles.itemIcon}>ℹ</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.urgencyBadge, styles[urgency.badgeStyle]]}>
            <Text style={[styles.urgencyText, styles[urgency.textStyle]]}>
              {urgency.label}
            </Text>
          </View>
        </View>
        <Text style={styles.itemPreview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

const AnnouncementList = ({
  announcements = [],
  loading = false,
  error = null,
  onSeeAll,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {loading && (
          <Text style={styles.statusText}>Loading announcements...</Text>
        )}
        {!loading && error && (
          <Text style={styles.statusText}>Announcements unavailable.</Text>
        )}
        {!loading && !error && announcements.length === 0 && (
          <Text style={styles.statusText}>No announcements yet.</Text>
        )}
        {!loading && !error && announcements.map((item) => (
          <AnnouncementItem
            key={item.id}
            title={item.title}
            preview={item.preview}
            priority={item.priority}
            onPress={() => onItemPress?.(item)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: PrismSpacing.base,
    marginBottom: PrismSpacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: PrismSpacing.md,
  },
  sectionTitle: {
    fontSize: PrismTypography.md,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  seeAll: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.semiBold,
    color: PrismColors.gold,
  },
  list: {
    gap: PrismSpacing.sm,
  },
  statusText: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    paddingVertical: PrismSpacing.sm,
  },
  item: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.md,
    paddingHorizontal: PrismSpacing.md,
    paddingVertical: PrismSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.md,
    ...PrismShadows.card,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PrismColors.offWhite,
    borderWidth: 1.5,
    borderColor: PrismColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    fontSize: 16,
    color: PrismColors.textSecondary,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
    marginBottom: 2,
  },
  itemTitle: {
    flex: 1,
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
  },
  urgencyBadge: {
    borderRadius: PrismRadius.full,
    paddingHorizontal: PrismSpacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
  },
  urgencyBadgeNormal: {
    backgroundColor: PrismColors.offWhite,
    borderColor: PrismColors.border,
  },
  urgencyBadgeImportant: {
    backgroundColor: "rgba(243, 156, 18, 0.12)",
    borderColor: "rgba(243, 156, 18, 0.35)",
  },
  urgencyBadgeUrgent: {
    backgroundColor: "rgba(231, 76, 60, 0.12)",
    borderColor: "rgba(231, 76, 60, 0.35)",
  },
  urgencyText: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
  },
  urgencyTextNormal: {
    color: PrismColors.textSecondary,
  },
  urgencyTextImportant: {
    color: PrismColors.warning,
  },
  urgencyTextUrgent: {
    color: PrismColors.danger,
  },
  itemPreview: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 20,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
  },
});

export default AnnouncementList;
