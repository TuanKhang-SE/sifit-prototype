import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from '../components/Icon';
import bannerOne from '../image/banner/banner (1).png';
import bannerTwo from '../image/banner/banner (2).png';

export default function SellPage() {
  const { openSellGuide, setInfoPage, setCurrentView, user, openAuth } = useApp();
  const { t } = useLanguage();
  const openDirect = () => user?.role === 'seller' ? setCurrentView('seller') : openAuth('signup', 'seller');
  return <div className="selling-page">
    <section className="selling-intro wide-container"><h1>{t('sellOnTerms')}</h1><p>{t('sellIntro')}</p></section>
    <section className="selling-options" aria-label={t('waysToSell')}>
      {[{ image: bannerOne, tag: 'cleanOut', title: 'sellForYou', text: 'sellForYouText', cta: 'exploreCleanOut', action: () => openSellGuide() },
        { image: bannerTwo, tag: 'directListing', title: 'sellYourself', text: 'sellYourselfText', cta: 'tryDirect', action: openDirect }].map(option => <article className="selling-option" key={option.tag}>
          <img src={option.image} alt={t(option.title)} fetchPriority="high" /><div className="selling-option-shade" />
          <div className="selling-option-copy"><p className="eyebrow">{t(option.tag)}</p><h2>{t(option.title)}</h2><p>{t(option.text)}</p><button className="selling-button" onClick={option.action}>{t(option.cta)}<Icon name="arrow_forward" /></button></div>
        </article>)}
    </section>
    <section className="selling-manifesto"><div className="manifesto-motif" aria-hidden="true" /><div><p className="eyebrow">{t('wardrobeNote')}</p><blockquote>{t('wardrobeQuote')}</blockquote><p>{t('wardrobeSignature')}</p></div></section>
    <section className="selling-impact" id="sifit-impact"><img src={bannerOne} alt="" loading="lazy" /><div className="selling-impact-shade" /><div className="selling-impact-copy"><p className="eyebrow">{t('impactEyebrow')}</p><h2>{t('impactHeadline')}</h2><p>{t('impactText')}</p><button className="selling-button transparent-button" onClick={() => { setInfoPage('ourImpact'); setCurrentView('info'); }}>{t('learnMore')}</button></div></section>
  </div>;
}
