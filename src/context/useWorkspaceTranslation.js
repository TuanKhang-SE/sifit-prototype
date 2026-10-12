import { useLanguage } from './LanguageContext';
import { translateWorkspace } from '../data/workspaceTranslations';

export function useWorkspaceTranslation() {
  const { locale } = useLanguage();
  return value => locale === 'en' ? translateWorkspace(value) : value;
}
