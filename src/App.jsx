import React from 'react';
import { AppContextProvider, useApp } from './context/AppContext';
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
      case 'admin': return <AdminHub />;
      case 'auth': return <AuthPage />;
      default: return <Homepage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <Navbar />
      <main className="flex-grow">{renderView()}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <MainLayout />
    </AppContextProvider>
  );
}
