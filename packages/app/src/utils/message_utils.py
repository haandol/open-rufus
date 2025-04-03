from typing import List, Dict, Any

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage


def convert_to_langchain_messages(messages: List[Dict[str, Any]]) -> List[BaseMessage]:
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
