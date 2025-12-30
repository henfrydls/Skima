import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { DashboardView, TeamMatrixPage, ReportsPage } from './pages';

// Settings placeholder (se implementará en fases posteriores)
function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p className="text-gray-600 mt-1">
        Configuración de la aplicación - Próximamente
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/team-matrix" element={<TeamMatrixPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;
