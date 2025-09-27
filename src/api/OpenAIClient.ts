import type CanvasAIPlugin from '@/main';
import type { CanvasData, CanvasNode } from '@/canvas/types';

export interface CanvasAIResponse {
  message?: string;
  patch?: string;
  summary?: string;
}

export class OpenAIClient {
  private plugin: CanvasAIPlugin;

  constructor(plugin: CanvasAIPlugin) {
    this.plugin = plugin;
  }

  async complete(canvas: CanvasData, node: CanvasNode): Promise<CanvasAIResponse> {
    const settings = this.plugin.settings;
    if (!settings.openaiApiKey) {
      throw new Error('OpenAI API key is not configured.');
    }

    const systemPrompt = this.buildSystemPrompt(canvas);
    const userPrompt = this.buildUserPrompt(node);

    const url = this.resolveUrl('/chat/completions');
    const body = {
      model: settings.openaiModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      tools: [OpenAIClient.canvasPatchToolDefinition],
      tool_choice: 'auto'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const payload = await response.json();
    return OpenAIClient.parseResponse(payload);
  }

  private resolveUrl(path: string): string {
    const base = this.plugin.settings.openaiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  private buildSystemPrompt(canvas: CanvasData): string {
    const json = JSON.stringify(canvas, null, 2);
    return `You are an assistant helping users edit their Obsidian Canvas. The full canvas JSON is provided below. You may use the apply_canvas_patch tool to return a JSON Patch array to update the canvas when structural changes are required. Each patch operation must be valid and keep the canvas consistent. Do not invent node IDs.
Canvas JSON:\n${json}`;
  }

  private buildUserPrompt(node: CanvasNode): string {
    const content = node.text ?? JSON.stringify(node, null, 2);
    return `The user is working with the following canvas node:\n${content}\n\nRespond with helpful suggestions. Use the tool if you want to update the canvas.`;
  }

  static parseResponse(payload: unknown): CanvasAIResponse {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid OpenAI response payload.');
    }

    const choices = (payload as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('OpenAI response did not include choices.');
    }

    const choice = choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown> | undefined;

    const result: CanvasAIResponse = {};

    if (message) {
      result.message = OpenAIClient.extractMessageContent(message.content as unknown);

      const toolCalls = message.tool_calls as unknown;
      if (Array.isArray(toolCalls)) {
        for (const call of toolCalls) {
          const functionCall = (call as { function?: { name?: string; arguments?: string } }).function;
          if (functionCall?.name === 'apply_canvas_patch' && typeof functionCall.arguments === 'string') {
            try {
              const parsed = JSON.parse(functionCall.arguments) as { patch?: string; summary?: string };
              if (parsed.patch) {
                result.patch = parsed.patch;
              }
              if (parsed.summary) {
                result.summary = parsed.summary;
              }
            } catch (error) {
              throw new Error('Failed to parse tool call arguments.');
            }
          }
        }
      }
    }

    return result;
  }

  private static extractMessageContent(content: unknown): string | undefined {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as { text: unknown }).text ?? '');
          }
          return '';
        })
        .join('')
        .trim();
      return text.length > 0 ? text : undefined;
    }

    return undefined;
  }

  static canvasPatchToolDefinition = {
    type: 'function',
    function: {
      name: 'apply_canvas_patch',
      description:
        'Apply a JSON Patch array to the canvas JSON. Use this to add, remove, or modify nodes and edges when updating the canvas.',
      parameters: {
        type: 'object',
        properties: {
          patch: {
            type: 'string',
            description:
              'A JSON string representing an array of JSON Patch operations (RFC6902) to transform the provided canvas JSON.'
          },
          summary: {
            type: 'string',
            description: 'A short summary of the proposed change to display to the user.'
          }
        },
        required: ['patch']
      }
    }
  } as const;
}
