import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { DashboardView, TeamMatrixPage, ReportsPage, SettingsPage } from './pages';


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
