// hooks/useProfile.js
import authService from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService.getProfile()
      .then((p) => {
        if (active && p) {
          setProfile(p);
        }
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    authService.getMe()
      .then((data) => {
        if (!active || !data?.profile) return;
        setProfile(data.profile);
        AsyncStorage.setItem("profile", JSON.stringify(data.profile));
        if (data.user?.email) {
          AsyncStorage.setItem("user_email", data.user.email);
          setEmail(data.user.email);
        }
      })
      .catch(() => {});

    AsyncStorage.getItem("user_email").then((e) => {
      if (active && e) setEmail(e);
    });

    return () => {
      active = false;
    };
  }, []);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Officer";

  const displayId = profile?.employee_id_number || "PRISM-----";

  return {
    profile,
    setProfile,
    fullName,
    displayId,
    email: profile?.contact_email || email,
    phone: profile?.phone_number || "",
    address: profile?.residential_address || "",
    emergencyName: profile?.emergency_contact_name || "",
    emergencyNum: profile?.emergency_contact_number || "",
    loading,
  };
}
