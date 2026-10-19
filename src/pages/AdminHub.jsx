import { useCallback, useEffect, useState } from 'react';
import LocalizedContent from '../components/LocalizedContent';
import { Panel, Tabs, Feedback } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { money, idOf } from '../utils/marketplace';

import * as adminService from '../services/adminService';
import { collectPages } from '../services/pagination';
import { useApp } from '../context/AppContext';
import AdminFinance from './AdminFinance';
import AdminManagement, { AdminCategories } from './AdminManagement';
import AdminReports, { AuditLogs } from './AdminReports';
import ShipmentOperations from './ShipmentOperations';
import * as operations from '../services/operationsService';

const extendedTabs = [['sellers', 'Cửa hàng'], ['categories', 'Danh mục'], ['reviews', 'Đánh giá'], ['shipments', 'Vận chuyển'], ['finance', 'Tài chính'], ['analytics', 'Báo cáo & CSV'], ['audit', 'Nhật ký']];

export default function AdminHub() {
  const { fetchListings, openResource } = useApp();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState({});
  const [refundContext, setRefundContext] = useState(null);
  const { busy, error, run } = useAction();
  const reload = useCallback(async () => {
    if (extendedTabs.some(([key]) => key === tab)) return;
    if (tab === 'overview') { setStats(await adminService.dashboardOverview()); return; }
    const loaders = { users: adminService.listUsers, products: adminService.listProducts, orders: adminService.listOrders,
      reports: adminService.listMessageReports, verifications: adminService.listVerifications, disputes: adminService.listDisputes };
    setItems((await collectPages(loaders[tab])).items);
  }, [tab]);
  useEffect(() => { setItems([]); run(reload); }, [reload, run]);
  const act = action => run(async () => { await action(); await reload(); if (tab === 'products') await fetchListings(); });
  const note = item => <input className="input-field max-w-md" placeholder="Lý do / ghi chú xử lý" maxLength="1000" value={notes[idOf(item)] || ''} onChange={event => setNotes({ ...notes, [idOf(item)]: event.target.value })} />;
  return <LocalizedContent><div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
    <h1 className="font-heading font-bold text-3xl">Quản trị Sifit</h1>
    <Tabs disabled={busy} value={tab} onChange={setTab} items={[[ 'overview', 'Tổng quan' ], ['users', 'Người dùng'], ['products', 'Kiểm duyệt sản phẩm'], ['orders', 'Đơn hàng'], ['reports', 'Báo cáo tin nhắn'], ['verifications', 'Xác minh shop'], ['disputes', 'Khiếu nại'], ...extendedTabs]} />
    {tab === 'finance' && <AdminFinance refundContext={refundContext} clearRefundContext={() => setRefundContext(null)} />}
    {['sellers', 'reviews'].includes(tab) && <AdminManagement key={tab} section={tab} />}
    {tab === 'categories' && <AdminCategories />}
    {tab === 'shipments' && <ShipmentOperations admin />}
    {tab === 'analytics' && <AdminReports />}
    {tab === 'audit' && <AuditLogs />}
    <Feedback error={error} busy={busy} />{!extendedTabs.some(([key]) => key === tab) && <button disabled={busy} onClick={() => run(reload)}>Làm mới</button>}
    {tab === 'overview' && stats && <Panel title="Số liệu từ hệ thống"><dl className="grid sm:grid-cols-3 gap-5">{[['Người dùng', 'totalUsers'], ['Người bán', 'totalSellers'], ['Sản phẩm', 'totalProducts'], ['Chờ duyệt', 'pendingProducts'], ['Đơn hàng', 'totalOrders'], ['Hoàn thành', 'completedOrders'], ['GMV', 'grossMerchandiseValue', true], ['Hoa hồng đã ghi nhận', 'platformCommissionEarned', true], ['Hoa hồng chờ ghi nhận', 'platformCommissionPending', true], ['Chi trả chờ xử lý', 'pendingPayoutAmount', true], ['Đã chi trả', 'completedPayoutAmount', true], ['Khiếu nại đang mở', 'activeDisputes']].map(([label, key, currency]) => <div key={key}><dt>{label}</dt><dd className="text-xl font-bold">{currency ? money(stats[key]) : stats[key]}</dd></div>)}</dl></Panel>}
    {tab !== 'overview' && !extendedTabs.some(([key]) => key === tab) && !busy && !items.length && !error && <p>Chưa có dữ liệu.</p>}
    {tab === 'disputes' && items.filter(item => item.status === 'RESOLVED_BUYER').map(item => <Panel key={`refund-${idOf(item)}`} title={`Tiếp tục xử lý đơn ${idOf(item.orderId)}`}><p>Kết quả khiếu nại chưa tự động hoàn tiền. Kiểm tra giao dịch và số tiền cần hoàn.</p><button disabled={busy} onClick={() => run(async () => { const { order } = await operations.get(`/admin/orders/${idOf(item.orderId)}`); setRefundContext({ checkoutGroupId: idOf(order.checkoutGroupId), orderId: idOf(order), amount: order.buyerTotal, disputeId: idOf(item) }); setTab('finance'); })}>Xử lý hoàn tiền cho đơn này</button></Panel>)}
    {tab === 'users' && items.map(item => <Panel key={item._id} title={`${item.name} · ${item.email}`}><p>{item.role} · {item.status}</p><button onClick={() => openResource('USER', item._id)}>Chi tiết tài khoản</button>{note(item)}<button disabled={busy} onClick={() => act(() => adminService.updateUserStatus(item._id, { status: item.blocked ? 'ACTIVE' : 'SUSPENDED', reason: notes[item._id] || '' }))}>{item.blocked ? 'Mở khóa' : 'Khóa tài khoản'}</button></Panel>)}
    {tab === 'products' && items.map(item => <Panel key={item._id} title={item.title}><p>{money(item.price)} · {item.status} · Người bán: {item.seller?.name}</p><p>{item.description}</p><div className="flex gap-2 flex-wrap">{item.images.map(image => <a key={image} href={image} target="_blank" rel="noreferrer"><img src={image} alt="" className="w-24 h-24 rounded-xl object-cover" /></a>)}</div>{note(item)}<div className="flex gap-3">{item.status === 'pending' && <><button disabled={busy} onClick={() => act(() => adminService.moderateProduct(item._id, 'approve'))}>Duyệt</button><button disabled={busy} onClick={() => act(() => adminService.moderateProduct(item._id, 'reject', notes[item._id] || ''))}>Từ chối</button></>}{item.status === 'active' && <button disabled={busy} onClick={() => act(() => adminService.moderateProduct(item._id, 'hide', notes[item._id] || ''))}>Ẩn sản phẩm</button>}</div></Panel>)}
    {tab === 'orders' && items.map(item => <Panel key={item._id} title={`Đơn ${item._id}`}><p>{item.buyer?.name} → {item.seller?.name}</p><p>{item.orderStatus} · {item.paymentStatus} · {money(item.totalAmount)}</p>{item.items.map(product => <p key={idOf(product.productId)}>{product.title} · {money(product.price)}</p>)}<p>Hoa hồng: {money(item.commissionAmount)} · Tiền người bán: {money(item.sellerProceeds)}</p></Panel>)}
    {tab === 'reports' && items.map(item => <Panel key={idOf(item)} title={`Báo cáo tin nhắn · ${item.status}`}><p>Người báo cáo: {item.reporterId?.fullName}</p><p>Người bị báo cáo: {item.reportedUserId?.fullName}</p><blockquote>{item.messageId?.content}</blockquote><p>{item.reason}</p>{item.status === 'OPEN' ? <>{note(item)}<button disabled={busy} onClick={() => act(() => adminService.resolveMessageReport(idOf(item), notes[idOf(item)] || ''))}>Đánh dấu đã xử lý</button></> : <p>{item.resolutionNote}</p>}</Panel>)}
    {tab === 'verifications' && items.map(item => <Panel key={idOf(item)} title={item.sellerId?.shopName || 'Xác minh shop'}><p>{item.verificationStatus} · {item.verificationMethod}</p>{note(item)}<div className="flex gap-3"><button disabled={busy} onClick={() => act(() => adminService.reviewVerification(idOf(item), true))}>Duyệt xác minh</button><button disabled={busy} onClick={() => act(() => adminService.reviewVerification(idOf(item), false, notes[idOf(item)] || ''))}>Từ chối</button></div></Panel>)}
    {tab === 'disputes' && items.map(item => <Panel key={idOf(item)} title={`Khiếu nại đơn ${idOf(item.orderId)} · ${item.status}`}><p>{item.reason}</p><p>{item.description}</p>{['OPEN', 'UNDER_REVIEW'].includes(item.status) ? <>{note(item)}<div className="flex gap-3 flex-wrap">{item.status === 'OPEN' && <button disabled={busy} onClick={() => act(() => adminService.reviewDispute(idOf(item), notes[idOf(item)]))}>Tiếp nhận xem xét</button>}{[['RESOLVED_BUYER', 'Chấp nhận bên mua'], ['RESOLVED_SELLER', 'Chấp nhận bên bán'], ['CLOSED', 'Đóng khiếu nại']].map(([status, label]) => <button key={status} disabled={busy} onClick={() => act(() => adminService.resolveDispute(idOf(item), status, notes[idOf(item)] || ''))}>{label}</button>)}</div></> : <p>{item.resolution}</p>}</Panel>)}
  </div></LocalizedContent>;
}
