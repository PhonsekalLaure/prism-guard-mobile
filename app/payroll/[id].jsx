import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EarningsHeader from '@/components/earnings/EarningsHeader';
import {
  PayrollBreakdown,
  PayrollNetPayCard,
} from '@/components/earnings/PayrollBreakdown';
import { EARNINGS_COLORS as C } from '@/components/earnings/earningsTheme';
import ScreenWrapper from '@/components/dashboard/ScreenWrapper';
import { fetchPayrollRecord } from '@/services/earningsService';
import { numeric, toDate } from '@/utils/earningsFormatters';

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PayrollDetailsScreen() {
  const params = useLocalSearchParams();
  const recordId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadRecord() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPayrollRecord(recordId);
        if (!result) throw new Error('Payroll record not found.');
        if (active) setRecord(result);
      } catch (err) {
        if (active) {
          setRecord(null);
          setError(err.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (recordId) {
      loadRecord();
    } else {
      setError('Payroll record not found.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [recordId]);

  const workSummary = useMemo(() => {
    if (!record) return [];
    const snapshot = record.calculation_snapshot || {};
    return [
      { label: 'Regular Hours', value: numeric(record.regular_hours) },
      { label: 'Overtime Hours', value: numeric(record.overtime_hours) },
      { label: 'Night Differential Hours', value: numeric(record.night_diff_hours) },
      { label: 'Paid Leave Days', value: numeric(snapshot.paid_leave_days) },
      { label: 'Unpaid Leave Days', value: numeric(snapshot.unpaid_leave_days) },
      { label: 'Absence Days', value: numeric(snapshot.absence_days) },
      { label: 'AWOL Days', value: numeric(snapshot.awol_days) },
      { label: 'Late Minutes', value: numeric(snapshot.late_minutes) },
      { label: 'Undertime Minutes', value: numeric(snapshot.undertime_minutes) },
    ].filter((item) => item.value > 0);
  }, [record]);

  if (loading) {
    return (
      <ScreenWrapper activeTabKey="earnings">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !record) {
    return (
      <ScreenWrapper activeTabKey="earnings">
        <View style={styles.container}>
          <EarningsHeader title="Payroll Details" showNotifications={false} />
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={46} color={C.danger} />
            <Text style={styles.errorText}>{error || 'Payroll record not found.'}</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const finalizedDate = record.status === 'paid'
    ? record.paid_at || record.payment_date
    : record.approved_at;

  return (
    <ScreenWrapper activeTabKey="earnings">
      <View style={styles.container}>
        <EarningsHeader title="Payroll Details" showNotifications={false} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <PayrollNetPayCard payroll={record} highlightPaid />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payroll Information</Text>
            <DetailRow label="Cutoff Start" value={toDate(record.period_start)} />
            <View style={styles.rowBorder}>
              <DetailRow label="Cutoff End" value={toDate(record.period_end)} />
            </View>
            <View style={styles.rowBorder}>
              <DetailRow label="Status" value={String(record.status).toUpperCase()} />
            </View>
            {finalizedDate && (
              <View style={styles.rowBorder}>
                <DetailRow
                  label={record.status === 'paid' ? 'Paid On' : 'Approved On'}
                  value={toDate(finalizedDate)}
                />
              </View>
            )}
          </View>

          {workSummary.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Work Summary</Text>
              {workSummary.map((item, index) => (
                <View key={item.label} style={index < workSummary.length - 1 && styles.rowBorder}>
                  <DetailRow label={item.label} value={String(item.value)} />
                </View>
              ))}
            </View>
          )}

          <PayrollBreakdown payroll={record} showEmptyDeductions />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
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
  errorText: { color: C.danger, fontSize: 14, textAlign: 'center', marginTop: 12 },
});
