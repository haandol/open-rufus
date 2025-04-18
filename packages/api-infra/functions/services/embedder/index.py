import os
import json
import traceback
import urllib.parse
from typing import Optional

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
    MAX_CHUNK_SIZE = 2000 # Example limit, adjust based on model documentation
    truncated_text = text[:MAX_CHUNK_SIZE]

    response = bedrock.invoke_model(
      modelId=EMBEDDING_MODEL_ARN,
      body=json.dumps({"inputText": truncated_text}),
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
def index_document(doc_id, bucket, key, text, embedding):
  """Indexes the document into OpenSearch."""
  if not client:
    logger.error("OpenSearch client is not available. Cannot index document.")
    raise ConnectionError("OpenSearch client not initialized.")

  if not text or not embedding:
    logger.warning(f"Missing text or embedding for doc_id {doc_id}. Skipping indexing.")
    return

  logger.info(f"Indexing document: id={doc_id}, key=s3://{bucket}/{key}")
  document = {
    "text": text,
    "embedding": embedding,
    "source_bucket": bucket,
    "source_key": key,
  }
  try:
    response = client.index(
      index=INDEX_NAME,
      body=document,
      id=doc_id, # Use S3 object key or another unique ID
      refresh="wait_for", # Wait for changes to be searchable, or 'true'/'false'
    )
    logger.info(f"Document indexed successfully: {response}")
  except os_exceptions.RequestError as e:
    logger.error(f"OpenSearch RequestError indexing document {doc_id}: {e.info}")
    # More specific error handling can be added here based on e.status_code or e.error
    raise
  except os_exceptions.ConnectionError as e:
    logger.error(f"OpenSearch ConnectionError indexing document {doc_id}: {e}")
    raise
  except Exception as e:
    logger.error(f"Unexpected error indexing document {doc_id}: {e}")
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
      return # Or handle as an error depending on requirements

    for s3_record in message_body.get('Records', []):
      if 's3' not in s3_record:
        logger.warning("Record is not an S3 event. Skipping.")
        continue

      bucket = s3_record['s3']['bucket']['name']
      # Object key might be URL encoded
      key = urllib.parse.unquote_plus(s3_record['s3']['object']['key'], encoding='utf-8')
      logger.info(f"Processing S3 event for object: s3://{bucket}/{key}")

      try:
        # 1. Get content
        content = get_s3_object_content(bucket, key)
        if not content:
          logger.warning(f"No content extracted from s3://{bucket}/{key}. Skipping.")
          continue # Skip if file is empty or unreadable

        # 2. Get embedding
        embedding = get_embedding(content)
        if not embedding:
          logger.error(f"Failed to generate embedding for s3://{bucket}/{key}. Skipping indexing.")
          raise ValueError(f"Failed to generate embedding for {key}")

        # 3. Index document (Use object key as document ID, or generate a unique one)
        # Using URL-safe key as ID might be better if keys contain special chars
        doc_id = key.replace('/', '_') # Simple replacement, consider a more robust method if needed
        index_document(doc_id, bucket, key, content, embedding)

        logger.info(f"Successfully processed and indexed s3://{bucket}/{key}")
      except Exception as e:
        logger.error(f"Failed processing object s3://{bucket}/{key}: {e}")
        raise e
  except json.JSONDecodeError:
    logger.exception("Failed to decode SQS message body.")
    raise
  except Exception as e:
    logger.exception(f"Generic failure processing SQS record: {e}")
    raise e


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
