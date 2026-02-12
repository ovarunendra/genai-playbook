/**
 * 06 - Human in the Loop (HITL)
 *
 * This example demonstrates:
 * - Implementing approval flows for AI actions
 * - Synchronous approval (blocking execution)
 * - Interpreting user approvals with LLMs
 */

import OpenAI from 'openai';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({ input, output });

// Define tools with different risk levels
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather information (low risk - no approval needed)',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description:
        'Generate an image with DALL-E (medium risk - needs approval)',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email (high risk - needs approval)',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
];

// Tools that require approval
const PROTECTED_TOOLS = ['generate_image', 'send_email'];

// Interpret user's approval response
async function interpretApproval(userResponse) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an approval interpreter. The user is responding to an approval request.
        Determine if their response means "yes" (approved) or "no" (rejected).
        
        Examples of YES: yes, ok, sure, go ahead, do it, please proceed, yep, yeah, approve
        Examples of NO: no, don't, stop, cancel, nevermind, nope, reject
        
        Respond with ONLY "APPROVED" or "REJECTED".`,
      },
      {
        role: 'user',
        content: userResponse,
      },
    ],
  });

  const interpretation = response.choices[0].message.content
    .trim()
    .toUpperCase();
  return interpretation.includes('APPROVED');
}

// Request approval from user
async function requestApproval(toolName, args) {
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  APPROVAL REQUIRED');
  console.log('='.repeat(60));
  console.log(`Tool: ${toolName}`);
  console.log(`Arguments:`, JSON.stringify(args, null, 2));
  console.log('='.repeat(60));

  const userResponse = await rl.question(
    '\nDo you approve this action? (yes/no): ',
  );

  const approved = await interpretApproval(userResponse);

  console.log(`\n${approved ? '✅ APPROVED' : '❌ REJECTED'}\n`);

  return approved;
}

// Execute tool (mock implementations)
function executeTool(toolName, args) {
  switch (toolName) {
    case 'get_weather':
      return { temperature: 72, condition: 'Sunny', location: args.location };
    case 'generate_image':
      return {
        imageUrl: 'https://example.com/generated-image.png',
        prompt: args.prompt,
      };
    case 'send_email':
      return { status: 'sent', to: args.to, subject: args.subject };
    default:
      return { error: 'Unknown tool' };
  }
}

// Agent loop with human-in-the-loop
async function runAgentWithApproval(userMessage) {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 Agent Starting...');
  console.log('='.repeat(60));
  console.log(`User: ${userMessage}\n`);

  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant with access to various tools.
      
IMPORTANT: You MUST use the appropriate tool when the user asks you to:
- Get weather for a location → use get_weather tool
- Generate an image → use generate_image tool  
- Send an email → use send_email tool

Do NOT refuse to use tools. Always extract the required parameters and make the tool call.
If a tool call is rejected, acknowledge it gracefully and ask if the user wants something else.`,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    // First LLM call - agent decides which tools to use
    let response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      tools: tools,
    });

    // Process tool calls in a loop until no more tool calls
    while (response.choices[0].finish_reason === 'tool_calls') {
      const toolCalls = response.choices[0].message.tool_calls;

      // Add assistant's response to messages
      messages.push({
        role: 'assistant',
        content: response.choices[0].message.content,
        tool_calls: toolCalls,
      });

      // Process each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`\n🔧 Agent wants to use tool: ${toolName}`);

        let toolResult;
        let approved = true;

        // Check if tool requires approval
        if (PROTECTED_TOOLS.includes(toolName)) {
          approved = await requestApproval(toolName, args);
        }

        if (approved) {
          console.log(`✅ Executing ${toolName}...`);
          toolResult = executeTool(toolName, args);
        } else {
          console.log(`❌ Tool execution rejected by user`);
          toolResult = { error: 'Action not approved by user' };
        }

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Get next response
      response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
      });
    }

    // Final response
    const finalMessage = response.choices[0].message.content;
    console.log('\n' + '='.repeat(60));
    console.log('🤖 Agent Response:');
    console.log('='.repeat(60));
    console.log(finalMessage);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Human in the Loop (HITL) Example');
  console.log('='.repeat(60));

  console.log('\nThis example demonstrates approval flows for AI actions.');
  console.log('The agent will ask for your approval before:');
  console.log('  - Generating images');
  console.log('  - Sending emails');
  console.log('\nTry saying yes, no, or other variations!\n');

  // Example 1: Action requiring approval
  await runAgentWithApproval(
    'Generate an image of a cute puppy playing in a park',
  );

  // Example 2: Another action requiring approval
  await runAgentWithApproval(
    'Send an email to team@example.com with subject "Meeting Tomorrow" saying we need to reschedule',
  );

  rl.close();

  console.log('\n✨ Examples completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - HITL prevents destructive actions without approval');
  console.log('   - Use LLMs to interpret natural language approvals');
  console.log('   - Implement different approval tiers (low/medium/high risk)');
  console.log('   - Essential for production AI systems');
}

main();
