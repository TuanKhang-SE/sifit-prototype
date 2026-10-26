import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitch from './LanguageSwitch';
import Icon from './Icon';
import logo from '../image/logo-favicon/Sifit-nobg.png';

export default function Navbar() {
  const { currentView, setCurrentView, cart, user, logoutUser, searchQuery, browse, openAuth, openSellGuide } = useApp();
  const isSelling = ['sell', 'sell-guide'].includes(currentView);
  const { t } = useLanguage();
  const [query, setQuery] = useState(searchQuery);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenu = useRef(null);
  const accountTrigger = useRef(null);
  useEffect(() => {
    if (!accountOpen) return;
    const outside = event => { if (!accountMenu.current?.contains(event.target)) setAccountOpen(false); };
    const escape = event => {
      if (event.key === 'Escape') { setAccountOpen(false); accountTrigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [accountOpen]);
  const openAccount = view => { setAccountOpen(false); setCurrentView(view); };
  useEffect(() => setQuery(searchQuery), [searchQuery]);
  useEffect(() => {
    const header = document.querySelector('.store-header');
    const update = () => document.documentElement.style.setProperty('--store-header-height', `${header?.getBoundingClientRect().height || 150}px`);
    const observer = new ResizeObserver(update);
    if (header) observer.observe(header);
    update();
    return () => observer.disconnect();
  }, []);
  return <header className="store-header storefront-refresh">
    <div className="announcement"><div className="wide-container"><span>{t('announcement')}</span><LanguageSwitch /></div></div>
    <div className="header-main wide-container">
      <button className="brand-logo" aria-label="Sifit — Home" onClick={() => setCurrentView('homepage')}><img src={logo} alt="Sifit — Wear your style" /></button>
      <nav className="storefront-primary" aria-label={t('shop')}><button className={!isSelling ? 'selected' : ''} onClick={() => browse()}>{t('shop')}</button>{!user && <button className={isSelling ? 'selected' : ''} onClick={() => setCurrentView('sell')}>{t('sell')}</button>}</nav>
      <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); browse({ query: query.trim() }); }}><Icon name="search" /><input aria-label={t('searchLabel')} placeholder={t('search')} value={query} onChange={event => setQuery(event.target.value)} /><button type="submit" aria-label={t('searchLabel')}><Icon name="arrow_forward" /></button></form>
      <div className="account-actions">
        <button className="bag-button" onClick={() => user ? setCurrentView('checkout') : openAuth()} aria-label={t('cart')} title={t('cart')}><Icon name="shopping_bag" />{cart.length > 0 && <span className="bag-count">{cart.length}</span>}</button><span className="nav-divider" />
        {user ? <><div className="buyer-account" ref={accountMenu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false); }}>
          <button ref={accountTrigger} className="account-button" aria-label={`Tài khoản ${user.name}`} aria-expanded={accountOpen} aria-controls="buyer-account-options" onClick={() => setAccountOpen(value => !value)}><Icon name="person" /><span>{user.name.split(' ').slice(-1)}</span></button>
          {accountOpen && <nav id="buyer-account-options" className="buyer-account-options" aria-label="Tùy chọn tài khoản">
            <button onClick={() => openAccount('account-profile')}>Thông tin cá nhân</button>
            <button onClick={() => openAccount('account-addresses')}>Địa chỉ</button>
            <button onClick={() => openAccount('account-password')}>Đổi mật khẩu</button>
            <button onClick={() => { setAccountOpen(false); logoutUser(); }}>{t('logout')}</button>
          </nav>}
        </div><button className="text-link logout-link" onClick={logoutUser}>{t('logout')}</button></> : <><button className="text-link" onClick={() => openAuth('login')}>{t('login')}</button><button className="signup-link" onClick={() => openAuth('signup')}>{t('signup')}</button></>}
      </div>
    </div>
    {isSelling && <nav className="storefront-guide-links wide-container" aria-label={t('sell')}><button onClick={() => setCurrentView('sell')}>{t('waysToSell')}</button><button onClick={() => openSellGuide()}>{t('cleanOutGuide')}</button></nav>}
    {user?.role === 'buyer' && <div className="storefront-account-row"><nav className="workspace-links wide-container" aria-label="Tài khoản người mua">{[['checkout', 'Đơn mua & giỏ hàng', 'receipt_long'], ['chat', 'Chat', 'chat_bubble_outline'], ['wishlist', 'Yêu thích', 'favorite_border'], ['notifications', 'Thông báo', 'notifications_none']].map(([view, label, icon]) => <button key={view} aria-current={currentView === view ? 'page' : undefined} onClick={() => setCurrentView(view)}><Icon name={icon} />{label}</button>)}<button className="ai-button" onClick={() => setCurrentView('ai-stylist')}><Icon name="auto_awesome" />{t('ai')}</button></nav></div>}
  </header>;
}
