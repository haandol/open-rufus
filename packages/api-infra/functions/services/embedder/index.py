import os
import json
import traceback
import urllib.parse
from typing import Optional, List, Dict, Any

import boto3
from botocore.exceptions import ClientError
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth, exceptions as os_exceptions
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.batch import BatchProcessor, EventType, batch_processor
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord

# Setup environment variables & validate
OPENSEARCH_HOST = os.environ["OPENSEARCH_HOST"]
assert OPENSEARCH_HOST, "OPENSEARCH_HOST environment variable not set"
INDEX_NAME = os.environ["INDEX_NAME"]
assert INDEX_NAME, "INDEX_NAME environment variable not set"
EMBEDDING_MODEL_ARN = os.environ["EMBEDDING_MODEL_ARN"]
assert EMBEDDING_MODEL_ARN, "EMBEDDING_MODEL_ARN environment variable not set"

AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")
CHUNK_SIZE = os.environ.get("CHUNK_SIZE", 500) # Define chunk size, default to 500 tokens/chars

# Setup tracers and loggers
tracer = Tracer(service="embedder")
logger = Logger(service="embedder")
processor = BatchProcessor(event_type=EventType.SQS)

# Setup AWS clients
s3 = boto3.client("s3")
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
  http_compress=True, # Enable compression
  connection_class=RequestsHttpConnection,
  pool_maxsize=10, # Adjust pool size based on expected concurrency
)
# Verify connection (optional, but good practice)
if not client.ping():
  raise ConnectionError("OpenSearch connection check failed")
logger.info(f"Successfully connected to OpenSearch: {client.info()}")

try:
  get_or_create_index(client)
except (ConnectionError, os_exceptions.ConnectionError, os_exceptions.TransportError) as e:
  logger.error(f"Failed to connect or communicate with OpenSearch: {e}")
  client = None
  raise e
except Exception as e:
  logger.error(f"Unexpected error during OpenSearch client setup: {e}")
  client = None
  raise e


@tracer.capture_method
def get_s3_object_content(bucket, key):
  """Downloads and reads content from an S3 object."""
  logger.info(f"Downloading s3://{bucket}/{key}")
  try:
    response = s3.get_object(Bucket=bucket, Key=key)
    # assume plain text UTF-8 encoded
    content = response["Body"].read().decode("utf-8")
    logger.info(f"Successfully read content from s3://{bucket}/{key}")
    return content
  except ClientError as e:
    logger.error(f"Error getting object s3://{bucket}/{key}: {e}")
    raise e
  except Exception as e:
    logger.error(f"Error decoding object s3://{bucket}/{key}: {e}")
    raise ValueError(f"Could not decode object content for {key}")


@tracer.capture_method
def get_embedding(text: str) -> Optional[list[float]]:
  """Generates embedding using Bedrock."""
  if not text:
    logger.warning("No text provided to get_embedding.")
    return None

  logger.info(f"Generating embedding for text snippet: '{text[:100]}...'")
  try:
    # Removed truncation logic - assume input text is appropriately sized or handled upstream if needed
    response = bedrock.invoke_model(
      modelId=EMBEDDING_MODEL_ARN,
      body=json.dumps({"inputText": text}), # Use full text
      contentType='application/json',
      accept='application/json'
    )
    response_body = json.loads(response["body"].read())
    embedding = response_body.get("embedding")
    if not embedding:
      logger.error("Embedding not found in Bedrock response.")
      return None
    logger.info("Embedding generated successfully.")
    return embedding
  except ClientError as e:
    logger.error(f"Bedrock client error getting embedding: {e}")
    raise e
  except Exception as e:
    logger.error(f"Unexpected error getting embedding: {str(e)}")
    traceback.print_exc()
    raise e

@tracer.capture_method
def bulk_index_documents(bulk_data: List[Dict[str, Any]]):
    """Indexes multiple documents into OpenSearch using the bulk API."""
    if not client:
        logger.error("OpenSearch client is not available. Cannot index documents.")
        raise ConnectionError("OpenSearch client not initialized.")

    if not bulk_data:
        logger.warning("No bulk data provided. Skipping indexing.")
        return

    logger.info(f"Bulk indexing {len(bulk_data) // 2} documents.") # Each doc requires 2 lines in bulk data
    try:
        response = client.bulk(
            index=INDEX_NAME,
            body=bulk_data,
            refresh="wait_for", # or 'true'/'false' depending on consistency needs
        )
        if response["errors"]:
            logger.error(f"Bulk indexing completed with errors: {response}")
            # Iterate through items to log specific errors
            for item in response["items"]:
                if "error" in item.get("index", {}):
                    logger.error(f"Error indexing document ID {item['index']['_id']}: {item['index']['error']}")
            # Optionally raise an exception if errors occurred
            # raise os_exceptions.RequestError(f"Bulk indexing had errors: {response['errors']}")
        else:
            logger.info("Bulk indexing completed successfully.")
    except os_exceptions.RequestError as e:
        logger.error(f"OpenSearch RequestError during bulk indexing: {e.info}")
        raise
    except os_exceptions.ConnectionError as e:
        logger.error(f"OpenSearch ConnectionError during bulk indexing: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during bulk indexing: {e}")
        traceback.print_exc()
        raise


