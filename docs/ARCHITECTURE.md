# InteractiveCanvas Plugin Architecture

## High-level Overview
- **Entry point (`src/main.ts`)**: Initializes the plugin, loads settings, and wires the canvas observers that mount Svelte components for AI actions.
- **Settings management (`src/settings.ts`, `src/ui/SettingsTab.svelte`)**: Manages plugin settings in a reactive Svelte component hosted inside Obsidian's settings tab.
- **Canvas augmentation (`src/canvas/augmenter.ts`)**: Listens for canvas node lifecycle events and mounts an `AskAiButton` Svelte component onto each node.
- **AI orchestration (`src/ai/OpenAiClient.ts`, `src/ai/CanvasDiff.ts`)**: Wraps OpenAI Chat Completions, provides tool definitions, parses responses, and applies diffs back to the canvas.
- **UI components (`src/ui/*.svelte`)**: Encapsulate the interactive pieces (Ask AI button, diff modal with accept/reject controls).
- **Testing (`tests/canvasDiff.test.ts`)**: Covers diff application logic to validate transformations.

## Subtasks
1. **Scaffold project tooling**
   - Add `package.json`, `tsconfig.json`, `rollup.config.mjs`, and Svelte dependencies.
   - Configure linting/type definitions for Obsidian.
2. **Define settings schema**
   - Create persistent settings interface including API key, base URL, and model name.
   - Render settings using Svelte.
3. **Implement canvas augmenter**
   - Detect the active canvas view and attach `AskAiButton` components to each node.
   - Ensure clean-up when views change or plugin unloads.
4. **Create Ask AI workflow**
   - Gather canvas JSON and node text content.
   - Send chat completion request with tool support for `apply_canvas_diff`.
   - Present AI reply, and handle diff application via modal confirmation.
5. **Build diff modal**
   - Render diff preview using Svelte (text diff summary) and accept/reject buttons.
6. **Testing utilities**
   - Implement pure functions for diff application and write integration-style tests with `vitest` to assert transformations.

## Testing Strategy
- Use `vitest` to simulate AI diff payloads and ensure `applyCanvasDiff` mutates canvas data as expected.
- Provide mock canvas data resembling Obsidian's Canvas JSON format for deterministic assertions.

