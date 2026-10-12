import { Children, cloneElement, Fragment, isValidElement } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateWorkspace } from '../data/workspaceTranslations';

// A translation boundary for the existing JSX screens. This works on React
// elements, not the DOM; it does not invoke components or change their state.
// Only known interface copy is translated. Original input/select values are kept.
function translateElements(children, translate) {
  return Children.map(children, child => {
    if (typeof child === 'string') return translate ? translateWorkspace(child) : child;
    if (!isValidElement(child) || (typeof child.type !== 'string' && child.type !== Fragment)) return child;
    const props = {};
    if (child.type === 'span' && child.props.className?.includes('material-symbols-outlined')) props['aria-hidden'] = true;
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      if (translate && typeof child.props[attr] === 'string') props[attr] = translateWorkspace(child.props[attr]);
    }
    if (child.type === 'option' && child.props.value === undefined && typeof child.props.children === 'string') props.value = child.props.children;
    if (child.props.children !== undefined) props.children = translateElements(child.props.children, translate);
    return cloneElement(child, props);
  });
}
export default function LocalizedContent({ children }) {
  const { locale } = useLanguage();
  return translateElements(children, locale === 'en');
}
