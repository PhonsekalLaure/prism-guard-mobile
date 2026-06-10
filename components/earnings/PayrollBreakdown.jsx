import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  buildDeductions,
  buildEarnings,
  getGrossPay,
  getTotalDeductions,
  toCurrency,
  toDate,
} from '@/utils/earningsFormatters';
import { EARNINGS_COLORS as C } from './earningsTheme';

function MoneyRow({ label, amount, deduction = false, bold = false }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.boldText]}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          bold && styles.boldText,
          deduction && styles.deductionText,
        ]}
      >
        {deduction ? `- ${toCurrency(amount)}` : toCurrency(amount)}
      </Text>
    </View>
  );
}

export function PayrollNetPayCard({
  payroll,
  decorated = false,
  highlightPaid = false,
  label = 'NET PAY',
  periodPrefix = '',
  showEstimateNote = false,
}) {
  return (
    <View style={styles.netPayCard}>
      {decorated && <View style={styles.netPayCircleDecor} />}
      <Text style={styles.netPayLabel}>{label}</Text>
      <Text style={styles.netPayAmount}>{toCurrency(payroll.net_pay)}</Text>
      <Text style={styles.netPayPeriod}>
        {periodPrefix}{toDate(payroll.period_start)} - {toDate(payroll.period_end)}
      </Text>
      {showEstimateNote && payroll.is_estimate && (
        <Text style={styles.estimateNote}>
          Computed from available records for this cutoff. Final payroll may change after HR review.
        </Text>
      )}
      <View
        style={[
          styles.statusBadge,
          highlightPaid && payroll.status === 'paid' && styles.paidBadge,
        ]}
      >
        <Text style={styles.statusBadgeText}>
          {String(payroll.status || 'estimate').toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

export function PayrollBreakdown({
  payroll,
  deductionsTitle = 'Deductions',
  earningsTitle = 'Earnings',
  showEmptyDeductions = false,
}) {
  const earnings = buildEarnings(payroll);
  const deductions = buildDeductions(payroll);
  const grossPay = getGrossPay(payroll);
  const totalDeductions = getTotalDeductions(payroll);
  const showDeductions = showEmptyDeductions || deductions.length > 0;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{earningsTitle}</Text>
        {earnings.map((item, index) => (
          <View key={item.label} style={index < earnings.length - 1 && styles.rowBorder}>
            <MoneyRow label={item.label} amount={item.amount} />
          </View>
        ))}
        <View style={[styles.rowBorder, styles.totalRow]}>
          <MoneyRow label="Gross Pay" amount={grossPay} bold />
        </View>
      </View>

      {showDeductions && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{deductionsTitle}</Text>
          {deductions.length === 0 ? (
            <Text style={styles.noDeductions}>No deductions for this cutoff.</Text>
          ) : (
            deductions.map((item, index) => (
              <View key={item.label} style={index < deductions.length - 1 && styles.rowBorder}>
                <MoneyRow label={item.label} amount={item.amount} deduction />
              </View>
            ))
          )}
          <View style={[styles.rowBorder, styles.totalRow]}>
            <MoneyRow
              label="Total Deductions"
              amount={totalDeductions}
              deduction={totalDeductions > 0}
              bold
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  netPayCard: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
  },
  netPayCircleDecor: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  netPayLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  netPayAmount: { color: C.accent, fontSize: 36, fontWeight: '800', marginBottom: 4 },
  netPayPeriod: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 10 },
  estimateNote: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidBadge: { backgroundColor: C.success },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  rowLabel: { flex: 1, color: C.muted, fontSize: 14, paddingRight: 12 },
  rowValue: { color: C.text, fontSize: 14, fontWeight: '500', textAlign: 'right' },
  boldText: { color: C.text, fontWeight: '700' },
  deductionText: { color: C.danger },
  totalRow: { borderTopWidth: 1.5, borderTopColor: '#E0E0EA', marginTop: 2 },
  noDeductions: { color: C.muted, fontSize: 13, paddingVertical: 8 },
});
