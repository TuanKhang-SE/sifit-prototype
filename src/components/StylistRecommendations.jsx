import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { post } from '../services/stylistApi';
import Icon from './Icon';
import LocalizedContent from './LocalizedContent';
import StylistMeasurements from './StylistMeasurements';

const prompts = ['Đi làm thanh lịch', 'Đi chơi thoải mái', 'Vintage', 'Dự tiệc'];
const paletteNames = { white: 'Trắng', black: 'Đen', gray: 'Xám', beige: 'Be', brown: 'Nâu', navy: 'Xanh navy', blue: 'Xanh', green: 'Xanh lá', red: 'Đỏ', pink: 'Hồng', purple: 'Tím', yellow: 'Vàng', orange: 'Cam' };
const paletteColors = { white: '#fff', black: '#252525', gray: '#93958e', beige: '#d7c6a7', brown: '#866447', navy: '#233452', blue: '#6186ad', green: '#647956', red: '#b95550', pink: '#d696ad', purple: '#a087ba', yellow: '#dfc96e', orange: '#c78c56' };
export default function StylistRecommendations({ disabled, measurements, onMeasurementsChange, onChooseOutfit, onSaveMeasurements, measurementsSaved, gender, onGenderChange, hasPhoto, geminiReady }) {
  const { cart, addToCart, setCart, setCartToast, setSelectedProduct, setCurrentView, setFilters } = useApp();
  const [prompt, setPrompt] = useState('Đi chơi thoải mái');
  const [outfits, setOutfits] = useState([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [photoConsent, setPhotoConsent] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const suggest = async (text = prompt) => {
    if (!text.trim() || working || disabled) return;
    if (!hasPhoto) { setError('Tải và lưu ảnh toàn thân trước khi dùng gợi ý đồ mặc.'); return; }
    if (!measurements.height || !measurements.weight) { setError('Vui lòng nhập chiều cao và cân nặng.'); return; }
    if (geminiReady && !photoConsent) { setError('Đồng ý dùng ảnh để AI gợi ý đồ mặc.'); return; }
    setPrompt(text); setWorking(true); setError('');
    try { const result = await post('/stylist/recommendations', { prompt: text, gender, measurements, photoConsent }); setOutfits(result.outfits); setAnalysis(result.photoAnalyzed ? result.observation : result.advisory || ''); }
    catch (e) { setError(e.message); } finally { setWorking(false); }
  };
  const addOutfit = outfit => {
    setCart(previous => [...previous, ...outfit.items.filter(p => !previous.some(item => item._id === p._id))]);
    setCartToast({ message: 'Đã thêm bộ đồ vào giỏ hàng.', id: Date.now() });
  };
  return <LocalizedContent><div className="stylist-recommendations">
    <select className="stylist-rec-gender" aria-label="Nam / Nữ" value={gender} disabled={working} onChange={e => { const next = e.target.value; onGenderChange(next); setFilters(previous => ({ ...previous, gender: next, women: false })); setOutfits([]); setAnalysis(''); }}><option value="all">Tất cả</option><option value="men">Nam</option><option value="women">Nữ</option><option value="unisex">Unisex</option></select>
    <StylistMeasurements value={measurements} onChange={onMeasurementsChange} disabled={working || disabled} onSave={onSaveMeasurements} saved={measurementsSaved}/>
    {hasPhoto && geminiReady && <label className="stylist-check stylist-photo-rec-consent"><input type="checkbox" checked={photoConsent} disabled={working || disabled} onChange={e => setPhotoConsent(e.target.checked)}/><span>Đồng ý dùng ảnh và số đo cho Sifit</span></label>}
    {!hasPhoto && <p className="stylist-rec-requirement" role="status">Tải và lưu ảnh toàn thân trước khi dùng gợi ý đồ mặc.</p>}
    <div className="stylist-style-chips">{prompts.map(text => <button key={text} disabled={working || disabled} onClick={() => setPrompt(text)}>{text}</button>)}</div>
    <form onSubmit={e => { e.preventDefault(); suggest(); }}><input aria-label="Phong cách muốn thử" value={prompt} maxLength={500} onChange={e => setPrompt(e.target.value)} placeholder="Bạn muốn mặc gì?"/><button type="submit" className="btn-primary stylist-suggest-button" disabled={working || disabled || !hasPhoto || !prompt.trim()}><Icon name="auto_awesome"/>{working ? 'Đang gợi ý…' : 'Gợi ý'}</button></form>
    {error && <p className="stylist-limit" role="alert">{error}</p>}
    {analysis && <p className="stylist-rec-analysis" role="status">{analysis}</p>}
    <div className="stylist-outfits">{outfits.map((outfit, index) => <section className="stylist-outfit" key={outfit.id}>
      <header><strong>{`Bộ ${index + 1} · ${outfit.gender === 'men' ? 'Nam' : outfit.gender === 'women' ? 'Nữ' : 'Unisex'}`}</strong><div className="stylist-palette">{outfit.palette.map(color => <span key={color} title={paletteNames[color]}><i style={{ background: paletteColors[color] }}/>{paletteNames[color]}</span>)}</div></header>
      <div className="stylist-outfit-items">{outfit.items.map(p => <article key={p._id}>
        <button className="stylist-suggestion-photo" aria-label={`Xem ${p.title}`} onClick={() => { setSelectedProduct(p); setCurrentView('detail'); }}><img src={p.images[0]} alt={p.title}/></button><strong>{p.title}</strong><span>{p.price.toLocaleString('vi-VN')} ₫</span>
        <button className="stylist-text-button" disabled={disabled || cart.some(item => item._id === p._id)} aria-label={`Thêm ${p.title}`} onClick={() => addToCart(p)}><Icon name={cart.some(item => item._id === p._id) ? 'check' : 'add_shopping_cart'}/></button>
      </article>)}</div>
      {outfit.reason && <p className="stylist-outfit-reason">{outfit.reason}</p>}
      <footer><button className="btn-outline" disabled={disabled} onClick={() => addOutfit(outfit)}>Thêm cả bộ</button><button className="btn-primary" disabled={disabled} onClick={() => onChooseOutfit(outfit.items)}>Chọn bộ để thử</button></footer>
    </section>)}</div>
    {!working && !error && !outfits.length && <p className="stylist-hint">Chọn phong cách để tìm bộ đồ phù hợp.</p>}
  </div></LocalizedContent>;
}
