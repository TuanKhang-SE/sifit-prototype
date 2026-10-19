export function getApiErrorMessage(error, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  if (!error) return fallback;

  const response = error.response?.data;
  if (response?.errors?.length) {
    return response.errors.map(item => item.message).join('\n');
  }

  return response?.message || error.message || fallback;
}
