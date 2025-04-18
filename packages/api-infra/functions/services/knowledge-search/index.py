import os
import json
import traceback

import boto3
from http import HTTPStatus
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import (
    APIGatewayHttpResolver,
    Response,
    content_types,
)
from aws_lambda_powertools.event_handler.router import APIGatewayHttpRouter

# Setup environment variables & validate
OPENSEARCH_HOST = os.environ["OPENSEARCH_HOST"]
assert OPENSEARCH_HOST, "OPENSEARCH_HOST environment variable not set"
INDEX_NAME = os.environ["INDEX_NAME"]
assert INDEX_NAME, "INDEX_NAME environment variable not set"
EMBEDDING_MODEL_ARN = os.environ["EMBEDDING_MODEL_ARN"]
assert EMBEDDING_MODEL_ARN, "EMBEDDING_MODEL_ARN environment variable not set"

KEYWORD_WEIGHT = float(os.environ.get("KEYWORD_WEIGHT", 0.4))
VECTOR_WEIGHT = float(os.environ.get("VECTOR_WEIGHT", 0.6))
assert abs(KEYWORD_WEIGHT + VECTOR_WEIGHT - 1.0) < 1e-6, "Weights must sum to 1.0"

AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")
SCORE_THRESHOLD = float(os.environ.get("SCORE_THRESHOLD", 0.4))

SEARCH_PIPELINE_NAME = os.environ.get(
    "SEARCH_PIPELINE_NAME", "knowledge-search-pipeline"
)

# Setup tracers and loggers
tracer = Tracer(service="knowledge-search")
logger = Logger(service="knowledge-search")
app = APIGatewayHttpResolver(strip_prefixes=["/v1/search/knowledge"])
router = APIGatewayHttpRouter()

# Setup AWS clients
bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
credentials = boto3.Session().get_credentials()
auth = AWSV4SignerAuth(credentials, AWS_REGION)

# Setup OpenSearch client
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
logger.info(f"Connected to OpenSearch using {client}")

# Setup search pipeline
pipeline_body = {
    "description": "Knowledge search hybrid pipeline",
    "phase_results_processors": [
        {
            "normalization-processor": {
                "normalization": {
                    "technique": "min_max",
                },
                "combination": {
                    "technique": "arithmetic_mean",
                    "parameters": {
                        "weights": [
                            KEYWORD_WEIGHT,
                            VECTOR_WEIGHT,
                        ]
                    },
                },
            }
        }
    ],
}

try:
    client.transport.perform_request(
        "PUT",
        f"/_search/pipeline/{SEARCH_PIPELINE_NAME}",
        body=pipeline_body,
    )
    logger.info("Search pipeline created successfully")
except Exception as e:
    logger.error(f"Error creating search pipeline: {str(e)}")


def get_embedding(text):
    try:
        response = bedrock.invoke_model(
            modelId=EMBEDDING_MODEL_ARN,
            body=json.dumps({"inputText": text}),
        )
        response_body = json.loads(response["body"].read())
        return response_body["embedding"]
    except Exception as e:
        logger.error(f"Error getting embedding: {str(e)}")
        traceback.print_exc()
        return None


@router.get("/")
@tracer.capture_method
def search_knowledge() -> Response:
    if not app.current_event.query_string_parameters:
        return Response(
            status_code=HTTPStatus.BAD_REQUEST,
            content_type=content_types.APPLICATION_JSON,
            body={"error": "Missing query parameters"},
        )

    query = app.current_event.query_string_parameters.get("query")
    query = query.strip() if query else None
    limit = int(app.current_event.query_string_parameters.get("limit", 5))

    if not query:
        return Response(
            status_code=HTTPStatus.BAD_REQUEST,
            content_type=content_types.APPLICATION_JSON,
            body={"error": "Missing query parameter"},
        )

    # Create query embedding
    query_vector = get_embedding(query)
    if not query_vector:
        return Response(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            content_type=content_types.APPLICATION_JSON,
            body={"error": "Failed to generate query embedding"},
        )

    try:
        # Build hybrid search query
        search_body = {
            "size": limit,
            "query": {
                "hybrid": {
                    "queries": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["question^2", "answer", "context"],
                                "analyzer": "nori_analyzer",
                                "type": "best_fields",
                                "tie_breaker": 0.3,
                            }
                        },
                        {
                            "knn": {
                                "question_vector": {
                                    "vector": query_vector,
                                    "k": limit,
                                }
                            }
                        },
                    ]
                }
            },
            "sort": [{"_score": "desc"}],
        }

        # Execute hybrid search
        response = client.search(
            index=INDEX_NAME,
            body=search_body,
            params={"search_pipeline": SEARCH_PIPELINE_NAME},
        )

        # Process results
        results = []
        for hit in response['hits']['hits']:
            if hit['_score'] >= SCORE_THRESHOLD:
                results.append({
                    'id': hit['_id'],
                    'question': hit['_source'].get('question', ''),
                    'answer': hit['_source'].get('answer', ''),
                    'context': hit['_source'].get('context', ''),
                    'published_at': hit['_source'].get('published_at', ''),
                    'score': hit['_score'],
                    'citation': f"FAQ #{hit['_id']} - {hit['_source']['question'][:20]}...",
                })

        return Response(
            status_code=HTTPStatus.OK,
            content_type=content_types.APPLICATION_JSON,
            body={"content": results},
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


# Register modules to the router
app.include_router(router)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
def lambda_handler(event, context) -> dict:
    return app.resolve(event, context)
