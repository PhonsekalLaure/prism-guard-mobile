import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toCurrency, toDate } from '@/utils/earningsFormatters';
import {
  EARNINGS_COLORS as C,
  EARNINGS_HIT_SLOP as HIT,
} from './earningsTheme';

export default function PayrollHistory({
  error,
  history,
  loading,
  onOpenRecord,
  onPageChange,
  onRetry,
  page,
  pageSize,
  totalCount,
}) {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const start = totalCount === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>Payroll History</Text>
        {totalCount > 0 && <Text style={styles.count}>{totalCount} records</Text>}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.inlineError}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRetry} hitSlop={HIT}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={30} color={C.muted} />
          <Text style={styles.emptyTitle}>No payroll history yet</Text>
          <Text style={styles.emptyText}>
            Approved and paid payroll records will appear here.
          </Text>
        </View>
      ) : (
        <>
          {history.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.historyRow,
                index < history.length - 1 && styles.rowBorder,
              ]}
              onPress={() => onOpenRecord(record.id)}
              activeOpacity={0.75}
            >
              <View style={styles.historyIcon}>
                <Ionicons name="receipt-outline" size={20} color={C.primary} />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyPeriod}>
                  {toDate(record.period_start)} - {toDate(record.period_end)}
                </Text>
                <View style={styles.historyMeta}>
                  <Text
                    style={[
                      styles.historyStatus,
                      { color: record.status === 'paid' ? C.success : C.primary },
                    ]}
                  >
                    {String(record.status).toUpperCase()}
                  </Text>
                  <Text style={styles.historyNet}>{toCurrency(record.net_pay)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}

          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
              onPress={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              <Ionicons name="chevron-back" size={16} color={page <= 1 ? C.muted : C.primary} />
              <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageText}>{start}-{end} of {totalCount}</Text>
            <TouchableOpacity
              style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
              onPress={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  page >= totalPages && styles.pageButtonTextDisabled,
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={page >= totalPages ? C.muted : C.primary}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: C.text, fontSize: 16, fontWeight: '700' },
  count: { color: C.muted, fontSize: 12 },
  loader: { marginVertical: 30 },
  inlineError: { alignItems: 'center', paddingVertical: 22, gap: 10 },
  errorText: { color: C.danger, fontSize: 13, textAlign: 'center' },
  retryLink: { color: C.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 24, paddingBottom: 10, gap: 8 },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: C.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: { flex: 1 },
  historyPeriod: { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 5 },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  historyNet: { color: C.text, fontSize: 13, fontWeight: '700' },
  pagination: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    paddingTop: 14,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  pageButtonDisabled: { opacity: 0.55 },
  pageButtonText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  pageButtonTextDisabled: { color: C.muted },
  pageText: { color: C.muted, fontSize: 11 },
});
