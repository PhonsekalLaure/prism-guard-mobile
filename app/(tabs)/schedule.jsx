import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import DeploymentCard from "@/components/schedule/DeploymentCard";
import KpiGrid from "@/components/schedule/KpiGrid";
import MonthSelector from "@/components/schedule/MonthSelector";
import RequestLeaveButton from "@/components/schedule/Requestleavebutton";
import ScheduleHeader from "@/components/schedule/Scheduleheader";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { submitAbsenceContest } from "@/services/attendanceService";
import { fetchNotificationStats } from "@/services/notificationService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import {
  getAdjacentMonth,
  getClampedDay,
  getDateKey,
  getTodayParts,
} from "@/utils/scheduleDates";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const ABSENCE_CONTEST_REASONS = [
  { code: "emergency", label: "Emergency" },
  { code: "no_mobile_data", label: "No mobile data" },
  { code: "app_issue", label: "App issue" },
  { code: "other", label: "Other" },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const { date: requestedDateParam } = useLocalSearchParams();
  const requestedDate = Array.isArray(requestedDateParam) ? requestedDateParam[0] : requestedDateParam;
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();
  const accessLoading = profileLoading || deploymentLoading;
  const today = useMemo(getTodayParts, []);
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [selectedDay, setSelectedDay] = useState(today.day);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [contestModalVisible, setContestModalVisible] = useState(false);
  const [contestReasonCode, setContestReasonCode] = useState("no_mobile_data");
  const [contestReason, setContestReason] = useState("");
  const [contestSubmitting, setContestSubmitting] = useState(false);
  const scheduleRequestSeq = useRef(0);
  const selectedDayRef = useRef(today.day);
  const hasFocusedOnceRef = useRef(false);

  const clampedSelectedDay = getClampedDay(year, month, selectedDay);
  const selectedDate = getDateKey(year, month, clampedSelectedDay);

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(requestedDate || ""))) return;

    const [nextYear, nextMonth, nextDay] = requestedDate.split("-").map(Number);
    const normalized = new Date(nextYear, nextMonth - 1, nextDay);
    if (
      normalized.getFullYear() !== nextYear
      || normalized.getMonth() !== nextMonth - 1
      || normalized.getDate() !== nextDay
    ) {
      return;
    }

    selectedDayRef.current = nextDay;
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDay(nextDay);
  }, [requestedDate]);

  const loadSchedule = useCallback(async ({ refresh = false } = {}) => {
    const requestSeq = scheduleRequestSeq.current + 1;
    scheduleRequestSeq.current = requestSeq;

    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchMonthlySchedule({ year, month });
      if (requestSeq !== scheduleRequestSeq.current) return;

      setSchedule(data);

      const nextSelectedDate = getDateKey(
        year,
        month,
        getClampedDay(year, month, selectedDayRef.current),
      );
      const hasCurrentSelection = data.scheduleDays?.some((item) => item.date === nextSelectedDate);
      if (!hasCurrentSelection && data.selectedDate) {
        const nextSelectedDay = Number(data.selectedDate.slice(-2));
        if (Number.isFinite(nextSelectedDay)) {
          selectedDayRef.current = nextSelectedDay;
          setSelectedDay(nextSelectedDay);
        }
      }
    } catch (err) {
      if (requestSeq === scheduleRequestSeq.current) {
        setError(err.message);
      }
    } finally {
      if (requestSeq === scheduleRequestSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [month, year]);

  useEffect(() => {
    if (accessLoading) {
      setSchedule(null);
      setError(null);
      setLoading(true);
      return;
    }

    loadSchedule();
  }, [accessLoading, loadSchedule]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      fetchNotificationStats()
        .then((stats) => {
          if (isMounted) setUnreadNotifications(stats.unread || 0);
        })
        .catch((err) => {
          console.warn("Could not load notifications:", err.message);
        });
      if (accessLoading) {
        return () => {
          isMounted = false;
        };
      }

      if (hasFocusedOnceRef.current) {
        loadSchedule({ refresh: true });
      } else {
        hasFocusedOnceRef.current = true;
      }
      return () => {
        isMounted = false;
      };
    }, [accessLoading, loadSchedule]),
  );

  const handleMonthChange = (offset) => {
    const next = getAdjacentMonth(year, month, offset);

    setSelectedDay((day) => {
      const nextDay = getClampedDay(next.year, next.month, day);
      selectedDayRef.current = nextDay;
      return nextDay;
    });
    setMonth(next.month);
    setYear(next.year);
  };

  const handleDayPress = (day) => {
    selectedDayRef.current = day;
    setSelectedDay(day);
  };

  const handleRefresh = () => {
    loadSchedule({ refresh: true });
  };


  const handleOpenContest = () => {
    if (!selectedShift?.scheduleId) return;
    setContestReasonCode("no_mobile_data");
    setContestReason("");
    setContestModalVisible(true);
  };

  const handleSubmitContest = async () => {
    const reasonText = contestReason.trim();
    if (reasonText.length < 10) {
      Alert.alert("Reason Required", "Please describe what happened in at least 10 characters.");
      return;
    }

    try {
      setContestSubmitting(true);
      await submitAbsenceContest({
        scheduleId: selectedShift.scheduleId,
        logDate: selectedDate,
        reasonCode: contestReasonCode,
        reasonText,
      });
      setContestModalVisible(false);
      setContestReasonCode("no_mobile_data");
      setContestReason("");
      Alert.alert("Contest Submitted", "HRIS will review your attendance contest.");
      loadSchedule({ refresh: true });
    } catch (err) {
      Alert.alert("Unable to Submit", err.message || "Please try again later.");
    } finally {
      setContestSubmitting(false);
    }
  };
  const handleRequestLeave = () => {
    if (accessLoading) {
      Alert.alert("Checking Access", "Please try again in a moment.");
      return;
    }

    if (!deployment) {
      Alert.alert("No Access", "You have no access to this right now.");
      return;
    }

    router.push("/(tabs)/leave");
  };

  const selectedShift = schedule?.scheduleDays?.find((item) => item.date === selectedDate)
    || (schedule?.selectedDate === selectedDate ? schedule?.selectedShift : null)
    || null;
  const fallbackDeployment = schedule?.deployment || null;
  const selectedDeployment = schedule?.selectedDeployment
    || (fallbackDeployment?.id && fallbackDeployment.id === selectedShift?.deploymentId
      ? fallbackDeployment
      : null)
    || null;
  const isSelectedAbsent = Boolean(schedule?.absentDates?.includes(selectedDate));
  const selectedContest = selectedShift?.contest || null;
  const canContestAbsence = Boolean(isSelectedAbsent && selectedShift?.scheduleId && !selectedContest);
  const contestStatusLabel = selectedContest?.status === "pending"
    ? "Attendance contest pending review"
    : selectedContest?.status === "approved"
    ? "Attendance contest approved"
    : selectedContest?.status === "rejected"
    ? "Attendance contest rejected"
    : null;
  const deploymentStatus = (
    selectedShift?.deploymentStatus
    || selectedDeployment?.status
    || "active"
  ).toUpperCase();

  return (
    <ScreenWrapper activeTabKey="schedule">
      <ScheduleHeader hasNotification={unreadNotifications > 0} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <MonthSelector
          month={month}
          year={year}
          onPrev={() => handleMonthChange(-1)}
          onNext={() => handleMonthChange(1)}
        />
        {loading && !schedule ? (
          <View style={styles.messageCard}>
            <ActivityIndicator />
            <Text style={styles.messageText}>Loading schedule...</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <CalendarGrid
          month={month}
          year={year}
          selectedDay={clampedSelectedDay}
          scheduledDates={schedule?.scheduledDates || []}
          lateDates={schedule?.lateDates || []}
          absentDates={schedule?.absentDates || []}
          onDayPress={handleDayPress}
        />
        <DeploymentCard
          location={selectedShift?.siteName}
          address={selectedShift?.siteAddress || selectedShift?.company}
          avatarUrl={selectedShift?.clientAvatarUrl || selectedDeployment?.clientAvatarUrl}
          timeStart={selectedShift?.shiftStart}
          timeEnd={selectedShift?.shiftEnd}
          status={deploymentStatus}
          emptyMessage="No shift scheduled for this date."
        />
        {contestStatusLabel ? (
          <View style={styles.contestStatusCard}>
            <Text style={styles.contestStatusText}>{contestStatusLabel}</Text>
            {selectedContest?.reviewNotes ? (
              <Text style={styles.contestStatusSubtext}>{selectedContest.reviewNotes}</Text>
            ) : null}
          </View>
        ) : null}
        {canContestAbsence ? (
          <Pressable style={styles.contestButton} onPress={handleOpenContest}>
            <Text style={styles.contestButtonText}>Contest Absence</Text>
          </Pressable>
        ) : null}
        <KpiGrid
          absents={schedule?.kpis?.absents || 0}
          lates={schedule?.kpis?.lates || 0}
          leaves={schedule?.kpis?.leaves || 0}
          leavesLabel="LEAVES LEFT"
          hours={schedule?.kpis?.hours || 0}
        />
        <RequestLeaveButton onPress={handleRequestLeave} />
      </ScrollView>
      <Modal
        visible={contestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !contestSubmitting && setContestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contest Absence</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>
            <View style={styles.reasonTypeGroup}>
              {ABSENCE_CONTEST_REASONS.map((reason) => {
                const selected = contestReasonCode === reason.code;
                return (
                  <Pressable
                    key={reason.code}
                    style={[styles.reasonTypeButton, selected && styles.reasonTypeButtonActive]}
                    onPress={() => setContestReasonCode(reason.code)}
                    disabled={contestSubmitting}
                  >
                    <Text style={[styles.reasonTypeText, selected && styles.reasonTypeTextActive]}>
                      {reason.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={styles.reasonInput}
              multiline
              value={contestReason}
              onChangeText={setContestReason}
              editable={!contestSubmitting}
              placeholder="Explain why you could not time in."
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setContestModalVisible(false)}
                disabled={contestSubmitting}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSubmitContest}
                disabled={contestSubmitting}
              >
                <Text style={styles.modalButtonPrimaryText}>{contestSubmitting ? "Submitting..." : "Submit"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contestStatusCard: {
    backgroundColor: "#fff7e6",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f2c46d",
  },
  contestStatusText: { color: "#7a4d00", fontWeight: "700", fontSize: 13 },
  contestStatusSubtext: { color: "#7a4d00", fontSize: 12, marginTop: 6, lineHeight: 17 },
  contestButton: {
    backgroundColor: "#1f5f8b",
    marginHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 12,
  },
  contestButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 18, width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1c2b33" },
  modalSubtitle: { color: "#6d7b84", fontSize: 13, marginTop: 4, marginBottom: 12 },
  reasonTypeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  reasonTypeButton: {
    borderWidth: 1,
    borderColor: "#d9e1e7",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  reasonTypeButtonActive: {
    borderColor: "#1f5f8b",
    backgroundColor: "#e8f2f8",
  },
  reasonTypeText: { color: "#4c5d66", fontSize: 13, fontWeight: "700" },
  reasonTypeTextActive: { color: "#1f5f8b" },
  reasonInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#d9e1e7",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1c2b33",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  modalButton: { borderRadius: 9, paddingVertical: 11, paddingHorizontal: 16 },
  modalButtonSecondary: { backgroundColor: "#eef2f5" },
  modalButtonPrimary: { backgroundColor: "#1f5f8b" },
  modalButtonSecondaryText: { color: "#1c2b33", fontWeight: "700" },
  modalButtonPrimaryText: { color: "#fff", fontWeight: "700" },
  messageCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    gap: 8,
  },
  messageText: { color: "#777", fontSize: 13 },
  errorText: { color: "#c0392b", fontSize: 13, textAlign: "center" },
});
