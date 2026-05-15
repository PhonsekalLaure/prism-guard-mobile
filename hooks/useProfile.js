// hooks/useProfile.js
import authService from "@/services/authService";
import { registerPushToken } from "@/utils/pushNotifications";
import { saveLocationPing } from "@/utils/locationPing";
import { validateGuardLocation } from "@/utils/geofence";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const responseListener = useRef();

  useEffect(() => {
    authService.getProfile().then((p) => {
      if (p) {
        setProfile(p);
        registerPushToken(p.id);
      }
    });

    AsyncStorage.getItem("user_email").then((e) => {
      if (e) setEmail(e);
    });

    // Listen for notification taps
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(async (response) => {
        const { checkType, attendanceLogId } =
          response.notification.request.content.data;

        if (!checkType) return;

        try {
          const p = await authService.getProfile();
          if (!p) return;

          const deploymentRaw = await AsyncStorage.getItem("active_deployment");
          if (!deploymentRaw) return;

          const deployment = JSON.parse(deploymentRaw);
          if (!deployment?.client_sites) return;

          const result = await validateGuardLocation(deployment.client_sites);

          await saveLocationPing({
            attendanceLogId: attendanceLogId || null,
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          });

          console.log(`Checkpoint ping saved for ${checkType}`);
        } catch (err) {
          console.error("Checkpoint ping failed:", err);
        }
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Officer";

  const displayId = profile?.employee_id_number || "PRISM-----";

  return {
    profile,
    fullName,
    displayId,
    email: profile?.contact_email || email,
    phone: profile?.phone_number || "",
    address: profile?.residential_address || "",
    emergencyName: profile?.emergency_contact_name || "",
    emergencyNum: profile?.emergency_contact_number || "",
  };
}
