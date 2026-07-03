import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: 'monitoring' },
  { id: 'orders', label: 'Quản lý đơn', icon: 'receipt_long' },
  { id: 'add', label: 'Đăng sản phẩm', icon: 'add_box' },
  { id: 'listings', label: 'Sản phẩm', icon: 'inventory_2' },
  { id: 'marketing', label: 'Gói dịch vụ', icon: 'campaign' },
  { id: 'shopprofile', label: 'Hồ sơ shop', icon: 'storefront' },
];

const STATUS_COLORS = { active: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', sold: 'bg-gray-100 text-gray-500', reported: 'bg-red-100 text-red-600', hidden: 'bg-gray-100 text-gray-400' };

const EMPTY_FORM = { title: '', price: '', category: 'Tops', size: 'M', brand: "Levi's", condition: 85, color: '', material: '', defects: '', images: [''] };

export default function SellerStudio() {
  const { user, updateUser, products, createListing, updateListing, deleteListing, orders, updateOrderStatus, packages, activePackage, setActivePackage, setStats } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [shipData, setShipData] = useState({});
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const myListings = products.filter(p => p.seller?._id === user?._id);
  const myOrders = orders.filter(o => o.seller?._id === user?._id);
  const revenue = myOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (o.price * 0.93), 0);
  const rating = user?.averageRating || 4.8;

  const handleSubmit = (e) => {
    e.preventDefault();
    const listingData = { ...form, price: Number(form.price), condition: Number(form.condition), images: [form.images[0] || 'https://via.placeholder.com/400x533'] };
    if (editingId) {
      updateListing(editingId, listingData);
      setEditingId(null);
      alert('Cập nhật thành công!');
    } else {
      createListing(listingData);
      alert('Đăng sản phẩm thành công!');
    }
    setForm(EMPTY_FORM);
    setActiveTab('listings');
  };

  const handleEdit = (p) => {
    setForm({ title: p.title, price: p.price, category: p.category, size: p.size, brand: p.brand, condition: p.condition, color: p.color, material: p.material, defects: p.defects, images: p.images });
    setEditingId(p._id);
    setActiveTab('add');
  };

  const handleShip = (orderId) => {
    const d = shipData[orderId] || {};
    if (!d.carrier || !d.tracking) { alert('Vui lòng nhập đơn vị và mã vận đơn!'); return; }
    updateOrderStatus(orderId, { status: 'shipping', shippingCarrier: d.carrier, trackingNumber: d.tracking });
    setExpandedOrderId(null);
    alert('Xác nhận vận chuyển thành công!');
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Top bar */}
      <div className="bg-white border-b shadow-sm px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#ee4d2d] font-bold">
          <span className="material-symbols-outlined">storefront</span>
          <span>Kênh Người Bán</span>
        </div>
        <div className="flex items-center gap-2.5">
          <p className="text-sm font-bold text-gray-700 hidden sm:block">{user?.name}</p>
          <img src={user?.avatar || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full object-cover border" alt="" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 hidden md:block flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 p-2 space-y-0.5 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black px-3 py-2 tracking-widest">Admin Menu</p>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-left cursor-pointer border-none transition-all
                  ${activeTab === tab.id ? 'bg-orange-50 text-[#ee4d2d]' : 'text-gray-600 hover:bg-gray-50 bg-transparent'}`}>
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 space-y-5">
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border-none ${activeTab === tab.id ? 'bg-[#ee4d2d] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <h2 className="font-heading font-black text-2xl text-gray-900">Tổng Quan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Doanh thu dự kiến', value: `${revenue.toLocaleString('vi-VN')}đ`, color: 'text-[#ee4d2d]', icon: 'payments' },
                  { label: 'Sản phẩm đang bán', value: myListings.filter(p => p.status === 'active').length, color: 'text-gray-900', icon: 'inventory_2' },
                  { label: 'Đánh giá shop', value: `⭐ ${rating}`, color: 'text-amber-600', icon: 'star' },
                  { label: 'Gói hiện tại', value: activePackage?.name || 'Cơ bản', color: 'text-primary', icon: 'workspace_premium' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-gray-400 text-xl">{stat.icon}</span>
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</p>
                    <p className={`text-2xl font-heading font-black mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Đơn hàng gần đây</h3>
                {myOrders.slice(0, 3).map(order => (
                  <div key={order._id} className="flex justify-between items-center py-3 border-b last:border-0 border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={order.listing?.images?.[0]} className="w-10 h-10 object-cover rounded-lg border" alt="" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{order.listing?.title}</p>
                        <p className="text-xs text-gray-400">{order.buyer?.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-heading font-black text-2xl text-gray-900">Quản Lý Đơn Hàng</h2>
              {myOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400"><p>Chưa có đơn hàng nào.</p></div>
              ) : myOrders.map(order => (
                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">#{order._id.substring(0, 8).toUpperCase()}</span>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-bold">{order.buyer?.name}</span>
                  </div>
                  <div className="flex gap-4 items-center mb-3">
                    <img src={order.listing?.images?.[0]} className="w-14 h-14 object-cover rounded-xl border border-gray-100" alt="" />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{order.listing?.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        📍 {order.shippingAddress?.addressDetail}, {order.shippingAddress?.district}, {order.shippingAddress?.city}
                      </p>
                      <div className="mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1 w-full max-w-sm">
                        <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                          <span>Giá bán:</span>
                          <span>{order.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-red-500 font-bold border-b border-gray-200 pb-1.5">
                          <span>Phí Sifit (-7%):</span>
                          <span>-{(order.price * 0.07).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-xs text-green-700 font-black pt-1">
                          <span>Thực nhận:</span>
                          <span>{(order.price * 0.93).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)} className="flex items-center gap-2 text-xs text-primary font-bold cursor-pointer bg-transparent border-none">
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        {expandedOrderId === order._id ? 'Đóng' : 'Xác nhận & Giao hàng'}
                      </button>
                      {expandedOrderId === order._id && (
                        <div className="mt-3 p-4 bg-orange-50 rounded-xl space-y-3 border border-[#ee4d2d]/20">
                          <div className="grid grid-cols-2 gap-3">
                            <input placeholder="Đơn vị vận chuyển (GHTK...)" value={shipData[order._id]?.carrier || ''} onChange={e => setShipData({ ...shipData, [order._id]: { ...shipData[order._id], carrier: e.target.value } })} className="input-field text-xs" />
                            <input placeholder="Mã vận đơn" value={shipData[order._id]?.tracking || ''} onChange={e => setShipData({ ...shipData, [order._id]: { ...shipData[order._id], tracking: e.target.value } })} className="input-field text-xs" />
                          </div>
                          <button onClick={() => handleShip(order._id)} className="px-5 py-2 bg-[#ee4d2d] text-white rounded-full text-xs font-bold cursor-pointer border-none hover:opacity-90">
                            Xác Nhận Giao Hàng
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {order.trackingNumber && (
                    <p className="text-xs text-primary font-bold mt-2">🚚 {order.shippingCarrier}: {order.trackingNumber}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ADD PRODUCT */}
          {activeTab === 'add' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
              <h2 className="font-heading font-black text-2xl text-gray-900 mb-6">{editingId ? 'Chỉnh Sửa Sản Phẩm' : 'Đăng Sản Phẩm Mới'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">URL Ảnh chính</label>
                  <input required placeholder="https://images.unsplash.com/..." value={form.images[0]} onChange={e => setForm({ ...form, images: [e.target.value] })} className="input-field" />
                  {form.images[0] && <img src={form.images[0]} alt="" className="mt-2 w-20 h-20 object-cover rounded-xl border border-gray-100" onError={e => e.target.style.display = 'none'} />}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tên sản phẩm</label>
                  <input required placeholder="VD: Áo khoác Levi's Vintage Wash" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Giá bán (VND)</label>
                  <input required type="number" placeholder="450000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Danh mục', 'category', ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories']],
                    ['Kích thước', 'size', ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize']],
                    ['Thương hiệu', 'brand', ["Levi's", 'Nike', 'Zara', 'Stussy', 'Adidas', 'Uniqlo']],
                  ].map(([label, key, opts]) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
                      <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input-field">
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Độ mới (%)</label>
                    <input type="number" min="0" max="100" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="input-field" />
                  </div>
                </div>
                {[['Màu sắc', 'color', 'Navy Blue, Washed Black...'], ['Chất liệu', 'material', '100% Cotton, 70% Polyester...'], ['Mô tả vết lỗi', 'defects', 'Không có lỗi / Vết xước nhỏ ở...']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
                    <input placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input-field" />
                  </div>
                ))}
                <div className="flex gap-3">
                  <button type="submit" className="px-7 py-3 bg-[#ee4d2d] text-white rounded-xl font-bold cursor-pointer border-none hover:opacity-90 text-sm">
                    {editingId ? '💾 Lưu Thay Đổi' : '🚀 Đăng Sản Phẩm'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-50">
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* MY LISTINGS */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-gray-100">
                <h2 className="font-heading font-black text-xl">Sản Phẩm Đã Đăng ({myListings.length})</h2>
                <button onClick={() => setActiveTab('add')} className="flex items-center gap-2 bg-[#ee4d2d] text-white px-4 py-2 rounded-full text-sm font-bold cursor-pointer border-none hover:opacity-90">
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm Mới
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                      <th className="text-right px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Giá</th>
                      <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myListings.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-gray-400">Chưa có sản phẩm nào.</td></tr>
                    ) : myListings.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <img src={p.images?.[0]} className="w-12 h-12 object-cover rounded-xl border border-gray-100 flex-shrink-0" alt="" />
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{p.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.brand} · {p.size}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900">{p.price.toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEdit(p)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg cursor-pointer bg-transparent border-none transition-colors" title="Sửa">
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button onClick={() => { if (confirm('Xóa sản phẩm này?')) deleteListing(p._id); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer bg-transparent border-none transition-colors" title="Xóa">
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MARKETING */}
          {activeTab === 'marketing' && (
            <div className="space-y-5">
              <h2 className="font-heading font-black text-2xl text-gray-900">Gói Dịch Vụ</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {packages.map((pkg, i) => (
                  <div key={pkg._id} className={`bg-white rounded-2xl border-2 p-6 relative overflow-hidden ${i === 0 ? 'border-[#ee4d2d]' : 'border-gray-200'}`}>
                    {i === 0 && <div className="absolute top-0 right-0 bg-[#ee4d2d] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">🔥 Hot</div>}
                    <h3 className="font-heading font-bold text-lg text-gray-900">{pkg.name}</h3>
                    <p className={`text-3xl font-heading font-black mt-3 mb-5 ${i === 0 ? 'text-[#ee4d2d]' : 'text-gray-900'}`}>
                      {pkg.price.toLocaleString('vi-VN')}đ
                      <span className="text-sm font-normal text-gray-500">/tháng</span>
                    </p>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="material-symbols-outlined text-green-500 text-base mt-0.5 fill">check_circle</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        setActivePackage(pkg);
                        setStats(prev => ({ ...prev, platformRevenue: (prev.platformRevenue || 0) + pkg.price }));
                        alert(`Chúc mừng! Bạn đã đăng ký thành công ${pkg.name}. Mọi quyền lợi đã được kích hoạt.`);
                        setActiveTab('overview');
                      }}
                      className={`w-full py-3 rounded-full font-bold text-sm cursor-pointer border-none ${i === 0 ? 'bg-[#ee4d2d] text-white hover:opacity-90' : 'bg-gray-900 text-white hover:bg-gray-700'} transition-all`}
                    >
                      Mua {pkg.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHOP PROFILE */}
          {activeTab === 'shopprofile' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
              <h2 className="font-heading font-black text-2xl mb-6">Hồ Sơ Shop</h2>
              <form onSubmit={(e) => { e.preventDefault(); updateUser(profileData); alert('Cập nhật thành công!'); }} className="space-y-5">
                <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-primary flex items-center justify-center">
                    {profileData.avatar ? <img src={profileData.avatar} className="w-full h-full object-cover" alt="" onError={e => e.target.style.display = 'none'} /> : <span className="font-heading font-black text-2xl text-white">{user?.name?.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{profileData.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                {[['Email', 'email', user?.email, true], ['Tên Shop', 'name', ''], ['Số điện thoại liên hệ', 'phone', '']].map(([label, key, ph, readOnly]) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
                    <input readOnly={readOnly} defaultValue={readOnly ? ph : undefined} value={readOnly ? undefined : profileData[key]} onChange={readOnly ? undefined : e => setProfileData({ ...profileData, [key]: e.target.value })} placeholder={ph || ''} className={`input-field ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ảnh đại diện (URL)</label>
                  <input value={profileData.avatar} onChange={e => setProfileData({ ...profileData, avatar: e.target.value })} placeholder="https://..." className="input-field" />
                  <p className="text-[11px] text-gray-400 mt-1.5">Hỗ trợ: JPG, PNG, WebP</p>
                </div>
                <button type="submit" className="px-7 py-3 bg-[#ee4d2d] text-white rounded-xl font-bold cursor-pointer border-none hover:opacity-90 text-sm">
                  Lưu Thay Đổi
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
