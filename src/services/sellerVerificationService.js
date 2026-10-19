import { API_ENDPOINTS } from '../constants/apiEndpoints';
import apiClient from './apiClient';

export async function submitVerification(data) {
  const response = await apiClient.post(API_ENDPOINTS.sellerVerification.submit, data);
  return response.data?.data?.verification;
}

export async function getVerificationStatus() {
  const response = await apiClient.get(API_ENDPOINTS.sellerVerification.status);
  return response.data?.data?.verification;
}
