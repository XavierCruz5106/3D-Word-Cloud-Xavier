from fastapi import APIRouter
from models.request import AnalyzeRequest
from models.response import AnalyzeResponse
from pipeline.analyze_pipeline import run_analysis

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return run_analysis(request.url)