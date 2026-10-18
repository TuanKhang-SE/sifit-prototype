import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';

export default function ProductCard({ product }) {
  const { setSelectedProduct, setCurrentView, addToCart, user, openAuth } = useApp();
  const { t, locale } = useLanguage();
  const open = () => { setSelectedProduct(product); setCurrentView('detail'); };
  return <article className={`product-card ${product.source ? 'product-single-item' : ''}`}>
    <div className="product-image-wrap"><button className="product-image-button" onClick={open} aria-label={`${t('details')}: ${product.title}`}><img src={product.images?.[0]} alt={product.title} loading="lazy" /></button>
      <span className="product-condition">{t('condition')} {product.condition}%</span>
      {user?.role !== 'seller' && <button className="product-quick-add" aria-label={`${t('addToCart')}: ${product.title}`} onClick={() => user ? addToCart(product) : openAuth()}><Icon name="add_shopping_cart" /></button>}
    </div>
    <div className="product-meta"><span>{product.brand}</span><span>{t('sizes')} {product.size}</span></div>
    <button className="product-title" onClick={open}>{product.title}</button><p className="product-price">{new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(product.price)}</p>
  </article>;
}
