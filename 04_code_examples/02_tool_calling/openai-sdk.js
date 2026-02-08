/**
 * 02 - Tool Calling (Function Calling) with OpenAI SDK
 *
 * This example demonstrates:
 * - Defining tools/functions for the LLM to use
 * - Handling tool call requests from the LLM
 * - Feeding tool results back to the LLM
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock tool implementations
function getWeather(location) {
  const weatherData = {
    'San Francisco': { temp: 68, condition: 'Foggy' },
    'New York': { temp: 75, condition: 'Sunny' },
    London: { temp: 55, condition: 'Rainy' },
  };
  return weatherData[location] || { temp: 72, condition: 'Unknown' };
}

function getCurrentTime(timezone = 'UTC') {
  return new Date().toLocaleString('en-US', { timeZone: timezone });
}

// Define tools for the LLM
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a given location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name (e.g., "San Francisco", "New York")',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current time in a specific timezone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description:
              'Timezone name (e.g., "America/New_York", "Europe/London")',
          },
        },
        required: ['timezone'],
      },
    },
  },
];

// Execute tool based on LLM's request
function executeTool(toolName, args) {
  switch (toolName) {
    case 'get_weather':
      return getWeather(args.location);
    case 'get_current_time':
      return getCurrentTime(args.timezone);
    default:
      return { error: 'Unknown tool' };
  }
}

async function toolCallingExample() {
  console.log('🤖 Running tool calling example...\n');
  const messages = [
    {
      role: 'user',
      content:
        'What is the weather like in San Francisco and what time is it there?',
    },
  ];

  try {
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
      toolCalls.forEach((toolCall) => {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`\n📞 Calling tool: ${functionName}`);
        console.log(`   Arguments:`, args);

        const result = executeTool(functionName, args);
        console.log(`   Result:`, result);

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      });

      // Get next response
      response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
      });
    }

    const finalMessage = response.choices[0].message.content;
    console.log('\n🎯 Final Response:', finalMessage);
    console.log('\n✅ Tool calling example successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Tool Calling with OpenAI SDK');
  console.log('='.repeat(60));

  await toolCallingExample();

  console.log('\n' + '='.repeat(60));
  console.log('✨ Example completed!');
  console.log('='.repeat(60));
}

main();
