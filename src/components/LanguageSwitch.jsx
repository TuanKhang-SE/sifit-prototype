import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';

export default function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return <label className="language-switch"><Icon name="language" />
    <select aria-label={locale === 'vi' ? 'Ngôn ngữ' : 'Language'} value={locale} onChange={e => setLocale(e.target.value)}>
      <option value="vi">Tiếng Việt</option><option value="en">English</option>
    </select>
  </label>;
}
