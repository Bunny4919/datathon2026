from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import User, Conversation, Message
from auth import create_access_token, get_password_hash, verify_password, get_current_user, Token, RoleChecker
from chatbot import CrimeIntelligenceBot
import uuid

app = FastAPI()
bot = CrimeIntelligenceBot()

@app.get("/")
async def root():
    return {"message": "KSP Crime Intelligence Platform API is running"}

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"username": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/analyst-data", dependencies=[Depends(RoleChecker(["Analyst", "Supervisor", "Policymaker"]))])
async def get_analyst_data():
    return {"data": "This is sensitive analyst data."}

@app.get("/supervisor-admin", dependencies=[Depends(RoleChecker(["Supervisor", "Policymaker"]))])
async def get_supervisor_data():
    return {"data": "This is supervisor-level admin data."}

@app.get("/policymaker-dashboard", dependencies=[Depends(RoleChecker(["Policymaker"]))])
async def get_policymaker_data():
    return {"data": "This is high-level policymaker dashboard data."}

@app.post("/chat")
async def chat_endpoint(
    message: str,
    session_id: str = None,
    language: str = "en",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not session_id:
        session_id = str(uuid.uuid4())

    # Retrieve or create conversation
    conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
    if not conv:
        # We need a user_id. For now, we'll find the user from the DB.
        user = db.query(User).filter(User.username == current_user["username"]).first()
        conv = Conversation(session_id=session_id, user_id=user.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Get history
    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.timestamp).all()
    history = [{"role": m.role, "content": m.content} for m in messages]

    # Get response from bot
    response_text = bot.chat(message, history, db, language=language)

    # Save messages
    db.add(Message(conversation_id=conv.id, role="user", content=message))
    db.add(Message(conversation_id=conv.id, role="assistant", content=response_text))
    db.commit()

    return {"response": response_text, "session_id": session_id}
