import { Editor } from 'obsidian';

/**
 * テキスト選択処理
 */
export class SelectionHandler {
  private editor: Editor | null = null;

  /**
   * エディターを設定
   */
  setEditor(editor: Editor): void {
    this.editor = editor;
  }

  /**
   * 選択中のテキストを取得
   */
  getSelectedText(): string {
    return this.editor?.getSelection() || '';
  }

  /**
   * 選択テキストが有効か（空白以外の文字がある）
   */
  hasValidSelection(): boolean {
    return this.getSelectedText().trim().length > 0;
  }

  /**
   * 選択テキストを強制的に [[...]] に変換
   */
  convertToLink(): void {
    if (!this.editor) return;

    let selectedText = this.getSelectedText();
    if (!selectedText) {
      const cursor = this.editor.getCursor();
      this.editor.replaceSelection('[[]]');
      this.editor.setCursor({
        line: cursor.line,
        ch: cursor.ch + 2,
      });
      return;
    }

    selectedText = selectedText
      .replace(/\[\[/g, '')
      .replace(/\]\]/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    const linkedText = `[[${selectedText}]]`;
    this.editor.replaceSelection(linkedText);
  }

  /**
   * 選択範囲からリンクと装飾を削除してプレーンテキストに戻す
   */
  removeFormattingAndLinks(): void {
    if (!this.editor) return;

    let selectedText = this.getSelectedText();
    if (!selectedText) return;

    selectedText = selectedText
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

    this.editor.replaceSelection(selectedText);
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
