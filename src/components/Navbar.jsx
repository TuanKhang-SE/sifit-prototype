import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { currentView, setCurrentView, cart, user, logoutUser, searchQuery, setSearchQuery } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-[72px] gap-4">
        {/* Logo */}
        <button
          onClick={() => setCurrentView('homepage')}
          className="font-heading font-black text-2xl tracking-tight text-primary hover:scale-105 transition-transform bg-transparent border-none cursor-pointer flex-shrink-0"
        >
          Sifit.
        </button>

        {/* Search bar - desktop */}
        <div className="hidden md:flex flex-1 max-w-md relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/30 focus:shadow-[0_0_0_4px_rgba(0,108,73,0.08)] py-2.5 pl-11 pr-4 outline-none text-sm transition-all rounded-full"
            placeholder="Tìm áo vintage, giày hiệu..."
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'catalog') setCurrentView('catalog');
            }}
          />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-bold uppercase tracking-wider">
          {['homepage', 'catalog'].map(view => {
            if (view === 'catalog' && user?.role === 'seller') return null;
            const labels = { homepage: 'Trang Chủ', catalog: 'Cửa Hàng' };
            return (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`pb-0.5 transition-colors bg-transparent border-none cursor-pointer hover:text-primary ${
                  currentView === view ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
                }`}
              >
                {labels[view]}
              </button>
            );
          })}
          {user?.role === 'buyer' && (
            <button onClick={() => setCurrentView('checkout')} className={`pb-0.5 bg-transparent border-none cursor-pointer hover:text-primary text-gray-500 font-bold uppercase tracking-wider`}>
              Đơn Hàng
            </button>
          )}
          {user?.role !== 'seller' && user?.role !== 'admin' && (
            <button onClick={() => setCurrentView('ai-stylist')} className={`flex items-center gap-1 pb-0.5 bg-transparent border-none cursor-pointer ${currentView === 'ai-stylist' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-600'} font-black uppercase tracking-wider`}>
              <span className="material-symbols-outlined text-[16px] fill">auto_awesome</span>
              AI Stylist
            </button>
          )}
          {user?.role === 'seller' && (
            <button onClick={() => setCurrentView('seller')} className={`pb-0.5 bg-transparent border-none cursor-pointer hover:text-primary ${currentView === 'seller' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
              Kênh Bán
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={() => setCurrentView('admin')} className={`pb-0.5 bg-transparent border-none cursor-pointer hover:text-primary ${currentView === 'admin' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
              Quản Trị
            </button>
          )}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          {/* Chat */}
          <button
            onClick={() => { if (!user) { setCurrentView('auth'); return; } setCurrentView('chat'); }}
            className="p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative bg-transparent border-none cursor-pointer"
            title="Tin nhắn"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            {user && <span className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>}
          </button>

          {/* Cart */}
          {user?.role !== 'seller' && (
            <button
              onClick={() => { if (!user) { setCurrentView('auth'); return; } setCurrentView('checkout'); }}
              className="p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative bg-transparent border-none cursor-pointer"
              title="Giỏ hàng"
            >
              <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">
                  {cart.length}
                </span>
              )}
            </button>
          )}

          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20 overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.name.charAt(0).toUpperCase()
                }
              </div>
              <button
                onClick={logoutUser}
                className="text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider hidden sm:block"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('auth')}
              className="text-[13px] font-bold bg-primary text-white px-5 py-2.5 rounded-full hover:shadow-emerald-sm hover:-translate-y-0.5 transition-all cursor-pointer border-none uppercase tracking-wider ml-1"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
