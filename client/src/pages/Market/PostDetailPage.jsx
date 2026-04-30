import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import PostCard from '../../components/PostCard';
import ReportModal from '../../components/modals/ReportModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [exchangeRequests, setExchangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('Chào bạn, mình muốn trao đổi cuốn sách này!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [meetingAt, setMeetingAt] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Xin lỗi, mình đã có người hẹn trước cuốn sách này.');
  const [subjects, setSubjects] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    condition: 'GOOD',
    place: '',
    subject_id: '',
    image: null
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPostDetail();
    fetchSubjects();
  }, [id]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/posts/form-data');
      setSubjects(response.data.subjects);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/market/${id}`);
      setPost(res.data);
      setEditForm({
        title: res.data.title,
        description: res.data.description,
        price: res.data.price,
        condition: res.data.condition,
        place: res.data.place,
        subject_id: res.data.subject_id
      });
      
      if (res.data.is_owner && token) {
        const reqRes = await api.get(`/api/market/${id}/requests`);
        setExchangeRequests(reqRes.data);
      }

      const relatedRes = await api.get(`/api/market/${id}/related`, {
        params: { subject_id: res.data.subject_id }
      });
      setRelatedPosts(relatedRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin bài đăng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('description', editForm.description);
      formData.append('price', editForm.price);
      formData.append('condition', editForm.condition);
      formData.append('place', editForm.place);
      formData.append('subject_id', editForm.subject_id);
      if (editForm.image) {
        formData.append('image', editForm.image);
      }

      await api.patch(`/api/market/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsEditing(false);
      fetchPostDetail();
      toast.success('Đã cập nhật bài đăng!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestExchange = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/market/request', {
        post_id: id,
        buyer_message: requestMessage
      });
      
      fetchPostDetail();
      setShowRequestModal(false);
      toast.success('Gửi yêu cầu thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status, meeting_at = null, poster_message = null) => {
    try {
      if (meeting_at && new Date(meeting_at) < new Date()) {
        return toast.error('Thời gian hẹn gặp không được ở quá khứ!');
      }

      await api.patch(`/api/market/requests/${requestId}`, { 
        status, 
        meeting_at: meeting_at ? new Date(meeting_at).toISOString() : null,
        poster_message
      });
      fetchPostDetail();
      setShowAcceptModal(false);
      setShowRejectModal(false);
      toast.success('Cập nhật trạng thái thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật.');
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/api/market/${id}`);
      toast.success('Xóa bài thành công!');
      navigate('/market');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 font-medium">
      Đang tải...
    </div>
  );

  if (error || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Không tìm thấy bài đăng'}</h2>
      <Link to="/market" className="text-primary font-bold hover:underline">Quay lại Chợ giáo trình</Link>
    </div>
  );

  const parseStandardDate = (dateStr) => {
    if (!dateStr) return null;
    const utcStr = (dateStr.includes('Z') || dateStr.includes('+')) ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    return new Date(utcStr);
  };

  const acceptedRequestForSeller = exchangeRequests.find(r => r.status === 'ACCEPTED' || r.status === 'COMPLETED');
  const activeRequest = post?.is_owner ? acceptedRequestForSeller : (
    (post?.my_request?.status === 'ACCEPTED' || post?.my_request?.status === 'COMPLETED') ? post.my_request : null
  );

  const isAcceptedBuyer = post?.my_request && ['ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(post.my_request.status);
  const meetingTime = post.my_request?.meeting_at || activeRequest?.meeting_at;
  const meetingDateObj = parseStandardDate(meetingTime);
  const meetingPassed = meetingDateObj && meetingDateObj <= new Date();
  const canReport = isAcceptedBuyer && meetingPassed;

  return (
    <div className="bg-gray-50 min-h-screen pb-10 md:pb-20">
      <div className="container mx-auto px-4 pt-4 md:pt-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          <div className="lg:w-2/3 space-y-6 md:space-y-8">
            <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative group">
              <img 
                src={post.image_url || 'https://placehold.co/800x600/e2e8f0/64748b?text=Book+Image'} 
                alt={post.title}
                className="w-full aspect-square sm:aspect-[4/3] object-cover"
              />
              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex flex-col gap-2 items-end">
                <Badge status={post.condition === 'GOOD' ? 'success' : 'warning'} className="shadow-lg backdrop-blur-md text-[10px] md:text-xs">
                  {post.condition === 'GOOD' ? 'Mới' : 'Cũ'}
                </Badge>
              </div>

              {post.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-2xl md:text-4xl font-black uppercase border-4 md:border-8 border-white p-4 md:p-6 rotate-12">Đã bán</span>
                </div>
              )}
            </div>

            {(isEditing || post.description) && (
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg md:text-xl font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-5 md:h-6 bg-primary rounded-full"></span>
                  Mô tả chi tiết
                </h2>
                {isEditing ? (
                  <textarea 
                    className="w-full h-40 md:h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm md:text-base"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Nhập mô tả chi tiết..."
                  ></textarea>
                ) : (
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                    {post.description}
                  </div>
                )}
              </div>
            )}

            {post.is_owner && post.status !== 'SOLD' && (
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 md:h-6 bg-primary rounded-full"></span>
                    Danh sách yêu cầu
                  </h2>
                </div>

                {exchangeRequests.length === 0 ? (
                  <div className="text-center py-8 md:py-10 text-sm md:text-base text-gray-500 font-medium bg-gray-50 rounded-xl md:rounded-2xl border border-dashed border-gray-200">
                    Chưa có yêu cầu!
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {exchangeRequests.map(req => (
                      <div key={req.id} className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all ${req.status === 'ACCEPTED' ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm md:text-base">
                              {req.buyer_name.substring(0,1)}
                            </div>
                            <div>
                               <div className="font-black text-gray-900 text-sm md:text-base flex items-center gap-2">
                                 {req.buyer_name}
                                 {req.buyer_phone && ['ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(req.status) && (
                                   <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border border-green-200">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                     {req.buyer_phone}
                                   </span>
                                 )}
                               </div>
                               <div className="text-[10px] md:text-xs text-gray-500">@{req.buyer_username} • {new Date(req.created_at).toLocaleString('vi-VN')}</div>
                            </div>
                          </div>
                          {req.status === 'CANCELLED' ? (
                            <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Đã hủy</span>
                          ) : (
                            <Badge status={
                              req.status === 'PENDING' ? 'primary' : 
                              req.status === 'ACCEPTED' ? 'success' : 
                              req.status === 'COMPLETED' ? 'success' : 'danger'
                            } className="text-[9px] md:text-[10px]">
                              {req.status === 'PENDING' ? 'Chờ duyệt' : 
                               req.status === 'ACCEPTED' ? 'Chấp nhận' : 
                               req.status === 'COMPLETED' ? 'Thành công' : 'Từ chối'}
                            </Badge>
                          )}
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-600 mb-4 border border-gray-100 italic">
                          "{req.buyer_message}"
                        </div>
                        
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button 
                              disabled={activeRequest}
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setShowAcceptModal(true);
                              }}
                              className={`px-3 md:px-4 py-1.5 md:py-2 text-white text-[10px] md:text-xs font-black rounded-lg transition-all ${activeRequest ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                            >
                              CHẤP NHẬN
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setShowRejectModal(true);
                              }}
                              className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-600 text-[10px] md:text-xs font-bold rounded-lg hover:bg-gray-200 transition-all"
                            >
                              TỪ CHỐI
                            </button>
                          </div>
                        )}

                        {req.status === 'ACCEPTED' && (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateRequestStatus(req.id, 'COMPLETED')}
                                disabled={new Date() < parseStandardDate(req.meeting_at)}
                                className={`px-3 md:px-4 py-1.5 md:py-2 text-white text-[10px] md:text-xs font-black rounded-lg transition-all ${new Date() < parseStandardDate(req.meeting_at) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                title={new Date() < parseStandardDate(req.meeting_at) ? "Chỉ có thể xác nhận sau giờ hẹn" : ""}
                              >
                                THÀNH CÔNG
                              </button>
                              <button 
                                onClick={() => handleUpdateRequestStatus(req.id, 'CANCELLED')}
                                disabled={new Date() < parseStandardDate(req.meeting_at)}
                                className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${new Date() < parseStandardDate(req.meeting_at) ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                title={new Date() < parseStandardDate(req.meeting_at) ? "Chỉ có thể xác nhận sau giờ hẹn" : ""}
                              >
                                THẤT BẠI
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 lg:sticky lg:top-24">
              {post.is_owner && (
                <div className="mb-4 flex justify-end items-center gap-2">
                  {post.is_hidden_by_admin && (
                    <span className="inline-flex mr-auto items-center gap-1.5 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border border-red-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      BỊ ẨN
                    </span>
                  )}
                  <div className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${post.status === 'AVAILABLE' ? 'text-green-500' : 'text-gray-400'}`}>
                    {post.status === 'AVAILABLE' ? 'Đang bán' : 'Đã bán'}
                  </div>
                </div>
              )}

              <div className="mb-4 md:mb-6 flex flex-wrap justify-between items-start gap-2">
                {isEditing ? (
                  <select 
                    className="bg-gray-50 text-[10px] md:text-xs font-black text-primary px-3 py-1.5 rounded-lg border border-primary/20 outline-none"
                    value={editForm.subject_id}
                    onChange={(e) => setEditForm({...editForm, subject_id: e.target.value})}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                ) : (
                  <Badge status="primary" className="text-[10px] md:text-xs">{post.subject_name}</Badge>
                )}
                <span className="text-[9px] md:text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase tracking-widest">
                  {isEditing 
                    ? subjects.find(s => s.id.toString() === editForm.subject_id?.toString())?.code 
                    : post.subject_code
                  }
                </span>
              </div>

              {isEditing ? (
                  <div className="space-y-4 mb-6">
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-primary/20 rounded-xl font-black text-lg md:text-xl outline-none focus:border-primary"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    />
                    
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-bold text-sm text-gray-500 whitespace-nowrap">Ảnh mới:</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setEditForm({...editForm, image: e.target.files[0]})}
                        className="flex-1 text-[10px] font-bold text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-bold text-sm text-gray-500">Giá:</span>
                      <input 
                        type="number" 
                        className="flex-1 bg-transparent font-black text-primary outline-none text-sm md:text-base"
                        value={editForm.price}
                        onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value) || 0})}
                      />
                      <span className="text-[10px] md:text-xs font-bold text-gray-400">VNĐ</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-bold text-sm text-gray-500">Tình trạng:</span>
                      <select 
                        className="flex-1 bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm md:text-base"
                        value={editForm.condition}
                        onChange={(e) => setEditForm({...editForm, condition: e.target.value})}
                      >
                        <option value="GOOD">Mới</option>
                        <option value="POOR">Cũ</option>
                      </select>
                    </div>
                  </div>
              ) : (
                <>
                  <h1 className="text-xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4 leading-tight">
                    {post.title}
                  </h1>
                  <div className="text-2xl md:text-3xl font-black text-primary mb-6 md:mb-8">
                    {post.price === 0 ? 'Miễn phí' : `${post.price.toLocaleString('vi-VN')}đ`}
                  </div>
                </>
              )}

              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-sm md:text-base">📍</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase">Địa điểm</div>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="w-full bg-transparent font-bold border-b border-primary/20 outline-none focus:border-primary text-sm md:text-base"
                        value={editForm.place}
                        onChange={(e) => setEditForm({...editForm, place: e.target.value})}
                      />
                    ) : (
                      <div className="font-bold text-sm md:text-base truncate">{post.place || 'Thoả thuận'}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-sm md:text-base">👤</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase">Người bán</div>
                    <div className="font-bold text-sm md:text-base flex items-center gap-2 flex-wrap">
                      {post.seller_name}
                      {post.my_request?.seller_phone && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border border-blue-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {post.my_request.seller_phone}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500 font-bold">@{post.seller_username}</div>
                  </div>
                </div>

                {((post.status === 'SOLD' && post.buyer) || (activeRequest && post.is_owner)) && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-base ${post.status === 'SOLD' ? 'bg-gray-50 text-gray-500' : 'bg-blue-50 text-blue-500'}`}>🤝</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase">Người mua</div>
                      <div className={`font-bold text-sm md:text-base flex items-center gap-2 flex-wrap ${post.status === 'SOLD' ? 'text-gray-900' : 'text-blue-700'}`}>
                        {post.status === 'SOLD' && post.buyer 
                          ? post.buyer.full_name
                          : activeRequest?.buyer_name
                        }
                        {(activeRequest?.buyer_phone || post.buyer?.phone) && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border border-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            {activeRequest?.buyer_phone || post.buyer?.phone}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] md:text-xs font-bold ${post.status === 'SOLD' ? 'text-gray-500' : 'text-blue-400'}`}>
                        @{post.status === 'SOLD' && post.buyer ? post.buyer.username : activeRequest?.buyer_username}
                      </div>
                    </div>
                  </div>
                )}

                {((activeRequest && activeRequest.status !== 'PENDING') || 
                  (post.my_request && post.my_request.status !== 'PENDING') || 
                  (post.status === 'SOLD' && post.buyer)) && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-base ${post.status === 'SOLD' ? 'bg-gray-50 text-gray-500' : 'bg-blue-50 text-blue-500'}`}>📅</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase">Thời gian</div>
                      <div className="flex items-center gap-2">
                        <div className={`font-bold text-sm md:text-base ${post.status === 'SOLD' ? 'text-gray-900' : 'text-blue-700'}`}>
                          {(() => {
                            const dateStr = post.status === 'SOLD' && post.buyer?.completed_at 
                              ? post.buyer.completed_at 
                              : (activeRequest?.meeting_at || post.my_request?.meeting_at);
                            if (!dateStr) return '—';
                            
                            const dateObj = parseStandardDate(dateStr);
                            return dateObj.toLocaleString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            });
                          })()}
                        </div>
                        {(post.is_owner || post.my_request?.status === 'ACCEPTED') && activeRequest?.status === 'ACCEPTED' && (
                          <button 
                            onClick={() => {
                              setSelectedRequestId(activeRequest?.id);
                              
                              const date = parseStandardDate(activeRequest?.meeting_at || post.my_request?.meeting_at);
                              const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                              
                              setMeetingAt(localDateTime);
                              setShowAcceptModal(true);
                            }}
                            className="p-1 hover:bg-blue-100 rounded text-blue-400 transition-colors"
                            title="Đổi thời gian"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-sm md:text-base">📅</div>
                  <div>
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase">Ngày đăng</div>
                    <div className="font-bold text-sm md:text-base">{new Date(post.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
              </div>

              {!post.is_owner && (
                <div className="space-y-3">
                  {post.status === 'AVAILABLE' && !post.my_request && (
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="w-full py-3 md:py-4 bg-primary text-white font-black rounded-xl md:rounded-2xl hover:bg-primary-dark transition-all transform active:scale-95 shadow-lg shadow-primary/20 text-sm md:text-base"
                    >
                      GỬI YÊU CẦU
                    </button>
                  )}

                  {post.status === 'AVAILABLE' && post.my_request?.status === 'PENDING' && (
                    <button disabled className="w-full py-3 md:py-4 bg-gray-100 text-gray-400 font-black rounded-xl md:rounded-2xl cursor-not-allowed text-sm md:text-base">
                      ĐÃ GỬI YÊU CẦU
                    </button>
                  )}

                  {isAcceptedBuyer && (
                    <div className="space-y-2">
                      <button 
                        disabled={!canReport || post.has_reported}
                        onClick={() => setShowReportModal(true)}
                        className={`w-full py-3 md:py-4 font-black rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-sm md:text-base ${canReport && !post.has_reported ? 'bg-red-500 text-white shadow-lg shadow-red-100 hover:bg-red-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        {post.has_reported ? 'ĐÃ BÁO CÁO' : 'BÁO CÁO'}
                      </button>
                    </div>
                  )}

                  {post.my_request?.status === 'REJECTED' && (
                    <div className="space-y-2">
                      <div className="p-4 bg-red-50 text-red-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl text-center border border-red-100">
                        Yêu cầu bị từ chối
                        {post.my_request.poster_message && (
                          <div className="px-4 text-[10px] md:text-xs font-medium text-gray-900 italic mt-1">
                            "{post.my_request.poster_message}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {post.my_request?.status === 'CANCELLED' && (
                    <div className="p-4 bg-gray-100 text-gray-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl text-center border border-gray-200">
                      Giao dịch thất bại
                    </div>
                  )}
                </div>
              )}

              {post.is_owner && (
                <div className="space-y-3">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveEdit}
                        disabled={isSubmitting}
                        className="flex-[2] py-3 bg-green-600 text-white font-black rounded-xl md:rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 text-sm"
                      >
                        {isSubmitting ? 'ĐANG LƯU...' : 'CẬP NHẬT'}
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl md:rounded-2xl hover:bg-gray-200 transition-all text-sm"
                      >
                        HỦY
                      </button>
                    </div>
                  ) : (
                    <>
                      {post.status !== 'SOLD' && !post.is_hidden_by_admin && (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="w-full py-3 bg-gray-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          CHỈNH SỬA
                        </button>
                      )}
                      {!post.is_hidden_by_admin && (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={post.is_hidden}
                          className={`w-full py-3 border-2 font-bold rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 text-sm ${post.is_hidden ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          XÓA BÀI
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-12 md:mt-20">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3">
              <span className="w-2 h-6 md:h-8 bg-primary rounded-full"></span>
              Khám phá thêm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedPosts.map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowRequestModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl">
            <div className="p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Lời nhắn đến người bán</h3>
              <p className="text-gray-500 mb-6 font-medium">Hãy giới thiệu ngắn gọn để người bán biết bạn đang quan tâm nhé.</p>
              
              <textarea 
                className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all mb-6 font-medium"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              ></textarea>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleRequestExchange}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'ĐANG GỬI...' : 'XÁC NHẬN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAcceptModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl">
            <div className="p-8">
              <h3 className="text-xl font-black text-gray-900 mb-2">Thời gian trao đổi</h3>
              <p className="text-sm text-gray-500 mb-6">Vui lòng chọn thời gian sẽ gặp mặt để trao đổi.</p>
              
              <input 
                type="datetime-local" 
                className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all mb-6 font-bold bg-gray-50 appearance-none min-h-[60px]"
                style={{ WebkitAppearance: 'none' }}
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleUpdateRequestStatus(selectedRequestId, 'ACCEPTED', meetingAt)}
                  disabled={!meetingAt}
                  className="flex-[2] py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  XÁC NHẬN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowRejectModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
            <div className="p-8">
              <h3 className="text-xl font-black text-gray-900 mb-2">Lý do từ chối</h3>
              <p className="text-sm text-gray-500 mb-6">Hãy để lại một lời nhắn lịch sự cho người mua nhé.</p>
              
              <textarea 
                className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all mb-6 font-medium"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Mình đã có người hẹn trước rồi, xin lỗi bạn nhé..."
              ></textarea>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleUpdateRequestStatus(selectedRequestId, 'REJECTED', null, rejectionReason)}
                  className="flex-[2] py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all"
                >
                  XÁC NHẬN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác."
        onConfirm={handleDeletePost}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => setPost({ ...post, has_reported: true })}
        targetId={id}
        targetType="POST"
        targetTitle={post.title}
      />
    </div>
  );
};

export default PostDetailPage;
