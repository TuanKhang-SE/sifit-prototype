import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import StylistChat from '../components/StylistChat';
import LocalizedContent from '../components/LocalizedContent';
import { api, post, preparePhoto, supportsTryOn } from '../services/stylistApi';
import '../stylist.css';
import FaceMaskEditor from '../components/FaceMaskEditor';
import { detectFace, detectSavedFace } from '../services/facePrivacy';
import StylistConsent from '../components/StylistConsent';
import StylistBackgroundPicker from '../components/StylistBackgroundPicker';
import StylistRecommendations from '../components/StylistRecommendations';
import StylistMeasurements from '../components/StylistMeasurements';
import StylistGallery from '../components/StylistGallery';
import StylistConfirmDialog from '../components/StylistConfirmDialog';

const activeJob = job => ['queued', 'running'].includes(job?.status);
const equalItems = (a, b) => [...a].sort().join('|') === [...b].sort().join('|');
function PersonIllustration() {
  return <svg viewBox="0 0 180 280" role="img" aria-label="Minh họa người đứng thẳng, đủ đầu và chân" className="stylist-person"><rect x="14" y="8" width="152" height="264" rx="16" fill="none" stroke="#b9d9c9" strokeDasharray="5 6"/><circle cx="90" cy="49" r="19" fill="#c5dcd0"/><path d="M65 80 Q90 69 115 80 L120 153 L108 160 L106 241 Q99 253 91 241 L90 170 L88 241 Q80 253 73 241 L71 160 L60 153 Z" fill="#c5dcd0"/><path d="M63 85 L42 146 M116 85 L137 146" stroke="#c5dcd0" strokeWidth="16" strokeLinecap="round"/><path d="M32 23 H23 V35 M148 23 H157 V35 M23 246 V258 H35 M157 246 V258 H145" fill="none" stroke="#006c49" strokeWidth="3"/></svg>;
}
export default function AiStylist() {
  const { user, authLoading, openAuth, cart, setCart, setCartToast, browse, tryOnProductId, setTryOnProductId } = useApp();
  const [tab, setTab] = useState('tryon');
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [imageAspect, setImageAspect] = useState(2 / 3);
  const [hideFace, setHideFace] = useState(false);
  const [faceBox, setFaceBox] = useState(null);
  const [faceDetecting, setFaceDetecting] = useState(false);
  const [manualFace, setManualFace] = useState(false);
  const [privacyBox, setPrivacyBox] = useState(null);
  const [privacyPending, setPrivacyPending] = useState(null);
  const [stylePreference, setStylePreference] = useState('all');
  const [measurementsSaved, setMeasurementsSaved] = useState(false);
  const [zoom, setZoom] = useState(false);
  const detectedImages = useRef(new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const [info, setInfo] = useState({});
  const [consent, setConsent] = useState(false);
  const [tryConsent, setTryConsent] = useState(false);
  const [photoMode, setPhotoMode] = useState('original');
  const [backgroundId, setBackgroundId] = useState('white');
  const [wardrobeTab, setWardrobeTab] = useState('cart');
  const [engine, setEngine] = useState('v1.6');
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState([]);
  const [job, setJob] = useState(null);
  const [comparison, setComparison] = useState('result');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [galleryRevision, setGalleryRevision] = useState(0);
  const requestRef = useRef(null);
  const selectionOwner = useRef(null);
  const fileRef = useRef(null);
  const userId = user?._id;
  const selectionReady = !!state;
  const jobId = job?.id;
  const jobStatus = job?.status;
  const eligible = cart.filter(p => supportsTryOn(p, 'max'));
  const selectedItems = eligible.filter(p => selected.includes(p._id));
  const ids = selectedItems.map(p => p._id);
  const wholeOutfit = engine === 'outfit';
  const cost = wholeOutfit ? (selectedItems.length ? 2 : 0) : selectedItems.reduce((total, p) => total + (engine === 'max' || ['Footwear', 'Accessories'].includes(p.category) ? 2 : 1), 0);
  const processing = !!busy || activeJob(job);
  const cached = state?.jobs.find(j => j.status === 'completed' && (j.engine || 'v1.6') === engine && j.pipelineVersion === (wholeOutfit ? 'outfit-collage-v2' : 'outfits-v3') && j.quality === (engine !== 'v1.6' ? 'balanced' : 'quality') && JSON.stringify(j.inputPrivacy || null) === JSON.stringify(state.profile?.hideFace ? state.profile.faceBox : null) && equalItems(j.productIds, ids));
  const enough = (state?.quota.remaining || 0) >= cost;
  const canRegenerate = job?.status === 'completed' && (!job.modelId || job.modelId === state?.profile?.id) && (job.engine || 'v1.6') === engine && equalItems(job.productIds, ids);
  const load = useCallback(async () => { const next = await api('/stylist/state'); setState(next); setGalleryRevision(n => n + 1); return next; }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    selectionOwner.current = null;
    let remembered = [];
    try { const value = JSON.parse(sessionStorage.getItem(`sifit-tryon-selection:${userId}`) || '[]'); if (Array.isArray(value)) remembered = value.filter(id => typeof id === 'string').slice(0, 4); } catch { /* Storage is optional. */ }
    setState(null); setJob(null); setFile(null); setDraft(null); setEditing(false); setSelected([]); setError(''); setInfo({}); setTryConsent(false); setGalleryRevision(0); setEngine('v1.6');
    if (!userId) return;
    let live = true;
    api('/stylist/state').then(next => {
      if (live) {
        setState(next); setInfo(next.measurements || {}); setStylePreference(next.stylePreference || 'all'); detectedImages.current.clear(); setPrivacyBox(null);
        const latest = next.jobs.find(activeJob) || next.jobs.find(j => j.status === 'completed') || null;
        setJob(latest); if (latest?.engine) setEngine(latest.engine);
        selectionOwner.current = userId;
        setSelected(previous => previous.length ? previous : remembered.length ? remembered : latest?.productIds || []);
      }
    }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [userId]);
  useEffect(() => {
    if (!userId || selectionOwner.current !== userId) return;
    try { sessionStorage.setItem(`sifit-tryon-selection:${userId}`, JSON.stringify(selected)); } catch { /* Storage is optional. */ }
  }, [selected, userId, selectionReady]);
  useEffect(() => {
    if (tryOnProductId) { setSelected([tryOnProductId]); setTab('tryon'); setTryOnProductId(null); }
  }, [tryOnProductId, setTryOnProductId]);
  useEffect(() => {
    if (!file) { setPhotoUrl(''); return; }
    if (hideFace && !faceBox) { setPhotoUrl(''); return; }
    let live = true, url;
    preparePhoto(file, hideFace, faceBox, photoMode).then(blob => { if (live) { url = URL.createObjectURL(blob); setPhotoUrl(url); } }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [file, hideFace, faceBox, photoMode]);
  useEffect(() => {
    if (!file || !hideFace) { setFaceDetecting(false); return; }
    let live = true;
    setFaceDetecting(true); setFaceBox(null);
    detectFace(file, photoMode).then(box => {
      if (live) { setManualFace(!box); setFaceBox(box || { x: 0.435, y: 0.065, width: 0.13, height: 0.11 }); }
    }).catch(() => { if (live) { setManualFace(true); setFaceBox({ x: 0.435, y: 0.065, width: 0.13, height: 0.11 }); } })
      .finally(() => { if (live) setFaceDetecting(false); });
    return () => { live = false; };
  }, [file, hideFace, photoMode]);
  useEffect(() => {
    if (!['queued', 'running'].includes(jobStatus)) return;
    let live = true;
    const timer = setInterval(async () => {
      try {
        const next = await api(`/stylist/jobs/${jobId}`);
        if (!live) return;
        setJob(next.job); setState(prev => ({ ...prev, quota: next.quota }));
        if (!activeJob(next.job)) { clearInterval(timer); setNotice(''); if (next.job.status === 'failed') setError(next.job.error); await load(); }
      } catch (e) { if (live) { setError(e.message); clearInterval(timer); } }
    }, 1500);
    return () => { live = false; clearInterval(timer); };
  }, [jobId, jobStatus, load]);

  const chooseFile = e => {
    const next = e.target.files?.[0]; if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) || next.size > 8 * 1024 * 1024) { setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 8 MB.'); return; }
    setError(''); setDraft(null); setConsent(false); setFaceBox(null); setFile(next);
  };
  const preview = async (saveOriginal = false) => {
    if (!file || !consent || processing || faceDetecting || (hideFace && !faceBox)) return;
    setBusy(photoMode === 'original' ? 'Đang chuẩn bị ảnh…' : 'Đang tách nền…'); setError(''); setNotice('');
    try {
      const photo = await preparePhoto(file, false, null, photoMode);
      const body = new FormData(); body.append('photo', photo, 'model.png'); body.append('hideFace', String(hideFace)); body.append('faceBox', JSON.stringify(faceBox)); body.append('photoMode', photoMode); body.append('backgroundId', backgroundId); body.append('termsAccepted', String(consent));
      const result = await api('/stylist/model/preview', { method: 'POST', body });
      if (saveOriginal) { await post('/stylist/model/confirm', { id: result.draft.id }); await load(); setEditing(false); setDraft(null); setFile(null); setJob(null); setConsent(false); setNotice('Đã lưu ảnh.'); }
      else setDraft(result.draft); setState(prev => ({ ...prev, modelAttemptsLeft: result.modelAttemptsLeft }));
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const confirm = async () => {
    setBusy('Đang lưu…'); setError('');
    try { await post('/stylist/model/confirm', { id: draft.id }); await load(); setGalleryRevision(n => n + 1); setEditing(false); setDraft(null); setFile(null); setJob(null); setConsent(false); setNotice('Đã lưu người mẫu.'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const chooseBackground = async id => {
    setBackgroundId(id);
    if (!draft || draft.photoMode !== 'remove') return;
    setBusy('Đang đổi phông…'); setError('');
    try { const result = await post('/stylist/model/background', { id: draft.id, backgroundId: id }); setDraft(result.draft); }
    catch (e) { setBackgroundId(draft.backgroundId); setError(e.message); } finally { setBusy(''); }
  };
  const deleteModel = async () => {
    setBusy('Đang xóa…'); setError('');
    try { await api('/stylist/model', { method: 'DELETE' }); await load(); setDraft(null); setFile(null); setJob(null); setInfo({}); setEditing(false); setDeleteOpen(false); setGalleryRevision(n => n + 1); setNotice('Đã xóa người mẫu và ảnh thử đồ của bạn.'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const toggle = product => {
    setError(''); setNotice('');
    if (selected.includes(product._id)) { setSelected(selected.filter(id => id !== product._id)); return; }
    if (selectedItems.some(p => p.category === product.category)) { setError('Mỗi lượt chỉ chọn một món trong cùng nhóm. Bỏ chọn món cũ trước.'); return; }
    const isDress = p => /dress|đầm|váy liền/i.test(p.title) && !/skirt|chân váy/i.test(p.title);
    if ((isDress(product) && selectedItems.some(p => ['Tops', 'Bottoms'].includes(p.category))) || (['Tops', 'Bottoms'].includes(product.category) && selectedItems.some(isDress))) { setError('Váy liền không phối cùng áo hoặc quần khác trong một lượt.'); return; }
    if (selectedItems.length >= (wholeOutfit ? 4 : 3)) { setError(wholeOutfit ? 'Chọn tối đa bốn món, mỗi nhóm một món.' : 'Chọn tối đa ba món, mỗi nhóm một món.'); return; }
    setSelected([...ids, product._id]);
  };
  const tryOn = async (regenerate = false) => {
    if (processing) return;
    if (faceDetecting || privacyBox) { setError('Hoàn tất lựa chọn làm mờ mặt trước khi thử đồ.'); return; }
    if (!state?.profile || editing) { setError('Lưu ảnh của bạn trước khi thử đồ.'); return; }
    if (!info.height || !info.weight) { setError('Vui lòng nhập chiều cao và cân nặng.'); return; }
    if (!cost) { setError('Chọn ít nhất một món trong giỏ hàng.'); setWardrobeTab('cart'); return; }
    if (!wholeOutfit && selectedItems.length > 3) { setError('Chọn tối đa ba món, hoặc dùng chế độ thử nghiệm cho bốn món.'); return; }
    if (!tryConsent) { setError('Vui lòng đồng ý điều khoản thử đồ AI.'); document.querySelector('.stylist-try-consent input')?.focus(); return; }
    if (!enough && !cached) { setError('Lựa chọn này vượt hạn mức hiện tại. Chọn ít món hơn hoặc reset tài khoản để kiểm thử.'); return; }
    if (!state.ready) { setError('Chưa kết nối được dịch vụ thử đồ.'); return; }
    if (state.profile.needsUpgrade) { setError('Thay và lưu lại ảnh trước khi thử đồ.'); return; }

    setBusy('Đang gửi lượt thử…'); setError(''); setNotice(''); setComparison('result');
    const signature = `${state.profile.id}:${engine}:${ids.join('|')}:${regenerate}`;
    if (requestRef.current?.signature !== signature) requestRef.current = { signature, requestId: crypto.randomUUID() };
    try {
      const next = await post('/stylist/tryon', { engine, productIds: ids, requestId: requestRef.current.requestId, regenerate, measurements: info, termsAccepted: tryConsent }); requestRef.current = null; setJob(next.job);
      setNotice(next.cached ? 'Đã mở kết quả đã lưu.' : 'Đang thử đồ…'); await load();
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const resetDemo = async () => {
    setBusy('Đang reset…'); setError('');
    try {
      await post('/stylist/credits/reset', {});
      await load();
      setNotice('Đã reset tài khoản.');
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const creating = !state?.profile || editing;
  const completed = !creating && job?.status === 'completed';
  const archived = completed && job.modelId && job.modelId !== state.profile?.id;
  const showResult = completed && (comparison === 'result' || archived);
  const imageUrl = creating ? draft?.imageUrl || photoUrl || state?.profile?.imageUrl : showResult ? job.imageUrl : state?.profile?.imageUrl;
  const displayedRecord = showResult ? job : state?.profile;
  const displayedId = showResult ? job?.imageId : state?.profile?.id;
  const displayedHidden = !!displayedRecord?.hideFace;
  const displayedFaceBox = displayedRecord?.faceBox;
  const updateInfo = value => { setInfo(value); setMeasurementsSaved(false); };
  const saveMeasurements = async () => {
    if (!info.height || !info.weight) { setError('Vui lòng nhập chiều cao và cân nặng.'); return; }
    setBusy('Đang lưu số đo…'); setError('');
    try { const next = await api('/stylist/measurements', { method: 'PUT', body: JSON.stringify({ measurements: info, stylePreference }) }); setInfo(next.measurements); setMeasurementsSaved(true); setNotice('Đã lưu số đo và lựa chọn trang phục.'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const applyPrivacy = async (enabled, box, id = displayedId) => {
    const next = await api(`/stylist/images/${id}/privacy`, { method: 'PATCH', body: JSON.stringify({ hideFace: enabled, faceBox: box }) });
    if (next.job) setJob(previous => previous?.imageId === id ? next.job : previous);
    setState(previous => ({ ...previous, profile: next.profile })); setGalleryRevision(n => n + 1); setPrivacyBox(null);
  };
  const toggleSavedPrivacy = async enabled => {
    if (!displayedId || processing || faceDetecting) return;
    setError(''); setFaceDetecting(true); setPrivacyPending(enabled); setPrivacyBox(null);
    try {
      if (!enabled) await applyPrivacy(false, null);
      else {
        const box = await detectSavedFace(displayedId);
        if (box) { detectedImages.current.add(displayedId); await applyPrivacy(true, box); }
        else { setPrivacyBox(displayedRecord.faceBox || { x: .435, y: .065, width: .13, height: .11 }); setNotice('Chưa nhận diện được mặt. Kéo vùng làm mờ vào mặt rồi xác nhận.'); }
      }
    } catch (e) { setError(e.message); } finally { setFaceDetecting(false); setPrivacyPending(null); }
  };
  // Re-detect each completed provider image: pose and face location can shift.
  useEffect(() => {
    if (creating || !displayedId || !displayedHidden || detectedImages.current.has(displayedId) || processing) return;
    let live = true;
    detectedImages.current.add(displayedId);
    (async () => {
      try {
        const box = await detectSavedFace(displayedId);
        if (live && box) await applyPrivacy(true, box, displayedId);
        else if (live) { setPrivacyBox(displayedFaceBox || { x: .435, y: .065, width: .13, height: .11 }); setNotice('Kiểm tra vùng làm mờ trên ảnh này.'); }
      } catch { if (live) setPrivacyBox(displayedFaceBox || { x: .435, y: .065, width: .13, height: .11 }); }
    })();
    return () => { live = false; };
  }, [creating, displayedId, displayedHidden, displayedFaceBox, processing]);
  const editCurrentBackground = async () => {
    setBusy('Đang mở ảnh…'); setError('');
    try {
      const response = await fetch(`/api/stylist/images/${displayedId}?unmasked=true`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Không mở được ảnh.');
      const blob = await response.blob();
      setFile(new File([blob], 'sifit-current.png', { type: 'image/png' })); setDraft(null); setEditing(true); setPhotoMode('remove'); setBackgroundId('white'); setFaceBox(null); setHideFace(displayedHidden); setConsent(false); setPrivacyBox(null);
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const cancelPhoto = async () => {
    setBusy('Đang quay lại…');
    try { await api('/stylist/model/draft', { method: 'DELETE' }); setEditing(false); setDraft(null); setFile(null); setConsent(false); setError(''); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const saveToAlbum = async () => {
    setBusy('Đang lưu…');
    try { const next = await api(`/stylist/jobs/${job.id}/album`, { method: 'PATCH', body: JSON.stringify({ saved: !job.saved }) }); setJob(next.job); await load(); setGalleryRevision(n => n + 1); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const galleryChanged = deletedId => { setGalleryRevision(n => n + 1); if (deletedId) setJob(previous => previous?.id === deletedId ? null : previous); load().catch(e => setError(e.message)); };
  const changePhoto = () => { setEditing(true); setDraft(null); setFile(null); setFaceBox(null); setPhotoMode(state?.profile?.photoMode || 'original'); setBackgroundId(state?.profile?.backgroundId || 'white'); setHideFace(false); setConsent(false); };
  const header = <header className="stylist-header"><div><h1>AI Stylist <Icon name="auto_awesome"/></h1><p>Thử đồ trên chính bạn.</p></div><button className="stylist-help" onClick={() => setHelpOpen(true)} aria-label="Hướng dẫn chụp ảnh"><Icon name="help_outline"/><span>Hướng dẫn</span></button></header>;
  const help = helpOpen && <div className="stylist-modal-backdrop" onClick={() => setHelpOpen(false)}><section className="stylist-help-modal" role="dialog" aria-modal="true" aria-label="Hướng dẫn chụp ảnh" onClick={e => e.stopPropagation()} onKeyDown={e => {
    if (e.key === 'Escape') setHelpOpen(false);
    if (e.key === 'Tab') {
      const controls = [...e.currentTarget.querySelectorAll('button, a, input')];
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    }
  }}><button className="stylist-modal-close" autoFocus aria-label="Đóng hướng dẫn" onClick={() => setHelpOpen(false)}><Icon name="close"/></button><PersonIllustration/><h2>Ảnh đẹp, thử đồ chuẩn hơn</h2><ul><li>Chụp đủ đầu và chân, đứng thẳng.</li><li>Tay hơi tách thân, không bắt chéo chân.</li><li>Nền đơn giản, ánh sáng đều, ảnh rõ.</li><li>Mặc đồ vừa người; tránh ảnh gương.</li></ul><p>Ẩn mặt: tự nhận diện và làm mờ mặt. Có thể chỉnh tay nếu ảnh không nhận diện được. Ảnh AI chỉ để tham khảo, không xác nhận size.</p><button className="btn-primary" onClick={() => setHelpOpen(false)}>Đã hiểu</button></section></div>;
  if (authLoading) return <LocalizedContent><div className="stylist-page">{header}<p className="stylist-loading" role="status">Đang kiểm tra đăng nhập…</p>{help}</div></LocalizedContent>;
  if (!user) return <LocalizedContent><div className="stylist-page">{header}<section className="stylist-gate"><div className="stylist-gate-art"><PersonIllustration/><div className="stylist-demo-podium"/></div><div><h2>Phòng thử đồ của bạn</h2><p>Tải ảnh, chọn đồ, xem phong cách mới.</p><button className="btn-primary" onClick={() => openAuth()}><Icon name="login"/>Đăng nhập để bắt đầu</button></div></section>{help}</div></LocalizedContent>;

  return <LocalizedContent><div className="stylist-page">{header}
    <div className="stylist-nav"><div role="tablist" aria-label="Chức năng AI Stylist"><button role="tab" aria-selected={tab === 'tryon'} onClick={() => setTab('tryon')}><Icon name="checkroom"/>Phòng thử đồ</button><button role="tab" aria-selected={tab === 'chat'} onClick={() => setTab('chat')}><Icon name="chat_bubble"/>Tư vấn phối đồ</button></div>{state && <details className="stylist-quota"><summary><Icon name="bolt"/>{state.quota.remaining} credit còn lại</summary><div className="stylist-credit-count"><span>Hôm nay <b>{state.quota.dailyUsed}/5</b></span><span>Tháng này <b>{state.quota.monthlyUsed}/10</b></span></div></details>}{state?.accountResetControls && <button className="stylist-reset-account" disabled={processing} onClick={resetDemo}><Icon name="restart_alt"/>Reset credit tài khoản</button>}</div>
    {error && <div className="stylist-alert error" role="alert"><span>{error}</span><button aria-label="Đóng thông báo lỗi" onClick={() => setError('')}><Icon name="close"/></button></div>}
    {notice && <div className="stylist-alert" role="status"><span>{notice}</span><button aria-label="Đóng thông báo" onClick={() => setNotice('')}><Icon name="close"/></button></div>}
    {tab === 'chat' ? <StylistChat/> : !state ? <section className="stylist-loading"><p>Đang tải phòng thử đồ…</p><button className="btn-outline" onClick={() => load().catch(e => setError(e.message))}>Tải lại</button></section> : <>
      <div className="stylist-layout">
        <section className={`stylist-card stylist-model ${completed ? 'stylist-result' : ''}`}>
          <div className="stylist-card-title"><h2>{creating ? photoMode === 'original' ? 'Ảnh của bạn' : 'Người mẫu của bạn' : archived ? 'Ảnh từ lịch sử' : 'Phòng thử của bạn'}</h2>{completed && !archived ? <div className="stylist-comparison"><button aria-pressed={comparison === 'original'} onClick={() => setComparison('original')}>Ảnh gốc</button><button aria-pressed={comparison === 'result'} onClick={() => setComparison('result')}>Kết quả</button></div> : editing ? <button className="stylist-text-button" disabled={processing} onClick={cancelPhoto}><Icon name="arrow_back"/>Quay lại</button> : archived ? <button className="stylist-text-button" onClick={() => { setJob(state.jobs.find(j => j.status === 'completed') || null); setComparison('original'); }}><Icon name="arrow_back"/>Quay lại</button> : <span className="stylist-private"><Icon name="lock"/>Riêng tư</span>}</div>
          <div style={{ aspectRatio: imageAspect }} className={`stylist-photo ${creating ? 'stylist-upload-preview' : showResult ? 'stylist-result-photo' : 'stylist-saved-photo'}`}>
            {imageUrl ? <img src={imageUrl} onLoad={e => setImageAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} alt={creating ? draft ? 'Người mẫu chờ xác nhận' : 'Ảnh xem trước trước khi upload' : showResult ? 'Kết quả thử đồ' : 'Người mẫu của bạn đã lưu'}/> : <div className="stylist-photo-placeholder"><PersonIllustration/>{faceDetecting ? <p>Đang tìm khuôn mặt…</p> : <button className="btn-outline" disabled={processing} onClick={() => fileRef.current.click()}><Icon name="upload"/>Tải ảnh toàn thân</button>}<p className="stylist-upload-guide">Mặc áo ngắn tay và quần ngắn để lộ tay, chân. Chụp ở nơi có ánh sáng tốt, ảnh rõ toàn thân từ đầu đến chân.</p></div>}
            {creating && !draft && hideFace && faceBox && photoUrl && manualFace && <FaceMaskEditor box={faceBox} disabled={processing || faceDetecting} onChange={box => { setFaceBox(box); setConsent(false); }}/>}
            {!creating && privacyBox && <><div className="stylist-manual-blur" style={{ left: `${privacyBox.x * 100}%`, top: `${privacyBox.y * 100}%`, width: `${privacyBox.width * 100}%`, height: `${privacyBox.height * 100}%` }}/><FaceMaskEditor box={privacyBox} disabled={processing} onChange={setPrivacyBox}/></>}
            {activeJob(job) && <div className="stylist-processing" role="status"><Icon name="hourglass_top"/><strong>{`Đang thử ${job.step || 1}/${job.totalSteps || job.productIds.length}…`}</strong></div>}
            {showResult && <span className="stylist-image-tag">{job.mode === 'demo' ? 'DEMO · Chưa thay quần áo' : job.engine !== 'v1.6' ? 'FASHN Max' : 'FASHN v1.6'}</span>}
            {!creating && displayedHidden && <span className="stylist-image-tag"><Icon name="visibility_off"/>Đã ẩn mặt</span>}
          </div>
          {!creating && state.profile?.faceBaked && <p className="stylist-hint">Ảnh đã che trắng trước đây cần tải lại ảnh gốc để bật/tắt làm mờ.</p>}
          {creating ? <>
            <input ref={fileRef} id="stylist-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={processing} className="sr-only"/>
            <div className="stylist-photo-tools">{(file || editing) && <button className="stylist-text-button" disabled={processing} onClick={() => fileRef.current.click()}><Icon name="upload"/>{file ? 'Đổi ảnh' : 'Chọn ảnh mới'}</button>}<label className="stylist-check"><input type="checkbox" checked={hideFace} disabled={processing} onChange={e => { setHideFace(e.target.checked); setDraft(null); setConsent(false); }}/><Icon name="visibility_off"/>Ẩn mặt</label></div>
            <div className="stylist-photo-mode" role="group" aria-label="Xử lý phông"><button aria-pressed={photoMode === 'original'} disabled={processing} onClick={() => { setPhotoMode('original'); setDraft(null); }}>Giữ ảnh gốc</button><button aria-pressed={photoMode === 'remove'} disabled={processing} onClick={() => { setPhotoMode('remove'); setDraft(null); }}>Xóa phông</button></div>
            {photoMode === 'remove' && <StylistBackgroundPicker value={backgroundId} onChange={chooseBackground} disabled={processing}/>}
            {!draft && <StylistConsent checked={consent} onChange={setConsent} disabled={processing}/>}
            <div className="stylist-actions">{photoMode === 'original' ? <button className="btn-primary stylist-full" disabled={processing || faceDetecting || !file || !consent || (hideFace && !faceBox)} onClick={() => preview(true)}><Icon name={busy ? 'hourglass_top' : 'check'}/>{busy || 'Lưu ảnh'}</button> : draft ? <><button className="btn-outline" disabled={processing} onClick={() => preview()}><Icon name="refresh"/>Tạo lại</button><button className="btn-primary" disabled={processing} onClick={confirm}><Icon name="check"/>Lưu ảnh</button></> : <button className="btn-primary stylist-full" disabled={processing || faceDetecting || !file || !consent || (hideFace && !faceBox)} onClick={() => preview()}><Icon name={busy ? 'hourglass_top' : 'auto_awesome'}/>{busy || 'Tạo hình ảnh'}</button>}</div>

          </> : <><div className="stylist-photo-tools stylist-saved-tools"><label className="stylist-check"><input type="checkbox" checked={privacyPending ?? (displayedHidden || !!privacyBox)} disabled={processing || faceDetecting} onChange={e => toggleSavedPrivacy(e.target.checked)}/><Icon name="visibility_off"/>Ẩn mặt</label>{faceDetecting && <small role="status">Đang tìm khuôn mặt…</small>}<button className="btn-outline" disabled={processing || faceDetecting} onClick={editCurrentBackground}><Icon name="wallpaper"/>Xóa phông / Đổi nền</button><button className="stylist-text-button" aria-label="Phóng to ảnh" onClick={() => setZoom(true)}><Icon name="zoom_in"/>Phóng to</button></div>{privacyBox && <div className="stylist-actions"><button className="btn-outline" onClick={() => setPrivacyBox(null)}>Hủy</button><button className="btn-primary" disabled={processing} onClick={async () => { setBusy('Đang làm mờ…'); try { await applyPrivacy(true, privacyBox); } catch(e) { setError(e.message); } finally { setBusy(''); } }}>Xác nhận làm mờ</button></div>}<div className="stylist-model-footer"><button className="stylist-text-button" disabled={processing} onClick={changePhoto}><Icon name="edit"/>Thay ảnh</button>{completed && <button className="stylist-text-button" disabled={processing} onClick={saveToAlbum} aria-pressed={!!job.saved}><Icon name={job.saved ? 'bookmark_added' : 'bookmark_add'}/>{job.saved ? 'Đã lưu vào album' : 'Lưu vào album'}</button>}{completed && <a href={job.imageUrl} download={`sifit-${job.id}.png`}><Icon name="download"/>Lưu ảnh</a>}<button className="stylist-delete" disabled={processing} aria-label="Xóa người mẫu" onClick={() => setDeleteOpen(true)}><Icon name="delete"/></button></div></>}
        </section>
        <aside className="stylist-card stylist-wardrobe"><label className="stylist-engine-control"><span>Chất lượng thử đồ</span><select aria-label="Chất lượng thử đồ" value={engine} disabled={processing} onChange={e => setEngine(e.target.value)}><option value="v1.6">Tiêu chuẩn</option><option value="max">Chất lượng cao</option><option value="outfit">Thử nghiệm (2)</option></select></label><div className="stylist-card-title"><div className="stylist-wardrobe-tabs" role="tablist" aria-label="Trang phục"><button role="tab" aria-selected={wardrobeTab === 'cart'} onClick={() => setWardrobeTab('cart')}>Trong giỏ</button><button role="tab" aria-selected={wardrobeTab === 'suggestions'} onClick={() => setWardrobeTab('suggestions')}><Icon name="auto_awesome"/>AI gợi ý</button></div><span className="stylist-count">{eligible.length} món</span></div>

          {wardrobeTab === 'suggestions' ? <StylistRecommendations disabled={processing} measurements={info} onMeasurementsChange={updateInfo} onSaveMeasurements={saveMeasurements} measurementsSaved={measurementsSaved} gender={stylePreference} onGenderChange={value => { setStylePreference(value); setMeasurementsSaved(false); }} hasPhoto={!!state.profile && !editing} geminiReady={state.geminiReady} onChooseOutfit={items => { setCart(previous => [...previous, ...items.filter(p => !previous.some(item => item._id === p._id))]); setSelected(items.map(p => p._id)); setWardrobeTab('cart'); setCartToast({ message: 'Đã chọn bộ đồ.', id: Date.now() }); }}/> : eligible.length ? <div className="stylist-products">{eligible.map(p => <article className={`stylist-product ${selected.includes(p._id) ? 'selected' : ''}`} key={p._id}><label className="stylist-product-select"><input type="checkbox" aria-label={`Chọn ${p.title}`} checked={selected.includes(p._id)} disabled={processing} onChange={() => toggle(p)}/><img src={p.images[0]} alt={p.title}/><div><strong>{p.title}</strong><span>{p.price.toLocaleString('vi-VN')} ₫ <em>· {p.size}</em></span></div><Icon name={selected.includes(p._id) ? 'check_circle' : 'radio_button_unchecked'}/></label><button type="button" className="stylist-remove-product" disabled={processing} aria-label={`Xóa ${p.title} khỏi giỏ`} onClick={() => { setCart(previous => previous.filter(item => item._id !== p._id)); setSelected(previous => previous.filter(id => id !== p._id)); setError(''); }}><Icon name="delete"/></button></article>)}</div> : <div className="stylist-empty-cart"><Icon name="shopping_bag"/><p>Thêm vài món bạn thích để thử.</p><button className="btn-outline" onClick={() => browse({ category: 'Tops' })}>Chọn quần áo<Icon name="arrow_forward"/></button></div>}
          {wardrobeTab === 'cart' && <><StylistMeasurements value={info} onChange={updateInfo} disabled={processing} onSave={saveMeasurements} saved={measurementsSaved}/>
          {!creating && <StylistConsent checked={tryConsent} onChange={setTryConsent} disabled={processing} tryOn/>}
          <div className="stylist-try-footer"><strong>{cost ? `${ids.length} món đã chọn · ${cached ? '0' : cost} credit` : 'Chọn món để bắt đầu'}</strong><button className="btn-primary stylist-full" disabled={processing} onClick={() => tryOn()}><Icon name="auto_awesome"/>{activeJob(job) ? `Đang thử ${job.step || 1}/${job.totalSteps || job.productIds.length}…` : cached ? 'Xem lại kết quả' : 'Thử đồ với AI'}</button>{completed && canRegenerate && <button className="stylist-text-button" disabled={processing} onClick={() => tryOn(true)}><Icon name="refresh"/>{`Tạo lại (${cost} credit)`}</button>}</div>
          {wholeOutfit && <p className="stylist-hint">Ghép tối đa 4 món trong một lượt. Kiểm tra đủ các món trong ảnh kết quả.</p>}
          {state.mode === 'demo' && <p className="stylist-hint">Demo · ảnh thử chưa thay trang phục.</p>}
          {!state.ready && <p className="stylist-limit">FASHN chưa được kết nối.</p>}
          {state.profile?.needsUpgrade && <p className="stylist-limit">Thay ảnh để dùng phông trắng và ẩn mặt mới.</p>}
          {cost > 0 && !enough && !cached && <p className="stylist-limit">Lựa chọn này vượt hạn mức hiện tại.</p>}
          {activeJob(job) && <button className="stylist-text-button" onClick={() => load().then(next => setJob(next.jobs.find(j => j.id === job.id) || null)).catch(e => setError(e.message))}>Kiểm tra tiến độ</button>}
          {job?.status === 'failed' && <p className="stylist-limit">{job.error}</p>}</>}

        </aside>
      </div>
      <StylistGallery disabled={processing} revision={galleryRevision + state.jobs.filter(j => j.status === 'completed').length} onChanged={galleryChanged} onView={next => { setJob(next); setComparison('result'); if (!next.modelId || next.modelId === state.profile?.id) setSelected(next.productIds); setEditing(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}/>
    </>}{help}
    {zoom && imageUrl && <div className="stylist-modal-backdrop" onClick={() => setZoom(false)}><section className="stylist-zoom" role="dialog" aria-modal="true" aria-label="Ảnh phóng to" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') setZoom(false); if (e.key === 'Tab') { e.preventDefault(); e.currentTarget.querySelector('button')?.focus(); } }}><button autoFocus className="stylist-modal-close" aria-label="Đóng ảnh phóng to" onClick={() => setZoom(false)}><Icon name="close"/></button><img src={imageUrl} alt="Ảnh phóng to"/></section></div>}
    {deleteOpen && <StylistConfirmDialog title="Xóa người mẫu?" message="Ảnh của bạn, ảnh xem trước và toàn bộ lịch sử, album sẽ bị xóa." busy={!!busy} onCancel={() => setDeleteOpen(false)} onConfirm={deleteModel}/>}
  </div></LocalizedContent>;
}
