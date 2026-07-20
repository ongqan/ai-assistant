import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { config } from '../config.js';
import { travelPlanSchema } from '../schemas/travelPlan.js';
import { createPlanPrompt, TRAVEL_PLANNER_PROMPT } from '../prompts/travelPlanner.js';
import { generateMockPlan } from './mockPlanner.js';

let client;

function getClient() {
  if (!config.openAiKey) {
    const error = new Error('尚未配置 OPENAI_API_KEY');
    error.code = 'MISSING_API_KEY';
    throw error;
  }
  client ??= new OpenAI({ apiKey: config.openAiKey, timeout: 45_000, maxRetries: 2 });
  return client;
}

export async function generateTravelPlan(message, previousPlan) {
  if (config.aiProvider === 'mock') return generateMockPlan(message, previousPlan);
  const response = await getClient().responses.parse({
    model: config.openAiModel,
    instructions: TRAVEL_PLANNER_PROMPT,
    input: createPlanPrompt(message, previousPlan),
    text: { format: zodTextFormat(travelPlanSchema, 'travel_plan') }
  });

  if (!response.output_parsed) {
    const error = new Error('模型没有返回有效的结构化行程');
    error.code = 'INVALID_MODEL_RESPONSE';
    throw error;
  }
  return response.output_parsed;
}
