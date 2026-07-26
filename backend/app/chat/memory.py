import os
import hashlib
from sqlalchemy import text
from ..database.session import engine
from datetime import datetime

def get_chat_history(session_id: str):
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT m.role, m.content "
                "FROM messages m "
                "JOIN conversations c ON m.conversation_id = c.id "
                "WHERE c.session_id = :sid "
                "ORDER BY m.timestamp ASC LIMIT 10"
            ),
            {"sid": session_id}
        )
        return [f"{row[0]}: {row[1]}" for row in result]

def save_chat_message(session_id: str, username_or_id: any, role: str, message: str):
    with engine.connect() as connection:
        # Resolve username to integer user_id if passed as string
        real_user_id = 1
        if isinstance(username_or_id, str):
            user_row = connection.execute(
                text("SELECT id FROM users WHERE username = :uname LIMIT 1"),
                {"uname": username_or_id}
            ).fetchone()
            if user_row:
                real_user_id = user_row[0]
        elif isinstance(username_or_id, int):
            real_user_id = username_or_id

        # Check if conversation exists
        result = connection.execute(
            text("SELECT id FROM conversations WHERE session_id = :sid"),
            {"sid": session_id}
        ).fetchone()

        if result:
            conv_id = result[0]
        else:
            # Create a new conversation
            connection.execute(
                text("INSERT INTO conversations (session_id, user_id, created_at) VALUES (:sid, :uid, :now)"),
                {"sid": session_id, "uid": real_user_id, "now": datetime.utcnow()}
            )
            # Retrieve the newly created ID
            conv_id = connection.execute(
                text("SELECT id FROM conversations WHERE session_id = :sid"),
                {"sid": session_id}
            ).fetchone()[0]

        # Hash Chain Logic
        # 1. Get prev_hash (last message in this conversation)
        last_msg = connection.execute(
            text("SELECT message_hash FROM messages WHERE conversation_id = :cid ORDER BY timestamp DESC LIMIT 1"),
            {"cid": conv_id}
        ).fetchone()

        prev_hash = last_msg[0] if last_msg else session_id

        # 2. Calculate current hash
        timestamp = datetime.utcnow().isoformat()
        hash_input = f"{timestamp}{role}{message}{prev_hash}"
        message_hash = hashlib.sha256(hash_input.encode()).hexdigest()

        connection.execute(
            text("INSERT INTO messages (conversation_id, role, content, timestamp, prev_hash, message_hash) VALUES (:cid, :role, :msg, :now, :phash, :mhash)"),
            {"cid": conv_id, "role": role, "msg": message, "now": timestamp, "phash": prev_hash, "mhash": message_hash}
        )
        connection.commit()

def verify_chat_integrity(session_id: str) -> bool:
    """
    Traverses the hash chain for a session and validates integrity.
    Returns True if valid, False otherwise.
    """
    with engine.connect() as connection:
        # Get conversation id
        conv_res = connection.execute(
            text("SELECT id FROM conversations WHERE session_id = :sid"),
            {"sid": session_id}
        ).fetchone()
        if not conv_res:
            return False
        conv_id = conv_res[0]

        # Get all messages in order
        messages = connection.execute(
            text("SELECT timestamp, role, content, prev_hash, message_hash FROM messages WHERE conversation_id = :cid ORDER BY timestamp ASC"),
            {"cid": conv_id}
        ).fetchall()

        expected_prev_hash = session_id

        for row in messages:
            timestamp, role, content, prev_hash, message_hash = row

            # Validate prev_hash matches
            if prev_hash != expected_prev_hash:
                return False

            # Validate message_hash
            hash_input = f"{timestamp}{role}{content}{prev_hash}"
            calculated_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            if calculated_hash != message_hash:
                return False

            expected_prev_hash = message_hash

        return True


