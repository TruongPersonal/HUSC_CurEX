import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginLocal } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tự động ẩn thông báo lỗi sau 5 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'ASSISTANT') navigate('/assistant');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng nhập Google');
    }
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      const data = await loginLocal(username, password);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'ASSISTANT') navigate('/assistant');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Tài khoản hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Floating Error Toast */}
      {error && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-red-50 border border-red-200 shadow-lg rounded-xl p-4 flex items-start max-w-md">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div>
              <h3 className="text-sm font-bold text-red-800">Đăng nhập không thành công</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Cột trái: Background Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 items-center justify-center relative overflow-hidden border-r border-gray-100">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-400/5 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center select-none">
          <img src="/logo.png" alt="HUSC CurEX" className="w-120 h-80 opacity-20" draggable="false" />
          <h1 className="mt-6 text-5xl font-extrabold text-primary tracking-tight opacity-20">HUSC CurEX</h1>
        </div>
      </div>

      {/* Cột phải: Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="max-w-md w-full space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tham gia</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Nền tảng học thuật HUSC CurEX
            </p>
          </div>

          <div className="mt-10">
            {/* Khu vực Đăng nhập Google */}
            <div className="flex justify-center">
              <div className="scale-110">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Kết nối với Google thất bại')}
                  useOneTap={false}
                  shape="pill"
                  theme="outline"
                  text="continue_with"
                />
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center">
              <div className="border-t border-gray-200 flex-grow"></div>
              <span className="mx-4 text-xs text-gray-400 font-bold tracking-wider">HOẶC</span>
              <div className="border-t border-gray-200 flex-grow"></div>
            </div>

            {/* Khu vực Đăng nhập Form Local */}
            <form className="mt-8 space-y-6" onSubmit={handleLocalSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tài khoản</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800"
                  placeholder="Tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800 pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center mt-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Đăng nhập'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
