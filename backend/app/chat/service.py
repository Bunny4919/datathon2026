import requests
import json
import re
import os
import sqlglot
from sqlglot import exp
from sqlalchemy.orm import Session
from ..database.session import engine
from sqlalchemy import text
from .memory import get_chat_history, save_chat_message

# Database allowed tables and columns from test_ksp.db
ALLOWED_TABLES = {
    "users", "districts", "firs", "locations", "district_indicators",
    "crime_stats", "conversations", "accused", "victims",
    "financial_transactions", "messages"
}

ALLOWED_COLUMNS = {
    "users": {"id", "username", "hashed_password", "role"},
    "districts": {"id", "name", "population"},
    "firs": {"id", "case_number", "date", "description", "district_id", "status"},
    "locations": {"id", "name", "latitude", "longitude", "district_id"},
    "district_indicators": {"id", "district_id", "unemployment_rate", "literacy_rate", "poverty_index"},
    "crime_stats": {"id", "district_id", "month", "year", "crime_count", "is_event_date", "event_name"},
    "conversations": {"id", "session_id", "user_id", "created_at"},
    "accused": {"id", "name", "age", "address", "fir_id"},
    "victims": {"id", "name", "age", "address", "fir_id"},
    "financial_transactions": {"id", "amount", "source_account", "destination_account", "date", "fir_id"},
    "messages": {"id", "conversation_id", "role", "content", "timestamp"}
}

QUERY_TEMPLATES = {
    "count_firs_by_district": "SELECT COUNT(*) AS count FROM firs JOIN districts ON firs.district_id = districts.id WHERE districts.name = :district_name",
    "count_firs_total": "SELECT COUNT(*) AS count FROM firs",
    "get_accused_by_age": "SELECT name, age, address FROM accused ORDER BY age DESC LIMIT :limit",
    "get_accused_list": "SELECT name, age, address FROM accused LIMIT :limit",
    "get_victims_list": "SELECT name, age, address FROM victims LIMIT :limit",
    "get_locations_list": "SELECT name, latitude, longitude FROM locations LIMIT :limit",
    "get_financial_transactions": "SELECT id, amount, source_account, destination_account FROM financial_transactions ORDER BY amount DESC LIMIT :limit",
    "get_district_indicators": "SELECT districts.name, unemployment_rate, literacy_rate, poverty_index FROM district_indicators JOIN districts ON district_indicators.district_id = districts.id",
    "get_fir_statuses": "SELECT status, COUNT(*) AS count FROM firs GROUP BY status",
    "get_recent_firs": "SELECT case_number, date, status, description FROM firs LIMIT :limit",
}

def call_llm(prompt: str, system_prompt: str = None) -> str:
    """
    Calls Google Gemini API (Free Tier), falling back to Ollama, and then to None.
    """
    # 1. Try Gemini API
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            
            contents = [{"parts": [{"text": prompt}]}]
            data = {"contents": contents}
            if system_prompt:
                data["systemInstruction"] = {"parts": [{"text": system_prompt}]}
                
            response = requests.post(url, json=data, timeout=8)
            if response.status_code == 200:
                resp_json = response.json()
                return resp_json["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"Gemini API error: {e}. Falling back...")
            
    # 2. Try Ollama
    ollama_url = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "gemma4:31b")
    if ollama_url:
        try:
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\nUser Prompt: {prompt}"
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": ollama_model,
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
        except Exception as e:
            print(f"Ollama API error: {e}. Falling back to Rule-Based engine...")
            
    raise RuntimeError("No active LLM engine found (both Gemini and Ollama are unavailable).")

