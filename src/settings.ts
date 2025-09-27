import { App, PluginSettingTab } from "obsidian";
import SettingsTab from "@/ui/SettingsTab.svelte";
import type InteractiveCanvasPlugin from "@/main";

export interface InteractiveCanvasSettings {
  openAiApiKey: string;
  openAiBaseUrl: string;
  openAiModel: string;
}

export const DEFAULT_SETTINGS: InteractiveCanvasSettings = {
  openAiApiKey: "",
  openAiBaseUrl: "https://api.openai.com/v1",
  openAiModel: "gpt-4o-mini",
};

export class InteractiveCanvasSettingTab extends PluginSettingTab {
  private plugin: InteractiveCanvasPlugin;
  private component?: SettingsTab;

  constructor(app: App, plugin: InteractiveCanvasPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.component?.$destroy();
    this.component = new SettingsTab({
      target: containerEl,
      props: {
        settings: { ...this.plugin.settings },
        onChange: async (updated: InteractiveCanvasSettings) => {
          this.plugin.settings = updated;
          await this.plugin.saveSettings();
        },
      },
    });
  }

  hide(): void {
    this.component?.$destroy();
    this.component = undefined;
  }
}
