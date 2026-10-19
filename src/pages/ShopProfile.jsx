import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';
import ProductCard from '../components/ProductCard';
import { Feedback, Panel, Tabs } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { idOf } from '../utils/marketplace';

import * as sellerService from '../services/sellerService';
import * as reviewService from '../services/reviewService';
import { collectPages } from '../services/pagination';

export default function ShopProfile() {
  const { currentSellerId } = useApp();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('products');
  const { busy, error, run } = useAction();
  const reload = useCallback(async () => {
    const result = await collectPages(sellerService.listShops);
    const profile = result.items.find(item => idOf(item.userId) === currentSellerId);
    if (!profile) throw new Error('Người bán chưa có shop công khai hoặc shop đang tạm ngưng.');
    const [{ shop: data, products: listings }, ratings] = await Promise.all([
      sellerService.getShop(profile.shopSlug), collectPages(params => reviewService.listShopRatings(profile.shopSlug, params)),
    ]);
    setShop(data); setProducts(listings.map(product => ({ ...product, seller: { _id: idOf(data.userId), name: data.shopName } }))); setReviews(ratings.items);
  }, [currentSellerId]);
  useEffect(() => { run(reload); }, [run, reload]);
  return <LocalizedContent><div className="max-w-6xl mx-auto px-4 py-8 space-y-5"><Feedback busy={busy} error={error} />
    {error && <button disabled={busy} onClick={() => run(reload)}>Thử lại</button>}
    {shop && <><Panel title={shop.shopName}><div className="flex gap-4">{shop.avatar && <img src={shop.avatar} alt="" className="w-24 h-24 object-cover rounded-full" />}<div><p>{shop.description}</p><p>Đánh giá: {shop.ratingAverage || 0}/5 ({shop.ratingCount || 0})</p><p>{shop.verificationStatus === 'VERIFIED' ? 'Shop đã xác minh' : 'Shop chưa xác minh'}</p><p>Đã bán: {shop.totalSales || 0}</p></div></div></Panel>
      <Tabs value={tab} onChange={setTab} items={[[ 'products', 'Sản phẩm đang bán' ], ['reviews', 'Đánh giá shop']]} />
      {tab === 'products' && <><p>Hiển thị tối đa 20 sản phẩm mới nhất của shop.</p><div className="product-grid">{products.map(product => <ProductCard key={product._id} product={product} />)}</div>{!products.length && <p>Shop chưa có sản phẩm đang bán.</p>}</>}
      {tab === 'reviews' && <Panel title="Đánh giá từ người mua">{!reviews.length && <p>Chưa có đánh giá.</p>}{reviews.map(review => <div key={review._id} className="border-b py-3"><p>{review.reviewer?.name} · {review.rating}/5</p><p>{review.comment}</p></div>)}</Panel>}
    </>}
  </div></LocalizedContent>;
}
