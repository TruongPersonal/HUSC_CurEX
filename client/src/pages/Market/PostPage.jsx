import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const PostPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    condition: 'GOOD',
    price: '',
    place: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchFormData = async () => {
      try {
        const response = await api.get('/api/posts/form-data');
        setSubjects(response.data.subjects);
      } catch (err) {
        console.error('Failed to fetch form data', err);
        toast.error('Không thể tải dữ liệu danh mục. Vui lòng thử lại sau.');
      }
    };
    fetchFormData();
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject_id || formData.price === '' || !formData.place || !imageFile) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc và chọn hình ảnh.');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('subject_id', formData.subject_id);
      submitData.append('condition', formData.condition);
      submitData.append('price', formData.price);
      submitData.append('place', formData.place);
      submitData.append('image', imageFile);

      await api.post('/api/posts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Đăng bài thành công!');
      navigate('/market');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng bài');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-extrabold text-white">Tạo Bài Đăng Mới</h1>
            <p className="text-white mt-1">Chia sẻ tri thức, giáo trình cũ của bạn cho cộng đồng HUSC</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên giáo trình <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="VD: Giáo trình Toán Cao Cấp A1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Học phần <span className="text-red-500">*</span></label>
                  <select 
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  >
                    <option value="">-- Chọn Học phần --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tình trạng</label>
                    <select 
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                    >
                      <option value="GOOD">Mới</option>
                      <option value="POOR">Cũ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mức giá (VNĐ) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      name="price"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0 = Miễn phí"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Địa điểm giao dịch <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="place"
                    value={formData.place}
                    onChange={handleChange}
                    placeholder="VD: Thư viện, Sảnh E, Dãy H, Cổng trường, ..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh thực tế <span className="text-red-500">*</span></label>
                  <div className="relative h-48 w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center overflow-hidden group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="mx-auto h-10 w-10 text-gray-400 group-hover:text-primary transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500"><span className="text-primary font-medium">Nhấn để tải ảnh</span> hoặc kéo thả</p>
                        <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP {"<="} 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tình trạng chi tiết, có note hay highlight bên trong không, . . .?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <span className="text-sm">Đang tải...</span>}
                Đăng bài
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
