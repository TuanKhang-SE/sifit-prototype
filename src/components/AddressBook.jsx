import { useCallback, useEffect, useState } from 'react';
import * as addressService from '../services/addressService';
import { Panel, Field, Feedback } from './MarketplaceUI';
import { useAction } from '../hooks/useAction';
import { idOf } from '../utils/marketplace';


const empty = { label: '', recipientName: '', phone: '', addressLine: '', ward: '', district: '', province: '', addressType: 'BOTH', isDefault: false };
export default function AddressBook({ onChange }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const { busy, error, run } = useAction();
  const reload = useCallback(async () => { const data = await addressService.listAddresses(); setItems(data); onChange?.(data); }, [onChange]);
  useEffect(() => { run(reload); }, [run, reload]);
  const save = event => {
    event.preventDefault();
    run(async () => {
      if (editing) await addressService.updateAddress(editing, form);
      else await addressService.createAddress(form);
      setForm(empty); setEditing(null); await reload();
    });
  };
  return <Panel title="Sổ địa chỉ"><Feedback error={error} busy={busy} />
    {items.map(item => <div key={idOf(item)} className="border rounded-xl p-3 space-y-2">
      <p>{item.label} {item.isDefault && '· Mặc định'} · {item.addressType}</p><p>{item.recipientName} · {item.phone}</p>
      <p>{item.addressLine}, {item.ward}, {item.district}, {item.province}</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => { setEditing(idOf(item)); setForm({ ...empty, ...item }); }}>Sửa</button>
        <button disabled={busy} onClick={() => run(async () => { await addressService.deleteAddress(idOf(item)); await reload(); })}>Xóa</button>
        {!item.isDefault && <button disabled={busy} onClick={() => run(async () => { await addressService.setDefaultAddress(idOf(item)); await reload(); })}>Đặt mặc định</button>}
      </div>
    </div>)}
    <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
      {[['Nhãn địa chỉ', 'label'], ['Người nhận', 'recipientName'], ['Số điện thoại', 'phone'], ['Số nhà, tên đường', 'addressLine'], ['Phường/Xã', 'ward'], ['Quận/Huyện', 'district'], ['Tỉnh/Thành phố', 'province']].map(([label, key]) => <Field key={key} label={label}><input className="input-field" required value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></Field>)}
      <Field label="Loại địa chỉ"><select className="input-field" value={form.addressType} onChange={event => setForm({ ...form, addressType: event.target.value })}><option value="BOTH">Giao và lấy hàng</option><option value="SHIPPING">Giao hàng</option><option value="PICKUP">Lấy hàng</option></select></Field>
      <label><input type="checkbox" checked={form.isDefault} onChange={event => setForm({ ...form, isDefault: event.target.checked })} /> Địa chỉ mặc định</label>
      <button disabled={busy} className="btn-primary" type="submit">{editing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Hủy sửa</button>}
    </form>
  </Panel>;
}
