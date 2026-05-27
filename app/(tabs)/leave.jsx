import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet
} from "react-native";
import * as WebBrowser from "expo-web-browser";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
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
import { countInclusiveDays } from "../../utils/leaveDates";

export default function LeaveScreen() {
  const router = useRouter();

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

  const navigateBackToSchedule = () => {
    router.replace("/(tabs)/schedule");
  };

  const loadLeaveData = async () => {
    setCreditsLoading(true);
    setRequestsLoading(true);
    try {
      const [creditResult, requestResult] = await Promise.all([
        fetchLeaveCredits(),
        fetchLeaveRequests(),
      ]);
      setCredits(creditResult);
      setRequests(requestResult);
    } catch (e) {
      console.warn("Could not load leave data:", e.message);
    } finally {
      setCreditsLoading(false);
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, []);

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

    if (selectedCredit?.remainingRequests === 0) {
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
});
