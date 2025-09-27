import type { InteractiveCanvasSettings } from "@/settings";
import type { CanvasDiffPayload } from "@/ai/CanvasDiff";

export interface AskAiResponse {
  message?: string;
  diff?: CanvasDiffPayload;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw: unknown;
}

export class OpenAiClient {
  constructor(private readonly settings: InteractiveCanvasSettings) {}

  private get headers(): Record<string, string> {
    if (!this.settings.openAiApiKey) {
      throw new Error("OpenAI API key is not configured.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.settings.openAiApiKey}`,
    };
  }

  private get endpoint(): string {
    const base = this.settings.openAiBaseUrl.replace(/\/$/, "");
    return `${base}/chat/completions`;
  }

  async ask(systemPrompt: string, userPrompt: string): Promise<AskAiResponse> {
    const body = {
      model: this.settings.openAiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      tools: [this.diffToolDefinition()],
      tool_choice: "auto" as const,
    };

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const choice = payload?.choices?.[0];

    const result: AskAiResponse = {
      message: choice?.message?.content?.trim() || undefined,
      raw: payload,
      usage: payload?.usage,
    };

    const toolCalls: any[] = choice?.message?.tool_calls ?? [];
    for (const call of toolCalls) {
      if (call?.function?.name === "apply_canvas_diff") {
        const args = call.function.arguments;
        try {
          const parsed = JSON.parse(args ?? "{}");
          if (parsed && Array.isArray(parsed.operations)) {
            result.diff = parsed as CanvasDiffPayload;
          }
        } catch (error) {
          console.error("Failed to parse tool arguments", error);
        }
      }
    }

    return result;
  }

  private diffToolDefinition() {
    return {
      type: "function" as const,
      function: {
        name: "apply_canvas_diff",
        description:
          "Apply modifications to the current Obsidian canvas. Use when the canvas should be changed.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Human readable summary of the changes you are proposing.",
            },
            message: {
              type: "string",
              description: "Optional message to show the user.",
            },
            operations: {
              type: "array",
              description: "List of operations to apply to the canvas.",
              items: {
                type: "object",
                oneOf: [
                  {
                    type: "object",
                    required: ["type", "node"],
                    properties: {
                      type: { const: "createNode" },
                      node: { $ref: "#/definitions/CanvasNode" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "id", "patch"],
                    properties: {
                      type: { const: "updateNode" },
                      id: { type: "string" },
                      patch: { $ref: "#/definitions/CanvasNode" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "id"],
                    properties: {
                      type: { const: "deleteNode" },
                      id: { type: "string" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "edge"],
                    properties: {
                      type: { const: "createEdge" },
                      edge: { $ref: "#/definitions/CanvasEdge" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "id", "patch"],
                    properties: {
                      type: { const: "updateEdge" },
                      id: { type: "string" },
                      patch: { $ref: "#/definitions/CanvasEdge" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "id"],
                    properties: {
                      type: { const: "deleteEdge" },
                      id: { type: "string" },
                    },
                  },
                  {
                    type: "object",
                    required: ["type", "data"],
                    properties: {
                      type: { const: "replaceData" },
                      data: {
                        type: "object",
                        properties: {
                          nodes: {
                            type: "array",
                            items: { $ref: "#/definitions/CanvasNode" },
                          },
                          edges: {
                            type: "array",
                            items: { $ref: "#/definitions/CanvasEdge" },
                          },
                        },
                        required: ["nodes", "edges"],
                      },
                    },
                  },
                ],
              },
            },
          },
          required: ["operations"],
          additionalProperties: false,
          definitions: {
            CanvasNode: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                text: { type: "string" },
                file: { type: "string" },
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
                color: { type: "string" },
              },
              required: ["id", "type", "x", "y", "width", "height"],
              additionalProperties: true,
            },
            CanvasEdge: {
              type: "object",
              properties: {
                id: { type: "string" },
                fromNode: { type: "string" },
                toNode: { type: "string" },
                fromSide: { type: "string" },
                toSide: { type: "string" },
                label: { type: "string" },
                color: { type: "string" },
              },
              required: ["id", "fromNode", "toNode"],
              additionalProperties: true,
            },
          },
        },
      },
    };
  }
}
