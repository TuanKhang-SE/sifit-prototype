import { useCallback, useEffect, useState } from 'react';
import * as api from '../services/operationsService';
import usePagedResource from '../hooks/usePagedResource';
import { useAction } from '../hooks/useAction';
import { Feedback, Tabs } from '../components/MarketplaceUI';
import { date, shortId } from '../utils/operationFormatting';
import { Dialog, Facts, Pager, ResourceFeedback, Status } from '../components/OperationsUI';
import { useApp } from '../context/AppContext';
import { idOf, money } from '../utils/marketplace';

export default function AdminManagement({ section }) {
  const { openResource } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [type, setType] = useState('product');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const { busy, error, run } = useAction();
  const resource = usePagedResource(`/admin/${section}`, { ...(search ? { search } : {}), ...(status ? { status } : {}), ...(section === 'sellers' && verificationStatus ? { verificationStatus } : {}), ...(section === 'reviews' ? { type } : {}) });
  const mutate = action => run(async () => { await action(); resource.reload(); setSelected(null); setReason(''); setNotice('Đã cập nhật dữ liệu.'); });
  return <div className="ops-page"><h1>{section === 'sellers' ? 'Quản lý cửa hàng' : 'Kiểm duyệt đánh giá'}</h1><Feedback busy={busy} error={error} />{notice && <p role="status">{notice}</p>}
    {section === 'reviews' && <Tabs value={type} onChange={setType} items={[[ 'product', 'Đánh giá sản phẩm' ], ['seller', 'Đánh giá shop']]} />}
    {section === 'sellers' && <div className="ops-toolbar"><label>Xác minh shop<select aria-label="Xác minh shop" value={verificationStatus} onChange={e => setVerificationStatus(e.target.value)}><option value="">Tất cả</option><option value="NOT_SUBMITTED">Chưa gửi</option><option value="PENDING">Chờ duyệt</option><option value="VERIFIED">Đã xác minh</option><option value="REJECTED">Bị từ chối</option></select></label></div>}
    <div className="ops-toolbar">{section === 'sellers' && <><label>Tìm cửa hàng<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên shop hoặc slug" /></label><label>Trạng thái<select aria-label="Trạng thái cửa hàng" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option value="ACTIVE">Hoạt động</option><option value="SUSPENDED">Tạm khóa</option></select></label></>}<button onClick={resource.reload}>Làm mới danh sách</button></div>
    <ResourceFeedback resource={resource} />{resource.items.map(item => <section key={idOf(item)} className="ops-card"><h2>{section === 'sellers' ? item.shopName : `${item.rating}/5 sao · ${shortId(item)}`}</h2>
      <Facts entries={section === 'sellers' ? [['Chủ shop', item.userId?.fullName], ['Email', item.userId?.email], ['Trạng thái', <Status key="status" value={item.status} />], ['Xác minh', <Status key="status" value={item.verificationStatus} />]] : [['Trạng thái', <Status key="status" value={item.status} />], ['Ngày tạo', date(item.createdAt)], ['Nội dung', item.comment], ['Lý do kiểm duyệt', item.moderation?.reason]]} />
      <div className="ops-actions">{section === 'sellers' ? <><button disabled={busy} onClick={() => run(async () => setSelected({ ...item, detail: await api.get(`/admin/sellers/${idOf(item)}`), mode: 'detail' }))}>Chi tiết shop</button><button disabled={busy} onClick={() => { setSelected({ ...item, mode: 'status' }); setReason(''); }}>{item.status === 'SUSPENDED' ? 'Mở lại cửa hàng' : 'Tạm khóa cửa hàng'}</button></> : <><button onClick={() => openResource('REVIEW', idOf(item))}>Chi tiết đánh giá</button>{item.status !== 'REMOVED' && <button disabled={busy} onClick={() => { setSelected(item); setReason(''); }}>{item.status === 'HIDDEN' ? 'Khôi phục đánh giá' : 'Ẩn đánh giá'}</button>}</>}</div>
    </section>)}<Pager resource={resource} />
    {selected && <Dialog title={selected.mode === 'detail' ? 'Chi tiết cửa hàng' : 'Xác nhận cập nhật'} busy={busy} onClose={() => setSelected(null)}><Feedback busy={busy} error={error} />
      {selected.mode === 'detail' ? <><Facts entries={Object.entries({ 'Tên shop': selected.detail.profile.shopName, 'Mô tả': selected.detail.profile.description, 'Điện thoại': selected.detail.profile.contactPhone, 'Ngày tạo': date(selected.detail.profile.createdAt), 'Trạng thái': selected.detail.profile.status, 'Điểm shop': selected.detail.ratingSummary.ratingAverage, 'Số đánh giá': selected.detail.ratingSummary.ratingCount })} />{selected.detail.stats.map(stat => <p key={stat._id}>{stat._id}: {stat.count} đơn · {money(stat.subtotal)}</p>)}</> : <form className="ops-form" onSubmit={e => { e.preventDefault(); mutate(() => api.patch(section === 'sellers' ? `/admin/sellers/${idOf(selected)}/status` : `/admin/reviews/${idOf(selected)}/${selected.status === 'HIDDEN' ? 'restore' : 'hide'}`, section === 'sellers' ? { status: selected.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED', reason: reason.trim() } : { reason: reason.trim() })); }}>
        <p>{section === 'sellers' ? `Cập nhật cửa hàng ${selected.shopName}. Việc tạm khóa cũng khóa tài khoản chủ shop.` : `Cập nhật trạng thái đánh giá ${shortId(selected)}.`}</p><label>Lý do xử lý<textarea required maxLength="500" value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={busy}>Xác nhận cập nhật</button></form>}
    </Dialog>}
  </div>;
}

export function AdminCategories() {
  const { reloadPublicData } = useApp();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const { busy, error, run } = useAction();
  const reload = useCallback(async () => setItems((await api.get('/admin/categories')).categories), []);
  useEffect(() => { run(reload); }, [reload, run]);
  return <div className="ops-page"><h1>Quản lý danh mục</h1><Feedback busy={busy} error={error} /><div className="ops-actions"><button onClick={() => setForm({ name: '', slug: '', description: '', isActive: true })}>Thêm danh mục</button><button disabled={busy} onClick={() => run(reload)}>Làm mới danh mục</button></div>
    {items.map(item => <section className="ops-card" key={idOf(item)}><h2>{item.name}</h2><p>{item.description}</p><p>{item.slug} · {item.isActive ? 'Đang hiển thị' : 'Đã ngừng hiển thị'}</p><button onClick={() => setForm({ ...item })}>Chỉnh sửa danh mục</button></section>)}
    {form && <Dialog title={form._id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'} busy={busy} onClose={() => setForm(null)}><Feedback busy={busy} error={error} /><form className="ops-form" onSubmit={e => { e.preventDefault(); run(async () => { const body = { name: form.name.trim(), description: form.description || '', isActive: form.isActive, ...(form.slug ? { slug: form.slug } : {}) }; if (form._id) await api.patch(`/admin/categories/${form._id}`, body); else await api.post('/admin/categories', body); setForm(null); await reload(); await reloadPublicData(); }); }}>
      <label>Tên danh mục<input required maxLength="100" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Slug (chữ thường, số và dấu gạch ngang)<input pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength="120" value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} /></label><label>Mô tả<textarea maxLength="1000" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Hiển thị danh mục</label><p className="ops-note">Danh mục đang có sản phẩm sẽ được backend kiểm tra trước khi ngừng hiển thị.</p><button disabled={busy}>Lưu danh mục</button>
    </form></Dialog>}
  </div>;
}
