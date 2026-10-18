import React from 'react';
import { AppContextProvider, useApp } from './context/AppContext';
import CartToast from './components/CartToast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Chat from './pages/Chat';
import CheckoutTracker from './pages/CheckoutTracker';
import SellerStudio from './pages/SellerStudio';
import AdminHub from './pages/AdminHub';
import ShopProfile from './pages/ShopProfile';
import AuthPage from './pages/AuthPage';
import AiStylist from './pages/AiStylist';
import { LanguageProvider } from './context/LanguageContext';
import InfoPage from './pages/InfoPage';
import SellPage from './pages/SellPage';
import CleanOutGuide from './pages/CleanOutGuide';

function MainLayout() {
  const { currentView } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'homepage': return <Homepage />;
      case 'catalog': return <Catalog />;
      case 'detail': return <ProductDetail />;
      case 'chat': return <Chat />;
      case 'shop': return <ShopProfile />;
      case 'ai-stylist': return <AiStylist />;
      case 'checkout': return <CheckoutTracker />;
      case 'seller': return <SellerStudio />;
      case 'sell': return <SellPage />;
      case 'sell-guide': return <CleanOutGuide />;
      case 'admin': return <AdminHub />;
      case 'auth': return <AuthPage />;
      case 'info': return <InfoPage />;
      default: return <Homepage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#17221e]">
      {currentView !== 'auth' && <Navbar />}
      <CartToast/>
      <main className={`flex-grow ${['detail', 'chat', 'shop', 'ai-stylist', 'checkout', 'seller', 'admin'].includes(currentView) ? 'workspace-screen' : ''}`}>{renderView()}</main>
      {currentView === 'ai-stylist' ? <details className="stylist-site-footer"><summary><span>© 2026 SiFit</span><span>SiFit <span className="material-symbols-outlined" aria-hidden="true">expand_more</span></span></summary><Footer/></details> : currentView !== 'auth' && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider><AppContextProvider>
      <MainLayout />
    </AppContextProvider></LanguageProvider>
  );
}
