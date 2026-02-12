/**
 * WebActions - Webブラウザビューからの操作を処理するユーティリティ
 *
 * Thino方式のデイリーノート追記、リンクノート作成などを提供
 */

interface MomentLike {
  format(fmt: string): string;
}

export class WebActions {
  /**
   * Thino方式のエントリを生成
   * フォーマット: - HH:mm テキスト
   */
  static formatThinoEntry(text: string, moment: MomentLike): string {
    const time = moment.format('HH:mm');
    return `- ${time} ${text.trim()}`;
  }

  /**
   * ファイル名として安全な文字列に変換
   */
  static sanitizeFileName(text: string): string {
    if (!text || text.trim().length === 0) return 'Untitled';

    // 最初の行のみ使用
    const firstLine = text.split('\n')[0];
    // 安全でない文字を置換
    const sanitized = firstLine.replace(/[\\/:*?"<>|]/g, '-').trim();
    // 50文字に制限
    return sanitized.substring(0, 50);
  }

  /**
   * 新規ファイルのパスを生成
   */
  static getNewFilePath(title: string, folder: string): string {
    const sanitized = this.sanitizeFileName(title);
    const cleanFolder = folder.replace(/\/+$/, '');
    if (cleanFolder) {
      return `${cleanFolder}/${sanitized}.md`;
    }
    return `${sanitized}.md`;
  }

  /**
   * デイリーノートにThino形式で追記するコンテンツを生成
   */
  static buildDailyContent(existingContent: string, text: string, moment: MomentLike): string {
    const entry = this.formatThinoEntry(text, moment);
    const trimmed = existingContent.replace(/\n+$/, '');
    return `${trimmed}\n${entry}`;
  }

  /**
   * リンクノートのコンテンツを生成
   */
  static buildNoteContent(selectedText: string, sourceUrl?: string): string {
    let content = selectedText;
    if (sourceUrl) {
      content = `${selectedText}\n\n---\nSource: ${sourceUrl}`;
    }
    return content;
  }
}
