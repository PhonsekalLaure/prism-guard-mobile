import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import CheckInMap from "@/components/check-in/CheckInMap";
import AnnouncementList from "@/components/dashboard/AnnouncementList";
import ClockOutModal from "@/components/dashboard/Clockoutmodal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NotificationToast from "@/components/dashboard/Notificationtoast";
import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import ShiftStatusCard from "@/components/dashboard/Shiftstatuscard";
import TimeInButton from "@/components/dashboard/TimeinButton";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { useActiveDeploymentAccess } from "@/hooks/useActiveDeploymentAccess";
import { useGeofenceMonitor } from "@/hooks/useGeofenceMonitor";
import {
  clockIn,
  clockOut,
  fetchActiveAttendance,
} from "@/services/attendanceService";
import { fetchAnnouncements } from "@/services/announcementsService";
import { fetchNotificationStats } from "@/services/notificationService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import { validateGuardLocation } from "@/utils/geofence";
import { getDateKey, getTodayParts } from "@/utils/scheduleDates";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";

const CHECK_TYPE_LABELS = {
  shift_start: "Time In",
  logout: "Time Out",
};

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

const parseShiftDateTime = (dateKey, timeValue) => {
  if (!dateKey || !timeValue) return null;

  const text = String(timeValue).trim();
  if (!text || text === "--") return null;

  const isoDate = new Date(text);
  if (text.includes("T") && !Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const match = text.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) {
    return null;
  }

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const formatDuration = (milliseconds) => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatAttendanceTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatVerificationTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const time = date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = date.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${time} - ${day}`;
};

const formatDistanceMeters = (value) => {
  const meters = Math.round(Number(value) || 0);
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })} km`;
  }

  return `${meters} m`;
};

const getShiftTiming = ({ dateKey, shiftStart, shiftEnd, now }) => {
  const startAt = parseShiftDateTime(dateKey, shiftStart);
  const endAt = parseShiftDateTime(dateKey, shiftEnd);

  if (!startAt || !endAt) {
    return {
      hasRemainingTime: false,
      dashboardLabel: "Schedule time unavailable",
      clockOutMessage: "No scheduled shift end is available. Confirm with your supervisor before clocking out.",
    };
  }

  const normalizedEndAt = new Date(endAt);
  if (normalizedEndAt <= startAt) {
    normalizedEndAt.setDate(normalizedEndAt.getDate() + 1);
  }

  const remainingMs = normalizedEndAt.getTime() - now.getTime();
  if (remainingMs > 0) {
    const remainingLabel = formatDuration(remainingMs);
    return {
      hasRemainingTime: true,
      dashboardLabel: `${remainingLabel} before time out`,
      clockOutMessage: `There is still ${remainingLabel} before your scheduled shift end. Do you still want to clock out?`,
    };
  }

  return {
    hasRemainingTime: false,
    dashboardLabel: "Shift end reached",
    clockOutMessage: "Your scheduled shift end has been reached. Confirm to clock out.",
  };
};

