import { Plugin, Editor, MarkdownView, Notice, TFile, ItemView } from 'obsidian';
import { QuickPopupSettings, ButtonConfig, ViewContext } from './types';
import { DEFAULT_SETTINGS, migrateSettings } from './settings';
import { ButtonRegistry } from './button-registry';
import { PopupManager, PopupConfig } from './popup-manager';
import { SelectionHandler } from './selection-handler';
import { PositionCalculator } from './position-calculator';
import { QuickPopupSettingTab } from './settings-tab';
import { CommandExecutor } from './command-executor';
import { I18n } from './i18n';
import { TextSplitter } from './text-splitter';
import { WebActions } from './web-actions';

/**
 * Quick Popup プラグイン
 * テキスト選択時にポップアップを表示し、内部リンク作成、パスコピー、
 * Cosense記事作成、段落分割などの機能を提供する
 */
class QuickPopupPlugin extends Plugin {
  settings!: QuickPopupSettings;
  i18n!: I18n;
  buttonRegistry!: ButtonRegistry;
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
  private currentContext: ViewContext = 'unknown';

  /**
   * プラグイン読み込み時の初期化
   */
  async onload() {
    console.log('Loading Quick Popup plugin');

    // 1. 設定の読み込み
    await this.loadSettings();

    // 2. i18n初期化
    this.i18n = new I18n(this.settings.locale);

    // 3. マネージャーの初期化
    this.buttonRegistry = new ButtonRegistry(this);
    this.popupManager = new PopupManager(this);
    this.selectionHandler = new SelectionHandler();
    this.commandExecutor = new CommandExecutor(this.app);

    // 3. デフォルトボタンの登録
    this.registerDefaultButtons();

    // 4. コマンドベースのカスタムボタンを登録
    this.registerCommandButtons();

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

    // ハイライトボタン
    this.buttonRegistry.register(
      'highlight',
      this.settings.buttons.highlight,
      (plugin) => this.handleHighlight(plugin)
    );

    // デイリーノートボタン
    this.buttonRegistry.register(
      'dailynote',
      this.settings.buttons.dailynote,
      (plugin) => this.handleDailyNote(plugin)
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
    // コンテキストを判定
    this.currentContext = this.getViewContext();

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView) {
      // MarkdownView がある場合: エディタがあれば設定、なければ null
      this.selectionHandler.setEditor(activeView.editor as Editor);
    } else {
      // MarkdownView 以外（Webブラウザ等）: エディタなし
      this.selectionHandler.setEditor(null as any);
    }

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
   * 現在のビューコンテキストを判定
   */
  private getViewContext(): ViewContext {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      return activeView.editor ? 'editor' : 'reading';
    }
    // MarkdownView 以外のビュー（Webブラウザ等）
    const leaf = this.app.workspace.activeLeaf;
    if (leaf?.view) {
      const viewType = leaf.view.getViewType();
      // Surfing plugin: 'surfing-view', Web viewer: 'web-viewer' etc.
      if (viewType.includes('web') || viewType.includes('surfing') || viewType.includes('browser')) {
        return 'web';
      }
    }
    // window.getSelection() でテキストが取れればWebコンテキストとして扱う
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return 'web';
    }
    return 'unknown';
  }

  /**
   * ボタンアクション: 内部リンクに変換
   * - editor: editor.replaceSelection
   * - reading: vault.modify
   * - web: 選択テキスト名でノートを作成/リンク
   */
  private async handleConvertToLink(plugin: QuickPopupPlugin) {
    if (this.currentContext === 'web' || this.currentContext === 'unknown') {
      await this.handleWebLink();
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    if (activeView.editor) {
      this.selectionHandler.setEditor(activeView.editor);
      this.selectionHandler.convertToLink();
    } else {
      const file = activeView.file;
      if (!file) return;

      const selectedText = this.selectionHandler.getSelectedText();
      if (!selectedText) return;

      const linkedText = this.selectionHandler.formatAsLink(selectedText);
      const content = await this.app.vault.read(file);

      if (content.indexOf(selectedText) !== -1) {
        const newContent = content.replace(selectedText, linkedText);
        await this.app.vault.modify(file, newContent);
        new Notice(this.i18n.t('textConverted'));
      } else {
        new Notice(this.i18n.t('textNotFoundInSource'));
      }
    }
    this.popupManager.hide();
  }

  /**
   * Web用リンクアクション: 選択テキスト名でノート作成 or 既存ノートにリンク
   */
  private async handleWebLink() {
    const selectedText = this.selectionHandler.getSelectedText();
    if (!selectedText) {
      new Notice(this.i18n.t('noTextSelected'));
      return;
    }

    const title = WebActions.sanitizeFileName(selectedText);

    try {
      // デフォルトの新規ファイルフォルダを取得
      // @ts-ignore - Obsidian internal config
      const newFileFolderPath = this.app.vault.config?.newFileFolderPath || '';
      const filePath = WebActions.getNewFilePath(title, newFileFolderPath);

      // 同名ファイルが存在するかチェック
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);

      if (existingFile && existingFile instanceof TFile) {
        // 既存ファイルを開く
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(existingFile);
        new Notice(this.i18n.t('linkedExistingNote', { fileName: title }));
      } else {
        // フォルダが存在しない場合は作成
        const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
        if (folderPath) {
          const folder = this.app.vault.getAbstractFileByPath(folderPath);
          if (!folder) {
            await this.app.vault.createFolder(folderPath);
          }
        }

        // 新規ファイルを作成
        const content = WebActions.buildNoteContent(selectedText);
        const file = await this.app.vault.create(filePath, content);

        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(file);
        new Notice(this.i18n.t('createdLinkedNote', { fileName: title }));
      }
    } catch (error) {
      console.error('Failed to create linked note:', error);
      new Notice(this.i18n.t('failedToCreateNote'));
    }
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

    new Notice(this.i18n.t('copiedPath', { path: pathString }));
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
      new Notice(this.i18n.t('noTextSelected'));
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

      new Notice(this.i18n.t('createdNote', { fileName }));
      this.popupManager.hide();
    } catch (error) {
      console.error('Failed to create note:', error);
      new Notice(this.i18n.t('failedToCreateNote'));
    }
  }

  /**
   * ボタンアクション: テキストを段落に分割
   */
  private async handleSplitText(plugin: QuickPopupPlugin) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) {
      new Notice(this.i18n.t('readingViewNotSupported'));
      return;
    }

    this.selectionHandler.setEditor(activeView.editor);
    const selectedText = this.selectionHandler.getSelectedText();

    if (!selectedText) {
      new Notice(this.i18n.t('noTextSelected'));
      return;
    }

    // TextSplitterを使用してテキストを分割
    const splitText = TextSplitter.split(selectedText);

    // 分割されたテキストで置換
    activeView.editor.replaceSelection(splitText);

    new Notice(this.i18n.t('textSplit'));
    this.popupManager.hide();
  }

  /**
   * ボタンアクション: ハイライト
   * - editor: ==text== トグル
   * - web/unknown: デイリーノートにThino形式で保存
   */
  private async handleHighlight(plugin: QuickPopupPlugin) {
    if (this.currentContext === 'web' || this.currentContext === 'unknown' || this.currentContext === 'reading') {
      await this.handleWebHighlight();
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) return;

    this.selectionHandler.setEditor(activeView.editor);
    this.selectionHandler.toggleHighlight();
    this.popupManager.hide();
  }

  /**
   * Web用ハイライトアクション: 選択テキストをデイリーノートにThino形式で保存
   */
  private async handleWebHighlight() {
    const selectedText = this.selectionHandler.getSelectedText();
    if (!selectedText) {
      new Notice(this.i18n.t('noTextSelected'));
      return;
    }

    try {
      const dailyNote = await this.getOrCreateDailyNote();
      if (!dailyNote) {
        new Notice(this.i18n.t('dailyNoteNotFound'));
        return;
      }

      // @ts-ignore
      const moment = window.moment();
      const content = await this.app.vault.read(dailyNote);
      const newContent = WebActions.buildDailyContent(content, selectedText, moment);
      await this.app.vault.modify(dailyNote, newContent);

      new Notice(this.i18n.t('savedToDaily', { fileName: dailyNote.name }));
    } catch (error) {
      console.error('Failed to save highlight:', error);
      new Notice(this.i18n.t('failedToAddToDailyNote'));
    }
    this.popupManager.hide();
  }

  /**
   * ボタンアクション: デイリーノートへ送信（Thino形式）
   */
  private async handleDailyNote(plugin: QuickPopupPlugin) {
    const selectedText = this.selectionHandler.getSelectedText();
    if (!selectedText) {
      new Notice(this.i18n.t('noTextSelected'));
      return;
    }

    try {
      const dailyNote = await this.getOrCreateDailyNote();
      if (!dailyNote) {
        new Notice(this.i18n.t('dailyNoteNotFound'));
        return;
      }

      // @ts-ignore
      const moment = window.moment();
      const content = await this.app.vault.read(dailyNote);
      const newContent = WebActions.buildDailyContent(content, selectedText, moment);
      await this.app.vault.modify(dailyNote, newContent);

      new Notice(this.i18n.t('savedToDaily', { fileName: dailyNote.name }));
      this.popupManager.hide();
    } catch (error) {
      console.error('Failed to add to daily note:', error);
      new Notice(this.i18n.t('failedToAddToDailyNote'));
    }
  }

  /**
   * デイリーノートを取得または作成
   */
  private async getOrCreateDailyNote(): Promise<TFile | null> {
    try {
      // @ts-ignore
      const { getDailyNote, createDailyNote, getAllDailyNotes } = window.app.plugins?.getPlugin('daily-notes')?.instance || {};

      if (getDailyNote) {
        const dailyNotes = getAllDailyNotes();
        // @ts-ignore
        const moment = window.moment;
        const date = moment();
        let dailyNote = getDailyNote(date, dailyNotes);
        if (!dailyNote) {
          dailyNote = await createDailyNote(date);
        }
        return dailyNote;
      }

      // Daily Notes プラグインがない場合: 手動でファイルを探す/作成する
      // @ts-ignore
      const moment = window.moment;
      const format = this.settings.dailyNoteFormat || 'YYYY-MM-DD';
      const folder = this.settings.dailyNotePath || '';
      const fileName = moment().format(format) + '.md';
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile && existingFile instanceof TFile) {
        return existingFile;
      }

      // フォルダが存在しなければ作成
      if (folder) {
        const folderObj = this.app.vault.getAbstractFileByPath(folder);
        if (!folderObj) {
          await this.app.vault.createFolder(folder);
        }
      }

      const file = await this.app.vault.create(filePath, `# ${moment().format(format)}\n`);
      return file;
    } catch (error) {
      console.error('Failed to get/create daily note:', error);
      return null;
    }
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
