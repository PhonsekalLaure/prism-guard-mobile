// app/_layout.jsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import {
  addNotificationResponseListener,
  registerStoredProfilePushToken,
} from "@/utils/pushNotifications";
import { ActiveDeploymentAccessProvider } from "@/hooks/useActiveDeploymentAccess";

export default function Layout() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.documentElement.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    registerStoredProfilePushToken();
    const responseSubscription = addNotificationResponseListener();

    return () => {
      responseSubscription?.remove?.();
    };
  }, []);

  return (
    <ActiveDeploymentAccessProvider>
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="announcements" />
        <Stack.Screen name="announcement/[id]" />
        {/* Add this 👇 */}
        <Stack.Screen
          name="check-in-confirmation"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </ActiveDeploymentAccessProvider>
  );
}
