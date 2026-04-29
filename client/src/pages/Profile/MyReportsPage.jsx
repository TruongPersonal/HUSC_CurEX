import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';

const MyReportsPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('MY_REPORTS'); // MY_REPORTS | AGAINST_ME
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'MY_REPORTS' ? '/api/reports/mine' : '/api/reports/against-me';
      const res = await api.get(endpoint);
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [activeTab, token]);

  return (
    <div className="bg-light min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Trung tâm báo cáo</h1>
          <p className="text-gray-500 font-medium">Theo dõi các báo cáo bạn đã gửi và các phản hồi liên quan đến nội dung của bạn</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit mb-8">
          <button 
            onClick={() => setActiveTab('MY_REPORTS')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'MY_REPORTS' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            BÁO CÁO
          </button>
          <button 
            onClick={() => setActiveTab('AGAINST_ME')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'AGAINST_ME' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            BỊ BÁO CÁO
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center">
              <div className="text-gray-400 font-medium animate-pulse">Đang tải...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <div className="text-6xl mb-6">{activeTab === 'MY_REPORTS' ? '🍃' : '✨'}</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có dữ liệu</h3>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge status={report.target_type === 'POST' ? 'primary' : 'info'}>
                        {report.target_type === 'POST' ? 'Bài đăng' : 'Tài liệu'}
                      </Badge>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">
                        Mã #{report.id}
                      </span>
                      <span className="text-xs text-gray-400 font-bold ml-auto md:ml-0">
                        {new Date(report.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 mb-2">
                      {report.post_title || report.doc_title || 'Nội dung đã bị xóa'}
                    </h3>

                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 font-black text-sm whitespace-nowrap">Lý do:</span>
                        <span className="text-gray-700 font-bold text-sm italic">"{report.reason}"</span>
                      </div>
                      {report.description && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 font-black text-sm whitespace-nowrap">Chi tiết:</span>
                          <span className="text-gray-600 font-medium text-sm">{report.description}</span>
                        </div>
                      )}
                      {activeTab === 'AGAINST_ME' && (
                        <div className="flex items-start gap-2 mt-1">
                          <span className="text-gray-400 font-black text-sm whitespace-nowrap">Từ:</span>
                          <span className="text-gray-600 font-bold text-sm">@{report.reporter_username}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-end min-w-[140px]">
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter shadow-sm border-2 ${
                      report.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      report.status === 'RESOLVED' ? 'bg-green-50 text-green-600 border-green-100' :
                      'bg-red-50 text-red-500 border-red-100'
                    }`}>
                      {report.status === 'PENDING' ? 'Đang xử lý' : 
                       report.status === 'RESOLVED' ? 'Đã giải quyết' : 
                       'Bị bác bỏ'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReportsPage;
