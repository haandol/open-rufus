from typing import List
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """
    chat request model

    Attributes:
        recent_history (List[dict]): recent history
        user_message_content (str): user message content
        stream (bool): whether to stream response (default: True)
    """
    recent_history: List[dict]
    user_message_content: str
    stream: bool = True


class ChatResponse(BaseModel):
    """
    chat response model

    Attributes:
        content (str): response content
    """
    content: str
