from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Meesho Pragati Agent — ML Model",
    description="Inference service for the Pragati agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input text for inference")


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    model_version: str = "1.0.0"


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-model"}


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Run inference on the provided text."""
    # Placeholder logic — replace with your trained model
    return PredictResponse(
        prediction=f"Processed: {request.text[:100]}",
        confidence=0.95,
    )
