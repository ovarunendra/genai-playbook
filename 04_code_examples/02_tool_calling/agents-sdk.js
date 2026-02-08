/**
 * 02 - Tool Calling with OpenAI Agents SDK
 *
 * This example demonstrates:
 * - Defining tools for agents to use
 * - Automatic tool execution by the agent
 * - Multi-agent handoffs
 */

import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import 'dotenv/config';

// Define tools using the tool() helper with Zod schemas
const getWeatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
  }),
  async execute({ location }) {
    // Mock weather data
    const weatherData = {
      'San Francisco': { temp: 68, condition: 'Foggy', humidity: 75 },
      'New York': { temp: 75, condition: 'Sunny', humidity: 60 },
      London: { temp: 55, condition: 'Rainy', humidity: 85 },
    };

    const weather = weatherData[location] || {
      temp: 72,
      condition: 'Unknown',
      humidity: 50,
    };
    return `Weather in ${location}: ${weather.temp}°F, ${weather.condition}, Humidity: ${weather.humidity}%`;
  },
});

const searchMoviesTool = tool({
  name: 'search_movies',
  description: 'Search for movies by genre',
  parameters: z.object({
    genre: z.string().describe('Movie genre'),
  }),
  async execute({ genre }) {
    // Mock movie search
    const movies = {
      horror: ['The Conjuring', 'A Quiet Place', 'Get Out'],
      comedy: ['Superbad', 'The Hangover', 'Bridesmaids'],
      action: ['Mad Max: Fury Road', 'John Wick', 'Mission Impossible'],
    };

    const results = movies[genre.toLowerCase()] || ['No movies found'];
    return `Movies in ${genre}: ${results.join(', ')}`;
  },
});

const generateDadJokeTool = tool({
  name: 'generate_dad_joke',
  description: 'Generate a random dad joke',
  parameters: z.object({}),
  async execute() {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "I'm reading a book about anti-gravity. It's impossible to put down!",
      'Why did the scarecrow win an award? He was outstanding in his field!',
    ];

    return jokes[Math.floor(Math.random() * jokes.length)];
  },
});

async function singleAgentWithTools() {
  console.log('🤖 Creating agent with tools...\n');

  try {
    const weatherAgent = new Agent({
      name: 'Weather Assistant',
      model: 'gpt-4o-mini',
      instructions: `You are a helpful weather assistant. Use the get_weather tool to provide weather information.
      Always format your response in a friendly, conversational way.`,
      tools: [getWeatherTool],
    });

    const result = await run(
      weatherAgent,
      "What's the weather like in San Francisco?",
    );

    console.log('Agent Response:', result.finalOutput);
    console.log('\n✅ Single agent with tools successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function multiAgentHandoff() {
  console.log('\n\n🤖 Creating multi-agent system with handoffs...\n');

  try {
    // Weather specialist agent
    const weatherAgent = new Agent({
      name: 'Weather Specialist',
      model: 'gpt-4o-mini',
      instructions:
        'You are a weather expert. Provide detailed weather information.',
      tools: [getWeatherTool],
    });

    // Entertainment specialist agent
    const entertainmentAgent = new Agent({
      name: 'Entertainment Specialist',
      model: 'gpt-4o-mini',
      instructions:
        'You are an entertainment expert. Help with movie recommendations and jokes.',
      tools: [searchMoviesTool, generateDadJokeTool],
    });

    // Triage agent that routes to specialists
    const triageAgent = new Agent({
      name: 'Triage Agent',
      model: 'gpt-4o-mini',
      instructions: `You are a triage agent. Route requests to the appropriate specialist:
      - Weather questions → Weather Specialist
      - Movie/entertainment questions → Entertainment Specialist
      Handoff to the appropriate agent based on the user's request.`,
      handoffs: [weatherAgent, entertainmentAgent],
    });

    console.log('User: Tell me a joke and recommend a horror movie\n');

    const result = await run(
      triageAgent,
      'Tell me a joke and recommend a horror movie',
    );

    console.log('Final Response:', result.finalOutput);
    console.log('\n✅ Multi-agent handoff successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Tool Calling with OpenAI Agents SDK');
  console.log('='.repeat(60));

  await singleAgentWithTools();
  await multiAgentHandoff();

  console.log('\n' + '='.repeat(60));
  console.log('✨ All examples completed!');
  console.log('='.repeat(60));
}

main();
