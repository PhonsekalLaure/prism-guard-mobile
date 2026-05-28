// prism-guard-mobile/services/earningsService.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchCurrentPayroll = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/mobile/earnings/payroll/current`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load payroll.');
  return json.data;
};

export const fetchCashAdvanceLimit = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/mobile/earnings/cash-advance/limit`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load limit.');
  return json.data;
};

export const submitCashAdvanceRequest = async ({ amount, reason }) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/mobile/earnings/cash-advance/request`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount, reason }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed.');
  return json.data;
};

export const fetchCashAdvanceHistory = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/mobile/earnings/cash-advance/history`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load history.');
  return json.data;
};