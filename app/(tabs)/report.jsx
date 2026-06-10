import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  LocationCard,
  NarrativeInput,
  ReviewModal,
  TimeCard,
} from "@/components/IncidentReport";
import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import incidentService from "@/services/incidentService";

const formatDateTime = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dateNum = date.getDate();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}, ${month} ${dateNum} | ${hours}:${minutes} ${ampm}`;
};

const formatIncidentDate = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : formatDateTime(date);
};

const titleCase = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const HISTORY_PAGE_SIZE = 3;

export default function ReportScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();
  const [narrative, setNarrative] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const accessDeniedAlertShownRef = useRef(false);

  const locationLabel = deployment?.client_sites?.site_name || "Current assigned site";

  const loadIncidentHistory = useCallback(async ({
    quiet = false,
    page = 1,
    isActive = () => true,
  } = {}) => {
    try {
      if (!quiet) setHistoryLoading(true);
      setHistoryError(null);
      const result = await incidentService.fetchIncidentReports({
        page,
        limit: HISTORY_PAGE_SIZE,
      });
      if (!isActive()) return;
      setIncidentHistory(result.incidents);
      setHistoryTotalCount(result.totalCount);
      setHistoryPage(result.page || page);
    } catch (err) {
      if (!isActive()) return;
      setHistoryError(err.message || "Unable to load recent reports.");
    } finally {
      if (isActive()) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      accessDeniedAlertShownRef.current = false;
      return undefined;
    }

    if (profileLoading || deploymentLoading) return undefined;
    if (!deployment) {
      if (accessDeniedAlertShownRef.current) return undefined;
      accessDeniedAlertShownRef.current = true;
      Alert.alert("No Access", "You have no access to this right now.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
      return undefined;
    }

    let active = true;
    loadIncidentHistory({ page: 1, isActive: () => active });
    return () => {
      active = false;
    };
  }, [deployment, deploymentLoading, isFocused, loadIncidentHistory, profileLoading, router]);

  if (profileLoading || deploymentLoading) {
    return (
      <ScreenWrapper activeTabKey="home">
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingState}>
          <ActivityIndicator color={PrismColors.navy} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!deployment) {
    return (
      <ScreenWrapper activeTabKey="home">
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingState} />
      </ScreenWrapper>
    );
  }

  const handleSubmitPress = () => {
    if (submitting) return;

    if (narrative.trim().length < 10) {
      Alert.alert(
        "Incomplete Report",
        "Please enter at least 10 characters before submitting.",
      );
      return;
    }

    const now = new Date();
    setOccurredAt(now);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const incident = await incidentService.submitIncidentReport({
        narrative: narrative.trim(),
        occurredAt: occurredAt.toISOString(),
      });
      setModalVisible(false);
      Alert.alert(
        "Report Submitted",
        `Report ${incident?.id ? `#${incident.id.slice(0, 8)}` : ""} submitted for operations review.`,
        [{ text: "OK", onPress: () => setNarrative("") }],
      );
      await loadIncidentHistory({ quiet: true, page: 1 });
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        err.message || "Unable to submit the incident report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const historyTotalPages = Math.max(Math.ceil(historyTotalCount / HISTORY_PAGE_SIZE), 1);
  const historyStart = historyTotalCount === 0 ? 0 : ((historyPage - 1) * HISTORY_PAGE_SIZE) + 1;
  const historyEnd = Math.min(historyPage * HISTORY_PAGE_SIZE, historyTotalCount);

  const handleHistoryPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > historyTotalPages || historyLoading) return;
    loadIncidentHistory({ quiet: true, page: nextPage });
  };

  return (
    <ScreenWrapper activeTabKey="report">
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LocationCard location={locationLabel} />
        <TimeCard />
        <NarrativeInput value={narrative} onChangeText={setNarrative} />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmitPress}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? "Submitting Report..." : "Submit Report"}
          </Text>
          <Ionicons name="send" size={18} color={PrismColors.navy} />
        </TouchableOpacity>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Reports</Text>
            <TouchableOpacity
              onPress={() => loadIncidentHistory({ page: historyPage })}
              disabled={historyLoading}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={historyLoading ? PrismColors.textSecondary : PrismColors.navy}
              />
            </TouchableOpacity>
          </View>

          {historyLoading && incidentHistory.length === 0 ? (
            <View style={styles.historyState}>
              <ActivityIndicator color={PrismColors.navy} />
            </View>
          ) : historyError ? (
            <Text style={styles.historyError}>{historyError}</Text>
          ) : incidentHistory.length === 0 ? (
            <Text style={styles.historyEmpty}>No submitted incident reports yet.</Text>
          ) : (
            incidentHistory.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={styles.historyItem}
                onPress={() => router.push(`/incident/${incident.id}`)}
                activeOpacity={0.82}
              >
                <View style={styles.historyItemTop}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {incident.title || "Incident report"}
                  </Text>
                  <Text style={styles.historyBadge}>
                    {titleCase(incident.reviewStatus || incident.status)}
                  </Text>
                </View>
                <Text style={styles.historyMeta} numberOfLines={1}>
                  {incident.reportId} | {incident.siteName || "Unknown site"}
                </Text>
                <Text style={styles.historySummary} numberOfLines={2}>
                  {incident.summary || incident.rawText || "Report submitted for review."}
                </Text>
                <Text style={styles.historyDate}>
                  Submitted {formatIncidentDate(incident.submittedAt)}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {!historyLoading && !historyError && incidentHistory.length > 0 && (
            <View style={styles.historyPagination}>
              <Text style={styles.historyPaginationInfo}>
                Showing {historyStart}-{historyEnd} of {historyTotalCount} reports
              </Text>
              <View style={styles.historyPaginationControls}>
                <TouchableOpacity
                  style={[styles.historyArrowButton, historyPage === 1 && styles.historyArrowButtonDisabled]}
                  onPress={() => handleHistoryPageChange(historyPage - 1)}
                  disabled={historyPage === 1 || historyLoading}
                >
                  <Ionicons
                    name="chevron-back"
                    size={19}
                    color={historyPage === 1 ? PrismColors.textLight : PrismColors.navy}
                  />
                </TouchableOpacity>
                <Text style={styles.historyPageIndicator}>
                  Page {historyPage} of {historyTotalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.historyArrowButton, historyPage >= historyTotalPages && styles.historyArrowButtonDisabled]}
                  onPress={() => handleHistoryPageChange(historyPage + 1)}
                  disabled={historyPage >= historyTotalPages || historyLoading}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={historyPage >= historyTotalPages ? PrismColors.textLight : PrismColors.navy}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <ReviewModal
        visible={modalVisible}
        location={locationLabel}
        time={formatDateTime(occurredAt)}
        narrative={narrative}
        submitting={submitting}
        onEdit={() => !submitting && setModalVisible(false)}
        onConfirm={handleConfirm}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PrismColors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingTop: 14,
    paddingHorizontal: PrismSpacing.md,
    ...PrismShadows.card,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: PrismTypography.bold,
    color: PrismColors.white,
    letterSpacing: 0.4,
  },
  body: {
    padding: PrismSpacing.md,
    paddingBottom: 40,
  },
  submitBtn: {
    backgroundColor: PrismColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: PrismSpacing.xs,
    shadowColor: PrismColors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
    letterSpacing: 0.3,
  },
  historyCard: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: 15,
    padding: PrismSpacing.md,
    marginTop: PrismSpacing.md,
    ...PrismShadows.card,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: PrismSpacing.sm,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
  historyState: {
    paddingVertical: PrismSpacing.lg,
  },
  historyEmpty: {
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
  },
  historyError: {
    fontSize: PrismTypography.sm,
    color: PrismColors.danger,
  },
  historyItem: {
    borderTopWidth: 1,
    borderTopColor: PrismColors.border,
    paddingTop: PrismSpacing.sm,
    marginTop: PrismSpacing.sm,
  },
  historyItemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
  },
  historyItemTitle: {
    flex: 1,
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
  historyBadge: {
    backgroundColor: PrismColors.goldDim,
    color: PrismColors.navy,
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    paddingHorizontal: PrismSpacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  historyMeta: {
    marginTop: 3,
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
  },
  historySummary: {
    marginTop: PrismSpacing.xs,
    fontSize: PrismTypography.sm,
    color: PrismColors.textPrimary,
    lineHeight: 18,
  },
  historyDate: {
    marginTop: PrismSpacing.xs,
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
  },
  historyPagination: {
    alignItems: "center",
    gap: PrismSpacing.sm,
    paddingTop: PrismSpacing.md,
    marginTop: PrismSpacing.md,
    borderTopWidth: 1,
    borderTopColor: PrismColors.border,
  },
  historyPaginationInfo: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    textAlign: "center",
  },
  historyPaginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: PrismSpacing.lg,
  },
  historyArrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PrismColors.border,
  },
  historyArrowButtonDisabled: {
    opacity: 0.5,
  },
  historyPageIndicator: {
    minWidth: 92,
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.semiBold,
    textAlign: "center",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
