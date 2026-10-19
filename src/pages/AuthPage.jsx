import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitch from '../components/LanguageSwitch';
import Icon from '../components/Icon';
import logo from '../image/logo-favicon/Sifit-nobg.png';
import hero from '../image/banner/banner-log.jpg';

export default function AuthPage() {
  const { loginUser, registerUser, authMode, authRole, openAuth, setCurrentView, setInfoPage, authLoading } = useApp();
  const { t } = useLanguage();
  const isLogin = authMode === 'login';
  const [emailForm, setEmailForm] = useState(isLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: authRole });
  const [error, setError] = useState('');
  const changeMode = () => { openAuth(isLogin ? 'signup' : 'login'); setEmailForm(!isLogin); setError(''); };
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const result = isLogin
      ? await loginUser(form.email.trim(), form.password)
      : await registerUser(form.name.trim(), form.email.trim(), form.password, form.role);
    if (!result.success) setError(result.message || (isLogin ? 'authError' : 'registerError'));
  };
  const showLegal = () => { setInfoPage('legal'); setCurrentView('info'); };
  return <div className={`auth-page auth-fit ${isLogin ? 'auth-login' : 'auth-signup'}`}>
    <header className="auth-header"><button className="auth-brand" onClick={() => setCurrentView('homepage')} aria-label={t('backHome')}><img src={logo} alt="Sifit" /></button><div><LanguageSwitch /><button className="auth-header-switch" onClick={changeMode}>{isLogin ? t('signup') : t('login')}</button></div></header>
    <div className="auth-layout"><section className="auth-panel">
      <div className="auth-form-container"><p className="eyebrow green">SIFIT / WEAR YOUR STYLE</p><h1>{isLogin ? t('welcomeBack') : t('authTitle')}</h1><p className="auth-description">{isLogin ? t('loginDescription') : t('authDescription')}</p>
        <div className="social-logins">
          <button aria-label={t('google')} title={t('google')} onClick={() => setError('socialUnavailable')}><span className="social-google" aria-hidden="true">G</span><span className="auth-social-name">Google</span></button>
          <button aria-label={t('facebook')} title={t('facebook')} onClick={() => setError('socialUnavailable')}><span className="social-facebook" aria-hidden="true">f</span><span className="auth-social-name">Facebook</span></button>
          <button aria-label={t('apple')} title={t('apple')} onClick={() => setError('socialUnavailable')}><svg width="21" height="23" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.4 1.5c.2 1.8-1.3 3.5-3 3.6-.3-1.7 1.4-3.4 3-3.6M19.7 17c-.7 1.6-1.7 3.8-3.5 3.9-1.5.1-1.9-.8-3.5-.8s-2.1.9-3.5.8C6.1 20.7 2 13.1 5.2 8.7c1.1-1.5 3-2 4.5-1.4 1 .4 2 .8 3 .8 1-.1 2.1-1.2 3.7-.9 1.4.1 2.5.6 3.3 1.6-3.1 1.7-2.8 6 .1 7.5z" /></svg><span className="auth-social-name">Apple</span></button>
        </div>
        <div className="auth-or"><span />{t('or')}<span /></div>
        {error && <p className="auth-error" role="alert">{t(error)}</p>}
        {!emailForm ? <button className="auth-submit" onClick={() => setEmailForm(true)}>{t('emailSignup')}</button> : <form className="auth-email-form" onSubmit={handleSubmit}>
          {!isLogin && <label>{t('name')}<input required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}
          <label>{t('email')}<input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>{t('password')}<span className="password-input"><input aria-label={t('password')} type={showPassword ? 'text' : 'password'} required minLength={isLogin ? undefined : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? t('passwordHint') : t('strongPasswordHint')} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><button type="button" aria-label={t(showPassword ? 'hidePassword' : 'showPassword')} onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'visibility_off' : 'visibility'} /></button></span></label>
          {!isLogin && <label>{t('role')}<select aria-label={t('role')} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="buyer">{t('buyer')}</option><option value="seller">{t('seller')}</option></select></label>}
          <button type="submit" className="auth-submit" disabled={authLoading}>{authLoading ? t('loading') : isLogin ? t('login') : t('emailSignup')}<Icon name="arrow_forward" /></button>
        </form>}
        {!isLogin && <p className="auth-terms">{t('termsIntro')} <button onClick={showLegal}>{t('terms')}</button> {t('and')} <button onClick={showLegal}>{t('privacy')}</button>.</p>}
        <div className="auth-bottom-links"><p className="auth-mode-link">{isLogin ? t('noAccount') : t('hasAccount')} <button onClick={changeMode}>{isLogin ? t('signup') : t('login')}</button></p><button className="auth-back" onClick={() => setCurrentView('homepage')}><Icon name="arrow_back" />{t('backHome')}</button></div>
      </div>
    </section><aside className="auth-visual"><img src={hero} alt="Pre-loved fashion from Sifit" /><div className="auth-visual-shade" /><div className="auth-visual-copy"><p className="eyebrow">THE SECOND LIFE EDIT</p><h2>{t('heroTitle')}</h2><p>{t('heroDescription')}</p></div><span className="auth-photo-label">SIFIT / EST. FOR A BETTER WARDROBE</span></aside></div>
  </div>;
}
