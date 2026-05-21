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

async function fetchIncidentReports(limit = 10) {
  const data = await request(`?limit=${encodeURIComponent(limit)}`);
  return data.incidents || [];
}

async function fetchIncidentReportById(id) {
  const data = await request(`/${id}`);
  return data.incident;
}

export default {
  submitIncidentReport,
  fetchIncidentReports,
  fetchIncidentReportById,
};
