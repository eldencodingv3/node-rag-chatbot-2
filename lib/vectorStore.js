const lancedb = require('@lancedb/lancedb');
const path = require('path');
const fs = require('fs');
const { getEmbeddings, isUsingLocalEmbeddings, cosineSimilarity } = require('./embeddings');

const DB_PATH = path.join(__dirname, '..', 'data', 'lancedb');
const FAQS_PATH = path.join(__dirname, '..', 'data', 'faqs.json');
const TABLE_NAME = 'faqs';

let db = null;
let table = null;
let localMode = false;
let localFaqs = []; // stores { question, answer, embedding } for local mode

async function initialize() {
  const faqs = JSON.parse(fs.readFileSync(FAQS_PATH, 'utf-8'));
  console.log(`Loaded ${faqs.length} FAQs from ${FAQS_PATH}`);

  const texts = faqs.map(faq => `${faq.question} ${faq.answer}`);
  console.log('Generating embeddings for FAQs...');
  const vectors = await getEmbeddings(texts);
  console.log('Embeddings generated successfully');

  // Check if we ended up using local embeddings
  if (isUsingLocalEmbeddings()) {
    console.log('Using local fallback mode (in-memory search, no LanceDB)');
    localMode = true;
    localFaqs = faqs.map((faq, i) => ({
      id: i + 1,
      question: faq.question,
      answer: faq.answer,
      embedding: vectors[i],
    }));
    console.log(`Local store loaded with ${localFaqs.length} FAQs`);
    return;
  }

  // OpenAI mode: use LanceDB
  try {
    const records = faqs.map((faq, i) => ({
      id: i + 1,
      question: faq.question,
      answer: faq.answer,
      vector: vectors[i],
    }));

    db = await lancedb.connect(DB_PATH);
    table = await db.createTable(TABLE_NAME, records, { mode: 'overwrite' });
    console.log(`LanceDB table "${TABLE_NAME}" created with ${records.length} records`);
  } catch (error) {
    console.warn('LanceDB failed, falling back to local mode:', error.message);
    localMode = true;
    localFaqs = faqs.map((faq, i) => ({
      id: i + 1,
      question: faq.question,
      answer: faq.answer,
      embedding: vectors[i],
    }));
    console.log(`Local store loaded with ${localFaqs.length} FAQs (after LanceDB failure)`);
  }
}

async function search(queryVector, limit = 3) {
  if (localMode) {
    // Manual cosine similarity search
    const scored = localFaqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      _score: cosineSimilarity(queryVector, faq.embedding),
    }));
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  }

  if (!table) {
    throw new Error('Vector store not initialized. Call initialize() first.');
  }

  try {
    const results = await table.vectorSearch(queryVector).limit(limit).toArray();
    return results.map(r => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      _distance: r._distance,
    }));
  } catch (error) {
    console.error('Vector search failed:', error.message);
    throw error;
  }
}

function isLocalMode() {
  return localMode;
}

module.exports = { initialize, search, isLocalMode };
