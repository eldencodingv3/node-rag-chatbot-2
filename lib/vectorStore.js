const lancedb = require('@lancedb/lancedb');
const path = require('path');
const fs = require('fs');
const { getEmbeddings } = require('./embeddings');

const DB_PATH = path.join(__dirname, '..', 'data', 'lancedb');
const FAQS_PATH = path.join(__dirname, '..', 'data', 'faqs.json');
const TABLE_NAME = 'faqs';

let db = null;
let table = null;

async function initialize() {
  try {
    const faqs = JSON.parse(fs.readFileSync(FAQS_PATH, 'utf-8'));
    console.log(`Loaded ${faqs.length} FAQs from ${FAQS_PATH}`);

    const texts = faqs.map(faq => `${faq.question} ${faq.answer}`);
    console.log('Generating embeddings for FAQs...');
    const vectors = await getEmbeddings(texts);
    console.log('Embeddings generated successfully');

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
    console.error('Failed to initialize vector store:', error.message);
    throw error;
  }
}

async function search(queryVector, limit = 3) {
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

module.exports = { initialize, search };
