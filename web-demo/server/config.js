import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 8787),
  aiProvider: process.env.AI_PROVIDER || (process.env.OPENAI_MODEL?.toLowerCase().startsWith('qwen') ? 'bailian' : 'mock'),
  openAiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-5-mini',
  bailianKey: process.env.BAILIAN_API_KEY || process.env.OPENAI_API_KEY || '',
  bailianModel: process.env.BAILIAN_MODEL || process.env.OPENAI_MODEL || 'qwen-plus',
  bailianBaseUrl: process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  amapKey: process.env.AMAP_API_KEY || '',
  maxMessageLength: 2000
};

export function getIntegrationStatus() {
  return {
    llm: (config.aiProvider === 'openai' && Boolean(config.openAiKey)) || (config.aiProvider === 'bailian' && Boolean(config.bailianKey)),
    demo: config.aiProvider === 'mock',
    provider: config.aiProvider,
    map: Boolean(config.amapKey),
    model: config.aiProvider === 'bailian' ? config.bailianModel : config.aiProvider === 'openai' && config.openAiKey ? config.openAiModel : '本地演示引擎'
  };
}
