<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export type AskStatus = 'idle' | 'loading' | 'error' | 'success';

  export let status: AskStatus = 'idle';

  const dispatch = createEventDispatcher<{ ask: void }>();

  const labelMap: Record<AskStatus, string> = {
    idle: 'ask ai',
    loading: 'asking…',
    error: 'retry',
    success: 'done'
  };

  const handleClick = () => {
    if (status === 'loading') return;
    dispatch('ask');
  };
</script>

<button class={`interactive-canvas-ask-button status-${status}`} on:click={handleClick} disabled={status === 'loading'}>
  {labelMap[status]}
</button>

<style>
  .interactive-canvas-ask-button {
    font-size: 11px;
    line-height: 1;
    padding: 4px 6px;
    border-radius: 6px;
    border: none;
    color: var(--text-on-accent);
    background: var(--interactive-accent);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .interactive-canvas-ask-button:disabled {
    opacity: 0.7;
    cursor: progress;
  }

  .interactive-canvas-ask-button.status-error {
    background: var(--color-red);
  }

  .interactive-canvas-ask-button.status-success {
    background: var(--color-green);
  }
</style>
