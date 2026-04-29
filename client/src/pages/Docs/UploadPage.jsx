import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const UploadPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    subject_id: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const fetchFormData = async () => {
      try {
        const res = await api.get('/api/posts/form-data');
        setSubjects(res.data.subjects);
      } catch (err) {
        toast.error('Không thể tải dữ liệu danh mục.');
      }
    };
    fetchFormData();
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return toast.error('Vui lòng chọn file PDF.');
    if (!formData.title || !formData.type || !formData.subject_id) return toast.error('Vui lòng điền đầy đủ các trường bắt buộc.');

    try {
      setLoading(true);
      const data = new FormData();
      data.append('pdf', pdfFile);
      data.append('title', formData.title);
      data.append('type', formData.type);
      if (formData.subject_id) data.append('subject_id', formData.subject_id);

      await api.post('/api/student-docs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Đóng góp tài liệu thành công! Tài liệu đang chờ xét duyệt.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải lên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-extrabold text-white">Đóng góp Tài liệu</h1>
            <p className="text-white/80 mt-1">Chia sẻ đề thi, slide, giáo trình để cộng đồng học tập. Tài liệu sẽ được xét duyệt trước khi công khai</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="VD: Đề thi cuối kỳ Giải tích 2023"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại<span className="text-red-500">*</span></label>
                  <select
                    name="type" value={formData.type} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="EXAM">Đề thi</option>
                    <option value="SLIDE">Slide</option>
                    <option value="TEXTBOOK">Giáo trình</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Học phần <span className="text-red-500">*</span></label>
                  <select
                    name="subject_id" value={formData.subject_id} onChange={handleChange} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  >
                    <option value="">-- Chọn Học phần --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">File PDF <span className="text-red-500">*</span></label>
                  <label className="relative flex-1 h-48 w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer group">
                    <input
                      type="file" accept=".pdf,application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={e => setPdfFile(e.target.files[0] || null)}
                    />
                    {pdfFile ? (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-green-600 font-bold text-sm">{pdfFile.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <svg className="mx-auto h-10 w-10 text-gray-400 group-hover:text-primary transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500"><span className="text-primary font-medium">Nhấn để tải file</span> hoặc kéo thả</p>
                        <p className="mt-1 text-xs text-gray-400">PDF {"<="} 20MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button
                type="button" onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit" disabled={loading}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <span className="text-sm">Đang tải...</span>}
                Đóng góp
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
