import os
import requests
import traceback
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool

from src.utils.logger import logger

ITEM_SEARCH_API_KEY = os.environ.get("ITEM_SEARCH_API_KEY", None)
assert ITEM_SEARCH_API_KEY, "ITEM_SEARCH_API_KEY environment variable not set"
ITEM_SEARCH_API_URL = os.environ.get("ITEM_SEARCH_API_URL", None)
assert ITEM_SEARCH_API_URL, "ITEM_SEARCH_API_URL environment variable not set"


class ItemSearchInput(BaseModel):
    """
    Input schema for item search operations.

    name and category parameters are only accept English keywords.

    Attributes:
        name (str): The keyword of item name to search for.
        category (str): The category of items to search in.
    """

    name: str = Field(
        title="Name",
        description="The keyword of item name to search for",
    )
    category: str = Field(
        title="Category",
        description="The category of items to search in",
    )


def item_search(name: str = "", category: str = "") -> list:
    """
    Use this tool only for searching items in Coco Retails.
    Searches only for items in the Coco Retails based on the given parameters.

    ## Tool Parameters
    - name (str): The keyword of item name to search for.
    - category (str): The category of items to search in.
    """
    headers = {"Authorization": ITEM_SEARCH_API_KEY}
    logger.info(f"Item Searching for [name] {name}, [category] {category.upper()}")
    params = {
        "name": name,
        "category": category.upper(),
        "limit": 5,
    }
    resp = requests.get(
        f"{ITEM_SEARCH_API_URL}/v1/item/search",
        params=params,
        headers=headers,
        verify=False,
        timeout=5,
    )
    # check status
    try:
        resp.raise_for_status()
    except Exception:
        logger.error(f"Error in item search: {traceback.format_exc()}")
        return []
    # check response
    try:
        result = resp.json()
        if "error" in result:
            logger.error(f"Error in item search: {result['error']}")
        return result["content"]
    except requests.exceptions.JSONDecodeError as e:
        logger.error(f"Error in item search: {e}")
        return []


tool = StructuredTool.from_function(
    func=item_search,
    name="item_search",
    description=item_search.__doc__,
    args_schema=ItemSearchInput,
    return_direct=True,
)
