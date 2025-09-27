<script lang="ts">
  export let summary: string | undefined;
  export let patch: string;
  export let onAccept: () => void;
  export let onReject: () => void;
</script>

<div class="interactive-canvas-diff">
  <h2>AI Canvas Update</h2>
  {#if summary}
    <p class="summary">{summary}</p>
  {/if}
  <label>Proposed JSON Patch</label>
  <pre><code>{patch}</code></pre>
  <div class="actions">
    <button class="mod-cta" on:click={onAccept}>Apply changes</button>
    <button on:click={onReject}>Discard</button>
  </div>
</div>

<style>
  .interactive-canvas-diff {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 420px;
    max-width: 540px;
  }

  .interactive-canvas-diff pre {
    background: var(--background-primary-alt);
    padding: 12px;
    border-radius: 8px;
    max-height: 260px;
    overflow: auto;
    font-size: 12px;
  }

  .interactive-canvas-diff .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .interactive-canvas-diff .summary {
    margin: 0;
  }
</style>
