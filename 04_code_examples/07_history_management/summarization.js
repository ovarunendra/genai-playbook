/**
 * 07b - History Management: Summarization
 *
 * This example demonstrates:
 * - Summarizing old messages to preserve context
 * - Combining summaries with recent messages
 * - Maintaining long-term memory efficiently
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simulate a longer conversation
const conversationHistory = [
  { role: 'system', content: 'You are a helpful AI tutor.' },
  { role: 'user', content: 'What is Python?' },
  {
    role: 'assistant',
    content:
      'Python is a high-level, interpreted programming language known for its simplicity and readability.',
  },
  { role: 'user', content: 'What can I build with it?' },
  {
    role: 'assistant',
    content:
      'You can build web applications, data analysis tools, machine learning models, automation scripts, and more.',
  },
  { role: 'user', content: 'How do I start learning?' },
  {
    role: 'assistant',
    content:
      'Start with Python basics: variables, data types, functions, then move to object-oriented programming.',
  },
  { role: 'user', content: 'What are the best resources?' },
  {
    role: 'assistant',
    content:
      'Great resources include Python.org official docs, Real Python, Automate the Boring Stuff book, and Codecademy.',
  },
  { role: 'user', content: 'Tell me about data structures in Python' },
  {
    role: 'assistant',
    content:
      'Python has built-in data structures: lists (ordered, mutable), tuples (ordered, immutable), dictionaries (key-value pairs), and sets (unordered, unique items).',
  },
];

// Summarize old messages
async function summarizeMessages(messages) {
  console.log('📝 Summarizing old messages...\n');

  // Extract just the conversation (not system message)
  const conversationText = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n');

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content: `You are a conversation summarizer. Create a concise summary of the conversation that preserves:
        1. Key topics discussed
        2. Important facts shared
        3. User preferences or context
        
        Keep the summary brief but informative.`,
      },
      {
        role: 'user',
        content: `Summarize this conversation:\n\n${conversationText}`,
      },
    ],
  });

  return response.output_text;
}

// Apply summarization strategy
async function applySummarization(messages, windowSize = 6) {
  const systemMessage = messages.find((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  if (otherMessages.length <= windowSize) {
    return messages; // No summarization needed
  }

  // Split into old (to be summarized) and recent (to be kept)
  const oldMessages = otherMessages.slice(0, -windowSize);
  const recentMessages = otherMessages.slice(-windowSize);

  // Summarize old messages
  const summary = await summarizeMessages(oldMessages);

  // Build new message list with summary
  const result = [
    systemMessage,
    {
      role: 'system',
      content: `Previous conversation summary:\n${summary}`,
    },
    ...recentMessages,
  ];

  return result.filter(Boolean); // Remove any undefined
}

async function demonstrateSummarization() {
  console.log('='.repeat(60));
  console.log('Message Summarization Example');
  console.log('='.repeat(60));

  const WINDOW_SIZE = 4; // Keep last 4 messages

  console.log(`\n📚 Total messages: ${conversationHistory.length}`);
  console.log(`🪟 Window size: ${WINDOW_SIZE} recent messages\n`);

  console.log('Original conversation:');
  conversationHistory.forEach((msg, i) => {
    if (msg.role !== 'system') {
      const preview = msg.content.substring(0, 60) + '...';
      console.log(`  ${i}. [${msg.role}] ${preview}`);
    }
  });

  // Apply summarization
  const optimizedMessages = await applySummarization(
    conversationHistory,
    WINDOW_SIZE,
  );

  console.log('\n\n' + '='.repeat(60));
  console.log('After Summarization:');
  console.log('='.repeat(60));

  optimizedMessages.forEach((msg, i) => {
    const role = msg.role === 'system' ? 'SYSTEM' : msg.role.toUpperCase();
    const preview =
      msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : '');
    console.log(`\n${i + 1}. [${role}]`);
    console.log(`   ${preview}`);
  });

  console.log(
    `\n✅ Reduced from ${conversationHistory.length} to ${optimizedMessages.length} messages`,
  );

  // Now use the optimized messages for a new query
  console.log('\n\n' + '='.repeat(60));
  console.log('Using Summarized History:');
  console.log('='.repeat(60));

  const newQuery = 'What were we discussing earlier about Python?';
  console.log(`\n👤 User: ${newQuery}\n`);

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [...optimizedMessages, { role: 'user', content: newQuery }],
  });

  console.log(`🤖 Assistant: ${response.output_text}`);
  console.log('\n💡 Notice how the AI still remembers the earlier context!\n');
}

// Hierarchical summarization: Keep multiple levels of summaries
async function hierarchicalSummarization() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Hierarchical Summarization');
  console.log('='.repeat(60));

  console.log(`
This strategy maintains multiple levels of context:
  1. 🔥 Recent messages (detailed, last N messages)
  2. 📅 Medium-term summary (last conversation)
  3. 📚 Long-term facts (permanent user context)

Example structure:
  - System message
  - Long-term facts: "User is learning Python, prefers visual explanations"
  - Medium-term summary: "Discussed Python basics and data structures"
  - Recent messages: (last 6 messages in full detail)
  
Benefits:
  ✅ Maintains long-term context
  ✅ Preserves important facts
  ✅ Recent detail still available
  ✅ Token-efficient
  `);
}

async function main() {
  await demonstrateSummarization();
  await hierarchicalSummarization();

  console.log('\n' + '='.repeat(60));
  console.log('✨ Examples completed!');
  console.log('='.repeat(60));

  console.log('\n💡 Key Takeaways:');
  console.log('   - Summarization preserves long-term context');
  console.log('   - Combine summaries with recent messages');
  console.log('   - Use hierarchical summaries for complex apps');
  console.log('   - Extract and store user facts/preferences');
  console.log('   - Production: Use with vector DB for retrieval');
}

main();
