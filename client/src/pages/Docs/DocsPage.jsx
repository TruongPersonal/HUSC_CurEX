import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import DocCard from '../../components/DocCard';
import DocSidebar from './components/DocSidebar';

const DocsPage = () => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const limit = 12;
  
  const [filters, setFilters] = useState({
    type: '',
    unit_id: '',
    mine: false
  });

  const [activeFilters, setActiveFilters] = useState({
    type: '',
    unit_id: '',
    mine: false
  });
  const [units, setUnits] = useState([]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await api.get('/api/units');
      setUnits(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khoa:', error);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDocs(1, false);
  }, [searchQuery, activeFilters, token]);

  const fetchDocs = async (currentPage, isLoadMore = false) => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const endpoint = activeFilters.mine 
        ? '/api/student-docs/mine' 
        : '/api/student-docs/public';
        
      const response = await api.get(endpoint, {
        params: {
          q: searchQuery,
          type: activeFilters.type,
          unit_id: activeFilters.unit_id,
          limit,
          offset
        }
      });

      if (isLoadMore) {
        setDocs(prev => [...prev, ...response.data.documents]);
      } else {
        setDocs(response.data.documents);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Lỗi khi tải tài liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDocs(nextPage, true);
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...filters });
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = { type: '', unit_id: '', mine: false };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="bg-light min-h-screen py-6 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 md:mb-2 tracking-tight">Kho Tài Liệu</h1>
            <p className="text-sm md:text-base text-gray-500 font-medium">Tìm kiếm tài liệu học tập từ cộng đồng HUSCers</p>
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
                <h3 className="text-xl font-black">Bộ lọc tài liệu</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <DocSidebar 
                filters={filters}
                setFilters={setFilters}
                handleApplyFilters={handleApplyFilters}
                handleResetFilters={handleResetFilters}
                units={units}
              />
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
                <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-fit">
                  <button 
                    onClick={() => {
                      const newFilters = { ...filters, mine: false };
                      setFilters(newFilters);
                      setActiveFilters(newFilters);
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${!activeFilters.mine ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cộng đồng
                  </button>
                  <button 
                    onClick={() => {
                      const newFilters = { ...filters, mine: true };
                      setFilters(newFilters);
                      setActiveFilters(newFilters);
                      if (searchQuery) window.history.replaceState({}, '', '/doc');
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeFilters.mine ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cá nhân
                  </button>
                </div>

                {activeFilters.mine && (
                  <Link 
                    to="/upload" 
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 sm:py-2.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Đóng góp mới
                  </Link>
                )}
              </div>
            )}

            {loading ? (
              <div className="mt-10 flex items-center justify-center mb-6 text-gray-400 font-medium animate-pulse">Đang tải...</div>
            ) : docs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy tài liệu nào</h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {docs.map(doc => (
                    <DocCard key={doc.id} doc={doc} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={handleLoadMore}
                      className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                    >
                      Tải thêm kết quả
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