def generate_sql(prompt: str, session_id: str = None) -> tuple[str, dict]:
    """
    Generates a structured SQL intent and parameters using LLM.
    Returns (sql_string, params).
    """
    history = get_chat_history(session_id) if session_id else []
    history_text = "\n".join(history)

    schema_description = (
        "Available Query Intents:\n"
        "- count_firs_by_district (params: district_name)\n"
        "- count_firs_total (params: {})\n"
        "- get_accused_by_age (params: limit)\n"
        "- get_accused_list (params: limit)\n"
        "- get_victims_list (params: limit)\n"
        "- get_locations_list (params: limit)\n"
        "- get_financial_transactions (params: limit)\n"
        "- get_district_indicators (params: {})\n"
        "- get_fir_statuses (params: {})\n"
        "- get_recent_firs (params: limit)\n"
    )

    system_prompt = (
        "You are a SQL intent generator for the KSP Crime Analytics Platform.\n"
        "You must output ONLY a JSON object. Do not explain, do not wrap in markdown.\n"
        f"Intents Registry:\n{schema_description}\n"
        "Example:\n"
        "Q: 'how many FIRs are in Bangalore?' -> {\"intent\": \"count_firs_by_district\", \"params\": {\"district_name\": \"Bangalore\"}}\n"
        "Q: 'show me recent cases' -> {\"intent\": \"get_recent_firs\", \"params\": {\"limit\": 10}}"
    )

    full_prompt = f"Recent History:\n{history_text}\n\nQuestion: {prompt}\nJSON:"

    try:
        response_text = call_llm(full_prompt, system_prompt)
        # Extract JSON if LLM added markdown
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            intent_data = json.loads(match.group(0))
        else:
            intent_data = json.loads(response_text)

        intent = intent_data.get("intent")
        params = intent_data.get("params", {})

        if intent not in QUERY_TEMPLATES:
            raise ValueError(f"Unknown intent: {intent}")

        sql_template = QUERY_TEMPLATES[intent]
        # We return the template and the params for parameterized execution
        return sql_template, params

    except Exception as e:
        print(f"SQL Intent Generation failure: {e}")
        # Fallback to a generic safe query
        return QUERY_TEMPLATES["get_recent_firs"], {"limit": 5}

def rule_based_generate_sql(prompt: str) -> str:
    prompt_lower = prompt.lower()
    
    # 1. Total FIRs
    if "how many fir" in prompt_lower or "count of fir" in prompt_lower or "total fir" in prompt_lower:
        if "bangalore" in prompt_lower:
            return "SELECT COUNT(*) AS count FROM firs JOIN districts ON firs.district_id = districts.id WHERE districts.name = 'Bangalore';"
        elif "mysuru" in prompt_lower:
            return "SELECT COUNT(*) AS count FROM firs JOIN districts ON firs.district_id = districts.id WHERE districts.name = 'Mysuru';"
        return "SELECT COUNT(*) AS count FROM firs;"
        
    # 2. Accused
    if "accused" in prompt_lower:
        if "old" in prompt_lower or "age" in prompt_lower:
            return "SELECT name, age, address FROM accused ORDER BY age DESC LIMIT 10;"
        return "SELECT name, age, address FROM accused LIMIT 10;"
        
    # 3. Victims
    if "victim" in prompt_lower:
        return "SELECT name, age, address FROM victims LIMIT 10;"
        
    # 4. Locations
    if "location" in prompt_lower or "station" in prompt_lower:
        return "SELECT name, latitude, longitude FROM locations LIMIT 10;"
        
    # 5. Financial transactions
    if "financial" in prompt_lower or "transaction" in prompt_lower or "money" in prompt_lower:
        return "SELECT id, amount, source_account, destination_account FROM financial_transactions ORDER BY amount DESC LIMIT 10;"
        
    # 6. Indicators
    if "indicator" in prompt_lower or "unemployment" in prompt_lower or "literacy" in prompt_lower:
        return "SELECT districts.name, unemployment_rate, literacy_rate, poverty_index FROM district_indicators JOIN districts ON district_indicators.district_id = districts.id;"
        
    # 7. Statuses
    if "status" in prompt_lower or "investigation" in prompt_lower:
        return "SELECT status, COUNT(*) AS count FROM firs GROUP BY status;"
        
    # Default
    return "SELECT case_number, date, status, description FROM firs LIMIT 5;"

def validate_sql_ast(sql: str) -> bool:
    """
    Validates SQL AST to ensure only SELECT statements and allowed tables/columns.
    """
    try:
        parsed = sqlglot.parse_one(sql, read="sqlite")
        if not isinstance(parsed, exp.Select):
            raise ValueError("Only SELECT statements are permitted.")

        for table in parsed.find_all(exp.Table):
            table_name = table.name.lower()
            if table_name not in ALLOWED_TABLES:
                raise ValueError(f"Access to table '{table_name}' is forbidden.")

        for column in parsed.find_all(exp.Column):
            col_name = column.name.lower()
            # Find which table this column belongs to if possible, otherwise check all
            found = False
            for table, cols in ALLOWED_COLUMNS.items():
                if col_name in cols:
                    found = True
                    break
            if not found:
                raise ValueError(f"Access to column '{col_name}' is forbidden.")

        return True
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"SQL AST validation failed: {str(e)}")

