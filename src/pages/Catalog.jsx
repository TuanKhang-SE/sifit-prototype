import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useEffect, useState } from 'react';
import usePagedResource from '../hooks/usePagedResource';
import * as api from '../services/operationsService';
import { normalizeProduct, sizeFromApi, sizeToApi } from '../utils/normalizers';
import { Pager, ResourceFeedback } from '../components/OperationsUI';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';

const aliases = { dresses: ['dam', 'vay'], tops: ['ao'], pants: ['quan'], skirts: ['chan vay', 'vay'], jackets: ['ao khoac'], shoes: ['giay dep', 'giay'], bags: ['tui xach', 'tui'], clothing: ['ao', 'quan', 'vay', 'dam', 'ao khoac'], allClothing: ['ao', 'quan', 'vay', 'dam', 'ao khoac'] };
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function Catalog() {
  const { apiCategories, searchQuery, setSearchQuery, filters, setFilters, sortOption, setSortOption, browse } = useApp();
  const { t } = useLanguage();
  const toggle = (type, value) => setFilters(prev => ({ ...prev, [type]: prev[type].includes(value) ? prev[type].filter(x => x !== value) : [...prev[type], value] }));
  const [facets, setFacets] = useState({ brands: [], sizes: [] });
  const [facetError, setFacetError] = useState('');
  const [facetRevision, setFacetRevision] = useState(0);
  const [query, setQuery] = useState({});
  useEffect(() => { const controller = new AbortController(); api.list('/products/facets', {}, controller.signal).then(setFacets).catch(error => { if (!controller.signal.aborted) setFacetError(error.response?.data?.message || 'Không tải được bộ lọc.'); }); return () => controller.abort(); }, [facetRevision]);
  const categoryIds = [...new Set(filters.categories.flatMap(value => apiCategories.filter(item => item._id === value || aliases[value]?.includes(normalize(item.name))).map(item => item._id)))];
  const keyword = [searchQuery, filters.categories.includes('jeans') ? 'jeans' : '', filters.categories.includes('knitwear') ? 'len' : ''].filter(Boolean).join(' ');
  const params = { ...(keyword ? { search: keyword.slice(0, 100) } : {}), ...(categoryIds.length ? { categoryIds: JSON.stringify(categoryIds) } : {}), ...(filters.brands.length ? { brands: JSON.stringify(filters.brands) } : {}), ...(filters.sizes.length ? { sizes: JSON.stringify(filters.sizes.map(sizeToApi)) } : {}), ...(filters.condition > 0 ? { conditions: JSON.stringify([['NEW_WITH_TAGS', 100], ['LIKE_NEW', 95], ['GOOD', 85], ['FAIR', 65]].filter(([, value]) => value >= filters.condition).map(([value]) => value)) } : {}), ...(filters.material ? { material: filters.material } : {}), maxPrice: filters.priceMax, sort: sortOption === 'Giá: Thấp → Cao' ? 'price_asc' : sortOption === 'Giá: Cao → Thấp' ? 'price_desc' : 'newest' };
  const signature = JSON.stringify(params);
  useEffect(() => { const timer = setTimeout(() => setQuery(JSON.parse(signature)), 250); return () => clearTimeout(timer); }, [signature]);
  const resource = usePagedResource('/products', query);
  const filtered = resource.items.map(normalizeProduct);
  const BRANDS = [...new Set([...facets.brands, ...filters.brands])];
  const SIZES = [...new Set([...facets.sizes.map(sizeFromApi), ...filters.sizes])];
  const categoryName = value => apiCategories.find(item => item._id === value)?.name || t(value);
  const activeFilters = [...filters.categories.map(value => [categoryName(value), () => toggle('categories', value)]), ...filters.brands.map(value => [value, () => toggle('brands', value)]), ...filters.sizes.map(value => [value, () => toggle('sizes', value)]),
    ...(filters.material ? [[t(filters.material), () => setFilters(prev => ({ ...prev, material: '' }))]] : []),
    ...(searchQuery ? [[searchQuery, () => setSearchQuery('')]] : [])];
  return <section className="catalog-page wide-container">
    <p className="eyebrow green">SIFIT / THE PRE-LOVED EDIT</p><h1>{t('catalogTitle')}</h1>
    <div className="catalog-toolbar"><p>{resource.busy ? 'Đang tìm sản phẩm…' : `${resource.pagination.total || 0} ${t('results')}`}</p><select aria-label={t('newest')} value={sortOption} onChange={e => setSortOption(e.target.value)}><option value="Hàng Mới Về">{t('newest')}</option><option value="Giá: Thấp → Cao">{t('priceLow')}</option><option value="Giá: Cao → Thấp">{t('priceHigh')}</option></select></div>
    <div className="catalog-layout"><aside className="catalog-filters">
      <div className="filter-heading"><h2>{t('categories')}</h2><button onClick={() => browse()}>{t('clear')}</button></div>
      <div className="category-filters">{apiCategories.map(category => <label key={category._id}><input type="checkbox" checked={categoryIds.includes(category._id)} onChange={() => setFilters(previous => ({ ...previous, categories: categoryIds.includes(category._id) ? categoryIds.filter(id => id !== category._id) : [...categoryIds, category._id] }))} />{category.name}</label>)}</div>
      {facetError && <p role="alert">{facetError} <button onClick={() => { setFacetError(''); setFacetRevision(value => value + 1); }}>Thử lại bộ lọc</button></p>}
      <details open><summary>{t('brands')}</summary><div className="brand-filters">{BRANDS.map(brand => <label key={brand}><input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggle('brands', brand)} />{brand}</label>)}</div></details>
      <details open><summary>{t('sizes')}</summary><div className="size-filters">{SIZES.map(size => <button key={size} className={filters.sizes.includes(size) ? 'selected' : ''} onClick={() => toggle('sizes', size)}>{size}</button>)}</div></details>
      <div className="range-filter"><label htmlFor="condition-filter">{t('condition')}<span>{filters.condition}%+</span></label><input id="condition-filter" type="range" min="0" max="100" step="5" value={filters.condition} onChange={e => setFilters(prev => ({ ...prev, condition: Number(e.target.value) }))} /></div>
      <div className="range-filter"><label htmlFor="price-filter">{t('price')}<span>{filters.priceMax.toLocaleString('vi-VN')} ₫</span></label><input id="price-filter" type="range" min="0" max="10000000" step="100000" value={filters.priceMax} onChange={e => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))} /></div>
    </aside><div className="catalog-results">
      {activeFilters.length > 0 && <div className="active-filters">{activeFilters.map(([label, remove], index) => <button key={`${label}-${index}`} onClick={remove}>{label}<Icon name="close" /></button>)}</div>}
      <ResourceFeedback resource={resource} />{resource.error && <button onClick={resource.reload}>Thử tải lại sản phẩm</button>}
      <div className="product-grid">{filtered.map(product => <ProductCard key={product._id} product={product} />)}</div><Pager resource={resource} />
    </div></div>
  </section>;
}
