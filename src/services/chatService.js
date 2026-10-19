import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { normalizeConversation, normalizeMessage } from '../utils/normalizers';
import apiClient from './apiClient';

export async function createConversation(productId) {
  const response = await apiClient.post(API_ENDPOINTS.chat.conversations, { productId });
  return normalizeConversation(response.data?.data?.conversation);
}

export async function listConversations(params = {}) {
  const response = await apiClient.get(API_ENDPOINTS.chat.conversations, { params });
  return {
    items: (response.data?.data?.items || []).map(normalizeConversation),
    pagination: response.data?.data?.pagination,
  };
}

export async function listMessages(conversationId, params = {}) {
  const response = await apiClient.get(API_ENDPOINTS.chat.messages(conversationId), { params });
  return {
    items: (response.data?.data?.items || []).map(normalizeMessage).reverse(),
    nextCursor: response.data?.data?.nextCursor,
    hasMore: response.data?.data?.hasMore,
  };
}

export async function sendMessage(conversationId, content, clientMessageId = crypto.randomUUID()) {
  const response = await apiClient.post(API_ENDPOINTS.chat.messages(conversationId), {
    clientMessageId,
    type: 'TEXT',
    content,
  });
  return normalizeMessage(response.data?.data?.message);
}

export async function markRead(id, lastReadMessageId) {
  return (await apiClient.patch(API_ENDPOINTS.chat.read(id), { lastReadMessageId })).data.data;
}

export async function reportMessage(id, reason) {
  return (await apiClient.post(`/messages/${id}/report`, { reason })).data.data.report;
}

export async function blockUser(id) {
  await apiClient.post(`/users/${id}/block`);
}
export async function unblockUser(id) { await apiClient.delete(`/users/${id}/block`); }
export async function getBlockStatus(id) { return (await apiClient.get(`/users/${id}/block`)).data.data.blocked; }
