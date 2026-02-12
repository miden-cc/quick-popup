/**
 * i18n - 多言語対応
 */

export type Locale = 'en' | 'ja';

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Settings UI
    globalSettings: 'Global Settings',
    buttonSettings: 'Button Settings',
    showSeparators: 'Show separators',
    showSeparatorsDesc: 'Display | separators between buttons',
    addNewButton: 'Add new button',
    addNewButtonDesc: 'Add a custom button that executes an Obsidian command',
    displayType: 'Display type',
    displayTypeDesc: 'Show as icon or text',
    iconOnly: 'Icon only',
    textOnly: 'Text only',
    icon: 'Icon',
    iconDesc: 'Emoji or character',
    label: 'Label',
    labelDesc: 'Text to display',
    tooltip: 'Tooltip',
    tooltipDesc: 'Hover text',
    command: 'Command',
    change: 'Change',
    order: 'Order',
    position: 'Position: {{n}}',
    deleteButton: 'Delete button',
    deleteButtonDesc: 'Remove this custom button permanently',
    delete: 'Delete',
    language: 'Language',
    languageDesc: 'Plugin UI language',

    // Daily Note Settings
    dailyNoteSettings: 'Daily Note Settings',
    dailyNotePath: 'Daily note folder',
    dailyNotePathDesc: 'Path to store daily notes (e.g., "Daily")',
    dailyNoteFormat: 'Filename format',
    dailyNoteFormatDesc: 'Moment.js format (e.g., "YYYY-MM-DD")',

    // Notices
    copiedPath: 'Copied: {{path}}',
    noTextSelected: 'No text selected',
    createdNote: 'Created note: {{fileName}}',
    failedToCreateNote: 'Failed to create note',
    textSplit: 'Text split into paragraphs',
    readingViewNotSupported: 'This action is not supported in Reading View yet',
    addedToDailyNote: 'Added to daily note: {{fileName}}',
    failedToAddToDailyNote: 'Failed to add to daily note',
    textConverted: 'Text converted to link',
    textNotFoundInSource: 'Selected text not found in source file',
    savedToDaily: 'Saved to daily note: {{fileName}}',
    createdLinkedNote: 'Created linked note: {{fileName}}',
    linkedExistingNote: 'Linked to existing note: {{fileName}}',
    dailyNoteNotFound: 'Daily note could not be found or created',

    // Command selector
    selectCommand: 'Select command',
    searchCommands: 'Search commands...',
    noMatchingCommands: 'No matching commands',
  },
  ja: {
    // 設定UI
    globalSettings: '全体設定',
    buttonSettings: 'ボタン設定',
    showSeparators: 'セパレータを表示',
    showSeparatorsDesc: 'ボタン間に | セパレータを表示する',
    addNewButton: 'ボタンを追加',
    addNewButtonDesc: 'Obsidianコマンドを実行するカスタムボタンを追加',
    displayType: '表示タイプ',
    displayTypeDesc: 'アイコンまたはテキストで表示',
    iconOnly: 'アイコンのみ',
    textOnly: 'テキストのみ',
    icon: 'アイコン',
    iconDesc: '絵文字または文字',
    label: 'ラベル',
    labelDesc: '表示するテキスト',
    tooltip: 'ツールチップ',
    tooltipDesc: 'ホバー時のテキスト',
    command: 'コマンド',
    change: '変更',
    order: '並び順',
    position: '位置: {{n}}',
    deleteButton: 'ボタンを削除',
    deleteButtonDesc: 'このカスタムボタンを完全に削除する',
    delete: '削除',
    language: '言語',
    languageDesc: 'プラグインUIの言語',

    // デイリーノート設定
    dailyNoteSettings: 'デイリーノート設定',
    dailyNotePath: '保存先フォルダ',
    dailyNotePathDesc: 'デイリーノートを保存するフォルダ (例: "Daily")',
    dailyNoteFormat: 'ファイル名フォーマット',
    dailyNoteFormatDesc: 'Moment.js 形式 (例: "YYYY-MM-DD")',

    // 通知
    copiedPath: 'コピー済み: {{path}}',
    noTextSelected: 'テキストが選択されていません',
    createdNote: 'ノート作成: {{fileName}}',
    failedToCreateNote: 'ノートの作成に失敗しました',
    textSplit: 'テキストを段落に分割しました',
    readingViewNotSupported: 'このアクションは閲覧モードではまだサポートされていません',
    addedToDailyNote: 'デイリーノートに追加しました: {{fileName}}',
    failedToAddToDailyNote: 'デイリーノートへの追加に失敗しました',
    textConverted: 'リンクに変換しました',
    textNotFoundInSource: '選択したテキストがソースファイル内で見つかりませんでした',
    savedToDaily: 'デイリーノートに保存しました: {{fileName}}',
    createdLinkedNote: 'リンクノートを作成しました: {{fileName}}',
    linkedExistingNote: '既存ノートにリンクしました: {{fileName}}',
    dailyNoteNotFound: 'デイリーノートが見つからないか作成できません',

    // コマンドセレクター
    selectCommand: 'コマンドを選択',
    searchCommands: 'コマンドを検索...',
    noMatchingCommands: '該当するコマンドがありません',
  },
} as const;

export class I18n {
  private locale: Locale;

  constructor(locale: Locale | string) {
    this.locale = locale in translations ? (locale as Locale) : 'en';
  }

  setLocale(locale: Locale | string): void {
    this.locale = locale in translations ? (locale as Locale) : 'en';
  }

  t(key: TranslationKey, vars?: Record<string, string>): string {
    const str = translations[this.locale]?.[key] ?? (key as string);
    if (!vars) return str;
    return Object.entries(vars).reduce(
      (result: string, [k, v]) => result.replace(`{{${k}}}`, v),
      str
    );
  }
}
