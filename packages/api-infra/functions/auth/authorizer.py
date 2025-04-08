import os

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.data_classes.api_gateway_authorizer_event import (
    APIGatewayAuthorizerEventV2,
)

API_KEY = os.environ["API_KEY"]

tracer = Tracer(service="authorizer")
logger = Logger(service="authorizer")


@tracer.capture_lambda_handler
def lambda_handler(event, _) -> dict:
    event = APIGatewayAuthorizerEventV2(event)
    logger.info(f"Authorizing request with headers: {event}")

    return {
        "isAuthorized": event.get_header_value("Authorization") == API_KEY,
    }
