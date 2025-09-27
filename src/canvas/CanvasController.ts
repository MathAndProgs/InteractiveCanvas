import { Notice } from 'obsidian';
import type { CanvasView } from 'obsidian/canvas';
import type CanvasAIPlugin from '@/main';
import { OpenAIClient } from '@/api/OpenAIClient';
import type { CanvasData, CanvasNode } from '@/canvas/types';
import { applyCanvasPatch, CanvasPatchError } from '@/canvas/canvasPatch';
import AskButton from '@/ui/AskButton.svelte';
import { DiffReviewModal } from '@/ui/DiffReviewModal';

interface NodeButton {
  component: AskButton;
  container: HTMLElement;
}

type AskState = 'idle' | 'loading' | 'error' | 'success';

export class CanvasController {
  private plugin: CanvasAIPlugin;
  private view: CanvasView;
  private observer?: MutationObserver;
  private nodeButtons = new Map<string, NodeButton>();
  private client: OpenAIClient;
  private canvasRoot?: HTMLElement;

  constructor(plugin: CanvasAIPlugin, view: CanvasView) {
    this.plugin = plugin;
    this.view = view;
    this.client = new OpenAIClient(plugin);
    this.initialise();
  }

  destroy(): void {
    this.observer?.disconnect();
    this.nodeButtons.forEach(({ component, container }) => {
      component.$destroy();
      container.remove();
    });
    this.nodeButtons.clear();
  }

  private initialise(): void {
    const root = this.view.contentEl.querySelector('.canvas-container');
    if (!(root instanceof HTMLElement)) {
      return;
    }

    this.canvasRoot = root;
    this.observer = new MutationObserver(() => this.syncNodes());
    this.observer.observe(root, { childList: true, subtree: true });
    this.syncNodes();
  }

  private syncNodes(): void {
    if (!this.canvasRoot) {
      return;
    }

    const nodes = Array.from(this.canvasRoot.querySelectorAll<HTMLElement>('.canvas-node'));
    const activeIds = new Set<string>();

    nodes.forEach((element) => {
      const nodeId = element.dataset.nodeid ?? element.dataset.id;
      if (!nodeId) {
        return;
      }
      activeIds.add(nodeId);
      if (!this.nodeButtons.has(nodeId)) {
        this.mountButton(nodeId, element);
      }
    });

    Array.from(this.nodeButtons.keys()).forEach((nodeId) => {
      if (!activeIds.has(nodeId)) {
        const button = this.nodeButtons.get(nodeId);
        if (button) {
          button.component.$destroy();
          button.container.remove();
          this.nodeButtons.delete(nodeId);
        }
      }
    });
  }

  private mountButton(nodeId: string, element: HTMLElement): void {
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    const wrapper = element.createDiv({ cls: 'interactive-canvas-ask-wrapper' });
    wrapper.style.position = 'absolute';
    wrapper.style.bottom = '6px';
    wrapper.style.right = '6px';
    wrapper.style.zIndex = '20';
    wrapper.style.pointerEvents = 'auto';

    const component = new AskButton({
      target: wrapper,
      props: {
        status: 'idle'
      }
    });

    component.$on('ask', () => {
      void this.handleAsk(nodeId);
    });

    this.nodeButtons.set(nodeId, { component, container: wrapper });
  }

  private updateButtonState(nodeId: string, state: AskState): void {
    const controller = this.nodeButtons.get(nodeId);
    if (!controller) {
      return;
    }
    controller.component.$set({ status: state });
    if (state === 'success' || state === 'error') {
      setTimeout(() => {
        controller.component.$set({ status: 'idle' });
      }, 1200);
    }
  }

  private async handleAsk(nodeId: string): Promise<void> {
    const data = this.getCanvasData();
    const node = data.nodes.find((candidate) => candidate.id === nodeId);

    if (!node) {
      new Notice('Unable to locate canvas node for AI request.');
      return;
    }

    try {
      this.updateButtonState(nodeId, 'loading');
      const response = await this.client.complete(data, node);
      if (response.message) {
        new Notice(response.message, 5000);
      }

      if (response.patch) {
        const { updated, formattedPatch } = applyCanvasPatch(data, response.patch);
        const modal = new DiffReviewModal(this.plugin.app, {
          summary: response.summary,
          patch: formattedPatch,
          onAccept: () => {
            this.applyCanvasData(updated);
            new Notice('Canvas updated successfully.');
          },
          onReject: () => {
            new Notice('Canvas changes discarded.');
          }
        });
        modal.open();
      }

      this.updateButtonState(nodeId, 'success');
    } catch (error) {
      console.error(error);
      const message =
        error instanceof CanvasPatchError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Unknown error';
      new Notice(`Ask AI failed: ${message}`);
      this.updateButtonState(nodeId, 'error');
    }
  }

  private getCanvasData(): CanvasData {
    const canvas = (this.view as unknown as { canvas?: { getData?: () => CanvasData; exportData?: () => CanvasData; data?: CanvasData } }).canvas;
    if (canvas?.getData) {
      return canvas.getData();
    }
    if (canvas?.exportData) {
      return canvas.exportData();
    }
    if (canvas?.data) {
      return canvas.data;
    }
    throw new Error('Unable to read canvas data.');
  }

  private applyCanvasData(data: CanvasData): void {
    const canvas = (this.view as unknown as { canvas?: { importData?: (payload: CanvasData) => void; setData?: (payload: CanvasData) => void } }).canvas;
    if (canvas?.importData) {
      canvas.importData(data);
      return;
    }
    if (canvas?.setData) {
      canvas.setData(data);
      return;
    }
    throw new Error('Unable to write canvas data.');
  }
}
