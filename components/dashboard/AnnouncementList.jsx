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

export const AnnouncementItem = ({ title, preview, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.iconWrapper}>
      <Text style={styles.itemIcon}>ℹ</Text>
    </View>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.itemPreview} numberOfLines={1}>
        {preview}
      </Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const AnnouncementList = ({ announcements = [], onSeeAll, onItemPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {announcements.map((item) => (
          <AnnouncementItem
            key={item.id}
            title={item.title}
            preview={item.preview}
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
  },
  itemTitle: {
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textPrimary,
    marginBottom: 2,
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
