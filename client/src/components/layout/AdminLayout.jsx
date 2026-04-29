import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const AdminLayout = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ASSISTANT')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Đang xuất dữ liệu...');
    try {
      const res = await api.get('/api/data/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `husc-curex-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất dữ liệu thành công', { id: loadingToast });
    } catch (err) {
      toast.error('Lỗi khi xuất dữ liệu', { id: loadingToast });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const loadingToast = toast.loading('Đang xử lý dữ liệu nhập...');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          const res = await api.post('/api/data/import', jsonData);
          toast.success(`Import thành công! Đã thêm ${res.data.log.unitsAdded} đơn vị và ${res.data.log.subjectsAdded} học phần.`, { id: loadingToast });
        } catch (err) {
          toast.error('File JSON không hợp lệ hoặc lỗi Server!', { id: loadingToast });
        }
      };
      reader.readAsText(file);
    } catch (err) {
      toast.error('Lỗi khi đọc file', { id: loadingToast });
    } finally {
      e.target.value = '';
    }
  };

  const menuItems = [
    ...(user.role === 'ADMIN' ? [
      { path: '/admin', label: 'Thống kê', icon: '📈' },
      { path: '/users', label: 'Người dùng', icon: '👥' },
      { path: '/reports', label: 'Báo cáo', icon: '📊' },
      { path: '/units', label: 'Đơn vị', icon: '🏢' }
    ] : []),
    ...(user.role === 'ASSISTANT' ? [
      { path: '/assistant', label: 'Tổng quan', icon: '📊' },
      { path: '/subjects', label: 'Học phần', icon: '📚' },
      { path: '/docs', label: 'Tài liệu', icon: '📝' },
      { path: '/posts', label: 'Bài đăng', icon: '🏪' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-white z-50 transition-transform duration-300 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 px-6 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
          <Link to={user.role === 'ADMIN' ? '/admin' : '/assistant'} className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 bg-white rounded flex items-center justify-center p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              HUSC <span className="text-primary">CurEX</span>
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {user.role === 'ADMIN' ? 'Quản trị hệ thống' : 'Bảng Trợ lý'}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="relative group">
              <button className="flex items-center gap-2 text-right focus:outline-none">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                  <p className="text-[10px] text-primary font-black tracking-widest uppercase">
                    {user.role === 'ADMIN' ? 'Quản trị' : 'Trợ lý'}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary/20 bg-gray-100 text-gray-500 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => setIsPwdModalOpen(true)} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Đổi mật khẩu
                  </button>
                  
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button onClick={handleExport} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Xuất dữ liệu
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Nhập dữ liệu
                    </button>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImport} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 relative p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal isOpen={isPwdModalOpen} onClose={() => setIsPwdModalOpen(false)} />
    </div>
  );
};

export default AdminLayout;
