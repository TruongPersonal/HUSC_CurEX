import React from 'react';

const DocSidebar = ({ filters, setFilters, handleApplyFilters, handleResetFilters, units }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Bộ lọc
      </h3>
      
      {/* Loại tài liệu */}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Loại</h4>
        <div className="space-y-3">
          {[
            { id: '', label: 'Tất cả' },
            { id: 'EXAM', label: 'Đề thi' },
            { id: 'SLIDE', label: 'Slide' },
            { id: 'TEXTBOOK', label: 'Giáo trình' }
          ].map((type) => (
            <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="docType" 
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                checked={filters.type === type.id}
                onChange={() => setFilters({ ...filters, type: type.id })}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Khoa / Đơn vị */}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Đơn vị</h4>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="unit" 
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
              checked={filters.unit_id === ''}
              onChange={() => setFilters({ ...filters, unit_id: '' })}
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium italic">Tất cả</span>
          </label>
          {units.map((unit) => (
            <label key={unit.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="unit" 
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                checked={filters.unit_id === unit.id.toString()}
                onChange={() => setFilters({ ...filters, unit_id: unit.id.toString() })}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                {unit.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleApplyFilters}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20"
        >
          Áp dụng
        </button>
        <button 
          onClick={handleResetFilters}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};

export default DocSidebar;
