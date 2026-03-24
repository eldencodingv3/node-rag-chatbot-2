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
  res.json({ status: 'ok', mode: vectorStore.isLocalMode() ? 'fallback' : 'openai' });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string.' });
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
  try {
    console.log('Initializing vector store...');
    await vectorStore.initialize();
    isReady = true;
    console.log('Vector store initialized successfully');
    if (vectorStore.isLocalMode()) {
      console.log('Running in FALLBACK mode — responses come directly from FAQ matching');
    }
  } catch (error) {
    console.error('Failed to initialize vector store:', error.message);
    console.warn('Server will start but chat functionality will not be available.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
