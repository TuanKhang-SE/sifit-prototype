import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { normalizeCartItemProduct } from '../utils/normalizers';
import apiClient from './apiClient';

const normalizeCart = cart => ({
  ...cart,
  items: (cart?.items || []).map(item => ({
    ...item,
    product: normalizeCartItemProduct(item),
  })),
});

export async function getCart() {
  const response = await apiClient.get(API_ENDPOINTS.cart.root);
  return normalizeCart(response.data?.data?.cart);
}

export async function addItem(productId) {
  const response = await apiClient.post(API_ENDPOINTS.cart.items, { productId });
  return normalizeCart(response.data?.data?.cart);
}

export async function removeItem(productId) {
  const response = await apiClient.delete(API_ENDPOINTS.cart.item(productId));
  return normalizeCart(response.data?.data?.cart);
}

export async function clearCart() {
  const response = await apiClient.delete(API_ENDPOINTS.cart.root);
  return normalizeCart(response.data?.data?.cart);
}
