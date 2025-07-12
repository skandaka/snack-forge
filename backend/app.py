from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from routes import nutrition, ai, snacks, ingredients
from services.nutrition_service import NutritionService
from services.ai_service import AIService
from models.health_scorer import HealthScorer
from models.ingredient_embeddings import IngredientEmbeddings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services that need to be initialized
nutrition_service = None
ai_service = None
health_scorer = None
ingredient_embeddings = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global nutrition_service, ai_service, health_scorer, ingredient_embeddings

    logger.info("Initializing services...")

    # Initialize ML models
    health_scorer = HealthScorer()
    await health_scorer.load_model()

    ingredient_embeddings = IngredientEmbeddings()
    await ingredient_embeddings.load_embeddings()

    # Initialize services
    nutrition_service = NutritionService(health_scorer)
    ai_service = AIService(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        nutrition_service=nutrition_service,
        embeddings=ingredient_embeddings
    )

    # Make services available to routes
    app.state.nutrition_service = nutrition_service
    app.state.ai_service = ai_service
    app.state.health_scorer = health_scorer
    app.state.ingredient_embeddings = ingredient_embeddings

    logger.info("All services initialized successfully")
    yield

    # Shutdown
    logger.info("Shutting down services...")


# Create FastAPI app
app = FastAPI(
    title="SnackSmith API",
    description="AI-powered snack design and nutrition analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": "http_error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "server_error"}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "nutrition_service": nutrition_service is not None,
            "ai_service": ai_service is not None,
            "health_scorer": health_scorer is not None,
            "ingredient_embeddings": ingredient_embeddings is not None
        }
    }


# Include routers
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(snacks.router, prefix="/api/snacks", tags=["snacks"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["ingredients"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SnackSmith API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )