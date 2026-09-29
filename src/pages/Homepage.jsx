import React from 'react';
import { useApp } from '../context/AppContext';

const BRANDS = [
  'NIKE',
  "LEVI'S",
  'ADIDAS',
  'ZARA',
  'CHANEL',
  'STUSSY',
  'UNIQLO',
];

const COLLECTIONS = [
  {
    label: 'STREETWEAR',
    title: 'Vintage Streetwear',
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    label: 'OUTERWEAR',
    title: 'Premium Jackets',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    label: 'TOPS & SILK',
    title: 'Luxury Essentials',
    img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80',
    span: 'md:col-span-2 md:row-span-1',
  },
];

const SHOP_CATEGORIES = [
  { label: 'Áo & Tops', icon: 'apparel', color: 'bg-rose-50 text-rose-600' },
  { label: 'Áo khoác', icon: 'checkroom', color: 'bg-amber-50 text-amber-700' },
  { label: 'Giày dép', icon: 'steps', color: 'bg-sky-50 text-sky-600' },
  { label: 'Túi & phụ kiện', icon: 'shopping_bag', color: 'bg-violet-50 text-violet-600' },
];

const SHOP_BENEFITS = [
  { icon: 'verified', title: 'Kiểm định kỹ', text: 'Mô tả đúng tình trạng' },
  { icon: 'local_shipping', title: 'Giao toàn quốc', text: 'Theo dõi đơn dễ dàng' },
  { icon: 'forum', title: 'Chat trực tiếp', text: 'Mặc cả với người bán' },
  { icon: 'payments', title: 'Thanh toán an tâm', text: 'Hỗ trợ COD' },
];

const VALUES = [
  {
    icon: 'verified_user',
    title: 'Chất lượng thẩm định',
    desc: 'Mọi sản phẩm đều được đánh giá độ mới 0–100%. Lỗi và vết xước được ghi rõ ràng và chụp ảnh thực tế.',
  },
  {
    icon: 'chat_bubble',
    title: 'Mặc cả trực tiếp',
    desc: 'Chat real-time với người bán. Chia sẻ ảnh thật, thương lượng giá ngay trên ứng dụng.',
  },
  {
    icon: 'eco',
    title: 'Thời trang bền vững',
    desc: 'Mỗi lần mua đồ cũ là một lần bạn góp phần giảm thiểu rác thải thời trang. Fashion vị lai.',
  },
];

const STEPS_BUYER = [
  {
    n: '01',
    title: 'Khám phá',
    desc: 'Lọc theo size, brand, độ mới và khoảng giá',
  },
  {
    n: '02',
    title: 'Mặc cả',
    desc: 'Chat trực tiếp với seller, xem ảnh thật',
  },
  {
    n: '03',
    title: 'Thanh toán',
    desc: 'COD hoặc VNPAY an toàn, theo dõi đơn hàng',
  },
  {
    n: '04',
    title: 'Đánh giá',
    desc: 'Nhận hàng và chia sẻ trải nghiệm',
  },
];

const STEPS_SELLER = [
  {
    n: '01',
    title: 'Chụp ảnh',
    desc: 'Ảnh thật, nhiều góc, ghi rõ lỗi nếu có',
  },
  {
    n: '02',
    title: 'Đặt giá',
    desc: 'Điền size, brand, condition và mô tả',
  },
  {
    n: '03',
    title: 'Chốt đơn',
    desc: 'Nhận tin nhắn, xác nhận và đóng gói',
  },
  {
    n: '04',
    title: 'Nhận tiền',
    desc: 'Giao hàng, nhận thanh toán trực tiếp',
  },
];

