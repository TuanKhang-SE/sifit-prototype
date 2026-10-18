import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { categories, matchesCategory } from '../data/categories';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';

const DEFAULT_BRANDS = ["Levi's", 'Nike', 'Zara', 'Stussy', 'Adidas', 'Uniqlo', 'Marni', 'Mango', 'COS', 'Massimo Dutti', 'Charles & Keith'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize', '38', '39', '40', '41', '42'];
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function Catalog() {
  const { products, searchQuery, setSearchQuery, filters, setFilters, sortOption, setSortOption, activePackage, user, browse } = useApp();
  const { t } = useLanguage();
  const selectedGender = filters.gender || (filters.women ? 'women' : 'all');
  const BRANDS = [...new Set([...DEFAULT_BRANDS, ...products.map(p => p.brand).filter(Boolean)])];
  const toggle = (type, value) => setFilters(prev => ({ ...prev, [type]: prev[type].includes(value) ? prev[type].filter(x => x !== value) : [...prev[type], value] }));
  const filtered = products.filter(p => {
    if (p.status !== 'active' && p.status !== 'reported') return false;
    if (searchQuery && !normalize(`${p.title} ${p.brand} ${p.material}`).includes(normalize(searchQuery))) return false;
    if (filters.categories.length && !filters.categories.some(category => matchesCategory(p, category))) return false;
    if (filters.brands.length && !filters.brands.some(brand => brand.toLowerCase() === p.brand?.toLowerCase())) return false;
    if (filters.sizes.length && !filters.sizes.includes(p.size)) return false;
    if (filters.material && !normalize(p.material).includes(normalize(filters.material))) return false;
    if (selectedGender !== 'all' && (selectedGender === 'unisex' ? p.gender !== 'unisex' : ![selectedGender, 'unisex'].includes(p.gender))) return false;
    if (filters.department === 'kids' && p.gender !== 'kids') return false;
    if (filters.department === 'juniors' && p.department !== 'juniors') return false;
    if (filters.department === 'maternity' && !/maternity|bau/.test(normalize(p.title))) return false;
    if (filters.department === 'plus' && !['XL', 'XXL', 'XXXL', '3XL', '4XL'].includes(p.size)) return false;
    return p.condition >= filters.condition && p.price <= filters.priceMax;
  }).sort((a, b) => {
    const aVip = activePackage && a.seller?._id === user?._id;
    const bVip = activePackage && b.seller?._id === user?._id;
    if (aVip && !bVip) return -1;
    if (bVip && !aVip) return 1;
    if (sortOption === 'Giá: Thấp → Cao') return a.price - b.price;
    if (sortOption === 'Giá: Cao → Thấp') return b.price - a.price;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  const activeFilters = [...filters.categories.map(value => [t(value), () => toggle('categories', value)]), ...filters.brands.map(value => [value, () => toggle('brands', value)]),
    ...(filters.material ? [[t(filters.material), () => setFilters(prev => ({ ...prev, material: '' }))]] : []),
    ...(searchQuery ? [[searchQuery, () => setSearchQuery('')]] : []),
    ...(selectedGender !== 'all' ? [[t(selectedGender), () => setFilters(prev => ({ ...prev, gender: 'all', women: false }))]] : []),
    ...(filters.department ? [[t(filters.department), () => setFilters(prev => ({ ...prev, department: '' }))]] : [])];
  return <section className="catalog-page wide-container">
    <p className="eyebrow green">SIFIT / THE PRE-LOVED EDIT</p><h1>{t('catalogTitle')}</h1>
    <div className="catalog-gender-tabs" role="tablist" aria-label={t('gender')}>{['all', 'women', 'men', 'unisex'].map(gender => <button key={gender} role="tab" aria-selected={selectedGender === gender} onClick={() => setFilters(prev => ({ ...prev, gender, women: false }))}>{t(gender === 'all' ? 'allGenders' : gender)}</button>)}</div>
    <div className="catalog-toolbar"><p>{filtered.length} {t('results')}</p><select aria-label={t('newest')} value={sortOption} onChange={e => setSortOption(e.target.value)}><option value="Hàng Mới Về">{t('newest')}</option><option value="Giá: Thấp → Cao">{t('priceLow')}</option><option value="Giá: Cao → Thấp">{t('priceHigh')}</option></select></div>
    <div className="catalog-layout"><aside className="catalog-filters">
      <div className="filter-heading"><h2>{t('categories')}</h2><button onClick={() => browse()}>{t('clear')}</button></div>
      <div className="category-filters">{categories.filter(key => key !== 'allClothing').map(category => <label key={category}><input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggle('categories', category)} />{t(category)}</label>)}</div>
      <details open><summary>{t('brands')}</summary><div className="brand-filters">{BRANDS.map(brand => <label key={brand}><input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggle('brands', brand)} />{brand}</label>)}</div></details>
      <details open><summary>{t('sizes')}</summary><div className="size-filters">{SIZES.map(size => <button key={size} className={filters.sizes.includes(size) ? 'selected' : ''} onClick={() => toggle('sizes', size)}>{size}</button>)}</div></details>
      <div className="range-filter"><label htmlFor="condition-filter">{t('condition')}<span>{filters.condition}%+</span></label><input id="condition-filter" type="range" min="0" max="100" step="5" value={filters.condition} onChange={e => setFilters(prev => ({ ...prev, condition: Number(e.target.value) }))} /></div>
      <div className="range-filter"><label htmlFor="price-filter">{t('price')}<span>{filters.priceMax.toLocaleString('vi-VN')} ₫</span></label><input id="price-filter" type="range" min="0" max="10000000" step="100000" value={filters.priceMax} onChange={e => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))} /></div>
    </aside><div className="catalog-results">
      {activeFilters.length > 0 && <div className="active-filters">{activeFilters.map(([label, remove], index) => <button key={`${label}-${index}`} onClick={remove}>{label}<Icon name="close" /></button>)}</div>}
      {filtered.length > 0 ? <div className="product-grid">{filtered.map(product => <ProductCard key={product._id} product={product} />)}</div> : <div className="catalog-empty"><Icon name="search_off" /><p>{t('noResults')}</p><button className="editorial-button" onClick={() => browse()}>{t('clear')}</button></div>}
    </div></div>
  </section>;
}
