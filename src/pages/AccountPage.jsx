import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Panel, Field, Feedback } from '../components/MarketplaceUI';
import { useAction } from '../hooks/useAction';
import * as authService from '../services/authService';
import BuyerHeading from '../components/BuyerHeading';
import Icon from '../components/Icon';

export default function AccountPage({ section = 'all' }) {
  const { user, logoutUser } = useApp();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const { busy, error, run } = useAction();
  return <div className={user.role !== 'seller' ? 'member-page member-account' : 'max-w-3xl mx-auto p-6 space-y-5'}><BuyerHeading title={section === 'profile' ? 'Thông tin cá nhân' : section === 'password' ? 'Đổi mật khẩu' : 'Thông tin tài khoản'} description={section === 'password' ? 'Cập nhật mật khẩu để bảo vệ tài khoản của bạn.' : 'Thông tin tài khoản bạn đang sử dụng tại Sifit.'} />
    {section !== 'password' && <div className="member-profile-layout"><aside className="member-identity"><span className="member-avatar">{user.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase()}</span><h2>{user.name}</h2><span className="member-badge">{user.role === 'buyer' ? 'Người mua' : user.role.toUpperCase()}</span><p>{user.email}</p></aside><Panel title="Hồ sơ tài khoản">{section === 'profile' ? <dl className="member-profile-fields"><div><dt><Icon name="person" />Họ và tên</dt><dd>{user.name}</dd></div><div><dt><Icon name="chat_bubble_outline" />Email</dt><dd>{user.email}</dd></div><div><dt><Icon name="shopping_bag" />Loại tài khoản</dt><dd>Người mua</dd></div></dl> : <><p>{user.email}</p><p>Vai trò: {user.role.toUpperCase()}</p></>}</Panel></div>}
    <Feedback busy={busy} error={error} />
    {section !== 'profile' && <div className="member-password-layout"><aside className="member-security-note"><span className="member-feature-icon"><Icon name="verified_user" /></span><h2>Bảo mật tài khoản</h2><p>Sử dụng mật khẩu riêng cho tài khoản Sifit.</p><p>Sau khi đổi mật khẩu thành công, bạn sẽ được đăng xuất để đăng nhập lại.</p></aside><Panel title="Cập nhật mật khẩu"><form className="space-y-4" onSubmit={event => { event.preventDefault(); run(async () => { await authService.changePassword(passwords); await logoutUser(); }); }}>
      <Field label="Mật khẩu hiện tại"><input className="input-field" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} /></Field>
      <Field label="Mật khẩu mới (ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt)"><input className="input-field" type="password" autoComplete="new-password" required minLength={8} value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} /></Field>
      <button className="btn-primary" disabled={busy}>Đổi mật khẩu và đăng xuất</button>
    </form></Panel></div>}
  </div>;
}
