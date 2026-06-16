const test = require("node:test");
const assert = require("node:assert/strict");

const {
  appendLeaveSubmissionFormData,
  normalizeLeaveSubmissionPayload,
} = require("./leaveSubmissionPayload");

class FakeFormData {
  constructor() {
    this.entries = [];
  }

  append(key, value) {
    this.entries.push([key, value]);
  }
}

function entriesOf(formData) {
  return Object.fromEntries(formData.entries);
}

test("mobile leave submission maps paternity to the shared backend contract", () => {
  const document = { uri: "file://birth.pdf", name: "birth.pdf", type: "application/pdf" };
  const payload = normalizeLeaveSubmissionPayload({
    leaveType: "paternity",
    startDate: "2026-06-16",
    endDate: "2026-06-20",
    childBirthDate: "2026-06-15",
    requestedDates: ["2026-06-16", "2026-06-18", "2026-06-20"],
    reason: "Child care",
    supportingDocument: document,
  });

  assert.equal(payload.apiLeaveType, "maternity_paternity");
  assert.equal(payload.leaveSubtype, "paternity");
  assert.equal(payload.qualifyingEventDate, "2026-06-15");

  const fields = entriesOf(appendLeaveSubmissionFormData(new FakeFormData(), payload));
  assert.equal(fields.leaveType, "maternity_paternity");
  assert.equal(fields.leaveSubtype, "paternity");
  assert.equal(fields.qualifyingEventDate, "2026-06-15");
  assert.equal(fields.requestedDates, JSON.stringify(["2026-06-16", "2026-06-18", "2026-06-20"]));
  assert.equal(fields.supportingDocument, document);
});

test("mobile leave submission sends SIL purpose without requiring a document field", () => {
  const payload = normalizeLeaveSubmissionPayload({
    leaveType: "service_incentive",
    startDate: "2026-07-01",
    endDate: "2026-07-01",
    requestedDates: ["2026-07-01"],
    silPurpose: "sick_substitution",
    reason: "Use SIL after sick quota",
  });

  const fields = entriesOf(appendLeaveSubmissionFormData(new FakeFormData(), payload));
  assert.equal(fields.leaveType, "service_incentive");
  assert.equal(fields.silPurpose, "sick_substitution");
  assert.equal(fields.supportingDocument, undefined);
});
