import type { Announcement } from "@/components/dashboard/AnnouncementList";
import AnnouncementList from "@/components/dashboard/AnnouncementList";
import BottomTabBar from "@/components/dashboard/BottomTabBar";
import ClockOutModal from "@/components/dashboard/ClockOutModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NotificationToast from "@/components/dashboard/NotificationToast";
import ShiftStatusCard from "@/components/dashboard/ShiftStatusCard";
import TimeInButton from "@/components/dashboard/TimeInButton";
import { PrismColors, PrismSpacing } from "@/constants/prismTheme";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

// ── Sample data ──────────────────────────────────────────────────────────────
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "1",
    title: "New Uniform Policy",
    preview: "All officers must wear the new insignia starting Monday.",
  },
  {
    id: "2",
    title: "SOSIA MEMORANDUM ADVISORY 064-2025",
    preview: "This pertains to the Memorandum issued of PNP-SOSIA...",
  },
  {
    id: "3",
    title: "Gate 3 Maintenance",
    preview: "Electric gate repair scheduled for 14:00 today.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (): string => {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
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
  const day = dayNames[now.getDay()];
  const month = monthNames[now.getMonth()];
  const date = now.getDate();
  const hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = (hours % 12 || 12).toString().padStart(2, "0");
  return `${day}, ${month} ${date} • ${h}:${mins} ${ampm}`;
};

// ── Toast state type ─────────────────────────────────────────────────────────
interface ToastState {
  visible: boolean;
  icon: string;
  title: string;
  message: string;
  type: "success" | "warning" | "error";
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "home" | "schedule" | "payslip" | "profile"
  >("home");
  const [dateString, setDateString] = useState(formatDate());
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    icon: "📍",
    title: "",
    message: "",
    type: "success",
  });

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setDateString(formatDate()), 60000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (data: Omit<ToastState, "visible">) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, ...data });
    toastTimeout.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000,
    );
  };

  const handleMainAction = () => {
    if (!isOnDuty) {
      setIsOnDuty(true);
      showToast({
        icon: "📍",
        title: "GPS Verified",
        message: "Location confirmed. You are clocked in.",
        type: "success",
      });
    } else {
      setShowModal(true);
    }
  };

  const handleConfirmClockOut = () => {
    setShowModal(false);
    setIsOnDuty(false);
    showToast({
      icon: "✅",
      title: "Shift Ended",
      message: "You have successfully clocked out.",
      type: "success",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <DashboardHeader
          officerName="Officer Juan Cruz"
          dateString={dateString}
          hasNotification
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ShiftStatusCard
            shiftStart="07:00"
            shiftEnd="19:00"
            location="SM Mall of Asia"
            isOnDuty={isOnDuty}
          />

          <TimeInButton isOnDuty={isOnDuty} onPress={handleMainAction} />

          <AnnouncementList
            announcements={ANNOUNCEMENTS}
            onSeeAll={() => {}}
            onItemPress={() => {}}
          />

          <View style={{ height: 90 }} />
        </ScrollView>

        <BottomTabBar
          activeTab={activeTab}
          onTabPress={setActiveTab}
          onFabPress={() => {}}
        />

        <NotificationToast
          visible={toast.visible}
          icon={toast.icon}
          title={toast.title}
          message={toast.message}
          type={toast.type}
        />

        <ClockOutModal
          visible={showModal}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmClockOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PrismColors.navy,
  },
  screen: {
    flex: 1,
    backgroundColor: PrismColors.offWhite,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: PrismSpacing.xs,
  },
});
