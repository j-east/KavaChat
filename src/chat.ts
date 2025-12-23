import { getStoredApiKey } from './auth';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  messages: Message[],
  model: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'KavaChat',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              onChunk?.(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  description?: string;
}

function categorizeModel(model: any): string {
  const id = model.id.toLowerCase();
  if (id.includes('openai') || id.includes('gpt') || id.includes('o1')) return 'OpenAI';
  if (id.includes('anthropic') || id.includes('claude')) return 'Anthropic';
  if (id.includes('google') || id.includes('gemini')) return 'Google';
  if (id.includes('deepseek')) return 'DeepSeek';
  if (id.includes('meta') || id.includes('llama')) return 'Meta';
  if (id.includes('mistral')) return 'Mistral';
  if (id.includes('x-ai') || id.includes('grok')) return 'xAI';
  if (id.includes('qwen')) return 'Qwen';
  return 'Other';
}

function isRelevantModel(model: any): boolean {
  const id = model.id.toLowerCase();

  // Filter for major providers and recent/flagship models
  const relevantProviders = ['openai', 'anthropic', 'google', 'deepseek', 'meta', 'mistral', 'x-ai', 'qwen'];
  const hasRelevantProvider = relevantProviders.some(p => id.includes(p));

  // Exclude free models, extended context variants, and preview/experimental versions
  const excludePatterns = ['free', 'extended', 'preview', 'nitro', ':online'];
  const shouldExclude = excludePatterns.some(p => id.includes(p));

  return hasRelevantProvider && !shouldExclude;
}

export async function getAvailableModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');

    if (!response.ok) {
      console.error('Failed to fetch models');
      return getDefaultModels();
    }

    const data = await response.json();
    const models = data.data
      .filter(isRelevantModel)
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: categorizeModel(model),
        contextLength: model.context_length || 0,
        pricing: {
          prompt: model.pricing?.prompt || '0',
          completion: model.pricing?.completion || '0',
        },
        description: model.description,
      }))
      .sort((a: ModelInfo, b: ModelInfo) => {
        // Sort by provider first, then by context length (as a proxy for capability)
        if (a.provider !== b.provider) {
          const providerOrder = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Meta', 'Mistral', 'xAI', 'Qwen'];
          return providerOrder.indexOf(a.provider) - providerOrder.indexOf(b.provider);
        }
        return b.contextLength - a.contextLength;
      });

    return models;
  } catch (error) {
    console.error('Error fetching models:', error);
    return getDefaultModels();
  }
}

function getDefaultModels(): ModelInfo[] {
  return [
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', contextLength: 128000, pricing: { prompt: '0', completion: '0' } },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', contextLength: 200000, pricing: { prompt: '0', completion: '0' } },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', contextLength: 1000000, pricing: { prompt: '0', completion: '0' } },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', contextLength: 64000, pricing: { prompt: '0', completion: '0' } },
  ];
}
