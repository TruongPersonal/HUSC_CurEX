import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ReportsPage = () => {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING'); // PENDING | PROCESSED

  if (user?.role !== 'ADMIN') {
    if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;
    return <Navigate to="/" replace />;
  }

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reports');
      setReports(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/reports/${id}/status`, { status });
      toast.success(status === 'RESOLVED' ? 'Đã xác nhận báo cáo' : 'Đã bác bỏ báo cáo');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const filteredReports = reports.filter(r => {
    if (tab === 'PENDING') return r.status === 'PENDING';
    return r.status === 'RESOLVED' || r.status === 'DISMISSED';
  });

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Quản lý Báo cáo
        </h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('PENDING')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all shadow-sm ${
            tab === 'PENDING' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Chờ xử lý
        </button>
        <button onClick={() => setTab('PROCESSED')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all shadow-sm ${
            tab === 'PROCESSED' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Đã xử lý
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Mục tiêu</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Lý do</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Người báo cáo</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Mô tả</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Ngày</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium whitespace-nowrap">Đang tải báo cáo...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400 font-medium whitespace-nowrap">Không có báo cáo nào.</td></tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 align-middle">
                    {/* Mục tiêu */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${r.target_type === 'POST' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                           {r.target_type === 'POST' ? '🛒' : '📄'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 line-clamp-1">
                            {r.target_type === 'POST' ? r.post_title : r.doc_title}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                            Bởi: {r.owner_name} (@{r.owner_username})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Lý do */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">
                        {r.reason}
                      </span>
                    </td>

                    {/* Người báo cáo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">{r.reporter_name}</div>
                      <div className="text-xs text-gray-400">@{r.reporter_username}</div>
                    </td>

                    {/* Mô tả */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 whitespace-nowrap italic">
                        "{r.description}"
                      </div>
                    </td>

                    {/* Ngày */}
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                       {new Date(r.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {r.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(r.id, 'RESOLVED')}
                            title="Xác nhận vi phạm (Đã xử lý)"
                            className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors border border-green-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => updateStatus(r.id, 'DISMISSED')}
                            title="Bác bỏ báo cáo (Bỏ qua)"
                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'RESOLVED' ? 'Xác nhận' : 'Bác bỏ'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
