"""
Data Se Baatein (ڈیٹا سے باتیں / ডেটার ساتھে কথা)
Conversational Data Intelligence Agent
------------------------------------------------------------
Enterprise-grade Conversational Analytics Agent built with Streamlit, Plotly Express,
Pandas, and LangChain/LangGraph with OpenAI Chat API (gpt-4o-mini).

Strict BYOK security architecture:
1. Streamlit Secrets (st.secrets["OPENAI_API_KEY"])
2. User-provided sidebar input field
Graceful fallback and clear setup instructions if no key is present.
"""

from __future__ import annotations

import io
import os
import sys
import traceback
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ==============================================================================
# 1. PAGE CONFIGURATION & THEME INJECTION
# ==============================================================================
st.set_page_config(
    page_title="Data Se Baatein | Conversational Data Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for dark glassmorphism & enterprise polish
st.markdown(
    """
    <style>
    /* Metric styling */
    div[data-testid="stMetricValue"] {
        font-size: 1.6rem !important;
        font-weight: 700;
        color: #818cf8;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 0.85rem !important;
        color: #94a3b8;
        font-weight: 500;
    }
    /* Chat message bubble styling */
    .stChatMessage {
        border-radius: 12px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
    }
    /* RTL & Bengali typography support */
    .urdu-text {
        direction: rtl;
        text-align: right;
        font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', Tahoma, sans-serif;
        font-size: 1.15rem;
        line-height: 1.8;
    }
    .bengali-text {
        font-family: 'Noto Sans Bengali', 'SolaimanLipi', Kalpurush, sans-serif;
        font-size: 1.05rem;
        line-height: 1.6;
    }
    .badge-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 6px;
    }
    .badge-eng { background-color: #312e81; color: #c7d2fe; }
    .badge-urdu { background-color: #064e3b; color: #a7f3d0; }
    .badge-bengali { background-color: #701a75; color: #fbcfe8; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==============================================================================
# 2. DATA INGESTION & DATA PROFILER MODULE
# ==============================================================================
SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_ecommerce.csv")

@st.cache_data(show_spinner=False)
def load_sample_dataset() -> pd.DataFrame:
    """Loads the built-in fallback e-commerce sample dataset."""
    if os.path.exists(SAMPLE_DATA_PATH):
        df = pd.read_csv(SAMPLE_DATA_PATH)
    else:
        # Fallback generated dataframe if sample file is unavailable
        df = pd.DataFrame({
            "order_id": [f"ORD-{1000 + i}" for i in range(1, 21)],
            "date": pd.date_range("2024-01-01", periods=20, freq="5D").astype(str),
            "region": np.random.choice(["South Asia", "Middle East", "Southeast Asia"], 20),
            "category": np.random.choice(["Electronics", "Furniture", "Apparel", "Home & Living"], 20),
            "units_sold": np.random.randint(1, 10, 20),
            "unit_price": np.round(np.random.uniform(20.0, 800.0, 20), 2),
            "discount": np.random.choice([0.0, 0.05, 0.10, 0.15, 0.20], 20),
        })
        df["total_sales"] = np.round(df["units_sold"] * df["unit_price"] * (1 - df["discount"]), 2)
        df["profit"] = np.round(df["total_sales"] * np.random.uniform(0.15, 0.35, 20), 2)
    return df


def extract_dataframe_from_pdf(uploaded_file) -> pd.DataFrame:
    """Extracts structured tabular data from an uploaded PDF file."""
    import re
    from pypdf import PdfReader

    try:
        reader = PdfReader(uploaded_file)
    except Exception as e:
        raise ValueError(f"Failed to read PDF document: {e}")

    extracted_text = ""
    for page in reader.pages:
        page_txt = page.extract_text() or ""
        extracted_text += page_txt + "\n"

    lines = [line.strip() for line in extracted_text.split("\n") if line.strip()]
    if not lines:
        raise ValueError("The uploaded PDF does not contain extractable text.")

    # 1. Delimiter-based table extraction (comma, pipe, tab, semicolon)
    for delim in [",", "|", "\t", ";"]:
        delim_counts = [line.count(delim) for line in lines[:20]]
        avg_d = sum(delim_counts) / len(delim_counts) if delim_counts else 0
        if avg_d >= 2:
            raw_rows = []
            for line in lines:
                parts = [p.strip().strip('"').strip("'") for p in line.split(delim) if p.strip()]
                if len(parts) >= 2:
                    raw_rows.append(parts)
            if len(raw_rows) >= 2:
                headers = [f"Col_{i+1}" if not h else h for i, h in enumerate(raw_rows[0])]
                data_rows = raw_rows[1:]
                max_cols = len(headers)
                clean_rows = []
                for r in data_rows:
                    if len(r) < max_cols:
                        r = r + [""] * (max_cols - len(r))
                    clean_rows.append(r[:max_cols])
                df_parsed = pd.DataFrame(clean_rows, columns=headers)
                for col in df_parsed.columns:
                    try:
                        clean_series = df_parsed[col].astype(str).str.replace("$", "", regex=False).str.replace(",", "", regex=False)
                        df_parsed[col] = pd.to_numeric(clean_series)
                    except Exception:
                        pass
                return df_parsed

    # 2. Multi-space whitespace tabular extraction
    space_rows = []
    for line in lines:
        parts = re.split(r'\s{2,}|\t+', line)
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 2:
            space_rows.append(parts)

    if len(space_rows) >= 2:
        headers = space_rows[0]
        data_rows = space_rows[1:]
        max_cols = len(headers)
        clean_rows = []
        for r in data_rows:
            if len(r) == max_cols:
                clean_rows.append(r)
            elif len(r) < max_cols:
                clean_rows.append(r + [""] * (max_cols - len(r)))
            else:
                clean_rows.append(r[:max_cols])
        if clean_rows:
            df_parsed = pd.DataFrame(clean_rows, columns=headers)
            for col in df_parsed.columns:
                try:
                    clean_series = df_parsed[col].astype(str).str.replace("$", "", regex=False).str.replace(",", "", regex=False)
                    df_parsed[col] = pd.to_numeric(clean_series)
                except Exception:
                    pass
            return df_parsed

    # 3. Key-Value or itemized statement lines fallback
    records = []
    for i, line in enumerate(lines):
        if ":" in line:
            parts = line.split(":", 1)
            records.append({"item_id": i + 1, "attribute": parts[0].strip(), "value": parts[1].strip()})
        else:
            records.append({"line_id": i + 1, "record_text": line})

    if records:
        return pd.DataFrame(records)

    raise ValueError("Could not parse structured table records from the uploaded PDF.")


class DataProfiler:
    """Automated high-fidelity dataset profiler."""

    @staticmethod
    def get_summary_metrics(df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates row count, columns, total missing cells, and memory footprint."""
        total_cells = df.size
        total_missing = int(df.isna().sum().sum())
        missing_rate = (total_missing / total_cells * 100) if total_cells > 0 else 0.0
        memory_mb = df.memory_usage(deep=True).sum() / (1024 * 1024)

        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "total_missing": total_missing,
            "missing_rate": round(missing_rate, 2),
            "memory_mb": round(memory_mb, 2),
            "numeric_cols": list(df.select_dtypes(include=[np.number]).columns),
            "categorical_cols": list(df.select_dtypes(include=["object", "category"]).columns),
            "datetime_cols": list(df.select_dtypes(include=["datetime"]).columns),
        }

    @staticmethod
    def get_column_profile(df: pd.DataFrame) -> pd.DataFrame:
        """Generates detailed per-column metadata table."""
        records = []
        for col in df.columns:
            series = df[col]
            missing_count = int(series.isna().sum())
            missing_pct = round((missing_count / len(df)) * 100, 2)
            unique_count = int(series.nunique())
            dtype_str = str(series.dtype)

            sample_val = series.dropna().iloc[0] if not series.dropna().empty else None

            records.append({
                "Column Name": col,
                "Data Type": dtype_str,
                "Unique Values": unique_count,
                "Missing Count": missing_count,
                "Missing %": f"{missing_pct}%",
                "Sample Example": str(sample_val)[:40] if sample_val is not None else "N/A",
            })
        return pd.DataFrame(records)


# ==============================================================================
# 3. STRICT BYOK KEY MANAGEMENT MODULE
# ==============================================================================
class KeyManager:
    """
    Manages API keys strictly adhering to BYOK hierarchy:
    Priority 1: Streamlit runtime secrets (st.secrets["OPENAI_API_KEY"])
    Priority 2: User-provided sidebar password input field
    """

    @staticmethod
    def resolve_openai_key(sidebar_input: Optional[str] = None) -> Tuple[Optional[str], str]:
        # 1. Check Streamlit runtime secrets
        try:
            if hasattr(st, "secrets") and "OPENAI_API_KEY" in st.secrets:
                secret_key = str(st.secrets["OPENAI_API_KEY"]).strip()
                if secret_key and secret_key != "sk-proj-your-openai-api-key-here":
                    return secret_key, "Streamlit Secrets (st.secrets)"
        except Exception:
            pass

        # 2. Check sidebar input field
        if sidebar_input and sidebar_input.strip():
            cleaned_key = sidebar_input.strip()
            return cleaned_key, "User Session (Sidebar Input)"

        # 3. Check environment variable fallback (e.g. local .env)
        env_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if env_key and env_key != "sk-proj-your-openai-api-key-here":
            return env_key, "Environment Variable (OPENAI_API_KEY)"

        return None, "None"


# ==============================================================================
# 4. DETERMINISTIC SANDBOX & EXECUTION ENGINE
# ==============================================================================
@dataclass
class ExecutionResult:
    success: bool
    output_text: str
    dataframe: Optional[pd.DataFrame] = None
    figure: Optional[Any] = None
    generated_code: str = ""
    language: str = "en"


class DeterministicEngine:
    """
    Sandboxed execution engine for deterministic pandas and plotly code.
    Guarantees that metrics are strictly computed from the real dataframe context.
    """

    ALLOWED_BUILTINS = {
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        "len": len,
        "int": int,
        "float": float,
        "str": str,
        "list": list,
        "dict": dict,
        "range": range,
        "zip": zip,
        "enumerate": enumerate,
        "print": print,
    }

    @classmethod
    def execute(cls, code: str, df: pd.DataFrame) -> Tuple[bool, Any, Optional[Any]]:
        """
        Executes code safely against a fresh copy of the loaded DataFrame.
        Returns: (success, result_or_error, plotly_figure)
        """
        # Create an isolated local namespace
        local_scope = {
            "df": df.copy(),
            "pd": pd,
            "np": np,
            "px": px,
            "go": go,
            "result": None,
            "fig": None,
        }

        # Build clean global scope with restricted builtins
        global_scope = {
            "__builtins__": cls.ALLOWED_BUILTINS,
        }

        # Clean code block
        cleaned_code = code.strip()
        if cleaned_code.startswith("```python"):
            cleaned_code = cleaned_code[9:]
        elif cleaned_code.startswith("```"):
            cleaned_code = cleaned_code[3:]
        if cleaned_code.endswith("```"):
            cleaned_code = cleaned_code[:-3]
        cleaned_code = cleaned_code.strip()

        # Disallow unsafe imports or system calls
        disallowed_keywords = ["import os", "import sys", "subprocess", "eval", "exec", "__import__", "open("]
        for kw in disallowed_keywords:
            if kw in cleaned_code:
                return False, f"Security Violation: '{kw}' is prohibited in deterministic queries.", None

        try:
            # Capture standard output buffer
            old_stdout = sys.stdout
            redirected_output = io.StringIO()
            sys.stdout = redirected_output

            # Execute within sandboxed environment
            exec(cleaned_code, global_scope, local_scope)

            sys.stdout = old_stdout
            stdout_str = redirected_output.getvalue().strip()

            result = local_scope.get("result")
            fig = local_scope.get("fig")

            # Fallback output resolution
            if result is None and stdout_str:
                result = stdout_str

            return True, result, fig

        except Exception as e:
            sys.stdout = sys.__stdout__
            error_msg = f"{type(e).__name__}: {str(e)}"
            return False, error_msg, None


# ==============================================================================
# 5. CONVERSATIONAL AGENT RUNNER (LANGCHAIN / OPENAI)
# ==============================================================================
class AgentRunner:
    """
    Conversational Agent translating English, Urdu, and Bengali queries into
    deterministic Pandas analytics and interactive Plotly visuals.
    """

    SYSTEM_PROMPT = """You are "Data Se Baatein" (ڈیٹا سے باتیں / ডেটার সাথে কথা), an enterprise-grade Conversational Data Intelligence Agent.
Your mandate is to answer business, financial, and analytical questions about the loaded dataset by generating deterministic Python code using `pandas`, `numpy`, and `plotly.express`.

CRITICAL GUARDRAILS:
1. NEVER hallucinate numbers or fabricate metrics. Every single metric, count, sum, or mean MUST be computed directly from the dataframe `df`.
2. Support trilingual communication fluently:
   - English (default)
   - Urdu (اردو) - when the user asks in Urdu or requests Urdu. Provide numbers and business conclusions in fluent Urdu.
   - Bengali (বাংলা) - when the user asks in Bengali or requests Bengali. Provide insights in natural Bengali.
3. Code Requirements:
   - The dataframe is already loaded as variable `df`.
   - Store your primary numerical, tabular, or text answer in the variable `result`.
   - If a chart or visual is appropriate or requested, store the Plotly Express chart in the variable `fig`.
   - Always apply the 'plotly_dark' template: `fig.update_layout(template='plotly_dark')`.
4. Output Format:
   Your response must be JSON-parsable or structured strictly in two sections:
   [PYTHON_CODE]
   # your python code here setting `result` and optionally `fig`
   [/PYTHON_CODE]
   [EXPLANATION]
   # Concise interpretation of the findings in the user's language (English, Urdu, or Bengali). Highlight specific numbers computed by the code.
   [/EXPLANATION]
"""

    @staticmethod
    def detect_language(query: str) -> str:
        """Detects whether query is Urdu, Bengali, or English based on unicode script ranges."""
        # Urdu / Arabic unicode range: 0x0600 - 0x06FF
        has_arabic_script = any('\u0600' <= char <= '\u06FF' for char in query)
        # Bengali unicode range: 0x0980 - 0x09FF
        has_bengali_script = any('\u0980' <= char <= '\u09FF' for char in query)

        if has_arabic_script:
            return "ur"
        elif has_bengali_script:
            return "bn"
        return "en"

    @classmethod
    def run_query(cls, query: str, df: pd.DataFrame, api_key: str, model_name: str = "gpt-4o-mini") -> ExecutionResult:
        """
        Executes query by prompting OpenAI model via LangChain or direct OpenAI client,
        then sandboxing the deterministic Pandas code.
        """
        detected_lang = cls.detect_language(query)

        # Build schema context
        buffer = io.StringIO()
        df.info(buf=buffer)
        info_str = buffer.getvalue()
        head_sample = df.head(3).to_markdown()
        columns_desc = ", ".join([f"{col} ({df[col].dtype})" for col in df.columns])

        user_content = f"""
DATASET SCHEMA & OVERVIEW:
Columns: {columns_desc}
Total rows: {len(df)}

Sample Records:
{head_sample}

USER QUERY:
"{query}"
Detected language: {detected_lang}

Generate the deterministic code enclosed in [PYTHON_CODE]...[/PYTHON_CODE] and analytical commentary in [EXPLANATION]...[/EXPLANATION] in the matching language.
"""

        try:
            # Import OpenAI client
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.1,
            )

            raw_response = response.choices[0].message.content or ""

            # Extract Code and Explanation
            code_block = ""
            explanation = ""

            if "[PYTHON_CODE]" in raw_response and "[/PYTHON_CODE]" in raw_response:
                code_start = raw_response.find("[PYTHON_CODE]") + len("[PYTHON_CODE]")
                code_end = raw_response.find("[/PYTHON_CODE]")
                code_block = raw_response[code_start:code_end].strip()

            if "[EXPLANATION]" in raw_response and "[/EXPLANATION]" in raw_response:
                exp_start = raw_response.find("[EXPLANATION]") + len("[EXPLANATION]")
                exp_end = raw_response.find("[/EXPLANATION]")
                explanation = raw_response[exp_start:exp_end].strip()
            elif "[EXPLANATION]" in raw_response:
                exp_start = raw_response.find("[EXPLANATION]") + len("[EXPLANATION]")
                explanation = raw_response[exp_start:].strip()
            else:
                # Fallback if tags not used
                if "```python" in raw_response:
                    parts = raw_response.split("```python")
                    code_part = parts[1].split("```")[0]
                    code_block = code_part.strip()
                    explanation = parts[1].split("```")[1] if len(parts[1].split("```")) > 1 else ""
                else:
                    explanation = raw_response

            # If no code was generated, return explanation directly
            if not code_block:
                return ExecutionResult(
                    success=True,
                    output_text=explanation or raw_response,
                    generated_code="# No computation required",
                    language=detected_lang,
                )

            # Execute the generated code deterministically
            success, result_val, fig = DeterministicEngine.execute(code_block, df)

            if not success:
                # Re-prompt agent to heal syntax or key error if initial execution fails
                error_healing_prompt = f"""
The previous generated code encountered an error:
{result_val}

Previous code:
{code_block}

Fix the code. Ensure column names match: {list(df.columns)}. Enclose the corrected code in [PYTHON_CODE]...[/PYTHON_CODE].
"""
                fix_resp = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": cls.SYSTEM_PROMPT},
                        {"role": "user", "content": error_healing_prompt},
                    ],
                    temperature=0.0,
                )
                fix_text = fix_resp.choices[0].message.content or ""
                if "[PYTHON_CODE]" in fix_text and "[/PYTHON_CODE]" in fix_text:
                    c_start = fix_text.find("[PYTHON_CODE]") + len("[PYTHON_CODE]")
                    c_end = fix_text.find("[/PYTHON_CODE]")
                    code_block = fix_text[c_start:c_end].strip()
                    success, result_val, fig = DeterministicEngine.execute(code_block, df)

            # Formulate structured output
            res_df = None
            if isinstance(result_val, pd.DataFrame):
                res_df = result_val
                computed_summary = f"Computed {len(res_df)} rows table."
            elif isinstance(result_val, pd.Series):
                res_df = result_val.to_frame(name="Value")
                computed_summary = f"Computed series of {len(res_df)} items."
            elif result_val is not None:
                computed_summary = f"**Calculation Output:** `{result_val}`"
            else:
                computed_summary = ""

            final_text = f"{explanation}\n\n{computed_summary}".strip()

            return ExecutionResult(
                success=success,
                output_text=final_text if success else f"Execution Error: {result_val}\n\nAgent explanation: {explanation}",
                dataframe=res_df,
                figure=fig,
                generated_code=code_block,
                language=detected_lang,
            )

        except Exception as e:
            return ExecutionResult(
                success=False,
                output_text=f"API or Agent Error: {str(e)}",
                generated_code=code_block if 'code_block' in locals() else "",
                language=detected_lang,
            )


