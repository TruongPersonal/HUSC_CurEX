import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import DocCard from '../../components/DocCard';
import ReportModal from '../../components/modals/ReportModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const DocDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    type: '',
    subject_id: '',
    file: null
  });
  const [subjects, setSubjects] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user && doc && user.id === doc.user_id;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDocDetail();
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchSubjects();
    }
  }, [isEditMode]);

  const fetchDocDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/student-docs/${id}`);
      setDoc(res.data);
      setEditForm({
        title: res.data.title,
        type: res.data.type,
        subject_id: res.data.subject_id || '',
        file: null
      });
      
      if (res.data.subject_id) {
        const relatedRes = await api.get(`/api/student-docs/${id}/related`, {
          params: { subject_id: res.data.subject_id }
        });
        setRelatedDocs(relatedRes.data);
      }
    } catch (err) {
      console.error('Error fetching doc detail:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách môn học:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('type', editForm.type);
      formData.append('subject_id', editForm.subject_id);
      if (editForm.file) {
        formData.append('pdf', editForm.file);
      }

      const res = await api.patch(`/api/student-docs/${id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setDoc(res.data.document);
      setIsEditMode(false);
      toast.success('Đã cập nhật tài liệu! Vui lòng chờ duyệt lại.');
      fetchDocDetail(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/student-docs/${id}`);
      toast.success('Đã xóa tài liệu thành công');
      navigate('/doc');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-500 mb-6">{error || 'Tài liệu không tồn tại'}</p>
          <Link to="/doc" className="inline-block bg-primary text-white px-6 py-2 rounded-xl font-bold transition-all hover:bg-primary-dark">
            Quay lại kho tài liệu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10 md:pb-20 pt-4 md:pt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          <div className="lg:w-2/3 space-y-6 md:space-y-8">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-gray-100">
              <div className="aspect-square sm:aspect-[4/5] bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative group">
                <iframe
                  src={`${doc.file_url}#toolbar=0`}
                  className="w-full h-full border-none"
                  title={doc.title}
                />
                <div className="absolute top-4 left-4 pointer-events-none opacity-20 hidden lg:block select-none">
                  <span className="text-xl font-black text-white tracking-tighter">HUSC CurEX</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg md:text-xl font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <span className="w-1.5 h-5 md:h-6 bg-primary rounded-full"></span>
                Lưu ý
              </h2>
              <div className="text-gray-600 leading-relaxed text-base md:text-lg italic">
                Tài liệu này thuộc học phần <span className="font-bold text-gray-800">{doc.subject_name || 'Đang cập nhật'}</span>, được đăng tải nhằm mục đích hỗ trợ sinh viên trong quá trình học tập và ôn luyện. Chúc các bạn học tập tốt!
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 lg:sticky lg:top-24">
              {isOwner && (
                <div className="mb-4 flex justify-end items-center gap-2">
                  {doc.is_hidden_by_admin && (
                    <span className="inline-flex mr-auto items-center gap-1.5 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black border border-red-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      BỊ ẨN
                    </span>
                  )}
                  <div className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${
                    doc.status === 'PENDING' ? 'text-orange-500' : 
                    doc.status === 'VERIFIED' ? 'text-green-500' : 
                    'text-red-500'
                  }`}>
                    {doc.status === 'PENDING' ? 'Chờ duyệt' : 
                     doc.status === 'VERIFIED' ? 'Chấp nhận' : 
                     'Từ chối'}
                  </div>
                </div>
              )}

              <div className="mb-6 md:mb-8">
                <div className="flex justify-between items-center mb-4">
                  {isEditMode ? (
                    <select 
                      value={editForm.subject_id}
                      onChange={(e) => setEditForm({...editForm, subject_id: e.target.value})}
                      className="px-3 py-1 bg-primary/10 text-primary font-black text-[9px] md:text-[10px] rounded-full outline-none border border-primary/20"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  ) : (
                    <Badge status="primary" className="text-[10px] md:text-xs">{doc.subject_name || 'Tự do'}</Badge>
                  )}
                  
                  <span className="text-[9px] md:text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase tracking-widest">
                    {isEditMode 
                      ? subjects.find(s => s.id.toString() === editForm.subject_id?.toString())?.code 
                      : doc.subject_code
                    }
                  </span>
                </div>

                {isEditMode ? (
                  <textarea 
                    className="w-full p-3 border-2 border-primary/20 rounded-xl font-black text-xl md:text-2xl outline-none focus:border-primary resize-none h-24"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                ) : (
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                    {doc.title}
                  </h1>
                )}
              </div>

              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base md:text-lg">📄</div>
                  <div className="flex-1">
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Phân loại</div>
                    {isEditMode ? (
                      <select 
                        value={editForm.type}
                        onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                        className="w-full bg-transparent font-black text-gray-900 outline-none cursor-pointer border-b border-gray-100 focus:border-primary text-sm md:text-base"
                      >
                        <option value="EXAM">Đề thi</option>
                        <option value="SLIDE">Slide</option>
                        <option value="TEXTBOOK">Giáo trình</option>
                      </select>
                    ) : (
                      <div className="font-black text-gray-900 text-sm md:text-base">
                        {doc.type === 'EXAM' ? 'Đề thi' : doc.type === 'SLIDE' ? 'Slide' : 'Giáo trình'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditMode && doc.status === 'PENDING' && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-base md:text-lg">📁</div>
                    <div className="flex-1">
                      <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Tài liệu mới</div>
                      <input 
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setEditForm({...editForm, file: e.target.files[0]})}
                        className="w-full text-[10px] font-bold text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] md:file:text-[10px] file:font-black file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 cursor-pointer outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-base md:text-lg">👤</div>
                  <div>
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Người đăng</div>
                    <div className="font-bold text-gray-900 text-sm md:text-base">{doc.uploader}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 font-bold -mt-0.5">@{doc.uploader_username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-base md:text-lg">📅</div>
                  <div>
                    <div className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian</div>
                    <div className="font-bold text-gray-900 text-sm md:text-base">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {!isEditMode && (
                  <a 
                    href={doc.file_url} 
                    download 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 md:py-3 bg-primary text-white font-black rounded-xl md:rounded-2xl hover:bg-primary-dark transition-all transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    TẢI VỀ
                  </a>
                )}
                
                {isOwner ? (
                  <div className="space-y-3 pt-2">
                    {isEditMode ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleUpdate}
                          className="flex-[2] py-2.5 md:py-3 bg-green-600 text-white font-black rounded-xl md:rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 uppercase text-xs md:text-sm"
                        >
                          CẬP NHẬT
                        </button>
                        <button 
                          onClick={() => setIsEditMode(false)}
                          className="flex-1 py-2.5 md:py-3 bg-gray-100 text-gray-600 font-bold rounded-xl md:rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs md:text-sm"
                        >
                          HỦY
                        </button>
                      </div>
                    ) : (
                      <>
                        {doc.status === 'PENDING' && !doc.is_hidden_by_admin && (
                          <button 
                            onClick={() => setIsEditMode(true)}
                            className="w-full py-2.5 md:py-3 bg-gray-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            CHỈNH SỬA
                          </button>
                        )}
                        {!doc.is_hidden_by_admin && (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2.5 md:py-3 border-2 border-red-100 text-red-500 font-bold rounded-xl md:rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 uppercase text-xs md:text-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            XÓA BÀI
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowReportModal(true)}
                    disabled={doc.has_reported}
                    className={`w-full py-2.5 md:py-3 font-black rounded-xl md:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs md:text-sm ${doc.has_reported ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white shadow-red-100 hover:bg-red-600'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    {doc.has_reported ? 'ĐÃ BÁO CÁO' : 'BÁO CÁO'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isEditMode && relatedDocs.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              Khám phá thêm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedDocs.map(d => (
                <DocCard key={d.id} doc={d} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => setDoc({ ...doc, has_reported: true })}
        targetId={id}
        targetType="DOCUMENT"
        targetTitle={doc.title}
      />
    </div>
  );
};

export default DocDetailPage;
