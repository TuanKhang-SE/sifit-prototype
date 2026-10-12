import { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { useLanguage } from '../context/LanguageContext';

export default function MobileQrCode() {
  const { t } = useLanguage();
  const qr = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(`${(import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')}/?view=homepage`);
    code.make();
    const count = code.getModuleCount();
    let path = '';
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) if (code.isDark(row, col)) path += `M${col + 4},${row + 4}h1v1h-1z`;
    return { count: count + 8, path };
  }, []);
  return <svg className="mobile-qr" viewBox={`0 0 ${qr.count} ${qr.count}`} width="120" height="120" role="img" aria-label={t('qrLabel')} shapeRendering="crispEdges"><rect width={qr.count} height={qr.count} fill="white" /><path d={qr.path} fill="#17221e" /></svg>;
}
