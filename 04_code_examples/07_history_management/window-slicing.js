/**
 * 07a - History Management: Window Slicing
 *
 * This example demonstrates:
 * - Limiting conversation history with window slicing
 * - Preventing token limit errors
 * - Maintaining short to medium-term memory
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Window size configuration
const MAX_MESSAGES = 10; // Keep last 10 messages (5 turns)

// Simulate a conversation history
const conversationHistory = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is machine learning?' },
  { role: 'assistant', content: 'Machine learning is a subset of AI...' },
  { role: 'user', content: 'What are neural networks?' },
  { role: 'assistant', content: 'Neural networks are computing systems...' },
  { role: 'user', content: 'Explain backpropagation' },
  { role: 'assistant', content: 'Backpropagation is an algorithm...' },
  { role: 'user', content: 'What is gradient descent?' },
  {
    role: 'assistant',
    content: 'Gradient descent is an optimization algorithm...',
  },
  { role: 'user', content: 'Tell me about transformers' },
  {
    role: 'assistant',
    content: 'Transformers are a type of neural network architecture...',
  },
  // This is getting long! Need to slice...
];

// Window slicing: Keep only the most recent messages
function applyWindowSlicing(messages, maxMessages) {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Always keep the system message
  const systemMessage = messages.find((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  // Take the most recent messages
  const recentMessages = otherMessages.slice(-maxMessages);

  return systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
}

async function demonstrateWindowSlicing() {
  console.log('='.repeat(60));
  console.log('Window Slicing Example');
  console.log('='.repeat(60));

  console.log(`\n📚 Total messages in history: ${conversationHistory.length}`);
  console.log(`🪟 Window size: ${MAX_MESSAGES} messages\n`);

  // Apply window slicing
  const windowedMessages = applyWindowSlicing(
    conversationHistory,
    MAX_MESSAGES,
  );

  console.log('Messages in window:');
  windowedMessages.forEach((msg, i) => {
    const preview =
      msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
    console.log(`  ${i + 1}. [${msg.role}] ${preview}`);
  });

  console.log(
    `\n✅ Reduced from ${conversationHistory.length} to ${windowedMessages.length} messages`,
  );
  console.log(
    `💡 Saved ~${((1 - windowedMessages.length / conversationHistory.length) * 100).toFixed(1)}% tokens\n`,
  );

  // Now make a call with the windowed messages
  const newMessage = 'What is attention mechanism in transformers?';
  console.log(`👤 User: ${newMessage}\n`);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [...windowedMessages, { role: 'user', content: newMessage }],
  });

  console.log(`🤖 Assistant: ${response.choices[0].message.content}\n`);
  console.log('='.repeat(60));
}

// Token-based window slicing (more sophisticated)
async function tokenBasedWindowSlicing() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Token-Based Window Slicing');
  console.log('='.repeat(60));

  const MAX_TOKENS = 50; // Maximum tokens to include (lower to demonstrate slicing)

  console.log(`\n🎯 Target: Keep messages within ${MAX_TOKENS} tokens\n`);

  // Rough estimation: 4 characters ≈ 1 token
  function estimateTokens(messages) {
    return messages.reduce((sum, msg) => {
      return sum + Math.ceil(msg.content.length / 4);
    }, 0);
  }

  function applyTokenBasedWindow(messages, maxTokens) {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    let totalTokens = systemMessage ? estimateTokens([systemMessage]) : 0;
    const selectedMessages = [];

    // Add messages from most recent, working backwards
    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const msg = otherMessages[i];
      const msgTokens = estimateTokens([msg]);

      if (totalTokens + msgTokens <= maxTokens) {
        selectedMessages.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break; // Stop if we exceed token limit
      }
    }

    return systemMessage
      ? [systemMessage, ...selectedMessages]
      : selectedMessages;
  }

  const originalTokens = estimateTokens(conversationHistory);
  const windowedMessages = applyTokenBasedWindow(
    conversationHistory,
    MAX_TOKENS,
  );
  const finalTokens = estimateTokens(windowedMessages);

  console.log(
    `📊 Original: ~${originalTokens} tokens (${conversationHistory.length} messages)`,
  );
  console.log(
    `📊 After windowing: ~${finalTokens} tokens (${windowedMessages.length} messages)`,
  );
  console.log(
    `💰 Token savings: ~${originalTokens - finalTokens} tokens (${((1 - finalTokens / originalTokens) * 100).toFixed(1)}%)\n`,
  );

  console.log('Remaining messages in window:');
  windowedMessages.forEach((msg, i) => {
    const preview =
      msg.content.substring(0, 40) + (msg.content.length > 40 ? '...' : '');
    console.log(`  ${i + 1}. [${msg.role}] ${preview}`);
  });

  // Make a call with the windowed messages
  const newMessage =
    'Based on our conversation, what is the key difference between backpropagation and gradient descent?';
  console.log(`\n👤 User: ${newMessage}\n`);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [...windowedMessages, { role: 'user', content: newMessage }],
    });

    console.log(`🤖 Assistant: ${response.choices[0].message.content}\n`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('='.repeat(60));
}

async function main() {
  await demonstrateWindowSlicing();
  await tokenBasedWindowSlicing();

  console.log('\n✨ Examples completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - Window slicing prevents token limit errors');
  console.log('   - Maintains recent context (short-term memory)');
  console.log('   - Always preserve system message');
  console.log('   - Can slice by message count or token count');
  console.log('   - Trade-off: loses older conversation context');
}

main();
