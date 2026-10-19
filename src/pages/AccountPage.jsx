import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Panel, Field, Feedback } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import * as authService from '../services/authService';

export default function AccountPage() {
  const { user, logoutUser } = useApp();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const { busy, error, run } = useAction();
  return <div className="max-w-3xl mx-auto p-6 space-y-5"><h1 className="text-3xl font-bold">Thông tin tài khoản</h1>
    <Panel title={user.name}><p>{user.email}</p><p>Vai trò: {user.role.toUpperCase()}</p></Panel>
    <Feedback busy={busy} error={error} />
    <Panel title="Đổi mật khẩu"><form className="space-y-4" onSubmit={event => { event.preventDefault(); run(async () => { await authService.changePassword(passwords); await logoutUser(); }); }}>
      <Field label="Mật khẩu hiện tại"><input className="input-field" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} /></Field>
      <Field label="Mật khẩu mới (ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt)"><input className="input-field" type="password" autoComplete="new-password" required minLength={8} value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} /></Field>
      <button className="btn-primary" disabled={busy}>Đổi mật khẩu và đăng xuất</button>
    </form></Panel>
  </div>;
}
