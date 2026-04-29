import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const { user } = useAuth();

  // Redirect admin and assistant away from student view
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-light font-sans selection:bg-primary/20 selection:text-primary-dark">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout
