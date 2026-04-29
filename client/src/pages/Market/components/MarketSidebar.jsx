import React from 'react';

const MarketSidebar = ({ filters, setFilters, handleApplyFilters, handleResetFilters }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Bộ lọc
      </h3>
      
      {/* Tình trạng sách */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Tình trạng</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="condition" 
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
              checked={filters.condition === ''}
              onChange={() => setFilters({ ...filters, condition: '' })}
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Tất cả</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="condition" 
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
              checked={filters.condition === 'GOOD'}
              onChange={() => setFilters({ ...filters, condition: 'GOOD' })}
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Mới</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="condition" 
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
              checked={filters.condition === 'POOR'}
              onChange={() => setFilters({ ...filters, condition: 'POOR' })}
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Cũ</span>
          </label>
        </div>
      </div>

      {/* Khoảng giá */}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Khoảng giá (VNĐ)</h4>
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <input 
              type="number" 
              min="0"
              placeholder="Tối thiểu" 
              className="w-full pl-3 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={filters.min_price}
              onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">K</span>
          </div>
          <span className="text-gray-400">-</span>
          <div className="relative w-full">
            <input 
              type="number" 
              min="0"
              placeholder="Tối đa" 
              className="w-full pl-3 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={filters.max_price}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">K</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleApplyFilters}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Áp dụng
        </button>
        <button 
          onClick={handleResetFilters}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};

export default MarketSidebar;
