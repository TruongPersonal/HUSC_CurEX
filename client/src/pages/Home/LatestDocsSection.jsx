import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocCard from '../../components/DocCard';
import api from '../../utils/api';

const LatestDocsSection = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestDocs = async () => {
      try {
        const res = await api.get('/api/student-docs/public', {
          params: { limit: 4, include_mine: true }
        });
        setDocs(res.data.documents);
      } catch (error) {
        console.error('Lỗi khi tải tài liệu mới nhất:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestDocs();
  }, []);

  return (
    <section className="py-20 bg-gray-50 border-t border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Tài liệu mới nhất</h2>
            <p className="text-gray-500 font-medium">Các slide bài giảng, đề thi và tài liệu tham khảo miễn phí</p>
          </div>
          <Link to="/doc" className="hidden md:inline-flex text-primary font-bold hover:text-primary-dark transition-colors items-center gap-1">
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10 text-gray-400 font-medium">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {docs.map(doc => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/doc" className="inline-flex text-primary font-bold hover:text-primary-dark transition-colors items-center gap-1">
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestDocsSection;
