import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (newPassword.length < 6) {
      return setError('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    try {
      setLoading(true);
      const res = await api.put(
        '/api/auth/change-password',
        { oldPassword, newPassword }
      );
      setSuccess(res.data.message);
      // Cập nhật trạng thái user để hiện ô mật khẩu hiện tại cho lần sau
      setUser({ ...user, has_password: true });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{success}</div>}
          
          {user?.has_password !== false && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Nhập mật khẩu hiện tại" required />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Tối thiểu 6 ký tự" required minLength="6" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Nhập lại mật khẩu mới" required />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50">
              {loading ? '...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ChangePasswordModal;
