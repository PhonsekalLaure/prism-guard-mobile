export function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function toCurrency(value) {
  return `PHP ${numeric(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function toDate(value) {
  return value
    ? new Date(value).toLocaleDateString('en-PH', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    : '';
}

export function getGrossPay(payroll) {
  const fallbackGross = numeric(payroll?.basic_pay)
    + numeric(payroll?.overtime_pay)
    + numeric(payroll?.holiday_pay)
    + numeric(payroll?.night_differential_pay);
  return numeric(payroll?.gross_pay) || fallbackGross;
}

export function getTotalDeductions(payroll) {
  const fallbackDeductions = numeric(payroll?.statutory_deductions)
    + numeric(payroll?.cash_advance_deduction)
    + numeric(payroll?.absences_deduction)
    + numeric(payroll?.leave_deduction)
    + numeric(payroll?.awol_deduction)
    + numeric(payroll?.late_undertime_deduction)
    + numeric(payroll?.withholding_tax);
  return numeric(payroll?.total_deductions) || fallbackDeductions;
}

export function buildEarnings(payroll) {
  if (!payroll) return [];
  return [
    { label: 'Regular Pay', amount: payroll.regular_pay ?? payroll.basic_pay },
    numeric(payroll.overtime_pay) > 0 && { label: 'Overtime Pay', amount: payroll.overtime_pay },
    numeric(payroll.night_differential_pay) > 0 && { label: 'Night Differential', amount: payroll.night_differential_pay },
    numeric(payroll.holiday_pay) > 0 && { label: 'Holiday Pay', amount: payroll.holiday_pay },
  ].filter(Boolean);
}

export function buildDeductions(payroll) {
  if (!payroll) return [];
  return [
    numeric(payroll.sss_employee) > 0 && { label: 'SSS', amount: payroll.sss_employee },
    numeric(payroll.philhealth_employee) > 0 && { label: 'PhilHealth', amount: payroll.philhealth_employee },
    numeric(payroll.pagibig_employee) > 0 && { label: 'Pag-IBIG', amount: payroll.pagibig_employee },
    numeric(payroll.withholding_tax) > 0 && { label: 'Withholding Tax', amount: payroll.withholding_tax },
    !numeric(payroll.sss_employee)
      && !numeric(payroll.philhealth_employee)
      && !numeric(payroll.pagibig_employee)
      && numeric(payroll.statutory_deductions) > 0
      && { label: 'Statutory Deductions', amount: payroll.statutory_deductions },
    numeric(payroll.cash_advance_deduction) > 0 && { label: 'Cash Advance Deduction', amount: payroll.cash_advance_deduction },
    numeric(payroll.absences_deduction) > 0 && { label: 'Absences Deduction', amount: payroll.absences_deduction },
    numeric(payroll.leave_deduction) > 0 && { label: 'Unpaid Leave Deduction', amount: payroll.leave_deduction },
    numeric(payroll.awol_deduction) > 0 && { label: 'AWOL Deduction', amount: payroll.awol_deduction },
    numeric(payroll.late_undertime_deduction) > 0 && { label: 'Late/Undertime', amount: payroll.late_undertime_deduction },
  ].filter(Boolean);
}
