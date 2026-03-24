require('dotenv').config();

const express = require('express');
const path = require('path');
const vectorStore = require('./lib/vectorStore');
const rag = require('./lib/rag');

const app = express();
const PORT = process.env.PORT || 3000;

let isReady = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY.' });
  }

  if (!isReady) {
    return res.status(503).json({ error: 'Server is still initializing. Please try again in a moment.' });
  }

  try {
    const reply = await rag.getResponse(message);
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});

async function start() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. The chat endpoint will not work until it is configured.');
  } else {
    try {
      console.log('Initializing vector store...');
      await vectorStore.initialize();
      isReady = true;
      console.log('Vector store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vector store:', error.message);
      console.warn('Server will start but chat functionality may be limited.');
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
