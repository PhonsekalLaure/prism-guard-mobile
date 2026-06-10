import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EarningsHeader from '@/components/earnings/EarningsHeader';
import {
  PayrollBreakdown,
  PayrollNetPayCard,
} from '@/components/earnings/PayrollBreakdown';
import PayrollHistory from '@/components/earnings/PayrollHistory';
import { EARNINGS_COLORS as C } from '@/components/earnings/earningsTheme';
import ScreenWrapper from '@/components/dashboard/ScreenWrapper';
import { useActiveDeploymentAccess } from '@/hooks/useActiveDeploymentAccess';
import {
  fetchCurrentPayroll,
  fetchPayrollHistory,
} from '@/services/earningsService';

const HISTORY_PAGE_SIZE = 3;

function RetryCard({ message, onRetry }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
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
        style={styles.ctaButton}
        onPress={() => router.push('/cash-advance')}
        activeOpacity={0.85}
      >
        <Ionicons name="cash-outline" size={20} color={C.primary} style={styles.ctaIcon} />
        <Text style={styles.ctaButtonText}>Request Cash Advance</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EarningsScreen() {
  const isFocused = useIsFocused();
  const { deployment, deploymentLoading, profileLoading } = useActiveDeploymentAccess();
  const [payroll, setPayroll] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentError, setCurrentError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCurrent = useCallback(async (showLoader = true) => {
    if (!deployment) {
      setPayroll(null);
      setCurrentError(null);
      setCurrentLoading(false);
      return;
    }

    try {
      if (showLoader) setCurrentLoading(true);
      setCurrentError(null);
      setPayroll(await fetchCurrentPayroll());
    } catch (err) {
      setPayroll(null);
      setCurrentError(err.message);
    } finally {
      setCurrentLoading(false);
    }
  }, [deployment]);

  const loadHistory = useCallback(async (page = 1, showLoader = true) => {
    try {
      if (showLoader) setHistoryLoading(true);
      setHistoryError(null);
      const result = await fetchPayrollHistory({
        page,
        limit: HISTORY_PAGE_SIZE,
      });
      setHistory(result.history);
      setHistoryPage(result.page);
      setHistoryTotalCount(result.totalCount);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused || profileLoading || deploymentLoading) return;
    loadCurrent();
    loadHistory(1);
  }, [
    deploymentLoading,
    isFocused,
    loadCurrent,
    loadHistory,
    profileLoading,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadCurrent(false),
      loadHistory(1, false),
    ]);
    setRefreshing(false);
  };

  const initialLoading = profileLoading
    || deploymentLoading
    || (currentLoading && historyLoading);

  if (initialLoading) {
    return (
      <ScreenWrapper activeTabKey="earnings">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper activeTabKey="earnings">
      <View style={styles.container}>
        <EarningsHeader title="My Earnings" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          )}
        >
          {!deployment && (
            <View style={styles.accessCard}>
              <Ionicons name="briefcase-outline" size={28} color={C.primary} />
              <View style={styles.accessContent}>
                <Text style={styles.accessTitle}>No active assignment</Text>
                <Text style={styles.accessText}>
                  Current earnings estimates and cash advances are available only during an active
                  deployment. Your finalized payroll history remains available below.
                </Text>
              </View>
            </View>
          )}

          {deployment && currentLoading && (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={C.primary} />
              <Text style={styles.emptyText}>Loading current earnings...</Text>
            </View>
          )}

          {deployment && !currentLoading && currentError && (
            <RetryCard message={currentError} onRetry={() => loadCurrent()} />
          )}

          {deployment && !currentLoading && !currentError && !payroll && (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={34} color={C.primary} />
              <Text style={styles.emptyTitle}>Earnings are being prepared</Text>
              <Text style={styles.emptyText}>
                Payroll estimates will appear here once records are available for this assignment.
              </Text>
            </View>
          )}

          {deployment && !currentLoading && !currentError && payroll && (
            <>
              <PayrollNetPayCard
                payroll={payroll}
                decorated
                label={payroll.is_estimate ? 'ESTIMATED NET PAY' : 'LATEST NET PAY'}
                periodPrefix="Cutoff: "
                showEstimateNote
              />
              <PayrollBreakdown
                payroll={payroll}
                earningsTitle="Current Earnings"
                deductionsTitle="Current Deductions"
              />
            </>
          )}

          {deployment && <CashAdvanceCta />}

          <PayrollHistory
            history={history}
            loading={historyLoading}
            error={historyError}
            page={historyPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalCount={historyTotalCount}
            onOpenRecord={(recordId) => router.push(`/payroll/${recordId}`)}
            onPageChange={loadHistory}
            onRetry={() => loadHistory(historyPage)}
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  ctaCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFECB3',
    padding: 18,
    gap: 14,
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  ctaSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  ctaButton: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: { marginRight: 8 },
  ctaButtonText: { fontSize: 15, fontWeight: '700', color: C.primary },
  accessCard: {
    backgroundColor: '#EAF0FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDD9F7',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  accessContent: { flex: 1 },
  accessTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  accessText: { color: C.muted, fontSize: 13, lineHeight: 19 },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: C.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  errorText: { color: C.danger, fontSize: 13, textAlign: 'center' },
  retryButton: {
    marginTop: 6,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
});
