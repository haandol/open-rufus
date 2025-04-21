# Open Rufus Chatbot API (packages/app)

이 패키지는 OpenRufus 프로젝트의 챗봇 API 백엔드 애플리케이션입니다.

**Goal:** Streaming/Invoke Chat API, Semantic Cache, Prompt Caching, Image multi-modal Chat, Opensearch RAG Q&A Chat, Healthcheck 기능을 제공하는 것을 목표로 합니다. 🎯

## Tech Stacks 💻

- **Language:** Python 3.13
- **Framework:** FastAPI
- **LLM Orchestration:** LangChain
- **LLM Provider:** Amazon Bedrock (Claude 3 Sonnet, Cohere Embeddings v3)
- **Vector Store:** Opensearch
- **Dependency Management:** uv, pyproject.toml

## Features ✨

- Streaming/Invoke Chat API
- Semantic Cache
- Prompt Caching
- Image multi-modal Chat (Amazon Bedrock Claude 3 Sonnet)
- Opensearch RAG Q&A Chat
- Healthcheck endpoint (`/health`)
- Simple REST API interface
- Provide a chat interface through a web page

## System Requirements

- Python 3.13 or higher
- AWS account and related API access permissions
- `uv` for dependency management (`pyproject.toml`)

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

## Directory Structure 📁

```
.
├── src/                # Source code directory
│   ├── services/       # Core business logic
│   ├── handlers/       # Request handlers
│   ├── utils/          # Utility functions
│   ├── prompts/        # LLM prompt templates
│   └── constant.py     # Global constants
├── env/                # Env files
├── .env                # Current Environment variables
└── main.py             # Application entry point (if applicable, structure might vary)
```
