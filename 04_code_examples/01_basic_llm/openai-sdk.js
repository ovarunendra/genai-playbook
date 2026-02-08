/**
 * 01 - Basic LLM Usage with OpenAI SDK
 * 
 * This example demonstrates:
 * - Making a basic API call to OpenAI
 * - Using the Responses API for text generation
 * - Understanding single-turn vs multi-turn conversations
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicCompletion() {
  console.log('🤖 Running basic completion...\n');

  try {
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: 'Explain what a Large Language Model (LLM) is in 2-3 sentences.',
    });

    console.log('Response:', response.output_text);
    console.log('\n✅ Basic completion successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function conversationalCompletion() {
  console.log('\n\n🤖 Running conversational completion...\n');

  try {
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant teaching about AI agents.',
        },
        {
          role: 'user',
          content: 'What is an AI agent?',
        },
        {
          role: 'assistant',
          content: 'An AI agent is an LLM in a loop that has access to tools and memory, allowing it to take actions and maintain context across multiple turns.',
        },
        {
          role: 'user',
          content: 'What makes it different from a single LLM call?',
        },
      ],
    });

    console.log('Response:', response.output_text);
    console.log('\n✅ Conversational completion successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Basic LLM Usage with OpenAI SDK');
  console.log('='.repeat(60));

  await basicCompletion();
  await conversationalCompletion();

  console.log('\n' + '='.repeat(60));
  console.log('✨ All examples completed!');
  console.log('='.repeat(60));
}

main();
