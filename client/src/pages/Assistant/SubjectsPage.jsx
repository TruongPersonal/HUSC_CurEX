import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const SubjectsPage = () => {
  const { token, user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ code: '', name: '', unit_id: '' });
  const [editId, setEditId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjRes, unitRes] = await Promise.all([
        api.get('/api/subjects'),
        user.role === 'ADMIN' ? api.get('/api/units') : Promise.resolve({ data: [] })
      ]);
      setSubjects(subjRes.data);
      if (user.role === 'ADMIN') {
        setUnits(unitRes.data);
      } else if (user.role === 'ASSISTANT') {
        setFormData(prev => ({ ...prev, unit_id: user.unit_id }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    if (user.role === 'ASSISTANT') {
      submitData.unit_id = user.unit_id;
    }
    
    if (!submitData.unit_id) {
      return toast.error('Vui lòng chọn Khoa');
    }

    try {
      if (editId) {
        await api.put(`/api/subjects/${editId}`, submitData);
        toast.success('Cập nhật Học phần thành công');
      } else {
        await api.post('/api/subjects', submitData);
        toast.success('Thêm Học phần thành công');
      }
      setFormData({ code: '', name: '', unit_id: user.role === 'ASSISTANT' ? user.unit_id : '' });
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (sub) => {
    setFormData({ code: sub.code, name: sub.name, unit_id: sub.unit_id });
    setEditId(sub.id);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/subjects/${deleteTargetId}`);
      toast.success('Xóa Học phần thành công');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa Học phần này');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'ASSISTANT') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        Quản lý Học phần
      </h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold mb-4">{editId ? 'Sửa Học phần' : 'Thêm Học phần'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã Học phần</label>
            <input 
              type="text" required
              placeholder="VD: TIN1012"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
              value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
            />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Học phần</label>
            <input 
              type="text" required
              placeholder="VD: Nhập môn lập trình"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          {user?.role === 'ADMIN' && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
              <select 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})}
              >
                <option value="">-- Chọn Khoa --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all">
            {editId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editId && (
            <button type="button" onClick={() => {setEditId(null); setFormData({code:'', name:'', unit_id: user.role === 'ASSISTANT' ? user.unit_id : ''})}} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all">
              Hủy
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Mã HP</th>
              <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Tên Học phần</th>
              <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center whitespace-nowrap">Đang tải...</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">Không có học phần nào.</td></tr>
            ) : (
              subjects.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-primary whitespace-nowrap">{sub.code}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{sub.name}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(sub)}
                        title="Sửa học phần"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteTargetId(sub.id);
                          setShowDeleteConfirm(true);
                        }}
                        title="Xóa học phần"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa Học phần này không? Hành động này có thể ảnh hưởng đến các dữ liệu liên quan."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default SubjectsPage;
