import React from 'react';
import Badge from './ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DocCard = ({ doc }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/doc/${doc.id}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <Badge status="info" className="bg-blue-50 text-primary border-primary/20 text-[9px] sm:text-[10px] py-0.5 px-2 uppercase font-black tracking-tighter">
            {doc.type === 'EXAM' ? 'Đề thi' : doc.type === 'SLIDE' ? 'Slide' : 'Giáo trình'}
          </Badge>
          {doc.unit_code && (
            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">{doc.unit_code}</span>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 mb-2 sm:mb-3 group-hover:text-primary transition-colors leading-snug sm:leading-normal">
          {doc.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4 sm:mb-5 text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70 sm:w-4 sm:h-4">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <span className="truncate font-medium text-gray-700">{doc.subject_name}</span>
        </div>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[14px] sm:h-[14px]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="truncate max-w-[80px] sm:max-w-[120px] font-medium">{doc.uploader}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
            {new Date(doc.created_at).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocCard;
