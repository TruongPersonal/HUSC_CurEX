import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Auth/LoginPage'
import MarketPage from './pages/Market/MarketPage'
import PostDetailPage from './pages/Market/PostDetailPage'
import PostPage from './pages/Market/PostPage'
import DocsPage from './pages/Docs/DocsPage'
import UploadPage from './pages/Docs/UploadPage'
import DocDetailPage from './pages/Docs/DocDetailPage'
import MyReportsPage from './pages/Profile/MyReportsPage'
import ProfilePage from './pages/Profile/ProfilePage'
import UnitsPage from './pages/Admin/UnitsPage'
import UsersPage from './pages/Admin/UsersPage'
import ReportsPage from './pages/Admin/ReportsPage'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import AssistantDashboardPage from './pages/Assistant/AssistantDashboardPage'
import SubjectsPage from './pages/Assistant/SubjectsPage'
import AssistantDocsPage from './pages/Assistant/DocsPage'
import AssistantPostsPage from './pages/Assistant/PostsPage'

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'ASSISTANT') return <Navigate to="/assistant" replace />;
  return <Navigate to="/" replace />;
};

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/:id" element={<PostDetailPage />} />
            <Route path="/doc" element={<DocsPage />} />
            <Route path="/doc/:id" element={<DocDetailPage />} />
            <Route path="/report" element={<MyReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/post" element={<PostPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/assistant" element={<AssistantDashboardPage />} />
            <Route path="/units" element={<UnitsPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/docs" element={<AssistantDocsPage />} />
            <Route path="/posts" element={<AssistantPostsPage />} />
          </Route>

          {/* Catch-all route for 404/Unauthorized access */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
