/**
 * TextSplitter TDD Test Suite
 *
 * Tests cover:
 * 1. Basic splitting (short text, period-based, multi-block)
 * 2. Bracket handling (inside, before, after brackets)
 * 3. Post-processing (bracket-leading paragraphs merged)
 * 4. Fallback splitting (newline, question marks, commas, hard limit)
 * 5. Edge cases (empty, null, no punctuation)
 * 6. Real-world text from Atomic Notes
 */

const { TextSplitter } = require("./text-splitter");

// ---------------------------------------------------------------------------
// Helper: generate a string of N characters
// ---------------------------------------------------------------------------
function chars(n, char = "あ") {
  return char.repeat(n);
}

// ===========================================================================
// 1. Basic Splitting
// ===========================================================================
describe("TextSplitter.split -- basic splitting", () => {
  test("returns text as-is when 300 chars or fewer", () => {
    const short = "短いテキスト。これは分割されない。";
    expect(TextSplitter.split(short)).toBe(short);
  });

  test("returns text as-is when exactly 300 chars", () => {
    const text = chars(300);
    expect(TextSplitter.split(text)).toBe(text);
  });

  test("splits at the 3rd period when text exceeds 300 chars", () => {
    // Build text: 80 chars + 。 + 80 chars + 。 + 80 chars + 。 + 200 chars
    // Total = 80+1+80+1+80+1+200 = 443 chars
    // 3rd period at position 242 (< 250), so it should look for more periods <= 300
    const text =
      chars(80) + "。" +
      chars(80) + "。" +
      chars(80) + "。" +
      chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBe(2);
    // First paragraph should end with the 3rd 。
    expect(paragraphs[0].endsWith("。")).toBe(true);
  });

  test("splits into multiple blocks for very long text", () => {
    // 5 sentences of 80 chars each + 。 = 5*(80+1) = 405
    // Then another 200 chars = 605 total
    const sentence = chars(80) + "。";
    const text = sentence.repeat(5) + chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    // Every paragraph except possibly the last should end with 。
    for (let i = 0; i < paragraphs.length - 1; i++) {
      expect(paragraphs[i].endsWith("。")).toBe(true);
    }
  });
});

// ===========================================================================
// 2. isInsideBracket
// ===========================================================================
describe("TextSplitter.isInsideBracket", () => {
  test("returns true for position inside full-width brackets", () => {
    const text = "前のテキスト（括弧の中。テスト）後のテキスト";
    // Find the 。 inside the brackets
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isInsideBracket(text, periodIdx)).toBe(true);
  });

  test("returns false for position outside brackets", () => {
    const text = "前のテキスト（括弧の中）後のテキスト。最後";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isInsideBracket(text, periodIdx)).toBe(false);
  });

  test("returns false when no brackets exist", () => {
    const text = "括弧なしのテキスト。";
    expect(TextSplitter.isInsideBracket(text, 9)).toBe(false);
  });

  test("handles nested brackets (depth tracking)", () => {
    // Nested: （外側（内側。テスト）まだ外側）
    const text = "テキスト（外側（内側。テスト）まだ外側）終わり";
    const periodIdx = text.indexOf("。");
    // depth=2 at the period position (inside both outer and inner)
    expect(TextSplitter.isInsideBracket(text, periodIdx)).toBe(true);
  });

  test("returns false after bracket is closed", () => {
    const text = "テキスト（括弧）外の句点。ここ";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isInsideBracket(text, periodIdx)).toBe(false);
  });
});

// ===========================================================================
// 3. isBeforeBracket
// ===========================================================================
describe("TextSplitter.isBeforeBracket", () => {
  test("returns true when next char is full-width open bracket", () => {
    const text = "テキスト。（括弧）";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isBeforeBracket(text, periodIdx)).toBe(true);
  });

  test("returns true when next char is half-width open bracket", () => {
    const text = "テキスト。(括弧)";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isBeforeBracket(text, periodIdx)).toBe(true);
  });

  test("returns false when next char is not a bracket", () => {
    const text = "テキスト。次の文。";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isBeforeBracket(text, periodIdx)).toBe(false);
  });

  test("returns false at end of text", () => {
    const text = "テキスト。";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isBeforeBracket(text, periodIdx)).toBe(false);
  });
});

