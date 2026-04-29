import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import LatestPostsSection from './LatestPostsSection';
import LatestDocsSection from './LatestDocsSection';

const HomePage = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;

  return (
    <div className="w-full">
      <HeroSection />
      <LatestPostsSection />
      <LatestDocsSection />
    </div>
  );
};

export default HomePage;
