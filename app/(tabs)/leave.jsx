import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  formatLeaveDate,
  getTodayDateKey,
  parseDateKey,
  addDaysToDateKey,
  countInclusiveDays,
  getDateRange,
} from "../../utils/leaveDates";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import {
    cancelLeaveRequest,
    fetchLeaveCredits,
    fetchLeaveRequests,
    fetchSupportingDocument,
    submitLeaveRequest,
} from "@/services/leaveService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import LeaveBalanceCard from "../../components/leave/LeaveBalanceCard";
import LeaveForm from "../../components/leave/LeaveForm";
import LeaveHeader from "../../components/leave/LeaveHeader";
import LeaveRequestHistory from "../../components/leave/LeaveRequestHistory";
import ReviewLeaveModal from "../../components/leave/ReviewLeaveModal";
import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";

const LEAVE_HISTORY_PAGE_SIZE = 3;
const WEEKDAY_ONLY_LEAVE_TYPES = new Set(["service_incentive"]);

const LeaveSubmittedModal = ({ visible, onDone }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onDone}>
    <View style={styles.submittedOverlay}>
      <View style={styles.submittedCard}>
        <View style={styles.submittedIconWrap}>
          <Ionicons name="time" size={34} color={PrismColors.warning} />
        </View>
        <Text style={styles.submittedTitle}>Request Submitted</Text>
        <Text style={styles.submittedMessage}>
          Your leave request has been sent for approval.
        </Text>
        <View style={styles.submittedSummary}>
          <Text style={styles.submittedSummaryLabel}>Status</Text>
          <Text style={styles.submittedSummaryValue}>Pending Approval</Text>
        </View>
        <TouchableOpacity style={styles.submittedDoneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.submittedDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

function getLeaveCreditType(leaveType) {
  return ["maternity", "paternity"].includes(leaveType)
    ? "maternity_paternity"
    : leaveType;
}

function isWeekendDate(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

function hasWeekendInRange(startDate, endDate) {
  return getDateRange(startDate, endDate).some(isWeekendDate);
}

function isSupportingDocumentRequired(formData) {
  const daysRequested = countInclusiveDays(formData.startDate, formData.endDate);
  return (
    ["emergency", "bereavement"].includes(formData.leaveType)
    || (formData.leaveType === "sick" && daysRequested >= 3)
  );
}

function getLeaveStartDateError(leaveType, startDate) {
  const today = getTodayDateKey();
  if (!startDate) return null;

  if (leaveType === "sick" && startDate !== today) {
    return "Sick leave must start today.";
  }

  if (leaveType === "emergency" && startDate !== today) {
    return "Emergency leave must start today.";
  }

  if (leaveType === "bereavement") {
    const latestStart = addDaysToDateKey(today, 2);
    if (startDate < today || startDate > latestStart) {
      return `Bereavement leave must start from today through ${formatLeaveDate(latestStart)}.`;
    }
  }

  if (startDate < today) {
    if (!["sick", "paternity"].includes(leaveType)) {
      return "Cannot request leave in the past";
    }
  }

  if (leaveType === "service_incentive") {
    const earliest = addDaysToDateKey(today, 60);
    if (startDate < earliest) {
      return `Service incentive leave requires at least 60 days advance notice (earliest: ${formatLeaveDate(earliest)})`;
    }
  }

  return null;
}

function getLeaveEndDateError(leaveType, startDate, endDate) {
  const today = getTodayDateKey();
  if (!startDate || !endDate) return null;

  if (endDate < startDate) {
    return "End date cannot be before the start date";
  }

  if (endDate < today) {
    if (!["sick", "paternity"].includes(leaveType)) {
      return "Cannot request leave in the past";
    }
  }

  if (leaveType === "sick" && startDate !== today) {
    return "Sick leave must start today.";
  }

  if (leaveType === "emergency") {
    const latestEnd = addDaysToDateKey(today, 4);
    if (startDate !== today || endDate > latestEnd) {
      return `Emergency leave must start today and last 1 to 5 days, ending no later than ${formatLeaveDate(latestEnd)}.`;
    }
  }

  if (leaveType === "bereavement") {
    const minEndDate = addDaysToDateKey(startDate, 2);
    const maxEndDate = addDaysToDateKey(startDate, 4);
    if (endDate < minEndDate || endDate > maxEndDate) {
      return `Bereavement leave must last 3 to 5 consecutive days, ending from ${formatLeaveDate(minEndDate)} to ${formatLeaveDate(maxEndDate)}.`;
    }
  }

  return null;
}

function getMonthKeysBetween(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [];

  const keys = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const final = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= final) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

async function loadScheduledDatesForMonth(monthKey) {
  const [year, monthString] = monthKey.split("-").map(Number);
  const result = await fetchMonthlySchedule({ year, month: monthString - 1 });
  return {
    scheduledDates: result.scheduledDates || [],
    absentDates: result.absentDates || [],
  };
}

async function validateLeaveDates(leaveType, startDate, endDate) {
  if (WEEKDAY_ONLY_LEAVE_TYPES.has(leaveType) && hasWeekendInRange(startDate, endDate)) {
    return "This leave type cannot include Saturdays or Sundays.";
  }

  if (
    WEEKDAY_ONLY_LEAVE_TYPES.has(leaveType)
    || ["sick", "maternity", "paternity", "emergency", "bereavement"].includes(leaveType)
  ) {
    return null;
  }

  const monthKeys = getMonthKeysBetween(startDate, endDate);
  if (monthKeys.length === 0) return null;

  const scheduleMonths = await Promise.all(monthKeys.map(loadScheduledDatesForMonth));
  const scheduledSet = new Set(scheduleMonths.flatMap((item) => item.scheduledDates));
  const absentSet = new Set(scheduleMonths.flatMap((item) => item.absentDates));
  const requestedDates = getDateRange(startDate, endDate);

  if (leaveType === "sick") {
    const today = getTodayDateKey();
    const isValidSickDate = (date) => (
      (date < today && absentSet.has(date))
      || (date === today && scheduledSet.has(date))
    );
    if (requestedDates.every(isValidSickDate)) return null;

    return "Sick leave can only be filed for past absent shift days or today's scheduled shift";
  }

  if (requestedDates.every((date) => scheduledSet.has(date))) return null;

  return "You can only request leave on scheduled shift days";
}

function getLeaveFormError(formData) {
  const startDateError = getLeaveStartDateError(formData.leaveType, formData.startDate);
  if (startDateError) return startDateError;

  const endDateError = getLeaveEndDateError(formData.leaveType, formData.startDate, formData.endDate);
  if (endDateError) return endDateError;

  const daysRequested = countInclusiveDays(formData.startDate, formData.endDate);

  if (WEEKDAY_ONLY_LEAVE_TYPES.has(formData.leaveType) && hasWeekendInRange(formData.startDate, formData.endDate)) {
    return "This leave type cannot include Saturdays or Sundays.";
  }

  if (formData.leaveType === "sick" && daysRequested >= 3 && !formData.supportingDocument) {
    return "A medical certificate is required for sick leave of 3 days or more.";
  }

  if (formData.leaveType === "maternity") {
    if (!formData.deliveryDate) return "Expected delivery date is required for maternity leave.";
    const earliestStart = addDaysToDateKey(formData.deliveryDate, -60);
    const latestEnd = addDaysToDateKey(formData.deliveryDate, 45);
    if (formData.startDate < earliestStart || formData.endDate > latestEnd) {
      return `Maternity leave must be within ${formatLeaveDate(earliestStart)} to ${formatLeaveDate(latestEnd)}.`;
    }
  }

  if (formData.leaveType === "paternity") {
    if (!formData.childBirthDate) return "Child birth date is required for paternity leave.";
    const latestEnd = addDaysToDateKey(formData.childBirthDate, 60);
    if (formData.startDate < formData.childBirthDate || formData.endDate > latestEnd) {
      return `Paternity leave must be within 60 days of the child's birth (${formatLeaveDate(formData.childBirthDate)} to ${formatLeaveDate(latestEnd)}).`;
    }
  }

  if (formData.leaveType === "bereavement" && (daysRequested < 3 || daysRequested > 5)) {
    return "Bereavement leave must be 3 to 5 consecutive days.";
  }

  if (["emergency", "bereavement"].includes(formData.leaveType) && !formData.supportingDocument) {
    return formData.leaveType === "emergency"
      ? "Proof document is required for emergency leave."
      : "Death certificate is required for bereavement leave.";
  }

  return null;
}

export default function LeaveScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    supportingDocument: null,
    deliveryDate: "",
    childBirthDate: "",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState({
    availableCredits: 0,
    maxRequestsPerLeaveType: 2,
    byType: [],
  });
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalCount, setRequestsTotalCount] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [scheduleValidationError, setScheduleValidationError] = useState("");
  const [submittedVisible, setSubmittedVisible] = useState(false);
  const scheduleValidationSeq = useRef(0);
  const accessDeniedAlertShownRef = useRef(false);

  const navigateBackToSchedule = useCallback(() => {
    router.replace("/(tabs)/schedule");
  }, [router]);

  const loadLeaveData = useCallback(async () => {
    setCreditsLoading(true);
    setRequestsLoading(true);
    setLoadError(null);
    try {
      const [creditResult, requestResult] = await Promise.all([
        fetchLeaveCredits(),
        fetchLeaveRequests({ page: 1, limit: LEAVE_HISTORY_PAGE_SIZE }),
      ]);
      setCredits(creditResult);
      setRequests(requestResult.requests);
      setRequestsPage(requestResult.page);
      setRequestsTotalCount(requestResult.totalCount);
    } catch (e) {
      setLoadError(e.message || "Could not load leave data.");
    } finally {
      setCreditsLoading(false);
      setRequestsLoading(false);
    }
  }, []);

  const loadLeaveHistory = useCallback(async (page) => {
    setRequestsLoading(true);
    setLoadError(null);
    try {
      const result = await fetchLeaveRequests({
        page,
        limit: LEAVE_HISTORY_PAGE_SIZE,
      });
      setRequests(result.requests);
      setRequestsPage(result.page);
      setRequestsTotalCount(result.totalCount);
    } catch (e) {
      setLoadError(e.message || "Could not load leave request history.");
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      accessDeniedAlertShownRef.current = false;
      return;
    }

    if (profileLoading || deploymentLoading) return;
    if (!deployment) {
      setCreditsLoading(false);
      setRequestsLoading(false);
      if (accessDeniedAlertShownRef.current) return;
      accessDeniedAlertShownRef.current = true;
      Alert.alert("No Access", "You have no access to this right now.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
      return;
    }

    loadLeaveData();
  }, [
    deployment,
    deploymentLoading,
    isFocused,
    loadLeaveData,
    profileLoading,
    router,
  ]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let active = true;
    const requestId = scheduleValidationSeq.current + 1;
    scheduleValidationSeq.current = requestId;

    async function validate() {
      if (!formData.leaveType || !formData.startDate || !formData.endDate) {
        setScheduleValidationError("");
        return;
      }

      try {
        const error = await validateLeaveDates(
          formData.leaveType,
          formData.startDate,
          formData.endDate,
        );
        if (!active || requestId !== scheduleValidationSeq.current) return;
        setScheduleValidationError(error || "");
      } catch {
        if (!active || requestId !== scheduleValidationSeq.current) return;
        setScheduleValidationError("");
      }
    }

    validate();
    return () => { active = false; };
  }, [formData.leaveType, formData.startDate, formData.endDate]);

  const validationError = getLeaveFormError(formData) || scheduleValidationError;
  const isSubmitDisabled = (
    !formData.leaveType
    || !formData.startDate
    || !formData.endDate
    || !formData.reason
    || (isSupportingDocumentRequired(formData) && !formData.supportingDocument)
    || Boolean(validationError)
  );

  const handleOpenReview = async () => {
    const { leaveType, startDate, endDate, reason, supportingDocument } = formData;
    if (!leaveType || !startDate || !endDate || !reason) {
      Alert.alert("Incomplete Form", "Please fill in all required fields.");
      return;
    }

    if (isSupportingDocumentRequired(formData) && !supportingDocument) {
      Alert.alert("Incomplete Form", getLeaveFormError(formData) || "Please attach the required supporting document.");
      return;
    }

    if (validationError) {
      Alert.alert("Invalid Leave Request", validationError);
      return;
    }

    const scheduleDutyError = await validateLeaveDates(leaveType, startDate, endDate);
    if (scheduleDutyError) {
      setScheduleValidationError(scheduleDutyError);
      Alert.alert("Invalid Duty Days", scheduleDutyError);
      return;
    }

    const selectedCredit = credits.byType.find(
      (item) => item.leaveType === getLeaveCreditType(leaveType),
    );
    const daysRequested = countInclusiveDays(startDate, endDate);

    if (daysRequested <= 0) {
      Alert.alert("Invalid Dates", "End date cannot be before start date.");
      return;
    }

    if (
      selectedCredit?.remainingDays !== null
      && selectedCredit?.remainingDays !== undefined
      && daysRequested > selectedCredit.remainingDays
    ) {
      Alert.alert(
        "Insufficient Leave Balance",
        `This request needs ${daysRequested} day${daysRequested === 1 ? "" : "s"}, but only ${selectedCredit.remainingDays} remain.`,
      );
      return;
    }

    if (selectedCredit?.remainingRequests !== null && selectedCredit?.remainingRequests === 0) {
      Alert.alert(
        "Leave Limit Reached",
        `You have already used the maximum ${selectedCredit.leaveTypeLabel} requests.`,
      );
      return;
    }

    setModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    try {
      await submitLeaveRequest(formData);
      await loadLeaveData();
      setModalVisible(false);
      setSubmittedVisible(true);
    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request) => {
    Alert.alert(
      "Cancel Leave Request",
      "This will withdraw your pending leave request.",
      [
        { text: "Keep Request", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: async () => {
            setCreditsLoading(true);
            try {
              await cancelLeaveRequest(request.id);
              const nextPage = requests.length === 1
                ? Math.max(requestsPage - 1, 1)
                : requestsPage;
              const [creditResult] = await Promise.all([
                fetchLeaveCredits(),
                loadLeaveHistory(nextPage),
              ]);
              setCredits(creditResult);
            } catch (error) {
              Alert.alert(
                "Cancellation Failed",
                error.message || "Something went wrong. Please try again.",
              );
            } finally {
              setCreditsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleOpenDocument = async (request) => {
    try {
      const document = await fetchSupportingDocument(request.id);
      if (!document?.url) {
        throw new Error("Document link is unavailable");
      }
      await WebBrowser.openBrowserAsync(document.url);
    } catch (error) {
      Alert.alert(
        "Document Unavailable",
        error.message || "Could not open the supporting document.",
      );
    }
  };

  const requestsTotalPages = Math.max(
    Math.ceil(requestsTotalCount / LEAVE_HISTORY_PAGE_SIZE),
    1,
  );

  const handleHistoryPageChange = (page) => {
    if (page < 1 || page > requestsTotalPages || requestsLoading) return;
    loadLeaveHistory(page);
  };

  return (
    <ScreenWrapper activeTabKey="schedule">
      <LeaveHeader onBack={navigateBackToSchedule} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load leave data</Text>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : null}
          <LeaveBalanceCard credits={credits} loading={creditsLoading} />
          <LeaveForm
            formData={formData}
            leaveCredits={credits}
            onChange={handleFormChange}
            onSubmit={handleOpenReview}
            errorMessage={validationError}
            submitDisabled={isSubmitDisabled}
          />
          <LeaveRequestHistory
            requests={requests}
            loading={requestsLoading}
            page={requestsPage}
            totalCount={requestsTotalCount}
            totalPages={requestsTotalPages}
            onPageChange={handleHistoryPageChange}
            onCancel={handleCancelRequest}
            onOpenDocument={handleOpenDocument}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ReviewLeaveModal
        visible={modalVisible}
        formData={formData}
        loading={loading}
        onEdit={() => setModalVisible(false)}
        onConfirm={handleConfirmSubmit}
      />
      <LeaveSubmittedModal
        visible={submittedVisible}
        onDone={() => {
          setSubmittedVisible(false);
          navigateBackToSchedule();
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 20,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  errorTitle: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    lineHeight: 17,
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
    backgroundColor: PrismColors.warning + "18",
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
  submittedSummary: {
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
  submittedSummaryLabel: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textSecondary,
    textTransform: "uppercase",
  },
  submittedSummaryValue: {
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
