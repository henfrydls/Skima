import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/layout';
import { DashboardView, TeamMatrixPage, ReportsPage, SettingsPage } from './pages';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

const router = createBrowserRouter([
  {
    element: <Layout />,
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
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;

