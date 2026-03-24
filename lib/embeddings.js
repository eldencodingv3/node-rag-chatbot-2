const OpenAI = require('openai');

let openai;
let useLocalEmbeddings = false;

try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (e) {
  useLocalEmbeddings = true;
}

// Simple local embedding: create a bag-of-words vector
function localEmbedding(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const vocab = {};
  words.forEach(w => { vocab[w] = (vocab[w] || 0) + 1; });
  return vocab;
}

// Cosine similarity between two word-frequency objects
function cosineSimilarity(a, b) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const key of allKeys) {
    const va = a[key] || 0;
    const vb = b[key] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function getEmbedding(text) {
  if (!useLocalEmbeddings && process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (e) {
      console.warn('OpenAI embedding failed, falling back to local:', e.message);
      useLocalEmbeddings = true;
    }
  }
  return localEmbedding(text);
}

async function getEmbeddings(texts) {
  if (!useLocalEmbeddings && process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });
      return response.data.map(d => d.embedding);
    } catch (e) {
      console.warn('OpenAI embeddings failed, falling back to local:', e.message);
      useLocalEmbeddings = true;
    }
  }
  return texts.map(t => localEmbedding(t));
}

function isUsingLocalEmbeddings() {
  return useLocalEmbeddings;
}

module.exports = { getEmbedding, getEmbeddings, isUsingLocalEmbeddings, cosineSimilarity, localEmbedding };
