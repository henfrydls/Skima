import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionExpiredModal from './components/common/SessionExpiredModal';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import './lib/dataPreload'; // Prefetch /api/data in parallel with config

// Code-split page components
const DashboardView = lazy(() => import('./pages/DashboardView'));
const TeamMatrixPage = lazy(() => import('./pages/TeamMatrixPage'));
const EvolutionPage = lazy(() => import('./pages/EvolutionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SetupView = lazy(() => import('./pages/SetupView'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

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

// Route guard: Prevents accessing /setup if already set up (unless in demo mode)
function SetupPageGuard() {
  const { isLoading, isSetup, isDemo, onSetupComplete } = useConfig();

  // Show loading while checking config
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If already setup AND not in demo mode, redirect to home
  if (isSetup && !isDemo) {
    return <Navigate to="/" replace />;
  }

  // Pass onSetupComplete to SetupView
  return (
    <Suspense fallback={<PageLoader />}>
      <SetupView onSetupComplete={onSetupComplete} />
    </Suspense>
  );
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
        element: <Suspense fallback={<PageLoader />}><DashboardView /></Suspense>,
      },
      {
        path: "/team-matrix",
        element: <Suspense fallback={<PageLoader />}><TeamMatrixPage /></Suspense>,
      },
      {
        path: "/evolution",
        element: <Suspense fallback={<PageLoader />}><EvolutionPage /></Suspense>,
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
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
