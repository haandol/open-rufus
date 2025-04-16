import json
import asyncio
import traceback
from typing import List, AsyncGenerator, Optional, Dict, Any, Callable, cast

from langchain_aws import ChatBedrockConverse
from langchain.schema import BaseMessage, SystemMessage, HumanMessage, AIMessage

from src.prompts.chat import SYSTEM_PROMPT
from src.tools.item_search import tool as item_search_tool
from src.utils.logger import logger


class ChatService:
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
        tools = [item_search_tool]
        self.llm = ChatBedrockConverse(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        ).bind_tools(tools)
        self.system_prompt = SYSTEM_PROMPT
        self.tool_dict = {tool.name: cast(Callable, tool.func) for tool in tools}

    def _build_system_prompt(self) -> BaseMessage:
        """
        build system prompt

        Returns:
            BaseMessage: system prompt
        """
        return SystemMessage(content=[
            {
                "type": "text",
                "text": self.system_prompt
            },
            # TODO: add cache point
            # {
            #     "cachePoint": { "type": "default" },
            # },
        ])

    def build_messages(self, recent_history: List[BaseMessage], user_message_content: str) -> List[BaseMessage]:
        """
        build messages for chat

        Args:
            recent_history (List): recent history
            user_message_content (str): user message content

        Returns:
            List[BaseMessage]: message list
        """
        return [
            self._build_system_prompt(),
            *recent_history,
            HumanMessage(content=user_message_content),
        ]

    async def generate_streaming_response(self, messages: List[BaseMessage]) -> AsyncGenerator[str, None]:
        """
        generate streaming response

        Args:
            messages (List[BaseMessage]): message list

        Yields:
            str: SSE format response data
        """
        gathered = None
        first = True
        try:
            # generate streaming response
            async for chunk in self.llm.astream(messages):
                if first:
                    gathered = chunk
                    first = False
                else:
                    gathered += chunk

                if chunk.content:
                    content = ''
                    logger.info(f"Content: {content}, {type(content)}")
                    if isinstance(chunk.content, list):
                        content_type = chunk.content[0].get('type')
                        if content_type == 'text':
                            content = chunk.content[0].get('text', '')
                    if content:
                        yield f"data: {json.dumps({'role': 'assistant', 'content': content})}\n\n"
                        await asyncio.sleep(0)  # allow other tasks to run

            if gathered.tool_calls:
                logger.info(f"Tool calls: {gathered.tool_calls}")
                tool_call = gathered.tool_calls[0]
                tool_name = tool_call['name']
                tool_args = tool_call['args']
                tool_result = self.tool_dict[tool_name](**tool_args)
                logger.info(f"Tool result: {tool_result}")
                tool_message = {
                    'role': 'tool',
                    'tool_call_id': tool_call['id'],
                    'content': tool_result,
                }
                yield f"data: {json.dumps(tool_message)}\n\n"

        except Exception as e:
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    async def generate_complete_response(self, messages: List[BaseMessage]) -> str:
        """
        generate complete response

        Args:
            messages (List[BaseMessage]): message list

        Returns:
            str: LLM's complete response
        """
        try:
            response = await self.llm.ainvoke(messages)
            content = response.content
            if isinstance(content, dict):
                content = content.get('text', '')
            return content
        except Exception as e:
            traceback.print_exc()
            return f"Error: {str(e)}"

    def convert_to_langchain_messages(self, messages: List[Dict[str, Any]]) -> List[BaseMessage]:
        """
        convert general message dictionary to LangChain message format

        Args:
            messages (List[Dict[str, Any]]): message list to convert

        Returns:
            List: LangChain message object list
        """
        langchain_messages = []
        for msg in messages:
            if msg["role"] == "user":
                langchain_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langchain_messages.append(AIMessage(content=msg["content"]))
        return langchain_messages
