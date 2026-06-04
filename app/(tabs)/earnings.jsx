// prism-guard-mobile/app/(tabs)/earnings.jsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/dashboard/ScreenWrapper';
import { useActiveDeploymentAccess } from '@/hooks/useActiveDeploymentAccess';
import {
  buildDeductions,
  buildEarnings,
  getGrossPay,
  getTotalDeductions,
  toCurrency,
  toDate,
} from '@/utils/earningsFormatters';
import { fetchCurrentPayroll } from '../../services/earningsService';

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

const C = {
  primary: '#1A3C8F',
  accent: '#F5C518',
  background: '#F0F2F5',
  card: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#8A8FA8',
  danger: '#E74C3C',
};

function LineRow({ label, amount, deduction = false, bold = false }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.boldText]}>{label}</Text>
      <Text style={[
        styles.rowAmount,
        bold && styles.boldText,
        deduction && styles.deductionText,
      ]}
      >
        {deduction ? `- ${toCurrency(amount)}` : toCurrency(amount)}
      </Text>
    </View>
  );
}

function CenterState({
  icon,
  color,
  text,
  error = false,
  onRetry = null,
  children = null,
}) {
  return (
    <ScreenWrapper activeTabKey="earnings">
      <View style={styles.centered}>
        <Ionicons name={icon} size={48} color={color} />
        <Text style={error ? styles.errorText : styles.emptyText}>{text}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
        {children}
      </View>
    </ScreenWrapper>
  );
}

function CashAdvanceCta() {
  return (
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
  );
}

export default function EarningsScreen() {
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (profileLoading || deploymentLoading || !deployment) return;

    try {
      setError(null);
      if (!isRefresh) setLoading(true);
      setPayroll(await fetchCurrentPayroll());
    } catch (err) {
      setPayroll(null);
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
      Alert.alert('No Access', 'You have no access to this right now.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
      return undefined;
    }

    load();
    return undefined;
  }, [deployment, deploymentLoading, load, profileLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

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
      <CenterState
        icon="alert-circle-outline"
        color={C.danger}
        text={error}
        error
        onRetry={() => load()}
      />
    );
  }

  if (!payroll) {
    return (
      <CenterState
        icon="document-outline"
        color={C.muted}
        text="No payroll estimate available yet."
      >
        <View style={styles.stateCtaWrapper}>
          <CashAdvanceCta />
        </View>
      </CenterState>
    );
  }

  const grossPay = getGrossPay(payroll);
  const totalDeductions = getTotalDeductions(payroll);
  const earnings = buildEarnings(payroll);
  const deductions = buildDeductions(payroll);

  return (
    <ScreenWrapper activeTabKey="earnings">
      <View style={styles.container}>
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
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          )}
        >
          <View style={styles.netPayCard}>
            <View style={styles.netPayCircleDecor} />
            <Text style={styles.netPayLabel}>{payroll.is_estimate ? 'ESTIMATED NET PAY' : 'NET PAY'}</Text>
            <Text style={styles.netPayAmount}>{toCurrency(payroll.net_pay)}</Text>
            <Text style={styles.netPayPeriod}>
              Cutoff: {toDate(payroll.period_start)} - {toDate(payroll.period_end)}
            </Text>
            {payroll.is_estimate && (
              <Text style={styles.estimateNote}>
                Computed from available records for this cutoff. Final payroll may change after HR review.
              </Text>
            )}
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{String(payroll.status || 'estimate').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Earnings</Text>
            {earnings.map((item, index) => (
              <View key={item.label} style={index < earnings.length - 1 && styles.rowBorder}>
                <LineRow label={item.label} amount={item.amount} />
              </View>
            ))}
            <View style={[styles.rowBorder, styles.totalRowWrapper]}>
              <LineRow label="Gross Pay" amount={grossPay} bold />
            </View>
          </View>

          {deductions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Deductions</Text>
              {deductions.map((item, index) => (
                <View key={item.label} style={index < deductions.length - 1 && styles.rowBorder}>
                  <LineRow label={item.label} amount={item.amount} deduction />
                </View>
              ))}
              <View style={[styles.rowBorder, styles.totalRowWrapper]}>
                <LineRow label="Total Deductions" amount={totalDeductions} deduction bold />
              </View>
            </View>
          )}

          <CashAdvanceCta />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

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
  netPayPeriod: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 10 },
  estimateNote: { color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

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
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  rowLabel: { fontSize: 14, color: C.muted, flex: 1, paddingRight: 12 },
  rowAmount: { fontSize: 14, color: C.text, fontWeight: '500', textAlign: 'right' },
  deductionText: { color: C.danger },
  boldText: { fontWeight: '700', color: C.text },
  totalRowWrapper: { borderTopWidth: 1.5, borderTopColor: '#E0E0EA', marginTop: 2 },

  ctaCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFECB3',
    padding: 18,
    gap: 14,
    width: '100%',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  ctaSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  ctaBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },

  errorText: { color: C.danger, fontSize: 14, textAlign: 'center', marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  stateCtaWrapper: { width: '100%', marginTop: 20 },
});
