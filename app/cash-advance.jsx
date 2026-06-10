// prism-guard-mobile/app/cash-advance.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/dashboard/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCashAdvanceHistory,
  fetchCashAdvanceLimit,
  submitCashAdvanceRequest,
} from '../services/earningsService';

// ─── constants (UI only) ──────────────────────────────────────────

const REASONS = [
  'Emergency Medical',
  'Family Emergency',
  'School Tuition',
  'Utility Bills',
  'Home Repair',
  'Transportation',
  'Other',
];

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };
const HISTORY_PAGE_SIZE = 3;

const C = {
  primary:    '#1A3C8F',
  accent:     '#F5C518',
  background: '#F0F2F5',
  card:       '#FFFFFF',
  text:       '#1A1A2E',
  muted:      '#8A8FA8',
  danger:     '#E74C3C',
  success:    '#2E7D32',
  warning:    '#C27C0E',
};

// ─── helpers ──────────────────────────────────────────────────────

const toCurrency = (val) =>
  `₱${parseFloat(val ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return 'Recently submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently submitted';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const STATUS_META = {
  pending: { label: 'Pending', color: C.warning, icon: 'time-outline' },
  approved: { label: 'Approved', color: C.primary, icon: 'checkmark-circle-outline' },
  released: { label: 'Released', color: C.success, icon: 'cash-outline' },
  rejected: { label: 'Rejected', color: C.danger, icon: 'close-circle-outline' },
  settled: { label: 'Settled', color: C.muted, icon: 'receipt-outline' },
};

// ─── screen ───────────────────────────────────────────────────────

export default function CashAdvanceScreen() {
  const [limitData, setLimitData]       = useState(null);
  const [limitLoading, setLimitLoading] = useState(true);
  const [limitError, setLimitError]     = useState(null);

  const [amount, setAmount]             = useState('');
  const [reason, setReason]             = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [history, setHistory]           = useState([]);
  const [historyPage, setHistoryPage]   = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const loadLimit = useCallback(async () => {
    try {
      setLimitError(null);
      const data = await fetchCashAdvanceLimit();
      setLimitData(data);
    } catch (err) {
      setLimitError(err.message);
    } finally {
      setLimitLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const result = await fetchCashAdvanceHistory({
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
    loadLimit();
    loadHistory(1);
  }, [loadLimit, loadHistory]);

  // ── derived — inside component so they can access state ──────────
  const available = limitData?.available_limit ?? 0;
  const minAmount = limitData?.min_amount ?? 0;
  const parsed    = parseFloat(amount) || 0;

  const amountError = (() => {
    if (!amount) return null;
    if (parsed < minAmount) return `Minimum is ${toCurrency(minAmount)}`;
    if (parsed > available) return `Exceeds available limit of ${toCurrency(available)}`;
    return null;
  })();

  const canSubmit = parsed >= minAmount && parsed <= available && reason !== '' && !submitting;
  const historyTotalPages = Math.max(
    Math.ceil(historyTotalCount / HISTORY_PAGE_SIZE),
    1,
  );

  const handleHistoryPageChange = (page) => {
    if (page < 1 || page > historyTotalPages || historyLoading) return;
    loadHistory(page);
  };

  // ── handlers ─────────────────────────────────────────────────────

  const handleAmountChange = (val) => {
    const cleaned = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setAmount(cleaned);
  };

  const nudgeAmount = (delta) => {
    const next = Math.max(0, Math.min(available, parsed + delta));
    setAmount(next === 0 ? '' : String(next));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    Alert.alert(
      'Confirm Request',
      `Submit a cash advance request for ${toCurrency(parsed)}?\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await submitCashAdvanceRequest({ amount: parsed, reason });
              setAmount('');
              setReason('');
              setDropdownOpen(false);
              setLimitLoading(true);
              await Promise.all([loadLimit(), loadHistory(1)]);
              Alert.alert(
                'Request Submitted',
                'Your cash advance request is now pending approval.'
              );
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // ── render ───────────────────────────────────────────────────────

  return (
    <ScreenWrapper activeTabKey="earnings">
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Advance</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')} hitSlop={HIT}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available Limit Card */}
        <View style={styles.limitCard}>
          <View>
            <Text style={styles.limitLabel}>AVAILABLE LIMIT</Text>
            {limitLoading ? (
              <ActivityIndicator color={C.accent} size="small" style={{ marginTop: 8 }} />
            ) : limitError ? (
              <Text style={styles.limitErrorText}>{limitError}</Text>
            ) : (
              <>
                <Text style={styles.limitAmount}>{toCurrency(available)}</Text>
                {limitData && (
                  <Text style={styles.limitSub}>
                    {toCurrency(limitData.outstanding)} outstanding of {toCurrency(limitData.total_limit)} limit
                  </Text>
                )}
              </>
            )}
          </View>
          <View style={styles.limitIcon}>
            <Ionicons name="wallet" size={26} color={C.accent} />
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>

          {/* Amount */}
          <Text style={styles.fieldLabel}>Amount Required</Text>
          <View style={[styles.amountRow, !!amountError && styles.amountRowError]}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="500"
              placeholderTextColor={C.muted}
            />
            <View style={styles.nudgeCol}>
              <TouchableOpacity onPress={() => nudgeAmount(100)} hitSlop={HIT}>
                <Ionicons name="chevron-up"   size={16} color={C.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nudgeAmount(-100)} hitSlop={HIT}>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.hintRow}>
            <Text style={[styles.hint, parsed > 0 && parsed < minAmount && styles.hintDanger]}>
              Min: {toCurrency(minAmount)}
            </Text>
            <Text style={[styles.hint, parsed > available && styles.hintDanger]}>
              Max: {toCurrency(available)}
            </Text>
          </View>
          {!!amountError && <Text style={styles.errorMsg}>{amountError}</Text>}

          {/* Reason */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Reason</Text>
          <TouchableOpacity
            style={styles.reasonPicker}
            onPress={() => setDropdownOpen((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
            <Text style={[styles.reasonPickerText, !reason && { color: C.muted }]}>
              {reason || 'Select Reason'}
            </Text>
            <Ionicons
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={C.muted}
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdown}>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.dropdownItem, reason === r && styles.dropdownItemActive]}
                  onPress={() => { setReason(r); setDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownText, reason === r && styles.dropdownTextActive]}>
                    {r}
                  </Text>
                  {reason === r && <Ionicons name="checkmark" size={16} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color={C.primary} />
              : <Text style={styles.submitBtnText}>Submit Request</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Recent Requests</Text>
              <Text style={styles.historySubtitle}>Track approval and release status</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                loadHistory(1);
              }}
              hitSlop={HIT}
              disabled={historyLoading}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={historyLoading ? C.muted : C.primary}
              />
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <View style={styles.historyState}>
              <ActivityIndicator color={C.primary} size="small" />
              <Text style={styles.historyStateText}>Loading requests</Text>
            </View>
          ) : historyError ? (
            <View style={styles.historyState}>
              <Text style={styles.historyErrorText}>{historyError}</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.historyState}>
              <Text style={styles.historyStateText}>No cash advance requests yet.</Text>
            </View>
          ) : (
            history.map((item) => {
              const status = String(item.status || 'pending').toLowerCase();
              const statusMeta = STATUS_META[status] || STATUS_META.pending;
              const amountLabel = toCurrency(item.amount_approved || item.amount_requested);

              return (
                <View key={item.id} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: `${statusMeta.color}18` }]}>
                    <Ionicons name={statusMeta.icon} size={18} color={statusMeta.color} />
                  </View>
                  <View style={styles.historyBody}>
                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyAmount}>{amountLabel}</Text>
                      <Text style={[styles.historyStatus, { color: statusMeta.color }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                    <Text style={styles.historyReason} numberOfLines={1}>
                      {item.reason || 'No reason provided'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {historyTotalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  (historyLoading || historyPage <= 1) && styles.pageButtonDisabled,
                ]}
                onPress={() => handleHistoryPageChange(historyPage - 1)}
                disabled={historyLoading || historyPage <= 1}
                accessibilityLabel="Previous cash advance history page"
              >
                <Ionicons name="chevron-back" size={18} color={C.primary} />
              </TouchableOpacity>
              <Text style={styles.pageLabel}>
                Page {historyPage} of {historyTotalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  (historyLoading || historyPage >= historyTotalPages)
                    && styles.pageButtonDisabled,
                ]}
                onPress={() => handleHistoryPageChange(historyPage + 1)}
                disabled={historyLoading || historyPage >= historyTotalPages}
                accessibilityLabel="Next cash advance history page"
              >
                <Ionicons name="chevron-forward" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
    </ScreenWrapper>
  );
}

