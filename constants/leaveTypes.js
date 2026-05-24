export const LEAVE_TYPE_LABELS = {
  sick: "Sick Leave",
  emergency: "Emergency Leave",
  maternity_paternity: "Maternity / Paternity Leave",
};

export const LEAVE_OPTIONS = [
  { value: "sick", label: LEAVE_TYPE_LABELS.sick, icon: "thermometer" },
  { value: "emergency", label: LEAVE_TYPE_LABELS.emergency, icon: "alert-circle" },
  {
    value: "maternity_paternity",
    label: LEAVE_TYPE_LABELS.maternity_paternity,
    icon: "heart",
  },
];
