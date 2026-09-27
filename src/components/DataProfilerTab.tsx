import React, { useState } from 'react';
import { ProfileSummary } from '../types';
import { Database, FileSpreadsheet, AlertTriangle, Cpu, BarChart2 } from 'lucide-react';

interface Props {
  profile: ProfileSummary;
}

export const DataProfilerTab: React.FC<Props> = ({ profile }) => {
  const [selectedCol, setSelectedCol] = useState<string>(
    profile.numericCols[0] || (profile.columns[0]?.name ?? '')
  );

  const stats = profile.numericStats[selectedCol];

  return (
    <div className="space-y-6">
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rows</span>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {profile.totalRows.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Populated tabular records</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Columns</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {profile.totalColumns}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile.numericCols.length} numeric, {profile.categoricalCols.length} text
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missing Rate</span>
            <div className={`p-2 rounded-lg ${profile.totalMissing > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {profile.missingRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile.totalMissing} empty or null cells
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Memory Footprint</span>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {profile.estimatedMemoryKB} KB
            </div>
            <p className="text-xs text-slate-500 mt-1">In-memory buffer size</p>
          </div>
        </div>
      </div>

      {/* Schema & Column Profiling Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Automated Column Schema & Data Integrity Profile
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Type inference, cardinality assessment, and missing value breakdown
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {profile.columns.length} Total Fields
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Inferred Type</th>
                <th className="px-4 py-3">Unique Values</th>
                <th className="px-4 py-3">Missing Cells</th>
                <th className="px-4 py-3">Missing %</th>
                <th className="px-4 py-3">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {profile.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-200">{col.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                        col.type === 'number'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : col.type === 'date'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {col.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{col.uniqueCount}</td>
                  <td className="px-4 py-3">
                    <span className={col.missingCount > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {col.missingCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${col.missingPct > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(col.missingPct, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-slate-400">{col.missingPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={String(col.sample)}>
                    {String(col.sample)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Numerical Descriptive Statistics */}
      {profile.numericCols.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Descriptive Numerical Statistics (Pandas `describe()`)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Deterministic computation of central tendencies, dispersion, and quartiles
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950/80 uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Statistic</th>
                    {profile.numericCols.map((col) => (
                      <th key={col} className="px-3 py-2.5 text-right">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {['count', 'mean', 'std', 'min', 'p25', 'p50', 'p75', 'max'].map((statKey) => (
                    <tr key={statKey} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2 font-sans font-semibold text-indigo-400 uppercase text-[11px]">
                        {statKey === 'p25' ? '25%' : statKey === 'p50' ? '50% (Median)' : statKey === 'p75' ? '75%' : statKey}
                      </td>
                      {profile.numericCols.map((col) => {
                        const val = profile.numericStats[col]?.[statKey as keyof typeof stats];
                        return (
                          <td key={col} className="px-3 py-2 text-right text-slate-200">
                            {val !== undefined ? val.toLocaleString() : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Inspector for Selected Numeric Metric */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Metric Deep Dive
                </h3>
              </div>
              <label className="text-xs text-slate-400 mb-1.5 block">Select Numeric Column:</label>
              <select
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 mb-4"
              >
                {profile.numericCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              {stats && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Mean (Average):</span>
                    <span className="font-mono font-semibold text-indigo-400">{stats.mean.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Standard Deviation:</span>
                    <span className="font-mono text-slate-300">{stats.std.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Range [Min — Max]:</span>
                    <span className="font-mono text-slate-300">
                      {stats.min.toLocaleString()} — {stats.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Interquartile [25% — 75%]:</span>
                    <span className="font-mono text-slate-300">
                      {stats.p25.toLocaleString()} — {stats.p75.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-300">
              💡 <strong>Deterministic Fact:</strong> These statistics are strictly computed across the loaded dataframe in memory with zero hallucinations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
