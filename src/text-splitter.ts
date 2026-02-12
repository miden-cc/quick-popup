/**
 * TextSplitter - テキストを段落に分割するロジック
 */
export class TextSplitter {
  /**
   * テキストを句点ルールでパラグラフに分割
   *
   * ルール:
   * - 上限: 200文字 または 「。」が3つ のどちらか先で分割検討
   * - 例外: 「。」が3つ以上 → 200文字まで許容
   * - 文章の切れ目まで許容（200文字超でも句点・改行まで続ける）
   * - 「。」がない場合 → 改行 > ？！ > 、 の優先度で分割
   * - 括弧内の句点は分割候補から除外
   * - 括弧の直後の句点では分割しない（括弧と一緒に次ブロックへ）
   * - 括弧が先頭の場合は前ブロックに統合（スペース1つで接続）
   * - ハード上限: 400文字（句読点なしの安全弁）
   */
  static split(text: string): string {
    if (!text || text.trim().length === 0) return text;

    const paragraphs: string[] = [];
    let remaining = text;

    // 入力テキストが括弧で始まる場合、括弧ペアを吸収してから開始
    remaining = this.absorbLeadingBracket(remaining, paragraphs);

    while (remaining.length > 0) {
      const result = this.findSplitPoint(remaining);
      let paragraph = result.paragraph;
      remaining = result.remaining;

      // 分割後の remaining が括弧で始まる場合、括弧ペアを paragraph に吸収
      remaining = remaining.trimStart();
      while (remaining.length > 0 && (remaining[0] === '\uFF08' || remaining[0] === '(')) {
        const absorbed = this.absorbBracketPair(remaining);
        paragraph += absorbed.absorbed;
        remaining = absorbed.remaining.trimStart();
      }

      if (paragraph.trim().length > 0) {
        paragraphs.push(paragraph.trim());
      }
    }

    return paragraphs.join('\n\n');
  }

  /**
   * テキスト先頭の括弧ペアを吸収し、直前のパラグラフに付けるか保持する
   * 入力が括弧で始まる場合に使用
   */
  private static absorbLeadingBracket(text: string, paragraphs: string[]): string {
    if (text.length === 0 || (text[0] !== '\uFF08' && text[0] !== '(')) {
      return text;
    }

    const closingPos = this.findMatchingBracketClose(text, 0);
    if (closingPos === -1) return text;

    // 括弧ペアを抽出
    const bracketContent = text.substring(0, closingPos + 1);
    let remaining = text.substring(closingPos + 1);

    // 括弧直後の句点も吸収
    if (remaining.length > 0 && remaining[0] === '\u3002') {
      remaining = remaining.substring(1);
      // bracketContent += '\u3002'; // 元のロジックではこうなっていたが、再代入が抜けていたので修正
    }

    // 前のパラグラフがあればそこに付ける、なければダミー開始点として保持
    if (paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1] += bracketContent;
    } else {
      // 先頭が括弧の場合、次の文の先頭に括弧参照を移動
      remaining = remaining.trimStart();
      if (remaining.length > 0) {
        const periodIdx = remaining.indexOf('\u3002');
        if (periodIdx !== -1) {
          const insertPos = periodIdx + 1;
          remaining = remaining.substring(0, insertPos) + bracketContent + ' ' + remaining.substring(insertPos);
        } else {
          remaining = remaining + ' ' + bracketContent;
        }
      } else {
        paragraphs.push(bracketContent);
      }
    }

