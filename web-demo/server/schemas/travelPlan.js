import { z } from 'zod';

const text = z.preprocess(value => {
  if (Array.isArray(value)) return value.join('、');
  if (value === null || value === undefined) return '';
  return String(value);
}, z.string());

const nonEmptyText = text.pipe(z.string().min(1));
const textList = z.preprocess(value => typeof value === 'string' ? [value] : value ?? [], z.array(text));
const integer = z.coerce.number().int();
const nonNegativeNumber = z.coerce.number().nonnegative();

const stopSchema = z.object({
  name: nonEmptyText,
  reason: nonEmptyText,
  durationMinutes: integer.pipe(z.number().positive()),
  category: z.enum(['景点', '餐饮', '休息', '交通', '购物', '其他'])
});

export const travelPlanSchema = z.object({
  intent: z.object({
    destination: nonEmptyText,
    origin: text,
    days: integer.pipe(z.number().min(1).max(14)),
    travelers: nonEmptyText,
    preferences: textList.pipe(z.array(z.string()).min(1)),
    budget: text,
    pace: z.enum(['轻松', '适中', '紧凑']),
    missingInformation: textList
  }),
  title: nonEmptyText,
  summary: nonEmptyText,
  bestSeasonNote: text,
  days: z.array(z.object({
    day: integer.pipe(z.number().positive()),
    title: nonEmptyText,
    date: text,
    transport: nonEmptyText,
    estimatedCostCny: nonNegativeNumber,
    stops: z.array(stopSchema).min(1),
    tips: textList
  })).min(1),
  services: z.array(z.object({
    type: z.enum(['住宿', '门票', '用车', '餐饮', '保险', '其他']),
    title: nonEmptyText,
    reason: nonEmptyText,
    searchKeyword: nonEmptyText,
    priceHint: text,
    bookingAdvice: text
  })).min(1),
  cautions: textList
});

export const planRequestSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  sessionId: z.string().uuid().optional()
});

export const refineRequestSchema = z.object({
  message: z.string().trim().min(2).max(2000)
});
