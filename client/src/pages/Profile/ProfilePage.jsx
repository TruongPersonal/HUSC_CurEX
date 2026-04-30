import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, token, setUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/api/auth/update-profile', formData);
      setUser(res.data.user);
      toast.success('Cập nhật hồ sơ thành công');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('avatar', file);

    try {
      setLoading(true);
      const res = await api.post('/api/auth/upload-avatar', uploadFormData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser({ ...user, avatar_url: res.data.avatar_url });
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-500 font-medium">Quản lý thông tin tài khoản và hình ảnh đại diện của bạn</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-primary/10 to-blue-50 relative">
            <div className="absolute inset-0 flex items-center justify-center translate-y-16">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white relative">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div className="pt-20 pb-10 px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-gray-900 mb-1">{user.full_name}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {user.role === 'STUDENT' ? 'Sinh viên' : user.role === 'ASSISTANT' ? 'Trợ lý' : 'Quản trị'} - {user.email}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
                  <input 
                    type="text" required placeholder="VD: Nguyễn Văn A"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-gray-800"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Số điện thoại</label>
                  <div className="relative">
                    <input 
                      type="tel" placeholder="VD: 0123456789"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-gray-800"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">📞</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all disabled:opacity-50 hover:-translate-y-0.5"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
