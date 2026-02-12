import { Editor } from 'obsidian';

/**
 * テキスト選択処理
 */
export class SelectionHandler {
  private editor: Editor | null = null;

  /**
   * エディターを設定
   */
  setEditor(editor: Editor | null): void {
    this.editor = editor;
  }

  /**
   * エディター参照をクリア（Reading View時に使用）
   */
  clearEditor(): void {
    this.editor = null;
  }

  /**
   * 選択中のテキストを取得
   */
  getSelectedText(): string {
    if (this.editor) {
      return this.editor.getSelection() || '';
    }
    // Reading View (Preview mode) の場合は window.getSelection() を使用
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }

  /**
   * 選択テキストが有効か（空白以外の文字がある）
   */
  hasValidSelection(): boolean {
    return this.getSelectedText().trim().length > 0;
  }

  /**
   * 選択範囲のハイライト(==)を切り替え
   */
  toggleHighlight(): void {
    if (!this.editor) return;

    let selectedText = this.getSelectedText();
    if (!selectedText) return;

    let newText: string;
    if (selectedText.startsWith('==') && selectedText.endsWith('==')) {
      newText = selectedText.substring(2, selectedText.length - 2);
    } else {
      newText = `==${selectedText}==`;
    }
    this.editor.replaceSelection(newText);
  }

  /**
   * 選択テキストをリンク形式に変換する（文字列処理のみ）
   */
  formatAsLink(text: string): string {
    const cleaned = text
      .replace(/\[\[/g, '')
      .replace(/\]\]/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');
    return `[[${cleaned}]]`;
  }

  /**
   * 選択テキストをプレーンテキストに変換する（文字列処理のみ）
   */
  formatAsPlain(text: string): string {
    return text
      .replace(/\[\[/g, '')
      .replace(/\]\]/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, '')
      .replace(/~~/g, '')
      .replace(/==/g, '')
      .replace(/`/g, '');
  }

  /**
   * 選択テキストを強制的に [[...]] に変換
   */
  convertToLink(): void {
    if (!this.editor) return;

    const selectedText = this.getSelectedText();
    if (!selectedText) {
      const cursor = this.editor.getCursor();
      this.editor.replaceSelection('[[]]');
      this.editor.setCursor({
        line: cursor.line,
        ch: cursor.ch + 2,
      });
      return;
    }

    this.editor.replaceSelection(this.formatAsLink(selectedText));
  }

  /**
   * 選択範囲からリンクと装飾を削除してプレーンテキストに戻す
   */
  removeFormattingAndLinks(): void {
    if (!this.editor) return;

    const selectedText = this.getSelectedText();
    if (!selectedText) return;

    this.editor.replaceSelection(this.formatAsPlain(selectedText));
  }

  /**
   * 選択範囲の矩形を取得
   */
  getSelectionRect(): DOMRect | null {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';

    if (!selectedText) return null;
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  }

  /**
   * カーソル位置の矩形を取得
   */
  getCursorRect(): DOMRect | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const dummy = document.createElement('span');
    dummy.textContent = '|';

    try {
      range.insertNode(dummy);
      const rect = dummy.getBoundingClientRect();
      dummy.remove();
      return rect;
    } catch (e) {
      return null;
    }
  }
}
