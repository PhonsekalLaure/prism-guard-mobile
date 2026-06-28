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
  addDaysToDateKey,
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
const INITIAL_LEAVE_FORM_DATA = {
  leaveType: "",
  startDate: "",
  endDate: "",
  requestedDates: [],
  reason: "",
  supportingDocument: null,
  deliveryDate: "",
  childBirthDate: "",
  silPurpose: "standard",
};

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
  return leaveType;
}

function isSupportingDocumentRequired(formData) {
  return Boolean(formData.leaveType && formData.leaveType !== "service_incentive");
}

function getLeaveFormError(formData) {
  const today = getTodayDateKey();
  const dates = formData.requestedDates || [];
  if (!formData.leaveType || dates.length === 0) return null;

  if (isSupportingDocumentRequired(formData) && !formData.supportingDocument) {
    return "A supporting document is required for this leave type.";
  }

  if (formData.leaveType === "emergency") {
    const earliestEmergencyDate = addDaysToDateKey(today, -3);
    if (dates.some((date) => date < earliestEmergencyDate || date > today)) {
      return "Emergency leave can only use scheduled shifts from today through the last 3 days.";
    }
  }

  if (formData.leaveType === "maternity") {
    if (!formData.deliveryDate) return "Expected delivery date is required for maternity leave.";
    if (dates.length !== 105) return "Maternity leave must cover exactly 105 consecutive days.";
  }

  if (formData.leaveType === "paternity") {
    if (!formData.childBirthDate) return "Child birth date is required for paternity leave.";
    const latestEnd = addDaysToDateKey(formData.childBirthDate, 60);
    if (dates.length > 7) return "Paternity leave may include at most 7 calendar days.";
    if (dates.some((date) => date < formData.childBirthDate || date > latestEnd)) {
      return `Paternity leave must be within 60 days of the child's birth (${formatLeaveDate(formData.childBirthDate)} to ${formatLeaveDate(latestEnd)}).`;
    }
  }

  if (
    formData.leaveType === "service_incentive"
    && formData.silPurpose !== "sick_substitution"
    && dates.some((date) => date <= today)
  ) {
    return "Standard Service Incentive Leave can only be filed for future scheduled shifts.";
  }

  return null;
}

function getMonthKeysForDates(dates) {
  return [...new Set(dates.map((date) => date.slice(0, 7)))];
}

async function validateLeaveDates(leaveType, silPurpose, requestedDates) {
  if (leaveType === "maternity") return null;
  const scheduleMonths = await Promise.all(
    getMonthKeysForDates(requestedDates).map(async (monthKey) => {
      const [year, monthString] = monthKey.split("-").map(Number);
      return fetchMonthlySchedule({ year, month: monthString - 1 });
    }),
  );
  const scheduledSet = new Set(scheduleMonths.flatMap((item) => item.scheduledDates || []));
  const absentSet = new Set(scheduleMonths.flatMap((item) => item.absentDates || []));
  const today = getTodayDateKey();
  const sickMode = leaveType === "sick"
    || (leaveType === "service_incentive" && silPurpose === "sick_substitution");

  if (sickMode) {
    const valid = requestedDates.every((date) => (
      (date < today && absentSet.has(date))
      || (date === today && scheduledSet.has(date))
    ));
    return valid
      ? null
      : "Sick-related leave can only use past absent shifts or today's scheduled shift.";
  }

  if (leaveType === "emergency") {
    const earliestEmergencyDate = addDaysToDateKey(today, -3);
    const emergencySet = new Set([
      ...[...absentSet].filter((date) => date >= earliestEmergencyDate && date < today),
      ...[...scheduledSet].filter((date) => date === today),
    ]);
    const validGraceDates = requestedDates.every((date) => (
      date >= earliestEmergencyDate
      && date <= today
      && emergencySet.has(date)
    ));
    if (!validGraceDates) {
      return "Emergency leave can only use missed scheduled shifts from today through the last 3 days.";
    }

    const [startDate] = requestedDates;
    const endDate = requestedDates[requestedDates.length - 1];
    const expectedDates = [];
    for (
      let cursor = startDate;
      cursor <= endDate;
      cursor = addDaysToDateKey(cursor, 1)
    ) {
      if (emergencySet.has(cursor)) expectedDates.push(cursor);
    }
    if (
      expectedDates.length !== requestedDates.length
      || expectedDates.some((date, index) => date !== requestedDates[index])
    ) {
      return "Emergency leave must cover consecutive scheduled shifts.";
    }
  }

  if (!requestedDates.every((date) => scheduledSet.has(date))) {
    return "You can only request leave on scheduled working days.";
  }

  return null;
}

export default function LeaveScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { deployment, deploymentLoading, profile, profileLoading } = useActiveDeploymentAccess();

  const [formData, setFormData] = useState(INITIAL_LEAVE_FORM_DATA);

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
      if (!formData.leaveType || formData.requestedDates.length === 0) {
        setScheduleValidationError("");
        return;
      }

      try {
        const error = await validateLeaveDates(
          formData.leaveType,
          formData.silPurpose,
          formData.requestedDates,
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
  }, [formData.leaveType, formData.requestedDates, formData.silPurpose]);

  const validationError = getLeaveFormError(formData) || scheduleValidationError;
  const isSubmitDisabled = (
    !formData.leaveType
    || formData.requestedDates.length === 0
    || !formData.reason
    || (isSupportingDocumentRequired(formData) && !formData.supportingDocument)
    || Boolean(validationError)
  );

  const handleOpenReview = async () => {
    const { leaveType, reason, supportingDocument, requestedDates, silPurpose } = formData;
    if (!leaveType || requestedDates.length === 0 || !reason) {
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

    const scheduleDutyError = await validateLeaveDates(leaveType, silPurpose, requestedDates);
    if (scheduleDutyError) {
      setScheduleValidationError(scheduleDutyError);
      Alert.alert("Invalid Duty Days", scheduleDutyError);
      return;
    }

    const selectedCredit = credits.byType.find(
      (item) => item.leaveType === getLeaveCreditType(leaveType),
    );
    const daysRequested = requestedDates.length;

    if (daysRequested <= 0) {
      Alert.alert("Invalid Dates", "End date cannot be before start date.");
      return;
    }

    if (
      leaveType === "service_incentive"
      && selectedCredit?.remainingDays !== null
      && selectedCredit?.remainingDays !== undefined
      && daysRequested > selectedCredit.remainingDays
    ) {
      Alert.alert(
        "Insufficient Leave Balance",
        `This request needs ${daysRequested} day${daysRequested === 1 ? "" : "s"}, but only ${selectedCredit.remainingDays} remain.`,
      );
      return;
    }

    if (
      selectedCredit?.remainingRequests !== null
      && selectedCredit?.remainingRequests === 0
    ) {
      Alert.alert(
        "Leave Limit Reached",
        `You have already used the maximum ${selectedCredit.leaveTypeLabel} requests.`,
      );
      return;
    }

    if (leaveType === "service_incentive" && silPurpose === "sick_substitution") {
      const sickCredit = credits.byType.find((item) => item.leaveType === "sick");
      if ((sickCredit?.remainingRequests ?? 1) > 0) {
        Alert.alert(
          "Sick Leave Still Available",
          "SIL sick substitution is available only after both yearly sick leave requests are exhausted.",
        );
        return;
      }
    }

    setModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    try {
      await submitLeaveRequest(formData);
      setFormData(INITIAL_LEAVE_FORM_DATA);
      setScheduleValidationError("");
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
            employeeGender={profile?.gender || null}
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
