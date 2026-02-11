import { Plugin, Editor, MarkdownView, Notice, TFile } from 'obsidian';
import { QuickPopupSettings, ButtonConfig } from './types';
import { DEFAULT_SETTINGS, migrateSettings } from './settings';
import { ButtonRegistry } from './button-registry';
import { HotkeyManager } from './hotkey-manager';
import { PopupManager, PopupConfig } from './popup-manager';
import { SelectionHandler } from './selection-handler';
import { PositionCalculator } from './position-calculator';
import { QuickPopupSettingTab } from './settings-tab';
import { CommandExecutor } from './command-executor';

/**
 * Quick Popup プラグイン
 * テキスト選択時にポップアップを表示し、内部リンク作成、パスコピー、
 * Cosense記事作成、段落分割などの機能を提供する
 */
class QuickPopupPlugin extends Plugin {
  settings!: QuickPopupSettings;
  buttonRegistry!: ButtonRegistry;
  hotkeyManager!: HotkeyManager;
  popupManager!: PopupManager;
  selectionHandler!: SelectionHandler;
  commandExecutor!: CommandExecutor;

  private selectionTimeout: NodeJS.Timeout | null = null;
  private isComposing = false;
  private boundMouseUpHandler!: (e: MouseEvent) => void;
  private boundKeyUpHandler!: (e: KeyboardEvent) => void;
  private boundCompositionStartHandler!: () => void;
  private boundCompositionEndHandler!: () => void;
  private boundScrollHandler!: () => void;
  private boundResizeHandler!: () => void;

  /**
   * プラグイン読み込み時の初期化
   */
  async onload() {
    console.log('Loading Quick Popup plugin');

    // 1. 設定の読み込み
    await this.loadSettings();

    // 2. マネージャーの初期化
    this.buttonRegistry = new ButtonRegistry(this);
    this.hotkeyManager = new HotkeyManager(this);
    this.popupManager = new PopupManager(this);
    this.selectionHandler = new SelectionHandler();
    this.commandExecutor = new CommandExecutor(this.app);

    // 3. デフォルトボタンの登録
    this.registerDefaultButtons();

    // 4. コマンドベースのカスタムボタンを登録
    this.registerCommandButtons();

    // 5. ホットキーの登録
    this.hotkeyManager.registerAllHotkeys();

    // 5. 設定タブの登録
    this.addSettingTab(new QuickPopupSettingTab(this.app, this));

    // 6. イベントハンドラーの登録
    this.registerEventHandlers();
  }

  /**
   * プラグインアンロード時のクリーンアップ
   */
  onunload() {
    console.log('Unloading Quick Popup plugin');
    this.popupManager.hide();
    this.removeEventHandlers();
  }

  /**
   * デフォルトボタンの登録
   */
  private registerDefaultButtons() {
    // 内部リンクボタン
    this.buttonRegistry.register(
      'link',
      this.settings.buttons.link,
      (plugin) => this.handleConvertToLink(plugin)
    );

    // パスコピーボタン
    this.buttonRegistry.register(
      'copy',
      this.settings.buttons.copy,
      (plugin) => this.handleCopyPath(plugin)
    );

    // Cosenseボタン
    this.buttonRegistry.register(
      'cosense',
      this.settings.buttons.cosense,
      (plugin) => this.handleCosense(plugin)
    );

    // 分割ボタン
    this.buttonRegistry.register(
      'split',
      this.settings.buttons.split,
      (plugin) => this.handleSplitText(plugin)
    );
  }

  /**
   * コマンドベースのカスタムボタンを一括登録
   */
  private registerCommandButtons() {
    const buttons = Object.values(this.settings.buttons) as ButtonConfig[];
    for (const button of buttons) {
      if (button.commandId) {
        this.registerCommandButton(button);
      }
    }
  }

