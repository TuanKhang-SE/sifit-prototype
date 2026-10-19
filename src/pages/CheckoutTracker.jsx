import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';
import AddressBook from '../components/AddressBook';
import OrderCard from '../components/OrderCard';
import { Panel, Tabs, Feedback, Field } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { money, idOf } from '../utils/marketplace';

import * as addressService from '../services/addressService';
import * as disputeService from '../services/disputeService';
import * as authService from '../services/authService';
import { collectPages } from '../services/pagination';

const emptyAddress = { recipientName: '', phone: '', addressLine: '', ward: '', district: '', city: '' };
export default function CheckoutTracker({ historyOnly = false }) {
  const { user, cart, removeFromCart, orders, createOrder, fetchOrders, checkoutProduct, setCheckoutProduct, logoutUser } = useApp();
  const [tab, setTab] = useState(!historyOnly && (checkoutProduct || cart.length) ? 'checkout' : 'orders');
  const [addresses, setAddresses] = useState([]);
  const [shipping, setShipping] = useState(emptyAddress);
  const [disputes, setDisputes] = useState([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const { busy, error, run } = useAction();
  const attempt = useRef(null);
  const [created, setCreated] = useState(null);
  useEffect(() => { run(async () => {
    const data = await addressService.listAddresses(); setAddresses(data);
    const defaultAddress = data.find(item => item.isDefault && item.addressType !== 'PICKUP') || data.find(item => item.addressType !== 'PICKUP');
    if (defaultAddress) setShipping({ ...defaultAddress, city: defaultAddress.province });
  }); }, [run]);
  useEffect(() => {
    if (tab === 'disputes') run(async () => setDisputes((await collectPages(disputeService.listMyDisputes)).items));
  }, [tab, run]);
  const placeOrder = event => {
    event.preventDefault();
    run(async () => {
      const address = Object.fromEntries(Object.keys(emptyAddress).map(key => [key, shipping[key]]));
      const fingerprint = JSON.stringify({ products: cart.map(item => item._id).sort(), address });
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      const result = await createOrder({ shippingAddress: address, idempotencyKey: attempt.current.key });
      if (!result.success) throw new Error(result.message);
      setCreated(result.data); setCheckoutProduct(null); setTab('orders');
    });
  };
  return <LocalizedContent><div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
    <h1 className="font-heading text-3xl font-bold">{historyOnly ? 'Đơn mua trước đây' : 'Tài khoản của tôi'}</h1>
    <Tabs disabled={busy} value={tab} onChange={setTab} items={historyOnly ? [['orders', 'Đơn mua'], ['disputes', 'Khiếu nại']] : [[ 'checkout', `Giỏ hàng (${cart.length})` ], ['orders', 'Đơn mua'], ['addresses', 'Địa chỉ'], ['disputes', 'Khiếu nại'], ['profile', 'Tài khoản']]} />
    <Feedback error={error} busy={busy} />
    {tab === 'checkout' && <Panel title="Đặt hàng toàn bộ giỏ hàng">
      <p>Đơn hàng được tách theo từng người bán. Xóa các món bạn chưa muốn mua trước khi đặt hàng.</p>
      {cart.map(item => <div key={item._id} className="flex items-center gap-3 border-b py-3">{item.images[0] && <img src={item.images[0]} alt="" className="w-16 h-16 object-cover rounded-xl" />}<div className="flex-1"><p>{item.title}</p><p>{money(item.price)}</p>{!item.available && <p className="text-red-600">Sản phẩm không còn khả dụng</p>}</div><button disabled={busy} onClick={() => removeFromCart(item._id)}>Xóa</button></div>)}
      {cart.length === 0 ? <p>Giỏ hàng trống.</p> : <form onSubmit={placeOrder} className="space-y-4">
        <Field label="Chọn địa chỉ đã lưu"><select className="input-field" defaultValue="" onChange={event => { const address = addresses.find(item => idOf(item) === event.target.value); setShipping(address ? { ...address, city: address.province } : emptyAddress); }}><option value="">Nhập địa chỉ giao hàng</option>{addresses.filter(item => item.addressType !== 'PICKUP').map(item => <option key={idOf(item)} value={idOf(item)}>{item.label} · {item.addressLine}</option>)}</select></Field>
        <div className="grid sm:grid-cols-2 gap-3">{[['Người nhận', 'recipientName'], ['Số điện thoại', 'phone'], ['Số nhà, tên đường', 'addressLine'], ['Phường/Xã', 'ward'], ['Quận/Huyện', 'district'], ['Tỉnh/Thành phố', 'city']].map(([label, key]) => <Field label={label} key={key}><input className="input-field" required value={shipping[key]} onChange={event => setShipping({ ...shipping, [key]: event.target.value })} /></Field>)}</div>
        <p>Tiền hàng dự kiến: <strong>{money(cart.reduce((sum, item) => sum + item.price, 0))}</strong></p>
        <p>Tổng tiền và phí giao hàng được xác nhận trong đơn hàng. Đơn mới tạo sẽ chờ thanh toán; bạn có thể thanh toán trong mục Đơn mua.</p>
        <button className="btn-primary" disabled={busy || cart.some(item => !item.available)}>Đặt hàng ({cart.length} sản phẩm)</button>
      </form>}
    </Panel>}
    {tab === 'orders' && <div className="space-y-4">
      {created && <p role="status" className="p-3 bg-green-50 rounded-xl">Đã tạo đơn hàng. Tổng thanh toán: {money(created.buyerTotal)}. Trạng thái: {created.orderStatus}.</p>}
      <button disabled={busy} onClick={() => run(fetchOrders)}>Làm mới đơn mua</button>
      {!orders.length && <p>Chưa có đơn mua.</p>}
      {orders.map(order => <OrderCard key={order._id} order={order} onChange={fetchOrders} />)}
    </div>}
    {tab === 'addresses' && <AddressBook onChange={setAddresses} />}
    {tab === 'disputes' && <Panel title="Khiếu nại của tôi">{!disputes.length && <p>Chưa có khiếu nại.</p>}{disputes.map(item => <div key={idOf(item)} className="border-b py-3"><p>Đơn {idOf(item.orderId)} · {item.status}</p><p>{item.reason}: {item.description}</p>{item.resolution && <p>{item.resolution}</p>}</div>)}</Panel>}
    {tab === 'profile' && <Panel title="Thông tin tài khoản"><p>{user.name} · {user.email}</p><p>Thông tin tài khoản hiện chỉ có thể xem. Bạn có thể quản lý địa chỉ nhận hàng và hồ sơ shop riêng.</p><form className="space-y-3 max-w-lg" onSubmit={event => { event.preventDefault(); run(async () => { await authService.changePassword(passwords); await logoutUser(); }); }}><h3>Đổi mật khẩu</h3><Field label="Mật khẩu hiện tại"><input className="input-field" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={event => setPasswords({ ...passwords, currentPassword: event.target.value })} /></Field><Field label="Mật khẩu mới (ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt)"><input className="input-field" type="password" autoComplete="new-password" required minLength="8" value={passwords.newPassword} onChange={event => setPasswords({ ...passwords, newPassword: event.target.value })} /></Field><button className="btn-primary" disabled={busy}>Đổi mật khẩu và đăng xuất</button></form></Panel>}
  </div></LocalizedContent>;
}
