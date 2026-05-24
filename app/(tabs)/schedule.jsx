import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import DeploymentCard from "@/components/schedule/DeploymentCard";
import KpiGrid from "@/components/schedule/KpiGrid";
import MonthSelector from "@/components/schedule/MonthSelector";
import RequestLeaveButton from "@/components/schedule/Requestleavebutton";
import ScheduleHeader from "@/components/schedule/Scheduleheader";
import { fetchNotificationStats } from "@/services/notificationService";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView } from "react-native";

export default function ScheduleScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(1); // Feb = 1w
  const [year, setYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(9);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  return (
    <ScreenWrapper activeTabKey="schedule">
      <ScheduleHeader hasNotification={unreadNotifications > 0} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <MonthSelector
          month={month}
          year={year}
          onPrev={handlePrev}
          onNext={handleNext}
        />
        <CalendarGrid
          month={month}
          year={year}
          selectedDay={selectedDay}
          onDayPress={setSelectedDay}
        />
        <DeploymentCard />
        <KpiGrid />
        <RequestLeaveButton onPress={() => router.push("/(tabs)/leave")} />
      </ScrollView>
    </ScreenWrapper>
  );
}
