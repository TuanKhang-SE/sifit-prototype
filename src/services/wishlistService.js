import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { normalizeProduct } from '../utils/normalizers';
import apiClient from './apiClient';

const normalizeWishlist = wishlist => ({
  ...wishlist,
  items: (wishlist?.items || []).map(item => ({
    ...item,
    product: normalizeProduct({
      id: item.productId,
      title: item.title,
      price: item.price,
      images: item.primaryImage ? [item.primaryImage] : [],
      brand: item.brand,
      size: item.size,
      condition: item.condition,
      seller: item.seller,
      status: item.availability === 'AVAILABLE' ? 'ACTIVE' : item.availability,
    }),
  })),
});

export async function getWishlist() {
  const response = await apiClient.get(API_ENDPOINTS.wishlist.root);
  return normalizeWishlist(response.data?.data?.wishlist);
}

export async function addItem(productId) {
  const response = await apiClient.post(API_ENDPOINTS.wishlist.items, { productId });
  return normalizeWishlist(response.data?.data?.wishlist);
}

export async function removeItem(productId) {
  const response = await apiClient.delete(API_ENDPOINTS.wishlist.item(productId));
  return normalizeWishlist(response.data?.data?.wishlist);
}

export async function checkItem(productId) {
  const response = await apiClient.get(API_ENDPOINTS.wishlist.item(productId));
  return response.data?.data || { isWishlisted: false };
}
