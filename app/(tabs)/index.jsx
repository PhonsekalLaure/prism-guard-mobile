import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import AnnouncementList from "@/components/dashboard/AnnouncementList";
import ClockOutModal from "@/components/dashboard/Clockoutmodal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NotificationToast from "@/components/dashboard/Notificationtoast";
import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import ShiftStatusCard from "@/components/dashboard/Shiftstatuscard";
import TimeInButton from "@/components/dashboard/TimeinButton";
import { PrismSpacing } from "@/constants/prismTheme";
import { useDeployment } from "@/hooks/useDeployment";
import { useProfile } from "@/hooks/useProfile";
import {
  clockIn,
  clockOut,
  fetchActiveAttendance,
} from "@/services/attendanceService";
import { fetchAnnouncements } from "@/services/announcementsService";
import { fetchNotificationStats } from "@/services/notificationService";
import { validateGuardLocation } from "@/utils/geofence";
import { useFocusEffect, useRouter } from "expo-router";

const formatDate = () => {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
  const [activeAttendanceLog, setActiveAttendanceLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [dateString, setDateString] = useState(formatDate());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    icon: "📍",
    title: "",
    message: "",
    type: "success",
  });

  const toastTimeout = useRef(null);
  const { fullName, profile } = useProfile();
  const { deployment } = useDeployment(profile?.id);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => setDateString(formatDate()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError(null);
        const data = await fetchAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        setAnnouncementsError(err.message);
        console.warn("Could not load announcements:", err.message);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    loadAnnouncements();
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return undefined;

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
    }, [profile?.id]),
  );

  useEffect(() => {
    if (!profile?.id) return;

    const loadActiveAttendance = async () => {
      try {
        const attendanceLog = await fetchActiveAttendance();
        setActiveAttendanceLog(attendanceLog);
        setIsOnDuty(Boolean(attendanceLog));
      } catch (err) {
        console.warn("Could not load active attendance:", err.message);
      }
    };

    loadActiveAttendance();
  }, [profile?.id]);

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

        const result = await validateGuardLocation(deployment.client_sites);

        // Only clock in if inside geofence.
        if (result.isInside) {
          const { attendanceLog } = await clockIn({
            siteId: deployment.site_id || deployment.client_sites.id,
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          });

          setActiveAttendanceLog(attendanceLog);
          setIsOnDuty(true);
        } else {
          showToast({
            icon: "!",
            title: "Outside Geofence",
            message: "You must be inside your assigned site to clock in.",
            type: "error",
          });
        }

        // Always show map — inside or outside
        router.push({
          pathname: "/check-in-confirmation",
          params: {
            post:        JSON.stringify(result.post),
            guardCoords: JSON.stringify(result.coords),
            distance:    result.distance,
            checkType:   "shift_start",
            timestamp:   new Date().toISOString(),
            isInside:    String(result.isInside),
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

  const handleClockOut = async () => {
    setShowModal(false);

    try {
      setLoading(true);

      if (deployment?.client_sites) {
        const position = await validateGuardLocation(deployment.client_sites);

        if (!activeAttendanceLog?.id) {
          throw new Error("No active attendance log found.");
        }

        await clockOut({
          attendanceLogId: activeAttendanceLog.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setActiveAttendanceLog(null);
        setIsOnDuty(false);

        router.push({
          pathname: "/check-in-confirmation",
          params: {
            post:        JSON.stringify(position.post),
            guardCoords: JSON.stringify(position.coords),
            distance:    position.distance,
            checkType:   "logout",
            timestamp:   new Date().toISOString(),
            isInside:    String(position.isInside),
          },
        });
      }
    } catch (err) {
      console.error("Clock-out failed:", err);
      setIsOnDuty(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper activeTabKey="home">
      <DashboardHeader
        officerName={`Officer ${fullName}`}
        dateString={dateString}
        hasNotification={unreadNotifications > 0}
        onBellPress={() => router.push("/notifications")}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <ShiftStatusCard
          shiftStart="07:00"
          shiftEnd="19:00"
          location={deployment?.client_sites?.site_name || "No Site Assigned"}
          isOnDuty={isOnDuty}
        />
        <TimeInButton
          isOnDuty={isOnDuty}
          onPress={handleMainAction}
          disabled={loading}
        />
        <AnnouncementList
          announcements={announcements}
          loading={announcementsLoading}
          error={announcementsError}
          onSeeAll={() => {}}
          onItemPress={() => {}}
        />
      </ScrollView>

      <NotificationToast {...toast} />

      <ClockOutModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleClockOut}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: PrismSpacing.xs },
});
