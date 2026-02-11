import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuickPopupSettings, ButtonConfig } from './types';

/**
 * プラグイン設定タブ
 */
export class QuickPopupSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // グローバル設定
    this.displayGlobalSettings();

    // ボタン設定
    this.displayButtonSettings();
  }

  /**
   * グローバル設定を表示
   */
  private displayGlobalSettings(): void {
    this.containerEl.createEl('h2', { text: 'Global Settings' });

    new Setting(this.containerEl)
      .setName('Show separators')
      .setDesc('Display | separators between buttons')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showSeparators)
          .onChange(async (value) => {
            this.plugin.settings.showSeparators = value;
            await this.plugin.saveSettings();
            this.plugin.refreshPopup();
          })
      );
  }

  /**
   * ボタン設定を表示
   */
  private displayButtonSettings(): void {
    this.containerEl.createEl('h2', { text: 'Button Settings' });

    const enabledButtons = (Object.values(this.plugin.settings.buttons) as ButtonConfig[])
      .sort((a, b) => a.order - b.order);

    for (const button of enabledButtons) {
      this.displayButtonSection(button);
    }
  }

  /**
   * ボタンセクションを表示
   */
  private displayButtonSection(button: ButtonConfig): void {
    const section = this.containerEl.createEl('div', {
      cls: 'quick-popup-button-section',
    });
    section.style.borderLeft = '3px solid #666';
    section.style.paddingLeft = '12px';
    section.style.marginBottom = '20px';

    // ボタン名と有効/無効トグル
    new Setting(section)
      .setName(button.tooltip)
      .setDesc(`Button ID: ${button.id}`)
      .addToggle((toggle) =>
        toggle
          .setValue(button.enabled)
          .onChange(async (value) => {
            button.enabled = value;
            await this.plugin.saveSettings();
            this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
            this.plugin.refreshPopup();
            this.display(); // UIを再描画
          })
      );

    // 有効な場合のみ追加設定を表示
    if (button.enabled) {
      // 表示タイプ
      new Setting(section)
        .setName('Display type')
        .setDesc('Show as icon or text')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('icon', 'Icon only')
            .addOption('text', 'Text only')
            .setValue(button.displayType)
            .onChange(async (value) => {
              button.displayType = value as 'icon' | 'text';
              await this.plugin.saveSettings();
              this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
              this.plugin.refreshPopup();
              this.display(); // UIを再描画
            })
        );

      // アイコン（displayType='icon'の場合）
      if (button.displayType === 'icon') {
        new Setting(section)
          .setName('Icon')
          .setDesc('Emoji or character to display')
          .addText((text) =>
            text
              .setPlaceholder('📋')
              .setValue(button.icon)
              .onChange(async (value) => {
                button.icon = value || '📋';
                await this.plugin.saveSettings();
                this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
                this.plugin.refreshPopup();
              })
          );
      }

      // テキスト（displayType='text'の場合）
      if (button.displayType === 'text') {
        new Setting(section)
          .setName('Label')
          .setDesc('Text to display on button')
          .addText((text) =>
            text
              .setPlaceholder('[[]]')
              .setValue(button.text)
              .onChange(async (value) => {
                button.text = value || '[[]]';
                await this.plugin.saveSettings();
                this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
                this.plugin.refreshPopup();
              })
          );
      }

      // ツールチップ
      new Setting(section)
        .setName('Tooltip')
        .setDesc('Text shown on hover')
        .addText((text) =>
          text
            .setPlaceholder('Tooltip')
            .setValue(button.tooltip)
            .onChange(async (value) => {
              button.tooltip = value || button.tooltip;
              await this.plugin.saveSettings();
              this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
            })
        );

      // キーボードショートカット
      new Setting(section)
        .setName('Keyboard shortcut')
        .setDesc('e.g., Ctrl+L, Ctrl+Shift+C')
        .addText((text) =>
          text
            .setPlaceholder('None')
            .setValue(button.hotkey || '')
            .onChange(async (value) => {
              button.hotkey = value || undefined;
              await this.plugin.saveSettings();
              this.plugin.hotkeyManager.updateHotkeys(this.plugin.settings);
            })
        );

      // 表示順序変更ボタン
      const orderSection = section.createEl('div', { cls: 'quick-popup-order-controls' });
      orderSection.style.display = 'flex';
      orderSection.style.gap = '10px';
      orderSection.style.marginTop = '10px';

      new Setting(orderSection)
        .setName('Order')
        .setDesc(`Position: ${button.order + 1}`)
        .addButton((btn) =>
          btn
            .setButtonText('↑ Move up')
            .onClick(async () => {
              await this.moveButton(button.id, -1);
            })
        )
        .addButton((btn) =>
          btn
            .setButtonText('↓ Move down')
            .onClick(async () => {
              await this.moveButton(button.id, 1);
            })
        );
    }
  }

  /**
   * ボタンの順序を変更
   */
  private async moveButton(buttonId: string, direction: number): Promise<void> {
    const buttons = (Object.values(this.plugin.settings.buttons) as ButtonConfig[])
      .sort((a, b) => a.order - b.order);

    const currentIndex = buttons.findIndex((b) => b.id === buttonId);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= buttons.length) return;

    // order値を交換
    const temp = buttons[currentIndex].order;
    buttons[currentIndex].order = buttons[newIndex].order;
    buttons[newIndex].order = temp;

    await this.plugin.saveSettings();
    this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
    this.plugin.refreshPopup();
    this.display(); // UIを再描画
  }
}
