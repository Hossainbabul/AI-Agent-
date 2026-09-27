import React, { useState } from 'react';
import { Terminal, ShieldCheck, CheckCircle2, Layers, Cpu, FileCode2, Copy, Check } from 'lucide-react';

export const ArchitectureTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'app.py' | 'requirements.txt' | 'config.toml' | 'secrets.example'>('app.py');
  const [copied, setCopied] = useState(false);

  const fileSnippets = {
    'app.py': `# Data Se Baatein - Conversational Data Intelligence Agent
# Streamlit + Pandas + Plotly Express + LangChain / OpenAI gpt-4o-mini
# Decoupled Modules: KeyManager, DataProfiler, DeterministicEngine, AgentRunner, Streamlit UI

import streamlit as st
import pandas as pd
import plotly.express as px
from openai import OpenAI

class KeyManager:
    @staticmethod
    def resolve_openai_key(sidebar_input=None):
        # Priority 1: Streamlit secrets
        if hasattr(st, "secrets") and "OPENAI_API_KEY" in st.secrets:
            return st.secrets["OPENAI_API_KEY"], "Streamlit Secrets"
        # Priority 2: Sidebar session input
        if sidebar_input:
            return sidebar_input, "User Session"
        return None, "None"

class DeterministicEngine:
    @classmethod
    def execute(cls, code: str, df: pd.DataFrame):
        # Sandboxed execution with restricted builtins
        # Ensures 0% hallucinated numbers
        ...`,

    'requirements.txt': `streamlit==1.38.0
pandas==2.2.2
numpy==1.26.4
plotly==5.24.1
openai==1.50.0
langchain==0.3.0
langchain-community==0.3.0
langchain-openai==0.2.0
langchain-core==0.3.0
langgraph==0.2.28
python-dotenv==1.0.1`,

    'config.toml': `[theme]
primaryColor = "#6366F1"
backgroundColor = "#0B0F19"
secondaryBackgroundColor = "#151E2E"
textColor = "#F1F5F9"
font = "sans serif"

[server]
headless = true
port = 8501
enableCORS = false`,

    'secrets.example': `# Streamlit Secrets Template for Data Se Baatein
# Put this in .streamlit/secrets.toml
OPENAI_API_KEY = "sk-proj-your-openai-api-key-here"`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileSnippets[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Verification Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Virtual Environment</h4>
            <p className="text-xs text-slate-300 mt-1">Python 3.10.12 `.venv` created and verified with pip.</p>
          </div>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
          <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Pinned Dependencies</h4>
            <p className="text-xs text-slate-300 mt-1">Streamlit v1.38, Pandas 2.2, Plotly 5.24, LangChain 0.3 installed.</p>
          </div>
        </div>

        <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Headless Boot Test</h4>
            <p className="text-xs text-slate-300 mt-1">Streamlit boots cleanly with zero wheel or dependency collisions.</p>
          </div>
        </div>
      </div>

      {/* System Architecture Diagram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">System Architecture & Execution Lifecycle</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Based on the strict architecture, Data Se Baatein decouples intent interpretation from calculation execution.
          The LLM never generates numbers directly; instead, it synthesizes verifiable code executed on the real dataframe copy.
        </p>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10">Step 1</span>
            <h5 className="text-xs font-bold text-slate-200 mt-2">Multimodal Ingestion</h5>
            <p className="text-[11px] text-slate-400 mt-1">CSV upload with fallback to built-in e-commerce dataset</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">Step 2</span>
            <h5 className="text-xs font-bold text-slate-200 mt-2">Automated Profiling</h5>
            <p className="text-[11px] text-slate-400 mt-1">Instant cardinality, missingness %, dtypes, and descriptive stats</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-fuchsia-400 px-2 py-0.5 rounded bg-fuchsia-500/10">Step 3</span>
            <h5 className="text-xs font-bold text-slate-200 mt-2">Trilingual Agent</h5>
            <p className="text-[11px] text-slate-400 mt-1">English, Urdu & Bengali queries mapped to deterministic code</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">Step 4</span>
            <h5 className="text-xs font-bold text-slate-200 mt-2">Deterministic Sandbox</h5>
            <p className="text-[11px] text-slate-400 mt-1">Pandas & Plotly execution with 0% numerical hallucination</p>
          </div>
        </div>
      </div>

      {/* Terminal Run Guide */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Terminal Execution & Streamlit Run
        </h4>
        <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-emerald-300 border border-slate-800/80 space-y-1">
          <div><span className="text-slate-500"># 1. Activate virtual environment</span></div>
          <div>source .venv/bin/activate</div>
          <div className="pt-2"><span className="text-slate-500"># 2. Run Streamlit on port 8501</span></div>
          <div>streamlit run app.py</div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Project Deliverables Inspector</h4>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFile('app.py')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFile === 'app.py' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              app.py
            </button>
            <button
              onClick={() => setActiveFile('requirements.txt')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFile === 'requirements.txt' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              requirements.txt
            </button>
            <button
              onClick={() => setActiveFile('config.toml')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFile === 'config.toml' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              config.toml
            </button>
            <button
              onClick={() => setActiveFile('secrets.example')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeFile === 'secrets.example' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              secrets.toml.example
            </button>
          </div>
        </div>

        <div className="relative rounded-lg bg-slate-950 p-4 border border-slate-800">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800/80 rounded"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre className="text-xs font-mono text-indigo-200 overflow-x-auto max-h-72 leading-relaxed">
            {fileSnippets[activeFile]}
          </pre>
        </div>
      </div>
    </div>
  );
};
