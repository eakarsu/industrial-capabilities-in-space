const activityFeed = [
  { time: '14:28', op: 'Regolith extraction', location: 'Zone B-4', result: 'Success', kg: 32 },
  { time: '14:15', op: 'Silicon separation', location: 'Processor Unit 2', result: 'Success', kg: 18 },
  { time: '13:52', op: '3D print job #008', location: 'Fab Lab', result: 'In Progress', kg: null },
  { time: '13:31', op: 'Aluminium smelting', location: 'Smelter A', result: 'Success', kg: 11 },
  { time: '13:10', op: 'Iron oxide reduction', location: 'Reactor 1', result: 'Success', kg: 8 },
]

const materials = [
  { symbol: 'Si', name: 'Silicon', kg: 149, color: 'text-blue-400' },
  { symbol: 'Al', name: 'Aluminium', kg: 62, color: 'text-amber-400' },
  { symbol: 'Fe', name: 'Iron', kg: 50, color: 'text-orange-400' },
  { symbol: 'Ti', name: 'Titanium', kg: 10, color: 'text-purple-400' },
]

export default function OperationsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Operations Dashboard</h2>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Power */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Power Capacity</div>
          <div className="text-3xl font-bold text-orange-400">87%</div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '87%' }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Solar + RTG hybrid</div>
        </div>

        {/* Regolith */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Regolith Mined</div>
          <div className="text-3xl font-bold text-amber-400">1,240 <span className="text-lg">kg</span></div>
          <div className="text-xs text-gray-500 mt-3">Today: +127 kg</div>
          <div className="text-xs text-green-400 mt-1">+11.4% vs yesterday</div>
        </div>

        {/* Materials Extracted */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Materials Extracted</div>
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m.symbol} className="flex justify-between items-center">
                <span className={`text-sm font-mono font-bold ${m.color}`}>{m.symbol}</span>
                <span className="text-sm text-gray-300">{m.name}</span>
                <span className="text-sm font-semibold text-white">{m.kg} kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Print Jobs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Print Jobs Completed</div>
          <div className="text-3xl font-bold text-green-400">7</div>
          <div className="text-xs text-gray-500 mt-3">1 in progress</div>
          <div className="text-xs text-amber-400 mt-1">0 failures today</div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Recent Operations</h3>
        <div className="space-y-3">
          {activityFeed.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-800 last:border-0">
              <div className="text-xs font-mono text-gray-500 w-10 shrink-0">{item.time}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-200">{item.op}</div>
                <div className="text-xs text-gray-500">{item.location}</div>
              </div>
              {item.kg !== null && (
                <div className="text-xs text-amber-400 font-mono shrink-0">+{item.kg} kg</div>
              )}
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                item.result === 'Success' ? 'bg-green-900/50 text-green-400' :
                item.result === 'In Progress' ? 'bg-amber-900/50 text-amber-400' :
                'bg-red-900/50 text-red-400'
              }`}>
                {item.result}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System status grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Excavator Unit A', status: 'Active', detail: 'Zone B-4 • 18 kg/hr' },
          { name: 'Processor Unit 2', status: 'Active', detail: 'Si separation • 94% eff.' },
          { name: 'Fab Lab', status: 'Printing', detail: 'Job #008 • 67% complete' },
          { name: 'Water Extractor', status: 'Standby', detail: 'Ice deposits depleted' },
          { name: 'Solar Array Alpha', status: 'Active', detail: '4.2 kW generating' },
          { name: 'Life Support Sys', status: 'Active', detail: 'O2: 21.1% • CO2: 0.04%' },
        ].map((sys, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-300">{sys.name}</span>
              <span className={`w-2 h-2 rounded-full ${
                sys.status === 'Active' || sys.status === 'Printing' ? 'bg-green-400' : 'bg-yellow-400'
              }`}></span>
            </div>
            <div className="text-xs text-gray-500">{sys.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
