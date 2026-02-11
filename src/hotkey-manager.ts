import { QuickPopupSettings, ButtonConfig } from './types';

/**
 * キーボードショートカット管理
 */
export class HotkeyManager {
  private plugin: any;
  private registeredHotkeys: Map<string, string> = new Map();

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  /**
   * すべてのショートカットを登録
   */
  registerAllHotkeys(): void {
    const buttons = Object.values(this.plugin.settings.buttons) as ButtonConfig[];
    for (const button of buttons) {
      if (button.hotkey && button.enabled) {
        this.registerHotkey(button.id, button.hotkey, button.tooltip);
      }
    }
  }

  /**
   * 個別のショートカットを登録
   */
  private registerHotkey(buttonId: string, hotkeyStr: string, tooltip: string): void {
    try {
      const hotkey = this.parseHotkey(hotkeyStr);

      this.plugin.addCommand({
        id: `quick-popup-${buttonId}`,
        name: `Quick Popup: ${tooltip}`,
        hotkeys: [hotkey],
        editorCallback: async (editor: any) => {
          await this.plugin.buttonRegistry.executeAction(buttonId, editor);
        },
      });

      this.registeredHotkeys.set(buttonId, hotkeyStr);
    } catch (error) {
      console.error(`Failed to register hotkey for ${buttonId}:`, error);
    }
  }

  /**
   * ショートカット文字列をパース
   * 例: "Ctrl+L" → { modifiers: ['Ctrl'], key: 'L' }
   */
  parseHotkey(hotkeyStr: string): any {
    const parts = hotkeyStr.split('+');
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);

    // Obsidian形式に合わせる
    const normalizedModifiers = modifiers.map((m) => {
      const lower = m.toLowerCase();
      if (lower === 'ctrl') return 'Ctrl';
      if (lower === 'cmd') return 'Cmd';
      if (lower === 'alt') return 'Alt';
      if (lower === 'shift') return 'Shift';
      return m;
    });

    return {
      modifiers: normalizedModifiers,
      key: key.length === 1 ? key.toLowerCase() : key,
    };
  }

  /**
   * 設定変更時に再登録
   */
  updateHotkeys(settings: QuickPopupSettings): void {
    // 古いコマンドを削除
    for (const buttonId of this.registeredHotkeys.keys()) {
      try {
        // @ts-ignore
        delete (this.plugin.app as any).commands.commands[`quick-popup-${buttonId}`];
      } catch (e) {
        // ignoring
      }
    }
    this.registeredHotkeys.clear();

    // 新しいホットキーを登録
    const buttons = Object.values(settings.buttons) as ButtonConfig[];
    for (const button of buttons) {
      if (button.hotkey && button.enabled) {
        this.registerHotkey(button.id, button.hotkey, button.tooltip);
      }
    }
  }
}
