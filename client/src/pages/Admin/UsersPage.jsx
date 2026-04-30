import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const UsersPage = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('STUDENT'); // STUDENT, ASSISTANT
  const [searchQuery, setSearchQuery] = useState('');
  const [violationFilter, setViolationFilter] = useState(0); // 0 (all), 3, 5
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form states for creating/editing Assistant
  const [formData, setFormData] = useState({ username: '', full_name: '', unit_id: '' });

  // Edit assistant state
  const [editId, setEditId] = useState(null);

  if (user?.role !== 'ADMIN') {
    if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
    fetchUnits();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/api/units');
      setUnits(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => {
    if (u.role !== filter) return false;

    // Violation filter
    if (filter === 'STUDENT' && violationFilter > 0) {
      if (parseInt(u.violations_count) <= violationFilter) return false;
    }

    if (filter === 'STUDENT' && searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateAssistant = async (e) => {
    e.preventDefault();
    
    if (!formData.unit_id) {
      return toast.error('Vui lòng chọn Khoa trực thuộc cho Trợ lý.');
    }

    try {
      await api.post('/api/users/assistant', formData);
      setFormData({ username: '', full_name: '', unit_id: '' });
      toast.success('Tạo trợ lý thành công!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo trợ lý.');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/api/users/${id}/status`, { is_active: !currentStatus });
      toast.success('Đổi trạng thái thành công!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/users/${deleteTargetId}`);
      toast.success('Xóa người dùng thành công!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa người dùng');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const startEditAssistant = (u) => {
    setEditId(u.id);
    setFormData({
      username: u.username,
      full_name: u.full_name,
      unit_id: u.unit_id ? String(u.unit_id) : (units.length > 0 ? String(units[0].id) : '')
    });
    // Cuộn lên đầu trang để thấy form sửa
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateAssistant = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/users/assistant/${editId}`, formData);
      setEditId(null);
      setFormData({ username: '', full_name: '', unit_id: '' });
      toast.success('Cập nhật thành công!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trợ lý');
    }
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Quản lý Người dùng
        </h1>
      </div>

      {/* Bộ lọc Tabs */}
      <div className="flex gap-2 mb-6 pb-4">
        <button 
          onClick={() => { setFilter('STUDENT'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === 'STUDENT' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Sinh viên
        </button>
        <button 
          onClick={() => { setFilter('ASSISTANT'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === 'ASSISTANT' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Trợ lý
        </button>
      </div>

      {filter === 'ASSISTANT' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold mb-4">{editId ? 'Sửa Trợ lý' : 'Thêm Trợ lý'}</h2>
          <form onSubmit={editId ? handleUpdateAssistant : handleCreateAssistant} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
              <input 
                type="text" required placeholder="VD: assistant_cntt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="flex-[1.5] min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input 
                type="text" required placeholder="VD: Trợ lý Khoa CNTT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trực thuộc</label>
              <select 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white"
                value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})}
              >
                {!editId && <option value="">-- Chọn Đơn vị --</option>}
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={`px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all shadow-sm`}>
                {editId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { setEditId(null); setFormData({ username: '', full_name: '', unit_id: '' }); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all shadow-sm"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
          {!editId && (
            <p className="text-sm text-gray-500 mt-3">* Mật khẩu mặc định: <span className="font-mono font-bold text-gray-800">AssistantHC@123!</span></p>
          )}
        </div>
      )}

      {filter === 'STUDENT' && (
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Tên, Tài khoản..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100/50 p-1.5 rounded-full border border-gray-100">
            {[
              { val: 0, label: 'Tất cả', activeClass: 'bg-white text-gray-900 shadow-sm' },
              { val: 2, label: '≥ 3', activeClass: 'bg-white text-red-600 shadow-sm' },
              { val: 4, label: '≥ 5', activeClass: 'bg-white text-red-700 shadow-sm font-black' }
            ].map(v => (
              <button 
                key={v.val}
                onClick={() => setViolationFilter(v.val)}
                className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                  violationFilter === v.val 
                    ? v.activeClass 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Người dùng</th>
                {filter === 'STUDENT' && (<th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-center">Vi phạm</th>)}
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Tham gia</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Cập nhật</th>
                {filter === 'ASSISTANT' && (
                  <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Trực thuộc</th>
                )}
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center whitespace-nowrap">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">Không có người dùng nào.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-800">{u.full_name}</div>
                      <div className="text-sm text-gray-500">@{u.username}</div>
                    </td>

                    {filter === 'STUDENT' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          parseInt(u.violations_count) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.433-.798 1.573-.798 2.006 0l7.503 13.84c.433.798-.242 1.777-1.15 1.777H3.384c-.908 0-1.583-.979-1.15-1.777l7.503-13.84zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          {u.violations_count}
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(u.updated_at).toLocaleDateString('vi-VN')}
                    </td>

                    {filter === 'ASSISTANT' && (
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {u.unit_name ? (
                          <span className="font-medium text-primary">{u.unit_name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Không có</span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {filter === 'STUDENT' ? (
                          <>
                            <button 
                              onClick={() => toggleStatus(u.id, u.is_active)} 
                              title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                u.is_active ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {u.is_active ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteTargetId(u.id);
                                setShowDeleteConfirm(true);
                              }}
                              title="Xóa tài khoản vĩnh viễn"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          // ASSISTANT Actions
                          <>
                            <button 
                              onClick={() => startEditAssistant(u)}
                              title="Sửa thông tin"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteTargetId(u.id);
                                setShowDeleteConfirm(true);
                              }}
                              title="Xóa tài khoản trợ lý"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
        message="Bạn có chắc chắn muốn xóa tài khoản này không? Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default UsersPage;
