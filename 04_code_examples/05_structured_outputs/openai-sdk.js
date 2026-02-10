/**
 * 05 - Structured Outputs
 *
 * This example demonstrates:
 * - Using Zod schemas for guaranteed JSON responses
 * - Structured outputs for deterministic parsing
 * - Handling model refusals
 */

import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicStructuredOutput() {
  console.log('🤖 Example 1: Basic Structured Output\n');

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a movie recommendation assistant. Provide structured movie recommendations.',
        },
        {
          role: 'user',
          content: 'Recommend 3 horror movies from the 2010s',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'movie_recommendations',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    genre: { type: 'string' },
                    year: { type: 'number' },
                    rating: { type: 'number' },
                    reason: { type: 'string' },
                  },
                  required: ['title', 'genre', 'year', 'rating', 'reason'],
                  additionalProperties: false,
                },
              },
              totalCount: { type: 'number' },
            },
            required: ['recommendations', 'totalCount'],
            additionalProperties: false,
          },
        },
      },
    });

    // Access the parsed response
    const result = completion.choices[0].message;

    if (result.refusal) {
      console.log('❌ Model refused:', result.refusal);
    } else {
      const parsed = JSON.parse(result.content);
      console.log('✅ Structured Response:');
      console.log(JSON.stringify(parsed, null, 2));

      console.log('\n📊 Movies:');
      parsed.recommendations.forEach((movie, i) => {
        console.log(
          `   ${i + 1}. ${movie.title} (${movie.year}) - ${movie.rating}/10`,
        );
        console.log(`      ${movie.reason}`);
      });
    }

    console.log('\n✅ Basic structured output successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function uiComponentGeneration() {
  console.log('\n🤖 Example 2: UI Component Generation\n');

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a UI component generator. Generate component specifications based on user requests.',
        },
        {
          role: 'user',
          content: 'Create a large blue button with the text "Submit Form"',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ui_component',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              componentType: {
                type: 'string',
                enum: ['button', 'input', 'card', 'modal'],
              },
              props: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  color: { type: 'string' },
                  size: {
                    type: 'string',
                    enum: ['small', 'medium', 'large'],
                  },
                },
                required: ['text', 'color', 'size'],
                additionalProperties: false,
              },
            },
            required: ['componentType', 'props'],
            additionalProperties: false,
          },
        },
      },
    });

    const result = completion.choices[0].message;

    if (result.refusal) {
      console.log('❌ Model refused:', result.refusal);
    } else {
      const parsed = JSON.parse(result.content);
      console.log('✅ Generated Component Spec:');
      console.log(JSON.stringify(parsed, null, 2));

      console.log('\n🎨 Component Preview:');
      console.log(`   Type: ${parsed.componentType}`);
      console.log(`   Text: ${parsed.props.text}`);
      console.log(`   Color: ${parsed.props.color}`);
      console.log(`   Size: ${parsed.props.size}`);
    }

    console.log('\n✅ UI component generation successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function dataExtractionExample() {
  console.log('\n🤖 Example 3: Data Extraction from Text\n');

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract structured information from the provided text.',
        },
        {
          role: 'user',
          content: `Extract information from this text:
          
          "John Doe is a 35-year-old software engineer living in San Francisco. 
          He has 10 years of experience and specializes in AI and machine learning. 
          His email is john.doe@example.com and his phone is 555-0123."`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'person_info',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              occupation: { type: 'string' },
              location: { type: 'string' },
              yearsOfExperience: { type: 'number' },
              specializations: {
                type: 'array',
                items: { type: 'string' },
              },
              contact: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                },
                required: ['email', 'phone'],
                additionalProperties: false,
              },
            },
            required: [
              'name',
              'age',
              'occupation',
              'location',
              'yearsOfExperience',
              'specializations',
              'contact',
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const result = completion.choices[0].message;

    if (result.refusal) {
      console.log('❌ Model refused:', result.refusal);
    } else {
      const parsed = JSON.parse(result.content);
      console.log('✅ Extracted Data:');
      console.log(JSON.stringify(parsed, null, 2));
    }

    console.log('\n✅ Data extraction successful!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Structured Outputs Examples');
  console.log('='.repeat(60) + '\n');

  await basicStructuredOutput();
  await uiComponentGeneration();
  await dataExtractionExample();

  console.log('='.repeat(60));
  console.log('✨ All examples completed!');
  console.log('='.repeat(60));

  console.log('\n💡 Key Takeaways:');
  console.log('   - Structured outputs guarantee JSON format');
  console.log('   - No more parsing errors or retry loops');
  console.log('   - Perfect for UI generation, data extraction');
  console.log('   - Root must always be an object type');
  console.log('   - Check for refusals (safety/moderation)');
}

main();
