import CapabilityMaturityChart from '../components/CapabilityMaturityChart';
import CapabilityOrbitHeatmap from '../components/CapabilityOrbitHeatmap';
import CapabilityAssessmentPDF from '../components/CapabilityAssessmentPDF';
import CapabilityRulesEditor from '../components/CapabilityRulesEditor';
import { Satellite } from 'lucide-react';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6" data-testid="custom-views-page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-blue-500/40 flex items-center justify-center">
          <Satellite className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Space Cap Views</h1>
          <p className="text-gray-400 text-sm">Cross-cutting visualizations and editors for industrial capabilities in space.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CapabilityMaturityChart />
        <CapabilityOrbitHeatmap />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CapabilityAssessmentPDF />
        <CapabilityRulesEditor />
      </div>
    </div>
  );
}
