export const LEAVE_TYPE_LABELS = {
  sick: "Sick Leave",
  emergency: "Emergency Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  maternity_paternity: "Maternity / Paternity Leave",
  service_incentive: "Service Incentive Leave",
};

export const LEAVE_OPTIONS = [
  {
    value: "sick",
    label: LEAVE_TYPE_LABELS.sick,
    icon: "thermometer",
    pickerMeta: "Past absences or today",
  },
  {
    value: "emergency",
    label: LEAVE_TYPE_LABELS.emergency,
    icon: "alert-circle",
    pickerMeta: "1-5 days",
  },
  {
    value: "maternity",
    label: LEAVE_TYPE_LABELS.maternity,
    icon: "heart",
    pickerMeta: "Delivery window",
  },
  {
    value: "paternity",
    label: LEAVE_TYPE_LABELS.paternity,
    icon: "heart",
    pickerMeta: "60-day window",
  },
  {
    value: "service_incentive",
    label: LEAVE_TYPE_LABELS.service_incentive,
    icon: "briefcase",
  },
];
