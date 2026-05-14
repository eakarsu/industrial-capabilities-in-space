const resources = [
  {
    name: 'Silicon (Si)',
    quantity: 149,
    purity: 98.2,
    capacity: 500,
    extractionRate: 7.4,
    color: 'bg-blue-500',
  },
  {
    name: 'Aluminium (Al)',
    quantity: 62,
    purity: 95.7,
    capacity: 300,
    extractionRate: 3.1,
    color: 'bg-amber-500',
  },
  {
    name: 'Iron (Fe)',
    quantity: 50,
    purity: 91.3,
    capacity: 400,
    extractionRate: 2.5,
    color: 'bg-orange-500',
  },
  {
    name: 'Titanium (Ti)',
    quantity: 10,
    purity: 99.1,
    capacity: 100,
    extractionRate: 0.5,
    color: 'bg-purple-500',
  },
  {
    name: 'Calcium (Ca)',
    quantity: 34,
    purity: 87.4,
    capacity: 200,
    extractionRate: 1.7,
    color: 'bg-teal-500',
  },
  {
    name: 'Magnesium (Mg)',
    quantity: 18,
    purity: 93.6,
    capacity: 150,
    extractionRate: 0.9,
    color: 'bg-pink-500',
  },
  {
    name: 'Oxygen (O2)',
    quantity: 210,
    purity: 99.9,
    capacity: 500,
    extractionRate: 10.5,
    color: 'bg-cyan-500',
  },
  {
    name: 'Regolith (raw)',
    quantity: 1240,
    purity: 0,
    capacity: 5000,
    extractionRate: 62,
    color: 'bg-gray-500',
  },
]

export default function ResourceInventory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Resource Inventory</h2>
        <div className="text-xs text-gray-400">Last updated: Sol 847 14:32 LST</div>
      </div>

      {/* Visual stockpile bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.slice(0, 4).map((r) => {
          const pct = Math.round((r.quantity / r.capacity) * 100)
          return (
            <div key={r.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-200 mb-1">{r.name}</div>
              <div className="text-2xl font-bold text-white">{r.quantity} <span className="text-sm text-gray-400">kg</span></div>
              <div className="mt-3 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${r.color}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{pct}% of {r.capacity}kg</span>
                {r.purity > 0 && <span className="text-xs text-green-400">{r.purity}% pure</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full inventory table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Resource</th>
              <th className="text-right px-5 py-3">Quantity (kg)</th>
              <th className="text-right px-5 py-3">Purity %</th>
              <th className="px-5 py-3 w-48">Storage</th>
              <th className="text-right px-5 py-3">Rate (kg/hr)</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const pct = Math.round((r.quantity / r.capacity) * 100)
              return (
                <tr key={r.name} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-200">{r.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-white">{r.quantity.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    {r.purity > 0 ? (
                      <span className={`${r.purity >= 95 ? 'text-green-400' : r.purity >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
                        {r.purity}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.color}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-amber-400">{r.extractionRate}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
