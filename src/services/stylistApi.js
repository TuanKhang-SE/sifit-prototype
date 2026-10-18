export async function api(path, options = {}) {
  let response;
  try { response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers } }); }
  catch { throw new Error('Không kết nối được máy chủ. Hãy chạy backend SiFit và thử lại.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(data?.error || 'Backend chưa sẵn sàng. Hãy chạy npm run dev:all.');
    error.status = response.status; throw error;
  }
  return data;
}
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
export function supportsTryOn(product, engine = 'v1.6') { return (engine === 'max' ? ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'] : ['Tops', 'Bottoms', 'Outerwear']).includes(product.category) && product.status === 'active'; }

// Local blurred preview. Backend keeps an owner-only original for reversible
// edits and applies privacy before sending an image to a provider.
export async function preparePhoto(file, hideFace, faceBox, photoMode = 'remove') {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  const nativeScale = Math.min(1, 1080 / bitmap.width, 1620 / bitmap.height);
  canvas.width = photoMode === 'original' ? Math.max(1, Math.round(bitmap.width * nativeScale)) : 864;
  canvas.height = photoMode === 'original' ? Math.max(1, Math.round(bitmap.height * nativeScale)) : 1296;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const scale = Math.min(W / bitmap.width, H / bitmap.height);
  const width = bitmap.width * scale, height = bitmap.height * scale;
  ctx.drawImage(bitmap, (W - width) / 2, (H - height) / 2, width, height); bitmap.close();
  if (hideFace) {
    if (!faceBox) throw new Error('Chọn vùng mặt cần ẩn trước khi tạo ảnh.');
    const copy = document.createElement('canvas'); copy.width = W; copy.height = H;
    copy.getContext('2d').drawImage(canvas, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse((faceBox.x + faceBox.width / 2) * W, (faceBox.y + faceBox.height / 2) * H, faceBox.width * W / 2, faceBox.height * H / 2, 0, 0, 2 * Math.PI);
    ctx.clip();
    ctx.filter = `blur(${Math.max(8, faceBox.width * W / 5)}px)`;
    ctx.drawImage(copy, 0, 0);
    ctx.restore();
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không đọc được ảnh.')), 'image/png'));
}
