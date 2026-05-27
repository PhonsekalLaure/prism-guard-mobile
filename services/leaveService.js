import authService from "@/services/authService";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response");
  }
}

async function request(path, options = {}) {
  const token = await authService.getToken();
  if (!token) throw new Error("No session found");

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const buildOptions = (accessToken) => ({
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let response = await fetch(`${BASE_URL}/api/mobile/leave${path}`, buildOptions(token));
  if (response.status === 401) {
    const refreshedToken = await authService.refreshSession();
    response = await fetch(`${BASE_URL}/api/mobile/leave${path}`, buildOptions(refreshedToken));
  }

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || "Leave request failed");
  }

  return data;
}

export const fetchLeaveCredits = async () => {
  return request("/credits");
};

export const fetchLeaveRequests = async () => {
  const result = await request("/requests");
  return result.data || [];
};

export const submitLeaveRequest = async ({
  leaveType,
  startDate,
  endDate,
  reason,
  supportingDocument,
}) => {
  if (!supportingDocument) {
    throw new Error("Supporting document is required");
  }

  const formData = new FormData();
  formData.append("leaveType", leaveType);
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  formData.append("reason", reason);
  formData.append("supportingDocument", supportingDocument);

  return request("/requests", {
    method: "POST",
    body: formData,
  });
};

export const fetchSupportingDocument = async (id) => {
  return request(`/requests/${id}/document`);
};

export const cancelLeaveRequest = async (id) => {
  return request(`/requests/${id}/cancel`, {
    method: "PATCH",
  });
};
