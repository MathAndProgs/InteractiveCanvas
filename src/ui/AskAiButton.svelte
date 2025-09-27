<script lang="ts">
  import type { AskButtonState } from "@/ui/askAiButtonTypes";

  export let state: AskButtonState = "idle";
  export let onAsk: () => void;
  export let tooltip: string = "Ask AI";
</script>

<style>
  button.ask-ai {
    position: absolute;
    bottom: 0.35rem;
    right: 0.35rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 999px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  button.ask-ai.loading {
    opacity: 0.7;
    cursor: wait;
  }

  button.ask-ai.error {
    background: var(--color-red);
  }

  .spinner {
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: rgba(255, 255, 255, 1);
    border-radius: 999px;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

<button
  class={`ask-ai ${state}`}
  type="button"
  aria-label={tooltip}
  on:click|stopPropagation|preventDefault={() => state !== "loading" && onAsk()}
  title={tooltip}
>
  {#if state === "loading"}
    <span class="spinner" aria-hidden="true"></span>
  {:else}
    <span aria-hidden="true">🤖</span>
  {/if}
  <span>ask ai</span>
</button>