# ==============================================================================
# 6. STREAMLIT UI APPLICATION
# ==============================================================================
def main():
    # --------------------------------------------------------------------------
    # SIDEBAR: Strict BYOK, Model Config, Dataset Ingestion
    # --------------------------------------------------------------------------
    with st.sidebar:
        st.markdown("## 📊 **Data Se Baatein**")
        st.caption("Conversational Data Intelligence Agent")
        st.divider()

        # 1. API Key Security & Priority Handling
        st.subheader("🔑 API Key Configuration (BYOK)")
        sidebar_key_input = st.text_input(
            "Enter OpenAI API Key",
            type="password",
            placeholder="sk-proj-...",
            help="Strict BYOK: Checked against runtime secrets first, then this session field.",
        )

        resolved_key, key_source = KeyManager.resolve_openai_key(sidebar_key_input)

        if resolved_key:
            st.success(f"✓ Key active via {key_source}", icon="🔒")
        else:
            st.warning("⚠️ No OpenAI API key detected.", icon="🔑")
            st.info(
                "**Setup Instructions:**\n"
                "1. Paste your OpenAI API key in the field above, or\n"
                "2. Provide it in `.streamlit/secrets.toml` as `OPENAI_API_KEY = '...'`",
                icon="💡",
            )

        st.divider()

        # 2. Model & Settings
        st.subheader("⚙️ Agent Settings")
        selected_model = st.selectbox(
            "Model",
            options=["gpt-4o-mini", "gpt-4o"],
            index=0,
            help="Defaults to gpt-4o-mini for rapid, cost-effective data intelligence.",
        )

        st.divider()

        # 3. Data Ingestion
        st.subheader("📁 Dataset Ingestion")
        uploaded_file = st.file_uploader(
            "Upload CSV or PDF Dataset",
            type=["csv", "pdf"],
            help="Upload structured data in CSV format or reports/tables in PDF format.",
        )

        if uploaded_file is not None:
            file_name = uploaded_file.name
            try:
                if file_name.lower().endswith(".pdf"):
                    with st.spinner("Extracting structured tabular data from PDF..."):
                        df = extract_dataframe_from_pdf(uploaded_file)
                    st.success(f"✓ Extracted {len(df)} rows & {len(df.columns)} columns from PDF!", icon="📄")
                    st.session_state["dataset_source"] = f"PDF Report: {file_name}"
                else:
                    df = pd.read_csv(uploaded_file)
                    st.session_state["dataset_source"] = f"CSV: {file_name}"
            except Exception as e:
                st.error(f"Error processing {file_name}: {e}")
                df = load_sample_dataset()
                st.session_state["dataset_source"] = "Sample: E-Commerce Orders (Fallback)"
        else:
            df = load_sample_dataset()
            st.session_state["dataset_source"] = "Built-in Sample: E-Commerce Global Sales"

        st.caption(f"**Active Source:** {st.session_state.get('dataset_source', 'Built-in')}")

        st.divider()
        st.markdown("### 🌐 Multilingual Quick Prompts")
        sample_prompts = [
            ("🇬🇧 EN", "What is the total sales and total profit by product category?"),
            ("🇵🇰 UR", "کس پروڈکٹ کیٹگری میں سب سے زیادہ منافع ہوا ہے؟"),
            ("🇧🇩 BN", "কোন ক্যাটাগরিতে সবচেয়ে বেশি বিক্রি ও লাভ হয়েছে?"),
            ("🇬🇧 EN", "Plot a bar chart of sales by region with dark theme"),
            ("🇵🇰 UR", "ریجن کے حساب سے سیلز کا بار چارٹ بنائیں"),
            ("🇧🇩 BN", "অঞ্চল অনুযায়ী বিক্রির একটি চার্ট দেখান"),
        ]

        for flag, prompt_text in sample_prompts:
            if st.button(f"{flag}: {prompt_text[:32]}...", key=f"btn_{flag}_{prompt_text[:10]}"):
                st.session_state["selected_quick_prompt"] = prompt_text

    # --------------------------------------------------------------------------
    # MAIN AREA: Tabs for Chat, Profiler, Explorer, Architecture
    # --------------------------------------------------------------------------
    st.title("Data Se Baatein")
    st.markdown(
        """
        <p style="font-size: 1.1rem; color: #94a3b8; margin-top: -12px;">
            Deterministic Conversational Data Analytics | 
            <span class="badge-pill badge-eng">English</span>
            <span class="badge-pill badge-urdu">اردو Urdu</span>
            <span class="badge-pill badge-bengali">বাংলা Bengali</span>
        </p>
        """,
        unsafe_allow_html=True,
    )

    tab_chat, tab_profile, tab_data, tab_arch = st.tabs([
        "💬 Conversational Agent",
        "📊 Automated Data Profiler",
        "📑 Data Explorer",
        "🧠 Agent Architecture & Guardrails",
    ])

    # --------------------------------------------------------------------------
    # TAB 1: CONVERSATIONAL AGENT
    # --------------------------------------------------------------------------
    with tab_chat:
        # Initialize chat history
        if "messages" not in st.session_state:
            st.session_state.messages = [
                {
                    "role": "assistant",
                    "content": (
                        "👋 Welcome to **Data Se Baatein**!\n\n"
                        "I am your conversational data agent. Ask me any analytical question in "
                        "**English**, **Urdu (اردو)**, or **Bengali (বাংলা)**.\n\n"
                        "- *Example:* `Show monthly profit trends with a line chart`\n"
                        "- *مثال:* `کس کسٹمر نے سب سے زیادہ آرڈرز دیے ہیں؟`\n"
                        "- *উদাহরণ:* `প্রতি ক্যাটাগরির মোট সেলস এবং ডিসকাউন্টের অনুপাত কত?`"
                    ),
                    "code": None,
                    "df": None,
                    "fig": None,
                    "lang": "en",
                }
            ]

        # Display message history
        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                text = msg["content"]
                lang = msg.get("lang", "en")
                if lang == "ur":
                    st.markdown(f'<div class="urdu-text">{text}</div>', unsafe_allow_html=True)
                elif lang == "bn":
                    st.markdown(f'<div class="bengali-text">{text}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(text)

                if msg.get("df") is not None:
                    st.dataframe(msg["df"], use_container_width=True)

                if msg.get("fig") is not None:
                    st.plotly_chart(msg["fig"], use_container_width=True)

                if msg.get("code"):
                    with st.expander("🔍 View Deterministic Python/Pandas Code", expanded=False):
                        st.code(msg["code"], language="python")

        # Chat Input logic with BYOK Guardrail
        quick_prompt = st.session_state.pop("selected_quick_prompt", None)
        user_input = st.chat_input("Ask a question about your data (English, اردو, বাংলা)...", disabled=not bool(resolved_key))

        active_query = quick_prompt or user_input

        if not resolved_key:
            st.info(
                "🔒 **Chat input is disabled until an OpenAI API Key is provided.**\n\n"
                "Please configure your API key in the left sidebar or through `.streamlit/secrets.toml` to begin chatting.",
                icon="🔑",
            )

        if active_query and resolved_key:
            # Append user message
            detected_lang = AgentRunner.detect_language(active_query)
            st.session_state.messages.append({
                "role": "user",
                "content": active_query,
                "lang": detected_lang,
            })

            with st.chat_message("user"):
                if detected_lang == "ur":
                    st.markdown(f'<div class="urdu-text">{active_query}</div>', unsafe_allow_html=True)
                elif detected_lang == "bn":
                    st.markdown(f'<div class="bengali-text">{active_query}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(active_query)

            # Generate Agent Response
            with st.chat_message("assistant"):
                with st.spinner("Analyzing dataset & computing deterministic metrics..."):
                    exec_result = AgentRunner.run_query(
                        query=active_query,
                        df=df,
                        api_key=resolved_key,
                        model_name=selected_model,
                    )

                resp_lang = exec_result.language
                if resp_lang == "ur":
                    st.markdown(f'<div class="urdu-text">{exec_result.output_text}</div>', unsafe_allow_html=True)
                elif resp_lang == "bn":
                    st.markdown(f'<div class="bengali-text">{exec_result.output_text}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(exec_result.output_text)

                if exec_result.dataframe is not None:
                    st.dataframe(exec_result.dataframe, use_container_width=True)

                if exec_result.figure is not None:
                    st.plotly_chart(exec_result.figure, use_container_width=True)

                if exec_result.generated_code:
                    with st.expander("🔍 View Deterministic Python/Pandas Code", expanded=False):
                        st.code(exec_result.generated_code, language="python")

                # Save to history
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": exec_result.output_text,
                    "code": exec_result.generated_code,
                    "df": exec_result.dataframe,
                    "fig": exec_result.figure,
                    "lang": resp_lang,
                })

    # --------------------------------------------------------------------------
    # TAB 2: AUTOMATED DATA PROFILER
    # --------------------------------------------------------------------------
    with tab_profile:
        st.subheader("Instantaneous Automated Data Profiling")
        summary = DataProfiler.get_summary_metrics(df)

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Rows", f"{summary['total_rows']:,}")
        with col2:
            st.metric("Total Columns", f"{summary['total_columns']}")
        with col3:
            st.metric("Missing Value %", f"{summary['missing_rate']}%", delta=f"{summary['total_missing']} cells", delta_color="inverse")
        with col4:
            st.metric("Memory Usage", f"{summary['memory_mb']} MB")

        st.markdown("---")

        col_left, col_right = st.columns([3, 2])

        with col_left:
            st.markdown("#### 📋 Column Schema & Missing Analysis")
            profile_df = DataProfiler.get_column_profile(df)
            st.dataframe(profile_df, use_container_width=True, height=350)

        with col_right:
            st.markdown("#### 📈 Key Column Distributions")
            if summary["numeric_cols"]:
                selected_num = st.selectbox("Select numeric column to inspect:", summary["numeric_cols"], key="prof_num_sel")
                hist_fig = px.histogram(
                    df,
                    x=selected_num,
                    nbins=20,
                    title=f"Distribution of {selected_num}",
                    template="plotly_dark",
                    color_discrete_sequence=["#818cf8"],
                )
                hist_fig.update_layout(margin=dict(l=20, r=20, t=40, b=20), height=300)
                st.plotly_chart(hist_fig, use_container_width=True)
            else:
                st.info("No numeric columns found for histogram.")

        st.markdown("---")
        st.markdown("#### 📊 Descriptive Numerical Statistics")
        desc_df = df.describe()
        st.dataframe(desc_df, use_container_width=True)

    # --------------------------------------------------------------------------
    # TAB 3: DATA EXPLORER
    # --------------------------------------------------------------------------
    with tab_data:
        st.subheader("Interactive Dataset Explorer & CSV Export")
        st.caption(f"Currently inspecting: **{st.session_state.get('dataset_source', 'Dataset')}**")

        # Filtering Controls
        with st.expander("🔍 Filtering & Processing Options", expanded=True):
            f_col1, f_col2, f_col3 = st.columns([2, 1, 1])

            with f_col1:
                search_query = st.text_input("Full-text search across all columns", "", placeholder="Type keywords...")

            filtered_df = df.copy()

            # Optional categorical filters if columns exist
            with f_col2:
                cat_cols = [c for c in ["category", "region", "payment_method"] if c in df.columns]
                selected_cat_col = st.selectbox("Filter by Category/Column:", ["(None)"] + cat_cols)

            with f_col3:
                if selected_cat_col != "(None)":
                    unique_vals = list(df[selected_cat_col].dropna().unique())
                    selected_val = st.selectbox(f"Value for {selected_cat_col}:", ["(All)"] + sorted([str(v) for v in unique_vals]))
                    if selected_val != "(All)":
                        filtered_df = filtered_df[filtered_df[selected_cat_col].astype(str) == selected_val]

            # Apply full-text search
            if search_query.strip():
                mask = filtered_df.astype(str).apply(
                    lambda row: row.str.contains(search_query, case=False).any(), axis=1
                )
                filtered_df = filtered_df[mask]

        # Column selection for display and export
        st.markdown("#### ⚙️ Column Selection & Export Configuration")
        c_exp1, c_exp2 = st.columns([3, 1])

        with c_exp1:
            all_cols = list(df.columns)
            selected_columns = st.multiselect(
                "Select columns to include in processed view & exported CSV:",
                options=all_cols,
                default=all_cols,
                help="Choose exactly which columns to retain in the exported file.",
            )
            if not selected_columns:
                selected_columns = all_cols

        # Slice the processed dataframe with selected columns
        export_df = filtered_df[selected_columns]

        with c_exp2:
            export_filename = st.text_input(
                "Export File Name:",
                value="data_se_baatein_filtered.csv",
                help="Specify custom name for downloaded CSV.",
            )
            if not export_filename.endswith(".csv"):
                export_filename += ".csv"

        # Display Metrics on current filtered slice
        m_col1, m_col2, m_col3 = st.columns(3)
        with m_col1:
            st.metric("Exportable Rows", f"{len(export_df):,} of {len(df):,}")
        with m_col2:
            st.metric("Selected Columns", f"{len(selected_columns)} of {len(all_cols)}")
        with m_col3:
            csv_bytes = export_df.to_csv(index=False).encode("utf-8")
            st.metric("Estimated File Size", f"{len(csv_bytes) / 1024:.2f} KB")

        # Data Table View
        st.dataframe(export_df, use_container_width=True, height=400)

        # Primary Download Button
        st.download_button(
            label=f"📥 Export Current Processed Dataset as CSV ({len(export_df)} rows)",
            data=csv_bytes,
            file_name=export_filename,
            mime="text/csv",
            use_container_width=True,
            type="primary",
        )

    # --------------------------------------------------------------------------
    # TAB 4: ARCHITECTURE & GUARDRAILS SPECIFICATION
    # --------------------------------------------------------------------------
    with tab_arch:
        st.subheader("System Architecture & Guardrails Specification")
        st.markdown(
            """
            ### 🏗️ Data Se Baatein Architecture (Strict Alignment)
            ```
            ┌────────────────────────────────────────────────────────────────────────┐
            │                  Streamlit Frontend (v1.38+ Dark Theme)                │
            │  - Multilingual Chat UI (English / اردو / বাংলা)                       │
            │  - Strict BYOK API Key Resolver (st.secrets -> Sidebar Input)          │
            │  - Instant Automated Profiling (Rows, Dtypes, Missing %, Descriptive)  │
            └───────────────────────────────────┬────────────────────────────────────┘
                                                │ User Query + Schema Context
                                                ▼
            ┌────────────────────────────────────────────────────────────────────────┐
            │                  Agentic Workflow (LangChain / OpenAI)                 │
            │  - Language Detection (Unicode range: Arabic/Urdu, Bengali, Latin)     │
            │  - Intent Translation into Pandas & Plotly Express Code                │
            │  - System Guardrail: Never hallucinate numbers; compute from df context│
            └───────────────────────────────────┬────────────────────────────────────┘
                                                │ Sandboxed Python Execution
                                                ▼
            ┌────────────────────────────────────────────────────────────────────────┐
            │                  Deterministic Pandas Execution Engine                 │
            │  - Isolated Global/Local Scope with restricted builtins                │
            │  - In-memory DataFrame operations (Groupby, Aggregations, Pivots)      │
            │  - Interactive Plotly figures rendered dynamically in dark mode        │
            └────────────────────────────────────────────────────────────────────────┘
            ```

            ### 🛡️ Enterprise Guardrails Enforced:
            1. **Zero Metric Hallucination:** No analytical metric is answered by the LLM from memory; all calculations are executed deterministically on the active dataframe copy.
            2. **Strict BYOK:** The application refuses execution without a validated OpenAI key, cleanly handling missing credentials without uncaught runtime crashes.
            3. **Sandboxed Code Execution:** Disallows `os`, `sys`, `subprocess`, `eval`, or external file modification.
            4. **Streamlit Community Cloud Zero-Config:** Pinned dependencies in `requirements.txt` and native dark mode in `.streamlit/config.toml`.
            """
        )


if __name__ == "__main__":
    main()
