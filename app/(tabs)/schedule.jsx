import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import DeploymentCard from "@/components/schedule/DeploymentCard";
import KpiGrid from "@/components/schedule/KpiGrid";
import MonthSelector from "@/components/schedule/MonthSelector";
import RequestLeaveButton from "@/components/schedule/Requestleavebutton";
import ScheduleHeader from "@/components/schedule/Scheduleheader";
import { fetchNotificationStats } from "@/services/notificationService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
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

function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const today = useMemo(getTodayParts, []);
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [selectedDay, setSelectedDay] = useState(today.day);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const selectedDate = getDateKey(year, month, selectedDay);

  const loadSchedule = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchMonthlySchedule({ year, month, selectedDate });
      setSchedule(data);

      if (data.selectedDate) {
        const nextSelectedDay = Number(data.selectedDate.slice(-2));
        if (Number.isFinite(nextSelectedDay)) {
          setSelectedDay(nextSelectedDay);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, selectedDate, year]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

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

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handleDayPress = (day) => {
    setSelectedDay(day);
  };

  const selectedShift = schedule?.scheduleDays?.find((item) => item.date === selectedDate)
    || schedule?.selectedShift
    || null;
  const deploymentStatus = schedule?.deployment?.status?.toUpperCase?.() || "ACTIVE";

  return (
    <ScreenWrapper activeTabKey="schedule">
      <ScheduleHeader hasNotification={unreadNotifications > 0} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSchedule({ refresh: true })} />
        }
      >
        <MonthSelector
          month={month}
          year={year}
          onPrev={handlePrev}
          onNext={handleNext}
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
          selectedDay={selectedDay}
          scheduledDates={schedule?.scheduledDates || []}
          onDayPress={handleDayPress}
        />
        <DeploymentCard
          location={selectedShift?.siteName}
          address={selectedShift?.siteAddress || selectedShift?.company}
          timeStart={selectedShift?.shiftStart}
          timeEnd={selectedShift?.shiftEnd}
          status={deploymentStatus}
          emptyMessage="No shift scheduled for this date."
        />
        <KpiGrid
          absents={schedule?.kpis?.absents || 0}
          lates={schedule?.kpis?.lates || 0}
          leaves={schedule?.kpis?.leaves || 0}
          hours={schedule?.kpis?.hours || 0}
        />
        <RequestLeaveButton onPress={() => router.push("/(tabs)/leave")} />
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
