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

    const buttons = (Object.values(this.plugin.settings.buttons) as ButtonConfig[])
      .sort((a, b) => a.order - b.order);

    for (const button of buttons) {
      this.displayButtonSection(button);
    }
  }

  /**
   * ボタンセクションを表示（折りたたみ可能）
   */
  private displayButtonSection(button: ButtonConfig): void {
    const containerDiv = this.containerEl.createEl('div', {
      cls: 'quick-popup-button-container',
    });
    containerDiv.style.marginBottom = '8px';
    containerDiv.style.borderBottom = '1px solid var(--divider-color)';

    // ヘッダー行（ボタン名 + ON/OFF）
    const headerDiv = containerDiv.createEl('div', {
      cls: 'quick-popup-button-header',
    });
    headerDiv.style.display = 'flex';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.padding = '12px 0';
    headerDiv.style.cursor = 'pointer';
    headerDiv.style.userSelect = 'none';

    // ドラッグハンドル
    const dragHandle = headerDiv.createEl('span', { text: '☰' });
    dragHandle.style.marginRight = '12px';
    dragHandle.style.cursor = 'grab';
    dragHandle.style.opacity = '0.6';
    dragHandle.style.fontSize = '16px';

    // ボタン名
    const nameSpan = headerDiv.createEl('span', { text: button.tooltip });
    nameSpan.style.flex = '1';
    nameSpan.style.fontWeight = '500';

    // ON/OFF トグル
    const toggleContainer = headerDiv.createEl('div');
    const toggleSetting = new Setting(toggleContainer);
    toggleSetting.addToggle((toggle) =>
      toggle
        .setValue(button.enabled)
        .onChange(async (value) => {
          button.enabled = value;
          await this.plugin.saveSettings();
          this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
          this.plugin.refreshPopup();
          this.display();
        })
    );
    toggleSetting.settingEl.style.border = 'none';
    toggleSetting.settingEl.style.padding = '0';

    // 詳細設定セクション（デフォルトは隠す）
    const detailsDiv = containerDiv.createEl('div', {
      cls: 'quick-popup-button-details',
    });
    detailsDiv.style.display = 'none';
    detailsDiv.style.paddingLeft = '32px';
    detailsDiv.style.paddingBottom = '12px';

    let isExpanded = false;

    // ヘッダークリックで展開/折りたたみ
    headerDiv.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.setting-item')) return;
      isExpanded = !isExpanded;
      detailsDiv.style.display = isExpanded ? 'block' : 'none';
      dragHandle.style.opacity = isExpanded ? '1' : '0.6';
    });

    // 詳細設定
    if (button.enabled) {
      // 表示タイプ
      new Setting(detailsDiv)
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
              this.display();
            })
        );

      // アイコン
      if (button.displayType === 'icon') {
        new Setting(detailsDiv)
          .setName('Icon')
          .setDesc('Emoji or character')
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

      // テキスト
      if (button.displayType === 'text') {
        new Setting(detailsDiv)
          .setName('Label')
          .setDesc('Text to display')
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
      new Setting(detailsDiv)
        .setName('Tooltip')
        .setDesc('Hover text')
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

      // ショートカット
      new Setting(detailsDiv)
        .setName('Keyboard shortcut')
        .setDesc('e.g., Ctrl+L')
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

      // 移動ボタン
      new Setting(detailsDiv)
        .setName('Order')
        .setDesc(`Position: ${button.order + 1}`)
        .addButton((btn) =>
          btn.setButtonText('↑').onClick(async () => {
            await this.moveButton(button.id, -1);
          })
        )
        .addButton((btn) =>
          btn.setButtonText('↓').onClick(async () => {
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
