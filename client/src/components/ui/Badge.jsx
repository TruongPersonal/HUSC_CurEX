import React from 'react';

const Badge = ({ children, status = 'default', className = '' }) => {
  const styles = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    primary: "bg-primary/10 text-primary-dark",
    info: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${styles[status]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
