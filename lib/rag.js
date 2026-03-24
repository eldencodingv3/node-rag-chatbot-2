const OpenAI = require('openai');
const { getEmbedding } = require('./embeddings');
const vectorStore = require('./vectorStore');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful customer support assistant for CloudSync, a cloud-based collaboration and file sync platform.
Answer the user's question based on the FAQ context provided below.
If the context contains relevant information, use it to give a clear, helpful answer.
If the context doesn't cover the user's question, politely let them know and suggest they contact support.
Keep your responses concise and friendly.`;

async function getResponse(userMessage) {
  try {
    const queryVector = await getEmbedding(userMessage);
    const results = await vectorStore.search(queryVector, 3);

    const context = results
      .map(r => `Q: ${r.question}\nA: ${r.answer}`)
      .join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `FAQ Context:\n${context}\n\nUser Question: ${userMessage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('RAG pipeline error:', error.message);
    throw error;
  }
}

module.exports = { getResponse };
