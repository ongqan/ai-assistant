import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { config, getIntegrationStatus } from './config.js';
import { plansRouter } from './routes/plans.js';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(pinoHttp());
app.use(express.json({ limit: '32kb' }));
app.use('/assets', express.static(path.join(root, 'assets')));
app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/app.js', (_req, res) => res.sendFile(path.join(root, 'app.js')));
app.get('/api/health', (_req, res) => res.json({ ok: true, integrations: getIntegrationStatus() }));
app.use('/api/plans', plansRouter);

app.use((error, req, res, _next) => {
  req.log.error({ err: error }, 'request failed');
  if (error instanceof ZodError) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: '出行需求格式不正确', details: error.flatten() } });
  if (error.code === 'MISSING_API_KEY') return res.status(503).json({ error: { code: error.code, message: '服务端尚未配置 OpenAI API Key，请先完成项目配置' } });
  if (error.status === 401) return res.status(503).json({ error: { code: 'INVALID_API_KEY', message: 'OpenAI API Key 无效或已过期' } });
  if (error.status === 429) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'AI 服务当前繁忙，请稍后重试' } });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '智能规划暂时不可用，请稍后重试' } });
});

app.listen(config.port, () => {
  console.log(`旅伴 AI 已启动：http://localhost:${config.port}`);
  console.log(`智能引擎：${config.aiProvider === 'mock' ? '本地演示模式（无需 Key）' : config.openAiKey ? `OpenAI (${config.openAiModel})` : '等待配置 OPENAI_API_KEY'}`);
  console.log(`真实地点：${config.amapKey ? '已接入高德地图' : '未配置（可选）'}`);
});

export { app };
