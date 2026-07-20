import { Router } from 'express';
import { planRequestSchema, refineRequestSchema } from '../schemas/travelPlan.js';
import { generateTravelPlan } from '../services/openAiPlanner.js';
import { enrichPlanWithPlaces } from '../services/amap.js';
import { createSession, getSession, updateSession } from '../store/sessionStore.js';

export const plansRouter = Router();

plansRouter.post('/', async (req, res, next) => {
  try {
    const { message } = planRequestSchema.parse(req.body);
    const rawPlan = await generateTravelPlan(message);
    const plan = await enrichPlanWithPlaces(rawPlan);
    const sessionId = createSession(plan, message);
    res.json({ sessionId, plan });
  } catch (error) { next(error); }
});

plansRouter.post('/:sessionId/refine', async (req, res, next) => {
  try {
    const { message } = refineRequestSchema.parse(req.body);
    const session = getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: '行程会话已过期，请重新规划' } });
    const rawPlan = await generateTravelPlan(message, session.plan);
    const plan = await enrichPlanWithPlaces(rawPlan);
    updateSession(req.params.sessionId, plan, message);
    res.json({ sessionId: req.params.sessionId, plan });
  } catch (error) { next(error); }
});

