import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import DeploymentCard from "@/components/schedule/DeploymentCard";
import KpiGrid from "@/components/schedule/KpiGrid";
import MonthSelector from "@/components/schedule/MonthSelector";
import RequestLeaveButton from "@/components/schedule/Requestleavebutton";
import ScheduleHeader from "@/components/schedule/Scheduleheader";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { fetchLeaveCredits } from "@/services/leaveService";
import { fetchNotificationStats } from "@/services/notificationService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import { fetchNotificationStats } from "@/services/notificationService";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

function getTodayParts() {
  const today = new Date();
  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    day: today.getDate(),
  };
}
import {
  getAdjacentMonth,
  getClampedDay,
  getDateKey,
  getTodayParts,
} from "@/utils/scheduleDates";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

function getAvailableLeaveCredits(credits) {
  return typeof credits === "number" ? credits : credits?.availableCredits ?? 0;
}

export default function ScheduleScreen() {
  const router = useRouter();
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
  const [leaveCreditsError, setLeaveCreditsError] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [availableLeaveCredits, setAvailableLeaveCredits] = useState(0);
  const scheduleRequestSeq = useRef(0);
  const selectedDayRef = useRef(today.day);
  const hasFocusedOnceRef = useRef(false);

  const clampedSelectedDay = getClampedDay(year, month, selectedDay);
  const selectedDate = getDateKey(year, month, clampedSelectedDay);

  const loadLeaveCredits = useCallback(async () => {
    try {
      setLeaveCreditsError(null);
      const credits = await fetchLeaveCredits();
      setAvailableLeaveCredits(getAvailableLeaveCredits(credits));
    } catch (err) {
      setLeaveCreditsError(err.message || "Could not load leave credits.");
    }
  }, []);

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
      return () => { isMounted = false; };
    }, [])
  );

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
    loadSchedule();
  }, [loadSchedule]);

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleDayPress = (day) => setSelectedDay(day);
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
      loadLeaveCredits();

      return () => {
        isMounted = false;
      };
    }, [accessLoading, loadLeaveCredits, loadSchedule]),
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
    loadLeaveCredits();
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
        <MonthSelector month={month} year={year} onPrev={handlePrev} onNext={handleNext} />
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
        {leaveCreditsError ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{leaveCreditsError}</Text>
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
        <KpiGrid
          absents={schedule?.kpis?.absents || 0}
          lates={schedule?.kpis?.lates || 0}
          leaves={availableLeaveCredits}
          leavesLabel="LEAVES LEFT"
          hours={schedule?.kpis?.hours || 0}
        />
        <RequestLeaveButton onPress={handleRequestLeave} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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