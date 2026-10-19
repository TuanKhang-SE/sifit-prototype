import { API_ENDPOINTS } from '../constants/apiEndpoints';
import apiClient from './apiClient';

export async function listCategories() {
  const response = await apiClient.get(API_ENDPOINTS.categories);
  return response.data?.data?.categories || [];
}
