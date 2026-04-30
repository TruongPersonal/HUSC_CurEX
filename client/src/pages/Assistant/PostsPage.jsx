import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const CONDITION_LABEL = { GOOD: 'Mới', POOR: 'Cũ' };

const PostsPage = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('AVAILABLE'); // AVAILABLE | SOLD
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  if (user?.role !== 'ASSISTANT') {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const fetchPosts = async (currentTab = tab) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/posts/manage?tab=${currentTab}`);
      setPosts(res.data);
    } catch (err) {
      toast.error('Không thể tải danh sách bài đăng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(tab);
  }, [tab, token]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/posts/${deleteTargetId}`);
      toast.success('Xóa bài đăng thành công');
      fetchPosts(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa bài đăng');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Quản lý Bài đăng
        </h1>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { val: 'AVAILABLE', label: 'Đang bán' },
          { val: 'SOLD', label: 'Đã bán' }
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setTab(val)}
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
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Bài đăng</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Địa điểm</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Người đăng</th>
                {tab === 'SOLD' && (
                  <>
                    <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Người mua</th>
                    <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Thời gian</th>
                  </>
                )}
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">Ngày đăng</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 whitespace-nowrap text-right">Thao tác</th>
                <th className="px-6 py-3 whitespace-nowrap text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={tab === 'SOLD' ? 9 : 7} className="px-6 py-8 text-center text-gray-500 whitespace-nowrap">Đang tải...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={tab === 'SOLD' ? 9 : 7} className="px-6 py-8 text-center text-gray-400 whitespace-nowrap">Không có bài đăng nào.</td></tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 align-middle">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-[200px] max-w-[400px]">
                          <div className="font-bold text-gray-800 break-words mb-1">{post.title}</div>
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                            {/* Giá */}
                            <span className="text-sm font-extrabold text-primary">
                              {post.price === 0 ? 'Miễn phí' : post.price.toLocaleString('vi-VN') + 'đ'}
                            </span>
                            {/* Môn học */}
                            <span className="text-xs text-gray-500 border-l border-gray-300 pl-3">
                              {post.subject_name || 'N/A'}
                            </span>
                            {/* Tình trạng */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${post.condition === 'GOOD' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {CONDITION_LABEL[post.condition]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Địa điểm */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {post.place}
                      </div>
                    </td>

                    {/* Người đăng */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="font-medium">{post.seller_name}</div>
                      <div className="text-gray-400 text-xs">@{post.seller_username}</div>
                    </td>

                    {/* Người mua (chỉ tab SOLD) */}
                    {tab === 'SOLD' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap bg-gray-50/30">
                          {post.buyer_name ? (
                            <>
                              <div className="font-medium text-gray-900">{post.buyer_name}</div>
                              <div className="text-gray-400 text-xs">@{post.buyer_username}</div>
                            </>
                          ) : (
                            <span className="text-gray-300 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap bg-gray-50/30">
                          {post.transaction_time ? new Date(post.transaction_time).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          }) : <span className="text-gray-300 italic">—</span>}
                        </td>
                      </>
                    )}

                    {/* Ngày */}
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setDeleteTargetId(post.id);
                          setShowDeleteConfirm(true);
                        }}
                        title="Xóa bài đăng (Dọn rác)"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>

                    {/* Cột ẩn */}
                    <td className="px-6 py-4 text-center">
                        {post.is_hidden ? (
                            <span className="text-red-500 font-black text-xl">—</span>
                        ) : (
                            <span className="text-gray-200">-</span>
                        )}
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
        message="Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default PostsPage;
