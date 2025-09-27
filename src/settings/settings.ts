import { App, PluginSettingTab, Setting } from 'obsidian';
import type CanvasAIPlugin from '@/main';

export interface CanvasAISettings {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
}

export const DEFAULT_SETTINGS: CanvasAISettings = {
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModel: 'gpt-4-turbo'
};

export class CanvasAISettingTab extends PluginSettingTab {
  private plugin: CanvasAIPlugin;

  constructor(app: App, plugin: CanvasAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Interactive Canvas Settings' });

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Required for connecting to OpenAI. Stored locally in your vault.')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('OpenAI Base URL')
      .setDesc('Override if using a proxy or Azure OpenAI deployment.')
      .addText((text) =>
        text
          .setPlaceholder('https://api.openai.com/v1')
          .setValue(this.plugin.settings.openaiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.openaiBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('OpenAI Model')
      .setDesc('Model identifier to use for chat completions.')
      .addText((text) =>
        text
          .setPlaceholder('gpt-4.1')
          .setValue(this.plugin.settings.openaiModel)
          .onChange(async (value) => {
            this.plugin.settings.openaiModel = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
