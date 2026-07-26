from fastapi import APIRouter, Depends
from ..auth.dependencies import get_current_user
from ..schemas.auth import TokenData
from ..database.session import engine
from sqlalchemy import text

router = APIRouter(prefix="/warnings", tags=["Early Warning"])

@router.get("/")
async def get_active_warnings(user: TokenData = Depends(get_current_user)):
    warnings = []
    with engine.connect() as connection:
        # 1. Crime Spikes (Compare last month to avg of last 6 months)
        # This is a simplified mock check
        res = connection.execute(text("SELECT district, crime_count FROM historical_crime_stats ORDER BY year DESC, month DESC LIMIT 10")).fetchall()
        # In a real scenario, we'd compute the spike. Here we simulate a few warnings.
        warnings.append({
            "type": "SPIKE",
            "level": "High",
            "message": "Abnormal spike in Theft detected in Bengaluru Urban district.",
            "district": "Bengaluru Urban"
        })

        # 2. Gang Activity (based on Louvain communities in Phase 3)
        warnings.append({
            "type": "ORGANIZED",
            "level": "Medium",
            "message": "New organized crime cluster detected in Mysuru region.",
            "district": "Mysuru"
        })

        # 3. Repeat Offender alert
        warnings.append({
            "type": "HABITUAL",
            "level": "Low",
            "message": "3+ Habitual offenders active in Belagavi district.",
            "district": "Belagavi"
        })

    return warnings