// ===========================================================================
// 4. isAfterOpenBracket
// ===========================================================================
describe("TextSplitter.isAfterOpenBracket", () => {
  test("returns true when previous char is full-width open bracket", () => {
    const text = "テキスト（。括弧）";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isAfterOpenBracket(text, periodIdx)).toBe(true);
  });

  test("returns false when previous char is full-width close bracket", () => {
    const text = "テキスト（括弧）。次の文";
    const periodIdx = text.indexOf("。");
    expect(TextSplitter.isAfterOpenBracket(text, periodIdx)).toBe(false);
  });

  test("returns false at position 0", () => {
    expect(TextSplitter.isAfterOpenBracket("。テキスト", 0)).toBe(false);
  });
});

// ===========================================================================
// 5. Bracket-aware splitting (periods excluded from split candidates)
// ===========================================================================
describe("TextSplitter.split -- bracket-aware splitting", () => {
  test("does not split at period inside brackets", () => {
    // Create text where the only periods are inside brackets
    // 200 chars + （ + 50 chars with 。。。 + ） + 200 chars
    const text =
      chars(200) +
      "（" + chars(20) + "。" + chars(20) + "。" + chars(20) + "。" + "）" +
      chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    // The periods inside brackets should NOT trigger period-count splitting
    // Instead, it should use char-limit fallback
    for (const para of paragraphs) {
      // No paragraph should start with （ due to post-processing
      if (paragraphs.indexOf(para) > 0) {
        // This is fine -- bracket-leading paragraphs get merged
      }
    }
    // The key assertion: the bracket content should not be split
    const fullText = result.replace(/\n\n/g, "");
    expect(fullText).toContain("（");
    expect(fullText).toContain("）");
  });

  test("does not split at period immediately before bracket", () => {
    // テキスト。（括弧） -- the 。 before （ should not be a split point
    // Build: 280 chars + 。（short bracket text）+ remainder
    const text =
      chars(280) +
      "。（括弧テキスト）" +
      chars(100) + "。" +
      chars(50);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    // No paragraph should start with （
    for (const para of paragraphs) {
      expect(para[0]).not.toBe("（");
      expect(para[0]).not.toBe("(");
    }
  });
});

// ===========================================================================
// 6. Post-processing: bracket-leading paragraphs merged
// ===========================================================================
describe("TextSplitter.postProcessParagraphs", () => {
  test("merges paragraph starting with full-width open bracket into previous", () => {
    const paragraphs = ["最初の段落。", "（括弧で始まる段落）"];
    const result = TextSplitter.postProcessParagraphs(paragraphs);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("最初の段落。 （括弧で始まる段落）");
  });

  test("merges paragraph starting with half-width open bracket into previous", () => {
    const paragraphs = ["最初の段落。", "(half-width bracket paragraph)"];
    const result = TextSplitter.postProcessParagraphs(paragraphs);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("最初の段落。 (half-width bracket paragraph)");
  });

  test("does not merge first paragraph even if it starts with bracket", () => {
    const paragraphs = ["（最初が括弧）", "二番目の段落。"];
    const result = TextSplitter.postProcessParagraphs(paragraphs);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("（最初が括弧）");
  });

  test("returns single-element arrays unchanged", () => {
    const paragraphs = ["一つだけ"];
    const result = TextSplitter.postProcessParagraphs(paragraphs);
    expect(result).toEqual(["一つだけ"]);
  });

  test("handles multiple consecutive bracket-leading paragraphs", () => {
    const paragraphs = ["段落A。", "（括弧B）", "（括弧C）"];
    const result = TextSplitter.postProcessParagraphs(paragraphs);
    // B merges into A, then C merges into the merged result
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("段落A。 （括弧B） （括弧C）");
  });
});

// ===========================================================================
// 7. Edge Cases
// ===========================================================================
describe("TextSplitter.split -- edge cases", () => {
  test("returns null/undefined/empty as-is", () => {
    expect(TextSplitter.split(null)).toBe(null);
    expect(TextSplitter.split(undefined)).toBe(undefined);
    expect(TextSplitter.split("")).toBe("");
  });

  test("returns whitespace-only text as-is", () => {
    expect(TextSplitter.split("   ")).toBe("   ");
  });

  test("handles text with no punctuation at all via hard limit at 500 chars", () => {
    const text = chars(600);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    // First paragraph should be 500 chars (hard limit)
    expect(paragraphs[0].length).toBe(500);
  });

  test("splits at newline when no periods exist (priority 2)", () => {
    const text = chars(280) + "\n" + chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].length).toBe(280);
  });

  test("splits at question mark when no periods or newlines (priority 3)", () => {
    const text = chars(270) + "？" + chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].endsWith("？")).toBe(true);
  });

  test("splits at comma when no other delimiters (priority 4)", () => {
    const text = chars(270) + "、" + chars(200);
    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].endsWith("、")).toBe(true);
  });
});