  /**
   * コマンドベースのボタンを1つ登録
   */
  registerCommandButton(button: ButtonConfig) {
    if (!button.commandId) return;

    this.buttonRegistry.register(
      button.id,
      button,
      () => {
        this.commandExecutor.execute(button.commandId!);
        this.popupManager.hide();
      }
    );
  }

  /**
   * イベントハンドラーの登録
   */
  private registerEventHandlers() {
    // イベントハンドラーをbindして保存（削除時に必要）
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);
    this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    this.boundCompositionStartHandler = this.handleCompositionStart.bind(this);
    this.boundCompositionEndHandler = this.handleCompositionEnd.bind(this);
    this.boundScrollHandler = this.handleScroll.bind(this);
    this.boundResizeHandler = this.handleResize.bind(this);

    // documentレベルのイベント
    document.addEventListener('mouseup', this.boundMouseUpHandler);
    document.addEventListener('keyup', this.boundKeyUpHandler);
    document.addEventListener('compositionstart', this.boundCompositionStartHandler);
    document.addEventListener('compositionend', this.boundCompositionEndHandler);
    window.addEventListener('scroll', this.boundScrollHandler, true);
    window.addEventListener('resize', this.boundResizeHandler);

    // Obsidianワークスペースイベント
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.popupManager.hide();
      })
    );
  }

  /**
   * イベントハンドラーの削除
   */
  private removeEventHandlers() {
    document.removeEventListener('mouseup', this.boundMouseUpHandler);
    document.removeEventListener('keyup', this.boundKeyUpHandler);
    document.removeEventListener('compositionstart', this.boundCompositionStartHandler);
    document.removeEventListener('compositionend', this.boundCompositionEndHandler);
    window.removeEventListener('scroll', this.boundScrollHandler, true);
    window.removeEventListener('resize', this.boundResizeHandler);
  }

  /**
   * マウスアップイベント処理（テキスト選択検出）
   */
  private handleMouseUp(event: MouseEvent) {
    if (this.isComposing) return;

    // ポップアップ内のクリックは無視
    const target = event.target as HTMLElement;
    if (target.closest(`.${PopupConfig.POPUP_CLASS}`)) {
      return;
    }

    // 既存のタイムアウトをクリア
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    // 遅延処理（150ms）
    this.selectionTimeout = setTimeout(() => {
      this.checkSelection();
    }, PopupConfig.SELECTION_CHECK_DELAY);
  }

  /**
   * キーアップイベント処理
   */
  private handleKeyUp(event: KeyboardEvent) {
    // Escapeキーでポップアップを閉じる
    if (event.key === 'Escape') {
      this.popupManager.hide();
      return;
    }

    // IME入力中は無視
    if (this.isComposing) return;

    // Ctrl+C（コピー）は処理しない（システムデフォルト動作）
    if (event.ctrlKey && event.key === 'c') {
      return;
    }

    // ナビゲーションキーは無視
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'];
    if (navigationKeys.includes(event.key)) {
      return;
    }

    // その他のキー操作時は選択をチェック
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    this.selectionTimeout = setTimeout(() => {
      this.checkSelection();
    }, PopupConfig.SELECTION_CHECK_DELAY);
  }

  /**
   * IME入力開始
   */
  private handleCompositionStart() {
    this.isComposing = true;
    this.popupManager.hide();
  }

  /**
   * IME入力終了
   */
  private handleCompositionEnd() {
    this.isComposing = false;
  }

  /**
   * スクロールイベント処理
   */
  private handleScroll() {
    if (this.popupManager.exists()) {
      this.updatePopupPosition();
    }
  }

  /**
   * リサイズイベント処理
   */
  private handleResize() {
    if (this.popupManager.exists()) {
      this.updatePopupPosition();
    }
  }

  /**
   * 選択テキストをチェックしてポップアップ表示
   */
  private checkSelection() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) {
      this.popupManager.hide();
      return;
    }

    this.selectionHandler.setEditor(activeView.editor);

    if (!this.selectionHandler.hasValidSelection()) {
      this.popupManager.hide();
      return;
    }

    const selectionRect = this.selectionHandler.getSelectionRect();
    if (!selectionRect) {
      this.popupManager.hide();
      return;
    }

    // ポップアップを作成
    this.popupManager.create();
    this.popupManager.show();

    // 位置を計算して設定
    const popupElement = this.popupManager.getElement();
    if (popupElement) {
      const popupRect = popupElement.getBoundingClientRect();
      const position = PositionCalculator.calculate(selectionRect, popupRect);
      this.popupManager.position(position);
    }
  }

  /**
   * ポップアップ位置を更新
   */
  private updatePopupPosition() {
    const selectionRect = this.selectionHandler.getSelectionRect();
    if (!selectionRect) {
      this.popupManager.hide();
      return;
    }

    const popupElement = this.popupManager.getElement();
    if (popupElement) {
      const popupRect = popupElement.getBoundingClientRect();
      const position = PositionCalculator.calculate(selectionRect, popupRect);
      this.popupManager.position(position);
    }
  }

  /**
   * ボタンアクション: 内部リンクに変換
   */
  private async handleConvertToLink(plugin: QuickPopupPlugin) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) return;

    this.selectionHandler.setEditor(activeView.editor);
    this.selectionHandler.convertToLink();
    this.popupManager.hide();
  }

  /**
   * ボタンアクション: パスと行番号をコピー
   */
  private async handleCopyPath(plugin: QuickPopupPlugin) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) return;

    const file = activeView.file;
    if (!file) return;

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const filePath = file.path;
    const lineNumber = cursor.line + 1;

    const pathString = `@${filePath}:${lineNumber}`;
    await navigator.clipboard.writeText(pathString);

    new Notice(`Copied: ${pathString}`);
    this.popupManager.hide();
  }

  /**
   * ボタンアクション: Cosense（新規ノート作成）
   */
  private async handleCosense(plugin: QuickPopupPlugin) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) return;

    this.selectionHandler.setEditor(activeView.editor);
    const selectedText = this.selectionHandler.getSelectedText();

    if (!selectedText) {
      new Notice('No text selected');
      return;
    }

    // タイトルは最初の行または最初の50文字
    const lines = selectedText.split('\n');
    const title = lines[0].substring(0, 50).trim();

    // ファイル名として安全な文字列に変換
    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '-');

    try {
      // 新規ファイルを作成
      const fileName = `${sanitizedTitle}.md`;
      const file = await this.app.vault.create(fileName, selectedText);

      // 新しいファイルを開く
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(file);

      new Notice(`Created note: ${fileName}`);
      this.popupManager.hide();
    } catch (error) {
      console.error('Failed to create note:', error);
      new Notice('Failed to create note');
    }
  }

  /**
   * ボタンアクション: テキストを段落に分割
   */
  private async handleSplitText(plugin: QuickPopupPlugin) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) return;

    this.selectionHandler.setEditor(activeView.editor);
    const selectedText = this.selectionHandler.getSelectedText();

    if (!selectedText) {
      new Notice('No text selected');
      return;
    }

    // TextSplitterを使用してテキストを分割
    const TextSplitter = require('../text-splitter').TextSplitter;
    const splitText = TextSplitter.split(selectedText);

    // 分割されたテキストで置換
    activeView.editor.replaceSelection(splitText);

    new Notice('Text split into paragraphs');
    this.popupManager.hide();
  }

  /**
   * 設定を読み込み
   */
  async loadSettings() {
    const loadedSettings = await this.loadData();
    this.settings = migrateSettings(loadedSettings || {});
  }

  /**
   * 設定を保存
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * ポップアップを再構築（設定変更時）
   */
  refreshPopup() {
    this.buttonRegistry.updateConfigs(this.settings);
    this.popupManager.refresh();
  }
}

module.exports = QuickPopupPlugin;
module.exports.default = QuickPopupPlugin;
