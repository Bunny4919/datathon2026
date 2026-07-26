from fastapi import APIRouter, Depends
from ..auth.dependencies import get_current_user
from ..schemas.auth import TokenData
from ..database.session import engine
from sqlalchemy import text
import numpy as np

_transformer_model = None

def get_transformer_model():
    global _transformer_model
    if _transformer_model is None:
        from sentence_transformers import SentenceTransformer
        _transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _transformer_model

router = APIRouter(prefix="/similarity", tags=["Similarity Search"])

@router.get("/similar-cases/{fir_id}")
async def find_similar_cases(fir_id: int, user: TokenData = Depends(get_current_user)):
    with engine.connect() as connection:
        # Get current FIR description
        current_fir = connection.execute(text("SELECT description FROM firs WHERE id = :id"), {"id": fir_id}).fetchone()
        if not current_fir: 
            return {"error": "FIR not found"}
        current_desc = current_fir[0]

        # Get all other FIR descriptions
        all_firs = connection.execute(text("SELECT id, description FROM firs WHERE id != :id"), {"id": fir_id}).fetchall()
        if not all_firs:
            return []
        other_ids = [r[0] for r in all_firs]
        other_descs = [r[1] for r in all_firs]

    try:
        from sentence_transformers import util
        model = get_transformer_model()
        current_emb = model.encode(current_desc, convert_to_tensor=True)
        other_embs = model.encode(other_descs, convert_to_tensor=True)
        cosine_scores = util.cos_sim(current_emb, other_embs)[0]
        top_results = np.argsort(cosine_scores.cpu().numpy())[-3:][::-1]

        similar_cases = []
        for idx in top_results:
            if idx < len(other_ids):
                similar_cases.append({
                    "fir_id": other_ids[idx],
                    "similarity": float(cosine_scores[idx]),
                    "description": other_descs[idx]
                })
        return similar_cases
    except Exception as e:
        print(f"SentenceTransformer unavailable/failed, using TF-IDF fallback: {e}")

    # Fallback to TF-IDF vectorization
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([current_desc] + other_descs)
        
        # Calculate similarity between first document (current) and all others
        scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        # Get top 3 indices
        top_results = np.argsort(scores)[-3:][::-1]
        
        similar_cases = []
        for idx in top_results:
            if idx < len(other_ids):
                similar_cases.append({
                    "fir_id": other_ids[idx],
                    "similarity": float(scores[idx]),
                    "description": other_descs[idx]
                })
        return similar_cases
    except Exception as err:
        return {"error": f"Similarity calculation failed: {str(err)}"}

