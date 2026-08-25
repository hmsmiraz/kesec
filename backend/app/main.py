from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, secrets

# Creates tables if they don't exist yet. Fine for an MVP; a growing app
# should switch to Alembic migrations to evolve the schema safely over time.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kesec API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(secrets.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}
