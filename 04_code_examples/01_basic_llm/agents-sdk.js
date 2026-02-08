/**
 * 01 - Basic Agent with OpenAI Agents SDK
 * 
 * This example demonstrates:
 * - Creating a basic agent using the Agents SDK
 * - Running an agent with a simple prompt
 * - Understanding multi-turn agent execution
 */

import { Agent, run } from '@openai/agents';
import 'dotenv/config';

async function basicAgent() {
  console.log('🤖 Creating a basic agent...\n');

  try {
    // Create a simple teaching agent
    const teacherAgent = new Agent({
      name: 'AI Teacher',
      model: 'gpt-4o-mini',
      instructions: `You are a helpful AI teacher explaining concepts about LLMs and AI agents. 
      Keep your explanations concise (2-3 sentences) and use analogies when helpful.`,
    });

    // Run the agent with a simple prompt
    const result = await run(teacherAgent, 'What is the difference between single-turn and multi-turn LLM interactions?');

    console.log('Agent Response:', result.finalOutput);
    console.log('\n✅ Basic agent execution successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function conversationalAgent() {
  console.log('\n\n🤖 Creating a conversational agent...\n');

  try {
    const conversationAgent = new Agent({
      name: 'Conversational Assistant',
      model: 'gpt-4o-mini',
      instructions: `You are a friendly assistant that maintains context across the conversation. 
      Remember what the user has asked and build upon that knowledge.`,
    });

    // First interaction
    console.log('User: Tell me about attention mechanisms in transformers');
    const result1 = await run(conversationAgent, 'Tell me about attention mechanisms in transformers');
    console.log('Agent:', result1.finalOutput);

    // Follow-up (agent maintains context)
    console.log('\nUser: Why is that important for LLMs?');
    const result2 = await run(conversationAgent, 'Why is that important for LLMs?');
    console.log('Agent:', result2.finalOutput);

    console.log('\n✅ Conversational agent execution successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Basic Agent with OpenAI Agents SDK');
  console.log('='.repeat(60));

  await basicAgent();
  await conversationalAgent();

  console.log('\n' + '='.repeat(60));
  console.log('✨ All examples completed!');
  console.log('='.repeat(60));
}

main();
