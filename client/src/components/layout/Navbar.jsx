import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import ChangePasswordModal from '../auth/ChangePasswordModal'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchType, setSearchType] = useState('market');
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      navigate(`/${searchType}`);
    } else {
      navigate(`/${searchType}?q=${encodeURIComponent(query)}`);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 -ml-2 text-gray-600 hover:text-primary transition-colors focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="HUSC CurEX Logo" className="w-full h-full drop-shadow-sm" />
          </div>
          <span className="text-lg md:text-xl font-extrabold text-primary tracking-tight">
            HUSC<span className="text-gray-800 font-bold"> CurEX</span>
          </span>
        </Link>
        
        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch} className="flex w-full relative group shadow-sm hover:shadow-md transition-shadow rounded-full">
            <div className="relative">
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="h-full pl-4 pr-8 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-full text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer transition-colors"
              >
                <option value="market">Bài đăng</option>
                <option value="doc">Tài liệu</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder={searchType === 'doc' ? "Tìm học phần, người đăng..." : "Tìm giáo trình, người bán..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-r-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-primary-dark text-white rounded-full transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center justify-center gap-6">
          <Link to="/market" className={`font-bold transition-colors ${location.pathname === '/market' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Bài đăng</Link>
          <Link to="/doc" className={`font-bold transition-colors ${location.pathname === '/doc' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Tài liệu</Link>
          {isAuthenticated && user?.role === 'STUDENT' && (
            <Link to="/report" className={`font-bold transition-colors ${location.pathname === '/report' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Báo cáo</Link>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          {isAuthenticated ? (
            <div className="relative group">
              <button type="button" title="Menu tài khoản" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary/20 overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0 flex items-center justify-center bg-gray-100 focus:outline-none">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" md:width="20" md:height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 truncate mb-0.5">{user?.full_name}</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {user?.role === 'STUDENT' ? `Sinh viên - ${user?.username}` : user?.role === 'ASSISTANT' ? 'Trợ lý' : 'Quản trị'}
                  </p>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium">Trang cá nhân</Link>
                  {(user?.role === 'ADMIN' || user?.role === 'ASSISTANT') && (
                    <Link to={user.role === 'ADMIN' ? '/admin' : '/assistant'} className="block px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors font-bold">Bảng điều khiển</Link>
                  )}
                  <button onClick={() => setIsPwdModalOpen(true)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium">Đổi mật khẩu</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border-t border-gray-50 mt-1 pt-2">Đăng xuất</button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              <span>Tham gia</span>
              <svg className="hidden sm:block" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex w-full relative group shadow-sm rounded-2xl overflow-hidden border border-gray-100">
              <div className="relative">
                <select 
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="h-full pl-4 pr-7 py-3 bg-gray-50 border-r border-gray-100 text-xs font-bold text-gray-700 focus:outline-none appearance-none"
                >
                  <option value="market">Bài đăng</option>
                  <option value="doc">Tài liệu</option>
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full pl-3 pr-10 py-3 bg-white focus:outline-none text-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <nav className="flex flex-col gap-1">
              <Link to="/market" className={`px-4 py-3 rounded-xl font-bold flex items-center justify-between ${location.pathname === '/market' ? 'bg-primary/5 text-primary' : 'text-gray-600'}`}>
                Bài đăng <span className="text-lg">🏪</span>
              </Link>
              <Link to="/doc" className={`px-4 py-3 rounded-xl font-bold flex items-center justify-between ${location.pathname === '/doc' ? 'bg-primary/5 text-primary' : 'text-gray-600'}`}>
                Tài liệu <span className="text-lg">📚</span>
              </Link>
              {isAuthenticated && user?.role === 'STUDENT' && (
                <Link to="/report" className={`px-4 py-3 rounded-xl font-bold flex items-center justify-between ${location.pathname === '/report' ? 'bg-primary/5 text-primary' : 'text-gray-600'}`}>
                  Báo cáo vi phạm <span className="text-lg">🚩</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={isPwdModalOpen} onClose={() => setIsPwdModalOpen(false)} />
    </nav>
  )
}

export default Navbar
