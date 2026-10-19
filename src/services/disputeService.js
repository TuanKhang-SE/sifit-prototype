import { API_ENDPOINTS } from '../constants/apiEndpoints';
import apiClient from './apiClient';

export async function createDispute(orderId, data) {
  const response = await apiClient.post(API_ENDPOINTS.disputes.create(orderId), data);
  return response.data?.data?.dispute;
}

export async function listMyDisputes(params = {}) {
  const response = await apiClient.get(API_ENDPOINTS.disputes.mine, { params });
  return response.data?.data;
}

export async function getDispute(id) {
  const response = await apiClient.get(API_ENDPOINTS.disputes.byId(id));
  return response.data?.data?.dispute;
}
