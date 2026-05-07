// hooks/useProfile.js
import authService from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    authService.getProfile().then((p) => {
      if (p) setProfile(p);
    });
    AsyncStorage.getItem("user_email").then((e) => {
      if (e) setEmail(e);
    });
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
