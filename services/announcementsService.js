import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const getPreview = (announcement) => {
  const preview = announcement.preview || getContent(announcement);

  return preview.length > 120 ? `${preview.slice(0, 117)}...` : preview;
};

const getContent = (announcement) => (
  announcement.message ||
  announcement.body ||
  announcement.content ||
  announcement.description ||
  ""
);

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
  raw: announcement,
});

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

export const fetchAnnouncementById = async (id) => {
  const announcements = await fetchAnnouncements();
  return announcements.find((announcement) => announcement.id === String(id)) || null;
};