// ─── styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

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

  limitCard: {
    backgroundColor:  C.primary,
    borderRadius:     16,
    padding:          24,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
  },
  limitLabel:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 6 },
  limitAmount:    { color: '#fff', fontSize: 32, fontWeight: '800' },
  limitSub:       { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4 },
  limitErrorText: { color: C.accent, fontSize: 13, marginTop: 4 },
  limitIcon: {
    backgroundColor:  'rgba(255,255,255,0.18)',
    borderRadius:     12,
    width:            50,
    height:           50,
    alignItems:       'center',
    justifyContent:   'center',
  },

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
  fieldLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },

  amountRow: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1.5,
    borderColor:       '#DDE0EA',
    borderRadius:      10,
    paddingHorizontal: 12,
    backgroundColor:   '#FAFBFC',
  },
  amountRowError: { borderColor: C.danger },
  pesoSign:       { fontSize: 16, color: C.text, marginRight: 4 },
  amountInput: {
    flex:            1,
    fontSize:        16,
    color:           C.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  nudgeCol:   { gap: 2 },
  hintRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hint:       { fontSize: 11, color: C.muted },
  hintDanger: { color: C.danger },
  errorMsg:   { fontSize: 12, color: C.danger, marginTop: 4 },

  reasonPicker: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1.5,
    borderColor:       '#DDE0EA',
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:   13,
    backgroundColor:   '#FAFBFC',
  },
  reasonPickerText: { flex: 1, fontSize: 14, color: C.text },

  dropdown: {
    marginTop:       4,
    borderWidth:     1,
    borderColor:     '#DDE0EA',
    borderRadius:    10,
    overflow:        'hidden',
    backgroundColor: '#fff',
  },
  dropdownItem: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  dropdownItemActive: { backgroundColor: '#EEF2FF' },
  dropdownText:       { fontSize: 14, color: C.text },
  dropdownTextActive: { color: C.primary, fontWeight: '700' },

  submitBtn:         { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText:     { fontSize: 15, fontWeight: '700', color: C.primary },

  historyCard: {
    backgroundColor: C.card,
    borderRadius:    14,
    padding:         18,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  historyHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  historyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  historySubtitle: { fontSize: 11, color: C.muted, marginTop: 2 },
  historyState: {
    minHeight:      70,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  historyStateText: { color: C.muted, fontSize: 13 },
  historyErrorText: { color: C.danger, fontSize: 13, textAlign: 'center' },
  historyItem: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:  12,
    borderTopWidth:   1,
    borderTopColor:   '#EEF0F5',
  },
  historyIcon: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    12,
  },
  historyBody: { flex: 1 },
  historyTopRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            12,
  },
  historyAmount: { fontSize: 14, fontWeight: '700', color: C.text },
  historyStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  historyReason: { fontSize: 12, color: C.text, marginTop: 3 },
  historyDate: { fontSize: 11, color: C.muted, marginTop: 3 },
  pagination: {
    minHeight:      36,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            14,
    marginTop:      10,
  },
  pageButton: {
    width:           36,
    height:          36,
    borderWidth:     1,
    borderColor:     '#C8D3EC',
    borderRadius:    8,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#EEF2FF',
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageLabel: {
    minWidth:   84,
    textAlign:  'center',
    color:      C.muted,
    fontSize:   12,
    fontWeight: '700',
  },
});
