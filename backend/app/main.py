from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings, limiter
from .api.auth import router as auth_router
from .api.chat import router as chat_router
from .api.graph import router as graph_router
from .api.analytics import router as analytics_router
from .api.forecast import router as forecast_router
from .api.decision_support import router as decision_support_router
from .api.warnings import router as warnings_router
from .api.similarity import router as similarity_router
from .api.evidence import router as evidence_router
from .models.user import Base
import models
from .database.session import engine
from .middleware.audit import AuditMiddleware
from slowapi.middleware import SlowAPIMiddleware

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KSP Crime Intelligence Platform API",
    description="AI-powered Crime Analytics & Conversational Intelligence Platform for Karnataka State Police",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(AuditMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception here in a real scenario
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred. Please contact your administrator."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
app.include_router(auth_router)
# Chatbot / NL Query
app.include_router(chat_router)
# Criminal Network Graph
app.include_router(graph_router)
# Analytics (trends, hotspots, profiles, correlations)
app.include_router(analytics_router)
# Predictive Forecasting (ARIMA)
app.include_router(forecast_router)
# Decision Support (case summary, timeline, leads)
app.include_router(decision_support_router)
# Early Warning System
app.include_router(warnings_router)
# Case Similarity Search
app.include_router(similarity_router)
app.include_router(evidence_router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Welcome to KSP Crime Intelligence Platform API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
