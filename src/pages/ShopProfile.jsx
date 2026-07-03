import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ShopProfile() {
  const { currentSellerId, getSellerData, setSelectedProduct, setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState('products');

  const { seller, listings, reviews } = getSellerData(currentSellerId);

  if (!seller) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-400">
        <span className="material-symbols-outlined text-5xl text-gray-200 block mb-4">store</span>
        <p>Không tìm thấy thông tin shop này.</p>
        <button onClick={() => setCurrentView('catalog')} className="mt-4 px-5 py-2 bg-primary text-white rounded-full text-sm font-bold cursor-pointer border-none">Quay lại Shop</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Shop Cover */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
            {seller.avatar ? <img src={seller.avatar} alt="" className="w-full h-full object-cover" /> : (
              <span className="font-heading font-black text-4xl text-white">{seller.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-black text-3xl text-gray-900">{seller.name}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-gray-400">inventory_2</span>
                {listings.length} sản phẩm
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-amber-400 fill">star</span>
                <span className="font-bold text-amber-600">{seller.averageRating || 0}</span>
                <span>({seller.reviewCount || 0} đánh giá)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-gray-400">calendar_month</span>
                Tham gia {new Date(seller.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#ee4d2d] text-[#ee4d2d] rounded-full text-sm font-bold hover:bg-orange-50 transition-colors cursor-pointer bg-white">
            <span className="material-symbols-outlined text-base">favorite_border</span>
            Theo dõi
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 border-t border-gray-100">
          <div className="flex gap-8">
            {[
              { id: 'products', label: `Đang bán (${listings.length})` },
              { id: 'reviews', label: `Đánh giá (${reviews.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0
                  ${activeTab === tab.id ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Products Tab */}
        {activeTab === 'products' && (
          listings.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">inventory_2</span>
              <p>Shop chưa có sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {listings.map(p => (
                <div
                  key={p._id}
                  onClick={() => { setSelectedProduct(p); setCurrentView('detail'); }}
                  className="group cursor-pointer hover-lift"
                >
                  <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-2.5 shadow-sm">
                    <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-2 left-2">
                      <span className="badge-condition">Mới {p.condition}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{p.title}</h3>
                    <p className="text-sm font-black text-[#ee4d2d] mt-0.5">{p.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">rate_review</span>
              <p>Shop chưa có đánh giá nào.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {/* Rating summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl font-heading font-black text-gray-900">{seller.averageRating || 0}</p>
                  <div className="flex text-amber-400 justify-center mt-2">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`material-symbols-outlined text-base ${s <= Math.round(seller.averageRating || 0) ? 'fill' : 'text-gray-200'}`}>star</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{reviews.length} đánh giá</p>
                </div>
              </div>
              {reviews.map(review => (
                <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                  <img src={review.reviewer?.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border" alt="" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-gray-900">{review.reviewer?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex text-amber-400 my-1.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`material-symbols-outlined text-xs ${s <= review.rating ? 'fill' : 'text-gray-200'}`}>star</span>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700">{review.comment}</div>
                    <p className="text-xs text-gray-400 mt-2">📦 {review.listing?.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
