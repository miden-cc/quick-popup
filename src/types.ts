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
  hotkey?: string;               // ショートカット（例: 'Ctrl+L'）
}

/**
 * プラグイン全体の設定
 */
export interface QuickPopupSettings {
  version: number;                           // 設定フォーマットバージョン
  buttons: { [key: string]: ButtonConfig };  // ボタン設定（キー: button id）
  showSeparators: boolean;                   // セパレータ表示フラグ
}

/**
 * ボタン登録情報
 */
export interface RegisteredButton {
  config: ButtonConfig;
  action: (plugin: any) => void | Promise<void>;
}

/**
 * ポップアップ位置情報
 */
export interface PopupPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}
