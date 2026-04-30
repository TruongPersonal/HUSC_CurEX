import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const TYPE_LABEL = { EXAM: 'Đề thi', SLIDE: 'Slide', TEXTBOOK: 'Giáo trình' };

const DocsPage = () => {
  const { user, token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ title: '', type: '', subject_id: '' });

  if (user?.role !== 'ASSISTANT') {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const fetchDocs = async (currentTab = tab) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/documents?tab=${currentTab}`);
      setDocs(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDocs(tab);
    fetchSubjects();
  }, [tab, token]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/api/documents/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      fetchDocs(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const startEdit = (doc) => {
    setEditId(doc.id);
    setEditData({
      title: doc.title,
      type: doc.type,
      subject_id: doc.subject_id ? String(doc.subject_id) : ''
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editData.title.trim()) return toast.error('Tiêu đề không được để trống');
    if (!editData.subject_id) return toast.error('Vui lòng chọn môn học');
    try {
      await api.put(`/api/documents/${id}`, editData);
      toast.success('Cập nhật tài liệu thành công');
      setEditId(null);
      fetchDocs(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật tài liệu');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/documents/${deleteTargetId}`);
      toast.success('Xóa tài liệu thành công');
      fetchDocs(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'VERIFIED') return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Chấp nhận</span>
    );
    if (status === 'REJECTED') return (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Từ chối</span>
    );
    return null;
  };

  const isEditing = (id) => editId === id;

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Quản lý Tài liệu
        </h1>
      </div>

      <div className="flex gap-2 mb-6">
        {[['PENDING', 'Chờ duyệt'], ['REVIEWED', 'Đã duyệt']].map(([val, label]) => (
          <button key={val} onClick={() => { setTab(val); setEditId(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all shadow-sm ${
              tab === val ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Tài liệu</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Loại</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Người đăng</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Môn học</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Ngày</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-right">
                  {tab === 'PENDING' ? 'Thao tác' : 'Hành động'}
                </th>
                {tab === 'REVIEWED' && (
                  <th className="px-6 py-3 whitespace-nowrap text-center"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={tab === 'PENDING' ? 6 : 7} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={tab === 'PENDING' ? 6 : 7} className="px-6 py-8 text-center text-gray-400">Không có tài liệu nào.</td></tr>
              ) : (
                docs.map(doc => (
                  <tr key={doc.id} className={`hover:bg-gray-50 align-middle ${isEditing(doc.id) ? 'bg-blue-50/40' : ''}`}>

                    {/* Cột Tài liệu */}
                    <td className="px-6 py-4 max-w-xs">
                      {isEditing(doc.id) ? (
                        <input
                          autoFocus
                          className="w-full px-2 py-1.5 border border-primary/50 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                          value={editData.title}
                          onChange={e => setEditData({ ...editData, title: e.target.value })}
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-gray-800 break-words mb-1.5">{doc.title}</div>
                          <div className="flex items-center gap-1">
                            {/* Xem PDF */}
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                              title="Xem tài liệu"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Xem
                            </a>
                            {/* Sửa */}
                            <button onClick={() => startEdit(doc)} title="Sửa thông tin"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Sửa
                            </button>
                            {/* Xóa */}
                            <button onClick={() => {
                              setDeleteTargetId(doc.id);
                              setShowDeleteConfirm(true);
                            }} title="Xóa tài liệu"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Cột Loại */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing(doc.id) ? (
                        <select
                          className="w-full px-2 py-1.5 border border-primary/50 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                          value={editData.type}
                          onChange={e => setEditData({ ...editData, type: e.target.value })}
                        >
                          <option value="EXAM">Đề thi</option>
                          <option value="SLIDE">Slide</option>
                          <option value="TEXTBOOK">Giáo trình</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full whitespace-nowrap">
                          {TYPE_LABEL[doc.type] || doc.type}
                        </span>
                      )}
                    </td>

                    {/* Cột Người nộp */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="font-medium">{doc.uploader_name}</div>
                      <div className="text-gray-400">@{doc.uploader_username}</div>
                    </td>

                    {/* Cột Môn học */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {isEditing(doc.id) ? (
                        <select
                          required
                          className="w-full px-2 py-1.5 border border-primary/50 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                          value={editData.subject_id}
                          onChange={e => setEditData({ ...editData, subject_id: e.target.value })}
                        >
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      ) : (
                        doc.subject_name || <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Cột Ngày nộp */}
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Cột Thao tác / Hành động */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {isEditing(doc.id) ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <button onClick={() => handleSaveEdit(doc.id)}
                            className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors">
                            Lưu
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                            Hủy
                          </button>
                        </div>
                      ) : tab === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleStatusChange(doc.id, 'VERIFIED')} title="Duyệt"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button onClick={() => handleStatusChange(doc.id, 'REJECTED')} title="Từ chối"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        getStatusBadge(doc.status)
                      )}
                    </td>

                    {/* Cột Bị ẩn - chỉ hiện ở tab Đã duyệt */}
                    {tab === 'REVIEWED' && (
                      <td className="px-6 py-4 text-center">
                        {doc.is_hidden ? (
                          <span className="text-red-500 font-black text-xl">—</span>
                        ) : (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default DocsPage;
