import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import BasesPage from './pages/BasesPage';
import MiningPage from './pages/MiningPage';
import ResourcesPage from './pages/ResourcesPage';
import PrintJobsPage from './pages/PrintJobsPage';
import EquipmentPage from './pages/EquipmentPage';
import MissionsPage from './pages/MissionsPage';
import AICenterPage from './pages/AICenterPage';
import UtilitiesPage from './pages/UtilitiesPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';
import OrbitalPlatformsPage from './pages/OrbitalPlatformsPage';
import IsruPage from './pages/IsruPage';
import LaunchEconomicsPage from './pages/LaunchEconomicsPage';
import MicrogravityProductsPage from './pages/MicrogravityProductsPage';
import ServicingPage from './pages/ServicingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bases" element={<BasesPage />} />
          <Route path="mining" element={<MiningPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="print_jobs" element={<PrintJobsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="missions" element={<MissionsPage />} />
          <Route path="ai" element={<AICenterPage />} />
          <Route path="ai_lab" element={<Navigate to="/ai" replace />} />
          <Route path="utilities" element={<UtilitiesPage />} />
          <Route path="sample_data" element={<SampleDataPage />} />
          <Route path="orbital-platforms" element={<OrbitalPlatformsPage />} />
          <Route path="isru" element={<IsruPage />} />
          <Route path="launch-economics" element={<LaunchEconomicsPage />} />
          <Route path="microgravity-products" element={<MicrogravityProductsPage />} />
          <Route path="servicing" element={<ServicingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
