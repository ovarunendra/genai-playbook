# AI Examples

This directory contains working Node.js examples

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set up Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your OpenAI API key.

3. **Get an OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Add at least $5 to your account

## Examples Overview

### 01. Basic LLM Usage

Learn the fundamentals of making API calls to OpenAI.

- **OpenAI SDK**: `npm run 01_basic_completion`
- **Agents SDK**: `npm run 01_basic_agent`

### 02. Tool Calling (Function Calling)

Learn how to give LLMs access to external functions and tools.

- **OpenAI SDK**: `npm run 02_tool_calling`
- **Agents SDK**: `npm run 02_tool_agent`

### 03. Evaluations (Evals)

Learn how to test and measure LLM performance systematically.

- **Run Eval**: `npm run 03_evals`

### 04. RAG (Retrieval Augmented Generation)

Learn how to give LLMs access to external knowledge through vector search.

- **Run RAG Example**: `npm run 04_rag`

### 05. Structured Outputs

Learn how to get guaranteed JSON responses from LLMs.

- **Run Example**: `npm run 05_structured_outputs`

### 06. Human in the Loop

Learn how to implement approval flows for AI actions.

- **Run Example**: `npm run 06_human_in_loop`

## Resources

- [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart)
- [OpenAI Agents SDK - Python](https://openai.github.io/openai-agents-python)
- [OpenAI Agents SDK - TypeScript](https://openai.github.io/openai-agents-js)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Notes

- All examples use ES modules (import/export syntax)
- Make sure you have Node.js 22+ installed
- The Agents SDK examples use the `@openai/agents` package which is currently in beta
- Cost: Most examples will cost less than $0.10 to run
