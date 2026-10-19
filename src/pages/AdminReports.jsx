import { useEffect, useState } from 'react';
import * as api from '../services/operationsService';
import usePagedResource from '../hooks/usePagedResource';
import { useAction } from '../hooks/useAction';
import { Feedback, Tabs } from '../components/MarketplaceUI';
import { date, shortId } from '../utils/operationFormatting';
import { Dialog, Facts, Pager, ResourceFeedback } from '../components/OperationsUI';
import { idOf, money } from '../utils/marketplace';
import { getApiErrorMessage } from '../utils/errorHandler';

const metricLabels = { value: 'Giá trị', count: 'Số lượng', created: 'Đơn mới', paid: 'Đã thanh toán', completed: 'Hoàn thành', cancelled: 'Hủy', refunded: 'Hoàn tiền', newSellers: 'Shop mới', activeSellers: 'Shop hoạt động', newListings: 'Sản phẩm mới', approvedListings: 'Đã duyệt', rejectedListings: 'Bị từ chối', soldProducts: 'Đã bán', amount: 'Số tiền', commissionAmount: 'Hoa hồng' };
const seriesLabels = { gmv: 'Tổng giá trị hàng hóa', verifiedPaidAmount: 'Thanh toán xác thực', earnedCommission: 'Hoa hồng ghi nhận', pendingCommission: 'Hoa hồng chờ ghi nhận', refundedAmount: 'Yêu cầu hoàn tiền', sellerPayoutAmount: 'Chi trả người bán', series: 'Diễn biến theo thời gian', registrations: 'Đăng ký mới', sellers: 'Người bán', totals: 'Theo trạng thái', byDay: 'Hoa hồng theo ngày', byMonth: 'Hoa hồng theo tháng', bySeller: 'Hoa hồng theo người bán' };
export default function AdminReports() {
  const [tab, setTab] = useState('revenue');
  const [draft, setDraft] = useState({ startDate: '', endDate: '', groupBy: 'day' });
  const [range, setRange] = useState({ groupBy: 'day' });
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { busy, error, run } = useAction();
  useEffect(() => { const controller = new AbortController(); setResult(null); setLoading(true); setLoadError(''); api.list(`/admin/${tab === 'commissions' ? 'analytics' : 'dashboard'}/${tab}`, range, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(error => { if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [tab, range, revision]);
  return <div className="ops-page"><h1>Báo cáo & xuất dữ liệu</h1><Tabs disabled={busy} value={tab} onChange={setTab} items={[[ 'revenue', 'Doanh thu' ], ['orders', 'Đơn hàng'], ['users', 'Người dùng'], ['products', 'Sản phẩm'], ['commissions', 'Hoa hồng']]} />
    <form className="ops-toolbar" onSubmit={e => { e.preventDefault(); setRange({ ...(draft.startDate ? { startDate: `${draft.startDate}T00:00:00+07:00` } : {}), ...(draft.endDate ? { endDate: `${draft.endDate}T23:59:59.999+07:00` } : {}), groupBy: draft.groupBy }); setRevision(v => v + 1); }}><label>Từ ngày<input type="date" value={draft.startDate} max={draft.endDate || undefined} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></label><label>Đến ngày<input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label><label>Gộp theo<select aria-label="Gộp theo" value={draft.groupBy} onChange={e => setDraft({ ...draft, groupBy: e.target.value })}><option value="day">Ngày</option><option value="week">Tuần</option><option value="month">Tháng</option></select></label><button disabled={busy}>Xem báo cáo</button></form>
    <Feedback busy={busy || loading} error={error || loadError} /><p className="ops-note">Thời gian báo cáo theo Việt Nam. Xuất tối đa 5.000 bản ghi trong khoảng ngày đang áp dụng.</p><div className="ops-actions">{['orders', 'commissions', 'users'].map(type => <button key={type} disabled={busy} onClick={() => run(() => api.exportCsv(type, { ...range, limit: 5000 }))}>Xuất CSV {type === 'orders' ? 'đơn hàng' : type === 'users' ? 'người dùng' : 'hoa hồng'}</button>)}</div>
    {result && Object.entries(result).filter(([, rows]) => Array.isArray(rows)).map(([key, rows]) => <section className="ops-card" key={key}><h2>{seriesLabels[key] || key}</h2>{!rows.length ? <p>Chưa có dữ liệu trong khoảng thời gian này.</p> : <div className="ops-table-wrap"><table><thead><tr><th>Kỳ / đối tượng</th>{Object.keys(rows[0]).filter(field => field !== '_id').map(field => <th key={field}>{metricLabels[field] || field}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{typeof row._id === 'object' ? JSON.stringify(row._id) : String(row._id)}</td>{Object.keys(rows[0]).filter(field => field !== '_id').map(field => <td key={field}>{['value', 'amount', 'commissionAmount'].includes(field) && ['revenue', 'commissions'].includes(tab) ? money(row[field]) : row[field] ?? 0}</td>)}</tr>)}</tbody></table></div>}</section>)}
  </div>;
}

export function AuditLogs() {
  const [filters, setFilters] = useState({ action: '', resourceType: '', adminId: '', startDate: '', endDate: '' });
  const [applied, setApplied] = useState({});
  const [selected, setSelected] = useState(null);
  const resource = usePagedResource('/admin/audit-logs', applied);
  return <div className="ops-page"><h1>Nhật ký quản trị</h1><form className="ops-toolbar" onSubmit={e => { e.preventDefault(); setApplied(Object.fromEntries(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, key === 'startDate' ? `${value}T00:00:00+07:00` : key === 'endDate' ? `${value}T23:59:59.999+07:00` : value]))); }}>{[['action', 'Thao tác'], ['resourceType', 'Loại tài nguyên'], ['adminId', 'Mã quản trị viên'], ['startDate', 'Từ ngày'], ['endDate', 'Đến ngày']].map(([key, label]) => <label key={key}>{label}<input type={key.endsWith('Date') ? 'date' : 'text'} pattern={key === 'adminId' ? '[a-fA-F0-9]{24}' : undefined} value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })} /></label>)}<button>Lọc nhật ký</button></form><ResourceFeedback resource={resource} />
    {resource.items.map(item => <section key={idOf(item)} className="ops-card"><h2>{item.action}</h2><Facts entries={[[ 'Quản trị viên', item.adminId?.fullName || shortId(item.adminId) ], ['Thời điểm', date(item.createdAt)], ['Tài nguyên', `${item.resourceType} ${shortId(item.resourceId)}`], ['Lý do', item.reason]]} /><button onClick={() => setSelected(item)}>Xem thay đổi</button></section>)}<Pager resource={resource} />{selected && <Dialog title="Chi tiết nhật ký" onClose={() => setSelected(null)}><h3>Trước khi thay đổi</h3><pre className="ops-json">{JSON.stringify(selected.before ?? null, null, 2)}</pre><h3>Sau khi thay đổi</h3><pre className="ops-json">{JSON.stringify(selected.after ?? null, null, 2)}</pre></Dialog>}
  </div>;
}
