/**
 * 08 - Streaming Responses
 *
 * This example demonstrates:
 * - Streaming responses for better UX
 * - Processing server-sent events (SSE)
 * - Handling streaming tool calls
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicStreaming() {
  console.log('🤖 Example 1: Basic Streaming\n');
  console.log(
    'Question: Explain what streaming is and why it matters for UX\n',
  );
  console.log('Response (streaming): ');

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content:
            'Explain what streaming is in the context of LLMs and why it matters for user experience. Keep it to 2-3 sentences.',
        },
      ],
      stream: true,
    });

    // Process the stream
    for await (const chunk of stream) {
      // For text deltas, print them as they arrive
      if (chunk.choices[0].delta.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }

    console.log('\n\n✅ Basic streaming successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function streamingWithToolCalls() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 Example 2: Streaming with Tool Calls\n');

  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        },
      },
    },
  ];

  console.log("Question: What's the weather like in Tokyo and Paris?\n");

  try {
    const messages = [
      {
        role: 'user',
        content: "What's the weather like in Tokyo and Paris?",
      },
    ];

    // Mock tool implementation
    function executeTool(toolName, args) {
      if (toolName === 'get_weather') {
        const weatherData = {
          Tokyo: { temp: 15, condition: 'Cloudy' },
          Paris: { temp: 10, condition: 'Rainy' },
        };
        return weatherData[args.location] || { temp: 20, condition: 'Unknown' };
      }
      return { error: 'Unknown tool' };
    }

    let response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      tools: tools,
    });

    // Process tool calls in a loop
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

        console.log(`\n📞 Calling tool: ${toolName}`);
        console.log(`   Arguments:`, args);

        const result = executeTool(toolName, args);
        console.log(`   Result:`, result);

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Get next response with streaming
      console.log('\n🤖 Streaming response:\n');
      const stream = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        stream: true,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.choices[0].delta.content) {
          const content = chunk.choices[0].delta.content;
          process.stdout.write(content);
          fullContent += content;
        }
      }

      // Get final response without streaming to check for more tool calls
      response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...messages, { role: 'assistant', content: fullContent }],
        tools: tools,
      });
    }

    console.log('\n\n✅ Streaming with tool calls successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function streamingProgress() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 Example 3: Streaming with Progress Indicators\n');

  console.log('Question: Write a short story about a robot learning to code\n');
  console.log('Response:\n');

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content:
            'Write a very short (3 sentence) story about a robot learning to code.',
        },
      ],
      stream: true,
    });

    let wordCount = 0;
    let charCount = 0;

    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        const delta = chunk.choices[0].delta.content;
        process.stdout.write(delta);

        // Track progress
        charCount += delta.length;
        if (delta.includes(' ')) {
          wordCount += delta.split(' ').length - 1;
        }
      }
    }

    console.log('\n');
    console.log('─'.repeat(60));
    console.log(`📊 Stats: ${wordCount} words, ${charCount} characters`);
    console.log('─'.repeat(60));

    console.log('\n✅ Streaming with progress tracking successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Streaming Responses Examples');
  console.log('='.repeat(60) + '\n');

  await basicStreaming();
  await streamingWithToolCalls();
  await streamingProgress();

  console.log('='.repeat(60));
  console.log('✨ All streaming examples completed!');
  console.log('='.repeat(60));

  console.log('\n💡 Key Takeaways:');
  console.log('   - Streaming provides better UX (perceived performance)');
  console.log('   - Users see progress immediately');
  console.log('   - Handle different event types in the stream');
  console.log('   - Works with tool calls too');
  console.log('   - Essential for chat applications');
}

main();
