import references from './importedCatalog.json' with { type: 'json' };
import mensReferences from './mensCatalog.json' with { type: 'json' };
import everydayReferences from './everydayCatalog.json' with { type: 'json' };
import varietyReferences from './varietyCatalog.json' with { type: 'json' };

// Stable metadata for retained products; the newest collection is interleaved.
const seedFor = id => [...id].reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 0);
// Descriptive image labels; commercial fields are clearly marked demo data.
export const importedCatalog = [...references, ...mensReferences, ...everydayReferences, ...varietyReferences].map((reference, index) => ({
  ...reference,
  seller: { _id: 'user_seller_01', name: 'SiFit Demo Studio', avatar: '', averageRating: 0, reviewCount: 0 },
  description: `${reference.title}. Ảnh tham chiếu cho demo thử đồ SiFit. Giá, kích cỡ và tình trạng là dữ liệu minh họa, chưa phải tin bán thật.`,
  brand: reference._id.startsWith('local_') ? 'Ảnh của bạn' : 'Studio Edit',
  size: reference.category === 'Footwear' ? '38' : ['S', 'M', 'L', 'XL'][seedFor(reference._id) % 4],
  condition: 95,
  color: reference.color || reference.title,
  material: 'Chưa xác minh',
  gender: reference.gender || (reference._id.startsWith('local_') ? ([9, 10].includes(Number(reference._id.slice(6))) ? 'women' : 'unisex') : 'women'),
  garmentPhotoType: reference.garmentPhotoType || (['local_03', 'local_09', 'local_10'].includes(reference._id) ? 'model' : reference._id.startsWith('local_') ? 'auto' : 'flat-lay'),
  defects: 'Dữ liệu demo; chưa xác minh tình trạng sản phẩm.',
  price: ({ Tops: 150000, Bottoms: 220000, Outerwear: 350000, Footwear: 290000, Accessories: 180000 }[reference.category] || 150000) + (seedFor(reference._id) % 5) * 30000,
  status: 'active',
  isFeatured: index < 12,
  averageRating: 0,
  reviewCount: 0,
  createdAt: reference._id.startsWith('variety_') ? new Date(Date.parse('2026-10-13T23:59:59Z') - varietyReferences.findIndex(p => p._id === reference._id) * 1000).toISOString() : reference._id.startsWith('everyday_') ? new Date(Date.parse('2026-10-12T23:59:59Z') - (index - references.length - mensReferences.length) * 1000).toISOString() : `2026-10-12T${String(23 - Math.floor(index / 60)).padStart(2, '0')}:${String(59 - index % 60).padStart(2, '0')}:00Z`,
}));
