import { MOCK_LISTINGS } from '../src/data/mockData.js';
import { analyzeCatalog } from '../server/catalogVision.mjs';
const products = MOCK_LISTINGS.filter(p => p.status === 'active' && p.images[0].startsWith('/images/catalog/'));
console.log(`Inspecting ${products.length} product images`);
const analyzed = await analyzeCatalog(products, (done, total) => { if (done % 20 === 0) console.log(`${done}/${total}`); });
console.log(JSON.stringify({ analyzed: analyzed.length, sample: analyzed.slice(0, 2).map(p => ({ id: p._id, vision: p.vision })) }));