const AttendanceMapCard = ({
  site,
  result,
  isOnDuty,
  loading,
  onActionPress,
}) => {
  if (!site) return null;

  const post = result?.post || site;
  const guardCoords = result?.guardCoords || {
    latitude: post.latitude,
    longitude: post.longitude,
  };
  const hasResult = Boolean(result);
  const isInside = hasResult ? Boolean(result.isInside) : true;
  const label = CHECK_TYPE_LABELS[result?.checkType] || "Attendance";
  const circleColor = !hasResult
    ? "rgba(230, 178, 21, 0.9)"
    : isInside ? "rgba(76, 175, 80, 0.9)" : "rgba(244, 67, 54, 0.9)";
  const circleFill = !hasResult
    ? "rgba(230, 178, 21, 0.16)"
    : isInside ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)";
  const statusText = !hasResult
    ? "Ready to verify location"
    : isInside
    ? `${label} recorded`
    : `Outside geofence - ${label} blocked`;

  return (
    <View style={styles.verificationCard}>
      <View style={styles.verificationMapWrap}>
        <CheckInMap
          style={styles.verificationMap}
          post={post}
          guardCoords={guardCoords}
          circleFill={circleFill}
          circleColor={circleColor}
          isInside={isInside}
        />
      </View>

      <View style={styles.verificationActionDock}>
        <View style={styles.verificationActionButton}>
          <TimeInButton
            isOnDuty={isOnDuty}
            onPress={onActionPress}
            disabled={loading}
            compact
          />
        </View>
      </View>

      <View style={styles.verificationBody}>
        <View style={styles.verificationStatusRow}>
          <View
            style={[
              styles.verificationBadge,
              !hasResult
                ? styles.verificationBadgeReady
                : isInside ? styles.verificationBadgeInside : styles.verificationBadgeOutside,
            ]}
          >
            <Text
              style={[
                styles.verificationBadgeText,
                !hasResult
                  ? styles.verificationTextReady
                  : isInside ? styles.verificationTextInside : styles.verificationTextOutside,
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>

          <Text style={styles.verificationTimestamp} numberOfLines={1}>
            {hasResult
              ? formatVerificationTimestamp(result.timestamp)
              : "Tap button to verify"}
          </Text>
        </View>

        <View style={styles.verificationStats}>
          <View style={styles.verificationStat}>
            <Text style={styles.verificationStatLabel}>Distance</Text>
            <Text
              style={[
                styles.verificationStatValue,
                !hasResult
                  ? styles.verificationTextReady
                  : isInside ? styles.verificationTextInside : styles.verificationTextOutside,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {hasResult ? formatDistanceMeters(result.distance) : "--"}
            </Text>
          </View>
          <View style={styles.verificationStat}>
            <Text style={styles.verificationStatLabel}>Radius</Text>
            <Text
              style={styles.verificationStatValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {formatDistanceMeters(post.geofence_radius_meters)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [activeAttendanceLog, setActiveAttendanceLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [dateString, setDateString] = useState(formatDate());
  const [now, setNow] = useState(new Date());
  const [locationVerification, setLocationVerification] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    icon: "📍",
    title: "",
    message: "",
    type: "success",
  });

  const toastTimeout = useRef(null);
  const {
    deployment,
    fullName,
    loading: deploymentAccessLoading,
    profile,
  } = useActiveDeploymentAccess();
  const router = useRouter();
  const isFocused = useIsFocused();

  useGeofenceMonitor(deployment, {
    attendanceLogId: activeAttendanceLog?.id,
    enabled: Boolean(profile?.id && isFocused && isOnDuty),
  });

  useEffect(() => {
    const updateClock = () => {
      setNow(new Date());
      setDateString(formatDate());
    };
    const interval = setInterval(updateClock, 60000);
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

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id || deploymentAccessLoading || !deployment) {
        setTodaySchedule(null);
        return undefined;
      }

      let isMounted = true;
      const today = getTodayParts();
      const selectedDate = getDateKey(today.year, today.month, today.day);

      fetchMonthlySchedule({
        year: today.year,
        month: today.month,
        selectedDate,
      })
        .then((data) => {
          if (isMounted) setTodaySchedule(data);
        })
        .catch((err) => {
          if (isMounted) setTodaySchedule(null);
          console.warn("Could not load today's schedule:", err.message);
        });

      return () => {
        isMounted = false;
      };
    }, [deployment, deploymentAccessLoading, profile?.id]),
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
        const timestamp = new Date().toISOString();
        setLocationVerification({
          post: result.post,
          guardCoords: result.coords,
          distance: result.distance,
          checkType: "shift_start",
          timestamp,
          isInside: result.isInside,
        });

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

      if (!deployment?.client_sites) {
        throw new Error("No active site assignment found.");
      }

      const position = await validateGuardLocation(deployment.client_sites);
      const timestamp = new Date().toISOString();

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
      setLocationVerification({
        post: position.post,
        guardCoords: position.coords,
        distance: position.distance,
        checkType: "logout",
        timestamp,
        isInside: position.isInside,
      });
    } catch (err) {
      console.error("Clock-out failed:", err);
      setIsOnDuty(Boolean(activeAttendanceLog));
      showToast({
        icon: "!",
        title: "Clock-out Failed",
        message: err.message || "Could not clock out. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const today = getTodayParts();
  const todayDateKey = getDateKey(today.year, today.month, today.day);
  const todayShift = todaySchedule?.scheduleDays?.find((item) => item.date === todayDateKey)
    || (todaySchedule?.selectedDate === todayDateKey ? todaySchedule?.selectedShift : null)
    || null;
  // If there's no shift for today, try to pick a sensible fallback from the schedule:
  let fallbackShift = null;
  if (!todayShift && todaySchedule?.scheduleDays?.length) {
    // prefer schedule's selectedShift if available
    if (todaySchedule.selectedShift) {
      fallbackShift = todaySchedule.selectedShift;
    } else {
      const depId = deployment?.id || deployment?.deploymentId || null;
      const siteId = deployment?.site_id || deployment?.client_sites?.id || null;

      // try to find a shift that matches current deployment/site
      fallbackShift = todaySchedule.scheduleDays.find((d) => (
        (d.deploymentId && depId && d.deploymentId === depId) ||
        (d.siteId && siteId && d.siteId === siteId) ||
        (d.siteId && deployment?.client_sites && d.siteId === deployment.client_sites.id) ||
        (d.siteId && deployment?.client_sites && d.siteId === deployment.client_sites.site_id)
      ));

      // if none matched, pick the next available day on or after today
      if (!fallbackShift) {
        fallbackShift = todaySchedule.scheduleDays.find((d) => d.date >= todayDateKey) || todaySchedule.scheduleDays[0];
      }
    }
  }
  const deploymentShiftStart = deployment?.shift_start || deployment?.shiftStart || deployment?.start_time;
  const deploymentShiftEnd = deployment?.shift_end || deployment?.shiftEnd || deployment?.end_time;
  const displayShiftStart = todayShift?.shiftStart || fallbackShift?.shiftStart || deploymentShiftStart || "--";
  const displayShiftEnd = todayShift?.shiftEnd || fallbackShift?.shiftEnd || deploymentShiftEnd || "--";
  const formatShiftDisplay = (dateKey, value) => {
    if (!value || value === "--") return "--";
    const dt = parseShiftDateTime(dateKey, value);
    if (!dt) return String(value);
    return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const displayShiftStartFormatted = formatShiftDisplay(todayDateKey, displayShiftStart);
  const displayShiftEndFormatted = formatShiftDisplay(todayDateKey, displayShiftEnd);
  const shiftTiming = getShiftTiming({
    dateKey: todayDateKey,
    shiftStart: displayShiftStart,
    shiftEnd: displayShiftEnd,
    now,
  });
  const clockInTime = formatAttendanceTime(activeAttendanceLog?.clockIn);

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
          shiftStart={displayShiftStartFormatted}
          shiftEnd={displayShiftEndFormatted}
          location={deployment?.client_sites?.site_name || "No Site Assigned"}
          isOnDuty={isOnDuty}
          hasDeployment={Boolean(deployment)}
          isCheckingDeployment={deploymentAccessLoading}
          clockInTime={clockInTime}
          dutyTimingLabel={shiftTiming.dashboardLabel}
          hasRemainingTime={shiftTiming.hasRemainingTime}
        />
        {deployment?.client_sites ? (
          <AttendanceMapCard
            site={deployment.client_sites}
            result={locationVerification}
            isOnDuty={isOnDuty}
            loading={loading}
            onActionPress={handleMainAction}
          />
        ) : (
          <TimeInButton
            isOnDuty={isOnDuty}
            onPress={handleMainAction}
            disabled={loading}
          />
        )}
        <AnnouncementList
          announcements={announcements}
          loading={announcementsLoading}
          error={announcementsError}
          onSeeAll={() => router.push("/announcements")}
          onItemPress={(item) => router.push(`/announcement/${item.id}`)}
        />
      </ScrollView>

      <NotificationToast {...toast} />

      <ClockOutModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleClockOut}
        timingMessage={shiftTiming.clockOutMessage}
        hasRemainingTime={shiftTiming.hasRemainingTime}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: PrismSpacing.xs },
  verificationCard: {
    position: "relative",
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    marginHorizontal: PrismSpacing.base,
    marginBottom: PrismSpacing.md,
    overflow: "hidden",
    ...PrismShadows.card,
  },
  verificationMapWrap: {
    position: "relative",
  },
  verificationMap: {
    height: 156,
  },
  verificationActionDock: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 117,
    zIndex: 10,
    alignItems: "center",
  },
  verificationActionButton: {
    height: 78,
    justifyContent: "center",
  },
  verificationBody: {
    paddingHorizontal: PrismSpacing.md,
    paddingTop: 48,
    paddingBottom: PrismSpacing.sm,
    gap: PrismSpacing.sm,
  },
  verificationStatusRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
  },
  verificationBadge: {
    flex: 1,
    alignSelf: "center",
    borderRadius: PrismRadius.full,
    paddingHorizontal: PrismSpacing.sm,
    paddingVertical: PrismSpacing.xs,
  },
  verificationBadgeReady: {
    backgroundColor: PrismColors.gold + "18",
  },
  verificationBadgeInside: {
    backgroundColor: PrismColors.success + "18",
  },
  verificationBadgeOutside: {
    backgroundColor: PrismColors.danger + "18",
  },
  verificationBadgeText: {
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    textTransform: "uppercase",
  },
  verificationTextReady: {
    color: PrismColors.warning,
  },
  verificationTextInside: {
    color: PrismColors.success,
  },
  verificationTextOutside: {
    color: PrismColors.danger,
  },
  verificationTimestamp: {
    maxWidth: 126,
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    textAlign: "right",
  },
  verificationStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: PrismSpacing.sm,
  },
  verificationStat: {
    flex: 1,
    minWidth: 0,
    borderRadius: PrismRadius.md,
    backgroundColor: PrismColors.offWhite,
    paddingHorizontal: PrismSpacing.sm,
    paddingVertical: PrismSpacing.xs,
  },
  verificationStatLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    marginBottom: 1,
  },
  verificationStatValue: {
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.extraBold,
    color: PrismColors.textPrimary,
  },
});
