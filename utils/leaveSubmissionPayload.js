function normalizeLeaveSubmissionPayload({
  leaveType,
  startDate,
  endDate,
  reason,
  supportingDocument,
  deliveryDate,
  childBirthDate,
  requestedDates = [],
  silPurpose = "standard",
}) {
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

  return {
    apiLeaveType,
    leaveSubtype,
    qualifyingEventDate,
    silPurpose,
    startDate,
    endDate,
    reason,
    requestedDates,
    supportingDocument,
  };
}

function appendLeaveSubmissionFormData(formData, payload) {
  formData.append("leaveType", payload.apiLeaveType);
  if (payload.leaveSubtype) formData.append("leaveSubtype", payload.leaveSubtype);
  if (payload.qualifyingEventDate) {
    formData.append("qualifyingEventDate", payload.qualifyingEventDate);
  }
  if (payload.apiLeaveType === "service_incentive") {
    formData.append("silPurpose", payload.silPurpose);
  }
  formData.append("requestedDates", JSON.stringify(payload.requestedDates));
  formData.append("startDate", payload.startDate);
  formData.append("endDate", payload.endDate);
  formData.append("reason", payload.reason);
  if (payload.supportingDocument) {
    formData.append("supportingDocument", payload.supportingDocument);
  }
  return formData;
}

module.exports = {
  appendLeaveSubmissionFormData,
  normalizeLeaveSubmissionPayload,
};
