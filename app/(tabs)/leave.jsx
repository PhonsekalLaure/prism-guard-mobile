import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import {
    fetchLeaveCredits,
    submitLeaveRequest,
} from "@/services/leaveService";
import LeaveBalanceCard from "../../components/leave/LeaveBalanceCard";
import LeaveForm from "../../components/leave/LeaveForm";
import LeaveHeader from "../../components/leave/LeaveHeader";
import ReviewLeaveModal from "../../components/leave/ReviewLeaveModal";

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

  // Fetch leave credits from DB on mount
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const result = await fetchLeaveCredits();
        setCredits(result);
      } catch (e) {
        console.warn("Could not load leave credits:", e.message);
      } finally {
        setCreditsLoading(false);
      }
    };
    loadCredits();
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
      setModalVisible(false);
      Alert.alert(
        "Request Submitted",
        "Your leave request has been sent for approval.",
        [{ text: "OK", onPress: () => router.back() }],
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

  return (
    <ScreenWrapper activeTabKey="schedule">
      <LeaveHeader onBack={() => router.back()} />

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
