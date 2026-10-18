import { fileURLToPath } from 'node:url';
const assets = new URL('../src/image/backgroud-aistylist/', import.meta.url);
const sceneFeet = [0.667, 0.692, 0.709, 0.7];
export function backgroundOptions(id) {
  if (id === 'white') return { backgroundId: id };
  const match = /^(scene|decor)-([1-4])$/.exec(id);
  if (!match) throw Object.assign(new Error('Phông nền không hợp lệ.'), { status: 400 });
  const type = match[1], number = Number(match[2]);
  const file = `${type === 'scene' ? 'nenbg' : 'nen-removebg'} (${number}).png`;
  return { backgroundId: id, [type === 'scene' ? 'backgroundPath' : 'decorPath']: fileURLToPath(new URL(file, assets)), footRatio: type === 'scene' ? sceneFeet[number - 1] : undefined };
}
