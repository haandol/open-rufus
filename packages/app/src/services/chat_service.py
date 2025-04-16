import json
import asyncio
import traceback
from typing import List, AsyncGenerator, Optional, Dict, Any, Callable, cast

from langchain_aws import ChatBedrockConverse
from langchain.schema import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain.schema.messages import ToolMessage

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
        try:
            # 원래 대화에서 응답 생성
            ai_message = None
            
            # 응답을 스트리밍하고 AI 메시지 구성
            async for chunk in self.llm.astream(messages):
                # 메시지 누적
                if ai_message is None:
                    ai_message = chunk
                else:
                    ai_message = ai_message + chunk
                
                # 컨텐츠가 있는 경우 전송
                if chunk.content:
                    content = ''
                    if isinstance(chunk.content, list) and chunk.content:
                        content_type = chunk.content[0].get('type')
                        if content_type == 'text':
                            content = chunk.content[0].get('text', '')
                    elif isinstance(chunk.content, str):
                        content = chunk.content
                    elif isinstance(chunk.content, dict):
                        content = chunk.content.get('text', '')
                    
                    if content:
                        yield f"data: {json.dumps({'role': 'assistant', 'content': content, 'type': 'thinking'})}\n\n"
                        await asyncio.sleep(0)
                
            # 도구 호출이 있는 경우 처리
            if ai_message and ai_message.tool_calls:
                # 대화에 AI 메시지 추가 (이미 스트리밍됨)
                current_messages = messages + [ai_message]
                
                for tool_call in ai_message.tool_calls:
                    # 도구 호출 정보
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']
                    tool_call_id = tool_call['id']
                    
                    # 도구 실행 메시지
                    logger.info('Using tool to find information...', tool_name=tool_name, tool_args=tool_args)
                    
                    # 도구 실행
                    try:
                        tool_result = self.tool_dict[tool_name](**tool_args)
                        logger.info(f"Tool result for {tool_name}: {tool_result}")
                        
                        # 도구 결과 전송
                        yield f"data: {json.dumps({'role': 'tool', 'tool_call_id': tool_call_id, 'name': tool_name, 'content': tool_result})}\n\n"
                        await asyncio.sleep(0)
                        
                        # 도구 결과 메시지 생성
                        tool_message = ToolMessage(
                            content=str(tool_result) if not isinstance(tool_result, str) else tool_result,
                            tool_call_id=tool_call_id,
                            name=tool_name
                        )
                        
                        # 도구 결과 메시지를 대화에 추가
                        current_messages.append(tool_message)
                        
                    except Exception as e:
                        # 도구 실행 오류
                        error_msg = f"Error executing {tool_name}: {str(e)}"
                        logger.error(error_msg)
                        yield f"data: {json.dumps({'error': error_msg})}\n\n"
                
                # 도구 결과를 고려한 최종 응답 생성
                logger.info('Processing final results...')
                
                # 최종 응답 스트리밍
                async for final_chunk in self.llm.astream(current_messages):
                    if final_chunk.content:
                        final_content = ''
                        if isinstance(final_chunk.content, list) and final_chunk.content:
                            content_type = final_chunk.content[0].get('type')
                            if content_type == 'text':
                                final_content = final_chunk.content[0].get('text', '')
                        elif isinstance(final_chunk.content, str):
                            final_content = final_chunk.content
                        elif isinstance(final_chunk.content, dict):
                            final_content = final_chunk.content.get('text', '')
                        
                        if final_content:
                            yield f"data: {json.dumps({'role': 'assistant', 'content': final_content, 'type': 'final'})}\n\n"
                            await asyncio.sleep(0)

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
