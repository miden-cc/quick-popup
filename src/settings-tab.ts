import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuickPopupSettings, ButtonConfig } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { I18n } from './i18n';
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

  private get i18n(): I18n {
    return this.plugin.i18n;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // グローバル設定
    this.displayGlobalSettings();

    // デイリーノート設定
    this.displayDailyNoteSettings();

    // ボタン設定
    this.displayButtonSettings();
  }

  /**
   * グローバル設定を表示
   */
  private displayGlobalSettings(): void {
    this.containerEl.createEl('h2', { text: this.i18n.t('globalSettings') });

    // 言語設定
    new Setting(this.containerEl)
      .setName(this.i18n.t('language'))
      .setDesc(this.i18n.t('languageDesc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('en', 'English')
          .addOption('ja', '日本語')
          .setValue(this.plugin.settings.locale)
          .onChange(async (value) => {
            this.plugin.settings.locale = value as 'en' | 'ja';
            this.plugin.i18n.setLocale(value);
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(this.containerEl)
      .setName(this.i18n.t('showSeparators'))
      .setDesc(this.i18n.t('showSeparatorsDesc'))
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
   * デイリーノート設定を表示
   */
  private displayDailyNoteSettings(): void {
    this.containerEl.createEl('h2', { text: this.i18n.t('dailyNoteSettings') });

    new Setting(this.containerEl)
      .setName(this.i18n.t('dailyNotePath'))
      .setDesc(this.i18n.t('dailyNotePathDesc'))
      .addText((text) =>
        text
          .setPlaceholder('Daily')
          .setValue(this.plugin.settings.dailyNotePath || '')
          .onChange(async (value) => {
            this.plugin.settings.dailyNotePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(this.containerEl)
      .setName(this.i18n.t('dailyNoteFormat'))
      .setDesc(this.i18n.t('dailyNoteFormatDesc'))
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.dailyNoteFormat || '')
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFormat = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * ボタン設定を表示
   */
  private displayButtonSettings(): void {
    this.containerEl.createEl('h2', { text: this.i18n.t('buttonSettings') });

    const buttons = (Object.values(this.plugin.settings.buttons) as ButtonConfig[])
      .sort((a, b) => a.order - b.order);

    for (const button of buttons) {
      this.displayButtonSection(button);
    }

    // 新規ボタン追加
    new Setting(this.containerEl)
      .setName(this.i18n.t('addNewButton'))
      .setDesc(this.i18n.t('addNewButtonDesc'))
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
    }, this.i18n).open();
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
        .setName(this.i18n.t('displayType'))
        .setDesc(this.i18n.t('displayTypeDesc'))
        .addDropdown((dropdown) =>
          dropdown
            .addOption('icon', this.i18n.t('iconOnly'))
            .addOption('text', this.i18n.t('textOnly'))
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
          .setName(this.i18n.t('icon'))
          .setDesc(this.i18n.t('iconDesc'))
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
          .setName(this.i18n.t('label'))
          .setDesc(this.i18n.t('labelDesc'))
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
        .setName(this.i18n.t('tooltip'))
        .setDesc(this.i18n.t('tooltipDesc'))
        .addText((text) =>
          text
            .setPlaceholder(this.i18n.t('tooltip'))
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
          .setName(this.i18n.t('command'))
          .setDesc(commandName)
          .addButton((btn) =>
            btn.setButtonText(this.i18n.t('change')).onClick(() => {
              new CommandSelectorModal(this.app, async (command) => {
                button.commandId = command.id;
                button.tooltip = command.name;
                await this.plugin.saveSettings();
                this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
                this.plugin.refreshPopup();
                this.display();
              }, this.i18n).open();
            })
          );
      }

      // 移動ボタン
      new Setting(detailsDiv)
        .setName(this.i18n.t('order'))
        .setDesc(this.i18n.t('position', { n: String(button.order + 1) }))
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
          .setName(this.i18n.t('deleteButton'))
          .setDesc(this.i18n.t('deleteButtonDesc'))
          .addButton((btn) =>
            btn
              .setButtonText(this.i18n.t('delete'))
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
    this.display();
  }
}