@tracer.capture_method
def process_record(record: SQSRecord):
  """Processes a single SQS record containing an S3 event."""
  try:
    message_body = json.loads(record.body)
    logger.info(f"Processing SQS message: {message_body}")

    if 'Records' not in message_body:
      logger.warning("SQS message does not contain S3 'Records'. Skipping.")
      return

    for s3_record in message_body.get('Records', []):
      if 's3' not in s3_record:
        logger.warning("Record is not an S3 event. Skipping.")
        continue

      bucket = s3_record['s3']['bucket']['name']
      key = urllib.parse.unquote_plus(s3_record['s3']['object']['key'], encoding='utf-8')
      logger.info(f"Processing S3 event for object: s3://{bucket}/{key}")

      try:
        # 1. Get content
        content = get_s3_object_content(bucket, key)
        if not content:
          logger.warning(f"No content extracted from s3://{bucket}/{key}. Skipping.")
          continue

        # 2. Chunk content (Simple character-based chunking)
        # TODO: Implement more sophisticated chunking (e.g., by sentences, paragraphs, or tokens) if needed.
        chunks = [content[i:i + CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]
        logger.info(f"Content split into {len(chunks)} chunks for s3://{bucket}/{key}")

        bulk_request_body = []
        for i, chunk_text in enumerate(chunks):
          # 3. Get embedding for chunk
          embedding = get_embedding(chunk_text)
          if not embedding:
            logger.error(f"Failed to generate embedding for chunk {i} of s3://{bucket}/{key}. Skipping chunk.")
            continue # Decide if skipping the chunk or failing the whole file is better

          # 4. Prepare bulk index request for the chunk
          doc_id = f"{bucket}_{key}_{i}".replace('/', '_') # Ensure doc_id is filesystem/URL safe
          action = {"index": {"_index": INDEX_NAME, "_id": doc_id}}
          document = {
            "text": chunk_text,
            "embedding_vector": embedding, # Use the correct field name from mapping
            "source_bucket": bucket,
            "source_key": key,
            "chunk_index": i
          }
          bulk_request_body.append(action)
          bulk_request_body.append(document)

        # 5. Bulk index all chunks for the document
        if bulk_request_body:
          bulk_index_documents(bulk_request_body)
          logger.info(f"Successfully processed and initiated indexing for {len(chunks)} chunks from s3://{bucket}/{key}")
        else:
          logger.warning(f"No chunks were successfully processed for s3://{bucket}/{key}.")

      except Exception as e:
        logger.error(f"Failed processing object s3://{bucket}/{key}: {e}")
        # Raise the exception to mark the SQS message for potential retry
        raise e # Re-raise after logging
  except json.JSONDecodeError:
    logger.exception("Failed to decode SQS message body.")
    raise # Re-raise to signal failure
  except Exception as e:
    logger.exception(f"Generic failure processing SQS record: {e}")
    raise e # Re-raise to signal failure


@tracer.capture_method
def get_or_create_index(client):
  """Get or create the index."""
  logger.warning(f"Index '{INDEX_NAME}' not found. Creating...")
  index_body = {
    "settings": {
      "index": {
        "knn": True,
      },
      "analysis": {
        "analyzer": {
          "nori_analyzer": {
            "type": "custom",
            "tokenizer": "nori_tokenizer",
            "filter": ["nori_number", "nori_readingform", "lowercase"]
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "embedding_vector": {
          "type": "knn_vector",
          "dimension": 1024,
          "method": {
            "name": "hnsw",
            "space_type": "cosinesimil",
            "engine": "nmslib",
          }
        },
        "text": {"type": "text", "analyzer": "nori_analyzer"},
        "source_bucket": {"type": "keyword"},
        "source_key": {"type": "keyword"}
      }
    }
  }
  try:
    if not client.indices.exists(index=INDEX_NAME):
      client.indices.create(index=INDEX_NAME, body=index_body)
      logger.info(f"Index '{INDEX_NAME}' created successfully.")
  except os_exceptions.RequestError as e:
    # Handle potential race condition if another instance creates the index
    if e.error == 'resource_already_exists_exception':
      logger.warning(f"Index '{INDEX_NAME}' already exists (created by another instance).")
    else:
      logger.error(f"Error creating index '{INDEX_NAME}': {e}")
      raise e
  except Exception as e:
    logger.error(f"Unexpected error creating index '{INDEX_NAME}': {e}")
    raise e


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
@batch_processor(record_handler=process_record, processor=processor)
def lambda_handler(event, context):
  """Lambda handler entry point."""
  logger.info("Embedder function invoked.")
  return processor.response()
