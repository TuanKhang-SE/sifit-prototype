import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LocalizedContent from '../components/LocalizedContent';

export default function AdminHub() {
  const { users, products, reports, stats, toggleBlockUser, resolveReport } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <LocalizedContent>
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-black text-gray-900">Admin Hub</h1>
          <p className="text-gray-500 mt-1.5">Chào mừng, Admin. Hãy giữ cộng đồng Sifit trong sạch.</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-52 hidden md:block flex-shrink-0">
            <nav className="bg-white rounded-2xl border border-gray-100 p-2 space-y-0.5 shadow-sm">
              {[
                { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
                { id: 'users', label: 'Người dùng', icon: 'people' },
                { id: 'reports', label: `Báo cáo vi phạm`, icon: 'report', badge: pendingReports.length },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-left cursor-pointer border-none transition-all
                    ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 bg-transparent'}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    {tab.label}
                  </div>
                  {tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{tab.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 space-y-5">
            {/* Mobile tabs */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-1">
              {[['overview', 'Tổng quan'], ['users', 'Users'], ['reports', `Reports (${pendingReports.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border-none ${activeTab === id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Tổng Người Dùng', value: stats.totalUsers, color: 'text-blue-600', icon: 'people', bg: 'bg-blue-50' },
                    { label: 'Tổng Sản Phẩm', value: stats.totalListings, color: 'text-green-600', icon: 'inventory_2', bg: 'bg-green-50' },
                    { label: 'Tổng GMV', value: `${stats.totalRevenue.toLocaleString('vi-VN')}đ`, color: 'text-gray-900', icon: 'monitoring', bg: 'bg-gray-100' },
                    { label: 'Doanh Thu Sàn', value: `${(stats.platformRevenue || 0).toLocaleString('vi-VN')}đ`, color: 'text-[#ee4d2d]', icon: 'account_balance', bg: 'bg-orange-50' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
                        <span className={`material-symbols-outlined ${s.color} text-2xl`}>{s.icon}</span>
                      </div>
                      <p className="text-xs uppercase text-gray-500 tracking-wider font-bold">{s.label}</p>
                      <p className={`text-3xl font-heading font-black mt-2 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Báo cáo đang chờ xử lý</h3>
                    {pendingReports.length > 0 && (
                      <button onClick={() => setActiveTab('reports')} className="text-xs font-bold text-red-500 hover:underline cursor-pointer bg-transparent border-none">
                        Xem tất cả ({pendingReports.length})
                      </button>
                    )}
                  </div>
                  {pendingReports.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">✅ Không có báo cáo nào đang chờ xử lý.</p>
                  ) : pendingReports.slice(0, 2).map(r => (
                    <div key={r._id} className="flex gap-3 py-3 border-b last:border-0 border-gray-100 items-center">
                      <img src={r.listing?.images?.[0]} className="w-12 h-12 object-cover rounded-xl border" alt="" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{r.listing?.title}</p>
                        <p className="text-xs text-red-500 font-bold mt-0.5">⚠️ {r.reason.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-heading font-black text-xl">Quản Lý Người Dùng ({users.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Người dùng</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                        <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Vai trò</th>
                        <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 flex items-center gap-3">
                            <img src={u.avatar} className="w-9 h-9 rounded-full object-cover border flex-shrink-0" alt="" />
                            <p className="font-bold text-gray-900">{u.name}</p>
                          </td>
                          <td className="px-4 py-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{u.role}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {u.blocked ? 'Bị Khóa' : 'Hoạt động'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => toggleBlockUser(u._id)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${u.blocked ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
                              >
                                {u.blocked ? 'Mở Khóa' : 'Khóa TK'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-5">
                <h2 className="font-heading font-black text-2xl text-gray-900">
                  Xử Lý Báo Cáo
                  {pendingReports.length > 0 && (
                    <span className="ml-3 text-base bg-red-500 text-white px-3 py-1 rounded-full">{pendingReports.length} chờ xử lý</span>
                  )}
                </h2>
                {reports.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block text-gray-200 mb-2">check_circle</span>
                    <p>Không có báo cáo nào!</p>
                  </div>
                ) : reports.map(report => {
                  const resolved = report.status !== 'pending';
                  return (
                    <div key={report._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden relative ${resolved ? 'opacity-60 border-gray-100' : 'border-red-100'}`}>
                      {resolved && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                          <div className="border-2 border-green-500 text-green-600 font-heading font-bold text-2xl uppercase px-5 py-2 rounded-lg tracking-wide">
                            {report.status === 'resolved' ? '✓ Đã Xử Lý' : '✗ Bỏ Qua'}
                          </div>
                        </div>
                      )}
                      <div className="p-5 flex gap-5">
                        <img src={report.listing?.images?.[0]} className="w-24 h-24 object-cover rounded-xl border border-gray-100 flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 mb-1">{report.listing?.title}</p>
                          <p className="text-xs text-gray-500 mb-3">Báo cáo bởi: <span className="font-bold">{report.reporter?.name}</span> · {new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                          <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
                            <p className="text-xs text-red-600 font-black uppercase tracking-wider mb-1">{report.reason.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-700">{report.details}</p>
                          </div>
                          {!resolved && (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => resolveReport(report._id, 'delete_listing')} className="px-4 py-2 bg-yellow-500 text-white rounded-full text-xs font-bold cursor-pointer border-none hover:bg-yellow-600 transition-colors">
                                🗑️ Xóa sản phẩm
                              </button>
                              <button onClick={() => resolveReport(report._id, 'block_user')} className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold cursor-pointer border-none hover:bg-red-700 transition-colors">
                                🚫 Xóa + Khóa tài khoản
                              </button>
                              <button onClick={() => resolveReport(report._id, 'dismiss')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-xs font-bold cursor-pointer border-none hover:bg-gray-300 transition-colors">
                                ✓ Bỏ qua (báo cáo sai)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </LocalizedContent>
  );
}
