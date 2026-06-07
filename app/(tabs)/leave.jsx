import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  formatLeaveDate,
  getTodayDateKey,
  parseDateKey,
  addDaysToDateKey,
  countInclusiveDays,
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

function getLeaveStartDateError(leaveType, startDate) {
  const today = getTodayDateKey();
  if (!startDate) return null;

  if (startDate < today) {
    return "Cannot request leave in the past";
  }

  if (leaveType === "sick") {
    const tomorrow = addDaysToDateKey(today, 1);
    if (startDate !== today && startDate !== tomorrow) {
      return "Sick leave can only be requested for today or tomorrow";
    }
  }

  if (leaveType === "emergency" && startDate !== today) {
    return "Emergency leave must be for today only";
  }

  if (leaveType === "maternity_paternity") {
    const earliest = addDaysToDateKey(today, 30);
    if (startDate < earliest) {
      return `Maternity leave requires at least 30 days notice (earliest: ${formatLeaveDate(earliest)})`;
    }
  }

  if (leaveType === "service_incentive") {
    const earliest = addDaysToDateKey(today, 7);
    const latest = addDaysToDateKey(today, 14);
    if (startDate < earliest || startDate > latest) {
      return "Service incentive leave must be requested 7 to 14 days in advance";
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
    return "Cannot request leave in the past";
  }

  if (leaveType === "emergency" && endDate !== today) {
    return "Emergency leave must be for today only";
  }

  return null;
}

function getWeekdayLabel(dateString) {
  const date = parseDateKey(dateString);
  if (!date) return null;
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[date.getUTCDay()];
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

function getDateRange(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getUniqueWeekdayLabels(dates = []) {
  const seen = new Set();
  const labels = [];
  for (const date of dates) {
    const label = getWeekdayLabel(date);
    if (label && !seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

async function loadScheduledDatesForMonth(monthKey) {
  const [year, monthString] = monthKey.split("-").map(Number);
  return (await fetchMonthlySchedule({ year, month: monthString - 1 })).scheduledDates || [];
}

async function validateDutyDays(startDate, endDate) {
  const monthKeys = getMonthKeysBetween(startDate, endDate);
  if (monthKeys.length === 0) return null;

  const scheduleArrays = await Promise.all(monthKeys.map(loadScheduledDatesForMonth));
  const scheduledSet = new Set(scheduleArrays.flat());
  const requestedDates = getDateRange(startDate, endDate);

  if (requestedDates.every((date) => scheduledSet.has(date))) return null;

  return "You can only request leave on scheduled shift days";
}

function getLeaveFormError(formData) {
  const startDateError = getLeaveStartDateError(formData.leaveType, formData.startDate);
  if (startDateError) return startDateError;

  const endDateError = getLeaveEndDateError(formData.leaveType, formData.startDate, formData.endDate);
  if (endDateError) return endDateError;

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
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [scheduleValidationError, setScheduleValidationError] = useState("");
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
        fetchLeaveRequests(),
      ]);
      setCredits(creditResult);
      setRequests(requestResult);
    } catch (e) {
      setLoadError(e.message || "Could not load leave data.");
    } finally {
      setCreditsLoading(false);
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
        const error = await validateDutyDays(formData.startDate, formData.endDate);
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
    || !formData.supportingDocument
    || Boolean(validationError)
  );

  const handleOpenReview = async () => {
    const { leaveType, startDate, endDate, reason, supportingDocument } = formData;
    if (!leaveType || !startDate || !endDate || !reason || !supportingDocument) {
      Alert.alert("Incomplete Form", "Please fill in all required fields.");
      return;
    }

    if (validationError) {
      Alert.alert("Invalid Leave Request", validationError);
      return;
    }

    const scheduleDutyError = await validateDutyDays(startDate, endDate);
    if (scheduleDutyError) {
      setScheduleValidationError(scheduleDutyError);
      Alert.alert("Invalid Duty Days", scheduleDutyError);
      return;
    }

    const selectedCredit = credits.byType.find(
      (item) => item.leaveType === leaveType,
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
      Alert.alert(
        "Request Submitted",
        "Your leave request has been sent for approval.",
        [{ text: "OK", onPress: navigateBackToSchedule }],
      );
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
            try {
              await cancelLeaveRequest(request.id);
              await loadLeaveData();
            } catch (error) {
              Alert.alert(
                "Cancellation Failed",
                error.message || "Something went wrong. Please try again.",
              );
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
});
