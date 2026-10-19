export function Feedback({ error, busy }) {
  return <>{error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl whitespace-pre-line">{error}</p>}{busy && <p role="status">Đang xử lý…</p>}</>;
}
export function Panel({ title, children }) {
  return <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"><h2 className="font-heading font-bold text-xl">{title}</h2>{children}</section>;
}
export function Tabs({ items, value, onChange, disabled = false }) {
  return <nav className="flex gap-2 flex-wrap" aria-label="Chức năng">{items.map(([id, label]) => <button key={id} disabled={disabled} onClick={() => onChange(id)} className={`px-4 py-2 rounded-full border cursor-pointer ${value === id ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}>{label}</button>)}</nav>;
}
export function Field({ label, children }) {
  const id = useId();
  return <div className="space-y-1 text-sm font-medium"><label className="block" htmlFor={id}>{label}</label>{cloneElement(children, { id })}</div>;
}
import { cloneElement, useId } from 'react';
