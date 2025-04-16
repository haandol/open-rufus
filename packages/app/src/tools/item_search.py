import os
import requests
import traceback
from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool

from src.utils.logger import logger

AUTH_API_KEY = os.environ.get("AUTH_API_KEY", None)
assert AUTH_API_KEY, "AUTH_API_KEY environment variable not set"
ITEM_API_URL = os.environ.get("ITEM_API_URL", None)
assert ITEM_API_URL, "ITEM_API_URL environment variable not set"


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
    return [
        {
            "id": 1,
            "gender": "Men",
            "masterCategory": "Apparel",
            "subCategory": "Topwear",
            "articleType": "Shirts",
            "baseColour": "Navy Blue",
            "season": "Fall",
            "year": 2011,
        },
        {
            "id": 2,
            "gender": "Men",
            "masterCategory": "Apparel",
            "subCategory": "Bottomwear",
            "articleType": "Jeans",
            "baseColour": "Blue",
            "season": "Summer",
            "year": 2012,
            "usage": "Casual",
            "productDisplayName": "Peter England Men Party Blue Jeans",
        },
    ]

    headers = {"Authorization": AUTH_API_KEY}
    logger.info(f"Item Searching for [name] {name}, [category] {category.upper()}")
    params = {
        "name": name,
        "category": category.upper(),
        "limit": 5,
    }
    resp = requests.get(
        str(ITEM_API_URL),
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
