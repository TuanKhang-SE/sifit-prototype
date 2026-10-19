import { API_ENDPOINTS } from '../constants/apiEndpoints';
import apiClient from './apiClient';

export async function listAddresses() {
  const response = await apiClient.get(API_ENDPOINTS.addresses.root);
  return response.data?.data?.addresses || [];
}

export async function createAddress(data) {
  const response = await apiClient.post(API_ENDPOINTS.addresses.root, data);
  return response.data?.data?.address;
}

export async function updateAddress(id, data) {
  const response = await apiClient.patch(API_ENDPOINTS.addresses.byId(id), data);
  return response.data?.data?.address;
}

export async function deleteAddress(id) {
  await apiClient.delete(API_ENDPOINTS.addresses.byId(id));
}

export async function setDefaultAddress(id) {
  const response = await apiClient.patch(API_ENDPOINTS.addresses.default(id));
  return response.data?.data?.address;
}
