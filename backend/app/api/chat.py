from fastapi import APIRouter, Depends, HTTPException
from ..auth.dependencies import get_current_user, RoleChecker
from ..chat.service import generate_sql, validate_sql, execute_query, generate_conversational_response, translate_text
from ..chat.memory import save_chat_message
from ..chat.pdf import generate_chat_pdf
from ..schemas.auth import TokenData

router = APIRouter(prefix="/chat", tags=["Chatbot"])

@router.post("/query")
async def chat_query(query: str, session_id: str, lang: str = "en", user: TokenData = Depends(get_current_user)):
    try:
        original_query = query

        # Translate to English if needed
        if lang == "kn":
            query = translate_text(query, "en")

        # Save user message (original)
        save_chat_message(session_id, user.username, "user", original_query)

        sql, params = generate_sql(query, session_id)
        results = execute_query(sql, params)

        # Generate friendly conversational response
        conversational_resp = generate_conversational_response(original_query, sql, results)

        # Translate back to Kannada if needed
        if lang == "kn":
            conversational_resp = translate_text(conversational_resp, "kn")

        # Save bot response in memory
        save_chat_message(session_id, user.username, "bot", conversational_resp)

        return {
            "query": original_query,
            "sql": sql,
            "results": results,
            "response": conversational_resp
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/export-pdf")
async def export_pdf(session_id: str, user: TokenData = Depends(get_current_user)):
    return generate_chat_pdf(session_id)

