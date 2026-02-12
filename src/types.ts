/**
 * ボタン設定インターフェース
 */
export interface ButtonConfig {
  id: string;                    // 'link', 'copy', 'cosense', 'split'
  enabled: boolean;              // オン/オフ
  displayType: 'icon' | 'text';  // アイコンまたはテキスト
  icon: string;                  // 絵文字（例: '📋'）
  text: string;                  // テキストラベル（例: '[[]]'）
  tooltip: string;               // ツールチップ
  order: number;                 // 表示順序（0-based）
  commandId?: string;            // Obsidian コマンドID（例: 'editor:fold'）
}

/**
 * Obsidian コマンド情報
 */
export interface ObsidianCommand {
  id: string;        // "editor:fold"
  name: string;      // "Editor: Fold"
  icon?: string;     // アイコン（存在する場合）
}

/**
 * プラグイン全体の設定
 */
export interface QuickPopupSettings {
  version: number;                           // 設定フォーマットバージョン
  buttons: { [key: string]: ButtonConfig };  // ボタン設定（キー: button id）
  showSeparators: boolean;                   // セパレータ表示フラグ
  locale: 'en' | 'ja';                       // UI言語
  dailyNotePath?: string;                    // デイリーノートの保存先パス
  dailyNoteFormat?: string;                  // デイリーノートのファイル名フォーマット
}

/**
 * ボタン登録情報
 */
export interface RegisteredButton {
  config: ButtonConfig;
  action: (plugin: any) => void | Promise<void>;
}

/**
 * ビューコンテキスト
 * ポップアップがどの画面で表示されているかを識別する
 */
export type ViewContext = 'editor' | 'reading' | 'web' | 'unknown';

/**
 * ポップアップ位置情報
 */
export interface PopupPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}
