from dotenv import load_dotenv
load_dotenv()  # noqa: E402

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.config import config
from src.utils.models import ChatRequest
from src.adapters.chat_controller import handle_chat_request
from src.services.chat_service import ChatService

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
        model=config.model_id,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
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
