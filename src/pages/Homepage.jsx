import React from 'react';
import { useApp } from '../context/AppContext';

const BRANDS = ['NIKE', "LEVI'S", 'ADIDAS', 'ZARA', 'CHANEL', 'STUSSY', 'UNIQLO'];

const COLLECTIONS = [
  { label: 'STREETWEAR', title: 'Vintage Streetwear', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', span: 'md:col-span-2 md:row-span-2' },
  { label: 'OUTERWEAR', title: 'Premium Jackets', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', span: 'md:col-span-2 md:row-span-1' },
  { label: 'TOPS & SILK', title: 'Luxury Essentials', img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80', span: 'md:col-span-2 md:row-span-1' },
];

const VALUES = [
  { icon: 'verified_user', title: 'Chất lượng thẩm định', desc: 'Mọi sản phẩm đều được đánh giá độ mới 0–100%. Lỗi và vết xước được ghi rõ ràng và chụp ảnh thực tế.' },
  { icon: 'chat_bubble', title: 'Mặc cả trực tiếp', desc: 'Chat real-time với người bán. Chia sẻ ảnh thật, thương lượng giá ngay trên ứng dụng.' },
  { icon: 'eco', title: 'Thời trang bền vững', desc: 'Mỗi lần mua đồ cũ là một lần bạn góp phần giảm thiểu rác thải thời trang. Fashion vị lai.' },
];

const STEPS_BUYER = [
  { n: '01', title: 'Khám phá', desc: 'Lọc theo size, brand, độ mới và khoảng giá' },
  { n: '02', title: 'Mặc cả', desc: 'Chat trực tiếp với seller, xem ảnh thật' },
  { n: '03', title: 'Thanh toán', desc: 'COD hoặc VNPAY an toàn, theo dõi đơn hàng' },
  { n: '04', title: 'Đánh giá', desc: 'Nhận hàng và chia sẻ trải nghiệm' },
];
const STEPS_SELLER = [
  { n: '01', title: 'Chụp ảnh', desc: 'Ảnh thật, nhiều góc, ghi rõ lỗi nếu có' },
  { n: '02', title: 'Đặt giá', desc: 'Điền size, brand, condition và mô tả' },
  { n: '03', title: 'Chốt đơn', desc: 'Nhận tin nhắn, xác nhận và đóng gói' },
  { n: '04', title: 'Nhận tiền', desc: 'Giao hàng, nhận thanh toán trực tiếp' },
];

export default function Homepage() {
  const { setCurrentView, user } = useApp();

  const goToShop = () => {
    if (user?.role === 'seller') { alert('Tính năng này chỉ dành cho Người Mua.'); return; }
    setCurrentView('catalog');
  };

  const goToSell = () => {
    if (!user) { setCurrentView('auth'); return; }
    if (user.role === 'seller') { setCurrentView('seller'); return; }
    alert('Bạn đang dùng tài khoản Người Mua. Hãy đăng nhập bằng tài khoản Người Bán.');
  };

  return (
    <div className="animate-fade-in">
      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/30 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl px-6 py-14 bg-gray-900/60 backdrop-blur-2xl border border-gray-700/40 rounded-3xl shadow-2xl mx-4 animate-slide-up">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-primary/80 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
            🌿 Thời trang bền vững
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight text-white mb-6 leading-tight">
            Săn Đồ Cũ Chất.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Thời Trang Bền Vững.
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-10 font-light leading-relaxed">
            Nơi mua bán đồ hiệu 2hand được thẩm định chất lượng, mặc cả trực tiếp và giao dịch an toàn.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {user?.role !== 'seller' && (
              <button onClick={goToShop} className="btn-primary">
                XEM KHO HÀNG
              </button>
            )}
            <button
              onClick={goToSell}
              className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all rounded-full cursor-pointer"
            >
              ĐĂNG BÁN ĐỒ
            </button>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="border-y border-gray-200 py-7 bg-white">
        <p className="text-center text-[10px] text-gray-400 mb-4 tracking-[0.3em] uppercase font-bold">Tập hợp các thương hiệu tuyển chọn</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60 font-heading font-black text-lg md:text-xl tracking-widest text-gray-800">
          {BRANDS.map(b => <span key={b}>{b}</span>)}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-24 py-20">
        {/* ── COLLECTIONS BENTO ── */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl md:text-4xl font-heading font-black text-gray-900">Bộ Sưu Tập Độc Quyền</h2>
            <button onClick={goToShop} className="text-sm text-primary font-bold hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer">
              Khám phá tất cả <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[560px]">
            {COLLECTIONS.map((col, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden bg-gray-900 rounded-3xl cursor-pointer shadow-lg min-h-[240px] ${col.span}`}
                onClick={goToShop}
              >
                <img
                  src={col.img}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent flex flex-col justify-end p-7">
                  <span className="text-[10px] text-white bg-white/10 backdrop-blur-sm w-max px-3 py-1.5 mb-3 font-black uppercase tracking-[0.2em] rounded-full border border-white/20">
                    {col.label}
                  </span>
                  <h3 className={`font-heading font-black text-white ${i === 0 ? 'text-3xl' : 'text-2xl'}`}>{col.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── VALUE PROPS ── */}
        <section>
          <h2 className="text-3xl font-heading font-black text-gray-900 text-center mb-12">Tại Sao Chọn Sifit?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((v, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl text-primary">{v.icon}</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="grid md:grid-cols-2 gap-12">
          {[
            { label: '🛍️ Dành cho Người Mua', steps: STEPS_BUYER },
            { label: '🏪 Dành cho Người Bán', steps: STEPS_SELLER },
          ].map((side, si) => (
            <div key={si}>
              <h3 className="font-heading font-bold text-xl text-gray-900 mb-8">{side.label}</h3>
              <div className="space-y-6">
                {side.steps.map((step, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-heading font-black text-sm flex-shrink-0">
                      {step.n}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── NEWSLETTER ── */}
        <section className="bg-gray-900 rounded-3xl p-12 text-center">
          <h2 className="font-heading font-black text-3xl text-white mb-3">Không bỏ lỡ drop mới nhất</h2>
          <p className="text-gray-400 mb-8 text-sm">Đăng ký nhận thông báo khi có đồ vintage độc đẹp về kho.</p>
          <div className="flex max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-full px-5 py-3 outline-none focus:border-primary/60 transition-all text-sm"
            />
            <button className="btn-primary whitespace-nowrap">
              Đăng ký
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
