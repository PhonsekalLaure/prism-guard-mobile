// prism-guard-mobile/app/(tabs)/earnings.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/dashboard/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { fetchCurrentPayroll } from '../../services/earningsService';
import { useActiveDeploymentAccess } from '@/hooks/useActiveDeploymentAccess';

// ─── helpers ─────────────────────────────────────────────────────

const toCurrency = (val) =>
  `₱${parseFloat(val ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toDate = (str) =>
  str
    ? new Date(str).toLocaleDateString('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '';

// ─── sub-components ───────────────────────────────────────────────

const LineRow = ({ label, amount, deduction = false, bold = false }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.boldText]}>{label}</Text>
    <Text
      style={[
        styles.rowAmount,
        bold && styles.boldText,
        deduction && styles.deductionText,
      ]}
    >
      {deduction ? `– ${toCurrency(amount)}` : toCurrency(amount)}
    </Text>
  </View>
);

// ─── screen ───────────────────────────────────────────────────────

export default function EarningsScreen() {
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();
  const [payroll, setPayroll]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (profileLoading || deploymentLoading || !deployment) return;

    try {
      setError(null);
      if (!isRefresh) setLoading(true);
      const data = await fetchCurrentPayroll();
      setPayroll(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deployment, deploymentLoading, profileLoading]);

  useEffect(() => {
    if (profileLoading || deploymentLoading) return undefined;

    if (!deployment) {
      setLoading(false);
      Alert.alert("No Access", "You have no access to this right now.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
      return undefined;
    }

    load();
    return undefined;
  }, [deployment, deploymentLoading, load, profileLoading]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  // ── derived values ──────────────────────────────────────────────
  const grossPay = payroll
    ? parseFloat(payroll.basic_pay ?? 0) +
      parseFloat(payroll.overtime_pay ?? 0) +
      parseFloat(payroll.holiday_pay ?? 0)
    : 0;

  const totalDeductions = payroll
    ? parseFloat(payroll.statutory_deductions ?? 0) +
      parseFloat(payroll.cash_advance_deduction ?? 0) +
      parseFloat(payroll.absences_deduction ?? 0)
    : 0;

  const earnings = payroll
    ? [
        { label: 'Basic Pay', amount: payroll.basic_pay },
        parseFloat(payroll.overtime_pay) > 0 && { label: 'Overtime Pay', amount: payroll.overtime_pay },
        parseFloat(payroll.holiday_pay)  > 0 && { label: 'Holiday Pay',  amount: payroll.holiday_pay },
      ].filter(Boolean)
    : [];

  const deductions = payroll
    ? [
        parseFloat(payroll.statutory_deductions)    > 0 && { label: 'Statutory Deductions',   amount: payroll.statutory_deductions },
        parseFloat(payroll.cash_advance_deduction)  > 0 && { label: 'Cash Advance Deduction', amount: payroll.cash_advance_deduction },
        parseFloat(payroll.absences_deduction)      > 0 && { label: 'Absences Deduction',     amount: payroll.absences_deduction },
      ].filter(Boolean)
    : [];

  // ── render states ───────────────────────────────────────────────

  if (profileLoading || deploymentLoading || loading) {
    return (
      <ScreenWrapper activeTabKey="earnings">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!deployment) {
    return (
      <ScreenWrapper activeTabKey="home">
        <View style={styles.centered} />
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!payroll) {
    return (
      <View style={styles.centered}>
        <Ionicons name="document-outline" size={48} color={C.muted} />
        <Text style={styles.emptyText}>No payroll record available yet.</Text>
      </View>
    );
  }

  // ── main render ─────────────────────────────────────────────────

  return (
    <ScreenWrapper activeTabKey="earnings">
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')} hitSlop={HIT}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* Net Pay Card */}
        <View style={styles.netPayCard}>
          <View style={styles.netPayCircleDecor} />
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayAmount}>{toCurrency(payroll.net_pay)}</Text>
          <Text style={styles.netPayPeriod}>
            Cutoff: {toDate(payroll.period_start)} – {toDate(payroll.period_end)}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{payroll.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          {earnings.map((e, i) => (
            <View key={i} style={i < earnings.length - 1 && styles.rowBorder}>
              <LineRow label={e.label} amount={e.amount} />
            </View>
          ))}
          <View style={[styles.rowBorder, styles.totalRowWrapper]}>
            <LineRow label="Gross Pay" amount={grossPay} bold />
          </View>
        </View>

        {/* Deductions Card */}
        {deductions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deductions</Text>
            {deductions.map((d, i) => (
              <View key={i} style={i < deductions.length - 1 && styles.rowBorder}>
                <LineRow label={d.label} amount={d.amount} deduction />
              </View>
            ))}
            <View style={[styles.rowBorder, styles.totalRowWrapper]}>
              <LineRow label="Total Deductions" amount={totalDeductions} deduction bold />
            </View>
          </View>
        )}

        {/* Cash Advance CTA */}
        <View style={styles.ctaCard}>
          <View>
            <Text style={styles.ctaTitle}>Need Cash Assistance?</Text>
            <Text style={styles.ctaSubtitle}>Request a cash advance (Bale)</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/cash-advance')}
            activeOpacity={0.85}
          >
            <Ionicons name="cash-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.ctaBtnText}>Request Cash Advance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </ScreenWrapper>
  );
}

// ─── constants ────────────────────────────────────────────────────

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

const C = {
  primary:    '#1A3C8F',
  accent:     '#F5C518',
  background: '#F0F2F5',
  card:       '#FFFFFF',
  text:       '#1A1A2E',
  muted:      '#8A8FA8',
  danger:     '#E74C3C',
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   C.primary,
    paddingTop:        12,
    paddingBottom:     16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  // Net Pay Card
  netPayCard: {
    backgroundColor: C.primary,
    borderRadius:    16,
    padding:         24,
    overflow:        'hidden',
  },
  netPayCircleDecor: {
    position:      'absolute',
    right:         -30,
    top:           -30,
    width:         140,
    height:        140,
    borderRadius:  70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  netPayLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 6 },
  netPayAmount: { color: C.accent, fontSize: 36, fontWeight: '800', marginBottom: 4 },
  netPayPeriod: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 10 },
  statusBadge: {
    alignSelf:       'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius:    6,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius:    14,
    padding:         18,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },

  // Row
  row:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  rowLabel:      { fontSize: 14, color: C.muted },
  rowAmount:     { fontSize: 14, color: C.text, fontWeight: '500' },
  deductionText: { color: C.danger },
  boldText:      { fontWeight: '700', color: C.text },
  totalRowWrapper: { borderTopWidth: 1.5, borderTopColor: '#E0E0EA', marginTop: 2 },

  // CTA card
  ctaCard: {
    backgroundColor: '#FFF8E1',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     '#FFECB3',
    padding:         18,
    gap:             14,
  },
  ctaTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
  ctaSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  ctaBtn: {
    backgroundColor: C.accent,
    borderRadius:    10,
    paddingVertical: 13,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },

  // States
  errorText:     { color: C.danger, fontSize: 14, textAlign: 'center', marginTop: 12 },
  emptyText:     { color: C.muted,  fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn:      { marginTop: 16, backgroundColor: C.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText:  { color: '#fff', fontWeight: '600' },
});
