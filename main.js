"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// text-splitter.js
var require_text_splitter = __commonJS({
  "text-splitter.js"(exports2, module2) {
    "use strict";
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
        if (!text || text.trim().length === 0)
          return text;
        const paragraphs = [];
        let remaining = text;
        remaining = this.absorbLeadingBracket(remaining, paragraphs);
        while (remaining.length > 0) {
          const result = this.findSplitPoint(remaining);
          let paragraph = result.paragraph;
          remaining = result.remaining;
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
        if (text.length === 0 || text[0] !== "\uFF08" && text[0] !== "(") {
          return text;
        }
        const closingPos = this.findMatchingBracketClose(text, 0);
        if (closingPos === -1)
          return text;
        let bracketContent = text.substring(0, closingPos + 1);
        let remaining = text.substring(closingPos + 1);
        if (remaining.length > 0 && remaining[0] === "\u3002") {
          bracketContent += remaining[0];
          remaining = remaining.substring(1);
        }
        if (paragraphs.length > 0) {
          paragraphs[paragraphs.length - 1] += bracketContent;
        } else {
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
          const startsWithOpenBracket = firstChar === "\uFF08" || firstChar === "(";
          if (startsWithOpenBracket && processed.length > 0) {
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
          if (text[i] === "\uFF08")
            depth++;
          if (text[i] === "\uFF09")
            depth--;
        }
        return depth > 0;
      }
      /**
       * 開き括弧の直後かどうかをチェック
       * 開き括弧「（(」の直後のみ分割禁止
       * 閉じ括弧「）)」の直後は分割を許可
       */
      static isAfterOpenBracket(text, position) {
        if (position <= 0)
          return false;
        const prevChar = text[position - 1];
        return prevChar === "\uFF08" || prevChar === "(";
      }
      /**
       * 括弧の直前かどうかをチェック
       * 開き括弧「（(」の直前の句点では分割禁止（括弧が先頭に来るのを防ぐ）
       */
      static isBeforeBracket(text, position) {
        if (position >= text.length - 1)
          return false;
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
        return -1;
      }
      /**
       * 分割ポイントを見つける
       * @returns { paragraph: string, remaining: string }
       */
      static findSplitPoint(text) {
        if (text.length <= 200) {
          return { paragraph: text, remaining: "" };
        }
        const periodPositions = [];
        for (let i = 0; i < text.length; i++) {
          if (text[i] === "\u3002" && !this.isInsideBracket(text, i) && !this.isAfterOpenBracket(text, i)) {
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
       * 3つ目の「。」の位置で分割を検討
       */
      static splitByPeriodCount(text, periodPositions) {
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
            remaining: text.substring(splitAt + 1).trimStart()
          };
        }
        if (periodPositions.length >= 2 && periodPositions[1] <= 200) {
          return {
            paragraph: text.substring(0, periodPositions[1] + 1),
            remaining: text.substring(periodPositions[1] + 1).trimStart()
          };
        }
        return this.splitByCharLimit(text, periodPositions);
      }
      /**
       * 文字数ベースの分割（「。」が少ない場合）
       * 優先度: 「。」 > 改行 > ？！ > 「、」
       * 括弧内・開き括弧直後は除外
       */
      static splitByCharLimit(text, periodPositions) {
        const searchStart = 150;
        const searchEnd = Math.min(text.length, 400);
        const searchRange = text.substring(searchStart, searchEnd);
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
        const newlineIdx = searchRange.indexOf("\n");
        if (newlineIdx !== -1) {
          const splitAt = searchStart + newlineIdx;
          return {
            paragraph: text.substring(0, splitAt),
            remaining: text.substring(splitAt + 1).trimStart()
          };
        }
        const questionIdx = this.findFirstOf(searchRange, ["\uFF1F", "\uFF01", "?", "!"]);
        if (questionIdx !== -1) {
          const splitAt = searchStart + questionIdx;
          return {
            paragraph: text.substring(0, splitAt + 1),
            remaining: text.substring(splitAt + 1).trimStart()
          };
        }
        const commaIdx = searchRange.indexOf("\u3001");
        if (commaIdx !== -1) {
          const splitAt = searchStart + commaIdx;
          return {
            paragraph: text.substring(0, splitAt + 1),
            remaining: text.substring(splitAt + 1).trimStart()
          };
        }
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
    module2.exports = { TextSplitter };
  }
});

// src/main.ts
var import_obsidian3 = require("obsidian");

// src/settings.ts
var DEFAULT_SETTINGS = {
  version: 1,
  showSeparators: true,
  buttons: {
    link: {
      id: "link",
      enabled: true,
      displayType: "text",
      icon: "\u{1F517}",
      text: "[[]]",
      tooltip: "Convert to internal link",
      order: 0,
      hotkey: void 0
    },
    copy: {
      id: "copy",
      enabled: true,
      displayType: "icon",
      icon: "\u{1F4CB}",
      text: "Copy",
      tooltip: "Copy path and line number",
      order: 1,
      hotkey: "Ctrl+C"
    },
    cosense: {
      id: "cosense",
      enabled: true,
      displayType: "icon",
      icon: "\u2702\uFE0F",
      text: "Cosense",
      tooltip: "Create new note from selection (Cosense)",
      order: 2,
      hotkey: void 0
    },
    split: {
      id: "split",
      enabled: true,
      displayType: "icon",
      icon: "\u{1F9E9}",
      text: "Split",
      tooltip: "Split text into paragraphs",
      order: 3,
      hotkey: void 0
    }
  }
};
function migrateSettings(oldSettings) {
  if (oldSettings.version === 1) {
    return oldSettings;
  }
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

// src/button-registry.ts
var ButtonRegistry = class {
  constructor(plugin) {
    this.buttons = /* @__PURE__ */ new Map();
    this.plugin = plugin;
  }
  /**
   * ボタンを登録
   */
  register(id, config, action) {
    this.buttons.set(id, { config, action });
  }
  /**
   * 有効なボタンをorder順で取得
   */
  getEnabledButtons() {
    return Array.from(this.buttons.values()).filter((btn) => btn.config.enabled).sort((a, b) => a.config.order - b.config.order);
  }
  /**
   * 全ボタン（有効/無効問わず）をorder順で取得
   */
  getAllButtons() {
    return Array.from(this.buttons.values()).sort(
      (a, b) => a.config.order - b.config.order
    );
  }
  /**
   * ボタンアクションを実行
   */
  async executeAction(id, editor) {
    const button = this.buttons.get(id);
    if (button) {
      await Promise.resolve(button.action(this.plugin));
    }
  }
  /**
   * 設定変更時に更新
   */
  updateConfigs(settings) {
    for (const [id, button] of this.buttons.entries()) {
      if (settings.buttons[id]) {
        button.config = { ...button.config, ...settings.buttons[id] };
      }
    }
  }
  /**
   * 特定のボタン設定を取得
   */
  getButtonConfig(id) {
    return this.buttons.get(id)?.config;
  }
};

// src/hotkey-manager.ts
var HotkeyManager = class {
  constructor(plugin) {
    this.registeredHotkeys = /* @__PURE__ */ new Map();
    this.plugin = plugin;
  }
  /**
   * すべてのショートカットを登録
   */
  registerAllHotkeys() {
    const buttons = Object.values(this.plugin.settings.buttons);
    for (const button of buttons) {
      if (button.hotkey && button.enabled) {
        this.registerHotkey(button.id, button.hotkey, button.tooltip);
      }
    }
  }
  /**
   * 個別のショートカットを登録
   */
  registerHotkey(buttonId, hotkeyStr, tooltip) {
    try {
      const hotkey = this.parseHotkey(hotkeyStr);
      this.plugin.addCommand({
        id: `quick-popup-${buttonId}`,
        name: `Quick Popup: ${tooltip}`,
        hotkeys: [hotkey],
        editorCallback: async (editor) => {
          await this.plugin.buttonRegistry.executeAction(buttonId, editor);
        }
      });
      this.registeredHotkeys.set(buttonId, hotkeyStr);
    } catch (error) {
      console.error(`Failed to register hotkey for ${buttonId}:`, error);
    }
  }
  /**
   * ショートカット文字列をパース
   * 例: "Ctrl+L" → { modifiers: ['Ctrl'], key: 'L' }
   */
  parseHotkey(hotkeyStr) {
    const parts = hotkeyStr.split("+");
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);
    const normalizedModifiers = modifiers.map((m) => {
      const lower = m.toLowerCase();
      if (lower === "ctrl")
        return "Ctrl";
      if (lower === "cmd")
        return "Cmd";
      if (lower === "alt")
        return "Alt";
      if (lower === "shift")
        return "Shift";
      return m;
    });
    return {
      modifiers: normalizedModifiers,
      key: key.length === 1 ? key.toLowerCase() : key
    };
  }
  /**
   * 設定変更時に再登録
   */
  updateHotkeys(settings) {
    for (const buttonId of this.registeredHotkeys.keys()) {
      try {
        delete this.plugin.app.commands.commands[`quick-popup-${buttonId}`];
      } catch (e) {
      }
    }
    this.registeredHotkeys.clear();
    const buttons = Object.values(settings.buttons);
    for (const button of buttons) {
      if (button.hotkey && button.enabled) {
        this.registerHotkey(button.id, button.hotkey, button.tooltip);
      }
    }
  }
};

// src/popup-manager.ts
var PopupConfig = class _PopupConfig {
  static {
    this.TAIL_SIZE = 6;
  }
  static {
    this.POPUP_MARGIN = 10;
  }
  static {
    this.TOTAL_OFFSET = _PopupConfig.TAIL_SIZE + _PopupConfig.POPUP_MARGIN;
  }
  static {
    this.SCREEN_MARGIN = 10;
  }
  static {
    this.SELECTION_CHECK_DELAY = 150;
  }
  static {
    this.DEBUG = false;
  }
  static {
    this.POPUP_CLASS = "text-selection-linker-popup";
  }
  static {
    this.BUTTON_CLASS = "text-selection-linker-button";
  }
  static {
    this.SHOW_CLASS = "show";
  }
  static {
    this.PLACEMENT_TOP_CLASS = "popup-top";
  }
  static {
    this.PLACEMENT_BOTTOM_CLASS = "popup-bottom";
  }
};
var PopupManager = class {
  constructor(plugin) {
    this.popup = null;
    this.plugin = plugin;
  }
  /**
   * ポップアップ要素を作成
   */
  create() {
    const popup = document.createElement("div");
    popup.className = PopupConfig.POPUP_CLASS;
    const enabledButtons = this.plugin.buttonRegistry.getEnabledButtons();
    enabledButtons.forEach((registeredButton, index) => {
      const buttonEl = this.createButton(registeredButton);
      popup.appendChild(buttonEl);
      if (this.plugin.settings.showSeparators && index < enabledButtons.length - 1) {
        popup.appendChild(this.createSeparator());
      }
    });
    this.popup = popup;
  }
  /**
   * ボタン要素を作成
   */
  createButton(registeredButton) {
    const { config } = registeredButton;
    const button = document.createElement("button");
    button.className = PopupConfig.BUTTON_CLASS;
    button.title = config.tooltip;
    if (config.displayType === "icon") {
      button.innerHTML = config.icon;
    } else {
      button.textContent = config.text;
    }
    button.addEventListener("click", async () => {
      const activeView = this.plugin.app.workspace.getActiveViewOfType(
        // @ts-ignore
        this.plugin.MarkdownView || (await import("obsidian")).MarkdownView
      );
      if (activeView?.editor) {
        await this.plugin.buttonRegistry.executeAction(config.id, activeView.editor);
      }
    });
    return button;
  }
  /**
   * セパレータを作成
   */
  createSeparator() {
    const sep = document.createElement("span");
    sep.className = "text-selection-linker-separator";
    sep.textContent = "|";
    return sep;
  }
  /**
   * ポップアップを表示（アニメーション付き）
   */
  show() {
    if (!this.popup)
      return;
    document.body.appendChild(this.popup);
    requestAnimationFrame(() => {
      this.popup?.classList.add(PopupConfig.SHOW_CLASS);
    });
  }
  /**
   * ポップアップを非表示
   */
  hide() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }
  /**
   * ポップアップの位置を設定
   */
  position(pos) {
    if (!this.popup)
      return;
    this.popup.classList.remove(
      PopupConfig.PLACEMENT_TOP_CLASS,
      PopupConfig.PLACEMENT_BOTTOM_CLASS
    );
    this.popup.classList.add(`popup-${pos.placement}`);
    this.popup.style.top = `${pos.top}px`;
    this.popup.style.left = `${pos.left}px`;
  }
  /**
   * ポップアップ要素を取得
   */
  getElement() {
    return this.popup;
  }
  /**
   * ポップアップが存在するか
   */
  exists() {
    return this.popup !== null;
  }
  /**
   * ポップアップを更新（設定変更時）
   */
  refresh() {
    const wasVisible = this.exists();
    const position = wasVisible && this.popup ? {
      top: parseFloat(this.popup.style.top),
      left: parseFloat(this.popup.style.left),
      placement: this.popup.classList.contains(PopupConfig.PLACEMENT_TOP_CLASS) ? "top" : "bottom"
    } : null;
    this.hide();
    if (wasVisible) {
      this.create();
      this.show();
      if (position) {
        this.position(position);
      }
    }
  }
};

// src/selection-handler.ts
var SelectionHandler = class {
  constructor() {
    this.editor = null;
  }
  /**
   * エディターを設定
   */
  setEditor(editor) {
    this.editor = editor;
  }
  /**
   * 選択中のテキストを取得
   */
  getSelectedText() {
    return this.editor?.getSelection() || "";
  }
  /**
   * 選択テキストが有効か（空白以外の文字がある）
   */
  hasValidSelection() {
    return this.getSelectedText().trim().length > 0;
  }
  /**
   * 選択テキストを強制的に [[...]] に変換
   */
  convertToLink() {
    if (!this.editor)
      return;
    let selectedText = this.getSelectedText();
    if (!selectedText) {
      const cursor = this.editor.getCursor();
      this.editor.replaceSelection("[[]]");
      this.editor.setCursor({
        line: cursor.line,
        ch: cursor.ch + 2
      });
      return;
    }
    selectedText = selectedText.replace(/\[\[/g, "").replace(/\]\]/g, "").replace(/\[/g, "").replace(/\]/g, "");
    const linkedText = `[[${selectedText}]]`;
    this.editor.replaceSelection(linkedText);
  }
  /**
   * 選択範囲からリンクと装飾を削除してプレーンテキストに戻す
   */
  removeFormattingAndLinks() {
    if (!this.editor)
      return;
    let selectedText = this.getSelectedText();
    if (!selectedText)
      return;
    selectedText = selectedText.replace(/\[\[/g, "").replace(/\]\]/g, "").replace(/\[/g, "").replace(/\]/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "").replace(/_/g, "").replace(/~~/g, "").replace(/==/g, "").replace(/`/g, "");
    this.editor.replaceSelection(selectedText);
  }
  /**
   * 選択範囲の矩形を取得
   */
  getSelectionRect() {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (!selectedText)
      return null;
    if (!selection || selection.rangeCount === 0)
      return null;
    const range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  }
  /**
   * カーソル位置の矩形を取得
   */
  getCursorRect() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
      return null;
    const range = selection.getRangeAt(0);
    const dummy = document.createElement("span");
    dummy.textContent = "|";
    try {
      range.insertNode(dummy);
      const rect = dummy.getBoundingClientRect();
      dummy.remove();
      return rect;
    } catch (e) {
      return null;
    }
  }
};

// src/position-calculator.ts
var PositionCalculator = class {
  /**
   * 選択テキストと重ならない位置を計算
   */
  static calculate(selectionRect, popupRect) {
    const left = this.calculateHorizontalPosition(selectionRect, popupRect);
    const { top, placement } = this.calculateVerticalPosition(selectionRect, popupRect);
    if (PopupConfig.DEBUG) {
      this.logPositionDebug(selectionRect, popupRect, { top, left, placement });
    }
    if (this.hasCollision(selectionRect, { top, left, placement }, popupRect)) {
      console.warn("\u26A0\uFE0F Collision detected! Forcing safe position.");
      return this.forceSafePosition(selectionRect, popupRect);
    }
    return { top, left, placement };
  }
  /**
   * 水平方向の位置を計算（画面端を考慮）
   */
  static calculateHorizontalPosition(selectionRect, popupRect) {
    const centerAligned = selectionRect.left + selectionRect.width / 2 - popupRect.width / 2;
    return this.clampToHorizontalBounds(centerAligned, popupRect.width);
  }
  /**
   * 垂直方向の位置を計算（デフォルト：選択範囲の上）
   */
  static calculateVerticalPosition(selectionRect, popupRect) {
    const viewportHeight = window.innerHeight;
    const selectionTop = selectionRect.top;
    const selectionBottom = selectionRect.bottom;
    const topPlacement = selectionTop - popupRect.height - PopupConfig.TOTAL_OFFSET;
    if (topPlacement >= PopupConfig.SCREEN_MARGIN) {
      return { top: topPlacement, placement: "top" };
    }
    const bottomPlacement = selectionBottom + PopupConfig.TOTAL_OFFSET;
    const popupBottom = bottomPlacement + popupRect.height;
    if (popupBottom <= viewportHeight - PopupConfig.SCREEN_MARGIN) {
      return { top: bottomPlacement, placement: "bottom" };
    }
    const spaceAbove = selectionTop - PopupConfig.SCREEN_MARGIN;
    const spaceBelow = viewportHeight - selectionBottom - PopupConfig.SCREEN_MARGIN;
    if (spaceAbove >= spaceBelow) {
      return {
        top: Math.max(PopupConfig.SCREEN_MARGIN, topPlacement),
        placement: "top"
      };
    } else {
      return {
        top: Math.min(
          viewportHeight - popupRect.height - PopupConfig.SCREEN_MARGIN,
          bottomPlacement
        ),
        placement: "bottom"
      };
    }
  }
  /**
   * 水平方向の境界内に収める
   */
  static clampToHorizontalBounds(left, popupWidth) {
    const minLeft = PopupConfig.SCREEN_MARGIN;
    const maxLeft = window.innerWidth - popupWidth - PopupConfig.SCREEN_MARGIN;
    return Math.max(minLeft, Math.min(left, maxLeft));
  }
  /**
   * 衝突チェック（ポップアップと選択範囲が重なっているか）
   */
  static hasCollision(selectionRect, position, popupRect) {
    const popupTop = position.top;
    const popupBottom = position.top + popupRect.height;
    const popupLeft = position.left;
    const popupRight = position.left + popupRect.width;
    const selectionTop = selectionRect.top;
    const selectionBottom = selectionRect.bottom;
    const selectionLeft = selectionRect.left;
    const selectionRight = selectionRect.right;
    const verticalOverlap = !(popupBottom < selectionTop || popupTop > selectionBottom);
    const horizontalOverlap = !(popupRight < selectionLeft || popupLeft > selectionRight);
    return verticalOverlap && horizontalOverlap;
  }
  /**
   * 安全な位置を強制的に計算（衝突が検出された場合）
   */
  static forceSafePosition(selectionRect, popupRect) {
    const viewportHeight = window.innerHeight;
    let top = selectionRect.top - popupRect.height - PopupConfig.TOTAL_OFFSET;
    let placement = "top";
    if (top < PopupConfig.SCREEN_MARGIN) {
      top = selectionRect.bottom + PopupConfig.TOTAL_OFFSET;
      placement = "bottom";
      if (top + popupRect.height > viewportHeight - PopupConfig.SCREEN_MARGIN) {
        top = Math.max(
          PopupConfig.SCREEN_MARGIN,
          viewportHeight - popupRect.height - PopupConfig.SCREEN_MARGIN
        );
      }
    }
    const left = this.calculateHorizontalPosition(selectionRect, popupRect);
    return { top, left, placement };
  }
  /**
   * デバッグ情報をログ出力
   */
  static logPositionDebug(selectionRect, popupRect, position) {
    console.group("\u{1F50D} Position Debug");
    console.log("Selection:", {
      top: selectionRect.top,
      bottom: selectionRect.bottom,
      left: selectionRect.left,
      right: selectionRect.right,
      height: selectionRect.height,
      width: selectionRect.width
    });
    console.log("Popup:", {
      top: position.top,
      bottom: position.top + popupRect.height,
      left: position.left,
      right: position.left + popupRect.width,
      height: popupRect.height,
      width: popupRect.width
    });
    console.log("Gap:", {
      vertical: position.top - selectionRect.bottom,
      margin: PopupConfig.POPUP_MARGIN
    });
    console.groupEnd();
  }
};

// src/settings-tab.ts
var import_obsidian2 = require("obsidian");

// src/command-selector-modal.ts
var import_obsidian = require("obsidian");
var CommandSelectorModal = class extends import_obsidian.Modal {
  constructor(app, onSelect) {
    super(app);
    this.searchQuery = "";
    this.selectedIndex = 0;
    this.filteredCommands = [];
    this.onSelect = onSelect;
  }
  /**
   * 全 Obsidian コマンドを取得
   */
  getAllCommands() {
    const commands = this.app.commands.listCommands();
    return commands.map((cmd) => ({
      id: cmd.id,
      name: cmd.name,
      icon: cmd.icon
    }));
  }
  /**
   * コマンドをフィルタリング
   */
  filterCommands(query) {
    const allCommands = this.getAllCommands();
    if (!query || query.trim() === "") {
      return allCommands;
    }
    const lowerQuery = query.toLowerCase();
    return allCommands.filter((cmd) => {
      return cmd.name.toLowerCase().includes(lowerQuery) || cmd.id.toLowerCase().includes(lowerQuery);
    });
  }
  /**
   * コマンドを選択
   */
  selectCommand(command) {
    if (this.onSelect) {
      this.onSelect(command);
    }
    this.close();
  }
  /**
   * 選択を上下に移動
   */
  moveSelection(direction) {
    const commands = this.getFilteredCommands();
    const commandsLength = commands.length;
    if (commandsLength === 0)
      return;
    if (direction === "down") {
      this.selectedIndex = (this.selectedIndex + 1) % commandsLength;
    } else {
      this.selectedIndex = (this.selectedIndex - 1 + commandsLength) % commandsLength;
    }
  }
  /**
   * Enter キーで選択
   */
  handleEnterKey() {
    const commands = this.getFilteredCommands();
    if (commands.length > 0 && this.selectedIndex < commands.length) {
      this.selectCommand(commands[this.selectedIndex]);
    }
  }
  /**
   * 検索クエリを設定
   */
  setSearchQuery(query) {
    this.searchQuery = query;
    this.selectedIndex = 0;
    this.filteredCommands = this.filterCommands(query);
  }
  /**
   * フィルタリングされたコマンドを取得
   */
  getFilteredCommands() {
    if (this.filteredCommands.length === 0 && this.searchQuery === "") {
      this.filteredCommands = this.filterCommands("");
    }
    return this.filteredCommands;
  }
  /**
   * モーダルを開く
   */
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u30B3\u30DE\u30F3\u30C9\u3092\u9078\u629E" });
    const searchContainer = contentEl.createDiv("command-search-container");
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: "\u30B3\u30DE\u30F3\u30C9\u3092\u691C\u7D22..."
    });
    searchInput.addClass("command-search-input");
    const commandList = contentEl.createDiv("command-list");
    const updateResults = () => {
      this.setSearchQuery(searchInput.value);
      this.renderCommandList(commandList);
    };
    searchInput.addEventListener("input", updateResults);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.moveSelection("down");
        this.renderCommandList(commandList);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.moveSelection("up");
        this.renderCommandList(commandList);
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.handleEnterKey();
      }
    });
    updateResults();
    searchInput.focus();
  }
  /**
   * コマンドリストを描画
   */
  renderCommandList(container) {
    container.empty();
    const commands = this.getFilteredCommands();
    if (commands.length === 0) {
      container.createDiv("command-empty", (div) => {
        div.textContent = "\u8A72\u5F53\u3059\u308B\u30B3\u30DE\u30F3\u30C9\u304C\u3042\u308A\u307E\u305B\u3093";
      });
      return;
    }
    commands.forEach((cmd, index) => {
      const item = container.createDiv("command-item");
      if (index === this.selectedIndex) {
        item.addClass("is-selected");
      }
      item.textContent = cmd.name;
      item.addEventListener("click", () => {
        this.selectCommand(cmd);
      });
    });
  }
  /**
   * モーダルを閉じる
   */
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/settings-tab.ts
var QuickPopupSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.displayGlobalSettings();
    this.displayButtonSettings();
  }
  /**
   * グローバル設定を表示
   */
  displayGlobalSettings() {
    this.containerEl.createEl("h2", { text: "Global Settings" });
    new import_obsidian2.Setting(this.containerEl).setName("Show separators").setDesc("Display | separators between buttons").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showSeparators).onChange(async (value) => {
        this.plugin.settings.showSeparators = value;
        await this.plugin.saveSettings();
        this.plugin.refreshPopup();
      })
    );
  }
  /**
   * ボタン設定を表示
   */
  displayButtonSettings() {
    this.containerEl.createEl("h2", { text: "Button Settings" });
    const buttons = Object.values(this.plugin.settings.buttons).sort((a, b) => a.order - b.order);
    for (const button of buttons) {
      this.displayButtonSection(button);
    }
    new import_obsidian2.Setting(this.containerEl).setName("Add new button").setDesc("Add a custom button that executes an Obsidian command").addButton(
      (btn) => btn.setButtonText("+").setCta().onClick(() => {
        this.openNewButtonFlow();
      })
    );
  }
  /**
   * 新規ボタン作成フロー
   */
  openNewButtonFlow() {
    new CommandSelectorModal(this.app, async (command) => {
      const existingButtons = Object.values(this.plugin.settings.buttons);
      const maxOrder = existingButtons.reduce((max, b) => Math.max(max, b.order), -1);
      const newId = `custom-${Date.now()}`;
      const newButton = {
        id: newId,
        enabled: true,
        displayType: "text",
        icon: "",
        text: command.name.split(": ").pop() || command.name,
        tooltip: command.name,
        order: maxOrder + 1,
        commandId: command.id
      };
      this.plugin.settings.buttons[newId] = newButton;
      await this.plugin.saveSettings();
      this.plugin.registerCommandButton(newButton);
      this.plugin.refreshPopup();
      this.display();
    }).open();
  }
  /**
   * ボタンセクションを表示（折りたたみ可能）
   */
  displayButtonSection(button) {
    const containerDiv = this.containerEl.createEl("div", {
      cls: "quick-popup-button-container"
    });
    containerDiv.style.marginBottom = "8px";
    containerDiv.style.borderBottom = "1px solid var(--divider-color)";
    const headerDiv = containerDiv.createEl("div", {
      cls: "quick-popup-button-header"
    });
    headerDiv.style.display = "flex";
    headerDiv.style.alignItems = "center";
    headerDiv.style.padding = "12px 0";
    headerDiv.style.cursor = "pointer";
    headerDiv.style.userSelect = "none";
    const dragHandle = headerDiv.createEl("span", { text: "\u2630" });
    dragHandle.style.marginRight = "12px";
    dragHandle.style.cursor = "grab";
    dragHandle.style.opacity = "0.6";
    dragHandle.style.fontSize = "16px";
    const nameSpan = headerDiv.createEl("span", { text: button.tooltip });
    nameSpan.style.flex = "1";
    nameSpan.style.fontWeight = "500";
    const toggleContainer = headerDiv.createEl("div");
    const toggleSetting = new import_obsidian2.Setting(toggleContainer);
    toggleSetting.addToggle(
      (toggle) => toggle.setValue(button.enabled).onChange(async (value) => {
        button.enabled = value;
        await this.plugin.saveSettings();
        this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
        this.plugin.refreshPopup();
        this.display();
      })
    );
    toggleSetting.settingEl.style.border = "none";
    toggleSetting.settingEl.style.padding = "0";
    const detailsDiv = containerDiv.createEl("div", {
      cls: "quick-popup-button-details"
    });
    detailsDiv.style.display = "none";
    detailsDiv.style.paddingLeft = "32px";
    detailsDiv.style.paddingBottom = "12px";
    let isExpanded = false;
    headerDiv.addEventListener("click", (e) => {
      if (e.target.closest(".setting-item"))
        return;
      isExpanded = !isExpanded;
      detailsDiv.style.display = isExpanded ? "block" : "none";
      dragHandle.style.opacity = isExpanded ? "1" : "0.6";
    });
    if (button.enabled) {
      new import_obsidian2.Setting(detailsDiv).setName("Display type").setDesc("Show as icon or text").addDropdown(
        (dropdown) => dropdown.addOption("icon", "Icon only").addOption("text", "Text only").setValue(button.displayType).onChange(async (value) => {
          button.displayType = value;
          await this.plugin.saveSettings();
          this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
          this.plugin.refreshPopup();
          this.display();
        })
      );
      if (button.displayType === "icon") {
        new import_obsidian2.Setting(detailsDiv).setName("Icon").setDesc("Emoji or character").addText(
          (text) => text.setPlaceholder("\u{1F4CB}").setValue(button.icon).onChange(async (value) => {
            button.icon = value || "\u{1F4CB}";
            await this.plugin.saveSettings();
            this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
            this.plugin.refreshPopup();
          })
        );
      }
      if (button.displayType === "text") {
        new import_obsidian2.Setting(detailsDiv).setName("Label").setDesc("Text to display").addText(
          (text) => text.setPlaceholder("[[]]").setValue(button.text).onChange(async (value) => {
            button.text = value || "[[]]";
            await this.plugin.saveSettings();
            this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
            this.plugin.refreshPopup();
          })
        );
      }
      new import_obsidian2.Setting(detailsDiv).setName("Tooltip").setDesc("Hover text").addText(
        (text) => text.setPlaceholder("Tooltip").setValue(button.tooltip).onChange(async (value) => {
          button.tooltip = value || button.tooltip;
          await this.plugin.saveSettings();
          this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
        })
      );
      if (button.commandId) {
        const commandName = this.plugin.app.commands?.commands?.[button.commandId]?.name || button.commandId;
        new import_obsidian2.Setting(detailsDiv).setName("Command").setDesc(commandName).addButton(
          (btn) => btn.setButtonText("Change").onClick(() => {
            new CommandSelectorModal(this.app, async (command) => {
              button.commandId = command.id;
              button.tooltip = command.name;
              await this.plugin.saveSettings();
              this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
              this.plugin.refreshPopup();
              this.display();
            }).open();
          })
        );
      }
      new import_obsidian2.Setting(detailsDiv).setName("Order").setDesc(`Position: ${button.order + 1}`).addButton(
        (btn) => btn.setButtonText("\u2191").onClick(async () => {
          await this.moveButton(button.id, -1);
        })
      ).addButton(
        (btn) => btn.setButtonText("\u2193").onClick(async () => {
          await this.moveButton(button.id, 1);
        })
      );
    }
  }
  /**
   * ボタンの順序を変更
   */
  async moveButton(buttonId, direction) {
    const buttons = Object.values(this.plugin.settings.buttons).sort((a, b) => a.order - b.order);
    const currentIndex = buttons.findIndex((b) => b.id === buttonId);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= buttons.length)
      return;
    const temp = buttons[currentIndex].order;
    buttons[currentIndex].order = buttons[newIndex].order;
    buttons[newIndex].order = temp;
    await this.plugin.saveSettings();
    this.plugin.buttonRegistry.updateConfigs(this.plugin.settings);
    this.plugin.refreshPopup();
    this.display();
  }
};

// src/command-executor.ts
var CommandExecutor = class {
  constructor(app) {
    this.app = app;
  }
  /**
   * コマンドを実行
   * @returns true: 実行成功、false: 実行失敗
   */
  execute(commandId) {
    if (!commandId || !this.commandExists(commandId)) {
      return false;
    }
    try {
      this.app.commands.executeCommandById(commandId);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * コマンドが存在するか確認
   */
  commandExists(commandId) {
    if (!commandId)
      return false;
    return !!this.app.commands.commands[commandId];
  }
  /**
   * コマンド名を取得
   */
  getCommandName(commandId) {
    return this.app.commands.commands[commandId]?.name;
  }
};

// src/main.ts
var QuickPopupPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.selectionTimeout = null;
    this.isComposing = false;
  }
  /**
   * プラグイン読み込み時の初期化
   */
  async onload() {
    console.log("Loading Quick Popup plugin");
    await this.loadSettings();
    this.buttonRegistry = new ButtonRegistry(this);
    this.hotkeyManager = new HotkeyManager(this);
    this.popupManager = new PopupManager(this);
    this.selectionHandler = new SelectionHandler();
    this.commandExecutor = new CommandExecutor(this.app);
    this.registerDefaultButtons();
    this.registerCommandButtons();
    this.hotkeyManager.registerAllHotkeys();
    this.addSettingTab(new QuickPopupSettingTab(this.app, this));
    this.registerEventHandlers();
  }
  /**
   * プラグインアンロード時のクリーンアップ
   */
  onunload() {
    console.log("Unloading Quick Popup plugin");
    this.popupManager.hide();
    this.removeEventHandlers();
  }
  /**
   * デフォルトボタンの登録
   */
  registerDefaultButtons() {
    this.buttonRegistry.register(
      "link",
      this.settings.buttons.link,
      (plugin) => this.handleConvertToLink(plugin)
    );
    this.buttonRegistry.register(
      "copy",
      this.settings.buttons.copy,
      (plugin) => this.handleCopyPath(plugin)
    );
    this.buttonRegistry.register(
      "cosense",
      this.settings.buttons.cosense,
      (plugin) => this.handleCosense(plugin)
    );
    this.buttonRegistry.register(
      "split",
      this.settings.buttons.split,
      (plugin) => this.handleSplitText(plugin)
    );
  }
  /**
   * コマンドベースのカスタムボタンを一括登録
   */
  registerCommandButtons() {
    const buttons = Object.values(this.settings.buttons);
    for (const button of buttons) {
      if (button.commandId) {
        this.registerCommandButton(button);
      }
    }
  }
  /**
   * コマンドベースのボタンを1つ登録
   */
  registerCommandButton(button) {
    if (!button.commandId)
      return;
    this.buttonRegistry.register(
      button.id,
      button,
      () => {
        this.commandExecutor.execute(button.commandId);
        this.popupManager.hide();
      }
    );
  }
  /**
   * イベントハンドラーの登録
   */
  registerEventHandlers() {
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);
    this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    this.boundCompositionStartHandler = this.handleCompositionStart.bind(this);
    this.boundCompositionEndHandler = this.handleCompositionEnd.bind(this);
    this.boundScrollHandler = this.handleScroll.bind(this);
    this.boundResizeHandler = this.handleResize.bind(this);
    document.addEventListener("mouseup", this.boundMouseUpHandler);
    document.addEventListener("keyup", this.boundKeyUpHandler);
    document.addEventListener("compositionstart", this.boundCompositionStartHandler);
    document.addEventListener("compositionend", this.boundCompositionEndHandler);
    window.addEventListener("scroll", this.boundScrollHandler, true);
    window.addEventListener("resize", this.boundResizeHandler);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.popupManager.hide();
      })
    );
  }
  /**
   * イベントハンドラーの削除
   */
  removeEventHandlers() {
    document.removeEventListener("mouseup", this.boundMouseUpHandler);
    document.removeEventListener("keyup", this.boundKeyUpHandler);
    document.removeEventListener("compositionstart", this.boundCompositionStartHandler);
    document.removeEventListener("compositionend", this.boundCompositionEndHandler);
    window.removeEventListener("scroll", this.boundScrollHandler, true);
    window.removeEventListener("resize", this.boundResizeHandler);
  }
  /**
   * マウスアップイベント処理（テキスト選択検出）
   */
  handleMouseUp(event) {
    if (this.isComposing)
      return;
    const target = event.target;
    if (target.closest(`.${PopupConfig.POPUP_CLASS}`)) {
      return;
    }
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    this.selectionTimeout = setTimeout(() => {
      this.checkSelection();
    }, PopupConfig.SELECTION_CHECK_DELAY);
  }
  /**
   * キーアップイベント処理
   */
  handleKeyUp(event) {
    if (event.key === "Escape") {
      this.popupManager.hide();
      return;
    }
    if (this.isComposing)
      return;
    if (event.ctrlKey && event.key === "c") {
      return;
    }
    const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"];
    if (navigationKeys.includes(event.key)) {
      return;
    }
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
  handleCompositionStart() {
    this.isComposing = true;
    this.popupManager.hide();
  }
  /**
   * IME入力終了
   */
  handleCompositionEnd() {
    this.isComposing = false;
  }
  /**
   * スクロールイベント処理
   */
  handleScroll() {
    if (this.popupManager.exists()) {
      this.updatePopupPosition();
    }
  }
  /**
   * リサイズイベント処理
   */
  handleResize() {
    if (this.popupManager.exists()) {
      this.updatePopupPosition();
    }
  }
  /**
   * 選択テキストをチェックしてポップアップ表示
   */
  checkSelection() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
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
    this.popupManager.create();
    this.popupManager.show();
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
  updatePopupPosition() {
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
  async handleConvertToLink(plugin) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
    if (!activeView || !activeView.editor)
      return;
    this.selectionHandler.setEditor(activeView.editor);
    this.selectionHandler.convertToLink();
    this.popupManager.hide();
  }
  /**
   * ボタンアクション: パスと行番号をコピー
   */
  async handleCopyPath(plugin) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
    if (!activeView || !activeView.editor)
      return;
    const file = activeView.file;
    if (!file)
      return;
    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const filePath = file.path;
    const lineNumber = cursor.line + 1;
    const pathString = `@${filePath}:${lineNumber}`;
    await navigator.clipboard.writeText(pathString);
    new import_obsidian3.Notice(`Copied: ${pathString}`);
    this.popupManager.hide();
  }
  /**
   * ボタンアクション: Cosense（新規ノート作成）
   */
  async handleCosense(plugin) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
    if (!activeView || !activeView.editor)
      return;
    this.selectionHandler.setEditor(activeView.editor);
    const selectedText = this.selectionHandler.getSelectedText();
    if (!selectedText) {
      new import_obsidian3.Notice("No text selected");
      return;
    }
    const lines = selectedText.split("\n");
    const title = lines[0].substring(0, 50).trim();
    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, "-");
    try {
      const fileName = `${sanitizedTitle}.md`;
      const file = await this.app.vault.create(fileName, selectedText);
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(file);
      new import_obsidian3.Notice(`Created note: ${fileName}`);
      this.popupManager.hide();
    } catch (error) {
      console.error("Failed to create note:", error);
      new import_obsidian3.Notice("Failed to create note");
    }
  }
  /**
   * ボタンアクション: テキストを段落に分割
   */
  async handleSplitText(plugin) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
    if (!activeView || !activeView.editor)
      return;
    this.selectionHandler.setEditor(activeView.editor);
    const selectedText = this.selectionHandler.getSelectedText();
    if (!selectedText) {
      new import_obsidian3.Notice("No text selected");
      return;
    }
    const TextSplitter = require_text_splitter().TextSplitter;
    const splitText = TextSplitter.split(selectedText);
    activeView.editor.replaceSelection(splitText);
    new import_obsidian3.Notice("Text split into paragraphs");
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
};
module.exports = QuickPopupPlugin;
module.exports.default = QuickPopupPlugin;
