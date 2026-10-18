import { useRef } from 'react';
import Icon from './Icon';
import { clampFaceBox } from '../services/facePrivacy';
import LocalizedContent from './LocalizedContent';

export default function FaceMaskEditor({ box, onChange, disabled }) {
  const drag = useRef(null);
  const move = event => {
    if (!drag.current || disabled) return;
    const { startX, startY, bounds, initial } = drag.current;
    onChange(clampFaceBox({ ...initial, x: initial.x + (event.clientX - startX) / bounds.width, y: initial.y + (event.clientY - startY) / bounds.height }));
  };
  const resize = factor => {
    const width = box.width * factor, height = box.height * factor;
    onChange(clampFaceBox({ x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }));
  };
  return <LocalizedContent><>
    <button type="button" className="face-mask-handle" aria-label="Di chuyển vùng ẩn mặt" disabled={disabled}
      style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { startX: event.clientX, startY: event.clientY, bounds: event.currentTarget.parentElement.getBoundingClientRect(), initial: box }; }}
      onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={event => { const directions = { ArrowLeft: [-0.01, 0], ArrowRight: [0.01, 0], ArrowUp: [0, -0.01], ArrowDown: [0, 0.01] }; if (directions[event.key]) { event.preventDefault(); const [x, y] = directions[event.key]; onChange(clampFaceBox({ ...box, x: box.x + x, y: box.y + y })); } }} />
    <div className="face-mask-tools"><span>Kéo vùng che vào mặt</span><button aria-label="Thu nhỏ vùng ẩn mặt" disabled={disabled} onClick={() => resize(0.9)}><Icon name="remove"/></button><button aria-label="Phóng to vùng ẩn mặt" disabled={disabled} onClick={() => resize(1.1)}><Icon name="add"/></button></div>
  </></LocalizedContent>;
}
