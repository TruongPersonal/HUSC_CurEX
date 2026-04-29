import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex flex-col items-center md:items-start gap-1">
            <h3 className="text-xl font-extrabold tracking-tight">
              HUSC<span className="text-yellow-400"> CurEX</span>
            </h3>
            <span className="text-sm font-medium text-blue-100/80 text-center md:text-left">
              Nền tảng trao đổi giáo trình trường ĐHKH, ĐHH
            </span>
          </div>

          <div className="text-sm font-medium text-blue-100/80 mt-2 md:mt-0">
            &copy; 2026 All rights reserved.
          </div>

        </div>
      </div>
    </footer>
  )
}

export default Footer;
