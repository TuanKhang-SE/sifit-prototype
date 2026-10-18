import sharp from 'sharp';

// Blur actual pixels, with a soft elliptical edge. Keep the rest byte-equivalent
// at the pixel level and preserve the input dimensions.
export async function blurFace(buffer, box) {
  const normalized = await sharp(buffer, { limitInputPixels: 25000000 }).rotate().flatten({ background: '#fff' }).png().toBuffer();
  if (!box) return normalized;
  const { width, height } = await sharp(normalized).metadata();
  const left = Math.max(0, Math.floor(box.x * width)), top = Math.max(0, Math.floor(box.y * height));
  const w = Math.min(width - left, Math.ceil(box.width * width)), h = Math.min(height - top, Math.ceil(box.height * height));
  if (w < 1 || h < 1) return normalized;
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="white"/></svg>`);
  const blurred = await sharp(normalized).extract({ left, top, width: w, height: h }).blur(Math.max(8, w / 5)).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return sharp(normalized).composite([{ input: blurred, left, top }]).removeAlpha().png().toBuffer();
}
