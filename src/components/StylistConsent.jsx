import { useState } from 'react';
import Icon from './Icon';
import LocalizedContent from './LocalizedContent';

export default function StylistConsent({ checked, onChange, disabled, tryOn = false }) {
  const [open, setOpen] = useState(false);
  return <LocalizedContent><><div className={`stylist-consent ${tryOn ? 'stylist-try-consent' : ''}`}><label className="stylist-check"><input aria-label={tryOn ? 'Đồng ý điều khoản thử đồ AI' : 'Đồng ý điều khoản xử lý ảnh'} type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)}/><span>Tôi đồng ý xử lý ảnh theo</span></label><button type="button" onClick={() => setOpen(true)}>điều khoản AI Stylist.</button></div>{open && <div className="stylist-modal-backdrop" onClick={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Điều khoản AI Stylist" className="stylist-help-modal" onClick={e => e.stopPropagation()} onKeyDown={e => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Tab') { const buttons = [...e.currentTarget.querySelectorAll('button')]; if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); } }
  }}><button className="stylist-modal-close" aria-label="Đóng điều khoản" autoFocus onClick={() => setOpen(false)}><Icon name="close"/></button><h2>Điều khoản AI Stylist</h2><p>Bạn xác nhận có quyền sử dụng ảnh đã tải lên. Ẩn mặt là tùy chọn; khi bật, hãy kiểm tra vùng làm mờ trước khi lưu.</p><p>Ảnh gốc và kết quả được lưu riêng cho tài khoản của bạn để có thể bật/tắt làm mờ mặt. Khi bật ẩn mặt, ảnh gửi tới dịch vụ AI được làm mờ trước. Khi thử đồ thật, ảnh người mẫu và trang phục được gửi đến FASHN. Khi bạn đồng ý gợi ý từ ảnh, ảnh toàn thân và số đo tùy chọn được gửi tới Gemini. Bạn có thể xóa người mẫu và kết quả đã lưu.</p><p>Ảnh AI chỉ để tham khảo. Số đo hỗ trợ hồ sơ và gợi ý, không đảm bảo kích cỡ vừa vặn.</p><button className="btn-primary" onClick={() => setOpen(false)}>Đã hiểu</button></section></div>}</></LocalizedContent>;
}
