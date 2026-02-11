/**
 * TextSplitter -- extracted from main.js for testability
 *
 * This file re-exports the TextSplitter class defined in main.js so that
 * unit tests can import it without pulling in the Obsidian runtime.
 *
 * The canonical source of truth is main.js (or its TypeScript source).
 * If TextSplitter logic changes in main.js, this file MUST be kept in sync.
 */

var TextSplitter = class {
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
  static split(text) {
    if (!text || text.trim().length === 0) return text;

    const paragraphs = [];
    let remaining = text;

    // 入力テキストが括弧で始まる場合、括弧ペアを吸収してから開始
    remaining = this.absorbLeadingBracket(remaining, paragraphs);

    while (remaining.length > 0) {
      const result = this.findSplitPoint(remaining);
      let paragraph = result.paragraph;
      remaining = result.remaining;

      // 分割後の remaining が括弧で始まる場合、括弧ペアを paragraph に吸収
      remaining = remaining.trimStart();
      while (remaining.length > 0 && (remaining[0] === "\uFF08" || remaining[0] === "(")) {
        const absorbed = this.absorbBracketPair(remaining);
        paragraph += absorbed.absorbed;
        remaining = absorbed.remaining.trimStart();
      }

      if (paragraph.trim().length > 0) {
        paragraphs.push(paragraph.trim());
      }
    }

    return paragraphs.join("\n\n");
  }

  /**
   * テキスト先頭の括弧ペアを吸収し、直前のパラグラフに付けるか保持する
   * 入力が括弧で始まる場合に使用
   */
  static absorbLeadingBracket(text, paragraphs) {
    if (text.length === 0 || (text[0] !== "\uFF08" && text[0] !== "(")) {
      return text;
    }

    const closingPos = this.findMatchingBracketClose(text, 0);
    if (closingPos === -1) return text;

    // 括弧ペアを抽出
    let bracketContent = text.substring(0, closingPos + 1);
    let remaining = text.substring(closingPos + 1);

    // 括弧直後の句点も吸収
    if (remaining.length > 0 && remaining[0] === "\u3002") {
      bracketContent += remaining[0];
      remaining = remaining.substring(1);
    }

    // 前のパラグラフがあればそこに付ける、なければダミー開始点として保持
    if (paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1] += bracketContent;
    } else {
      // 先頭が括弧の場合、次の文の先頭に括弧参照を移動
      // 次の句点までを見つけて、括弧を句点後に挿入
      remaining = remaining.trimStart();
      if (remaining.length > 0) {
        const periodIdx = remaining.indexOf("\u3002");
        if (periodIdx !== -1) {
          const insertPos = periodIdx + 1;
          remaining = remaining.substring(0, insertPos) + bracketContent + " " + remaining.substring(insertPos);
        } else {
          remaining = remaining + " " + bracketContent;
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
  static absorbBracketPair(text) {
    const closingPos = this.findMatchingBracketClose(text, 0);
    if (closingPos === -1) {
      return { absorbed: "", remaining: text };
    }

    let absorbed = text.substring(0, closingPos + 1);
    let remaining = text.substring(closingPos + 1);

    // 括弧直後の句点も吸収
    if (remaining.length > 0 && remaining[0] === "\u3002") {
      absorbed += remaining[0];
      remaining = remaining.substring(1);
    }

    return { absorbed, remaining };
  }

  /**
   * パラグラフを後処理
   * 括弧が先頭のパラグラフを前のパラグラフに統合
   * （括弧が先頭に来ないルール）
   *
   * 括弧で始まるパラグラフは常に前のパラグラフに統合される
   */
  static postProcessParagraphs(paragraphs) {
    if (paragraphs.length <= 1) {
      return paragraphs;
    }

    const processed = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const firstChar = para[0];

      // 開き括弧が先頭のみチェック
      const startsWithOpenBracket = (
        firstChar === "\uFF08" || firstChar === "("
      );

      if (startsWithOpenBracket && processed.length > 0) {
        // 括弧で始まるパラグラフは前のパラグラフに統合
        processed[processed.length - 1] += " " + para;
      } else {
        processed.push(para);
      }
    }

    return processed;
  }

  /**
   * 括弧内であるかどうかをチェック
   */
  static isInsideBracket(text, position) {
    let depth = 0;
    for (let i = 0; i < position; i++) {
      if (text[i] === "\uFF08") depth++;
      if (text[i] === "\uFF09") depth--;
    }
    return depth > 0;
  }

  /**
   * 開き括弧の直後かどうかをチェック
   * 開き括弧「（(」の直後のみ分割禁止
   * 閉じ括弧「）)」の直後は分割を許可
   */
  static isAfterOpenBracket(text, position) {
    if (position <= 0) return false;
    const prevChar = text[position - 1];
    // 開き括弧の直後のみ分割禁止
    return prevChar === "\uFF08" || prevChar === "(";
  }

  /**
   * 括弧の直前かどうかをチェック
   * 開き括弧「（(」の直前の句点では分割禁止（括弧が先頭に来るのを防ぐ）
   */
  static isBeforeBracket(text, position) {
    if (position >= text.length - 1) return false;
    const nextChar = text[position + 1];
    return nextChar === "\uFF08" || nextChar === "(";
  }

  /**
   * 対応する閉じ括弧の位置を見つける
   * @param text テキスト
   * @param openPos 開き括弧の位置
   * @returns 閉じ括弧の位置、見つからない場合は -1
   */
  static findMatchingBracketClose(text, openPos) {
    const openBracket = text[openPos];
    const closeBracket = openBracket === "\uFF08" ? "\uFF09" : ")";

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
    return -1; // マッチする閉じ括弧が見つからない
  }

  /**
   * 分割ポイントを見つける
   * @returns { paragraph: string, remaining: string }
   */
  static findSplitPoint(text) {
    // テキストが200文字以下なら分割不要
    if (text.length <= 200) {
      return { paragraph: text, remaining: "" };
    }

    // 「。」の位置をすべて収集（括弧内・開き括弧直後を除外）
    const periodPositions = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\u3002" && !this.isInsideBracket(text, i) && !this.isAfterOpenBracket(text, i)) {
        periodPositions.push(i);
      }
    }

    if (periodPositions.length >= 3) {
      // 「。」が3つ以上ある場合
      return this.splitByPeriodCount(text, periodPositions);
    }

    // 「。」が3つ未満の場合 → 文字数ベースで分割
    return this.splitByCharLimit(text, periodPositions);
  }

  /**
   * 句点カウントベースの分割
   * 3つ目の「。」の位置で分割を検討
   */
  static splitByPeriodCount(text, periodPositions) {
    const thirdPeriod = periodPositions[2]; // 3つ目の「。」

    // 3つ目の「。」が200文字以内なら、そこで分割
    if (thirdPeriod <= 200) {
      // ただし200文字以内の「。」がさらにあれば、そこまで伸ばせる
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
        remaining: text.substring(splitAt + 1).trimStart()
      };
    }

    // 3つ目の「。」が200文字超の場合
    // 2つ目の「。」で分割を検討
    if (periodPositions.length >= 2 && periodPositions[1] <= 200) {
      return {
        paragraph: text.substring(0, periodPositions[1] + 1),
        remaining: text.substring(periodPositions[1] + 1).trimStart()
      };
    }

    // それでもダメなら文字数ベースにフォールバック
    return this.splitByCharLimit(text, periodPositions);
  }

  /**
   * 文字数ベースの分割（「。」が少ない場合）
   * 優先度: 「。」 > 改行 > ？！ > 「、」
   * 括弧内・開き括弧直後は除外
   */
  static splitByCharLimit(text, periodPositions) {
    // 150文字付近から前方に向かって分割点を探す
    const searchStart = 150;
    const searchEnd = Math.min(text.length, 400); // ハード上限
    const searchRange = text.substring(searchStart, searchEnd);

    // 優先度1: 「。」（括弧内・括弧直前を除外、括弧直後は許可）
    for (let i = 0; i < searchRange.length; i++) {
      if (searchRange[i] === "\u3002") {
        const globalPos = searchStart + i;
        if (!this.isInsideBracket(text, globalPos) && !this.isBeforeBracket(text, globalPos)) {
          return {
            paragraph: text.substring(0, globalPos + 1),
            remaining: text.substring(globalPos + 1).trimStart()
          };
        }
      }
    }

    // 優先度2: 改行
    const newlineIdx = searchRange.indexOf("\n");
    if (newlineIdx !== -1) {
      const splitAt = searchStart + newlineIdx;
      return {
        paragraph: text.substring(0, splitAt),
        remaining: text.substring(splitAt + 1).trimStart()
      };
    }

    // 優先度3: ？ ！
    const questionIdx = this.findFirstOf(searchRange, ["\uFF1F", "\uFF01", "?", "!"]);
    if (questionIdx !== -1) {
      const splitAt = searchStart + questionIdx;
      return {
        paragraph: text.substring(0, splitAt + 1),
        remaining: text.substring(splitAt + 1).trimStart()
      };
    }

    // 優先度4: 「、」
    const commaIdx = searchRange.indexOf("\u3001");
    if (commaIdx !== -1) {
      const splitAt = searchStart + commaIdx;
      return {
        paragraph: text.substring(0, splitAt + 1),
        remaining: text.substring(splitAt + 1).trimStart()
      };
    }

    // 何も見つからない場合: 500文字でハードカット
    const hardLimit = Math.min(text.length, 500);
    return {
      paragraph: text.substring(0, hardLimit),
      remaining: text.substring(hardLimit).trimStart()
    };
  }

  /**
   * 複数の候補から最初に見つかった位置を返す
   */
  static findFirstOf(text, chars) {
    let earliest = -1;
    for (const char of chars) {
      const idx = text.indexOf(char);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
      }
    }
    return earliest;
  }
};

module.exports = { TextSplitter };
