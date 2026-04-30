import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const REASONS = {
  MARKET: [
    'Lừa đảo, không đến điểm hẹn',
    'Sách không đúng như mô tả',
    'Nội dung không phù hợp',
    'Khác'
  ],
  DOCS: [
    'Tài liệu rác, trống rỗng',
    'Vi phạm bản quyền',
    'Sai học phần, đơn vị',
    'Khác'
  ]
};

const ReportModal = ({ isOpen, onClose, targetId, targetType, targetTitle, onSuccess }) => {
  const { token } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        reason,
        description,
        [targetType === 'POST' ? 'post_id' : 'document_id']: targetId
      };

      await api.post('/api/reports', data);

      toast.success('Báo cáo đã được gửi. Cảm ơn đóng góp của bạn!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi báo cáo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = targetType === 'POST' ? REASONS.MARKET : REASONS.DOCS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Báo cáo vi phạm</h3>
              <p className="text-gray-500 font-medium">Bạn đang báo cáo: <span className="text-gray-900 font-bold">{targetTitle}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Lý do</label>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map((r) => (
                  <label key={r} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${reason === r ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="reason" 
                      value={r} 
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-5 h-5 text-red-500 focus:ring-red-500 border-gray-300"
                    />
                    <span className={`font-bold ${reason === r ? 'text-red-700' : 'text-gray-600'}`}>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Mô tả thêm</label>
              <textarea 
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cung cấp thêm chi tiết để chúng mình xử lý nhanh hơn nhé..."
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || !reason}
                className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'ĐANG GỬI...' : (
                  <>
                    XÁC NHẬN
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
