import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './ui/Badge';
import { useAuth } from '../contexts/AuthContext';

const PostCard = ({ post, hideSubject = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/market/${post.id}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-100">
        <img 
          src={post.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=Book+Cover'} 
          alt={post.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {post.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-extrabold px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg border-2 border-white shadow-xl uppercase tracking-widest -rotate-12 scale-110 text-xs sm:text-base">
              Đã bán
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-0">
          <Badge status={post.condition === 'GOOD' ? 'success' : 'warning'} className="text-[10px] sm:text-xs">
            {post.condition === 'GOOD' ? 'Mới' : 'Cũ'}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {!hideSubject && (
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <Badge status="primary" className="mb-1 sm:mb-2 text-[10px] sm:text-xs">{post.subject_name}</Badge>
          </div>
        )}
        
        <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug sm:leading-normal">
          {post.title}
        </h3>
        
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-2">
          {post.description}
        </p>
        
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="font-extrabold text-primary text-lg sm:text-xl">
            {post.price === 0 ? 'Miễn phí' : `${post.price.toLocaleString('vi-VN')}đ`}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
