import { useApp } from '../context/AppContext';
import Icon from './Icon';
import LocalizedContent from './LocalizedContent';

export default function CartToast() {
  const { cartToast, setCartToast } = useApp();
  if (!cartToast) return null;
  return <LocalizedContent><div className="cart-toast" role="status"><Icon name="check_circle"/><span>{cartToast.message}</span><button aria-label="Đóng thông báo" onClick={() => setCartToast(null)}><Icon name="close"/></button></div></LocalizedContent>;
}