    return remaining;
  }

  /**
   * 括弧ペア（＋直後の句点）を吸収して返す
   * 分割後の remaining が括弧で始まる場合に使用
   */
  private static absorbBracketPair(text: string): { absorbed: string; remaining: string } {
    const closingPos = this.findMatchingBracketClose(text, 0);
    if (closingPos === -1) {
      return { absorbed: '', remaining: text };
    }

    let absorbed = text.substring(0, closingPos + 1);
    let remaining = text.substring(closingPos + 1);

    // 括弧直後の句点も吸収
    if (remaining.length > 0 && remaining[0] === '\u3002') {
      absorbed += remaining[0];
      remaining = remaining.substring(1);
    }

    return { absorbed, remaining };
  }

  /**
   * 括弧内であるかどうかをチェック
   */
  private static isInsideBracket(text: string, position: number): boolean {
    let depth = 0;
    for (let i = 0; i < position; i++) {
      if (text[i] === '\uFF08') depth++;
      if (text[i] === '\uFF09') depth--;
    }
    return depth > 0;
  }

  /**
   * 開き括弧の直後かどうかをチェック
   */
  private static isAfterOpenBracket(text: string, position: number): boolean {
    if (position <= 0) return false;
    const prevChar = text[position - 1];
    return prevChar === '\uFF08' || prevChar === '(';
  }

  /**
   * 括弧の直前かどうかをチェック
   */
  private static isBeforeBracket(text: string, position: number): boolean {
    if (position >= text.length - 1) return false;
    const nextChar = text[position + 1];
    return nextChar === '\uFF08' || nextChar === '(';
  }

  /**
   * 対応する閉じ括弧の位置を見つける
   */
  private static findMatchingBracketClose(text: string, openPos: number): number {
    const openBracket = text[openPos];
    const closeBracket = openBracket === '\uFF08' ? '\uFF09' : ')';

    let depth = 1;
    for (let i = openPos + 1; i < text.length; i++) {
      if (text[i] === openBracket) {
        depth++;
      } else if (text[i] === closeBracket) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * 分割ポイントを見つける
   */
  private static findSplitPoint(text: string): { paragraph: string; remaining: string } {
    if (text.length <= 200) {
      return { paragraph: text, remaining: '' };
    }

    const periodPositions: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\u3002' && !this.isInsideBracket(text, i) && !this.isAfterOpenBracket(text, i)) {
        periodPositions.push(i);
      }
    }

    if (periodPositions.length >= 3) {
      return this.splitByPeriodCount(text, periodPositions);
    }

    return this.splitByCharLimit(text, periodPositions);
  }

  /**
   * 句点カウントベースの分割
   */
  private static splitByPeriodCount(text: string, periodPositions: number[]): { paragraph: string; remaining: string } {
    const thirdPeriod = periodPositions[2];

    if (thirdPeriod <= 200) {
      let splitAt = thirdPeriod;
      for (let i = 2; i < periodPositions.length; i++) {
        if (periodPositions[i] <= 200) {
          splitAt = periodPositions[i];
        } else {
          break;
        }
      }
      return {
        paragraph: text.substring(0, splitAt + 1),
        remaining: text.substring(splitAt + 1).trimStart(),
      };
    }

    if (periodPositions.length >= 2 && periodPositions[1] <= 200) {
      return {
        paragraph: text.substring(0, periodPositions[1] + 1),
        remaining: text.substring(periodPositions[1] + 1).trimStart(),
      };
    }

    return this.splitByCharLimit(text, periodPositions);
  }

  /**
   * 文字数ベースの分割
   */
  private static splitByCharLimit(text: string, periodPositions: number[]): { paragraph: string; remaining: string } {
    const searchStart = 150;
    const searchEnd = Math.min(text.length, 400);
    const searchRange = text.substring(searchStart, searchEnd);

    for (let i = 0; i < searchRange.length; i++) {
      if (searchRange[i] === '\u3002') {
        const globalPos = searchStart + i;
        if (!this.isInsideBracket(text, globalPos) && !this.isBeforeBracket(text, globalPos)) {
          return {
            paragraph: text.substring(0, globalPos + 1),
            remaining: text.substring(globalPos + 1).trimStart(),
          };
        }
      }
    }

    const newlineIdx = searchRange.indexOf('\n');
    if (newlineIdx !== -1) {
      const splitAt = searchStart + newlineIdx;
      return {
        paragraph: text.substring(0, splitAt),
        remaining: text.substring(splitAt + 1).trimStart(),
      };
    }

    const questionIdx = this.findFirstOf(searchRange, ['\uFF1F', '\uFF01', '?', '!']);
    if (questionIdx !== -1) {
      const splitAt = searchStart + questionIdx;
      return {
        paragraph: text.substring(0, splitAt + 1),
        remaining: text.substring(splitAt + 1).trimStart(),
      };
    }

    const commaIdx = searchRange.indexOf('\u3001');
    if (commaIdx !== -1) {
      const splitAt = searchStart + commaIdx;
      return {
        paragraph: text.substring(0, splitAt + 1),
        remaining: text.substring(splitAt + 1).trimStart(),
      };
    }

    const hardLimit = Math.min(text.length, 500);
    return {
      paragraph: text.substring(0, hardLimit),
      remaining: text.substring(hardLimit).trimStart(),
    };
  }

  /**
   * 複数の候補から最初に見つかった位置を返す
   */
  private static findFirstOf(text: string, chars: string[]): number {
    let earliest = -1;
    for (const char of chars) {
      const idx = text.indexOf(char);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
      }
    }
    return earliest;
  }
}
