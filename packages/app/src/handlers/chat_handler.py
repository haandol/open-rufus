import traceback
from typing import List, Dict, Any

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from src.services.chat_service import ChatService
from src.utils.models import ChatResponse


async def handle_chat_request(
    recent_history: List[Dict[str, Any]],
    user_message_content: str,
    stream: bool = True,
    chat_service: ChatService = None,
):
    """
    handle chat request

    Args:
        recent_history (List[Dict[str, Any]]): recent history
        user_message_content (str): user message content
        stream (bool, optional): whether to stream response. default is True.
        chat_service (ChatService, optional): chat service instance

    Returns:
        Union[StreamingResponse, ChatResponse]: response object
    """
    langchain_messages = chat_service.convert_to_langchain_messages(
        recent_history)
    messages = chat_service.build_messages(
        langchain_messages, user_message_content)

    # if not streaming, generate complete response
    if not stream:
        try:
            response_content = await chat_service.generate_complete_response(
                messages
            )
            return ChatResponse(content=response_content)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

    # SSE streaming response
    return StreamingResponse(
        chat_service.generate_streaming_response(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
