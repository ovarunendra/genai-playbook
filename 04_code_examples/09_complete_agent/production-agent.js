/**
 * 09 - Complete Production-Ready Agent
 *
 * This example demonstrates a complete agent implementation combining:
 * - Tool calling (weather, search, email)
 * - Human in the loop (approval flows)
 * - History management (window slicing)
 * - Evals (testing framework)
 * - Error handling
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== TOOL DEFINITIONS ====================

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Get current weather for a location (low risk - no approval)',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for information (low risk - no approval)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email (HIGH RISK - requires approval)',
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

// ==================== TOOL IMPLEMENTATIONS ====================

function executeTool(toolName, args) {
  switch (toolName) {
    case 'get_weather':
      return {
        location: args.location,
        temperature: 72,
        condition: 'Sunny',
        humidity: 45,
      };

    case 'web_search':
      return {
        query: args.query,
        results: [
          { title: 'Result 1', snippet: 'Information about ' + args.query },
          { title: 'Result 2', snippet: 'More details about ' + args.query },
        ],
      };

    case 'send_email':
      return {
        status: 'sent',
        to: args.to,
        subject: args.subject,
        messageId: 'msg_' + Date.now(),
      };

    default:
      return { error: 'Unknown tool' };
  }
}

// ==================== HUMAN IN THE LOOP ====================

const PROTECTED_TOOLS = ['send_email'];

function requiresApproval(toolName) {
  return PROTECTED_TOOLS.includes(toolName);
}

async function getApproval(toolName, args) {
  // In production, this would show UI or send notification
  // For demo, we'll auto-approve with logging
  console.log('\n⚠️  APPROVAL REQUIRED');
  console.log(`   Tool: ${toolName}`);
  console.log(`   Args: ${JSON.stringify(args, null, 2)}`);
  console.log('   [Auto-approved for demo]\n');

  return true; // In production, wait for user input
}

// ==================== HISTORY MANAGEMENT ====================

function applyWindowSlicing(messages, maxMessages = 10) {
  if (messages.length <= maxMessages) {
    return messages;
  }

  const systemMessages = messages.filter((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');
  const recentMessages = otherMessages.slice(-maxMessages);

  return [...systemMessages, ...recentMessages];
}

// ==================== AGENT CORE ====================

class ProductionAgent {
  constructor() {
    this.conversationHistory = [
      {
        role: 'system',
        content: `CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE:

Your job is to CALL TOOLS. When a user makes a request:
1. Weather request → CALL get_weather immediately
2. Search request → CALL web_search immediately  
3. Email request → CALL send_email immediately

DO NOT CHAT. DO NOT EXPLAIN. DO NOT ASK PERMISSION.
Just extract parameters and CALL THE TOOL.

SPECIFIC RULES:
- If user says "weather" or "What's the weather" → get_weather(location)
- If user says "search" or "find information" → web_search(query)
- If user says "send email" → send_email(to, subject, body)
- Extract location/query/email details from user message
- Use the exact parameters the user provides
- For email: use the recipient email, create appropriate subject and body from message

APPROVAL: The system will handle approval prompts for sensitive operations.
Your job is only to CALL THE TOOL with the right parameters.
If a call is rejected, tell the user it was not approved.

REMEMBER: You have 3 tools available. Use them. Don't just talk.`,
      },
    ];
  }

  async processMessage(userMessage) {
    console.log('\n' + '='.repeat(60));
    console.log(`👤 User: ${userMessage}`);
    console.log('='.repeat(60));

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Apply history management (window slicing)
    const windowedMessages = applyWindowSlicing(this.conversationHistory);

    try {
      let response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: windowedMessages,
        tools: tools,
      });

      // Process tool calls in a loop
      while (response.choices[0].finish_reason === 'tool_calls') {
        const toolCalls = response.choices[0].message.tool_calls;

        console.log(`\n🔧 Agent wants to use ${toolCalls.length} tool(s)`);

        // Add assistant message to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.choices[0].message.content || '',
          tool_calls: toolCalls,
        });

        // Process each tool call
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          console.log(`\n   → ${toolName}(${JSON.stringify(args)})`);

          let toolResult;
          let approved = true;

          // Check if approval is required
          if (requiresApproval(toolName)) {
            approved = await getApproval(toolName, args);
          }

          if (approved) {
            console.log(`     ✅ Executing...`);
            toolResult = executeTool(toolName, args);
          } else {
            console.log(`     ❌ Rejected by user`);
            toolResult = { error: 'Action not approved' };
          }

          // Add tool result to history
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        // Get next response
        response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: this.conversationHistory,
          tools: tools,
        });
      }

      // Final response
      const finalMessage = response.choices[0].message.content;

      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage,
      });

      console.log(`\n🤖 Assistant: ${finalMessage}`);

      return finalMessage;
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      return null;
    }
  }

  getConversationLength() {
    return this.conversationHistory.length;
  }

  resetConversation() {
    this.conversationHistory = this.conversationHistory.filter(
      (m) => m.role === 'system',
    );
  }
}

// ==================== EVALUATION FRAMEWORK ====================

async function evaluateAgent() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Running Agent Evaluation');
  console.log('='.repeat(60));

  const testCases = [
    {
      input: "What's the weather in Tokyo?",
      expectedTool: 'get_weather',
      description: 'Should use weather tool',
    },
    {
      input: 'Search for the latest AI news',
      expectedTool: 'web_search',
      description: 'Should use search tool',
    },
    {
      input: 'Send an email to test@example.com saying hello',
      expectedTool: 'send_email',
      description: 'Should use email tool (with approval)',
    },
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);

    const agent = new ProductionAgent();

    await agent.processMessage(testCase.input);

    // Check if the expected tool was called by looking for tool_calls in messages
    const toolCallMessages = agent.conversationHistory.filter(
      (m) =>
        m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0,
    );

    const calledCorrectTool = toolCallMessages.some((msg) =>
      msg.tool_calls.some((tc) => {
        return (
          (tc.function && tc.function.name === testCase.expectedTool) ||
          tc.name === testCase.expectedTool
        );
      }),
    );

    results.push({
      test: testCase.description,
      passed: calledCorrectTool,
    });

    console.log(`   ${calledCorrectTool ? '✅ PASS' : '❌ FAIL'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Evaluation Results');
  console.log('='.repeat(60));

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;

  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Score: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
}

// ==================== DEMO ====================

async function demo() {
  console.log('='.repeat(60));
  console.log('Complete Production-Ready Agent Demo');
  console.log('='.repeat(60));

  const agent = new ProductionAgent();

  // Conversation flow
  await agent.processMessage("What's the weather like in Paris?");

  await agent.processMessage(
    'Can you search for French restaurants near the Eiffel Tower?',
  );

  await agent.processMessage(
    'Send an email to friend@example.com with subject "Trip to Paris" saying I\'m planning to visit next month',
  );

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Conversation Stats:`);
  console.log(`   Messages: ${agent.getConversationLength()}`);
  console.log('='.repeat(60));
}

// ==================== MAIN ====================

async function main() {
  console.log('\n🚀 Starting production agent examples...\n');

  // Run demo
  await demo();

  // Run evaluation
  await evaluateAgent();

  console.log('\n' + '='.repeat(60));
  console.log('✨ All examples completed!');
  console.log('='.repeat(60));

  console.log('\n💡 This agent demonstrates:');
  console.log('   ✅ Tool calling with multiple tools');
  console.log('   ✅ Human in the loop (approval flows)');
  console.log('   ✅ History management (window slicing)');
  console.log('   ✅ Evaluation framework');
  console.log('   ✅ Error handling');
  console.log('   ✅ Conversation state management');
  console.log('\n🎓 Key Production Patterns:');
  console.log('   1. Always protect destructive actions');
  console.log('   2. Manage conversation history proactively');
  console.log('   3. Test systematically with evals');
  console.log('   4. Handle errors gracefully');
  console.log('   5. Log tool usage for debugging');
}

main();
