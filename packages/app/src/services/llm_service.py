import json
import asyncio
import traceback
from typing import List, AsyncGenerator, Optional

from langchain_aws import ChatBedrockConverse


class LLMService:
    def __init__(
        self,
        model: str,
        temperature: float = 0,
        max_tokens: Optional[int] = None
    ):
        """
        initialize LLM service

        Args:
            model (str): model name to use
            temperature (float): model temperature value
            max_tokens (Optional[int]): maximum tokens
        """
        self.llm = ChatBedrockConverse(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def generate_streaming_response(self, langchain_messages: List) -> AsyncGenerator[str, None]:
        """
        generate streaming response

        Args:
            langchain_messages (List): LangChain format message list

        Yields:
            str: SSE format response data
        """
        try:
            # generate streaming response
            async for chunk in self.llm.astream(langchain_messages):
                if chunk.content:
                    content = chunk.content
                    if isinstance(content, dict):
                        content = content.get('text', '')
                    yield f"data: {json.dumps({'content': content})}\n\n"
                    await asyncio.sleep(0)  # allow other tasks to run

        except Exception as e:
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    async def generate_complete_response(self, langchain_messages: List) -> str:
        """
        generate complete response

        Args:
            langchain_messages (List): LangChain format message list

        Returns:
            str: LLM's complete response
        """
        try:
            response = self.llm.invoke(langchain_messages)
            content = response.content
            if isinstance(content, dict):
                content = content.get('text', '')
            return content
        except Exception as e:
            traceback.print_exc()
            return f"Error: {str(e)}"
