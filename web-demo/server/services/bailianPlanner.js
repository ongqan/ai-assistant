import OpenAI from 'openai';
import { config } from '../config.js';
import { travelPlanSchema } from '../schemas/travelPlan.js';
import { createPlanPrompt, TRAVEL_PLANNER_PROMPT } from '../prompts/travelPlanner.js';

let client;

const JSON_CONTRACT = `返回一个 JSON 对象，必须包含：
- intent: destination, origin, days(1-14整数), travelers, preferences(数组), budget, pace(轻松/适中/紧凑), missingInformation(数组)
- title, summary, bestSeasonNote
- days: 数组；每项含 day, title, date, transport, estimatedCostCny, stops, tips；stops 每项含 name, reason, durationMinutes, category(景点/餐饮/休息/交通/购物/其他)
- services: 数组；每项含 type(住宿/门票/用车/餐饮/保险/其他), title, reason, searchKeyword, priceHint, bookingAdvice
- cautions: 数组
不得使用 Markdown 代码块，不得省略字段。`;

function getClient() {
  if (!config.bailianKey) {
    const error = new Error('尚未配置 BAILIAN_API_KEY');
    error.code = 'MISSING_API_KEY';
    throw error;
  }
  client ??= new OpenAI({ apiKey: config.bailianKey, baseURL: config.bailianBaseUrl, timeout: 60_000, maxRetries: 1 });
  return client;
}

function extractJson(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(text);
}

export async function generateBailianPlan(message, previousPlan) {
  const completion = await getClient().chat.completions.create({
    model: config.bailianModel,
    messages: [
      { role: 'system', content: `${TRAVEL_PLANNER_PROMPT}\n\n${JSON_CONTRACT}` },
      { role: 'user', content: createPlanPrompt(message, previousPlan) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
    extra_body: { enable_thinking: false }
  });
  const parsed = extractJson(completion.choices[0]?.message?.content);
  return travelPlanSchema.parse(parsed);
}
