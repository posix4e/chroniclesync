import { Settings } from '../settings/Settings';

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class OpenRouter {
  private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const apiKey = await this.settings.getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'ChronicleSync'
    };

    return fetch(`${this.OPENROUTER_API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
  }

  async getAvailableModels(): Promise<OpenRouterModel[]> {
    const response = await this.fetchWithAuth('/models');
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
  }

  async summarizeText(text: string): Promise<string> {
    const model = await this.settings.getSelectedModel();
    const response = await this.fetchWithAuth('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes text content. Provide concise, informative summaries that capture the key points.'
          },
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to summarize text: ${response.statusText}`);
    }

    const data = await response.json() as OpenRouterResponse;
    return data.choices[0].message.content;
  }
}