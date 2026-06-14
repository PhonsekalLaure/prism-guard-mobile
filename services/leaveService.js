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

export const fetchLeaveRequests = async ({ page = 1, limit = 3 } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const result = await request(`/requests?${params.toString()}`);
  return {
    requests: result.data || [],
    totalCount: result.totalCount || 0,
    page: result.page || page,
    limit: result.limit || limit,
  };
};

export const submitLeaveRequest = async ({
  leaveType,
  startDate,
  endDate,
  reason,
  supportingDocument,
  deliveryDate,
  childBirthDate,
  requestedDates = [],
  silPurpose = "standard",
}) => {
  const apiLeaveType = ["maternity", "paternity"].includes(leaveType)
    ? "maternity_paternity"
    : leaveType;
  const leaveSubtype = ["maternity", "paternity"].includes(leaveType)
    ? leaveType
    : "";
  const qualifyingEventDate = leaveType === "maternity"
    ? deliveryDate
    : leaveType === "paternity"
      ? childBirthDate
      : "";

  const formData = new FormData();
  formData.append("leaveType", apiLeaveType);
  if (leaveSubtype) formData.append("leaveSubtype", leaveSubtype);
  if (qualifyingEventDate) formData.append("qualifyingEventDate", qualifyingEventDate);
  if (apiLeaveType === "service_incentive") formData.append("silPurpose", silPurpose);
  formData.append("requestedDates", JSON.stringify(requestedDates));
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  formData.append("reason", reason);
  if (supportingDocument) {
    formData.append("supportingDocument", supportingDocument);
  }

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
