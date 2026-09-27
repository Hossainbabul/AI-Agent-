/**
 * Data Se Baatein (ڈیٹا سے باتیں / ডেটার সাথে কথা)
 * Enterprise-Grade Conversational Data Intelligence Agent
 * React & Vite Showcase and Companion Interface
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Database,
  Key,
  ShieldCheck,
  Send,
  Upload,
  Sparkles,
  BarChart2,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  MessageSquare,
  Globe,
  Lock,
} from 'lucide-react';
import { DataRow, ChatMessage, SupportedLanguage } from './types';
import { DEFAULT_ECOMMERCE_DATA } from './data/defaultData';
import { profileDataset } from './services/profiler';
import { executeDeterministicQuery, detectLanguage } from './services/deterministicEngine';
import { parseUploadedFile, SAMPLE_PDF_DATA } from './services/fileParser';
import { DataProfilerTab } from './components/DataProfilerTab';
import { DataExplorerTab } from './components/DataExplorerTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { ChatMessageBubble } from './components/ChatMessageBubble';

export default function App() {
  // State: Dataset
  const [dataset, setDataset] = useState<DataRow[]>(DEFAULT_ECOMMERCE_DATA);
  const [datasetName, setDatasetName] = useState<string>('Built-in E-Commerce Sales (Fallback)');

  // State: BYOK API Key
  const [apiKey, setApiKey] = useState<string>('');
  const [keySource, setKeySource] = useState<string>('Not Configured');
  const [model, setModel] = useState<string>('gpt-4o-mini');

  // State: Navigation
  const [activeTab, setActiveTab] = useState<'chat' | 'profiler' | 'explorer' | 'arch'>('chat');

  // State: Chat
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        '👋 Welcome to Data Se Baatein (ڈیٹا سے باتیں / ডেটার সাথে কথা)!\n\n' +
        'I am your Conversational Data Intelligence Agent. Ask analytical queries in English, Urdu (اردو), or Bengali (বাংলা). ' +
        'All answers are computed deterministically from the loaded data with zero hallucination.',
      language: 'en',
      timestamp: 'Just now',
    },
  ]);

  // Automated Data Profile calculation
  const profile = useMemo(() => profileDataset(dataset), [dataset]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle CSV / PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { rows, type } = await parseUploadedFile(file);
      if (rows.length === 0) return;

      const headers = Object.keys(rows[0]);
      setDataset(rows);
      setDatasetName(file.name);

      // Add system notification in chat
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          content: `${type === 'pdf' ? '📄' : '📁'} Ingested **${type.toUpperCase()} dataset**: **${file.name}** (${rows.length} rows, ${headers.length} columns). Automated profile recalculated and ready for natural language interrogation.`,
          language: 'en',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('File Ingestion Error:', err);
    }
  };

  // Reset to default sample dataset
  const handleResetSample = () => {
    setDataset(DEFAULT_ECOMMERCE_DATA);
    setDatasetName('Built-in E-Commerce Sales (Fallback)');
  };

  // Load sample PDF report dataset
  const handleLoadSamplePdf = () => {
    setDataset(SAMPLE_PDF_DATA);
    setDatasetName('sample_ecommerce_report.pdf (Extracted PDF Report)');
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: 'assistant',
        content: `📄 Loaded sample PDF dataset: **sample_ecommerce_report.pdf** (${SAMPLE_PDF_DATA.length} rows, ${Object.keys(SAMPLE_PDF_DATA[0]).length} columns). You can now explore, filter, export, and ask questions!`,
        language: 'en',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Send Chat Query
  const handleSendQuery = (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query) return;

    if (!apiKey) {
      return; // Handled by disabled input and banner
    }

    const detectedLang = detectLanguage(query);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      language: detectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    // Run deterministic query engine with simulated processing time
    setTimeout(() => {
      const result = executeDeterministicQuery(query, dataset, apiKey, model);

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        language: result.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedCode: result.code,
        tableData: result.tableData,
        chart: result.chart,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 600);
  };

  const samplePrompts = [
    { lang: '🇬🇧 EN', text: 'What is the total sales and total profit by product category?' },
    { lang: '🇵🇰 UR', text: 'کس پروڈکٹ کیٹگری میں سب سے زیادہ منافع ہوا ہے؟' },
    { lang: '🇧🇩 BN', text: 'কোন ক্যাটাগরিতে সবচেয়ে বেশি বিক্রি ও লাভ হয়েছে?' },
    { lang: '🇬🇧 EN', text: 'Show sales performance by geographic region' },
    { lang: '🇵🇰 UR', text: 'سب سے زیادہ بکنے والی مصنوعات کی فہرست دکھائیں' },
    { lang: '🇧🇩 BN', text: 'অঞ্চল অনুযায়ী বিক্রির চার্ট ও লাভ দেখান' },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ---------------------------------------------------------------------- */}
      {/* SIDEBAR: BYOK Key Management, Dataset Ingestion & Quick Prompts        */}
      {/* ---------------------------------------------------------------------- */}
      <aside className="w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Data Se Baatein
              </h1>
              <p className="text-[10px] text-slate-400">Conversational Data Agent</p>
            </div>
          </div>
        </div>

        {/* BYOK Security Module */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              BYOK Security Key
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                apiKey
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {apiKey ? 'Active' : 'Missing'}
            </span>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setKeySource(e.target.value ? 'User Session (Sidebar)' : 'Not Configured');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {apiKey ? (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key resolved via {keySource}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-amber-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Strict BYOK Architecture
              </div>
              <p className="text-[10px] text-slate-400">
                1. Streamlit runtime secrets (<code>st.secrets</code>)<br />
                2. Session password field above
              </p>
              <button
                onClick={() => {
                  setApiKey('sk-proj-demo-byok-key-verified');
                  setKeySource('Quick Demo Key');
                }}
                className="mt-1.5 w-full text-center py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-semibold transition-colors"
              >
                Insert Demo Key (Instant Test)
              </button>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Agent Engine Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (Fast & Deterministic)</option>
            <option value="gpt-4o">gpt-4o (High-Reasoning)</option>
          </select>
        </div>

        {/* Dataset Ingestion */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Dataset Ingestion
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">CSV</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono border border-rose-800">PDF</span>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-3.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
            <Upload className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">Upload CSV or PDF Dataset</span>
            <span className="text-[10px] text-slate-400 text-center mt-0.5">
              Supports CSV tabular files & PDF document reports
            </span>
            <input type="file" accept=".csv,.pdf" onChange={handleFileUpload} className="hidden" />
          </label>

          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="truncate font-medium text-slate-300" title={datasetName}>
              {datasetName.toLowerCase().endsWith('.pdf') ? '📄' : '📁'} {datasetName}
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleResetSample}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] underline"
              >
                Reset Default CSV
              </button>
              <button
                onClick={handleLoadSamplePdf}
                className="text-rose-400 hover:text-rose-300 text-[10px] underline"
              >
                Load Sample PDF
              </button>
            </div>
          </div>
        </div>

        {/* Multilingual Quick Prompts */}
        <div className="p-4 flex-1 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Quick Multilingual Prompts
          </span>
          <div className="space-y-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(p.text);
                  handleSendQuery(p.text);
                }}
                disabled={!apiKey}
                className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/30 text-[11px] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-indigo-400">{p.lang}</span>
                </div>
                <div className="truncate text-slate-400">{p.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Streamlit v1.38+ & LangGraph Engine
        </div>
      </aside>

      {/* ---------------------------------------------------------------------- */}
      {/* MAIN VIEWPORT & WORKSPACE TABS                                         */}
      {/* ---------------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Navigation Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Conversational Agent
            </button>

            <button
              onClick={() => setActiveTab('profiler')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profiler'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Automated Data Profiler
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-indigo-300">
                {profile.totalRows}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'explorer'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Data Explorer
            </button>

            <button
              onClick={() => setActiveTab('arch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'arch'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Architecture & Streamlit Files
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Model: <strong className="text-slate-200">{model}</strong>
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
        </header>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Conversational Agent */}
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto flex flex-col h-full">
              {/* Chat Message Scrollable Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}

                {isProcessing && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                        Analyzing query & executing deterministic Pandas code in sandbox...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input & BYOK Enforcement Banner */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {!apiKey && (
                  <div className="mb-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-amber-300">Strict BYOK Security Architecture</strong>
                      <p className="text-slate-300 mt-0.5">
                        Chat input is disabled until an OpenAI API key is provided. Please enter your API key in the sidebar
                        password field or click <em>"Insert Demo Key"</em> to test instantly without runtime errors.
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative flex items-center">
                  <input
                    type="text"
                    disabled={!apiKey}
                    placeholder={
                      apiKey
                        ? 'Ask an analytical question in English, اردو (Urdu), or বাংলা (Bengali)...'
                        : 'Chat disabled: Please provide OpenAI API key in the sidebar.'
                    }
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendQuery();
                    }}
                    className="w-full bg-slate-900 border border-slate-700 disabled:border-slate-800 disabled:bg-slate-950/60 rounded-xl pl-4 pr-12 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={!apiKey || !inputQuery.trim()}
                    className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Automated Data Profiler */}
          {activeTab === 'profiler' && (
            <div className="max-w-6xl mx-auto">
              <DataProfilerTab profile={profile} />
            </div>
          )}

          {/* TAB 3: Data Explorer */}
          {activeTab === 'explorer' && (
            <div className="max-w-6xl mx-auto">
              <DataExplorerTab data={dataset} sourceName={datasetName} />
            </div>
          )}

          {/* TAB 4: Architecture & Streamlit Files */}
          {activeTab === 'arch' && (
            <div className="max-w-6xl mx-auto">
              <ArchitectureTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