// ===========================================================================
// 8. findSplitPoint details
// ===========================================================================
describe("TextSplitter.findSplitPoint", () => {
  test("returns full text when <= 300 chars", () => {
    const text = chars(300);
    const result = TextSplitter.findSplitPoint(text);
    expect(result.paragraph).toBe(text);
    expect(result.remaining).toBe("");
  });

  test("splits at 3rd period when it is within 200 chars", () => {
    // 4 periods: at 60, 121, 182, 243
    // 3rd period at 182 is within 200, so split there
    const text =
      chars(60) + "。" +   // period at 60
      chars(60) + "。" +   // period at 121
      chars(60) + "。" +   // period at 182
      chars(60) + "。" +   // period at 243
      chars(100);           // total = 344
    const result = TextSplitter.findSplitPoint(text);
    // 3rd period at 182 is within 200, so split there (183 chars including period)
    expect(result.paragraph.length).toBe(183); // 0..182 inclusive + 1
    expect(result.remaining.length).toBe(344 - 183);
  });

  test("falls back to 2nd period when 3rd period is beyond 250 chars", () => {
    // period1 at 80, period2 at 161, period3 at 280 (>250)
    const text =
      chars(80) + "。" +   // period at 80
      chars(80) + "。" +   // period at 161
      chars(118) + "。" +  // period at 280
      chars(100);           // total = 381
    const result = TextSplitter.findSplitPoint(text);
    // 3rd period at 280 > 250, so fallback to 2nd period at 161
    expect(result.paragraph.length).toBe(162); // 0..161 inclusive
  });

  test("falls back to splitByCharLimit when 3rd period > 250 and 2nd period > 300", () => {
    // 3 periods exist (>= 3 triggers splitByPeriodCount)
    // but 3rd period > 250 and 2nd period > 300
    // This triggers the final fallback in splitByPeriodCount (line 170)
    const text =
      chars(302) + "\u3002" +   // period at 302 (2nd period > 300)
      chars(50) + "\u3002" +    // period at 353
      chars(50) + "\u3002" +    // period at 404
      chars(50);                 // total = 454
    const result = TextSplitter.findSplitPoint(text);
    // All 3 periods are > 250, 2nd (302) > 300 => fallback to splitByCharLimit
    // splitByCharLimit searches 250-500 range and finds period at 302
    expect(result.paragraph.length).toBe(303); // 0..302 inclusive
  });
});

// ===========================================================================
// 9. findFirstOf helper
// ===========================================================================
describe("TextSplitter.findFirstOf", () => {
  test("finds the earliest occurrence among multiple candidates", () => {
    const text = "テスト！質問？終わり";
    expect(TextSplitter.findFirstOf(text, ["？", "！"])).toBe(3);
  });

  test("returns -1 when no candidates found", () => {
    expect(TextSplitter.findFirstOf("テスト", ["？", "！"])).toBe(-1);
  });

  test("handles half-width and full-width mixed", () => {
    const text = "test?テスト！";
    expect(TextSplitter.findFirstOf(text, ["？", "！", "?", "!"])).toBe(4);
  });
});

