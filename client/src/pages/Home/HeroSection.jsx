import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-primary-dark via-primary to-primary-light overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-white blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
          Nền tảng dành cho SV ĐHKH, ĐHH
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight max-w-4xl drop-shadow-sm">
          Trao tri thức cũ, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100">
            nhận tri thức mới
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white opacity-90 mb-10 max-w-2xl leading-relaxed font-medium">
          Giao lưu, mua bán giáo trình và chia sẻ tài liệu số. Tiết kiệm chi phí, kết nối tri thức và xây dựng môi trường học tập vững mạnh
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/upload">
            <Button variant="primary" className="w-full sm:w-auto px-8 py-3.5 bg-white !text-black hover:bg-primary-dark hover:!text-white transition-colors text-lg shadow-lg">
              Đóng góp ngay
            </Button>
          </Link>
          <Link to="/post">
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3.5 border-white/30 text-white hover:bg-white/10 text-lg shadow-sm">
              Đăng bán sách
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
