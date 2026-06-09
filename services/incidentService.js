import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await authService.authenticatedFetch(
    `${BASE_URL}/api/mobile/incidents${path}`,
    options,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Incident request failed");
  }

  return data;
}

async function submitIncidentReport({
  narrative,
  occurredAt,
}) {
  const data = await request("", {
    method: "POST",
    body: JSON.stringify({
      narrative,
      occurredAt,
    }),
  });

  return data.incident;
}

async function fetchIncidentReports({ page = 1, limit = 3 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const data = await request(`?${params.toString()}`);
  return {
    incidents: data.incidents || [],
    totalCount: data.totalCount || 0,
    page: data.page || page,
    limit: data.limit || limit,
  };
}

async function fetchIncidentReportById(id) {
  const data = await request(`/${id}`);
  return data.incident;
}

async function sendIncidentMessage(id, message) {
  const data = await request(`/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return data.message;
}

export default {
  submitIncidentReport,
  fetchIncidentReports,
  fetchIncidentReportById,
  sendIncidentMessage,
};
