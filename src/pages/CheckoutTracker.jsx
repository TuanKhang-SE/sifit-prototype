import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';
import { useWorkspaceTranslation } from '../context/useWorkspaceTranslation';

const STATUS_STEPS = ['pending', 'processing', 'shipping', 'completed'];
const STATUS_LABELS = { pending: 'Chờ xác nhận', processing: 'Đang chuẩn bị', shipping: 'Đang vận chuyển', completed: 'Đã nhận hàng', cancelled: 'Đã hủy' };
const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', shipping: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' };

export default function CheckoutTracker() {
  const tr = useWorkspaceTranslation();
  const { user, updateUser, cart, removeFromCart, orders, createOrder, updateOrderStatus, checkoutProduct, setCheckoutProduct, setSelectedProduct, setCurrentView, submitReview } = useApp();
  const [activeTab, setActiveTab] = useState(checkoutProduct || cart.length > 0 ? 'checkout' : 'orders');
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [reviewingOrderId, setReviewingOrderId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [shipping, setShipping] = useState(
    user?.addresses?.[0] || { recipientName: '', recipientPhone: '', addressDetail: '', ward: '', district: '', city: '' }
  );
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });
  const [addressData, setAddressData] = useState(user?.addresses?.[0] || { recipientName: '', recipientPhone: '', addressDetail: '', ward: '', district: '', city: '' });

  const tabs = [
    { id: 'profile', label: 'Tài khoản', icon: 'person' },
    { id: 'orders', label: 'Đơn mua', icon: 'receipt_long' },
    { id: 'checkout', label: 'Giỏ hàng', icon: 'shopping_cart_checkout' },
  ];

  const placeOrder = (e) => {
    e.preventDefault();
    const items = checkoutProduct ? [checkoutProduct] : cart.filter(i => selectedItems.includes(i._id));
    if (items.length === 0) { alert(tr('Chọn ít nhất 1 sản phẩm!')); return; }
    items.forEach(item => createOrder({ listingId: item._id, shippingAddress: shipping }));
    if (!checkoutProduct) items.forEach(item => removeFromCart(item._id));
    setCheckoutProduct(null);
    setSelectedItems([]);
    alert(tr('Đặt hàng thành công! 🎉'));
    setActiveTab('orders');
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return o.status === 'pending';
    if (orderFilter === 'shipping') return o.status === 'processing' || o.status === 'shipping';
    if (orderFilter === 'completed') return o.status === 'completed';
    return false;
  });

  return (
    <LocalizedContent>
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 hidden md:block flex-shrink-0">
          <div className="flex items-center gap-3 mb-6 p-3 bg-white rounded-2xl border border-gray-100">
            <img src={user?.avatar || 'https://i.pravatar.cc/150'} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
            <div>
              <p className="font-bold text-sm text-gray-900 line-clamp-1">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-left cursor-pointer border-none transition-colors
                  ${activeTab === tab.id ? 'bg-[#ee4d2d]/10 text-[#ee4d2d]' : 'text-gray-600 hover:bg-gray-100 bg-transparent'}`}>
                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border-none ${activeTab === tab.id ? 'bg-[#ee4d2d] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-heading font-bold text-xl mb-6 border-b pb-4">Hồ Sơ Của Tôi</h2>
              <form onSubmit={(e) => { e.preventDefault(); updateUser({ ...profileData, addresses: [addressData] }); alert(tr('Cập nhật thành công!')); }} className="space-y-4 max-w-xl">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <img src={profileData.avatar || 'https://i.pravatar.cc/150'} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                  <div>
                    <p className="font-bold text-gray-900">{profileData.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-[#ee4d2d] font-bold uppercase mt-1">{user?.role}</p>
                  </div>
                </div>
                {[['Tên hiển thị', 'name', 'text'], ['Số điện thoại', 'phone', 'tel']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
                    <input type={type} value={profileData[key]} onChange={e => setProfileData({ ...profileData, [key]: e.target.value })} className="input-field" />
                  </div>
                ))}
                <h3 className="font-bold text-gray-800 pt-4 border-t">Địa chỉ mặc định</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[['Họ và tên', 'recipientName'], ['Số điện thoại', 'recipientPhone']].map(([ph, key]) => (
                    <input key={key} placeholder={ph} value={addressData[key] || ''} onChange={e => setAddressData({ ...addressData, [key]: e.target.value })} className="input-field" />
                  ))}
                  <input placeholder="Số nhà, tên đường" value={addressData.addressDetail || ''} onChange={e => setAddressData({ ...addressData, addressDetail: e.target.value })} className="input-field col-span-2" />
                  <input placeholder="Phường/Xã" value={addressData.ward || ''} onChange={e => setAddressData({ ...addressData, ward: e.target.value })} className="input-field" />
                  <input placeholder="Quận/Huyện" value={addressData.district || ''} onChange={e => setAddressData({ ...addressData, district: e.target.value })} className="input-field" />
                  <input placeholder="Tỉnh/Thành phố" value={addressData.city || ''} onChange={e => setAddressData({ ...addressData, city: e.target.value })} className="input-field col-span-2" />
                </div>
                <button type="submit" className="px-6 py-2.5 bg-[#ee4d2d] text-white rounded-xl text-sm font-bold hover:opacity-90 cursor-pointer border-none">Lưu Thay Đổi</button>
              </form>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Filter tabs */}
              <div className="flex border-b overflow-x-auto">
                {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['shipping', 'Vận chuyển'], ['completed', 'Hoàn thành']].map(([val, label]) => (
                  <button key={val} onClick={() => setOrderFilter(val)}
                    className={`flex-1 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer bg-transparent
                      ${orderFilter === val ? 'border-[#ee4d2d] text-[#ee4d2d]' : 'border-transparent text-gray-500 hover:text-[#ee4d2d] border-none'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-4 bg-gray-50 min-h-[300px]">
                {filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-3 text-gray-200">receipt_long</span>
                    <p>Chưa có đơn hàng nào.</p>
                  </div>
                ) : filteredOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                      <span className="text-xs font-bold text-gray-400">#{order._id.substring(0, 8).toUpperCase()}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                    </div>
                    {/* Product row */}
                    <div className="flex gap-4 cursor-pointer" onClick={() => { setSelectedProduct(order.listing); setCurrentView('detail'); }}>
                      <img src={order.listing?.images?.[0]} className="w-20 h-20 object-cover rounded-xl border border-gray-100" alt="" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1 hover:text-[#ee4d2d] transition-colors">{order.listing?.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">Size: {order.listing?.size} · {order.listing?.brand}</p>
                        {order.trackingNumber && (
                          <p className="text-xs text-primary mt-1 font-bold">🚚 {order.shippingCarrier}: {order.trackingNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#ee4d2d] text-base">{(order.price + 30000).toLocaleString('vi-VN')}đ</p>
                        <p className="text-[11px] text-gray-400 mt-1">+ ship 30k</p>
                      </div>
                    </div>
                    {/* Stepper */}
                    {order.status !== 'cancelled' && (
                      <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
                        {STATUS_STEPS.map((step, i) => {
                          const stepIdx = STATUS_STEPS.indexOf(order.status);
                          const done = i <= stepIdx;
                          return (
                            <React.Fragment key={step}>
                              <div className={`flex flex-col items-center ${i > 0 ? '' : ''}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                                  {done ? <span className="material-symbols-outlined text-[10px]">check</span> : i + 1}
                                </div>
                                <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight w-14">{STATUS_LABELS[step]}</span>
                              </div>
                              {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < STATUS_STEPS.indexOf(order.status) ? 'bg-primary' : 'bg-gray-200'}`}></div>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="mt-4 flex justify-end gap-3">
                      {order.status === 'shipping' && (
                        <button onClick={() => updateOrderStatus(order._id, { status: 'completed' })} className="px-4 py-2 bg-[#ee4d2d] text-white rounded-full text-xs font-bold hover:opacity-90 cursor-pointer border-none">
                          Đã Nhận Hàng
                        </button>
                      )}
                      {order.status === 'completed' && !order.isReviewed && reviewingOrderId !== order._id && (
                        <button onClick={() => setReviewingOrderId(order._id)} className="px-4 py-2 border border-[#ee4d2d] text-[#ee4d2d] rounded-full text-xs font-bold hover:bg-orange-50 cursor-pointer bg-white">
                          Đánh Giá
                        </button>
                      )}
                    </div>
                    {/* Review form */}
                    {reviewingOrderId === order._id && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-[#ee4d2d]/20 space-y-3">
                        <div className="flex justify-between">
                          <p className="text-sm font-bold text-gray-700">Đánh giá sản phẩm</p>
                          <button onClick={() => setReviewingOrderId(null)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-base">✕</button>
                        </div>
                        <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setReviewRating(s)} className={`material-symbols-outlined text-2xl cursor-pointer bg-transparent border-none p-0 ${s <= reviewRating ? 'text-amber-400 fill' : 'text-gray-300'}`}>star</button>
                          ))}
                        </div>
                        <textarea placeholder="Chia sẻ cảm nhận của bạn..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={2} className="input-field resize-none text-xs" />
                        <div className="flex justify-end">
                          <button onClick={() => { submitReview(order._id, reviewRating, reviewComment); setReviewingOrderId(null); setReviewComment(''); setReviewRating(5); }} className="px-5 py-2 bg-[#ee4d2d] text-white rounded-full text-xs font-bold hover:opacity-90 cursor-pointer border-none">
                            Gửi Đánh Giá
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHECKOUT */}
          {activeTab === 'checkout' && (
            <div className="space-y-4">
              {/* Products */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-heading font-bold text-lg mb-4">Sản phẩm thanh toán</h2>
                {(!checkoutProduct && cart.length === 0) ? (
                  <div className="py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-gray-200">shopping_cart</span>
                    <p className="text-sm">Giỏ hàng trống. Hãy thêm sản phẩm!</p>
                    <button onClick={() => setCurrentView('catalog')} className="mt-4 px-5 py-2 bg-primary text-white rounded-full text-sm font-bold cursor-pointer border-none">Mua sắm ngay</button>
                  </div>
                ) : (checkoutProduct ? [checkoutProduct] : cart).map(item => (
                  <div key={item._id} className="flex gap-4 py-4 border-b border-gray-100 last:border-0 items-center">
                    {!checkoutProduct && (
                      <input type="checkbox" checked={selectedItems.includes(item._id)} onChange={() => setSelectedItems(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id])} className="accent-[#ee4d2d] w-4 h-4 cursor-pointer" />
                    )}
                    <img src={item.images?.[0]} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-100" />
                    <div className="flex-1">
                      <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.size} · {item.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#ee4d2d]">{item.price.toLocaleString('vi-VN')}đ</p>
                      {!checkoutProduct && <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-red-500 text-xs mt-1 cursor-pointer bg-transparent border-none">Xóa</button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form */}
              {(checkoutProduct || cart.length > 0) && (
                <form onSubmit={placeOrder} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
                  <h2 className="font-heading font-bold text-lg">Địa Chỉ Giao Hàng</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Họ và tên" value={shipping.recipientName} onChange={e => setShipping({ ...shipping, recipientName: e.target.value })} className="input-field" />
                    <input required placeholder="Số điện thoại" value={shipping.recipientPhone} onChange={e => setShipping({ ...shipping, recipientPhone: e.target.value })} className="input-field" />
                    <input required placeholder="Số nhà, tên đường" value={shipping.addressDetail} onChange={e => setShipping({ ...shipping, addressDetail: e.target.value })} className="input-field col-span-2" />
                    <input required placeholder="Phường/Xã" value={shipping.ward} onChange={e => setShipping({ ...shipping, ward: e.target.value })} className="input-field" />
                    <input required placeholder="Quận/Huyện" value={shipping.district} onChange={e => setShipping({ ...shipping, district: e.target.value })} className="input-field" />
                    <input required placeholder="Tỉnh/Thành phố" value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} className="input-field col-span-2" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-gray-900 mb-3">Thanh Toán</h3>
                    <div className="flex gap-3">
                      <div className="flex-1 border-2 border-[#ee4d2d] rounded-xl p-3 text-center relative cursor-pointer">
                        <p className="text-sm font-bold text-[#ee4d2d]">COD</p>
                        <p className="text-xs text-gray-500 mt-0.5">Thanh toán khi nhận</p>
                        <span className="absolute top-0 right-0 bg-[#ee4d2d] text-white text-[9px] font-black px-2 py-0.5 rounded-bl-xl rounded-tr-xl">✓ Chọn</span>
                      </div>
                      <div className="flex-1 border border-gray-200 rounded-xl p-3 text-center opacity-50 cursor-not-allowed">
                        <p className="text-sm font-bold text-gray-400">VNPAY / Momo</p>
                        <p className="text-xs text-gray-400 mt-0.5">Đang bảo trì</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-5">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        {(() => {
                          const items = checkoutProduct ? [checkoutProduct] : cart.filter(i => selectedItems.includes(i._id));
                          const sub = items.reduce((acc, i) => acc + i.price, 0);
                          const fee = items.length * 30000;
                          return (
                            <>
                              <div className="flex justify-between text-gray-500"><span>Tổng tiền hàng</span><span>{sub.toLocaleString('vi-VN')}đ</span></div>
                              <div className="flex justify-between text-gray-500"><span>Phí ship</span><span>{fee.toLocaleString('vi-VN')}đ</span></div>
                              <div className="flex justify-between text-gray-500"><span>Phí dịch vụ Sifit</span><span className="text-green-600 font-bold">0đ (Miễn phí)</span></div>
                              <div className="flex justify-between items-center pt-3 border-t font-black">
                                <span className="text-gray-900">Tổng thanh toán</span>
                                <span className="text-2xl text-[#ee4d2d]">{(sub + fee).toLocaleString('vi-VN')}đ</span>
                              </div>
                              <button type="submit" className="w-full bg-[#ee4d2d] text-white py-3.5 rounded-xl mt-2 font-bold hover:opacity-90 cursor-pointer border-none">
                                Đặt Hàng ({items.length} sản phẩm)
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </LocalizedContent>
  );
}
