import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const REASON_LABELS = {
  fake_product: 'Hàng giả / Không đúng hàng hiệu',
  offensive_content: 'Nội dung phản cảm / vi phạm',
  scam: 'Lừa đảo / Gian lận',
  wrong_category: 'Đăng sai danh mục',
  other: 'Lý do khác',
};

export default function ReportModal({ isOpen, onClose }) {
  const { addReport } = useApp();
  const [reason, setReason] = useState('fake_product');
  const [details, setDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    addReport(reason, details);
    setReason('fake_product');
    setDetails('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-black text-xl text-gray-900">Báo Cáo Vi Phạm</h3>
            <p className="text-sm text-gray-500 mt-1">Giúp cộng đồng Sifit trong sạch hơn.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Lý do báo cáo</label>
            <div className="space-y-2">
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả thêm (tùy chọn)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cho chúng tôi biết thêm chi tiết về vi phạm này..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(0,108,73,0.08)] resize-none transition-all bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Hủy
            </button>
            <button type="submit" className="flex-1 py-3 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer">
              Gửi Báo Cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
