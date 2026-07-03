import React from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'];
const BRANDS = ["Levi's", 'Nike', 'Zara', 'Stussy', 'Adidas', 'Uniqlo'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize'];

export default function Catalog() {
  const { products, setSelectedProduct, setCurrentView, searchQuery, setSearchQuery, filters, setFilters, sortOption, setSortOption, activePackage, user } = useApp();

  const toggle = (type, value) => {
    const list = filters[type];
    setFilters({ ...filters, [type]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] });
  };

  const filtered = products.filter(p => {
    if (p.status !== 'active' && p.status !== 'reported') return false;
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
    if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false;
    if (p.condition < filters.condition) return false;
    if (p.price > filters.priceMax && filters.priceMax < 10000000) return false;
    return true;
  }).sort((a, b) => {
    const aIsVip = activePackage && a.seller?._id === user?._id;
    const bIsVip = activePackage && b.seller?._id === user?._id;
    
    if (aIsVip && !bIsVip) return -1;
    if (!aIsVip && bIsVip) return 1;

    if (sortOption === 'Giá: Thấp → Cao') return a.price - b.price;
    if (sortOption === 'Giá: Cao → Thấp') return b.price - a.price;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const clearAll = () => {
    setSearchQuery('');
    setFilters({ categories: [], brands: [], sizes: [], condition: 0, priceMax: 10000000 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 flex flex-col md:flex-row gap-10 animate-fade-in">
      {/* ── SIDEBAR ── */}
      <aside className="w-full md:w-64 flex-shrink-0 md:sticky top-[130px] self-start">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 space-y-7">
          {/* Categories */}
          <div>
            <h3 className="font-heading font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">Danh mục</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map(cat => (
                <li key={cat}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <input type="checkbox" checked={filters.categories.includes(cat)} onChange={() => toggle('categories', cat)} className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                      <span className="material-symbols-outlined text-white text-[13px] absolute opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{cat}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-heading font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">Thương hiệu</h3>
            <ul className="space-y-2.5">
              {BRANDS.map(brand => (
                <li key={brand}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggle('brands', brand)} className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                      <span className="material-symbols-outlined text-white text-[13px] absolute opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">{brand}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="font-heading font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">Kích thước</h3>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(sz => (
                <button
                  key={sz}
                  onClick={() => toggle('sizes', sz)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${filters.sizes.includes(sz) ? 'bg-primary text-white shadow-emerald-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-heading font-bold text-base text-gray-900">Độ mới</h3>
              <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{filters.condition}% - 100%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={filters.condition} onChange={e => setFilters({ ...filters, condition: Number(e.target.value) })} className="w-full accent-primary cursor-pointer h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Price */}
          <div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-heading font-bold text-base text-gray-900">Khoảng giá</h3>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                0 - {filters.priceMax >= 10000000 ? '10Tr+' : (filters.priceMax / 1000000).toFixed(1) + 'Tr'}
              </span>
            </div>
            <input type="range" min="0" max="10000000" step="100000" value={filters.priceMax} onChange={e => setFilters({ ...filters, priceMax: Number(e.target.value) })} className="w-full accent-primary cursor-pointer h-1.5 bg-gray-200 rounded-full" />
          </div>

          <button onClick={clearAll} className="w-full text-sm font-bold text-gray-500 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer py-2">
            Xóa tất cả bộ lọc
          </button>
        </div>
      </aside>

      {/* ── PRODUCT GRID ── */}
      <section className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black text-gray-900">Kho Hàng Hiệu 2hand</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">{filtered.length} sản phẩm phù hợp</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-gray-200 shadow-sm">
            <span className="material-symbols-outlined text-base text-gray-400">sort</span>
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none cursor-pointer pr-1">
              <option>Hàng Mới Về</option>
              <option>Giá: Thấp → Cao</option>
              <option>Giá: Cao → Thấp</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length > 0 ? filtered.map(product => (
            <div
              key={product._id}
              onClick={() => { setSelectedProduct(product); setCurrentView('detail'); }}
              className="group cursor-pointer hover-lift"
            >
              <div className="relative aspect-[3/4] bg-gray-100 mb-3.5 overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="badge-condition">Mới {product.condition}%</span>
                  {product.isFeatured && (
                    <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">⭐ Nổi bật</span>
                  )}
                  {!product.isFeatured && activePackage?._id === 'pkg_01' && product.seller?._id === user?._id && (
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">🔥 Nổi bật</span>
                  )}
                  {!product.isFeatured && activePackage?._id === 'pkg_02' && product.seller?._id === user?._id && (
                    <span className="bg-[#ee4d2d] text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1 w-max">
                      <span className="material-symbols-outlined text-[12px] fill">verified</span>
                      SELLER UY TÍN
                    </span>
                  )}
                  {product.status === 'reported' && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">Báo cáo</span>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Quick add */}
                <button
                  onClick={e => { e.stopPropagation(); }}
                  className="absolute bottom-3 right-3 bg-white text-gray-900 w-9 h-9 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white shadow-lg cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                </button>
              </div>
              <div className="px-0.5">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-bold text-[14px] leading-tight text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
                  <span className="font-black text-[#ee4d2d] whitespace-nowrap text-sm">{product.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="uppercase tracking-widest font-semibold">{product.brand}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-semibold">Size {product.size}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-24 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-4 text-gray-200 block">search_off</span>
              <p className="font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
              <button onClick={clearAll} className="mt-4 px-6 py-2.5 border border-gray-200 rounded-full text-sm hover:bg-gray-50 cursor-pointer transition-colors text-gray-600 bg-white font-bold">
                Xóa Bộ Lọc
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