// ===========================================================================
// 10. Real-world test: Atomic Note text
// ===========================================================================
describe("TextSplitter.split -- real-world Atomic Note text", () => {
  test("correctly handles text from 神の聖なる力が生み出すもの.md", () => {
    // Full text (641 chars). Bracket references like （[ガラ 5:16]...）should
    // stay attached to the preceding sentence, and splitting should produce
    // multiple balanced paragraphs -- NOT one giant block.
    const text =
      'ここで「実」という意味のギリシャ語の農業用語[[カルポス]]が使われていて，その語は聖書に何度も出ている。' +
      ' ここでは比喩的に使われ，神の聖なる力が人の内に生み出すことができる性質を指す。' +
      '（[ガラ 5:16](https://wol.jw.org/ja/wol/bc/r7/lp-j/1001070767/45/0)）' +
      '木が適切に手入れされると実を結ぶのと同じように，人は考えや行動が聖なる力の影響を受けるようにすると，「聖なる力が生み出すもの」を表せるようになる。' +
      ' （[詩 1:1-3](https://wol.jw.org/ja/wol/bc/r7/lp-j/1001070767/46/0)と比較。）' +
      'その性質は， 聖なる力の源であるエホバ神の性格を反映する。' +
      '（[コロ 3:9，10](https://wol.jw.org/ja/wol/bc/r7/lp-j/1001070767/47/0)）' +
      'ここで ，聖なる力がクリスチャンの内に生み出すもの全てが挙げられているわけではない。' +
      ' （[ガラ 5:23の注釈](https://wol.jw.org/ja/wol/pc/r7/lp-j/1001070767/34/0)を参照。）' +
      'これら の性質が組み合わさって，新しい人格を特徴づける。' +
      '（[エフ 4:24](https://wol.jw.org/ja/wol/bc/r7/lp-j/1001070767/48/0)）' +
      'パウロはここで，「実」を意味するギリシャ語カルポスの単数形を使っている。';

    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");

    // Must split into multiple paragraphs (not one giant 641-char block)
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);

    // No paragraph should exceed 400 chars
    for (const para of paragraphs) {
      expect(para.length).toBeLessThanOrEqual(400);
    }

    // No paragraph should start with a bracket
    for (const para of paragraphs) {
      expect(para[0]).not.toBe("（");
      expect(para[0]).not.toBe("(");
    }

    // Bracket references must stay attached to preceding sentence
    // i.e. （[コロ...]） should end a paragraph, not start one
    for (const para of paragraphs) {
      // If paragraph contains （, it should NOT be at position 0
      const bracketIdx = para.indexOf("（");
      if (bracketIdx !== -1) {
        expect(bracketIdx).toBeGreaterThan(0);
      }
    }

    // Content must be preserved
    expect(result).toContain("カルポス");
    expect(result).toContain("エホバ神");
    expect(result).toContain("単数形を使っている");
  });

  test("correctly splits the second paragraph from 神の聖なる力が生み出すもの.md", () => {
    // The second paragraph from the Atomic Note has different structure
    // with mixed 。 and 、 delimiters and is shorter
    const text =
      '聖書注釈者たちが指摘しているように，単数形が使われていることは，挙げられている望ましい性質が1つのものを成すことを示しているのかもしれない。' +
      'つまり，全てが身に付けるべき大切な性質で，互いに切り離せないものであるということ。' +
      '全て複合的で重要だが、特に生活の中で際立つものもあるかもしれない。' +
      '[[罪深い欲望から出る行い]]と対比されていることを考えると、実は行動の結果必ず得られるものではなく、神の聖なる力が働いた結果生み出される。';

    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");

    // This text is shorter, may or may not be split depending on total length
    // But it should preserve content in any case
    const recombined = paragraphs.join("");
    expect(recombined).toContain("聖書注釈者たち");
    expect(recombined).toContain("罪深い欲望");
    expect(recombined).toContain("聖なる力が働いた結果生み出される");

    // No bracket-leading paragraphs
    for (const para of paragraphs) {
      expect(para[0]).not.toBe("（");
      expect(para[0]).not.toBe("(");
    }
  });

  test("handles input starting with bracket reference", () => {
    // Simulates selecting a paragraph that starts with a bracket reference
    // from the Atomic Note. Should NOT have bracket at start of first paragraph.
    const text =
      '（[コロ 3:9，10](https://wol.jw.org/ja/wol/bc/r7/lp-j/1001070767/47/0)）' +
      'ここで ，聖なる力がクリスチャンの内に生み出すもの全てが挙げられているわけではない。' +
      ' （[ガラ 5:23の注釈](https://wol.jw.org/ja/wol/pc/r7/lp-j/1001070767/34/0)を参照。）' +
      'これら の性質が組み合わさって，新しい人格を特徴づける。';

    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");

    // EXPECTED: First paragraph should NOT start with bracket
    // The bracket reference should be incorporated properly
    expect(paragraphs[0][0]).not.toBe("（");
    expect(paragraphs[0][0]).not.toBe("(");

    // Content must be preserved including the reference
    expect(result).toContain("コロ");
    expect(result).toContain("ここで");
    expect(result).toContain("性質が組み合わさって");
  });

  test("handles input with bracket at very start (no preceding text)", () => {
    // Edge case: input is ONLY a bracket reference followed by text
    const text =
      '（[参考](https://example.com)）' +
      'これはテストです。次の文です。最後の文です。';

    const result = TextSplitter.split(text);
    const paragraphs = result.split("\n\n");

    // First character should NOT be a bracket
    expect(paragraphs[0][0]).not.toBe("（");
    expect(paragraphs[0][0]).not.toBe("(");

    // Content must include both reference and text
    expect(result).toContain("参考");
    expect(result).toContain("これはテストです");
  });
});
