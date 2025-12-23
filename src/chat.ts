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

export async function getAvailableModels(): Promise<Array<{ id: string; name: string }>> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
    }));
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}
