import LocalizedContent from './LocalizedContent';
export default function ReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return <LocalizedContent><div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><section role="dialog" aria-modal="true" aria-label="Báo cáo sản phẩm" className="bg-white p-6 rounded-2xl max-w-md space-y-4"><h2 className="font-bold text-xl">Báo cáo sản phẩm chưa khả dụng</h2><p>Bạn có thể báo cáo tin nhắn trong hộp thư hoặc mở khiếu nại từ đơn mua nếu có vấn đề với giao dịch.</p><button className="btn-primary" onClick={onClose}>Đóng</button></section></div></LocalizedContent>;
}
