from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from .memory import get_chat_history
import io
from fastapi.responses import StreamingResponse

def generate_chat_pdf(session_id: str):
    history = get_chat_history(session_id)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 50, "KSP Crime Intelligence Platform - Chat Transcript")
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 70, f"Session ID: {session_id}")

    y = height - 100
    for msg in history:
        # Split role and content
        role, content = msg.split(": ", 1)

        # Handle page break
        if y < 50:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 12)

        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, f"{role}:")
        p.setFont("Helvetica", 12)

        # Simple text wrapping for the content
        text_object = p.beginText(150, y)
        text_object.textLine(content[:80]) # Simple truncation/wrap for demo
        if len(content) > 80:
            text_object.textLine(content[80:160])
            if len(content) > 160:
                text_object.textLine(content[160:240])
        p.drawText(text_object)

        y -= 40

    p.showPage()
    p.save()

    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=transcript_{session_id}.pdf"
    })
