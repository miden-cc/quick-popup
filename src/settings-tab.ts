import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuickPopupSettings, ButtonConfig } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { CommandSelectorModal } from './command-selector-modal';

/**
 * プラグイン設定タブ
 */
const DEFAULT_BUTTON_IDS = Object.keys(DEFAULT_SETTINGS.buttons);

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

    // 新規ボタン追加
    new Setting(this.containerEl)
      .setName('Add new button')
      .setDesc('Add a custom button that executes an Obsidian command')
      .addButton((btn) =>
        btn.setButtonText('+').setCta().onClick(() => {
          this.openNewButtonFlow();
        })
      );
  }

  /**
   * 新規ボタン作成フロー
   */
  private openNewButtonFlow(): void {
    new CommandSelectorModal(this.app, async (command) => {
      // 新しいボタン設定を生成
      const existingButtons = Object.values(this.plugin.settings.buttons) as ButtonConfig[];
      const maxOrder = existingButtons.reduce((max, b) => Math.max(max, b.order), -1);
      const newId = `custom-${Date.now()}`;

      const newButton: ButtonConfig = {
        id: newId,
        enabled: true,
        displayType: 'text',
        icon: '',
        text: command.name.split(': ').pop() || command.name,
        tooltip: command.name,
        order: maxOrder + 1,
        commandId: command.id,
      };

      // 設定に保存
      this.plugin.settings.buttons[newId] = newButton;
      await this.plugin.saveSettings();

      // ボタン登録 (commandId で実行するアクション)
      this.plugin.registerCommandButton(newButton);
      this.plugin.refreshPopup();

      // UI再描画
      this.display();
    }).open();
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

      // コマンド表示（commandId がある場合）
      if (button.commandId) {
        const commandName = this.plugin.app.commands?.commands?.[button.commandId]?.name || button.commandId;
        new Setting(detailsDiv)
          .setName('Command')
          .setDesc(commandName)
          .addButton((btn) =>
            btn.setButtonText('Change').onClick(() => {
              new CommandSelectorModal(this.app, async (command) => {
                button.commandId = command.id;
                button.tooltip = command.name;
                await this.plugin.saveSettings();
                this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
                this.plugin.refreshPopup();
                this.display();
              }).open();
            })
          );
      }

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

      // 削除ボタン（カスタムボタンのみ）
      if (!DEFAULT_BUTTON_IDS.includes(button.id)) {
        new Setting(detailsDiv)
          .setName('Delete button')
          .setDesc('Remove this custom button permanently')
          .addButton((btn) =>
            btn
              .setButtonText('Delete')
              .setWarning()
              .onClick(async () => {
                await this.deleteButton(button.id);
              })
          );
      }
    }
  }

  /**
   * カスタムボタンを削除
   */
  private async deleteButton(buttonId: string): Promise<void> {
    if (DEFAULT_BUTTON_IDS.includes(buttonId)) return;

    delete this.plugin.settings.buttons[buttonId];
    this.plugin.buttonRegistry.unregister(buttonId);
    await this.plugin.saveSettings();
    this.plugin.refreshPopup();
    this.display();
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
