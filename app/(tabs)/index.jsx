import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import AnnouncementList from "@/components/dashboard/AnnouncementList";
import ClockOutModal from "@/components/dashboard/Clockoutmodal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NotificationToast from "@/components/dashboard/Notificationtoast";
import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import ShiftStatusCard from "@/components/dashboard/Shiftstatuscard";
import TimeInButton from "@/components/dashboard/TimeinButton";
import { PrismSpacing } from "@/constants/prismTheme";
import { useDeployment } from "@/hooks/useDeployment"; // 👈
import { useProfile } from "@/hooks/useProfile";
import { validateGuardLocation } from "@/utils/geofence"; // 👈
import { useRouter } from "expo-router"; // 👈

const ANNOUNCEMENTS = [
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

const formatDate = () => {
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
  const mins = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = String(hours % 12 || 12).padStart(2, "0");
  return `${day}, ${month} ${date} • ${h}:${mins} ${ampm}`;
};

export default function DashboardScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateString, setDateString] = useState(formatDate());
  const [toast, setToast] = useState({
    visible: false,
    icon: "📍",
    title: "",
    message: "",
    type: "success",
  });

  const toastTimeout = useRef(null);
  const { fullName, profile } = useProfile(); // 👈 added profile
  const { deployment } = useDeployment(profile?.id); // 👈 fetch active deployment
  const router = useRouter(); // 👈

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

  const handleMainAction = async () => {
    if (!isOnDuty) {
      try {
        setLoading(true);

        if (!deployment?.client_sites) {
          showToast({
            icon: "⚠️",
            title: "No Active Deployment",
            message: "You have no active site assignment.",
            type: "error",
          });
          return;
        }

        // Pass the site directly — no extra fetch needed
        const result = await validateGuardLocation(deployment.client_sites);

        if (!result.isInside) {
          showToast({
            icon: "❌",
            title: "Outside Geofence",
            message: `You are ${result.distance}m away. Must be within ${result.post.geofence_radius_meters}m.`,
            type: "error",
          });
          return;
        }

        setIsOnDuty(true);

        router.push({
          pathname: "/check-in-confirmation",
          params: {
            post: JSON.stringify(result.post),
            guardCoords: JSON.stringify(result.coords),
            distance: result.distance,
            checkType: "shift_start",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        showToast({
          icon: "⚠️",
          title: "Error",
          message: "Something went wrong. Please try again.",
          type: "error",
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <ScreenWrapper activeTabKey="home">
      <DashboardHeader
        officerName={`Officer ${fullName}`}
        dateString={dateString}
        hasNotification
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <ShiftStatusCard
          shiftStart="07:00"
          shiftEnd="19:00"
          location={deployment?.client_sites?.site_name || "No Site Assigned"} // 👈
          isOnDuty={isOnDuty}
        />
        <TimeInButton
          isOnDuty={isOnDuty}
          onPress={handleMainAction}
          disabled={loading}
        />
        <AnnouncementList
          announcements={ANNOUNCEMENTS}
          onSeeAll={() => {}}
          onItemPress={() => {}}
        />
      </ScrollView>

      <NotificationToast {...toast} />

      <ClockOutModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={() => {
          setShowModal(false);
          setIsOnDuty(false);
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: PrismSpacing.xs },
});
