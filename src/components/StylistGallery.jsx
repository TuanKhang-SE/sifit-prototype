import { useEffect, useState } from 'react';
import { api } from '../services/stylistApi';
import Icon from './Icon';
import LocalizedContent from './LocalizedContent';
import StylistConfirmDialog from './StylistConfirmDialog';
import { useLanguage } from '../context/LanguageContext';

export default function StylistGallery({ onView, disabled, revision, onChanged }) {
  const [album, setAlbum] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { locale } = useLanguage();
  useEffect(() => {
    let live = true; setData(null); setError('');
    api(`/stylist/history?page=${page}&album=${album}`).then(next => { if (live) setData(next); }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [album, page, revision]);
  const save = async job => {
    setBusy(true); setError('');
    try { await api(`/stylist/jobs/${job.id}/album`, { method: 'PATCH', body: JSON.stringify({ saved: !job.saved }) }); onChanged(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await api(`/stylist/jobs/${deleting.id}`, { method: 'DELETE' }); setDeleting(null); onChanged(deleting.id); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <LocalizedContent><section className="stylist-gallery stylist-card">
    <div className="stylist-card-title"><div className="stylist-wardrobe-tabs" role="tablist" aria-label="Ảnh của bạn"><button role="tab" aria-selected={!album} onClick={() => { setAlbum(false); setPage(1); }}><Icon name="history"/>Lịch sử</button><button role="tab" aria-selected={album} onClick={() => { setAlbum(true); setPage(1); }}><Icon name="photo_library"/>Album ảnh</button></div><span className="stylist-private"><Icon name="lock"/>Riêng tư</span></div>
    {error && <p role="alert" className="stylist-limit">{error}</p>}
    {!data ? <p className="stylist-hint">Đang tải ảnh…</p> : !data.jobs.length ? <p className="stylist-gallery-empty">{album ? 'Lưu những kết quả bạn thích vào album.' : 'Những lần thử đồ sẽ xuất hiện ở đây.'}</p> : <>
      <div className="stylist-gallery-grid">{data.jobs.map(job => <article key={job.id} className="stylist-gallery-item">
        <button className="stylist-gallery-preview" disabled={disabled || busy || !job.imageUrl} onClick={() => onView(job)} aria-label={`Xem ${job.productNames.join(' + ')}`}>{job.imageUrl ? <img loading="lazy" src={job.imageUrl} alt={job.productNames.join(' + ')}/> : <span>{job.status === 'failed' ? 'Không hoàn tất' : 'Đang xử lý…'}</span>}{job.mode === 'demo' && <small>DEMO</small>}</button>
        <strong>{job.productNames.join(' + ')}</strong><time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</time>
        <div className="stylist-gallery-tools">{job.status === 'completed' && <button disabled={disabled || busy} onClick={() => save(job)} aria-label={job.saved ? 'Bỏ khỏi album' : 'Lưu vào album'} aria-pressed={!!job.saved}><Icon name={job.saved ? 'bookmark_added' : 'bookmark_add'}/></button>}{job.imageUrl && <a href={job.imageUrl} download={`sifit-${job.id}.png`} aria-label="Tải ảnh"><Icon name="download"/></a>}<button disabled={disabled || busy || ['queued', 'running'].includes(job.status)} onClick={() => setDeleting(job)} aria-label="Xóa ảnh"><Icon name="delete"/></button></div>
      </article>)}</div>
      <div className="stylist-gallery-pages"><button className="btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>{page}</span><button className="btn-outline" disabled={!data.hasMore} onClick={() => setPage(page + 1)}>Tiếp</button></div>
    </>}
    {deleting && <StylistConfirmDialog title="Xóa ảnh này?" message="Ảnh sẽ bị xóa khỏi lịch sử và album." busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove}/>}
  </section></LocalizedContent>;
}
