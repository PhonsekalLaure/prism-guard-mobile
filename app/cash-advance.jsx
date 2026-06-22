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
  Modal,
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
  pending:  { label: 'Pending',  color: C.warning, icon: 'time-outline'             },
  approved: { label: 'Approved', color: C.primary, icon: 'checkmark-circle-outline' },
  released: { label: 'Released', color: C.success, icon: 'cash-outline'             },
  rejected: { label: 'Rejected', color: C.danger,  icon: 'close-circle-outline'     },
  settled:  { label: 'Settled',  color: C.muted,   icon: 'receipt-outline'          },
};

// ─── ConfirmRequestModal ──────────────────────────────────────────

const ConfirmRequestModal = ({ visible, amount, reason, submitting, onCancel, onConfirm }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
    <View style={styles.submittedOverlay}>
      <View style={styles.submittedCard}>

        {/* Icon */}
        <View style={[styles.submittedIconWrap, { backgroundColor: `${C.primary}18` }]}>
          <Ionicons name="cash-outline" size={30} color={C.primary} />
        </View>

        <Text style={styles.submittedTitle}>Confirm Request</Text>
        <Text style={styles.submittedMessage}>
          Please review your cash advance details before submitting.
        </Text>

        {/* Summary rows */}
        <View style={styles.submittedSummary}>
          <Text style={styles.submittedSummaryLabel}>Amount</Text>
          <Text style={styles.submittedSummaryValue}>{toCurrency(amount)}</Text>
        </View>
        <View style={[styles.submittedSummary, { marginTop: 8 }]}>
          <Text style={styles.submittedSummaryLabel}>Reason</Text>
          <Text style={[styles.submittedSummaryValue, { fontSize: 13, color: C.text, flexShrink: 1, textAlign: 'right' }]}>
            {reason}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.confirmBtnRow}>
          <TouchableOpacity
            style={[styles.confirmBtn, styles.confirmBtnCancel]}
            onPress={onCancel}
            activeOpacity={0.8}
            disabled={submitting}
          >
            <Text style={styles.confirmBtnCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, styles.confirmBtnSubmit, submitting && { opacity: 0.7 }]}
            onPress={onConfirm}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={C.primary} size="small" />
              : <Text style={styles.submittedDoneText}>Submit</Text>
            }
          </TouchableOpacity>
        </View>

      </View>
    </View>
  </Modal>
);

// ─── RequestSubmittedModal ────────────────────────────────────────

