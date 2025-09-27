<script lang="ts">
  import type { InteractiveCanvasSettings } from "@/settings";

  export let settings: InteractiveCanvasSettings;
  export let onChange: (settings: InteractiveCanvasSettings) => void | Promise<void>;

  let local = { ...settings };

  $: shouldSync(settings, local) && (local = { ...settings });

  const update = async (partial: Partial<InteractiveCanvasSettings>) => {
    local = { ...local, ...partial };
    await onChange(local);
  };

  const handleApiKeyChange = async (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    await update({ openAiApiKey: value });
  };

  const handleBaseUrlChange = async (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    await update({ openAiBaseUrl: value });
  };

  const handleModelChange = async (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    await update({ openAiModel: value });
  };

  function shouldSync(a: InteractiveCanvasSettings, b: InteractiveCanvasSettings) {
    return (
      a.openAiApiKey !== b.openAiApiKey ||
      a.openAiBaseUrl !== b.openAiBaseUrl ||
      a.openAiModel !== b.openAiModel
    );
  }
</script>

<style>
  .setting-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  input {
    width: 100%;
  }
</style>

<div class="setting-group">
  <label for="interactive-canvas-api-key">OpenAI API Key</label>
  <input
    id="interactive-canvas-api-key"
    type="password"
    bind:value={local.openAiApiKey}
    placeholder="sk-..."
    on:change={handleApiKeyChange}
  />
</div>

<div class="setting-group">
  <label for="interactive-canvas-base-url">OpenAI Base URL</label>
  <input
    id="interactive-canvas-base-url"
    type="text"
    bind:value={local.openAiBaseUrl}
    placeholder="https://api.openai.com/v1"
    on:change={handleBaseUrlChange}
  />
</div>

<div class="setting-group">
  <label for="interactive-canvas-model">OpenAI Model</label>
  <input
    id="interactive-canvas-model"
    type="text"
    bind:value={local.openAiModel}
    placeholder="gpt-4o-mini"
    on:change={handleModelChange}
  />
</div>
