import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from '../components/Icon';
import bannerOne from '../image/banner/banner (1).png';
import bannerTwo from '../image/banner/banner (2).png';

const emptyDraft = { title: '', price: '', description: '' };
export default function SellPage() {
  const { openSellGuide, setInfoPage, setCurrentView } = useApp();
  const { t } = useLanguage();
  const [directOpen, setDirectOpen] = useState(false);
  const [status, setStatus] = useState('');
  const draftRef = useRef(null);
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sifit-listing-draft') || 'null');
      return saved && typeof saved === 'object' ? { title: String(saved.title || ''), price: String(saved.price || ''), description: String(saved.description || '') } : emptyDraft;
    } catch { return emptyDraft; }
  });
  const openDirect = () => { setDirectOpen(true); requestAnimationFrame(() => draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); };
  const saveDraft = event => {
    event.preventDefault();
    try { localStorage.setItem('sifit-listing-draft', JSON.stringify(draft)); setStatus('draftSaved'); }
    catch { setStatus('storageError'); }
  };
  return <div className="selling-page">
    <section className="selling-intro wide-container"><h1>{t('sellOnTerms')}</h1><p>{t('sellIntro')}</p></section>
    <section className="selling-options" aria-label={t('waysToSell')}>
      {[{ image: bannerOne, tag: 'cleanOut', title: 'sellForYou', text: 'sellForYouText', cta: 'exploreCleanOut', action: () => openSellGuide() },
        { image: bannerTwo, tag: 'directListing', title: 'sellYourself', text: 'sellYourselfText', cta: 'tryDirect', action: openDirect }].map(option => <article className="selling-option" key={option.tag}>
          <img src={option.image} alt={t(option.title)} fetchPriority="high" /><div className="selling-option-shade" />
          <div className="selling-option-copy"><p className="eyebrow">{t(option.tag)}</p><h2>{t(option.title)}</h2><p>{t(option.text)}</p><button className="selling-button" onClick={option.action}>{t(option.cta)}<Icon name="arrow_forward" /></button></div>
        </article>)}
    </section>
    {directOpen && <section className="listing-draft wide-container" ref={draftRef} aria-labelledby="draft-title"><div className="draft-heading"><div><p className="eyebrow green">SIFIT / DIRECT LISTING</p><h2 id="draft-title">{t('draftTitle')}</h2><p>{t('draftText')}</p></div><button aria-label={t('closePanel')} onClick={() => setDirectOpen(false)}><Icon name="close" /></button></div>
      <form onSubmit={saveDraft}><label>{t('pieceName')}<input required maxLength={160} placeholder={t('pieceNamePlaceholder')} value={draft.title} onChange={e => { setDraft({ ...draft, title: e.target.value }); setStatus(''); }} /></label><label>{t('sellingPrice')} (VND)<input required type="number" min="1000" step="1000" placeholder="250000" value={draft.price} onChange={e => { setDraft({ ...draft, price: e.target.value }); setStatus(''); }} /></label><label className="draft-description">{t('pieceDescription')}<textarea required rows="3" maxLength={3000} placeholder={t('pieceDescriptionPlaceholder')} value={draft.description} onChange={e => { setDraft({ ...draft, description: e.target.value }); setStatus(''); }} /></label><button className="selling-button green-button" type="submit">{t('saveDraft')}<Icon name="arrow_forward" /></button></form>
      {status && <p className="form-feedback" role="status">{t(status)}</p>}
    </section>}
    <section className="selling-manifesto"><div className="manifesto-motif" aria-hidden="true" /><div><p className="eyebrow">{t('wardrobeNote')}</p><blockquote>{t('wardrobeQuote')}</blockquote><p>{t('wardrobeSignature')}</p></div></section>
    <section className="selling-impact" id="sifit-impact"><img src={bannerOne} alt="" loading="lazy" /><div className="selling-impact-shade" /><div className="selling-impact-copy"><p className="eyebrow">{t('impactEyebrow')}</p><h2>{t('impactHeadline')}</h2><p>{t('impactText')}</p><button className="selling-button transparent-button" onClick={() => { setInfoPage('ourImpact'); setCurrentView('info'); }}>{t('learnMore')}</button></div></section>
  </div>;
}
