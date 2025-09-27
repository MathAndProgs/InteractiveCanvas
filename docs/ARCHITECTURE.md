# Interactive Canvas Plugin Architecture

## High-level Overview

The plugin extends Obsidian only when a canvas view is active. For every canvas node an inline Svelte widget renders an **Ask AI** button that triggers an OpenAI chat completion. The API call embeds the full canvas JSON as the system prompt and the node text as the user prompt. When the model responds with a JSON Patch diff via the `apply_canvas_patch` tool the user can review the patch and apply or discard it.

## Key Modules

- `src/main.ts` – Plugin entry point. Manages lifecycle hooks, settings registration, and one `CanvasController` per canvas view.
- `src/settings/settings.ts` – Settings definitions for `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`.
- `src/api/OpenAIClient.ts` – Builds and sends chat completion requests, parses tool responses.
- `src/canvas/CanvasController.ts` – Observes canvas DOM mutations, injects Svelte buttons, orchestrates AI requests, and applies patches.
- `src/canvas/canvasPatch.ts` – Validates and applies JSON Patch payloads.
- `src/ui/*.svelte` – Svelte components for the ask button and diff review modal.

## Suggested Development Tasks

1. **Project Scaffolding** – Configure Vite + Svelte build, TypeScript tooling, and Obsidian manifest files.
2. **Settings UX** – Implement persistent plugin settings for OpenAI credentials.
3. **Canvas Controller** – Detect active canvas views, observe node creation/removal, and mount ask buttons.
4. **OpenAI Integration** – Construct prompts, define the `apply_canvas_patch` tool schema, and handle API responses.
5. **Diff Application UX** – Show the returned JSON Patch to the user and apply accepted changes to the canvas.
6. **Testing Harness** – Provide Vitest coverage for JSON patching and OpenAI response parsing to aid local debugging.

## Integration Testing Strategy

A lightweight integration test can be executed via `npm test`. The Vitest suite validates the JSON patch application logic (`applyCanvasPatch`) against representative canvas data and verifies response parsing from mocked OpenAI payloads. During development, you can mock the network layer or run the plugin inside the Obsidian sandbox vault while watching the console for logs. This setup enables rapid iteration entirely within the repository without external dependencies beyond the OpenAI API.
