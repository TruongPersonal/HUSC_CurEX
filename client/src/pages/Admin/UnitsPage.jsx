import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const UnitsPage = () => {
  const { token, user } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ code: '', name: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchUnits = async () => {
    try {
      const res = await api.get('/api/units');
      setUnits(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách Đơn vị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/api/units/${editId}`, formData);
        toast.success('Cập nhật Đơn vị thành công');
      } else {
        await api.post('/api/units', formData);
        toast.success('Thêm Đơn vị thành công');
      }
      setFormData({ code: '', name: '' });
      setEditId(null);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (unit) => {
    setFormData({ code: unit.code, name: unit.name });
    setEditId(unit.id);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/units/${deleteTargetId}`);
      toast.success('Xóa Đơn vị thành công');
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa Đơn vị này');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        Quản lý Đơn vị
      </h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold mb-4">{editId ? 'Sửa Đơn vị' : 'Thêm Đơn vị'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">Mã Đơn vị</label>
            <input 
              type="text" required
              placeholder='VD: TIN'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
              value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên Đơn vị</label>
            <input 
              type="text" required
              placeholder='VD: Khoa Công nghệ thông tin'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="md:col-span-1 flex gap-2">
            <button type="submit" className="flex-1 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all">
              {editId ? 'Lưu' : 'Thêm'}
            </button>
            {editId && (
              <button type="button" onClick={() => {setEditId(null); setFormData({code:'', name:''})}} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all">
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Mã Đơn vị</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Đơn vị</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="3" className="px-6 py-4 text-center whitespace-nowrap">Đang tải...</td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">Không có đơn vị nào.</td></tr>
              ) : (
                units.map(unit => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-primary whitespace-nowrap">{unit.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{unit.name}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(unit)}
                          title="Sửa đơn vị"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            setDeleteTargetId(unit.id);
                            setShowDeleteConfirm(true);
                          }}
                          title="Xóa đơn vị"
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
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa Đơn vị này? Hành động này sẽ ảnh hưởng đến các dữ liệu liên quan và không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default UnitsPage;
