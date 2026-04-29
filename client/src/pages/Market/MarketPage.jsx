import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MarketSidebar from './components/MarketSidebar';
import PostCard from '../../components/PostCard';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const MarketPage = () => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const initialSearchQuery = queryParams.get('q') || '';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const limit = 12;

  const [filters, setFilters] = useState({
    condition: '',
    min_price: '',
    max_price: '',
    mine: false
  });
  
  const [activeFilters, setActiveFilters] = useState({
    condition: '',
    min_price: '',
    max_price: '',
    mine: false
  });

  const fetchPosts = async (currentPage, isLoadMore = false) => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      
      const response = await api.get('/api/market', {
        params: {
          q: initialSearchQuery,
          condition: activeFilters.condition,
          min_price: activeFilters.min_price,
          max_price: activeFilters.max_price,
          mine: activeFilters.mine,
          limit,
          offset
        }
      });

      const newPosts = response.data.posts;

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chợ giáo trình:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [initialSearchQuery, activeFilters, token]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handleApplyFilters = () => {
    let finalMin = filters.min_price;
    let finalMax = filters.max_price;

    if (finalMin && finalMax && parseFloat(finalMin) > parseFloat(finalMax)) {
      const temp = finalMin;
      finalMin = finalMax;
      finalMax = temp;
      setFilters(prev => ({ ...prev, min_price: finalMin, max_price: finalMax }));
    }

    setActiveFilters({
      condition: filters.condition,
      min_price: finalMin ? (parseFloat(finalMin) * 1000).toString() : '',
      max_price: finalMax ? (parseFloat(finalMax) * 1000).toString() : '',
      mine: filters.mine
    });
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = { condition: '', min_price: '', max_price: '', mine: false };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="bg-light min-h-screen py-6 md:py-10">
      <div className="container mx-auto px-4">
        
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 md:mb-2 tracking-tight">Chợ Giáo Trình</h1>
            <p className="text-sm md:text-base text-gray-500 font-medium">Khám phá và trao đổi giáo trình từ cộng đồng HUSCers</p>
          </div>
          
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm shadow-sm hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Bộ lọc
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop & Mobile */}
          <div className={`
            fixed inset-0 bg-black/50 z-[60] lg:relative lg:bg-transparent lg:z-0 lg:block lg:w-1/4
            ${isFilterOpen ? 'block' : 'hidden lg:block'}
          `} onClick={() => setIsFilterOpen(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 lg:relative lg:rounded-2xl lg:p-0 lg:bg-transparent"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h3 className="text-xl font-black">Bộ lọc tìm kiếm</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <MarketSidebar 
                filters={filters}
                setFilters={setFilters}
                handleApplyFilters={handleApplyFilters}
                handleResetFilters={handleResetFilters}
              />
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
                <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-fit">
                  <button 
                    onClick={() => {
                      setFilters({ ...filters, mine: false });
                      setActiveFilters({ ...activeFilters, mine: false });
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${!activeFilters.mine ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cộng đồng
                  </button>
                  <button 
                    onClick={() => {
                      setFilters({ ...filters, mine: true });
                      setActiveFilters({ ...activeFilters, mine: true });
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeFilters.mine ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cá nhân
                  </button>
                </div>

                {activeFilters.mine && (
                  <Link 
                    to="/post" 
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 sm:py-2.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Đăng bài mới
                  </Link>
                )}
              </div>
            )}

            {posts.length === 0 && !loading ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy bài đăng nào</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            <div className="mt-10 text-center flex flex-col items-center">
              {loading && (
                <div className="flex items-center justify-center mb-6 text-gray-400 font-medium animate-pulse">Đang tải...</div>
              )}
              
              {hasMore && !loading && (
                <button 
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                >
                  Tải thêm
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MarketPage;
