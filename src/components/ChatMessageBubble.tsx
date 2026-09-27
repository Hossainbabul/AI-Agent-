import React, { useState } from 'react';
import { ChatMessage, ChartDataPoint } from '../types';
import { Bot, User, Code, CheckCircle, Copy, Check, BarChart3, PieChart as PieIcon } from 'lucide-react';

interface Props {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<Props> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const isUser = message.role === 'user';
  const isUrdu = message.language === 'ur';
  const isBengali = message.language === 'bn';

  const handleCopyCode = () => {
    if (!message.generatedCode) return;
    navigator.clipboard.writeText(message.generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl w-full ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Author & Language Badge */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {isUser ? 'You' : 'Data Se Baatein'}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              message.language === 'ur'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : message.language === 'bn'
                ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}
          >
            {message.language === 'ur' ? 'اردو Urdu' : message.language === 'bn' ? 'বাংলা Bengali' : 'English'}
          </span>
          <span className="text-[10px] text-slate-600">{message.timestamp}</span>
        </div>

        {/* Message Card */}
        <div
          className={`rounded-2xl p-4 shadow-lg text-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs'
          }`}
        >
          {/* Main Text Content */}
          <div
            className={`leading-relaxed ${
              isUrdu
                ? 'text-right font-serif text-base leading-loose dir-rtl'
                : isBengali
                ? 'text-sm font-sans leading-relaxed'
                : 'text-sm'
            }`}
            style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
          >
            {message.content}
          </div>

          {/* Render Table Data if available */}
          {message.tableData && message.tableData.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    {Object.keys(message.tableData[0]).map((k) => (
                      <th key={k} className="px-3 py-2 font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                  {message.tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      {Object.values(row).map((v: any, j) => (
                        <td key={j} className="px-3 py-1.5 whitespace-nowrap text-slate-200">
                          {typeof v === 'number' ? v.toLocaleString() : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Render Interactive Chart if available */}
          {message.chart && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {message.chart.type === 'pie' ? (
                    <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  {message.chart.title}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">Plotly Dark Engine</span>
              </div>

              {/* Chart Visualizer */}
              {message.chart.type === 'pie' ? (
                <div className="space-y-2">
                  {message.chart.data.map((dp: ChartDataPoint, idx: number) => {
                    const total = message.chart?.data.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    const pct = ((dp.value / total) * 100).toFixed(1);
                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500', 'bg-cyan-500'];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={dp.label} className="text-xs">
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>{dp.label}</span>
                          <span className="font-mono text-slate-400">
                            ${dp.value.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {message.chart.data.map((dp: ChartDataPoint, idx: number) => {
                    const maxVal = Math.max(...(message.chart?.data.map((d) => d.value) || [1]));
                    const barPct = ((dp.value / maxVal) * 100).toFixed(1);
                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500'];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={dp.label} className="text-xs">
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span className="font-medium">{dp.label}</span>
                          <span className="font-mono font-semibold text-slate-200">
                            ${dp.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${barPct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Deterministic Guardrail Badge & Code Accordion */}
          {message.generatedCode && !isUser && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Computed deterministically via Pandas (0% hallucination)</span>
                </div>

                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors px-2 py-0.5 rounded bg-slate-800/60"
                >
                  <Code className="w-3 h-3" />
                  {showCode ? 'Hide Code' : 'View Code'}
                </button>
              </div>

              {showCode && (
                <div className="mt-2.5 relative rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                    <span>Python / Pandas Sandbox</span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-indigo-200 py-1 leading-relaxed">
                    {message.generatedCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 shadow">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
