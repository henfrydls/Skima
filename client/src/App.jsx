import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout';
import { DashboardView, TeamMatrixPage, ReportsPage, SettingsPage } from './pages';
import SetupView from './pages/SetupView';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionExpiredModal from './components/common/SessionExpiredModal';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Route guard: Redirects to /setup if system is not set up
function SetupGuard({ children }) {
  const { isLoading, isSetup } = useConfig();
  const location = useLocation();

  // Show loading while checking config
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If not setup and not on /setup page, redirect
  if (!isSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return children;
}

// Route guard: Prevents accessing /setup if already set up
function SetupPageGuard({ children }) {
  const { isLoading, isSetup, onSetupComplete } = useConfig();

  // Show loading while checking config
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If already setup, redirect to home
  if (isSetup) {
    return <Navigate to="/" replace />;
  }

  // Pass onSetupComplete to SetupView
  return <SetupView onSetupComplete={onSetupComplete} />;
}

const router = createBrowserRouter([
  {
    path: "/setup",
    element: <SetupPageGuard />,
  },
  {
    element: (
      <SetupGuard>
        <Layout />
      </SetupGuard>
    ),
    children: [
      {
        path: "/",
        element: <DashboardView />,
      },
      {
        path: "/team-matrix",
        element: <TeamMatrixPage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <SessionExpiredModal />
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
