import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import CategoryIcon from '../components/CategoryIcon';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icon';
import hero from '../image/banner/sifitherobanner.png';
import wardrobe from '../image/banner/banner-log.jpg';

const categoryIcons = { ao: 'tops', quan: 'pants', vay: 'skirts', dam: 'dresses', 'ao-khoac': 'jackets', 'giay-dep': 'shoes', 'tui-xach': 'bags', 'phu-kien': 'allClothing' };

export default function Homepage() {
  const { browse, products, apiCategories, publicLoading, dataError } = useApp();
  const { locale } = useLanguage();
  const text = (vi, en) => locale === 'vi' ? vi : en;
  const latest = products.filter(product => product.status === 'active').slice(0, 4);
  return <div className="home-refresh">
    <section className="home-hero wide-container" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="home-kicker"><span /> THE PRE-LOVED EDIT</p>
        <h1 id="home-title">{text('Phong cách mới.', 'A fresh look.')}<br /><span>{text('Từ những điều', 'From pieces')}<br />{text('đã yêu.', 'already loved.')}</span></h1>
        <p className="home-intro">{text('Một món đồ đẹp xứng đáng có thêm hành trình. Khám phá thời trang second-hand và tìm phiên bản mang dấu ấn của riêng bạn.', 'Good clothes deserve another chapter. Discover pre-loved fashion and find the pieces that feel like you.')}</p>
        <div className="home-hero-actions"><button className="home-button" onClick={() => browse()}>{text('Khám phá tủ đồ', 'Explore the wardrobe')}<Icon name="arrow_forward" /></button><a href="#home-categories">{text('Xem danh mục', 'Shop by category')}<Icon name="south" /></a></div>
        <div className="home-hero-note"><Icon name="eco" /><span>{text('Mặc theo cách của bạn. Yêu đồ đẹp lâu hơn.', 'Wear your style. Love good clothes for longer.')}</span></div>
      </div>
      <div className="home-hero-visual">
        <img src={hero} alt={text('Gợi ý phối đồ từ bộ sưu tập thời trang Sifit', 'Fashion inspiration from the Sifit wardrobe')} fetchPriority="high" />
        <div className="home-image-label"><span>SIFIT STUDIO</span><span>EST. FOR A BETTER WARDROBE</span></div>
        <div className="home-photo-note"><span className="home-note-symbol"><Icon name="favorite" /></span><div><strong>{text('Đồ đã yêu. Phong cách riêng.', 'Pre-loved. Individually yours.')}</strong><span>{text('Một hành trình mới bắt đầu từ bạn.', 'A new chapter starts with you.')}</span></div><span className="home-note-arrow">↗</span></div>
      </div>
    </section>
    <section className="home-values wide-container" aria-label={text('Trải nghiệm mua sắm tại Sifit', 'Shopping with Sifit')}>
      {[
        ['forum', text('Kết nối trực tiếp', 'Connect directly'), text('Trò chuyện với người bán trước khi mua', 'Talk to sellers before you buy')],
        ['checkroom', text('Hiểu rõ món đồ', 'Know your piece'), text('Xem tình trạng, kích thước và mô tả', 'Explore condition, sizing and details')],
        ['verified_user', text('Bảo vệ người mua', 'Buyer protection'), text('Theo dõi đơn và gửi yêu cầu hỗ trợ', 'Track orders and request support')],
      ].map(([icon, title, description]) => <div key={icon}><Icon name={icon} /><div><h2>{title}</h2><p>{description}</p></div></div>)}
    </section>
    <section id="home-categories" className="home-section wide-container" aria-labelledby="home-category-title">
      <div className="home-section-heading"><div><p className="home-kicker">FIND YOUR NEXT FAVOURITE</p><h2 id="home-category-title">{text('Tủ đồ có gì hôm nay?', 'What’s in the wardrobe?')}</h2></div><button className="home-text-link" onClick={() => browse()}>{text('Tất cả sản phẩm', 'All pieces')}<Icon name="arrow_forward" /></button></div>
      <div className="home-category-grid">{apiCategories.map(category => <button key={category._id || category.id} onClick={() => browse({ category: category.name })}><span className="home-category-icon"><CategoryIcon category={categoryIcons[category.slug] || 'allClothing'} /></span><span>{category.name}</span><Icon name="north_east" /></button>)}</div>
      {!apiCategories.length && !publicLoading && <p className="home-empty">{text('Danh mục đang được cập nhật. Bạn có thể khám phá toàn bộ cửa hàng.', 'Categories are being updated. Explore all pieces in the shop.')}</p>}
    </section>
    <section className="home-latest" aria-labelledby="home-latest-title"><div className="wide-container home-section">
      <div className="home-section-heading"><div><p className="home-kicker">JUST ADDED TO THE WARDROBE</p><h2 id="home-latest-title">{text('Mới ghé Sifit.', 'Fresh finds at Sifit.')}</h2><p className="home-section-description">{text('Những món đồ vừa được đăng bán, sẵn sàng cho một chủ nhân mới.', 'Newly listed pieces, ready for a new owner.')}</p></div><button className="home-text-link" onClick={() => browse()}>{text('Khám phá thêm', 'Discover more')}<Icon name="arrow_forward" /></button></div>
      <div className="home-products">{latest.map(product => <ProductCard product={product} key={product._id} />)}</div>
      {publicLoading && <p className="home-empty" role="status">{text('Đang tìm những món đồ mới nhất…', 'Finding the newest pieces…')}</p>}
      {!publicLoading && !latest.length && <p className="home-empty">{dataError ? text('Chưa tải được sản phẩm. Vui lòng thử tải lại.', 'Could not load pieces. Please try again.') : text('Những món đồ mới sẽ sớm xuất hiện. Ghé lại Sifit nhé!', 'New pieces will be here soon. Visit us again!')}</p>}
    </div></section>
    <section className="home-story wide-container" aria-labelledby="home-story-title"><div className="home-story-image"><img src={wardrobe} alt={text('Cảm hứng cho một tủ đồ được yêu lâu hơn', 'Inspiration for a wardrobe loved for longer')} loading="lazy" /></div><div className="home-story-copy"><p className="home-kicker">GOOD STYLE. ANOTHER CHAPTER.</p><h2 id="home-story-title">{text('Mặc đẹp hơn.', 'More style.')}<br />{text('Tiêu dùng vừa đủ.', 'A little less excess.')}</h2><p>{text('Không cần một tủ đồ hoàn toàn mới để làm mới chính mình. Đôi khi, chỉ một món đồ đã qua sử dụng cũng đủ để bạn kể tiếp câu chuyện phong cách của riêng mình.', 'You don’t need a whole new wardrobe to feel like a new you. Sometimes, one pre-loved piece is all it takes to continue your own style story.')}</p><button className="home-text-link" onClick={() => browse({ lastChance: true })}>{text('Khám phá đồ dưới 500.000₫', 'Explore pieces under 500,000₫')}<Icon name="arrow_forward" /></button><span className="home-story-signature">Wear your style. Leave a lighter footprint.</span></div></section>
  </div>;
}
