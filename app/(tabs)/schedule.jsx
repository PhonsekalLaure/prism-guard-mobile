import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import CalendarGrid from "@/components/schedule/CalendarGrid";
import DeploymentCard from "@/components/schedule/DeploymentCard";
import KpiGrid from "@/components/schedule/KpiGrid";
import MonthSelector from "@/components/schedule/MonthSelector";
import RequestLeaveButton from "@/components/schedule/Requestleavebutton";
import ScheduleHeader from "@/components/schedule/Scheduleheader";
import { useState } from "react";
import { ScrollView } from "react-native";

export default function ScheduleScreen() {
  const [month, setMonth] = useState(1); // Feb = 1w
  const [year, setYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(9);

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
      <ScheduleHeader hasNotification />
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
        <RequestLeaveButton onPress={() => {}} />
      </ScrollView>
    </ScreenWrapper>
  );
}
