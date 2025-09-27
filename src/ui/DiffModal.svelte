<script lang="ts">
  import type { CanvasDiffPayload } from "@/ai/CanvasDiff";

  export let diff: CanvasDiffPayload;
  export let summary: string;
  export let message: string | undefined;
  export let onAccept: () => void;
  export let onReject: () => void;
</script>

<style>
  .diff-modal {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 70vh;
  }

  .operations {
    overflow: auto;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .operations pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-monospace);
    font-size: 0.85rem;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>

<div class="diff-modal">
  <h2>AI suggested changes</h2>
  <p>{summary}</p>
  {#if message}
    <blockquote>{message}</blockquote>
  {/if}
  <div class="operations">
    <pre>{JSON.stringify(diff.operations, null, 2)}</pre>
  </div>
  <div class="actions">
    <button class="mod-cta" on:click={onAccept}>Apply changes</button>
    <button on:click={onReject}>Dismiss</button>
  </div>
</div>
