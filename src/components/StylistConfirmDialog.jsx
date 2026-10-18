import { useEffect, useRef } from 'react';
import LocalizedContent from './LocalizedContent';

export default function StylistConfirmDialog({ title, message, onCancel, onConfirm, busy }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, []);
  return <LocalizedContent><div className="stylist-modal-backdrop" onClick={() => !busy && onCancel()}>
    <section className="stylist-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="stylist-confirm-title" aria-describedby="stylist-confirm-message" onClick={e => e.stopPropagation()} onKeyDown={e => {
      if (e.key === 'Escape' && !busy) onCancel();
      if (e.key === 'Tab') {
        const buttons = [...e.currentTarget.querySelectorAll('button:not(:disabled)')];
        if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); }
      }
    }}>
      <h2 id="stylist-confirm-title">{title}</h2><p id="stylist-confirm-message">{message}</p>
      <div className="stylist-actions"><button ref={cancelRef} className="btn-outline" disabled={busy} onClick={onCancel}>Quay lại</button><button className="stylist-danger-button" disabled={busy} onClick={onConfirm}>{busy ? 'Đang xóa…' : 'Xóa'}</button></div>
    </section>
  </div></LocalizedContent>;
}
