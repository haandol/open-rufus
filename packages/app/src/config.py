import os
from dataclasses import dataclass

from dotenv import load_dotenv
load_dotenv()  # noqa: E402


MODEL_ID = os.getenv("MODEL_ID")
assert MODEL_ID, "MODEL_ID environment variable not set"
MODEL_TEMPERATURE = float(os.getenv("MODEL_TEMPERATURE", 0.3))
MODEL_MAX_TOKENS = int(os.getenv("MODEL_MAX_TOKENS", 1024 * 2))

# Item Search API
ITEM_SEARCH_API_KEY = os.getenv("ITEM_SEARCH_API_KEY")
assert ITEM_SEARCH_API_KEY, "ITEM_SEARCH_API_KEY environment variable not set"
ITEM_SEARCH_API_URL = os.getenv("ITEM_SEARCH_API_URL")
assert ITEM_SEARCH_API_URL, "ITEM_SEARCH_API_URL environment variable not set"

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
assert ENVIRONMENT, "ENVIRONMENT environment variable not set"


@dataclass
class Config:
    model_id: str
    temperature: float
    max_tokens: int
    item_search_api_key: str
    item_search_api_url: str
    environment: str

config = Config(
  model_id=MODEL_ID,
  temperature=MODEL_TEMPERATURE,
  max_tokens=MODEL_MAX_TOKENS,
  item_search_api_key=ITEM_SEARCH_API_KEY,
  item_search_api_url=ITEM_SEARCH_API_URL,
  environment=ENVIRONMENT,
)