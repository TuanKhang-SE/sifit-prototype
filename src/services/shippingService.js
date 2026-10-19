import { API_ENDPOINTS } from '../constants/apiEndpoints';
import apiClient from './apiClient';

export async function quote(data) {
  const response = await apiClient.post(API_ENDPOINTS.shipping.quote, data);
  return response.data?.data;
}

export async function createSellerShipment(orderId, data) {
  const response = await apiClient.post(API_ENDPOINTS.shipping.sellerShipment(orderId), data);
  return response.data?.data?.shipment;
}

export async function getShipment(id) {
  const response = await apiClient.get(API_ENDPOINTS.shipping.shipment(id));
  return response.data?.data?.shipment;
}

export async function getTracking(orderId) {
  const response = await apiClient.get(API_ENDPOINTS.shipping.tracking(orderId));
  return response.data?.data?.shipment;
}

export async function listSellerShipments(params = {}) {
  const response = await apiClient.get(API_ENDPOINTS.shipping.sellerShipments, { params });
  return response.data?.data;
}