def validate_sql(sql: str) -> bool:
    forbidden_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "GRANT", "REVOKE"]
    sql_upper = sql.upper()
    if any(keyword in sql_upper for keyword in forbidden_keywords):
        raise ValueError("Forbidden SQL operation detected (DML/DDL queries not allowed).")
    return True

def execute_query(sql: str, params: dict = None):
    """
    Executes a parameterized SQL query after AST validation.
    """
    if params is None:
        params = {}

    # 1. AST Validation
    # We validate the template SQL (without values)
    validate_sql_ast(sql)

    with engine.connect() as connection:
        # Use SQLAlchemy's parameter binding
        result = connection.execute(text(sql), params)
        columns = result.keys()
        data = [dict(zip(columns, row)) for row in result]
        return data

def generate_conversational_response(query: str, sql: str, results: any, lang: str = "en") -> str:
    """
    Generates a helpful, natural language explanation of the database query results.
    """
    prompt = (
        f"Generate a professional, conversational response in English summarizing this query analysis.\n"
        f"Original User Question: '{query}'\n"
        f"Executed SQL Query: '{sql}'\n"
        f"Raw Database JSON Results: {json.dumps(results[:15])}\n"
        f"Provide a clear, brief, plain-language analysis suitable for a police supervisor or investigator.\n"
        f"Also explain the reasoning trail (i.e. 'I searched the FIRs table, joined it with locations...')."
    )
    
    system_prompt = (
        "You are the Conversational Crime Intelligence Assistant. Summarize query results accurately.\n"
        "Do not invent facts not shown in the JSON results. Keep the summary under 4 sentences.\n"
        "At the end, append a short block: 'Reasoning Trail: [1-sentence explanation of what data you retrieved]'"
    )

    try:
        response = call_llm(prompt, system_prompt)
        return response
    except Exception as e:
        print(f"Conversational answer generation LLM failure: {e}")
        # Rule-based response formatting
        if not results:
            return "No matching records were found in the database. Reasoning Trail: Checked the database with query, which returned 0 results."
        
        # General count check
        if "COUNT(*)" in sql or "count(*)" in sql or "count" in sql.lower():
            count_val = list(results[0].values())[0]
            return f"The database query successfully completed. The total matching count is {count_val}. Reasoning Trail: Ran aggregate counting on the matching table."
            
        if "accused" in sql.lower():
            names = [r.get("name") for r in results if r.get("name")]
            return f"Retrieved {len(results)} accused records. Names include: {', '.join(names[:5])}. Reasoning Trail: Searched name entries in the accused offenders table."
            
        if "victims" in sql.lower():
            names = [r.get("name") for r in results if r.get("name")]
            return f"Found {len(results)} victim listings in the records. Names: {', '.join(names[:5])}. Reasoning Trail: Pulled matching demographic records from the victims table."
            
        return f"Successfully retrieved {len(results)} matching records from the database. Reasoning Trail: Executed raw database scan matching search filters."

def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text between English and Kannada using LLM, with local fallbacks if unavailable.
    """
    if target_lang == 'en':
        prompt = f"Translate the following Kannada text to English. Return only the translated text, with no explanation or styling: {text}"
    else:
        prompt = f"Translate the following English text to Kannada. Return only the translated text, with no explanation or styling: {text}"

    try:
        return call_llm(prompt, "You are a professional English/Kannada translator. Return ONLY the direct translation.")
    except Exception as e:
        print(f"Translation failure: {e}")
        # Basic phrase mapping for demo fallback if no internet
        local_map = {
            "ಎಫ್ಐಆರ್": "FIR",
            "ಬೆಂಗಳೂರು": "Bangalore",
            "ಮೈಸೂರು": "Mysuru",
            "ಹೆಸರು": "Name",
            "ವಯಸ್ಸು": "Age",
            "ಹಣಕಾಸು": "Financial"
        }
        if target_lang == 'en':
            translated = text
            for k, v in local_map.items():
                translated = translated.replace(k, v)
            return translated
        return text # Return untranslated original text as absolute fallback
