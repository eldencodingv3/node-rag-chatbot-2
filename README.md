# CloudSync RAG Support Chatbot

A Node.js RAG (Retrieval-Augmented Generation) chatbot that answers customer support questions using LanceDB for vector search and OpenAI for embeddings and chat completions.

## Features

- **RAG Pipeline**: Retrieves relevant FAQ context via vector similarity search before generating responses
- **Vector Search**: Uses LanceDB for fast, local vector storage and retrieval
- **OpenAI Integration**: Uses text-embedding-ada-002 for embeddings and GPT-3.5-turbo for responses
- **Clean Chat UI**: Modern, responsive web interface with real-time messaging
- **Auto-Ingestion**: FAQ data is automatically embedded and indexed on server startup

## Tech Stack

- **Runtime**: Node.js (>=20)
- **Server**: Express.js
- **Vector Database**: LanceDB
- **AI/ML**: OpenAI API (embeddings + chat completions)
- **Frontend**: Vanilla HTML, CSS, JavaScript

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/eldencodingv3/node-rag-chatbot-2.git
   cd node-rag-chatbot-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key.

4. **Start the server**
   ```bash
   npm start
   ```
   The server will ingest FAQs on startup and listen on `http://localhost:3000`.

## Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes | — |
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment mode | No | — |

## API Endpoints

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

### `POST /api/chat`
Send a message to the chatbot.

**Request:**
```json
{ "message": "How do I reset my password?" }
```

**Response:**
```json
{ "reply": "To reset your password, go to the login page and click..." }
```

## Updating FAQs

Edit `data/faqs.json` to add, remove, or modify FAQ entries. Each entry needs a `question` and `answer` field:

```json
{
  "question": "Your question here?",
  "answer": "The detailed answer here."
}
```

Restart the server after making changes — FAQs are re-ingested on every startup.

## Project Structure

```
├── server.js              # Express server entry point
├── lib/
│   ├── embeddings.js      # OpenAI embeddings helper
│   ├── vectorStore.js     # LanceDB operations
│   └── rag.js             # RAG pipeline
├── data/
│   └── faqs.json          # FAQ dataset
├── public/
│   ├── index.html         # Chat UI
│   ├── style.css          # Styles
│   └── app.js             # Frontend logic
├── scripts/
│   └── ingest.js          # Manual ingestion script
└── .env.example           # Environment template
```

## Deployment

1. Set the `OPENAI_API_KEY` environment variable on your hosting platform
2. Run `npm install` to install dependencies
3. Run `npm start` to start the server
4. The LanceDB data directory (`data/lancedb/`) is created automatically on startup — no need to persist it between deploys
