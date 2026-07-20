import { randomUUID } from 'node:crypto';

const sessions = new Map();
const TTL_MS = 1000 * 60 * 60 * 6;

export function createSession(plan, message) {
  const id = randomUUID();
  sessions.set(id, { plan, messages: [{ role: 'user', content: message }], updatedAt: Date.now() });
  return id;
}

export function getSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.updatedAt > TTL_MS) { sessions.delete(id); return null; }
  return session;
}

export function updateSession(id, plan, message) {
  const session = getSession(id);
  if (!session) return false;
  session.plan = plan;
  session.messages.push({ role: 'user', content: message });
  session.updatedAt = Date.now();
  return true;
}

