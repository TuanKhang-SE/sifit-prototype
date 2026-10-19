import { LanguageProvider } from './context/LanguageContext';
import { AppContextProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';

export default function App() {
  return (
    <LanguageProvider><AppContextProvider>
      <MainLayout />
    </AppContextProvider></LanguageProvider>
  );
}
