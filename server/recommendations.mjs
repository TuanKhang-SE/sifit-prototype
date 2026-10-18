import path from 'node:path';
import { MOCK_LISTINGS } from '../src/data/mockData.js';
import { analyzeCatalog } from './catalogVision.mjs';
import { geminiOutfits } from './geminiStylist.mjs';

let extractorPromise, catalogPromise, visualCatalogPromise, outfitVectorsPromise;
const dataDir = path.resolve(process.env.SIFIT_DATA_DIR || 'server/data');
async function extractor() {
  if (!extractorPromise) extractorPromise = (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.cacheDir = path.resolve(process.env.SIFIT_MODEL_CACHE_DIR || path.join(dataDir, 'models'));
    return pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { dtype: 'q8', device: 'cpu' });
  })().catch(error => { extractorPromise = null; throw error; });
  return extractorPromise;
}
const catalog = MOCK_LISTINGS.filter(p => p.status === 'active' && ['Tops', 'Bottoms', 'Outerwear'].includes(p.category));
const description = p => `${p.title}. ${p.category}. ${p.color}. ${p.material === 'Chưa xác minh' ? '' : p.material}. ${p.gender}. ${p.source ? '' : p.description}`;
export function rankRecommendations(products, vectors, query, excluded = [], budget = Infinity, gender = 'all') {
  const ranked = products.map((product, index) => ({ product, score: vectors[index].reduce((sum, n, j) => sum + n * query[j], 0) })).filter(p => !excluded.includes(p.product._id) && p.product.price <= budget && (gender === 'all' || p.product.gender === gender || (gender !== 'unisex' && p.product.gender === 'unisex'))).sort((a, b) => b.score - a.score);
  // Give the user complete options, not six nearly identical tops.
  const picked = [];
  for (const category of ['Tops', 'Bottoms', 'Outerwear']) {
    const match = ranked.find(p => p.product.category === category);
    if (match) picked.push(match);
  }
  for (const match of ranked) if (!picked.includes(match) && picked.length < 6) picked.push(match);
  return picked.map(({ product, score }) => ({ ...product, similarity: Math.round(score * 100) / 100 }));
}
export async function recommend({ prompt, excludeIds = [], budget, gender = 'all' }) {
  const model = await extractor();
  if (!catalogPromise) catalogPromise = (async () => {
    const vectors = [];
    for (let index = 0; index < catalog.length; index += 12) {
      vectors.push(...(await model(catalog.slice(index, index + 12).map(description), { pooling: 'mean', normalize: true })).tolist());
    }
    return vectors;
  })().catch(error => { catalogPromise = null; throw error; });
  const vectors = await catalogPromise;
  const vector = (await model(prompt, { pooling: 'mean', normalize: true })).tolist()[0];
  return { products: rankRecommendations(catalog, vectors, vector, excludeIds, budget, gender), engine: 'multilingual-minilm', creditCost: 0 };
}

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
const neutral = new Set(['black', 'white', 'gray', 'beige', 'brown', 'navy']);
const family = color => ['blue', 'navy'].includes(color) ? 'blue' : ['red', 'pink'].includes(color) ? 'red' : ['beige', 'brown', 'orange'].includes(color) ? 'warm' : color;
export function colorHarmony(a, b) {
  if (!a || !b) return 0;
  if (a === b || family(a) === family(b)) return .95;
  if (neutral.has(a) && neutral.has(b)) return 1;
  if (['black', 'white', 'gray', 'beige'].includes(a) || ['black', 'white', 'gray', 'beige'].includes(b)) return .9;
  if ((family(a) === 'blue' && ['brown', 'beige'].includes(b)) || (family(b) === 'blue' && ['brown', 'beige'].includes(a))) return .9;
  if (neutral.has(a) || neutral.has(b)) return .75;
  return .15;
}
function productGender(product) {
  if (product.gender !== 'unisex') return product.gender;
  if (product.vision.clothingStyleConfidence > .42) return ({ masculine: 'men', feminine: 'women' }[product.vision.clothingStyle]) || 'unisex';
  return 'unisex';
}
function role(product) {
  if (product.category === 'Tops' || product.category === 'Outerwear') return 'top';
  if (product.category === 'Bottoms' && !/dress|đầm|váy liền/i.test(product.title) && (product.vision.kind !== 'dress' || /quần|jeans|pants|trousers|shorts|skirt|chân váy/i.test(product.title))) return 'bottom';
  if (product.category === 'Footwear') return 'shoes';
  return null;
}
function styleScore(product, style) {
  const type = product.vision.kind, title = normalize(product.title);
  if (style === 'work') {
    if (/track pants|the thao|short|crop|graphic/.test(title)) return -.5;
    return ['shirt', 'knitwear', 'jacket', 'trousers', 'formalShoes', 'heels', 'boots'].includes(type) ? .3 : -.15;
  }
  if (style === 'casual' && /satin|ánh kim|anh kim|ren|party|kim tuyen/.test(title)) return -.35;
  if (style === 'casual') return ['tshirt', 'shirt', 'knitwear', 'jeans', 'shorts', 'sneakers', 'sandals'].includes(type) ? .25 : -.2;
  return 0;
}
export function buildOutfits(products, semanticScores, { gender = 'all', prompt = '', budget = Infinity, excludeIds = [], measurements = {}, candidateLimit } = {}) {
  const text = normalize(prompt), style = /di lam|cong so|office|work|thanh lich/.test(text) ? 'work' : /di choi|thoai mai|casual|street|hang ngay/.test(text) ? 'casual' : 'other';
  const scoreById = new Map(products.map((p, i) => [p._id, semanticScores[i] || 0]));
  const base = products.filter(p => role(p) && !excludeIds.includes(p._id));
  const groups = gender === 'all' ? ['men', 'women'] : [gender];
  const outfits = [], usedTops = new Set(), usedBottoms = new Set(), usedShoes = new Set(), usedCombos = new Set();
  for (const target of groups) {
    const matching = base.filter(p => productGender(p) === target || productGender(p) === 'unisex');
    const rank = p => (scoreById.get(p._id) || 0) + styleScore(p, style) + (p.gender === target ? .14 : -.1) + (measurements.height && Number(measurements.height) < 160 && ['shorts', 'skirt'].includes(p.vision.kind) ? .04 : 0);
    const tops = matching.filter(p => role(p) === 'top').sort((a, b) => rank(b) - rank(a));
    const bottoms = matching.filter(p => role(p) === 'bottom');
    const shoes = matching.filter(p => role(p) === 'shoes');
    const limit = candidateLimit || (gender === 'all' ? 2 : 3);
    for (const top of tops) {
      if (usedTops.has(top._id)) continue;
      let best;
      for (const bottom of bottoms) {
        const harmony = colorHarmony(top.vision.palette, bottom.vision.palette);
        if (harmony < .7) continue;
        for (const shoe of shoes) {
          if (top.price + bottom.price + shoe.price > budget) continue;
          const palettes = [top.vision.palette, bottom.vision.palette, shoe.vision.palette];
          if (palettes.filter(c => !neutral.has(c)).length > 1 && new Set(palettes.filter(c => !neutral.has(c)).map(family)).size > 1) continue;
          const shoeHarmony = Math.min(colorHarmony(palettes[0], palettes[2]), colorHarmony(palettes[1], palettes[2]));
          if (shoeHarmony < .7) continue;
          const key = [top._id, bottom._id, shoe._id].join('|'); if (usedCombos.has(key)) continue;
          const score = rank(top) + rank(bottom) + rank(shoe) + harmony * .25 + shoeHarmony * .2 - (usedBottoms.has(bottom._id) ? .45 : 0) - (usedShoes.has(shoe._id) ? .3 : 0);
          if (!best || score > best.score) best = { key, score, items: [top, bottom, shoe], gender: target, palette: [...new Set(palettes)], style };
        }
      }
      if (best) { usedTops.add(top._id); usedBottoms.add(best.items[1]._id); usedShoes.add(best.items[2]._id); usedCombos.add(best.key); outfits.push({ id: best.key, gender: target, style, palette: best.palette, items: best.items, totalPrice: best.items.reduce((n, p) => n + p.price, 0) }); }
      if (outfits.filter(o => o.gender === target).length >= limit) break;
    }
  }
  return outfits;
}
export async function recommendOutfits({ prompt, gender = 'all', budget, excludeIds = [], measurements = {}, image, userId }) {
  visualCatalogPromise ||= analyzeCatalog(MOCK_LISTINGS.filter(p => p.status === 'active' && p.images[0].startsWith('/images/catalog/'))).catch(e => { visualCatalogPromise = null; throw e; });
  const products = await visualCatalogPromise;
  const model = await extractor();
  const query = (await model(prompt, { pooling: 'mean', normalize: true })).tolist()[0];
  // Metadata is used for occasion ranking; image analysis supplies garment design and palette.
  outfitVectorsPromise ||= (async () => { const result = []; for (let i = 0; i < products.length; i += 12) result.push(...(await model(products.slice(i, i + 12).map(description), { pooling: 'mean', normalize: true })).tolist()); return result; })().catch(e => { outfitVectorsPromise = null; throw e; });
  const vectors = await outfitVectorsPromise;
  const scores = vectors.map(v => v.reduce((sum, n, i) => sum + n * query[i], 0));
  const candidates = buildOutfits(products, scores, { prompt, gender, budget, excludeIds, measurements, candidateLimit: process.env.GEMINI_API_KEY && image ? (gender === 'all' ? 6 : 12) : undefined });
  try { return { engine: 'clip-vision+multilingual-minilm', analyzed: products.length, ...await geminiOutfits({ image, candidates, prompt, gender, measurements, userId }) }; }
  catch (error) {
    console.error('Gemini recommendations:', error.message);
    return { outfits: buildOutfits(products, scores, { prompt, gender, budget, excludeIds, measurements }), engine: 'clip-vision+multilingual-minilm', analyzed: products.length, photoAnalyzed: false, advisory: error.status === 402 ? 'API key Gemini thuộc dự án trả phí đã hết số dư. Hãy dùng key của dự án Free Tier để đọc ảnh miễn phí. Hiện đang gợi ý theo phong cách và số đo.' : error.status === 429 ? 'Gemini đang hết hạn mức miễn phí. Đang gợi ý theo phong cách và số đo đã chọn.' : 'Gemini chưa đọc được ảnh. Đang gợi ý theo phong cách và số đo đã chọn.' };
  }
}
