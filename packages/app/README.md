# Open Rufus Streaming Chatbot API

This is a chat API service that provides a streaming response in a streaming manner. It uses the Amazon Bedrock Claude 3 Sonnet model to provide a natural chat experience 🤖✨

## Features

- Use Amazon Bedrock Claude 3 Sonnet model
- Support streaming response (Server-Sent Events)
- Simple REST API interface
- Provide a chat interface through a web page

## System Requirements

- Python 3.13 or higher
- AWS account and related API access permissions
- Required packages (automatically installed)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies

```bash
uv sync
```

3. Set environment variables

Create a `.env` file in the project root and set the necessary environment variables:

```
AWS_PROFILE=your-aws-profile
PORT=your-port
```

You can also set the following environment variables:
- `AWS_REGION`: AWS region (default: us-east-1)
- `PORT`: Server port (default: 8000)

## How to run

1. Run the server

```bash
uv run -- uvicorn main:app --reload
```

## How to use the API

### Chat API

**Endpoint:** `POST /chat`

**Request body:**
```json
{
  "messages": [
    {"role": "user", "content": "안녕하세요!"}
  ],
  "stream": true
}
```

**Response:**
- `stream=true`: Text event stream (SSE)
- `stream=false`: JSON response

### Health Check API

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy"
}
```

## Directory Structure

```
.
├── src/                       # Source code directory
│   ├── constant.py            # Constant definition
│   ├── handlers/              # Request handlers
│   │   └── chat_handler.py    # Chat request handler
│   ├── services/              # Service logic
│   │   └── llm_service.py     # LLM related service
│   └── utils/                 # Utility functions
│       ├── message_utils.py   # Message conversion utility
│       └── models.py          # Pydantic model definition
└── main.py                    # Application entry point
```
