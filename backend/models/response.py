from pydantic import BaseModel
from typing import List, Optional

class WordTopic(BaseModel):
    word: str
    weight: float
    category: Optional[str] = "default"

class AnalyzeResponse(BaseModel):
    title: str
    summary: str
    topics: List[WordTopic]