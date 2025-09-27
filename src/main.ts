import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  type InteractiveCanvasSettings,
  InteractiveCanvasSettingTab,
} from "@/settings";
import { CanvasAugmenter } from "@/canvas/augmenter";

export default class InteractiveCanvasPlugin extends Plugin {
  settings: InteractiveCanvasSettings = { ...DEFAULT_SETTINGS };
  private augmenter?: CanvasAugmenter;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.augmenter = new CanvasAugmenter(this);
    this.augmenter.init();
    this.register(() => this.augmenter?.destroy());

    this.addSettingTab(new InteractiveCanvasSettingTab(this.app, this));
  }

  onunload(): void {
    this.augmenter?.destroy();
  }

  async loadSettings(): Promise<void> {
    const stored = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored ?? {});
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
