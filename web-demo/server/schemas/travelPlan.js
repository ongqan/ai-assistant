import { z } from 'zod';

const stopSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  category: z.enum(['景点', '餐饮', '休息', '交通', '购物', '其他'])
});

export const travelPlanSchema = z.object({
  intent: z.object({
    destination: z.string().min(1),
    origin: z.string(),
    days: z.number().int().min(1).max(14),
    travelers: z.string().min(1),
    preferences: z.array(z.string()).min(1),
    budget: z.string(),
    pace: z.enum(['轻松', '适中', '紧凑']),
    missingInformation: z.array(z.string())
  }),
  title: z.string().min(1),
  summary: z.string().min(1),
  bestSeasonNote: z.string(),
  days: z.array(z.object({
    day: z.number().int().positive(),
    title: z.string().min(1),
    date: z.string(),
    transport: z.string().min(1),
    estimatedCostCny: z.number().nonnegative(),
    stops: z.array(stopSchema).min(1),
    tips: z.array(z.string())
  })).min(1),
  services: z.array(z.object({
    type: z.enum(['住宿', '门票', '用车', '餐饮', '保险', '其他']),
    title: z.string().min(1),
    reason: z.string().min(1),
    searchKeyword: z.string().min(1),
    priceHint: z.string(),
    bookingAdvice: z.string()
  })).min(1),
  cautions: z.array(z.string())
});

export const planRequestSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  sessionId: z.string().uuid().optional()
});

export const refineRequestSchema = z.object({
  message: z.string().trim().min(2).max(2000)
});

