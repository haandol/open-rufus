import traceback
from typing import List, Dict, Any

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from src.utils.message_utils import convert_to_langchain_messages
from src.services.chat_service import ChatService


class ChatResponse:
    def __init__(self, content: str):
        self.content = content


async def handle_chat_request(
    messages: List[Dict[str, Any]], stream: bool = True, chat_service: ChatService = None
):
    """
    handle chat request

    Args:
        messages (List[Dict[str, Any]]): chat message list
        stream (bool, optional): whether to stream response. default is True.
        chat_service (ChatService, optional): chat service instance

    Returns:
        Union[StreamingResponse, ChatResponse]: response object
    """
    langchain_messages = convert_to_langchain_messages(messages)

    # if not streaming, generate complete response
    if not stream:
        try:
            response_content = await chat_service.generate_complete_response(
                langchain_messages
            )
            return ChatResponse(content=response_content)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

    # SSE streaming response
    return StreamingResponse(
        chat_service.generate_streaming_response(langchain_messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
