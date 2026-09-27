# Data Se Baatein (ڈیٹا سے باتیں / ডেটার সাথে কথা)
### Enterprise-Grade Conversational Data Intelligence Agent

[![Streamlit](https://img.shields.io/badge/Streamlit-v1.38+-FF4B4B.svg)](https://streamlit.io)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://python.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991.svg)](https://openai.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**Data Se Baatein** is a production-grade conversational data intelligence agent engineered to enable non-technical and business stakeholders to interrogate complex tabular data using natural language in **English**, **Urdu (اردو)**, and **Bengali (বাংলা)**.

The agent translates user intent into deterministic `pandas` queries and interactive `Plotly Express` charts, enforcing strict guardrails against numerical hallucinations.

---

## 🏛️ System Architecture

```
                                  USER INTERFACE
         ┌─────────────────────────────────────────────────────────────┐
         │ Streamlit Dark-Themed Frontend                              │
         │ - Dataset Ingestion (CSV Upload or Built-in E-Commerce)     │
         │ - Instant Automated Data Profiler                           │
         │ - Multilingual Chat Interface (English / اردو / বাংলা)       │
         │ - Strict BYOK Credential Manager                            │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
                                AGENT ORCHESTRATOR
         ┌─────────────────────────────────────────────────────────────┐
         │ LangChain / OpenAI Agent Runner (gpt-4o-mini)               │
         │ - Unicode-based Multilingual Script Detector                │
         │ - Strict Schema & Sample Record Grounding                   │
         │ - Intent-to-Pandas & Plotly Code Generator                  │
         │ - Self-Healing Loop for Syntax or Column Corrections        │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
                         DETERMINISTIC SANDBOX ENGINE
         ┌─────────────────────────────────────────────────────────────┐
         │ Isolated Python Sandbox                                     │
         │ - Restricted Builtins (No OS / Sys / Subprocess)            │
         │ - Deterministic Execution on In-Memory DataFrame            │
         │ - Plotly Dark-Themed Figure Rendering                       │
         │ - Strict Guardrail: Zero Numerical Hallucination            │
         └─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

1. **Multimodal / Data Ingestion (CSV & PDF):**
   - Drag-and-drop CSV tabular datasets and PDF document reports with automated table extraction.
   - Built-in PDF parser extracting structured records, line items, and multi-column tables.
   - Automatic fallback to a built-in realistic e-commerce and sales dataset (`data/sample_ecommerce.csv`) and sample PDF report (`data/sample_ecommerce_report.pdf`).
2. **Instant Automated Data Profiling:**
   - Real-time row and column counts, memory footprint calculation.
   - Missing value percentages and per-column health breakdown.
   - Descriptive numerical statistics (`count`, `mean`, `std`, `IQR`).
   - Dynamic distribution histograms.
3. **Interactive Data Explorer & Processed CSV Export:**
   - Full-text search and category/region filtering across active records.
   - Selective column inclusion (choose exactly which columns to retain).
   - Custom export filename specification with live file size estimation.
   - One-click instantaneous download of the filtered dataset as a clean CSV file.
4. **Conversational Intelligence in English, Urdu, and Bengali:**
   - Natural language comprehension in English, Urdu, and Bengali.
   - Outputs fluent explanations in the corresponding language while executing exact code.
4. **Deterministic Analytics Guardrails:**
   - LLMs can hallucinate math; **Data Se Baatein** generates verified pandas code executed against the loaded dataframe copy to extract the true values.
5. **Strict BYOK (Bring Your Own Key) Security:**
   - Checks `st.secrets["OPENAI_API_KEY"]` first.
   - Falls back to a masked sidebar input in the user session.
   - Gracefully disables chat and displays setup instructions if no key is present without raising unhandled runtime exceptions.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10 or higher
- Git

### 2. Clone Repository & Create Virtual Environment
```bash
# Clone repository
git clone https://github.com/your-org/data-se-baatein.git
cd data-se-baatein

# Create local virtual environment
python3 -m venv .venv

# Activate virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

### 3. Install Pinned Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure API Key (BYOK)
You can configure your OpenAI API key in either of two ways:

#### Option A: Local Streamlit Secrets (Recommended for Local Dev)
```bash
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
```
Edit `.streamlit/secrets.toml`:
```toml
OPENAI_API_KEY = "sk-proj-your-openai-api-key-here"
```

#### Option B: Sidebar Input Field
Launch the application and paste your key into the password field in the left sidebar.

### 5. Run Application
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## ☁️ Streamlit Community Cloud Deployment

This repository is configured for **zero-configuration deployment** on Streamlit Community Cloud:

1. Push this repository to GitHub.
2. Visit [share.streamlit.io](https://share.streamlit.io) and click **"New app"**.
3. Select your repository, branch (`main`), and set the main file path to `app.py`.
4. Under **Advanced settings > Secrets**, configure:
   ```toml
   OPENAI_API_KEY = "sk-proj-your-openai-api-key-here"
   ```
5. Click **Deploy!**

---

## 📂 Project Structure

```
├── app.py                          # Main decoupled Streamlit application
├── requirements.txt                # Pinned stable dependencies
├── README.md                       # Architecture & deployment documentation
├── .gitignore                      # Git exclusion rules
├── .streamlit/
│   ├── config.toml                 # Dark-mode UI palette configuration
│   └── secrets.toml.example        # Secrets template for local execution
├── data/
│   └── sample_ecommerce.csv        # Built-in fallback sample dataset
└── src/                            # Web companion & interactive preview
```

---

## 🔒 Security & Code Integrity

- **Sandboxing:** Code execution is performed in an isolated execution namespace with restricted built-in functions. Direct operating system calls, external network sockets, or subprocess creations are strictly prohibited.
- **Credential Privacy:** `.streamlit/secrets.toml` is ignored by `.gitignore` to prevent accidental credential leakage.

---

## 📄 License
Licensed under the Apache License 2.0.
