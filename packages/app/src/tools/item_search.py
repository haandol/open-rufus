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
    All parameters must be English keywords.

    Attributes:
        name (str): The keyword of item name to search for, only accept English keywords.
        category (str): The category of items to search in, only accept English keywords.
    """

    name: str = Field(
        title="Name",
        description="The keyword of item name to search for, only accept English keywords.",
    )
    category: str = Field(
        title="Category",
        description="The category of items to search in, only accept English keywords.",
    )


# TODO: use hybrid search (e.g embedding) for category
def item_search(name: str = "", category: str = "") -> list:
    """
    Use this tool only for searching items in Coco Retails.
    Searches only for items in the Coco Retails based on the given parameters.
    All parameters must be English keywords.

    ## Tool Parameters
    - name (str): The keyword of item name to search for, only accept English keywords.
    - category (str): The category of items to search in, only accept English keywords.

    ## Category Values
    Category is combined with first and second level categories with a underscore.
    - First Level Category:
        - Apparel
        - Accessories
        - Footwear
        - Personal Care
        - Free Items
        - Sporting Goods
        - Home
    - Second Level Category:
        - Topwear
        - Bottomwear
        - Watches
        - Socks
        - Shoes
        - Belts
        - Flip Flops
        - Bags
        - Innerwear
        - Sandal
        - Shoe Accessories
        - Apparel Set
        - Headwear
        - Mufflers
        - Skin Care
        - Makeup
        - Free Gifts
        - Ties
        - Accessories
        - Water Bottle
        - Eyes
        - Bath and Body
        - Gloves
        - Sports Accessories
        - Cufflinks
        - Sports Equipment
        - Stoles
        - Hair
        - Perfumes
        - Home Furnishing
        - Umbrellas
        - Wristbands
        - Vouchers
    """
    headers = {"Authorization": ITEM_SEARCH_API_KEY}
    logger.info(f"Item Searching for [name] {name}, [category] {category.upper()}")
    params = {
        "name": name,
        "category": category.upper(),
        "limit": 3,
    }
    resp = requests.get(
        f"{ITEM_SEARCH_API_URL}/v1/search/item/",
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
