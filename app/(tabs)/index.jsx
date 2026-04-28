import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AnnouncementList from "@/components/dashboard/AnnouncementList";
import ClockOutModal from "@/components/dashboard/Clockoutmodal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NotificationToast from "@/components/dashboard/Notificationtoast";
import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import ShiftStatusCard from "@/components/dashboard/Shiftstatuscard";
import TimeInButton from "@/components/dashboard/TimeinButton";
import { PrismSpacing } from "@/constants/prismTheme";

const ANNOUNCEMENTS = [
  { id: "1", title: "New Uniform Policy", preview: "All officers must wear the new insignia starting Monday." },
  { id: "2", title: "SOSIA MEMORANDUM ADVISORY 064-2025", preview: "This pertains to the Memorandum issued of PNP-SOSIA..." },
  { id: "3", title: "Gate 3 Maintenance", preview: "Electric gate repair scheduled for 14:00 today." },
];

const formatDate = () => {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = dayNames[now.getDay()];
  const month = monthNames[now.getMonth()];
  const date = now.getDate();
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = String(hours % 12 || 12).padStart(2, "0");
  return `${day}, ${month} ${date} • ${h}:${mins} ${ampm}`;
};

export default function DashboardScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dateString, setDateString] = useState(formatDate());
  const [toast, setToast] = useState({
    visible: false, icon: "📍", title: "", message: "", type: "success",
  });
  const toastTimeout = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setDateString(formatDate()), 60000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (data) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, ...data });
    toastTimeout.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleMainAction = () => {
    if (!isOnDuty) {
      setIsOnDuty(true);
      showToast({ icon: "📍", title: "GPS Verified", message: "Location confirmed. You are clocked in.", type: "success" });
    } else {
      setShowModal(true);
    }
  };

  return (
    <ScreenWrapper activeTabKey="home">
      <DashboardHeader
        officerName="Officer Juan Cruz"
        dateString={dateString}
        hasNotification
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ShiftStatusCard shiftStart="07:00" shiftEnd="19:00" location="SM Mall of Asia" isOnDuty={isOnDuty} />
        <TimeInButton isOnDuty={isOnDuty} onPress={handleMainAction} />
        <AnnouncementList announcements={ANNOUNCEMENTS} onSeeAll={() => {}} onItemPress={() => {}} />
        <View style={{ height: 90 }} />
      </ScrollView>

      <NotificationToast {...toast} />

      <ClockOutModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={() => { setShowModal(false); setIsOnDuty(false); }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: PrismSpacing.xs },
});