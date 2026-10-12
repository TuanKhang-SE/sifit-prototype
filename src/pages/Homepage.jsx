import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { categories } from '../data/categories';
import CategoryIcon from '../components/CategoryIcon';
import Icon from '../components/Icon';
import hero from '../image/banner/sifitherobanner.png';

const collections = [
  { key: 'clothing', cta: 'shopClothing', category: 'clothing', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85' },
  { key: 'bags', cta: 'shopBags', category: 'bags', image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=85' },
  { key: 'shoes', cta: 'shopShoes', category: 'shoes', image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=900&q=85' },
  { key: 'newArrivals', cta: 'newIn', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=900&q=85' },
];
const searches = [
  { title: 'items', entries: [['blazer', { query: 'blazer' }], ['midiDresses', { category: 'dresses', query: 'midi' }], ['leatherBags', { category: 'bags', material: 'leather' }], ['wideJeans', { category: 'jeans', query: 'wide' }], ['midiSkirts', { category: 'skirts', query: 'midi' }], ['sandals', { query: 'sandal' }]] },
  { title: 'materials', entries: ['denim', 'silk', 'linen', 'leather', 'tweed', 'wool'].map(material => [material, { material }]) },
  { title: 'brands', entries: ['Zara', 'Mango', 'COS', 'Uniqlo', 'Massimo Dutti', 'Charles & Keith'].map(brand => [brand, { brand }]) },
];

export default function Homepage() {
  const { browse } = useApp();
  const { t } = useLanguage();
  return <div className="editorial-home">
    <section className="hero-banner" aria-labelledby="hero-title">
      <img className="hero-image" src={hero} alt="Sifit — a collection of pre-loved fashion looks" fetchPriority="high" />
      <div className="hero-shade" />
      <div className="hero-content wide-container"><p className="eyebrow">{t('heroEyebrow')}</p><h1 id="hero-title">{t('heroTitle')}</h1><p className="hero-description">{t('heroDescription')}</p><button className="editorial-button hero-cta" onClick={() => browse()}>{t('discover')}<Icon name="arrow_forward" /></button></div>
      <div className="hero-caption"><span>SIFIT / THE SECOND LIFE EDIT</span><span>WEAR YOUR STYLE</span></div>
    </section>
    <section className="category-section wide-container" aria-labelledby="category-title">
      <p className="eyebrow green">{t('explore')}</p>
      <div className="section-heading"><h2 id="category-title">{t('categoryTitle')}</h2><p>{t('categoryDescription')}</p></div>
      <div className="category-rail">{categories.map(category => <button className="category-item" key={category} onClick={() => browse({ category })}><span className="category-circle"><CategoryIcon category={category} /></span><span>{t(category)}</span></button>)}</div>
    </section>
    <section className="collection-section" aria-labelledby="collection-title"><div className="wide-container">
      <div className="section-heading"><h2 id="collection-title">{t('categoryTitle')}</h2><button className="editorial-button outlined" onClick={() => browse()}>{t('viewAll')}<Icon name="arrow_forward" /></button></div>
      <div className="collection-grid">{collections.map(collection => <div className="collection-tile" key={collection.key}>
        <img src={collection.image} alt={t(collection.key)} loading="lazy" /><div className="collection-shade" />
        <button className="collection-link" onClick={() => browse({ category: collection.category })}><span><strong>{t(collection.key).toLowerCase()}</strong><small>{t(collection.cta)}</small></span><span className="tile-arrow"><Icon name="arrow_forward" /></span></button>
        {collection.key === 'bags' && <button className="marni-label" onClick={() => browse({ brand: 'Marni' })}>MARNI <Icon name="north_east" /></button>}
      </div>)}</div>
    </div></section>
    <section className="most-searched wide-container" id="most-searched" aria-labelledby="search-title">
      <p className="eyebrow green">{t('mostSearched')}</p><h2 id="search-title">{t('searchTitle')}</h2><p className="section-description">{t('searchDescription')}</p>
      <div className="search-groups">{searches.map(group => <div className="search-group" key={group.title}><h3>{t(group.title)}</h3><div className="search-chips">{group.entries.map(([key, options]) => <button key={key} onClick={() => browse(options)}>{t(key)}<Icon name="chevron_right" /></button>)}</div></div>)}</div>
    </section>
    <section className="last-chance-section wide-container"><div className="last-chance"><div className="last-chance-copy"><p className="eyebrow">{t('lastChance')}</p><h2>{t('lastTitle')}</h2><p>{t('lastDescription')}</p></div><div className="last-chance-actions"><button className="editorial-button" onClick={() => browse({ lastChance: true })}>{t('shopLastChance')}<Icon name="arrow_forward" /></button><button className="text-link" onClick={() => browse()}>{t('browseShop')}</button></div><span className="last-chance-orb" aria-hidden="true" /></div></section>
  </div>;
}
