import { ButtonConfig, RegisteredButton, QuickPopupSettings } from './types';
import { Editor } from 'obsidian';

/**
 * ボタン登録・管理システム
 */
export class ButtonRegistry {
  private buttons: Map<string, RegisteredButton> = new Map();
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  /**
   * ボタンを登録
   */
  register(
    id: string,
    config: ButtonConfig,
    action: (plugin: any) => void | Promise<void>
  ): void {
    this.buttons.set(id, { config, action });
  }

  /**
   * 有効なボタンをorder順で取得
   */
  getEnabledButtons(): RegisteredButton[] {
    return Array.from(this.buttons.values())
      .filter((btn) => btn.config.enabled)
      .sort((a, b) => a.config.order - b.config.order);
  }

  /**
   * 全ボタン（有効/無効問わず）をorder順で取得
   */
  getAllButtons(): RegisteredButton[] {
    return Array.from(this.buttons.values()).sort(
      (a, b) => a.config.order - b.config.order
    );
  }

  /**
   * ボタンアクションを実行
   */
  async executeAction(id: string, editor: Editor): Promise<void> {
    const button = this.buttons.get(id);
    if (button) {
      await Promise.resolve(button.action(this.plugin));
    }
  }

  /**
   * 設定変更時に更新
   */
  updateConfigs(settings: QuickPopupSettings): void {
    for (const [id, button] of this.buttons.entries()) {
      if (settings.buttons[id]) {
        button.config = { ...button.config, ...settings.buttons[id] };
      }
    }
  }

  /**
   * 特定のボタン設定を取得
   */
  getButtonConfig(id: string): ButtonConfig | undefined {
    return this.buttons.get(id)?.config;
  }
}
