import { useState } from 'react'

type Location = 'Mare Tranquillitatis' | 'Shackleton Crater' | 'Aristarchus Plateau'

type DayResult = {
  day: number
  regolith: number
  si: number
  al: number
  fe: number
  ti: number
  printJobs: number
  power: number
}

const locationMultipliers: Record<Location, { regolith: number; ti: number; power: number }> = {
  'Mare Tranquillitatis': { regolith: 1.0, ti: 1.0, power: 0.87 },
  'Shackleton Crater': { regolith: 0.8, ti: 1.4, power: 1.15 },
  'Aristarchus Plateau': { regolith: 1.3, ti: 0.7, power: 0.95 },
}

function generateResults(days: number, location: Location): DayResult[] {
  const mult = locationMultipliers[location]
  const results: DayResult[] = []
  for (let d = 1; d <= days; d++) {
    const variation = 0.85 + Math.sin(d * 1.7) * 0.15
    const regolith = Math.round(120 * mult.regolith * variation)
    results.push({
      day: d,
      regolith,
      si: Math.round(regolith * 0.12),
      al: Math.round(regolith * 0.05),
      fe: Math.round(regolith * 0.04),
      ti: Math.round(regolith * 0.008 * mult.ti),
      printJobs: Math.floor(1 + variation * 1.5),
      power: Math.round(mult.power * 87 * variation),
    })
  }
  return results
}

export default function SimulationPanel() {
  const [days, setDays] = useState(7)
  const [location, setLocation] = useState<Location>('Mare Tranquillitatis')
  const [results, setResults] = useState<DayResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => {
      setResults(generateResults(days, location))
      setRunning(false)
    }, 800)
  }

  const totals = results ? {
    regolith: results.reduce((s, r) => s + r.regolith, 0),
    si: results.reduce((s, r) => s + r.si, 0),
    al: results.reduce((s, r) => s + r.al, 0),
    fe: results.reduce((s, r) => s + r.fe, 0),
    ti: results.reduce((s, r) => s + r.ti, 0),
    printJobs: results.reduce((s, r) => s + r.printJobs, 0),
  } : null

  const maxRegolith = results ? Math.max(...results.map(r => r.regolith)) : 1

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Simulation Panel</h2>

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Simulation Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Lunar Days: <span className="text-orange-400 font-bold text-sm">{days}</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1</span><span>30</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as Location)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option>Mare Tranquillitatis</option>
              <option>Shackleton Crater</option>
              <option>Aristarchus Plateau</option>
            </select>
          </div>
          <div>
            <button
              onClick={handleRun}
              disabled={running}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-black font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              {running ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {results && totals && (
        <>
          {/* Cumulative totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Regolith</div>
              <div className="text-2xl font-bold text-amber-400">{totals.regolith.toLocaleString()} <span className="text-sm">kg</span></div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Silicon Extracted</div>
              <div className="text-2xl font-bold text-blue-400">{totals.si} <span className="text-sm">kg</span></div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Al + Fe + Ti</div>
              <div className="text-2xl font-bold text-orange-400">{totals.al + totals.fe + totals.ti} <span className="text-sm">kg</span></div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Print Jobs</div>
              <div className="text-2xl font-bold text-green-400">{totals.printJobs}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Daily Regolith Extraction</h3>
            <div className="flex items-end gap-1" style={{ height: '120px' }}>
              {results.map((r) => (
                <div key={r.day} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full bg-amber-500 rounded-t hover:bg-amber-400 transition-colors cursor-default"
                    style={{ height: `${(r.regolith / maxRegolith) * 100}px` }}
                    title={`Day ${r.day}: ${r.regolith} kg`}
                  ></div>
                  {days <= 15 && (
                    <div className="text-xs text-gray-600">{r.day}</div>
                  )}
                </div>
              ))}
            </div>
            {days > 15 && (
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Day 1</span>
                <span>Day {Math.floor(days / 2)}</span>
                <span>Day {days}</span>
              </div>
            )}
          </div>

          {/* Per-day table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Day</th>
                  <th className="text-right px-5 py-3">Regolith (kg)</th>
                  <th className="text-right px-5 py-3">Si (kg)</th>
                  <th className="text-right px-5 py-3">Al (kg)</th>
                  <th className="text-right px-5 py-3">Fe (kg)</th>
                  <th className="text-right px-5 py-3">Ti (kg)</th>
                  <th className="text-right px-5 py-3">Print Jobs</th>
                  <th className="text-right px-5 py-3">Power %</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.day} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-2.5 text-gray-400 font-mono">Day {r.day}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-amber-400">{r.regolith}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-blue-400">{r.si}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-amber-300">{r.al}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-orange-400">{r.fe}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-purple-400">{r.ti}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-green-400">{r.printJobs}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-gray-300">{r.power}%</td>
                  </tr>
                ))}
                <tr className="bg-gray-800/60 font-semibold">
                  <td className="px-5 py-2.5 text-orange-400 text-xs uppercase">Totals</td>
                  <td className="px-5 py-2.5 text-right font-mono text-amber-400">{totals.regolith}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-blue-400">{totals.si}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-amber-300">{totals.al}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-orange-400">{totals.fe}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-purple-400">{totals.ti}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-green-400">{totals.printJobs}</td>
                  <td className="px-5 py-2.5 text-right text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {!results && !running && (
        <div className="flex items-center justify-center h-48 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="text-center">
            <div className="text-gray-600 text-4xl mb-3">🌑</div>
            <p className="text-gray-500">Configure parameters and run simulation to see results</p>
          </div>
        </div>
      )}

      {running && (
        <div className="flex items-center justify-center h-48 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="text-center">
            <div className="text-orange-400 text-2xl mb-3 animate-pulse">Computing...</div>
            <p className="text-gray-500 text-sm">Running {days}-day simulation at {location}</p>
          </div>
        </div>
      )}
    </div>
  )
}