const RequestSubmittedModal = ({ visible, amountLabel, onDone }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onDone}>
    <View style={styles.submittedOverlay}>
      <View style={styles.submittedCard}>
        <View style={styles.submittedIconWrap}>
          <Ionicons name="time" size={34} color={C.warning} />
        </View>
        <Text style={styles.submittedTitle}>Request Submitted</Text>
        <Text style={styles.submittedMessage}>
          Your cash advance request is now pending approval.
        </Text>
        {amountLabel ? (
          <View style={styles.submittedSummary}>
            <Text style={styles.submittedSummaryLabel}>Amount Requested</Text>
            <Text style={styles.submittedSummaryValue}>{amountLabel}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.submittedDoneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.submittedDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

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
  const [submittedAmount, setSubmittedAmount] = useState(null);
  const [confirmVisible, setConfirmVisible]   = useState(false);   // ← new

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

  // ── derived ───────────────────────────────────────────────────────
  const available = limitData?.available_limit ?? 0;
  const minAmount = limitData?.min_amount ?? 0;
  const parsed    = parseFloat(amount) || 0;
  const requestLimit = limitData?.request_limit_per_cutoff ?? 2;
  const requestsRemaining = limitData?.requests_remaining_this_cutoff ?? requestLimit;
  const requestLimitReached = requestsRemaining <= 0;

  const amountError = (() => {
    if (!amount) return null;
    if (parsed < minAmount) return `Minimum is ${toCurrency(minAmount)}`;
    if (parsed > available) return `Exceeds available limit of ${toCurrency(available)}`;
    return null;
  })();

  const canSubmit = !requestLimitReached
    && parsed >= minAmount
    && parsed <= available
    && reason !== ''
    && !submitting;
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

  // Opens the custom confirm modal instead of Alert
  const handleSubmit = () => {
    if (!canSubmit) return;
    setConfirmVisible(true);
  };

  // Called when user taps Submit inside the confirm modal
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const requestedAmount = parsed;
      await submitCashAdvanceRequest({ amount: parsed, reason });
      setAmount('');
      setReason('');
      setDropdownOpen(false);
      setConfirmVisible(false);
      setLimitLoading(true);
      await Promise.all([loadLimit(), loadHistory(1)]);
      setSubmittedAmount(requestedAmount);
    } catch (err) {
      setConfirmVisible(false);
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
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
                  <>
                    <Text style={styles.limitSub}>
                      {toCurrency(limitData.outstanding)} outstanding of {toCurrency(limitData.total_limit)} limit
                    </Text>
                    <Text style={styles.limitSub}>
                      {requestsRemaining} of {requestLimit} requests remaining this cutoff
                    </Text>
                  </>
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
          {requestLimitReached && (
            <Text style={styles.errorMsg}>
              You have reached the two-request limit for this payroll cutoff.
            </Text>
          )}

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
            <Text style={styles.submitBtnText}>Submit Request</Text>
          </TouchableOpacity>
        </View>

        {/* History Card */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Recent Requests</Text>
              <Text style={styles.historySubtitle}>Track approval and release status</Text>
            </View>
            <TouchableOpacity
              onPress={() => { loadHistory(1); }}
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

      {/* Confirm Modal */}
      <ConfirmRequestModal
        visible={confirmVisible}
        amount={parsed}
        reason={reason}
        submitting={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      {/* Success Modal */}
      <RequestSubmittedModal
        visible={submittedAmount !== null}
        amountLabel={submittedAmount !== null ? toCurrency(submittedAmount) : ''}
        onDone={() => setSubmittedAmount(null)}
      />
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
  historyTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
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
  historyDate:   { fontSize: 11, color: C.muted, marginTop: 3 },
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

  // ── shared modal styles ──────────────────────────────────────────
  submittedOverlay: {
    flex:            1,
    backgroundColor: 'rgba(13, 31, 60, 0.48)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         20,
  },
  submittedCard: {
    width:           '100%',
    maxWidth:        360,
    backgroundColor: C.card,
    borderRadius:    18,
    padding:         22,
    alignItems:      'center',
    shadowColor:     '#093269',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.18,
    shadowRadius:    18,
    elevation:       10,
  },
  submittedIconWrap: {
    width:           62,
    height:          62,
    borderRadius:    31,
    backgroundColor: `${C.warning}18`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    14,
  },
  submittedTitle: {
    fontSize:   18,
    fontWeight: '800',
    color:      C.primary,
    textAlign:  'center',
  },
  submittedMessage: {
    marginTop:  6,
    fontSize:   13,
    color:      C.muted,
    lineHeight: 19,
    textAlign:  'center',
  },
  submittedSummary: {
    width:             '100%',
    marginTop:         16,
    paddingVertical:   12,
    paddingHorizontal: 14,
    borderRadius:      12,
    backgroundColor:   '#F5F7FA',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    gap:               12,
  },
  submittedSummaryLabel: {
    fontSize:      10,
    fontWeight:    '800',
    color:         C.muted,
    textTransform: 'uppercase',
  },
  submittedSummaryValue: {
    fontSize:   15,
    fontWeight: '800',
    color:      C.primary,
  },
  submittedDoneBtn: {
    width:          '100%',
    marginTop:      20,
    borderRadius:   12,
    backgroundColor: C.accent,
    paddingVertical: 14,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    C.accent,
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.28,
    shadowRadius:   14,
    elevation:      6,
  },
  submittedDoneText: {
    fontSize:   14,
    fontWeight: '800',
    color:      C.primary,
  },

  // ── confirm modal buttons ────────────────────────────────────────
  confirmBtnRow: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     20,
    width:         '100%',
  },
  confirmBtn: {
    flex:           1,
    borderRadius:   12,
    paddingVertical: 14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: '#F0F2F5',
  },
  confirmBtnCancelText: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.text,
  },
  confirmBtnSubmit: {
    backgroundColor: C.accent,
    shadowColor:     C.accent,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.28,
    shadowRadius:    14,
    elevation:       6,
  },
});