import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getContent = (announcement) =>
  announcement.message ||
  announcement.body ||
  announcement.content ||
  announcement.description ||
  "";

const getPreview = (announcement) => {
  const preview = announcement.preview || getContent(announcement);
  return preview.length > 120 ? `${preview.slice(0, 117)}...` : preview;
};

const normalizeAnnouncement = (announcement, index) => ({
  id: String(announcement.id || announcement.announcement_id || index),
  title:
    announcement.title ||
    announcement.subject ||
    announcement.heading ||
    "Announcement",
  content: getContent(announcement),
  preview: getPreview(announcement),
  createdAt:
    announcement.created_at ||
    announcement.published_at ||
    announcement.date ||
    null,
  source: announcement.source || "prism",
  company: announcement.company || null,
  raw: announcement,
});

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetch admin-published announcements (targeted at 'employees' audience).
 */
export const fetchAnnouncements = async () => {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/announcements`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch announcements");
  }

  return (data.announcements || []).map(normalizeAnnouncement);
};

/**
 * Fetch client-authored announcements addressed to the authenticated guard.
 */
export const fetchClientAnnouncements = async () => {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const response = await fetch(`${BASE_URL}/api/mobile/announcements/client`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch client announcements");
  }

  return (data.announcements || []).map((ann, index) =>
    normalizeAnnouncement({ ...ann, source: "client" }, index)
  );
};

/**
 * Fetch all announcements (admin + client) merged and sorted by date descending.
 * Safe — if client announcements fail, only admin ones are returned.
 */
export const fetchAllAnnouncements = async () => {
  const [adminResults, clientResults] = await Promise.allSettled([
    fetchAnnouncements(),
    fetchClientAnnouncements(),
  ]);

  const adminAnn =
    adminResults.status === "fulfilled" ? adminResults.value : [];
  const clientAnn =
    clientResults.status === "fulfilled" ? clientResults.value : [];

  const merged = [...adminAnn, ...clientAnn];

  // Sort by date descending (newest first)
  merged.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return merged;
};

/**
 * Fetch a single announcement by ID (searches across admin + client).
 */
export const fetchAnnouncementById = async (id) => {
  const announcements = await fetchAllAnnouncements();
  return announcements.find((announcement) => announcement.id === String(id)) || null;
};
