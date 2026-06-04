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

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import {
    cancelLeaveRequest,
    fetchLeaveCredits,
    fetchLeaveRequests,
    fetchSupportingDocument,
    submitLeaveRequest,
} from "@/services/leaveService";
import LeaveBalanceCard from "../../components/leave/LeaveBalanceCard";
import LeaveForm from "../../components/leave/LeaveForm";
import LeaveHeader from "../../components/leave/LeaveHeader";
import LeaveRequestHistory from "../../components/leave/LeaveRequestHistory";
import ReviewLeaveModal from "../../components/leave/ReviewLeaveModal";
import { addDaysToDateKey, countInclusiveDays, getTodayDateKey } from "../../utils/leaveDates";

function getLeaveStartDateError(leaveType, startDate) {
  const today = getTodayDateKey();

  if (leaveType === "sick" && startDate !== today) {
    return "Sick leave must start today.";
  }

  if (leaveType === "emergency" && startDate !== today) {
    return "Emergency leave must start today.";
  }

  const earliestPlannedDate = addDaysToDateKey(today, 1) || today;
  if (leaveType === "maternity_paternity" && startDate < earliestPlannedDate) {
    return "Maternity / paternity leave must start from a future scheduled duty day.";
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

  const handleOpenReview = () => {
    const { leaveType, startDate, endDate, reason, supportingDocument } = formData;
    if (!leaveType || !startDate || !endDate || !reason || !supportingDocument) {
      Alert.alert("Incomplete Form", "Please fill in all required fields.");
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

    const startDateError = getLeaveStartDateError(leaveType, startDate);
    if (startDateError) {
      Alert.alert("Invalid Start Date", startDateError);
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
