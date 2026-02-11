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
      hotkey: undefined,
    },
    copy: {
      id: 'copy',
      enabled: true,
      displayType: 'icon',
      icon: '📋',
      text: 'Copy',
      tooltip: 'Copy path and line number',
      order: 1,
      hotkey: 'Ctrl+C',
    },
    cosense: {
      id: 'cosense',
      enabled: true,
      displayType: 'icon',
      icon: '✂️',
      text: 'Cosense',
      tooltip: 'Create new note from selection (Cosense)',
      order: 2,
      hotkey: undefined,
    },
    split: {
      id: 'split',
      enabled: true,
      displayType: 'icon',
      icon: '🧩',
      text: 'Split',
      tooltip: 'Split text into paragraphs',
      order: 3,
      hotkey: undefined,
    },
  },
};

/**
 * ボタン設定を新しいフォーマットにマイグレーション
 */
export function migrateSettings(oldSettings: any): QuickPopupSettings {
  if (oldSettings.version === 1) {
    return oldSettings;
  }

  // デフォルト設定で初期化
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
