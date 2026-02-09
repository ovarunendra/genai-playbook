/**
 * 03 - Evaluations (Evals) Framework
 *
 * This example demonstrates:
 * - Creating a simple eval framework
 * - Testing tool selection accuracy
 * - Measuring LLM performance over time
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define tools for testing
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
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
      name: 'search_reddit',
      description: 'Search Reddit for interesting posts',
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
      name: 'generate_image',
      description: 'Generate an image using DALL-E',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Image description' },
        },
        required: ['prompt'],
      },
    },
  },
];

// Scorer: Check if the correct tool was called
function toolCallMatchScorer(output, expected) {
  // Check if output has the expected structure
  if (!output?.tool_calls || output.tool_calls.length === 0) {
    return { name: 'tool_call_match', score: 0 };
  }

  // Get the first tool call (in real scenarios, you might check all)
  const actualToolName = output.tool_calls[0].function.name;
  const expectedToolName = expected.tool_calls[0].function.name;

  // Score: 1 if match, 0 if no match
  const score = actualToolName === expectedToolName ? 1 : 0;

  return {
    name: 'tool_call_match',
    score,
    details: {
      actual: actualToolName,
      expected: expectedToolName,
    },
  };
}

// Run a single eval task
async function runTask(input) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: input }],
    tools: tools,
  });

  return response.choices[0].message;
}

// Run eval experiment
async function runEval(experimentName, testCases) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Experiment: ${experimentName}`);
  console.log('='.repeat(60));

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: "${testCase.input}"`);
    console.log(
      `   Expected tool: ${testCase.expected.tool_calls[0].function.name}`,
    );

    try {
      // Run the task
      const output = await runTask(testCase.input);

      // Score the output
      const score = toolCallMatchScorer(output, testCase.expected);

      console.log(`   Actual tool: ${score.details.actual}`);
      console.log(
        `   Score: ${score.score} ${score.score === 1 ? '✅' : '❌'}`,
      );

      results.push({
        input: testCase.input,
        score: score.score,
        details: score.details,
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        input: testCase.input,
        score: 0,
        error: error.message,
      });
    }
  }

  // Calculate aggregate score
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Experiment Results: ${experimentName}`);
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.score === 1).length}`);
  console.log(`Failed: ${results.filter((r) => r.score === 0).length}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  return { experimentName, results, avgScore };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Evaluations (Evals) Framework');
  console.log('='.repeat(60));

  // Test Case 1: Reddit tool selection
  const redditTestCases = [
    {
      input: 'Find me something interesting on Reddit',
      expected: {
        tool_calls: [{ function: { name: 'search_reddit' } }],
      },
    },
    {
      input: 'Show me cool posts from Reddit about programming',
      expected: {
        tool_calls: [{ function: { name: 'search_reddit' } }],
      },
    },
    {
      input: "What's trending on Reddit today?",
      expected: {
        tool_calls: [{ function: { name: 'search_reddit' } }],
      },
    },
  ];

  // Test Case 2: Image generation tool selection
  const imageTestCases = [
    {
      input: 'Generate an image of a fluffy cat',
      expected: {
        tool_calls: [{ function: { name: 'generate_image' } }],
      },
    },
    {
      input: 'Create a picture of a sunset over mountains',
      expected: {
        tool_calls: [{ function: { name: 'generate_image' } }],
      },
    },
  ];

  // Test Case 3: Weather tool selection
  const weatherTestCases = [
    {
      input: "What's the weather like in San Francisco?",
      expected: {
        tool_calls: [{ function: { name: 'get_weather' } }],
      },
    },
    {
      input: 'Is it raining in London?',
      expected: {
        tool_calls: [{ function: { name: 'get_weather' } }],
      },
    },
  ];

  // Run all experiments
  await runEval('reddit_tool_selection', redditTestCases);
  await runEval('image_generation_tool_selection', imageTestCases);
  await runEval('weather_tool_selection', weatherTestCases);

  console.log('\n✨ All evals completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - Evals help measure LLM accuracy systematically');
  console.log('   - Tool selection is critical for agent reliability');
  console.log('   - Track scores over time to measure improvements');
  console.log('   - In production, run evals on every code change');
}

main();
