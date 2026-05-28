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
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCashAdvanceLimit,
  submitCashAdvanceRequest,
} from '../services/earningsService';

// ─── constants ────────────────────────────────────────────────────

const MIN_AMOUNT = 1000;

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

const C = {
  primary:    '#1A3C8F',
  accent:     '#F5C518',
  background: '#F0F2F5',
  card:       '#FFFFFF',
  text:       '#1A1A2E',
  muted:      '#8A8FA8',
  danger:     '#E74C3C',
};

// ─── helpers ──────────────────────────────────────────────────────

const toCurrency = (val) =>
  `₱${parseFloat(val ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── screen ───────────────────────────────────────────────────────

export default function CashAdvanceScreen() {
  const [limitData, setLimitData]     = useState(null);
  const [limitLoading, setLimitLoading] = useState(true);
  const [limitError, setLimitError]   = useState(null);

  const [amount, setAmount]           = useState('');
  const [reason, setReason]           = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

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

  useEffect(() => { loadLimit(); }, [loadLimit]);

  // ── derived ─────────────────────────────────────────────────────
  const available   = limitData?.available_limit ?? 0;
  const parsed      = parseFloat(amount) || 0;

  const amountError = (() => {
    if (!amount || amount === '') return null;
    if (parsed < MIN_AMOUNT)  return `Minimum is ${toCurrency(MIN_AMOUNT)}`;
    if (parsed > available)   return `Exceeds available limit of ${toCurrency(available)}`;
    return null;
  })();

  const canSubmit = parsed >= MIN_AMOUNT && parsed <= available && reason !== '' && !submitting;

  // ── handlers ────────────────────────────────────────────────────
  const handleAmountChange = (val) => {
    // Strip non-numeric except single decimal
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
              Alert.alert(
                'Request Submitted',
                'Your cash advance request is now pending approval.',
                [{ text: 'OK', onPress: () => router.back() }]
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
              placeholder="0.00"
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
            <Text style={[styles.hint, parsed > 0 && parsed < MIN_AMOUNT && styles.hintDanger]}>
              Min: {toCurrency(MIN_AMOUNT)}
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
      </ScrollView>
    </View>
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
    paddingTop:        52,
    paddingBottom:     16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  // Limit Card
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
  fieldLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },

  // Amount row
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
    flex:          1,
    fontSize:      16,
    color:         C.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  nudgeCol:  { gap: 2 },
  hintRow:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hint:      { fontSize: 11, color: C.muted },
  hintDanger:{ color: C.danger },
  errorMsg:  { fontSize: 12, color: C.danger, marginTop: 4 },

  // Reason picker
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

  // Submit
  submitBtn: {
    backgroundColor: C.accent,
    borderRadius:    10,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       24,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText:     { fontSize: 15, fontWeight: '700', color: C.primary },
});