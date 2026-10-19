import { useState } from 'react';
import * as api from '../services/operationsService';
import usePagedResource from '../hooks/usePagedResource';
import { useApp } from '../context/AppContext';
import { useAction } from '../hooks/useAction';
import { Feedback } from '../components/MarketplaceUI';
import { date, shortId, statusLabels } from '../utils/operationFormatting';
import { Dialog, Facts, Pager, ResourceFeedback, Status } from '../components/OperationsUI';
import { idOf, money } from '../utils/marketplace';

const statuses = ['PENDING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNING', 'RETURNED', 'CANCELLED'];
export function ShipmentDetails({ shipment }) {
  return <><Facts entries={[[ 'Mã vận đơn', shipment.trackingNumber ], ['Trạng thái', <Status key="status" value={shipment.status} />], ['Đơn vị vận chuyển', shipment.provider], ['Phí vận chuyển', money(shipment.shippingFee)], ['Dự kiến giao', date(shipment.estimatedDeliveryAt)], ['Ngày lấy hàng', date(shipment.pickedUpAt)], ['Ngày giao', date(shipment.deliveredAt)], ['Ngày giao thất bại', date(shipment.failedAt)], ['Khối lượng', `${shipment.weightGrams} g`], ['Kích thước', `${shipment.packageLengthCm} × ${shipment.packageWidthCm} × ${shipment.packageHeightCm} cm`]]} />{[['Lấy hàng tại', shipment.pickupAddressSnapshot], ['Giao hàng đến', shipment.deliveryAddressSnapshot]].map(([label, address]) => <section key={label}><h3>{label}</h3><p>{address?.recipientName} · {address?.phone}</p><p>{[address?.addressLine, address?.ward, address?.district, address?.province || address?.city].filter(Boolean).join(', ')}</p></section>)}{shipment.provider === 'simulator' && <p className="ops-note">Vận chuyển đang ở chế độ mô phỏng.</p>}{shipment.deliveryReviews?.length > 0 && <section><h3>Lịch sử xác minh giao hàng</h3>{shipment.deliveryReviews.map((entry, i) => <p key={i}>{date(entry.reviewedAt)} · <Status key="status" value={entry.status} /> · {entry.reason}</p>)}</section>}</>;
}
export default function ShipmentOperations({ admin = false }) {
  const { openResource } = useApp();
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState({ status: 'DELIVERED', reason: '' });
  const { busy, error, run } = useAction();
  const resource = usePagedResource(`/${admin ? 'admin' : 'seller'}/shipments`, status ? { status } : {});
  return <div className="ops-page"><h1>Quản lý vận chuyển</h1><Feedback busy={busy} error={error} /><div className="ops-toolbar"><label>Trạng thái vận chuyển<select aria-label="Trạng thái vận chuyển" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{statuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label><button onClick={resource.reload}>Làm mới vận đơn</button></div><ResourceFeedback resource={resource} />
    {resource.items.map(item => <section className="ops-card" key={idOf(item)}><h2>{item.trackingNumber}</h2><Facts entries={[[ 'Đơn hàng', shortId(item.orderId) ], ['Trạng thái', <Status key="status" value={item.status} />], ['Ngày tạo', date(item.createdAt)], ['Dự kiến giao', date(item.estimatedDeliveryAt)]]} /><div className="ops-actions"><button onClick={() => openResource('SHIPMENT', idOf(item))}>Chi tiết vận chuyển</button><button onClick={() => openResource('ORDER', idOf(item.orderId))}>Xem đơn hàng</button>{admin && !['DELIVERED', 'RETURNING', 'RETURNED', 'CANCELLED'].includes(item.status) && <button disabled={busy} onClick={() => { setSelected(item); setReview({ status: 'DELIVERED', reason: '' }); }}>Xác minh giao hàng</button>}</div></section>)}<Pager resource={resource} />
    {selected && <Dialog title="Xác minh kết quả giao hàng" busy={busy} onClose={() => setSelected(null)}><Feedback busy={busy} error={error} /><p>Vận đơn {selected.trackingNumber} · đơn {shortId(selected.orderId)}</p><p className="ops-note">Xác nhận đã giao sẽ bắt đầu thời hạn bảo vệ người mua. Chỉ xác nhận sau khi có chứng cứ giao hàng.</p><form className="ops-form" onSubmit={e => { e.preventDefault(); run(async () => { await api.post(`/admin/shipments/${idOf(selected)}/review-delivery`, review); setSelected(null); resource.reload(); }); }}><label>Kết quả<select aria-label="Kết quả giao hàng" value={review.status} onChange={e => setReview({ ...review, status: e.target.value })}><option value="DELIVERED">Đã giao</option><option value="DELIVERY_FAILED">Giao thất bại</option></select></label><label>Căn cứ xác minh<textarea required maxLength="1000" value={review.reason} onChange={e => setReview({ ...review, reason: e.target.value })} /></label><button disabled={busy}>Xác nhận kết quả giao hàng</button></form></Dialog>}
  </div>;
}
