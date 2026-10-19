import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';
export default function AiStylist() {
  const { browse } = useApp();
  return <LocalizedContent><div className="max-w-3xl mx-auto px-6 py-16 space-y-5 text-center"><h1 className="font-heading font-bold text-3xl">AI Stylist</h1><p>Trợ lý phối đồ chưa khả dụng. Bạn có thể tìm sản phẩm theo thương hiệu, kích thước và tình trạng trong danh mục.</p><button className="btn-primary" onClick={() => browse()}>Khám phá sản phẩm</button></div></LocalizedContent>;
}
