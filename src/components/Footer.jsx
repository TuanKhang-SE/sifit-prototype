import React from 'react';

const footerLinks = {
  'Mua sắm': ['Hàng mới về', 'Sản phẩm nổi bật', 'Thương hiệu', 'Cẩm nang phối đồ'],
  'Hỗ trợ': ['Trung tâm trợ giúp', 'Hướng dẫn mua hàng', 'Chính sách đổi trả', 'Liên hệ Sifit'],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          <div>
            <span className="font-heading font-black text-2xl text-white">Sifit<span className="text-primary-light">.</span></span>
            <p className="text-sm leading-relaxed mt-3 max-w-xs">Nơi những món đồ có câu chuyện riêng tìm được chủ nhân mới.</p>
            <div className="flex gap-2 mt-5">
              {['facebook', 'photo_camera', 'alternate_email'].map(icon => (
                <span key={icon} className="material-symbols-outlined w-8 h-8 rounded-full bg-white/10 hover:bg-primary hover:text-white transition-colors flex items-center justify-center text-sm cursor-pointer">{icon}</span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-bold text-white mb-4">{heading}</p>
              <div className="space-y-2.5 text-sm">
                {links.map(item => (
                  <button key={item} className="block hover:text-primary-light transition-colors bg-transparent border-none cursor-pointer text-gray-400 p-0">{item}</button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-sm font-bold text-white mb-4">Mua sắm an tâm</p>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-primary-light text-base">verified</span> Kiểm định tình trạng</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-primary-light text-base">local_shipping</span> Giao hàng toàn quốc</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-primary-light text-base">shield</span> Giao dịch minh bạch</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2025 Sifit. Sustainable fashion starts here.</p>
          <div className="flex gap-5">
            {['Điều khoản', 'Bảo mật', 'Quy chế hoạt động'].map(item => (
              <button key={item} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-gray-400 p-0">{item}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
