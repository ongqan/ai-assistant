import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 8787),
  aiProvider: process.env.AI_PROVIDER || 'mock',
  openAiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-5-mini',
  amapKey: process.env.AMAP_API_KEY || '',
  maxMessageLength: 2000
};

export function getIntegrationStatus() {
  return {
    llm: config.aiProvider === 'openai' && Boolean(config.openAiKey),
    demo: config.aiProvider === 'mock',
    provider: config.aiProvider,
    map: Boolean(config.amapKey),
    model: config.aiProvider === 'openai' && config.openAiKey ? config.openAiModel : '本地演示引擎'
  };
}
