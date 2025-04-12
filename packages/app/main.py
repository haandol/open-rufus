import os

from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.utils.models import ChatRequest
from src.handlers.chat_handler import handle_chat_request
from src.services.chat_service import ChatService
from src.constant import MODEL_TEMPERATURE, MODEL_MAX_TOKENS

load_dotenv()

app = FastAPI(title="Open Rufus Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_chat_service():
    """
    return chat service instance

    Returns:
        ChatService: chat service instance
    """
    return ChatService(
        model=os.getenv(
            "MODEL_NAME", "us.anthropic.claude-3-7-sonnet-20250219-v1:0"),
        temperature=MODEL_TEMPERATURE,
        max_tokens=MODEL_MAX_TOKENS,
    )


@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    """
    handle chat request

    Args:
        request (ChatRequest): chat request data
        llm_service (LLMService): LLM service instance

    Returns:
        Union[StreamingResponse, ChatResponse]: response object
    """
    return await handle_chat_request(
        request.recent_history,
        request.user_message_content,
        request.stream,
        chat_service,
    )


@app.get("/health")
async def health_check():
    """
    check server status

    Returns:
        dict: server status information
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import os
    import uvicorn

    PORT = os.getenv("PORT", 8000)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
