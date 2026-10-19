export function formatOrderDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Chưa xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium',
  }).format(new Date(value));
}

export function timeRemaining(value, now) {
  const seconds = Math.max(0, Math.ceil((new Date(value).getTime() - now) / 1000));
  if (!seconds) return 'Đã hết hạn';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `Còn ${days ? `${days} ngày ` : ''}${hours} giờ ${minutes} phút ${seconds % 60} giây`;
}
