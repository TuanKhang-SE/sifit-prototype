import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const { loginUser, registerUser, goBack } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      let res;
      if (isLogin) {
        res = loginUser(form.email, form.password);
      } else {
        res = registerUser(form.name, form.email, form.password, form.role);
      }
      setLoading(false);
      if (!res.success) setError(res.message);
    }, 600);
  };

  const QUICK_LOGINS = [
    { label: '🛍️ Đăng nhập Buyer', email: 'buyer@sifit.com' },
    { label: '🏪 Đăng nhập Seller', email: 'seller@sifit.com' },
    { label: '⚙️ Đăng nhập Admin', email: 'admin@sifit.com' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-center">
            <div className="font-heading font-black text-3xl text-white mb-2">Sifit.</div>
            <p className="text-green-200 text-sm">Thời trang 2hand bền vững</p>
          </div>

          <div className="p-8">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-7">
              <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer border-none ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 bg-transparent'}`}>
                Đăng nhập
              </button>
              <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer border-none ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 bg-transparent'}`}>
                Đăng ký
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Họ và tên</label>
                  <input type="text" required placeholder="Nhập tên của bạn..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" required placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
                <input type="password" required placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" />
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Vai trò</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
                    <option value="buyer">🛍️ Người Mua (Buyer)</option>
                    <option value="seller">🏪 Người Bán (Seller)</option>
                  </select>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2 disabled:opacity-60">
                {loading ? 'Đang xử lý...' : isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
              </button>
            </form>

            {/* Quick login buttons */}
            <div className="mt-7 pt-6 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center mb-3">🎭 Demo nhanh (password: 123456)</p>
              <div className="flex flex-col gap-2">
                {QUICK_LOGINS.map(q => (
                  <button
                    key={q.email}
                    onClick={() => loginUser(q.email, '123456')}
                    className="text-xs font-bold text-primary border border-primary/30 bg-primary/5 py-2.5 px-4 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button onClick={goBack} className="mt-6 mx-auto flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
