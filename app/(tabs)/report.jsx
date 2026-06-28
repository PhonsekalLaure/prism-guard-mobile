import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { fetchActiveAttendance } from "@/services/attendanceService";
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
const MIN_NARRATIVE_LENGTH = 10;

const getSubmissionSourceLabel = (incident) => {
  if (incident?.submissionSource === "open_attendance_log") return "Timed-in report";
  if (incident?.submissionSource === "active_deployment") return "No active time-in";
  return "Source not recorded";
};

const IncompleteReportModal = ({ visible, characterCount, minimumCount, onClose }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.incompleteOverlay}>
      <View style={styles.incompleteSheet}>
        <View style={styles.incompleteHandle} />
        <View style={styles.incompleteIconWrap}>
          <Ionicons name="document-text-outline" size={28} color={PrismColors.warning} />
        </View>

        <Text style={styles.incompleteTitle}>Report needs more detail</Text>
        <Text style={styles.incompleteMessage}>
          Add a short narrative before submitting so operations has enough context to review the incident.
        </Text>

        <View style={styles.incompleteRequirement}>
          <View style={styles.incompleteRequirementIcon}>
            <Ionicons name="text-outline" size={18} color={PrismColors.navy} />
          </View>
          <View style={styles.incompleteRequirementText}>
            <Text style={styles.incompleteRequirementLabel}>Narrative length</Text>
            <Text style={styles.incompleteRequirementValue}>
              {characterCount}/{minimumCount} characters
            </Text>
          </View>
        </View>

        <View style={styles.incompleteProgressTrack}>
          <View
            style={[
              styles.incompleteProgressFill,
              { width: `${Math.min((characterCount / minimumCount) * 100, 100)}%` },
            ]}
          />
        </View>

        <TouchableOpacity style={styles.incompleteAction} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.incompleteActionText}>Keep Writing</Text>
          <Ionicons name="create-outline" size={18} color={PrismColors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const SubmittedModal = ({ visible, reportId, onDone }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onDone}>
    <View style={styles.submittedOverlay}>
      <View style={styles.submittedCard}>
        <View style={styles.submittedIconWrap}>
          <Ionicons name="checkmark-circle" size={34} color={PrismColors.success} />
        </View>
        <Text style={styles.submittedTitle}>Report Submitted</Text>
        <Text style={styles.submittedMessage}>
          Your incident report has been sent to operations for review.
        </Text>
        {reportId ? (
          <View style={styles.submittedReference}>
            <Text style={styles.submittedReferenceLabel}>Reference</Text>
            <Text style={styles.submittedReferenceValue}>#{reportId.slice(0, 8)}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.submittedDoneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.submittedDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

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
  const [submittedReportId, setSubmittedReportId] = useState(null);
  const [incompleteModalVisible, setIncompleteModalVisible] = useState(false);
  const [activeAttendanceLog, setActiveAttendanceLog] = useState(null);
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
    fetchActiveAttendance()
      .then((attendanceLog) => {
        if (active) setActiveAttendanceLog(attendanceLog || null);
      })
      .catch(() => {
        if (active) setActiveAttendanceLog(null);
      });
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

  const openReviewModal = (timestamp = new Date()) => {
    setOccurredAt(timestamp);
    setModalVisible(true);
  };

  const handleSubmitPress = () => {
    if (submitting) return;

    if (narrative.trim().length < MIN_NARRATIVE_LENGTH) {
      setIncompleteModalVisible(true);
      return;
    }

    const now = new Date();
    if (!activeAttendanceLog?.id) {
      Alert.alert(
        "Submit without time-in?",
        "You are not currently timed in. The report will still be sent, and Operations will see it was submitted without an active attendance log.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit Anyway", onPress: () => openReviewModal(now) },
        ],
      );
      return;
    }

    openReviewModal(now);
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
      setSubmittedReportId(incident?.id || "");
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
                  <View style={styles.historyBadgeGroup}>
                    <Text style={styles.historyBadge}>
                      {titleCase(incident.reviewStatus || incident.status)}
                    </Text>
                    <Text style={[
                      styles.historyBadge,
                      !incident.submittedWhileTimedIn && styles.historyBadgeWarning,
                    ]}>
                      {getSubmissionSourceLabel(incident)}
                    </Text>
                  </View>
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

      <SubmittedModal
        visible={submittedReportId !== null}
        reportId={submittedReportId}
        onDone={() => {
          setSubmittedReportId(null);
          setNarrative("");
        }}
      />

      <IncompleteReportModal
        visible={incompleteModalVisible}
        characterCount={narrative.trim().length}
        minimumCount={MIN_NARRATIVE_LENGTH}
        onClose={() => setIncompleteModalVisible(false)}
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
  historyBadgeGroup: {
    alignItems: "flex-end",
    gap: 4,
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
  historyBadgeWarning: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
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
  incompleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 31, 60, 0.55)",
    justifyContent: "flex-end",
  },
  incompleteSheet: {
    backgroundColor: PrismColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: PrismSpacing.lg,
    paddingTop: PrismSpacing.md,
    paddingBottom: 34,
    ...PrismShadows.header,
  },
  incompleteHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: PrismColors.border,
    marginBottom: PrismSpacing.lg,
  },
  incompleteIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PrismColors.warning + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PrismSpacing.md,
  },
  incompleteTitle: {
    fontSize: PrismTypography.xl,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.navy,
  },
  incompleteMessage: {
    marginTop: PrismSpacing.xs,
    fontSize: PrismTypography.base,
    color: PrismColors.textSecondary,
    lineHeight: 21,
  },
  incompleteRequirement: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: PrismSpacing.lg,
    padding: PrismSpacing.md,
    borderRadius: 14,
    backgroundColor: PrismColors.offWhite,
    borderWidth: 1,
    borderColor: PrismColors.border,
  },
  incompleteRequirementIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PrismColors.goldDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: PrismSpacing.md,
  },
  incompleteRequirementText: {
    flex: 1,
  },
  incompleteRequirementLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
    textTransform: "uppercase",
  },
  incompleteRequirementValue: {
    marginTop: 2,
    fontSize: PrismTypography.base,
    color: PrismColors.textPrimary,
    fontWeight: PrismTypography.bold,
  },
  incompleteProgressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: PrismColors.border,
    overflow: "hidden",
    marginTop: PrismSpacing.md,
  },
  incompleteProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: PrismColors.warning,
  },
  incompleteAction: {
    marginTop: PrismSpacing.lg,
    borderRadius: 14,
    backgroundColor: PrismColors.gold,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: PrismSpacing.sm,
    ...PrismShadows.button,
  },
  incompleteActionText: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
  submittedOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 31, 60, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: PrismSpacing.lg,
  },
  submittedCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: PrismColors.white,
    borderRadius: 18,
    padding: PrismSpacing.lg,
    alignItems: "center",
    ...PrismShadows.header,
  },
  submittedIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: PrismColors.success + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PrismSpacing.md,
  },
  submittedTitle: {
    fontSize: PrismTypography.lg,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
    textAlign: "center",
  },
  submittedMessage: {
    marginTop: PrismSpacing.xs,
    fontSize: PrismTypography.sm,
    color: PrismColors.textSecondary,
    lineHeight: 19,
    textAlign: "center",
  },
  submittedReference: {
    width: "100%",
    marginTop: PrismSpacing.md,
    paddingVertical: PrismSpacing.sm,
    paddingHorizontal: PrismSpacing.md,
    borderRadius: 12,
    backgroundColor: PrismColors.offWhite,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submittedReferenceLabel: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textSecondary,
    textTransform: "uppercase",
  },
  submittedReferenceValue: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.navy,
  },
  submittedDoneBtn: {
    width: "100%",
    marginTop: PrismSpacing.lg,
    borderRadius: 12,
    backgroundColor: PrismColors.gold,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...PrismShadows.button,
  },
  submittedDoneText: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
});
