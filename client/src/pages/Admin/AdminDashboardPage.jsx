import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminDashboardPage = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/stats/admin');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-400 font-medium animate-pulse">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thống kê Hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Tổng số Người dùng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Tổng số Người dùng</h3>
            <p className="text-3xl font-bold text-primary mb-4">{stats?.users?.total || 0}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-auto">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Sinh viên</p>
              <p className="text-lg font-bold text-gray-800">{stats?.users?.students || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Trợ lý</p>
              <p className="text-lg font-bold text-gray-800">{stats?.users?.assistants || 0}</p>
            </div>
          </div>
        </div>

        {/* Tổng số Báo cáo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Tổng số Báo cáo</h3>
            <p className="text-3xl font-bold text-orange-500 mb-4">{stats?.reports?.total || 0}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-auto">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Đã xử lý</p>
              <p className="text-lg font-bold text-green-600">{stats?.reports?.resolved || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Chờ xử lý</p>
              <p className="text-lg font-bold text-red-500">{stats?.reports?.pending || 0}</p>
            </div>
          </div>
        </div>

        {/* Tổng số Nội dung */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">Tổng số Nội dung</h3>
            <p className="text-3xl font-bold text-gray-800 mb-4">{(parseInt(stats?.content?.docs) || 0) + (parseInt(stats?.content?.posts) || 0)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-auto">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Tài liệu</p>
              <p className="text-lg font-bold text-blue-600">{stats?.content?.docs || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Bài đăng</p>
              <p className="text-lg font-bold text-purple-600">{stats?.content?.posts || 0}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">📑</span>
            Hoạt động gần đây
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {stats?.recent?.length > 0 ? (
            stats.recent.map((act, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${act.type === 'DOC' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {act.type === 'DOC' ? '📄' : '🛒'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {act.full_name} <span className="font-medium text-gray-500">{act.type === 'DOC' ? 'đã đăng tài liệu' : 'đã đăng bài mới'}:</span> {act.activity}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(act.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${act.type === 'DOC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {act.type === 'DOC' ? 'Kho' : 'Chợ'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 font-medium">Chưa có hoạt động mới nào</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
