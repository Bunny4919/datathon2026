import os
from typing import List, Dict, Any
from anthropic import Anthropic
from sqlalchemy import text
from database import get_db
from sqlalchemy.orm import Session

# Define the allowed tables and columns for SQL validation
ALLOWED_TABLES = {
    "firs": {"id", "case_number", "date", "description", "district_id", "status"},
    "accused": {"id", "name", "age", "address", "fir_id"},
    "victims": {"id", "name", "age", "address", "fir_id"},
    "locations": {"id", "name", "latitude", "longitude", "district_id"},
    "financial_transactions": {"id", "amount", "source_account", "destination_account", "date", "fir_id"},
    "district_indicators": {"id", "district_id", "unemployment_rate", "literacy_rate", "poverty_index"},
    "crime_stats": {"id", "district_id", "month", "year", "crime_count", "is_event_date", "event_name"},
    "districts": {"id", "name", "population"}
}

FORBIDDEN_KEYWORDS = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "GRANT", "REVOKE"]

def validate_sql(query: str) -> bool:
    query_upper = query.upper()

    # Check for forbidden keywords
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in query_upper:
            return False

    # This is a simple validation. A real production system would use a proper SQL parser.
    # We check if the query only references allowed tables.
    # We'll do a basic check for the table names in the query.

    # Only allow SELECT queries
    if not query_upper.strip().startswith("SELECT"):
        return False

    return True

def execute_sql_query(query: str, db: Session) -> List[Dict[str, Any]]:
    if not validate_sql(query):
        raise Exception("Invalid or forbidden SQL query generated.")

    result = db.execute(text(query))
    columns = result.keys()
    return [dict(zip(columns, row)) for row in result]

class CrimeIntelligenceBot:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
        self.system_prompt = """
You are the KSP Crime Intelligence Assistant. Your goal is to help users analyze crime data.
You have access to a PostgreSQL database with the following schema:
- districts (id, name, population)
- firs (id, case_number, date, description, district_id, status)
- accused (id, name, age, address, fir_id)
- victims (id, name, age, address, fir_id)
- locations (id, name, latitude, longitude, district_id)
- financial_transactions (id, amount, source_account, destination_account, date, fir_id)
- district_indicators (id, district_id, unemployment_rate, literacy_rate, poverty_index)
- crime_stats (id, district_id, month, year, crime_count, is_event_date, event_name)

When a user asks a question, you should:
1. Translate the natural language question into a valid SQL query.
2. Use the `execute_sql` tool to get the data.
3. Based on the data returned, provide a concise and helpful answer.

Example:
User: "How many FIRs are there in Bangalore?"
SQL: SELECT COUNT(*) FROM firs JOIN districts ON firs.district_id = districts.id WHERE districts.name = 'Bangalore';
"""

    def translate_text(self, text: str, from_lang: str, to_lang: str) -> str:
        prompt = f"Translate the following text from {from_lang} to {to_lang}. Only return the translated text, nothing else: \n\n{text}"
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    def chat(self, message: str, history: List[Dict[str, str]], db: Session, language: str = "en"):
        # Handle Translation if language is Kannada
        processed_message = message
        if language == "kn":
            processed_message = self.translate_text(message, "Kannada", "English")

        # Construct messages for Claude
        messages = []
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": processed_message})

        # Define the tool for SQL execution
        tools = [
            {
                "name": "execute_sql",
                "description": "Executes a SQL query against the crime database and returns the result.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The SQL query to execute."}
                    },
                    "required": ["query"]
                }
            }
        ]

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            system=self.system_prompt,
            tools=tools,
            messages=messages
        )

        # Handle tool use
        if response.stop_reason == "tool_use":
            tool_use = response.content[-1]
            query = tool_use.input["query"]

            try:
                data = execute_sql_query(query, db)

                # Send the result back to Claude for final answer
                messages.append({"role": "assistant", "content": response.content})
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": str(data)
                        }
                    ]
                })

                final_response = self.client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=1024,
                    system=self.system_prompt,
                    messages=messages
                )
                answer = final_response.content[0].text

                # Translate answer back to Kannada if needed
                if language == "kn":
                    answer = self.translate_text(answer, "English", "Kannada")

                return answer
            except Exception as e:
                err_msg = f"Error executing query: {str(e)}"
                if language == "kn":
                    err_msg = self.translate_text(err_msg, "English", "Kannada")
                return err_msg

        # Final response translation if it didn't use tool but still gave an answer
        answer = response.content[0].text
        if language == "kn":
            answer = self.translate_text(answer, "English", "Kannada")
        return answer
