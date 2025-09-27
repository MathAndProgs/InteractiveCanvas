import { Notice } from "obsidian";
import AskAiButton from "@/ui/AskAiButton.svelte";
import type { AskButtonState } from "@/ui/askAiButtonTypes";
import type InteractiveCanvasPlugin from "@/main";
import { OpenAiClient } from "@/ai/OpenAiClient";
import {
  applyCanvasDiff,
  renderCanvasDiffSummary,
  type CanvasData,
} from "@/ai/CanvasDiff";
import { DiffModalHost } from "@/ui/DiffModalHost";

interface AskAiMount {
  id: string;
  element: HTMLElement;
  button: AskAiButton;
  state: AskButtonState;
}

const BUTTON_CLASS = "interactive-canvas-ask-ai";

export class CanvasAugmenter {
  private mounts = new Map<string, AskAiMount>();
  private observer?: MutationObserver;
  private view: any;

  constructor(private readonly plugin: InteractiveCanvasPlugin) {}

  init(): void {
    this.refreshActiveView();
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("layout-change", () => this.refreshActiveView()),
    );
    this.plugin.registerEvent(
      this.plugin.app.workspace.on("active-leaf-change", () => this.refreshActiveView()),
    );
  }

  destroy(): void {
    this.cleanupObserver();
    this.clearMounts();
  }

  private refreshActiveView(): void {
    const leaf = this.plugin.app.workspace.getMostRecentLeaf();
    const candidate = leaf?.view;

    if (candidate?.getViewType?.() !== "canvas") {
      this.detachView();
      return;
    }

    if (candidate === this.view) {
      return;
    }

    this.detachView();
    this.attachView(candidate);
  }

  private attachView(view: any): void {
    this.view = view;
    const container = view?.contentEl ?? view?.canvas?.containerEl ?? view?.canvasEl;
    if (!container) {
      return;
    }

    this.observer = new MutationObserver(() => this.refreshButtons());
    this.observer.observe(container, {
      childList: true,
      subtree: true,
    });

    this.refreshButtons();
  }

  private detachView(): void {
    this.cleanupObserver();
    this.clearMounts();
    this.view = undefined;
  }

  private cleanupObserver(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private clearMounts(): void {
    for (const mount of this.mounts.values()) {
      mount.button.$destroy();
      mount.element.remove();
    }
    this.mounts.clear();
  }

  private refreshButtons(): void {
    if (!this.view) {
      return;
    }

    const container: HTMLElement | null = this.view.contentEl ?? this.view.canvas?.containerEl ?? this.view.canvasEl;
    if (!container) {
      return;
    }

    const nodeEls = Array.from(container.querySelectorAll<HTMLElement>(".canvas-node"));

    const seen = new Set<string>();
    for (const nodeEl of nodeEls) {
      const id = nodeEl.getAttr?.("data-node-id") ?? nodeEl.dataset?.nodeId;
      if (!id) {
        continue;
      }
      seen.add(id);
      if (!this.mounts.has(id)) {
        this.mountNode(nodeEl, id);
      }
    }

    for (const [id, mount] of this.mounts) {
      if (!seen.has(id)) {
        mount.button.$destroy();
        mount.element.remove();
        this.mounts.delete(id);
      }
    }
  }

  private mountNode(nodeEl: HTMLElement, id: string): void {
    nodeEl.classList.add(BUTTON_CLASS);
    nodeEl.style.position = nodeEl.style.position || "relative";

    const mountEl = document.createElement("div");
    mountEl.className = "interactive-canvas-ask-ai-container";
    nodeEl.appendChild(mountEl);

    const mount: AskAiMount = {
      id,
      element: mountEl,
      button: new AskAiButton({
        target: mountEl,
        props: {
          state: "idle",
          onAsk: () => this.handleAsk(id),
        },
      }),
      state: "idle",
    };

    this.mounts.set(id, mount);
  }

  private setButtonState(id: string, state: AskButtonState): void {
    const mount = this.mounts.get(id);
    if (!mount) {
      return;
    }
    mount.state = state;
    mount.button.$set({ state });
    if (state === "error") {
      window.setTimeout(() => {
        if (this.mounts.get(id) === mount) {
          mount.state = "idle";
          mount.button.$set({ state: "idle" });
        }
      }, 2500);
    }
  }

  private async handleAsk(id: string): Promise<void> {
    const view = this.view;
    const canvasApi = view?.canvas;
    if (!view || !canvasApi?.getData) {
      new Notice("Canvas view is not ready.");
      return;
    }

    const data: CanvasData = canvasApi.getData();
    const node = data.nodes.find((item) => item.id === id);
    if (!node) {
      new Notice("Unable to locate canvas node.");
      return;
    }

    if (!this.plugin.settings.openAiApiKey) {
      new Notice("OpenAI API key is not configured in plugin settings.");
      return;
    }

    this.setButtonState(id, "loading");
    const openAi = new OpenAiClient(this.plugin.settings);

    const systemPrompt = [
      "You are an assistant helping a user improve an Obsidian canvas.",
      "You receive the full canvas JSON below to use as context.",
      "When you want to change the canvas, call the apply_canvas_diff tool.",
      "Never invent node IDs; reuse existing IDs when updating.",
      "Canvas JSON:",
      JSON.stringify(data),
    ].join("\n");

    const userPrompt = node.text || `Node ${node.id} data: ${JSON.stringify(node)}`;

    try {
      const response = await openAi.ask(systemPrompt, userPrompt);

      if (response.diff && response.diff.operations?.length) {
        const summary = renderCanvasDiffSummary(response.diff);
        const modal = new DiffModalHost(this.plugin.app, {
          diff: response.diff,
          summary,
          message: response.diff.message ?? response.message,
          onAccept: () => {
            const { data: updated } = applyCanvasDiff(data, response.diff!);
            canvasApi.setData(updated);
            canvasApi.requestSave?.();
            new Notice("Canvas updated with AI suggestions.");
          },
          onReject: () => {
            new Notice("AI changes dismissed.");
          },
        });
        modal.open();
      } else if (response.message) {
        new Notice(response.message);
      } else {
        new Notice("AI response did not include actionable content.");
      }

      this.setButtonState(id, "idle");
    } catch (error: any) {
      console.error(error);
      new Notice(`AI request failed: ${error?.message ?? error}`);
      this.setButtonState(id, "error");
    }
  }
}
