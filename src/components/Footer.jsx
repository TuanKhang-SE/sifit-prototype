import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import MobileQrCode from './MobileQrCode';
import Icon from './Icon';

const company = ['about', 'blog', 'resaleReport', 'ourImpact', 'careers', 'resaleService', 'newsroom', 'investors', 'faqs', 'returnPolicy', 'reviews'];
const departments = ['women', 'kids', 'juniors', 'designer', 'maternity', 'plus', 'shoes', 'handbags', 'accessories'];
const brands = ['J.Crew', 'Ann Taylor LOFT', 'Banana Republic', 'BCBGMAXAZRIA', 'Lululemon Athletica', 'Talbots', 'Free People', 'Lilly Pulitzer', 'Madewell'];
const discover = ['rescues', 'sizeGuide', 'sifitInsider', 'giftCards', 'discountCodes', 'sitemap'];

export default function Footer() {
  const { setCurrentView, setInfoPage, browse, openSellGuide } = useApp();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [socialFeedback, setSocialFeedback] = useState(false);
  const info = key => { setInfoPage(key); setCurrentView('info'); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const visit = key => {
    if (key === 'faqs') openSellGuide('faqs');
    else if (key === 'rescues') browse({ lastChance: true });
    else if (key === 'ourImpact') { setCurrentView('sell'); requestAnimationFrame(() => document.getElementById('sifit-impact')?.scrollIntoView({ behavior: 'smooth' })); }
    else info(key);
  };
  const department = key => {
    if (key === 'women') browse({ women: true });
    else if (key === 'designer') browse({ brand: 'Marni' });
    else if (key === 'shoes') browse({ category: 'shoes' });
    else if (key === 'handbags') browse({ category: 'bags' });
    else if (key === 'accessories') browse({ category: 'Accessories' });
    else browse({ department: key });
  };
  const subscribe = event => {
    event.preventDefault();
    try { localStorage.setItem('sifit-newsletter-email', email.trim()); setFeedback('newsletterSaved'); }
    catch { setFeedback('newsletterStorageError'); }
  };
  return <footer className="marketplace-footer"><div className="wide-container">
    <div className="marketplace-footer-grid">
      <div className="footer-link-column"><h2>{t('theCompany')}</h2><nav aria-label={t('theCompany')}>{company.map(key => <button key={key} onClick={() => visit(key)}>{t(key)}</button>)}</nav></div>
      <div className="footer-link-column"><h2>{t('shopDepartments')}</h2><nav aria-label={t('shopDepartments')}>{departments.map(key => <button key={key} onClick={() => department(key)}>{t(key)}</button>)}</nav></div>
      <div className="footer-link-column"><h2>{t('topBrands')}</h2><nav aria-label={t('topBrands')}>{brands.map(brand => <button key={brand} onClick={() => browse({ brand })}>{brand}</button>)}<button onClick={() => browse()}>{t('allBrands')}</button></nav></div>
      <div className="footer-link-column"><h2>{t('discoverFooter')}</h2><nav aria-label={t('discoverFooter')}>{discover.map(key => <button key={key} onClick={() => visit(key)}>{t(key)}</button>)}</nav><h2 className="footer-sell-title">{t('sell')}</h2><nav aria-label={t('waysToSell')}><button onClick={() => openSellGuide('what-to-expect')}>{t('orderBag')}</button><button onClick={() => openSellGuide()}>{t('sellingGuide')}</button><button onClick={() => openSellGuide('earnings')}>{t('allEarnings')}</button></nav></div>
      <div className="footer-engagement"><section><h2>{t('newsletterTitle')}</h2><p>{t('newsletterText')} <button className="footer-inline-link" onClick={() => info('termsUse')}>{t('readTerms')}</button></p><form className="newsletter-form" onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">{t('email')}</label><input id="newsletter-email" type="email" required autoComplete="email" placeholder={t('enterEmail')} value={email} onChange={e => { setEmail(e.target.value); setFeedback(''); }} /><button type="submit">{t('signup')}</button></form>{feedback && <p role="status" className="footer-form-feedback">{t(feedback)}</p>}</section>
        <section className="mobile-app-section"><h2>{t('mobileTitle')}</h2><p>{t('mobileText')}</p><div className="app-downloads"><MobileQrCode /><div className="app-store-badges"><button disabled aria-label={`${t('appStore')} — ${t('comingSoon')}`} title={t('comingSoon')}><span className="app-badge-symbol" aria-hidden="true">●</span><span><small>{t('comingSoon')}</small><strong>App Store</strong></span></button><button disabled aria-label={`${t('googlePlay')} — ${t('comingSoon')}`} title={t('comingSoon')}><Icon name="play_arrow" /><span><small>{t('comingSoon')}</small><strong>Google Play</strong></span></button></div></div></section>
        <section className="footer-connect"><h2>{t('connectFooter')}</h2><div className="footer-social-links">{[['Instagram', 'photo_camera'], ['Facebook', 'f'], ['Pinterest', 'P'], ['X', 'X']].map(([label, symbol]) => <button key={label} aria-label={label} onClick={() => setSocialFeedback(true)}>{symbol === 'photo_camera' ? <Icon name={symbol} /> : <span aria-hidden="true">{symbol}</span>}</button>)}</div>{socialFeedback && <p role="status">{t('socialSoon')}</p>}</section>
      </div>
    </div>
    <div className="marketplace-footer-bottom"><nav aria-label={t('legal')}>{['termsUse', 'privacy', 'accessibility', 'doNotSell', 'privacyChoices'].map(key => <button key={key} onClick={() => info(key)}>{t(key)}{key === 'privacyChoices' && <Icon name="toggle_on" />}</button>)}</nav><div><p>© {new Date().getFullYear()} Sifit. {t('allRights')}.</p><p>{t('screenReaderHelp')} <a href="tel:+84364478680">(+84)36-4478-680</a>.</p></div></div>
  </div></footer>;
}
