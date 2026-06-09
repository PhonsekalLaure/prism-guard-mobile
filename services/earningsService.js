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

async function requestEarnings(path, options = {}) {
  const {
    fallbackMessage = 'Request failed.',
    notFoundAsNull = false,
    ...fetchOptions
  } = options;
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/mobile/earnings${path}`, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers || {}),
    },
  });
  const json = await res.json();
  if (res.status === 404 && notFoundAsNull) return null;
  if (!res.ok) throw new Error(json.message || fallbackMessage);
  return json.data;
}

export const fetchCurrentPayroll = async () => {
  return requestEarnings('/payroll/current', {
    fallbackMessage: 'Failed to load payroll.',
    notFoundAsNull: true,
  });
};

export const fetchCashAdvanceLimit = async () => {
  return requestEarnings('/cash-advance/limit', {
    fallbackMessage: 'Failed to load limit.',
  });
};

export const submitCashAdvanceRequest = async ({ amount, reason }) => {
  return requestEarnings('/cash-advance/request', {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
};

export const fetchCashAdvanceHistory = async ({ page = 1, limit = 3 } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const result = await requestEarnings(`/cash-advance/history?${params.toString()}`, {
    fallbackMessage: 'Failed to load history.',
  });
  return {
    history: result?.history || [],
    totalCount: result?.totalCount || 0,
    page: result?.page || page,
    limit: result?.limit || limit,
  };
};
