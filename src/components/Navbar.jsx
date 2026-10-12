import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitch from './LanguageSwitch';
import Icon from './Icon';
import logo from '../image/logo-favicon/Sifit-nobg.png';

export default function Navbar() {
  const { currentView, setCurrentView, cart, user, logoutUser, searchQuery, browse, openAuth, openSellGuide } = useApp();
  const isSelling = ['sell', 'sell-guide', 'seller'].includes(currentView);
  const { t } = useLanguage();
  const [query, setQuery] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setQuery(searchQuery), [searchQuery]);
  useEffect(() => {
    const header = document.querySelector('.store-header');
    const update = () => document.documentElement.style.setProperty('--store-header-height', `${header?.getBoundingClientRect().height || 198}px`);
    const observer = new ResizeObserver(update);
    if (header) observer.observe(header);
    update();
    return () => observer.disconnect();
  }, []);
  const nav = [
    ['newArrivals', {}], ['women', { women: true }], ['designer', { brand: 'Marni' }], ['premium', { premium: true }],
    ['dresses', { category: 'dresses' }], ['shoes', { category: 'shoes' }], ['bags', { category: 'bags' }], ['accessories', { category: 'Accessories' }],
  ];
  const visit = options => { browse(options); setMenuOpen(false); };
  return <header className="store-header">
    <div className="announcement"><span>{t('announcement')}</span><LanguageSwitch /></div>
    <div className="header-main wide-container">
      <div className="shop-sell" aria-label={t('shop')}>
        <button className={!isSelling ? 'selected' : ''} onClick={() => visit({})}>{t('shop')}</button>
        <button className={isSelling ? 'selected' : ''} onClick={() => { setCurrentView('sell'); setMenuOpen(false); }}>{t('sell')}</button>
      </div>
      <button className="brand-logo" aria-label="Sifit — Home" onClick={() => setCurrentView('homepage')}><img src={logo} alt="Sifit — Wear your style" /></button>
      <div className="header-tools">
        <form className="header-search" role="search" onSubmit={e => { e.preventDefault(); visit({ query: query.trim() }); }}>
          <input aria-label={t('searchLabel')} placeholder={t('search')} value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" aria-label={t('searchLabel')}><Icon name="search" /></button>
        </form>
        <button className="ai-button" onClick={() => setCurrentView('ai-stylist')}><Icon name="auto_awesome" /><span>{t('ai')}</span></button>
      </div>
    </div>
    <div className="header-bottom wide-container">
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen} aria-controls="category-navigation"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
      <nav id="category-navigation" className={`header-categories ${isSelling ? 'sell-navigation' : ''} ${menuOpen ? 'is-open' : ''}`} aria-label={isSelling ? t('sell') : t('categories')}>
        {isSelling ? <><button className={currentView === 'sell' ? 'active' : ''} onClick={() => { setCurrentView('sell'); setMenuOpen(false); }}>{t('waysToSell')}</button><button className={currentView === 'sell-guide' ? 'active' : ''} onClick={() => { openSellGuide(); setMenuOpen(false); }}>{t('cleanOutGuide')}</button></> : <>{nav.map(([key, options]) => <button key={key} onClick={() => visit(options)}>{t(key)}</button>)}
        <button onClick={() => { setCurrentView('homepage'); setMenuOpen(false); requestAnimationFrame(() => document.getElementById('most-searched')?.scrollIntoView({ behavior: 'smooth' })); }}>{t('brands')}</button></>}
      </nav>
      <div className="account-actions">
        <button className="bag-button" onClick={() => user ? setCurrentView('checkout') : openAuth()} aria-label={t('cart')} title={t('cart')}><Icon name="shopping_bag" />{cart.length > 0 && <span className="bag-count">{cart.length}</span>}</button>
        <span className="nav-divider" />
        {user ? <><button className="account-button" onClick={() => setCurrentView(user.role === 'seller' ? 'seller' : user.role === 'admin' ? 'admin' : 'checkout')}><Icon name="person" /><span>{user.name.split(' ').slice(-1)}</span></button><button className="text-link" onClick={logoutUser}>{t('logout')}</button></> : <><button className="text-link" onClick={() => openAuth('login')}>{t('login')}</button><button className="signup-link" onClick={() => openAuth('signup')}>{t('signup')}</button></>}
      </div>
    </div>
  </header>;
}
