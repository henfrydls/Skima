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

// Main pages — loaded eagerly for instant navigation (small bundle)
import DashboardView from './pages/DashboardView';
import TeamMatrixPage from './pages/TeamMatrixPage';
import EvolutionPage from './pages/EvolutionPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Separate flows — lazy loaded (user may never visit these)
const SetupView = lazy(() => import('./pages/SetupView'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DemoEntry = lazy(() => import('./pages/DemoEntry'));

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

// Landing page guard: show landing when isOnlineDemo && no demo_active cookie
function LandingGuard({ children }) {
  const { isOnlineDemo } = useConfig();
  const hasDemoCookie = document.cookie.includes('demo_active=true');

  if (isOnlineDemo && !hasDemoCookie) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    );
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/setup",
    element: <SetupPageGuard />,
  },
  {
    path: "/demo",
    element: <Suspense fallback={<PageLoader />}><DemoEntry /></Suspense>,
  },
  {
    element: (
      <LandingGuard>
        <SetupGuard>
          <Layout />
        </SetupGuard>
      </LandingGuard>
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
        path: "/evolution",
        element: <EvolutionPage />,
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

function AuthWithConfig({ children }) {
  const { config } = useConfig();
  return <AuthProvider config={config}>{children}</AuthProvider>;
}

function App() {
  return (
    <ConfigProvider>
      <AuthWithConfig>
        <RouterProvider router={router} />
        <SessionExpiredModal />
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </AuthWithConfig>
    </ConfigProvider>
  );
}

export default App;
