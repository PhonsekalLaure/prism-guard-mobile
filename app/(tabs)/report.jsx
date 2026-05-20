import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { useDeployment } from "@/hooks/useDeployment";
import { useProfile } from "@/hooks/useProfile";
import incidentService from "@/services/incidentService";

// Helpers
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
  return `${day}, ${month} ${dateNum} • ${hours}:${minutes} ${ampm}`;
};

export default function ReportScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { deployment } = useDeployment(profile?.id);
  const [narrative, setNarrative] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const incidentTime = formatDateTime(new Date());
  const locationLabel = deployment?.client_sites?.site_name || "Current assigned site";

  const handleSubmitPress = () => {
    if (submitting) return;

    if (narrative.trim().length < 5) {
      Alert.alert(
        "Incomplete Report",
        "Please enter incident details before submitting.",
      );
      return;
    }
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const incident = await incidentService.submitIncidentReport(narrative.trim());
      setModalVisible(false);
      Alert.alert(
        "Report Submitted",
        `Report ${incident?.id ? `#${incident.id.slice(0, 8)}` : ""} submitted for operations review.`,
        [{ text: "OK", onPress: () => setNarrative("") }],
      );
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        err.message || "Unable to submit the incident report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper activeTabKey="report">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/notifications")}
          style={styles.headerBtn}
        >
          <Ionicons
            name="notifications-outline"
          size={22}
          color={PrismColors.gold}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
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
      </ScrollView>

      {/* Review Modal */}
      <ReviewModal
        visible={modalVisible}
        location={locationLabel}
        time={incidentTime}
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
});
