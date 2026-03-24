require('dotenv').config();

const vectorStore = require('../lib/vectorStore');

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required.');
    process.exit(1);
  }

  console.log('Starting FAQ ingestion...');
  await vectorStore.initialize();
  console.log('Ingestion complete!');
  process.exit(0);
}

main().catch(error => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
