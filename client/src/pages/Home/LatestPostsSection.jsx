import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../../components/PostCard';
import api from '../../utils/api';

const LatestPostsSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const res = await api.get('/api/market', {
          params: { limit: 4, include_mine: true }
        });
        setPosts(res.data.posts);
      } catch (error) {
        console.error('Lỗi khi tải bài đăng mới nhất:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestPosts();
  }, []);

  return (
    <section className="py-20 bg-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Giáo trình mới nhất</h2>
            <p className="text-gray-500 font-medium">Các cuốn sách vừa được sinh viên đăng bán hoặc trao đổi</p>
          </div>
          <Link to="/market" className="hidden md:inline-flex text-primary font-bold hover:text-primary-dark transition-colors items-center gap-1">
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10 text-gray-400 font-medium">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/market" className="inline-flex text-primary font-bold hover:text-primary-dark transition-colors items-center gap-1">
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection;
