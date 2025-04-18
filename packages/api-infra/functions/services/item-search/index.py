import os
import traceback
from http import HTTPStatus

import boto3
from opensearchpy import OpenSearch, Search, RequestsHttpConnection, AWSV4SignerAuth
from opensearchpy.helpers.query import Q
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import (
    APIGatewayHttpResolver,
    Response,
    content_types,
)
from aws_lambda_powertools.event_handler.router import APIGatewayHttpRouter

# setup environment variables
OPENSEARCH_HOST = os.environ["OPENSEARCH_HOST"]
INDEX_NAME = os.environ["INDEX_NAME"]
AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")

tracer = Tracer(service="item-search")
logger = Logger(service="item-search")
app = APIGatewayHttpResolver(strip_prefixes=["/v1/search/item"])
router = APIGatewayHttpRouter()

# setup OpenSearch client
credentials = boto3.Session().get_credentials()
auth = AWSV4SignerAuth(credentials, AWS_REGION)
logger.info(f"Connecting to OpenSearch at {OPENSEARCH_HOST}")

client = OpenSearch(
    hosts=[{"host": OPENSEARCH_HOST, "port": 443}],
    http_auth=auth,
    use_ssl=True,
    verify_certs=True,
    http_compress=True,
    connection_class=RequestsHttpConnection,
    pool_maxsize=10,
)
# Verify connection (optional, but good practice)
if not client.ping():
    raise ConnectionError("OpenSearch connection check failed")
logger.info(f"Successfully connected to OpenSearch: {client.info()}")


@router.get("/")
@tracer.capture_method
def search_item() -> Response:
    if not app.current_event.query_string_parameters:
        return Response(
            status_code=HTTPStatus.BAD_REQUEST,
            content_type=content_types.APPLICATION_JSON,
            body={"error": "Missing query parameters"},
        )

    limit = int(app.current_event.query_string_parameters.get("limit") or 10)
    category = app.current_event.query_string_parameters.get("category")
    name = app.current_event.query_string_parameters.get("name")
    if not (name or category):
        return Response(
            status_code=HTTPStatus.BAD_REQUEST,
            content_type=content_types.APPLICATION_JSON,
            body={"error", "Missing name or category parameters"},
        )

    items = []
    try:
        logger.info(f"Searching for items with name: {name} and category: {category}")
        s = Search(using=client, index=INDEX_NAME)
        if category and name:
            s = s.query(
                "bool",
                must=[
                    Q("match", name=name),
                    Q("match", category=category),
                ],
            )
        elif category:
            s = s.query("match", category=category)
        elif name:
            s = s.query("match", name=name)
        result = s[:limit].execute()
        for hit in result:
            items.append(hit.to_dict())

        return Response(
            status_code=HTTPStatus.OK,
            content_type=content_types.APPLICATION_JSON,
            body={"content": items},
        )
    except Exception:
        traceback.print_exc()
        return Response(
            status_code=HTTPStatus.OK,
            content_type=content_types.APPLICATION_JSON,
            body={
                "content": [],
                "error": f"Internal server error: {traceback.format_exc()}",
            },
        )


# register modules to the router
app.include_router(router)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event, context) -> dict:
    return app.resolve(event, context)
