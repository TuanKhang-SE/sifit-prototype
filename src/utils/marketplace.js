export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);
export const idOf = value => typeof value === 'string' ? value : value?._id || value?.id;
