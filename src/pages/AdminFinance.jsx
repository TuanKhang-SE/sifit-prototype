import { useEffect, useRef, useState } from 'react';
import * as api from '../services/operationsService';
import usePagedResource from '../hooks/usePagedResource';
import { useAction } from '../hooks/useAction';
import { Feedback, Tabs } from '../components/MarketplaceUI';
import { date, shortId, statusLabels } from '../utils/operationFormatting';
import { Dialog, Facts, Pager, PayoutDetails, ResourceFeedback, Status } from '../components/OperationsUI';
import { useApp } from '../context/AppContext';
import { money, idOf } from '../utils/marketplace';

const choices = {
  payments: ['INITIATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  commissions: ['PENDING', 'RECOGNIZED', 'REVERSED'], payouts: ['PENDING', 'ELIGIBLE', 'APPROVED', 'PAID', 'FAILED'],
};
export default function AdminFinance({ refundContext, clearRefundContext }) {
  const { openResource } = useApp();
  const [tab, setTab] = useState('payments');
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refund, setRefund] = useState({ amount: '', reason: '' });
  const [reviewRefund, setReviewRefund] = useState(false);
  const [approve, setApprove] = useState(null);
  const [notice, setNotice] = useState('');
  const attempt = useRef(null);
  const { busy, error, run } = useAction();
  const resource = usePagedResource(tab === 'summary' ? null : `/admin/${tab}`, {
    ...(status ? { status } : {}), ...(tab === 'payments' && refundContext ? { checkoutGroupId: refundContext.checkoutGroupId } : {}),
  });
  useEffect(() => { if (refundContext) { setTab('payments'); setStatus(''); } }, [refundContext]);
  useEffect(() => {
    if (tab === 'summary') run(async () => setSummary(await api.get('/admin/financial-summary')));
  }, [tab, run]);
  const remaining = selected ? Math.max(0, selected.amount - (selected.refundedAmount || 0)) : 0;
  const maxRefund = refundContext ? Math.min(remaining, refundContext.amount) : remaining;
  return <div className="ops-page"><h1>Tài chính & đối soát</h1>
    <Tabs disabled={busy} value={tab} onChange={value => { setStatus(''); setTab(value); setSelected(null); }} items={[
      ['payments', 'Giao dịch thanh toán'], ['commissions', 'Hoa hồng'], ['payouts', 'Chi trả người bán'], ['summary', 'Tổng hợp tài chính'],
    ]} />
    <Feedback busy={busy} error={error} />{notice && <p role="status" className="ops-success">{notice}</p>}
    {refundContext && <div className="ops-card"><p>Đang xử lý khiếu nại cho đơn {shortId(refundContext.orderId)}. Tổng tiền của đơn: <strong>{money(refundContext.amount)}</strong>.</p><p>Một giao dịch có thể thanh toán nhiều đơn. Chỉ yêu cầu hoàn số tiền phù hợp với đơn đang được xử lý.</p><div className="ops-actions"><button onClick={clearRefundContext}>Xem tất cả giao dịch</button></div></div>}
    {tab !== 'summary' && <><div className="ops-toolbar"><label>Lọc trạng thái<select aria-label="Trạng thái tài chính" value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả</option>{choices[tab].map(value => <option key={value} value={value}>{statusLabels[value] || value}</option>)}</select></label><button onClick={resource.reload}>Làm mới tài chính</button></div><ResourceFeedback resource={resource} />
      {resource.items.map(item => <section className="ops-card" key={idOf(item)}>
        <h2>{tab === 'payments' ? 'Giao dịch' : tab === 'commissions' ? 'Hoa hồng' : 'Chi trả'} {shortId(item)}</h2>
        <Facts entries={[
          ['Số tiền', money(tab === 'commissions' ? item.commissionAmount : item.amount)], ['Trạng thái', <Status key="status" value={item.status} />],
          ['Ngày tạo', date(item.createdAt)], ['Nhà cung cấp', item.provider || '—'],
          ...(tab === 'payments' ? [['Đã yêu cầu hoàn', money(item.refundedAmount || 0)], ['Còn có thể yêu cầu hoàn', money(Math.max(0, item.amount - (item.refundedAmount || 0)))], ['Nhóm thanh toán', idOf(item.checkoutGroupId)], ['Người mua', idOf(item.buyerId)]] : []),
          ...(tab === 'commissions' ? [['Tiền người bán', money(item.sellerProceeds)], ['Tỷ lệ tại thời điểm đặt hàng', `${(item.rateBasisPoints ?? item.commissionRateBasisPoints ?? 0) / 100}%`]] : []),
        ]} />
        <div className="ops-actions">
          {tab === 'payments' && <button onClick={() => openResource('PAYMENT', idOf(item))}>Chi tiết giao dịch</button>}
          {item.orderId && <button onClick={() => openResource('ORDER', idOf(item.orderId))}>Xem đơn liên quan</button>}
          {tab === 'payments' && ['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(item.status) && item.amount > (item.refundedAmount || 0) && <button className="ops-danger" disabled={busy} onClick={() => { attempt.current = null; setReviewRefund(false); setRefund({ amount: Math.min(item.amount - (item.refundedAmount || 0), refundContext?.amount ?? Infinity), reason: refundContext ? `Xử lý khiếu nại đơn ${refundContext.orderId}` : '' }); setSelected(item); }}>Tạo yêu cầu hoàn tiền</button>}
          {tab === 'payouts' && <><button disabled={busy} onClick={() => run(async () => setSelected((await api.get(`/admin/payouts/${idOf(item)}`)).payout))}>Chi tiết chi trả</button>{['PENDING', 'ELIGIBLE'].includes(item.status) && <button disabled={busy} onClick={() => setApprove(item)}>Duyệt chi trả</button>}</>}
        </div>
      </section>)}<Pager resource={resource} /></>}
    {tab === 'summary' && summary && <><section className="ops-card"><h2>Thanh toán theo trạng thái</h2>{summary.payments.map(item => <p key={item._id}><Status key="status" value={item._id} /> · {item.count} giao dịch · {money(item.amount)}</p>)}</section><section className="ops-card"><h2>Hoa hồng theo trạng thái</h2>{summary.commissions.map(item => <p key={item._id}><Status key="status" value={item._id} /> · {item.count} khoản · {money(item.commissionAmount)}</p>)}<p>Số bút toán đối soát: {summary.ledgerEntries}</p></section></>}
    {selected && tab === 'payments' && <Dialog title="Yêu cầu hoàn tiền giao dịch" busy={busy} onClose={() => setSelected(null)}><Feedback busy={busy} error={error} />
      <Facts entries={[[ 'Giao dịch', idOf(selected) ], ['Giá trị giao dịch', money(selected.amount)], ['Còn được yêu cầu hoàn', money(remaining)], ['Nhà cung cấp', selected.provider]]} />
      {selected.provider === 'simulator' && <p className="ops-note">Giao dịch đang sử dụng nhà cung cấp mô phỏng.</p>}
      {!reviewRefund ? <form className="ops-form" onSubmit={event => { event.preventDefault(); setReviewRefund(true); }}><label>Số tiền yêu cầu hoàn (VND)<input type="number" min="1" max={maxRefund} step="1" required value={refund.amount} onChange={event => setRefund({ ...refund, amount: event.target.value })} /></label><label>Lý do hoàn tiền<textarea required maxLength="500" value={refund.reason} onChange={event => setRefund({ ...refund, reason: event.target.value })} /></label><button disabled={busy}>Kiểm tra yêu cầu hoàn</button></form>
        : <div className="ops-form"><p>Bạn sắp yêu cầu hoàn <strong>{money(Number(refund.amount))}</strong> cho giao dịch {shortId(selected)}.</p><p>{refund.reason}</p><p>Hệ thống chỉ ghi nhận yêu cầu và trạng thái từ nhà cung cấp; việc gửi yêu cầu chưa đồng nghĩa người mua đã nhận được tiền.</p><div className="ops-actions"><button disabled={busy} onClick={() => setReviewRefund(false)}>Chỉnh sửa yêu cầu</button><button className="ops-danger" disabled={busy} onClick={() => run(async () => {
          const body = { paymentId: idOf(selected), amount: Number(refund.amount), reason: refund.reason.trim() };
          const fingerprint = JSON.stringify(body);
          if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
          const result = await api.post('/admin/refunds', { ...body, idempotencyKey: attempt.current.key });
          setNotice(`Đã ghi nhận yêu cầu hoàn ${money(result.refund.amount)}. Trạng thái: ${result.refund.status}.`); setSelected(null); resource.reload();
        })}>Xác nhận hoàn tiền</button></div></div>}
    </Dialog>}
    {selected && tab === 'payouts' && <Dialog title="Chi tiết đợt chi trả" onClose={() => setSelected(null)}><PayoutDetails payout={selected} openResource={openResource} /></Dialog>}
    {approve && <Dialog title="Xác nhận duyệt chi trả" busy={busy} onClose={() => setApprove(null)}><Feedback busy={busy} error={error} /><Facts entries={[[ 'Mã đợt chi trả', idOf(approve) ], ['Số tiền', money(approve.amount)], ['Số đơn hàng', approve.orderIds?.length || 0], ['Trạng thái', <Status key="status" value={approve.status} />]]} /><p className="ops-note">Sau khi duyệt, hệ thống chi trả sẽ xử lý theo điều kiện và nhà cung cấp đã cấu hình.</p><div className="ops-actions"><button disabled={busy} onClick={() => run(async () => { await api.post(`/admin/payouts/${idOf(approve)}/approve`); setApprove(null); setNotice('Đã duyệt đợt chi trả.'); resource.reload(); })}>Xác nhận duyệt chi trả</button></div></Dialog>}
  </div>;
}
