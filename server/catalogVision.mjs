import path from 'node:path';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const cacheDir = path.resolve(process.env.SIFIT_MODEL_CACHE_DIR || 'server/data/models');
const file = path.resolve(process.env.SIFIT_VISION_CACHE || 'server/data/catalog-vision.json');
let classifierPromise, recordsPromise;
const pending = new Map();
const labels = {
  kind: { shirt: 'a fashion shirt or blouse', tshirt: 'a casual t-shirt', knitwear: 'a knitted sweater', jacket: 'a jacket or coat', trousers: 'long trousers or pants', jeans: 'denim jeans', shorts: 'short pants', skirt: 'a skirt', dress: 'a one-piece dress', sneakers: 'casual sneakers or sports shoes', formalShoes: 'formal leather shoes or loafers', sandals: 'sandals or slippers', heels: 'high heel shoes', boots: 'boots', bag: 'a handbag or backpack' },
  palette: { white: 'white colored clothing', black: 'black colored clothing', gray: 'gray colored clothing', beige: 'beige or cream colored clothing', brown: 'brown colored clothing', navy: 'dark navy blue clothing', blue: 'blue colored clothing', green: 'green colored clothing', red: 'red colored clothing', pink: 'pink colored clothing', purple: 'purple colored clothing', yellow: 'yellow colored clothing', orange: 'orange colored clothing' },
  clothingStyle: { masculine: 'masculine menswear clothing design', feminine: 'feminine womenswear clothing design', neutral: 'gender neutral unisex clothing design' },
};
async function classifier() {
  if (!classifierPromise) classifierPromise = (async () => {
    const { pipeline, env } = await import('@huggingface/transformers'); env.cacheDir = cacheDir;
    return pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', { dtype: 'q8', device: 'cpu', session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } });
  })().catch(e => { classifierPromise = null; throw e; });
  return classifierPromise;
}
async function records() {
  recordsPromise ||= readFile(file, 'utf8').then(JSON.parse).catch(e => { if (e.code !== 'ENOENT') throw e; return {}; });
  return recordsPromise;
}
let flush = Promise.resolve();
async function saveRecords() {
  const snapshot = JSON.stringify(await records());
  flush = flush.catch(() => {}).then(async () => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file + '.tmp', snapshot); await rename(file + '.tmp', file); });
  return flush;
}
export async function analyzeProduct(product) {
  if (!product.images[0]?.startsWith('/images/catalog/')) return null;
  const filename = product.images[0].slice('/images/catalog/'.length);
  if (!/^[a-z0-9_-]+\.webp$/.test(filename)) throw new Error('Invalid catalog reference');
  const buffer = await readFile(path.resolve('public/images/catalog', filename));
  const key = createHash('sha256').update(buffer).update(product.category + ':vision-v2').digest('hex');
  const cache = await records(); if (cache[key]) return cache[key];
  if (pending.has(key)) return pending.get(key);
  const work = (async () => {
    const { RawImage } = await import('@huggingface/transformers');
    let input = sharp(buffer).rotate(); const metadata = await input.metadata();
    // Inspect the garment region of on-model product shots. Never infer the
    // identity/gender of a user or pictured person; classify the clothing design.
    if (product.garmentPhotoType === 'model') {
      const top = Math.round(metadata.height * (product.category === 'Bottoms' ? .12 : .2));
      input = input.extract({ left: 0, top, width: metadata.width, height: Math.round(metadata.height * (product.category === 'Bottoms' ? .82 : .58)) });
    }
    const pixels = await input.resize(384, 384, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).raw().toBuffer();
    const raw = new RawImage(new Uint8ClampedArray(pixels), 384, 384, 3);
    const all = Object.values(labels).flatMap(group => Object.values(group));
    const result = await (await classifier())(raw, all);
    const prediction = {};
    for (const [name, group] of Object.entries(labels)) {
      const allowedKinds = { Tops: ['shirt', 'tshirt', 'knitwear'], Outerwear: ['jacket', 'knitwear', 'shirt'], Bottoms: ['trousers', 'jeans', 'shorts', 'skirt', 'dress'], Footwear: ['sneakers', 'formalShoes', 'sandals', 'heels', 'boots'], Accessories: ['bag'] };
      const values = Object.entries(group).filter(([key]) => name !== 'kind' || allowedKinds[product.category]?.includes(key)).map(([key, label]) => ({ key, score: result.find(p => p.label === label)?.score || 0 })).sort((a, b) => b.score - a.score);
      const total = values.reduce((n, p) => n + p.score, 0);
      prediction[name] = values[0].key; prediction[name + 'Confidence'] = total ? values[0].score / total : 0;
    }
    const kind = prediction.kind;
    prediction.category = ['trousers', 'jeans', 'shorts', 'skirt', 'dress'].includes(kind) ? 'Bottoms' : ['sneakers', 'formalShoes', 'sandals', 'heels', 'boots'].includes(kind) ? 'Footwear' : kind === 'bag' ? 'Accessories' : kind === 'jacket' ? 'Outerwear' : 'Tops';
    prediction.model = 'clip-vit-base-patch32'; prediction.imageHash = key;
    cache[key] = prediction; await saveRecords(); return prediction;
  })();
  pending.set(key, work); try { return await work; } finally { pending.delete(key); }
}
export async function analyzeCatalog(products, onProgress) {
  const output = [];
  for (const product of products) {
    const vision = await analyzeProduct(product);
    if (vision) {
      // Use retailer labels where known; visual classification fills gaps.
      const kinds = { Tshirts: 'tshirt', Shirts: 'shirt', Trousers: 'trousers', Shorts: 'shorts', Jeans: 'jeans', 'Track Pants': 'trousers', Jackets: 'jacket', Sweaters: 'knitwear', Sweatshirts: 'knitwear', Dresses: 'dress', Skirts: 'skirt', Handbags: 'bag', 'Sports Shoes': 'sneakers', 'Casual Shoes': 'sneakers', 'Formal Shoes': 'formalShoes', Sandals: 'sandals', 'Flip Flops': 'sandals' };
      const name = product.color?.toLowerCase() || '';
      const palette = /navy/.test(name) ? 'navy' : /black/.test(name) ? 'black' : /grey|gray|silver/.test(name) ? 'gray' : /white/.test(name) ? 'white' : /beige|cream|khaki|tan/.test(name) ? 'beige' : /brown|coffee/.test(name) ? 'brown' : /blue|teal/.test(name) ? 'blue' : /green|olive/.test(name) ? 'green' : /red|maroon|burgundy/.test(name) ? 'red' : /pink/.test(name) ? 'pink' : /purple|lavender|mauve/.test(name) ? 'purple' : /yellow|gold|mustard/.test(name) ? 'yellow' : /orange|rust/.test(name) ? 'orange' : undefined;
      const article = product.source?.articleType;
      output.push({ ...product, vision: { ...vision, ...(kinds[article] ? { kind: kinds[article] } : {}), ...(article && palette ? { palette, paletteSource: 'retailer' } : {}) } });
    }
    onProgress?.(output.length, products.length);
  }
  return output;
}
