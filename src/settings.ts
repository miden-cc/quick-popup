import { QuickPopupSettings, ButtonConfig } from './types';

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: QuickPopupSettings = {
  version: 1,
  showSeparators: true,
  buttons: {
    link: {
      id: 'link',
      enabled: true,
      displayType: 'text',
      icon: '🔗',
      text: '[[]]',
      tooltip: 'Convert to internal link',
      order: 0,
    },
    copy: {
      id: 'copy',
      enabled: true,
      displayType: 'icon',
      icon: '📋',
      text: 'Copy',
      tooltip: 'Copy path and line number',
      order: 1,
    },
    cosense: {
      id: 'cosense',
      enabled: true,
      displayType: 'icon',
      icon: '✂️',
      text: 'Cosense',
      tooltip: 'Create new note from selection (Cosense)',
      order: 2,
    },
    split: {
      id: 'split',
      enabled: true,
      displayType: 'icon',
      icon: '🧩',
      text: 'Split',
      tooltip: 'Split text into paragraphs',
      order: 3,
    },
  },
};

/**
 * ボタン設定を新しいフォーマットにマイグレーション
 */
export function migrateSettings(oldSettings: any): QuickPopupSettings {
  if (!oldSettings) {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  // ベースをデフォルト設定から作成
  const result: QuickPopupSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  // showSeparators を保持
  if (typeof oldSettings.showSeparators === 'boolean') {
    result.showSeparators = oldSettings.showSeparators;
  }

  // 既存ボタン設定をマージ
  if (oldSettings.buttons) {
    for (const [id, button] of Object.entries(oldSettings.buttons)) {
      const btn = { ...(button as any) };
      // deprecated hotkey フィールドを削除
      delete btn.hotkey;
      result.buttons[id] = btn;
    }
  }

  return result;
}
