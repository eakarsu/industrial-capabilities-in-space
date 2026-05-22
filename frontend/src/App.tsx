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
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

import GapRegolithProcessOptimizer from './pages/GapRegolithProcessOptimizer';
import GapLunarNightPower from './pages/GapLunarNightPower';
import GapOrbitalMechanicsRouting from './pages/GapOrbitalMechanicsRouting';
import GapPrintQualityPredictor from './pages/GapPrintQualityPredictor';
import GapCrewTaskSequencer from './pages/GapCrewTaskSequencer';
import GapSimulationTwin from './pages/GapSimulationTwin';
import GapCommsLatencyQueue from './pages/GapCommsLatencyQueue';
import GapMissionVideoStream from './pages/GapMissionVideoStream';
import GapIsruYield from './pages/GapIsruYield';
import GapPrintCadUpload from './pages/GapPrintCadUpload';
import CfRegolithElectrolysis from './pages/CfRegolithElectrolysis';
import CfLunarHibernation from './pages/CfLunarHibernation';
import CfLunarMarketplace from './pages/CfLunarMarketplace';
import CfTeleopEvaAgent from './pages/CfTeleopEvaAgent';
import CfIsruCertPipeline from './pages/CfIsruCertPipeline';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="custom-views" element={<CustomViewsPage />} />

          {/* Apply pass 7 — audit-gap feature pages (cf + gap) */}
          <Route path="gap/regolith-process-optimizer" element={<GapRegolithProcessOptimizer />} />
          <Route path="gap/lunar-night-power" element={<GapLunarNightPower />} />
          <Route path="gap/orbital-mechanics-routing" element={<GapOrbitalMechanicsRouting />} />
          <Route path="gap/print-quality-predictor" element={<GapPrintQualityPredictor />} />
          <Route path="gap/crew-task-sequencer" element={<GapCrewTaskSequencer />} />
          <Route path="gap/simulation-twin" element={<GapSimulationTwin />} />
          <Route path="gap/comms-latency-queue" element={<GapCommsLatencyQueue />} />
          <Route path="gap/mission-video-stream" element={<GapMissionVideoStream />} />
          <Route path="gap/isru-yield" element={<GapIsruYield />} />
          <Route path="gap/print-cad-upload" element={<GapPrintCadUpload />} />
          <Route path="cf/regolith-electrolysis" element={<CfRegolithElectrolysis />} />
          <Route path="cf/lunar-hibernation" element={<CfLunarHibernation />} />
          <Route path="cf/lunar-marketplace" element={<CfLunarMarketplace />} />
          <Route path="cf/teleop-eva-agent" element={<CfTeleopEvaAgent />} />
          <Route path="cf/isru-cert-pipeline" element={<CfIsruCertPipeline />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
