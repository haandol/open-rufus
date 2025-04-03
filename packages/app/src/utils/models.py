from typing import List
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """
    chat request model

    Attributes:
        messages (List[dict]): chat message list
        stream (bool): whether to stream response (default: True)
    """
    messages: List[dict]
    stream: bool = True


class ChatResponse(BaseModel):
    """
    chat response model

    Attributes:
        content (str): response content
    """
    content: str
