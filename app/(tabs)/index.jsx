import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";

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
import {
  clockIn,
  clockOut,
  fetchActiveAttendance,
} from "@/services/attendanceService";
import { fetchAllAnnouncements } from "@/services/announcementsService";
import { fetchNotificationStats } from "@/services/notificationService";
import { fetchMonthlySchedule } from "@/services/scheduleService";
import dashboardShiftTiming from "@/utils/dashboardShiftTiming";
import { validateGuardLocation } from "@/utils/geofence";
import { getBusinessDateKey, getDateKey, getTodayParts } from "@/utils/scheduleDates";
import { useFocusEffect, useRouter } from "expo-router";

const CHECK_TYPE_LABELS = {
  shift_start: "Time In",
  logout: "Time Out",
};
const SHIFT_END_REMINDER_PREFIX = "shift_end_reminders";
const SHIFT_END_REMINDERS = [
  { minutesBeforeEnd: 60, title: "Shift ending in 1 hour" },
  { minutesBeforeEnd: 30, title: "Shift ending in 30 minutes" },
];
const CLOCK_OUT_UNLOCK_WINDOW_MS = 60 * 60 * 1000;
const BUSINESS_TIME_ZONE = "Asia/Manila";
const BUSINESS_UTC_OFFSET = "+08:00";
const { getActionableShift, getShiftClockInAvailability } = dashboardShiftTiming;

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

  return new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${BUSINESS_UTC_OFFSET}`,
  );
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
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
};

const getShiftStartEnd = (dateKey, shiftStart, shiftEnd) => {
  const startAt = parseShiftDateTime(dateKey, shiftStart);
  const endAt = parseShiftDateTime(dateKey, shiftEnd);
  if (!startAt || !endAt) return null;

  const normalizedEndAt = new Date(endAt);
  if (normalizedEndAt <= startAt) {
    normalizedEndAt.setDate(normalizedEndAt.getDate() + 1);
  }

  return { startAt, endAt: normalizedEndAt };
};


const getActiveShiftDateKey = ({ logDate, clockIn, shiftStart, shiftEnd }) => {
  const clockInDateKey = getBusinessDateKey(clockIn);
  const fallbackDateKey = logDate || clockInDateKey;
  if (!fallbackDateKey) return null;

  const window = getShiftStartEnd(fallbackDateKey, shiftStart, shiftEnd);
  if (!window || !clockIn) return fallbackDateKey;

  const clockInAt = new Date(clockIn);
  if (Number.isNaN(clockInAt.getTime())) return fallbackDateKey;

  if (
    clockInDateKey
    && clockInDateKey !== fallbackDateKey
    && clockInAt >= window.startAt
    && clockInAt <= window.endAt
  ) {
    return fallbackDateKey;
  }

  const rawStartAt = parseShiftDateTime(fallbackDateKey, shiftStart);
  const rawEndAt = parseShiftDateTime(fallbackDateKey, shiftEnd);
  const isOvernightShift = rawStartAt && rawEndAt && rawEndAt <= rawStartAt;
  if (clockInDateKey && isOvernightShift && clockInDateKey < fallbackDateKey) {
    return clockInDateKey;
  }

  return fallbackDateKey;
};

const getShiftEndReminderKey = (attendanceLogId) => (
  `${SHIFT_END_REMINDER_PREFIX}:${attendanceLogId}`
);

const cancelStoredShiftEndReminders = async (attendanceLogId) => {
  if (!attendanceLogId) return;

  const key = getShiftEndReminderKey(attendanceLogId);
  const storedValue = await AsyncStorage.getItem(key);
  if (storedValue) {
    try {
      const identifiers = JSON.parse(storedValue);
      await Promise.all((Array.isArray(identifiers) ? identifiers : []).map((identifier) => (
        Notifications.cancelScheduledNotificationAsync(identifier).catch(() => null)
      )));
    } catch {
      // Ignore malformed reminder state and replace it below.
    }
  }
  await AsyncStorage.removeItem(key);
};

const scheduleShiftEndReminders = async ({ attendanceLogId, endAt, siteName }) => {
  if (!attendanceLogId || !endAt || Number.isNaN(endAt.getTime())) return;

  await cancelStoredShiftEndReminders(attendanceLogId);

  const now = Date.now();
  const identifiers = [];
  for (const reminder of SHIFT_END_REMINDERS) {
    const reminderAt = new Date(endAt.getTime() - (reminder.minutesBeforeEnd * 60 * 1000));
    if (reminderAt.getTime() <= now) continue;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: `Your duty at ${siteName || "your assigned site"} is about to end. Prepare to clock out on time.`,
        data: {
          type: "shift_end_reminder",
          attendanceLogId,
          minutesBeforeEnd: reminder.minutesBeforeEnd,
          screen: "home",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderAt,
      },
    });
    identifiers.push(identifier);
  }

  if (identifiers.length) {
    await AsyncStorage.setItem(
      getShiftEndReminderKey(attendanceLogId),
      JSON.stringify(identifiers),
    );
  }
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
  const window = getShiftStartEnd(dateKey, shiftStart, shiftEnd);
  if (!window) {
    return {
      canClockOut: false,
      hasRemainingTime: false,
      dashboardLabel: "Schedule time unavailable",
      clockOutMessage: "No scheduled shift end is available. Contact your supervisor before timing out.",
    };
  }

  const remainingMs = window.endAt.getTime() - now.getTime();
  if (remainingMs > CLOCK_OUT_UNLOCK_WINDOW_MS) {
    const unlockLabel = formatDuration(remainingMs - CLOCK_OUT_UNLOCK_WINDOW_MS);
    return {
      canClockOut: false,
      hasRemainingTime: true,
      dashboardLabel: `Time out opens in ${unlockLabel}`,
      clockOutMessage: "You can time out starting 1 hour before your scheduled shift ends.",
    };
  }

  if (remainingMs > 0) {
    const remainingLabel = formatDuration(remainingMs);
    return {
      canClockOut: true,
      hasRemainingTime: true,
      dashboardLabel: `${remainingLabel} until shift end`,
      clockOutMessage: `Your shift ends in ${remainingLabel}. You may time out now.`,
    };
  }

  return {
    canClockOut: true,
    hasRemainingTime: false,
    dashboardLabel: "Shift end reached",
    clockOutMessage: "Your scheduled shift end has been reached. Confirm to time out.",
  };
};

const AttendanceMapCard = ({
  site,
  result,
  isOnDuty,
  loading,
  noShiftToday,
  clockInTooEarly,
  clockInWindowClosed,
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
    ? (noShiftToday ? "No shift scheduled today" : clockInTooEarly ? "Time-in opens 30 minutes before shift" : clockInWindowClosed ? "Time-in window closed" : "Ready to verify location")
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
            noShiftToday={noShiftToday}
            clockInLocked={clockInTooEarly}
            clockInWindowClosed={clockInWindowClosed}
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
  const [todayScheduleLoading, setTodayScheduleLoading] = useState(true);
  const [dateString, setDateString] = useState(formatDate());
  const [now, setNow] = useState(new Date());
  const [locationVerification, setLocationVerification] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    icon: "location-outline",
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
  useEffect(() => {
    const updateClock = () => {
      setNow(new Date());
      setDateString(formatDate());
    };

    updateClock();
    const interval = setInterval(updateClock, 60000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateClock();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError(null);
        const data = await fetchAllAnnouncements();
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

  const resetDashboardState = useCallback(() => {
    setIsOnDuty(false);
    setActiveAttendanceLog(null);
    setShowModal(false);
    setLoading(false);
    setAnnouncements([]);
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    setTodaySchedule(null);
    setTodayScheduleLoading(true);
    setDateString(formatDate());
    setNow(new Date());
    setLocationVerification(null);
    setUnreadNotifications(0);
    setToast({
      visible: false,
      icon: "location-outline",
      title: "",
      message: "",
      type: "success",
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetDashboardState();

      if (!profile?.id) {
        return undefined;
      }

      let isMounted = true;
      const today = getTodayParts();
      const selectedDate = getDateKey(today.year, today.month, today.day);

      const loadNotifications = async () => {
        try {
          const stats = await fetchNotificationStats();
          if (isMounted) setUnreadNotifications(stats.unread || 0);
        } catch (err) {
          if (isMounted) console.warn("Could not load notifications:", err.message);
        }
      };

      const loadAnnouncements = async () => {
        try {
          const data = await fetchAllAnnouncements();
          if (isMounted) {
            setAnnouncements(data);
            setAnnouncementsLoading(false);
            setAnnouncementsError(null);
          }
        } catch (err) {
          if (isMounted) {
            setAnnouncements([]);
            setAnnouncementsLoading(false);
            setAnnouncementsError(err.message);
          }
          console.warn("Could not load announcements:", err.message);
        }
      };

      const loadAttendance = async () => {
        try {
          const attendanceLog = await fetchActiveAttendance();
          if (isMounted) {
            setActiveAttendanceLog(attendanceLog);
            setIsOnDuty(Boolean(attendanceLog));
          }
        } catch (err) {
          if (isMounted) {
            setActiveAttendanceLog(null);
            setIsOnDuty(false);
          }
          console.warn("Could not load active attendance:", err.message);
        }
      };

      const loadSchedule = async () => {
        if (deploymentAccessLoading || !deployment) {
          if (isMounted) {
            setTodaySchedule(null);
            setTodayScheduleLoading(false);
          }
          return;
        }

        try {
          setTodayScheduleLoading(true);
          const data = await fetchMonthlySchedule({
            year: today.year,
            month: today.month,
            selectedDate,
          });
          if (isMounted) setTodaySchedule(data);
        } catch (err) {
          if (isMounted) {
            setTodaySchedule(null);
          }
          console.warn("Could not load today's schedule:", err.message);
        } finally {
          if (isMounted) setTodayScheduleLoading(false);
        }
      };

      loadNotifications();
      loadAnnouncements();
      loadAttendance();
      loadSchedule();

      return () => {
        isMounted = false;
      };
    }, [deployment, deploymentAccessLoading, profile?.id, resetDashboardState]),
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
      if (noShiftToday) {
        showToast({
          icon: "calendar-clear-outline",
          title: "No Shift Today",
          message: "You do not have a scheduled shift today. Contact your supervisor if this is incorrect.",
          type: "error",
        });
        return;
      }

      if (clockInTooEarly) {
        showToast({
          icon: "time-outline",
          title: "Time In Not Open",
          message: "You can time in starting 30 minutes before your scheduled shift.",
          type: "error",
        });
        return;
      }

      if (clockInWindowClosed) {
        showToast({
          icon: "time-outline",
          title: "Time In Closed",
          message: "Your scheduled shift time-in window has already ended.",
          type: "error",
        });
        return;
      }

      try {
        setLoading(true);

        if (!deployment?.client_sites) {
          showToast({
            icon: "business-outline",
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
            scheduleId: displayShift?.scheduleId,
            locationEvidence: result.locationEvidence,
          });

          setActiveAttendanceLog(attendanceLog);
          setIsOnDuty(true);
        } else {
          showToast({
            icon: "navigate-circle-outline",
            title: "Outside Geofence",
            message: "You must be inside your assigned site to clock in.",
            type: "error",
          });
        }

        // Always show map — inside or outside
      } catch (err) {
        if (err.status === 409 && err.attendanceLog && !err.attendanceLog.clockOut) {
          setActiveAttendanceLog(err.attendanceLog);
          setIsOnDuty(true);
          showToast({
            icon: "checkmark-circle-outline",
            title: "Already Timed In",
            message: "Your active attendance log has been restored.",
            type: "success",
          });
          return;
        }

        showToast({
          icon: "alert-circle-outline",
          title: "Unable to Time In",
          message: err.message || "Something went wrong. Please try again.",
          type: "error",
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (!shiftTiming.canClockOut) {
      showToast({
        icon: "time-outline",
        title: "Time-out Locked",
        message: shiftTiming.clockOutMessage,
        type: "error",
      });
    } else {
      setShowModal(true);
    }
  };

  const handleClockOut = async () => {
    setShowModal(false);

    try {
      setLoading(true);

      if (!shiftTiming.canClockOut) {
        throw new Error(shiftTiming.clockOutMessage);
      }

      if (!deployment?.client_sites) {
        throw new Error("No active site assignment found.");
      }

      const position = await validateGuardLocation(deployment.client_sites);
      const timestamp = new Date().toISOString();
      setLocationVerification({
        post: position.post,
        guardCoords: position.coords,
        distance: position.distance,
        checkType: "logout",
        timestamp,
        isInside: position.isInside,
      });

      if (!position.isInside) {
        throw new Error("You must be inside your assigned site to time out.");
      }

      if (!activeAttendanceLog?.id) {
        throw new Error("No active attendance log found.");
      }

      await clockOut({
        attendanceLogId: activeAttendanceLog.id,
        locationEvidence: position.locationEvidence,
      });

      setActiveAttendanceLog(null);
      setIsOnDuty(false);
    } catch (err) {
      console.error("Clock-out failed:", err);
      setIsOnDuty(Boolean(activeAttendanceLog));
      showToast({
        icon: "alert-circle-outline",
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
  const actionableShift = getActionableShift({
    scheduleDays: todaySchedule?.scheduleDays || [],
    selectedDate: todaySchedule?.selectedDate,
    selectedShift: todaySchedule?.selectedShift,
    todayDateKey,
    now,
    isOnDuty,
  });
  const activeAttendanceShiftDateKey = activeAttendanceLog
    ? getActiveShiftDateKey({
      logDate: activeAttendanceLog.logDate,
      clockIn: activeAttendanceLog.clockIn,
      shiftStart: activeAttendanceLog.shiftStart,
      shiftEnd: activeAttendanceLog.shiftEnd,
    })
    : null;
  const activeAttendanceShift = activeAttendanceLog?.scheduleId
    ? todaySchedule?.scheduleDays?.find((item) => (
      item.scheduleId === activeAttendanceLog.scheduleId
      && (!activeAttendanceShiftDateKey || item.date === activeAttendanceShiftDateKey)
    ))
    : null;
  const activeAttendanceFallbackShift = activeAttendanceLog?.shiftStart && activeAttendanceLog?.shiftEnd
    ? {
      date: activeAttendanceShiftDateKey,
      shiftStart: activeAttendanceLog.shiftStart,
      shiftEnd: activeAttendanceLog.shiftEnd,
    }
    : null;
  const scheduleLoaded = !todayScheduleLoading && todaySchedule !== null;
  const todayShiftClockInAvailability = todayShift
    ? getShiftClockInAvailability(todayShift, now)
    : null;
  const clockInTooEarly = scheduleLoaded
    && todayShiftClockInAvailability?.code === "too_early"
    && !actionableShift
    && !isOnDuty;
  const clockInWindowClosed = scheduleLoaded
    && todayShiftClockInAvailability?.code === "ended"
    && !actionableShift
    && !isOnDuty;
  const noShiftToday = scheduleLoaded && !todayShift && !actionableShift && !isOnDuty;
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
  const displayShift = isOnDuty && (activeAttendanceShift || activeAttendanceFallbackShift)
    ? (activeAttendanceShift || activeAttendanceFallbackShift)
    : (actionableShift || todayShift || fallbackShift);
  const displayShiftDateKey = displayShift?.date || activeAttendanceLog?.logDate || todayDateKey;
  const displayShiftStart = displayShift?.shiftStart || deploymentShiftStart || "--";
  const displayShiftEnd = displayShift?.shiftEnd || deploymentShiftEnd || "--";
  const formatShiftDisplay = (dateKey, value) => {
    if (!value || value === "--") return "--";
    const dt = parseShiftDateTime(dateKey, value);
    if (!dt) return String(value);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(dt);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${Number(values.hour)}:${values.minute}`;
  };
  const displayShiftStartFormatted = formatShiftDisplay(displayShiftDateKey, displayShiftStart);
  const displayShiftEndFormatted = formatShiftDisplay(displayShiftDateKey, displayShiftEnd);
  const shiftTiming = getShiftTiming({
    dateKey: displayShiftDateKey,
    shiftStart: displayShiftStart,
    shiftEnd: displayShiftEnd,
    now,
  });
  const clockInTime = formatAttendanceTime(activeAttendanceLog?.clockIn);

  useEffect(() => {
    const attendanceLogId = activeAttendanceLog?.id;
    if (!attendanceLogId || !isOnDuty) return undefined;

    const startAt = parseShiftDateTime(displayShiftDateKey, displayShiftStart);
    const endAt = parseShiftDateTime(displayShiftDateKey, displayShiftEnd);
    if (!startAt || !endAt) return undefined;

    const normalizedEndAt = new Date(endAt);
    if (normalizedEndAt <= startAt) {
      normalizedEndAt.setDate(normalizedEndAt.getDate() + 1);
    }

    scheduleShiftEndReminders({
      attendanceLogId,
      endAt: normalizedEndAt,
      siteName: deployment?.client_sites?.site_name,
    }).catch((err) => {
      console.warn("Could not schedule shift end reminders:", err.message || err);
    });

    return () => {
      cancelStoredShiftEndReminders(attendanceLogId).catch(() => null);
    };
  }, [
    activeAttendanceLog?.id,
    deployment?.client_sites?.site_name,
    displayShiftDateKey,
    displayShiftEnd,
    displayShiftStart,
    isOnDuty,
  ]);

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
          clockInStatus={activeAttendanceLog?.status}
          dutyTimingLabel={shiftTiming.dashboardLabel}
          hasRemainingTime={shiftTiming.hasRemainingTime}
        />
        {deployment?.client_sites ? (
          <AttendanceMapCard
            site={deployment.client_sites}
            result={locationVerification}
            isOnDuty={isOnDuty}
            loading={loading}
            noShiftToday={noShiftToday}
            clockInTooEarly={clockInTooEarly}
            clockInWindowClosed={clockInWindowClosed}
            onActionPress={handleMainAction}
          />
        ) : null}
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