export default function Homepage() {
  const { setCurrentView, user, products, setSelectedProduct } = useApp();
  const newArrivals = products.filter(product => product.status === 'active').slice(0, 4);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setCurrentView('detail');
  };

  const goToShop = () => {
    if (user?.role === 'seller') {
      alert('Tính năng này chỉ dành cho Người Mua.');
      return;
    }

    setCurrentView('catalog');
  };

  const goToSell = () => {
    if (!user) {
      setCurrentView('auth');
      return;
    }

    if (user.role === 'seller') {
      setCurrentView('seller');
      return;
    }

    alert(
      'Bạn đang dùng tài khoản Người Mua. Hãy đăng nhập bằng tài khoản Người Bán.'
    );
  };

  return (
    <div className="animate-fade-in font-sans">
      {/* ─────────────────────────────────────────
          HERO
      ───────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/30 to-transparent" />
        <div className="absolute top-16 left-[8%] w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-12 right-[10%] w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" />

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-3xl px-6 py-14 bg-gray-900/60 backdrop-blur-2xl border border-gray-700/40 rounded-3xl shadow-2xl mx-4 animate-slide-up">
          {/* Badge */}
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-primary/90 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
            🌿 Thời trang bền vững
          </span>

          {/* HERO TITLE
              Dùng block + line-height 1.2 + padding-bottom
              để phần đuôi chữ g không bị cắt */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-sans font-extrabold tracking-tight text-white mb-6 leading-[1.2]">
            <span className="block">
              Săn Đồ Cũ Chất.
            </span>

            <span className="block bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent pb-1">
              Thời Trang Bền Vững.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-300 mb-10 font-normal leading-relaxed">
            Nơi mua bán đồ hiệu 2hand được thẩm định chất lượng, mặc cả trực
            tiếp và giao dịch an toàn.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {user?.role !== 'seller' && (
              <button
                onClick={goToShop}
                className="btn-primary"
              >
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

          <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-left">
            {[
              ['1.200+', 'Sản phẩm độc bản'],
              ['4.8/5', 'Đánh giá cộng đồng'],
              ['24h', 'Phản hồi nhanh'],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <p className="text-white font-black text-base sm:text-lg">{value}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          BRANDS
      ───────────────────────────────────────── */}
      <section className="border-y border-gray-200 py-7 bg-white">
        <p className="text-center text-[10px] text-gray-400 mb-4 tracking-[0.25em] uppercase font-semibold">
          Tập hợp các thương hiệu tuyển chọn
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60 font-sans font-bold text-lg md:text-xl tracking-widest text-gray-800">
          {BRANDS.map((brand) => (
            <span key={brand}>
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
          {SHOP_BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-center gap-3">
              <span className="material-symbols-outlined w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">{benefit.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{benefit.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-24 py-20">

        <section>
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="text-primary text-xs font-black uppercase tracking-[0.18em] mb-2">Mua sắm theo gu</p>
              <h2 className="text-2xl md:text-3xl font-heading font-black text-gray-900">Danh mục nổi bật</h2>
            </div>
            <button onClick={goToShop} className="hidden sm:flex items-center gap-1 text-sm text-primary font-bold hover:underline bg-transparent border-none cursor-pointer">
              Xem tất cả <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SHOP_CATEGORIES.map((category) => (
              <button key={category.label} onClick={goToShop} className="group bg-white border border-gray-100 hover:border-primary/25 rounded-2xl p-5 text-left shadow-sm hover:shadow-card transition-all hover:-translate-y-1 cursor-pointer">
                <span className={`material-symbols-outlined inline-flex items-center justify-center w-12 h-12 rounded-2xl text-2xl ${category.color}`}>{category.icon}</span>
                <span className="block text-sm font-bold text-gray-900 mt-4 group-hover:text-primary transition-colors">{category.label}</span>
                <span className="block text-xs text-gray-400 mt-1">Khám phá ngay</span>
              </button>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────
            COLLECTIONS
        ───────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="flex justify-between items-end gap-4">
            <h2 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-gray-900">
              Bộ Sưu Tập Độc Quyền
            </h2>

            <button
              onClick={goToShop}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer whitespace-nowrap"
            >
              Khám phá tất cả

              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[560px]">
            {COLLECTIONS.map((collection, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden bg-gray-900 rounded-3xl cursor-pointer shadow-lg min-h-[240px] ${collection.span}`}
                onClick={goToShop}
              >
                <img
                  src={collection.img}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-75"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent flex flex-col justify-end p-7">
                  <span className="text-[10px] text-white bg-white/10 backdrop-blur-sm w-max px-3 py-1.5 mb-3 font-bold uppercase tracking-[0.2em] rounded-full border border-white/20">
                    {collection.label}
                  </span>

                  <h3
                    className={`font-sans font-bold tracking-tight text-white ${
                      index === 0 ? 'text-3xl' : 'text-2xl'
                    }`}
                  >
                    {collection.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[#ee4d2d] text-xs font-black uppercase tracking-[0.18em] mb-2">Vừa lên kệ</p>
              <h2 className="text-3xl md:text-4xl font-heading font-black text-gray-900">Sản phẩm mới về</h2>
            </div>
            <button onClick={goToShop} className="text-sm text-primary font-bold hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer whitespace-nowrap">
              Xem kho hàng <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <button key={product._id} onClick={() => openProduct(product)} className="group text-left cursor-pointer bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                  <img src={product.images?.[0]} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-2 py-1 rounded-md">Mới {product.condition}%</span>
                  <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-base">arrow_outward</span>
                  </span>
                </div>
                <div className="p-2.5 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{product.brand}</p>
                  <h3 className="mt-1 text-sm font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[#ee4d2d]">{product.price.toLocaleString('vi-VN')}đ</span>
                    <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">Size {product.size}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────
            VALUE PROPS
        ───────────────────────────────────────── */}
        <section>
          <h2 className="text-3xl font-sans font-bold tracking-tight text-gray-900 text-center mb-12">
            Tại Sao Chọn Sifit?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((value, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    {value.icon}
                  </span>
                </div>

                <h3 className="font-sans font-semibold text-xl text-gray-900 mb-3">
                  {value.title}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────
            HOW IT WORKS
        ───────────────────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-12">
          {[
            {
              label: '🛍️ Dành cho Người Mua',
              steps: STEPS_BUYER,
            },
            {
              label: '🏪 Dành cho Người Bán',
              steps: STEPS_SELLER,
            },
          ].map((side, sideIndex) => (
            <div key={sideIndex}>
              <h3 className="font-sans font-semibold text-xl text-gray-900 mb-8">
                {side.label}
              </h3>

              <div className="space-y-6">
                {side.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-5 items-start"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-sans font-bold text-sm flex-shrink-0">
                      {step.n}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {step.title}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ─────────────────────────────────────────
            NEWSLETTER
        ───────────────────────────────────────── */}
        <section className="bg-gray-900 rounded-3xl p-12 text-center">
          <h2 className="font-sans font-bold tracking-tight text-3xl text-white mb-3">
            Không bỏ lỡ drop mới nhất
          </h2>

          <p className="text-gray-400 mb-8 text-sm">
            Đăng ký nhận thông báo khi có đồ vintage độc đẹp về kho.
          </p>

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
