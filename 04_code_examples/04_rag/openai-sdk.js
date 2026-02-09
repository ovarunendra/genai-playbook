/**
 * 04 - RAG (Retrieval Augmented Generation)
 *
 * This example demonstrates:
 * - In-memory vector search for RAG
 * - Embedding generation for semantic search
 * - Context injection for improved responses
 *
 * Note: This is a simplified in-memory example.
 * In production, use a vector database like Pinecone, Upstash, or Weaviate.
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock movie database
const movieDatabase = [
  {
    id: 1,
    title: 'The Conjuring',
    genre: 'Horror',
    year: 2013,
    description:
      'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.',
  },
  {
    id: 2,
    title: 'A Quiet Place',
    genre: 'Horror',
    year: 2018,
    description:
      'In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing.',
  },
  {
    id: 3,
    title: 'Get Out',
    genre: 'Horror',
    year: 2017,
    description:
      "A young African-American visits his white girlfriend's parents, uncovering disturbing secrets.",
  },
  {
    id: 4,
    title: 'Inception',
    genre: 'Sci-Fi',
    year: 2010,
    description:
      'A thief who steals corporate secrets through dream-sharing technology.',
  },
  {
    id: 5,
    title: 'Interstellar',
    genre: 'Sci-Fi',
    year: 2014,
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
];

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Generate embeddings for text
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

// Pre-compute embeddings for all movies (in production, do this once and store in DB)
async function indexMovies() {
  console.log('🔍 Indexing movies (generating embeddings)...\n');

  const indexedMovies = [];

  for (const movie of movieDatabase) {
    const searchText = `${movie.title} ${movie.genre} ${movie.description}`;
    const embedding = await getEmbedding(searchText);

    indexedMovies.push({
      ...movie,
      embedding,
    });
  }

  console.log(`✅ Indexed ${indexedMovies.length} movies\n`);
  return indexedMovies;
}

// Search for relevant movies using vector similarity
async function searchMovies(query, indexedMovies, topK = 3) {
  console.log(`🔎 Searching for: "${query}"\n`);

  // Generate embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Calculate similarity scores
  const results = indexedMovies.map((movie) => ({
    ...movie,
    similarity: cosineSimilarity(queryEmbedding, movie.embedding),
  }));

  // Sort by similarity and return top K
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}

// RAG: Retrieve and Generate
async function ragQuery(userQuery, indexedMovies) {
  console.log('='.repeat(60));
  console.log(`User Query: "${userQuery}"`);
  console.log('='.repeat(60));

  // Step 1: Retrieve relevant context
  const relevantMovies = await searchMovies(userQuery, indexedMovies, 3);

  console.log('📚 Retrieved Context:');
  relevantMovies.forEach((movie, i) => {
    console.log(
      `   ${i + 1}. ${movie.title} (${movie.year}) - Similarity: ${(
        movie.similarity * 100
      ).toFixed(1)}%`,
    );
  });

  // Step 2: Build context for the LLM
  const context = relevantMovies
    .map((m) => `- ${m.title} (${m.year}, ${m.genre}): ${m.description}`)
    .join('\n');

  // Step 3: Generate response with context
  console.log('\n🤖 Generating response with context...\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful movie recommendation assistant. Use the following movie information to answer the user's question:

${context}

Only recommend movies from the provided list. Be concise and helpful.`,
      },
      {
        role: 'user',
        content: `${userQuery}`,
      },
    ],
  });

  console.log('💬 Response:');
  console.log(response.choices[0].message.content);
  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  console.log('='.repeat(60));
  console.log('RAG (Retrieval Augmented Generation) Example');
  console.log('='.repeat(60) + '\n');

  // Index movies (generate embeddings)
  const indexedMovies = await indexMovies();

  // Example queries
  await ragQuery('Find me a scary movie about ghosts', indexedMovies);
  await ragQuery('I want to watch a space movie', indexedMovies);
  await ragQuery('Recommend a horror movie from 2017', indexedMovies);

  console.log('✨ RAG examples completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - RAG retrieves only relevant information');
  console.log('   - This reduces tokens and improves accuracy');
  console.log('   - Vector embeddings enable semantic search');
  console.log('   - In production, use a proper vector database');
}

main();
