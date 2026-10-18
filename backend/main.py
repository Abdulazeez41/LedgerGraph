import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import settings
from backend.api.routes import router
from backend.db.falkordb_client import db_client
from backend.db.schema import init_schema
from backend.db.seed_data import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ledgergraph")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FalkorDB Graph-Grounded SME Credit & Cash-Flow Copilot for Nigerian SMEs"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router)

# Mount Frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.on_event("startup")
def on_startup():
    logger.info("Initializing LedgerGraph backend...")
    health = db_client.check_health()
    if health.get("status") == "healthy":
        logger.info(f"Connected to FalkorDB on {health.get('host')}:{health.get('port')}. Nodes: {health.get('node_count')}")
        if health.get("node_count", 0) == 0:
            logger.info("FalkorDB graph is empty. Auto-seeding demo dataset...")
            try:
                seed_database(clear_first=False)
            except Exception as e:
                logger.error(f"Auto-seed error: {e}")
    else:
        logger.error(f"FalkorDB health check warning: {health.get('error')}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main.app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
