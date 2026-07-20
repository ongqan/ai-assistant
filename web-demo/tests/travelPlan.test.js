import test from 'node:test';
import assert from 'node:assert/strict';
import { planRequestSchema, travelPlanSchema } from '../server/schemas/travelPlan.js';
import { generateMockPlan } from '../server/services/mockPlanner.js';

const validPlan = {
  intent: { destination: '杭州', origin: '上海', days: 1, travelers: '情侣', preferences: ['美食'], budget: '中等', pace: '适中', missingInformation: [] },
  title: '杭州一日漫游', summary: '轻松游览杭州', bestSeasonNote: '四季皆宜',
  days: [{ day: 1, title: '西湖漫游', date: '', transport: '步行', estimatedCostCny: 300, stops: [{ name: '西湖', reason: '经典景点', durationMinutes: 180, category: '景点' }], tips: ['提前查看天气'] }],
  services: [{ type: '餐饮', title: '杭帮菜', reason: '体验本地口味', searchKeyword: '西湖 杭帮菜', priceHint: '以平台实时价格为准', bookingAdvice: '用餐高峰提前预约' }],
  cautions: ['营业时间请出发前核验']
};

test('accepts a complete structured travel plan', () => {
  assert.equal(travelPlanSchema.parse(validPlan).intent.destination, '杭州');
});

test('rejects plans outside the supported day range', () => {
  assert.throws(() => travelPlanSchema.parse({ ...validPlan, intent: { ...validPlan.intent, days: 30 } }));
});

test('trims and validates user requests', () => {
  assert.equal(planRequestSchema.parse({ message: '  杭州三日游  ' }).message, '杭州三日游');
  assert.throws(() => planRequestSchema.parse({ message: '' }));
});

test('demo engine recognizes intent and supports refinement', async () => {
  const first = await generateMockPlan('带爸妈去杭州玩三天，想看自然风景');
  assert.equal(first.intent.destination, '杭州');
  assert.equal(first.intent.days, 3);
  assert.equal(first.intent.travelers, '家庭出行');
  const refined = await generateMockPlan('改成轻松一点', first);
  assert.equal(refined.intent.destination, '杭州');
  assert.equal(refined.intent.pace, '轻松');
});
