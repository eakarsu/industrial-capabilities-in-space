import { useState } from 'react'

type JobStatus = 'queued' | 'printing' | 'completed' | 'failed'

type Job = {
  id: string
  structure: string
  material: string
  mass: number
  status: JobStatus
  successRate: number
  completionTime: string
  progress?: number
}

const initialJobs: Job[] = [
  { id: 'JOB-001', structure: 'Habitat Panel 4x4', material: 'Al/Si composite', mass: 12.4, status: 'completed', successRate: 99.2, completionTime: '2026-05-05 11:20' },
  { id: 'JOB-002', structure: 'Solar Mount Bracket', material: 'Ti alloy', mass: 1.8, status: 'completed', successRate: 98.7, completionTime: '2026-05-05 12:15' },
  { id: 'JOB-003', structure: 'Antenna Bracket Type-B', material: 'Al alloy', mass: 0.9, status: 'completed', successRate: 99.5, completionTime: '2026-05-05 12:58' },
  { id: 'JOB-004', structure: 'Regolith Container', material: 'Fe/Al blend', mass: 8.2, status: 'completed', successRate: 97.1, completionTime: '2026-05-05 13:05' },
  { id: 'JOB-005', structure: 'Pressure Seal Ring', material: 'Si ceramic', mass: 0.4, status: 'completed', successRate: 99.8, completionTime: '2026-05-05 13:22' },
  { id: 'JOB-006', structure: 'Structural Truss Seg.', material: 'Al/Ti composite', mass: 6.7, status: 'completed', successRate: 98.3, completionTime: '2026-05-05 13:44' },
  { id: 'JOB-007', structure: 'Habitat Panel 2x4', material: 'Al/Si composite', mass: 7.1, status: 'completed', successRate: 99.1, completionTime: '2026-05-05 14:02' },
  { id: 'JOB-008', structure: 'Solar Mount Frame', material: 'Al alloy', mass: 4.3, status: 'printing', successRate: 0, completionTime: '~14:55 est.', progress: 67 },
  { id: 'JOB-009', structure: 'Antenna Bracket Type-A', material: 'Ti alloy', mass: 1.1, status: 'queued', successRate: 0, completionTime: 'Pending' },
  { id: 'JOB-010', structure: 'Regolith Shovel Head', material: 'Fe alloy', mass: 2.6, status: 'queued', successRate: 0, completionTime: 'Pending' },
]

const statusColors: Record<JobStatus, string> = {
  queued: 'bg-gray-700 text-gray-300',
  printing: 'bg-amber-900/60 text-amber-300',
  completed: 'bg-green-900/60 text-green-400',
  failed: 'bg-red-900/60 text-red-400',
}

export default function PrintJobs() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [showModal, setShowModal] = useState(false)
  const [newJob, setNewJob] = useState({ structure: 'Habitat Panel 4x4', material: 'Al/Si composite', mass: '5.0' })

  const handleAddJob = () => {
    const id = `JOB-${String(jobs.length + 1).padStart(3, '0')}`
    setJobs([...jobs, {
      id,
      structure: newJob.structure,
      material: newJob.material,
      mass: parseFloat(newJob.mass),
      status: 'queued',
      successRate: 0,
      completionTime: 'Pending',
    }])
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Print Job Queue</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New Job
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length, color: 'text-green-400' },
          { label: 'Printing', value: jobs.filter(j => j.status === 'printing').length, color: 'text-amber-400' },
          { label: 'Queued', value: jobs.filter(j => j.status === 'queued').length, color: 'text-gray-300' },
          { label: 'Failed', value: jobs.filter(j => j.status === 'failed').length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Job Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Job ID</th>
              <th className="text-left px-5 py-3">Structure Type</th>
              <th className="text-left px-5 py-3">Material</th>
              <th className="text-right px-5 py-3">Mass (kg)</th>
              <th className="text-center px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Success Rate</th>
              <th className="text-right px-5 py-3">Completion</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3 font-mono text-orange-400 text-xs">{job.id}</td>
                <td className="px-5 py-3 text-gray-200">{job.structure}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{job.material}</td>
                <td className="px-5 py-3 text-right font-mono text-white">{job.mass}</td>
                <td className="px-5 py-3 text-center">
                  <div className="space-y-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                      {job.status}
                    </span>
                    {job.status === 'printing' && job.progress !== undefined && (
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden w-24 mx-auto">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${job.progress}%` }}></div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  {job.status === 'completed' ? (
                    <span className="text-green-400 font-mono">{job.successRate}%</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-400">{job.completionTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">New Print Job</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Structure Type</label>
                <select
                  value={newJob.structure}
                  onChange={(e) => setNewJob({...newJob, structure: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Habitat Panel 4x4</option>
                  <option>Habitat Panel 2x4</option>
                  <option>Solar Mount Bracket</option>
                  <option>Solar Mount Frame</option>
                  <option>Antenna Bracket Type-A</option>
                  <option>Antenna Bracket Type-B</option>
                  <option>Structural Truss Seg.</option>
                  <option>Regolith Container</option>
                  <option>Regolith Shovel Head</option>
                  <option>Pressure Seal Ring</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Material</label>
                <select
                  value={newJob.material}
                  onChange={(e) => setNewJob({...newJob, material: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Al/Si composite</option>
                  <option>Al alloy</option>
                  <option>Ti alloy</option>
                  <option>Fe alloy</option>
                  <option>Fe/Al blend</option>
                  <option>Al/Ti composite</option>
                  <option>Si ceramic</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Mass (kg)</label>
                <input
                  type="number"
                  value={newJob.mass}
                  onChange={(e) => setNewJob({...newJob, mass: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  step="0.1" min="0.1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddJob}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Add to Queue
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
