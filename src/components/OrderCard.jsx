import { useEffect, useRef, useState } from 'react';
import * as orderService from '../services/orderService';
import * as paymentService from '../services/paymentService';
import * as shippingService from '../services/shippingService';
import * as disputeService from '../services/disputeService';
import OrderDetails from './OrderDetails';
import OrderReviews from './OrderReviews';
import { Feedback, Field } from './MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { money, idOf } from '../utils/marketplace';
import '../seller-orders.css';


const statuses = { PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', PROCESSING: 'Đang chuẩn bị', SHIPPED: 'Đang vận chuyển', DELIVERED: 'Đã giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', REFUND_PENDING: 'Chờ hoàn tiền', REFUNDED: 'Đã hoàn tiền' };
export default function OrderCard({ order, seller = false, addresses = [], onChange }) {
  const { busy, error, run } = useAction();
  const [tracking, setTracking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [openedDispute, setOpenedDispute] = useState(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dispute, setDispute] = useState({ reason: 'ITEM_NOT_AS_DESCRIBED', description: '' });
  const [shipment, setShipment] = useState({ pickupAddressId: '', weightGrams: '', packageLengthCm: '', packageWidthCm: '', packageHeightCm: '' });
  const [quote, setQuote] = useState(null);
  const [shipOpen, setShipOpen] = useState(false);
  const paymentKey = useRef(crypto.randomUUID());
  const shipmentKey = useRef(crypto.randomUUID());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { setOpenedDispute(order.activeDispute || null); }, [order]);
  const paymentExpired = order.reservationExpiresAt && new Date(order.reservationExpiresAt).getTime() <= now;
  const activeDispute = order.activeDispute || openedDispute;
  const canDispute = order.disputeEligibility?.eligible && !activeDispute &&
    (order.disputeEligibility.window === 'BEFORE_DELIVERY' || new Date(order.protectionEndsAt).getTime() >= now);
  const reasonLabels = { ITEM_NOT_RECEIVED: 'Chưa nhận hàng', ITEM_NOT_AS_DESCRIBED: 'Không đúng mô tả', DAMAGED_ITEM: 'Hàng hỏng', WRONG_ITEM: 'Sai sản phẩm', OTHER: 'Khác' };
  const pay = () => run(async () => {
    setPayment(await paymentService.createPayment({ checkoutGroupId: idOf(order.checkoutGroupId), idempotencyKey: paymentKey.current }));
  });
  const refreshPayment = () => run(async () => { setPayment(await paymentService.getPayment(idOf(payment))); await onChange(); });
  return <article className={`bg-white border rounded-2xl p-5 space-y-4 ${seller ? 'seller-order-card' : 'member-order-card'}`}>
    <div className="member-order-header flex justify-between gap-3"><h3 className="font-bold">Đơn #{order._id.slice(-8)}</h3><span className="member-order-status" data-status={order.orderStatus}>{statuses[order.orderStatus] || order.orderStatus}</span></div>
    <p className="member-order-seller text-sm text-gray-500">{seller ? `Người mua: ${order.buyer?.name || order.buyer?._id}` : `Người bán: ${order.seller?.name || order.seller?._id}`}</p>
    {order.items.map(item => <div key={idOf(item.productId)} className="member-order-product flex gap-3 items-center">
      {item.image && <img src={item.image} className="w-16 h-16 object-cover rounded-xl" alt="" />}<div className="flex-1"><p>{item.title}</p><p>{money(item.price)} × {item.quantity}</p></div>
    </div>)}
    {seller ? <dl className="seller-order-finance">
      <div><dt>Tiền hàng</dt><dd>{money(order.subtotal)}</dd></div>
      <div><dt>Phí giao hàng</dt><dd>{money(order.shippingFee)}</dd></div>
      <div><dt>Tổng thanh toán</dt><dd>{money(order.totalAmount)}</dd></div>
      <div><dt>Hoa hồng ({(order.commissionRateBasisPoints || 0) / 100}%)</dt><dd>{money(order.commissionAmount)}</dd></div>
      <div className="seller-order-proceeds"><dt>Tiền người bán</dt><dd>{money(order.sellerProceeds)}</dd></div>
    </dl> : <><p>Tiền hàng: {money(order.subtotal)} · Phí giao hàng: {money(order.shippingFee)}</p><p className="member-order-total font-bold">Tổng thanh toán: {money(order.totalAmount)}</p></>}
    <p className="seller-order-payment text-sm">Thanh toán: {seller ? ({ UNPAID: 'Chưa thanh toán', PAID: 'Đã thanh toán', FAILED: 'Thất bại', REFUND_PENDING: 'Chờ hoàn tiền', REFUNDED: 'Đã hoàn tiền' }[order.paymentStatus] || order.paymentStatus) : order.paymentStatus}</p>
    <OrderDetails order={order} now={now} />
    {!seller && activeDispute && <p role="status">Khiếu nại đang xử lý: {activeDispute.status}. Xem chi tiết trong mục Khiếu nại.</p>}
    <Feedback error={error} busy={busy} />
    <div className="member-order-actions flex gap-3 flex-wrap">
      {!seller && order.orderStatus === 'PENDING_PAYMENT' && <><button disabled={busy || !!paymentExpired} onClick={pay}>Thanh toán</button><button disabled={busy} onClick={() => run(async () => { await orderService.cancelOrder(order._id); await onChange(); })}>Hủy toàn bộ đơn trong lần đặt hàng này</button></>}
      {!seller && order.orderStatus === 'DELIVERED' && !order.buyerConfirmedAt && <button disabled={busy} onClick={() => run(async () => { await orderService.confirmReceipt(order._id); await onChange(); })}>Xác nhận đã nhận hàng</button>}
      {['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus) && <button disabled={busy} onClick={() => run(async () => setTracking(await shippingService.getTracking(order._id)))}>Xem vận đơn</button>}
      {!seller && canDispute && <button disabled={busy} onClick={() => {
        setDispute({ reason: order.disputeEligibility.allowedReasons[0], description: '' }); setDisputeOpen(!disputeOpen);
      }}>Mở khiếu nại</button>}
      {seller && ['PAID', 'PROCESSING'].includes(order.orderStatus) && <button disabled={busy} onClick={() => setShipOpen(!shipOpen)}>Tạo vận đơn</button>}
    </div>
    {payment && <div className="p-3 rounded-xl bg-green-50 space-y-2"><p>Yêu cầu thanh toán: {payment.status} · {money(payment.amount)}</p>
      {payment.provider === 'simulator' ? <p>Thanh toán đang ở chế độ thử nghiệm. Đơn chỉ được xác nhận sau khi hệ thống nhận thông báo thanh toán hợp lệ.</p> : payment.paymentUrl && /^https?:\/\//i.test(payment.paymentUrl) && <a href={payment.paymentUrl} target="_blank" rel="noreferrer">Mở trang thanh toán</a>}
      <button disabled={busy} onClick={refreshPayment}>Kiểm tra thanh toán</button></div>}
    {tracking && <div className="p-3 bg-gray-50 rounded-xl"><p>Vận đơn: {tracking.trackingCode || tracking.trackingNumber || tracking.providerShipmentId}</p><p>{tracking.provider} · {tracking.status}</p>{tracking.trackingUrl && /^https?:\/\//i.test(tracking.trackingUrl) && <a href={tracking.trackingUrl} target="_blank" rel="noreferrer">Theo dõi giao hàng</a>}</div>}
    {!seller && order.orderStatus === 'COMPLETED' && <OrderReviews order={order} onOrderChange={onChange} />}
    {disputeOpen && canDispute && <form className="space-y-3" onSubmit={event => { event.preventDefault(); run(async () => {
      setOpenedDispute(await disputeService.createDispute(order._id, dispute)); setDisputeOpen(false); await onChange();
    }); }}>
      <p>{order.disputeEligibility.window === 'BEFORE_DELIVERY'
        ? 'Đơn đã thanh toán nhưng chưa được xác nhận giao. Bạn có thể báo chưa nhận hàng để admin kiểm tra.'
        : 'Đơn đang trong thời hạn bảo vệ người mua.'} Khiếu nại không tự động hoàn tiền.</p>
      <Field label="Lý do khiếu nại"><select className="input-field" value={dispute.reason} onChange={event => setDispute({ ...dispute, reason: event.target.value })}>
        {order.disputeEligibility.allowedReasons.map(reason => <option key={reason} value={reason}>{reasonLabels[reason]}</option>)}
      </select></Field>
      <textarea className="input-field" required maxLength="2000" value={dispute.description} onChange={event => setDispute({ ...dispute, description: event.target.value })} placeholder="Mô tả khiếu nại" />
      <button disabled={busy}>Gửi khiếu nại</button><button type="button" disabled={busy} onClick={() => setDisputeOpen(false)}>Hủy khiếu nại</button>
    </form>}
    {shipOpen && <form className="space-y-3" onSubmit={event => { event.preventDefault(); run(async () => {
      await shippingService.createSellerShipment(order._id, { ...shipment, idempotencyKey: shipmentKey.current }); setShipOpen(false); await onChange();
    }); }}><Field label="Địa chỉ lấy hàng"><select required className="input-field" value={shipment.pickupAddressId} onChange={event => { setShipment({ ...shipment, pickupAddressId: event.target.value }); setQuote(null); }}><option value="">Chọn địa chỉ</option>{addresses.filter(item => item.addressType !== 'SHIPPING').map(item => <option key={idOf(item)} value={idOf(item)}>{item.label} · {item.addressLine}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3">{[['Khối lượng (gram)', 'weightGrams', 30000], ['Dài (cm)', 'packageLengthCm', 200], ['Rộng (cm)', 'packageWidthCm', 200], ['Cao (cm)', 'packageHeightCm', 200]].map(([label, key, max]) => <Field key={key} label={label}><input className="input-field" type="number" required min="1" max={max} value={shipment[key]} onChange={event => { setShipment({ ...shipment, [key]: event.target.value }); setQuote(null); }} /></Field>)}</div>
      <button type="button" disabled={busy} onClick={() => run(async () => setQuote(await shippingService.quote({ ...shipment, orderId: order._id })))}>Báo giá giao hàng</button>
      {quote && <p>Phí: {money(quote.quote?.shippingFee ?? quote.shippingFee ?? quote.quote?.fee ?? quote.fee)}</p>}
      <button disabled={busy} className="btn-primary">Tạo vận đơn</button>
    </form>}
  </article>;
}
