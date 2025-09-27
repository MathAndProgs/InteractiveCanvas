import { Notice, Plugin } from 'obsidian';
import type { CanvasView } from 'obsidian/canvas';
import { CanvasAISettingTab, DEFAULT_SETTINGS, type CanvasAISettings } from '@/settings/settings';
import { CanvasController } from '@/canvas/CanvasController';

export default class CanvasAIPlugin extends Plugin {
  settings: CanvasAISettings = DEFAULT_SETTINGS;
  private controllers = new Map<string, CanvasController>();

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new CanvasAISettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (!leaf) {
          return;
        }
        const view = leaf.view;
        if (this.isCanvasView(view)) {
          this.attachToCanvas(view);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.app.workspace
          .getLeavesOfType('canvas')
          .map((leaf) => leaf.view)
          .filter((view): view is CanvasView => this.isCanvasView(view))
          .forEach((view) => this.attachToCanvas(view));
      })
    );

    this.app.workspace
      .getLeavesOfType('canvas')
      .map((leaf) => leaf.view)
      .filter((view): view is CanvasView => this.isCanvasView(view))
      .forEach((view) => this.attachToCanvas(view));
  }

  onunload(): void {
    this.controllers.forEach((controller) => controller.destroy());
    this.controllers.clear();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private attachToCanvas(view: CanvasView): void {
    const leafId = view.leaf.id || (view.leaf as unknown as { id?: string }).id;
    if (!leafId) {
      new Notice('Unable to initialise Interactive Canvas: missing leaf id.');
      return;
    }

    if (this.controllers.has(leafId)) {
      return;
    }

    const controller = new CanvasController(this, view);
    this.controllers.set(leafId, controller);

    view.register(() => {
      controller.destroy();
      this.controllers.delete(leafId);
    });
  }

  private isCanvasView(view: unknown): view is CanvasView {
    return typeof (view as CanvasView)?.getViewType === 'function' && (view as CanvasView).getViewType() === 'canvas';
  }
}

export type { CanvasAISettings };
