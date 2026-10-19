import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as notificationService from '../services/notificationService';
import { collectPages } from '../services/pagination';
import LocalizedContent from '../components/LocalizedContent';
import ProductCard from '../components/ProductCard';
import { Panel, Feedback } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { idOf } from '../utils/marketplace';


export function WishlistPage() {
  const { wishlist, toggleWishlist } = useApp();
  return <LocalizedContent><div className="max-w-6xl mx-auto px-4 py-8 space-y-4"><h1 className="font-heading font-bold text-3xl">Sản phẩm yêu thích</h1>{!wishlist.length && <p>Chưa có sản phẩm yêu thích.</p>}<div className="product-grid">{wishlist.map(item => item.availability === 'AVAILABLE' ? <ProductCard key={item.productId} product={item.product} /> : <div key={item.productId} className="p-4 bg-white border rounded-xl"><p>{item.title || 'Sản phẩm không còn khả dụng'}</p><p>{item.availability}</p><button onClick={() => toggleWishlist(item.product)}>Bỏ yêu thích</button></div>)}</div></div></LocalizedContent>;
}
export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [count, setCount] = useState(0);
  const { busy, error, run } = useAction();
  const reload = useCallback(async () => {
    const [result, prefs, unread] = await Promise.all([collectPages(notificationService.listNotifications), notificationService.preferences(), notificationService.unreadCount()]);
    setItems(result.items); setPreferences(prefs); setCount(unread);
  }, []);
  useEffect(() => {
    run(reload);
    const refresh = () => run(reload);
    window.addEventListener('sifit:notifications', refresh);
    return () => window.removeEventListener('sifit:notifications', refresh);
  }, [run, reload]);
  return <LocalizedContent><div className="max-w-4xl mx-auto px-4 py-8 space-y-5"><h1 className="font-heading font-bold text-3xl">Thông báo ({count} chưa đọc)</h1><Feedback busy={busy} error={error} /><div className="flex gap-3"><button disabled={busy} onClick={() => run(reload)}>Làm mới</button><button disabled={busy} onClick={() => run(async () => { await notificationService.markAllRead(); await reload(); })}>Đọc tất cả</button></div>
    {items.map(item => <Panel key={idOf(item)} title={`${item.isRead ? '' : '● '}${item.title}`}><p>{item.body}</p><p>{new Date(item.createdAt).toLocaleString('vi-VN')}</p><div className="flex gap-3">{!item.isRead && <button disabled={busy} onClick={() => run(async () => { await notificationService.markRead(idOf(item)); await reload(); })}>Đánh dấu đã đọc</button>}<button disabled={busy} onClick={() => run(async () => { await notificationService.archive(idOf(item)); await reload(); })}>Ẩn thông báo</button></div></Panel>)}
    {!items.length && !busy && <p>Chưa có thông báo.</p>}
    {preferences && <Panel title="Tùy chọn thông báo">{[['inAppEnabled', 'Thông báo trong ứng dụng'], ['messageNotifications', 'Tin nhắn'], ['orderNotifications', 'Đơn hàng'], ['productNotifications', 'Sản phẩm'], ['shippingNotifications', 'Giao hàng'], ['reviewNotifications', 'Đánh giá'], ['payoutNotifications', 'Chi trả']].map(([key, label]) => <label key={key} className="block"><input disabled={busy} type="checkbox" checked={preferences[key]} onChange={event => {
      const previous = preferences;
      const checked = event.target.checked;
      setPreferences({ ...preferences, [key]: checked });
      run(async () => {
        try { setPreferences(await notificationService.updatePreferences({ [key]: checked })); }
        catch (error) { setPreferences(previous); throw error; }
      });
    }} /> {label}</label>)}</Panel>}
  </div></LocalizedContent>;
}
