# Quick Popup プラグイン カスタマイズシステム仕様書

## 第1部: 現在の実装仕様

### 1. 概要

Quick Popup は、Obsidian でテキスト選択時にポップアップを表示し、内部リンク作成、パスコピー、Cosense記事作成、段落分割などの機能を提供するプラグインです。

- **バージョン**: 2.0.0
- **プラグイン名**: quick-link-popup
- **主な機能**: テキスト選択時のポップアップ表示とカスタマイズ可能なアクションボタン

#### デフォルトボタン（4つ）

1. **内部リンク変換** (`link`) - 選択テキストを `[[...]]` で囲む
2. **パスコピー** (`copy`) - ファイルパスと行番号をクリップボードにコピー
3. **Cosense** (`cosense`) - 選択テキストから新規ノートを作成
4. **テキスト分割** (`split`) - テキストを段落に分割（TextSplitter使用）

---

### 2. カスタマイズ機能詳細

Quick Popup は非常に高度なカスタマイズシステムを実装しています。すべての設定は UI 経由で変更可能です。

#### 2.1 ボタンの有効/無効切替

**機能**: 各ボタンを個別にオン/オフできる

- **UI**: 設定タブ内のトグルスイッチ
- **データ構造**: `ButtonConfig.enabled: boolean`
- **実装**: `ButtonRegistry.getEnabledButtons()` が有効なボタンのみを取得
- **動作**: 無効化されたボタンはポップアップに表示されず、ホットキーも無効化される

#### 2.2 表示形式の選択（アイコン/テキスト）

**機能**: ボタンをアイコンで表示するか、テキストラベルで表示するかを選択

- **UI**: ドロップダウン選択（"Icon only" / "Text only"）
- **データ構造**: `ButtonConfig.displayType: 'icon' | 'text'`
- **実装**: `PopupManager.createButton()` が displayType に応じて表示内容を切り替え
- **例**:
  - `displayType: 'icon'` → ボタンに絵文字 '📋' を表示
  - `displayType: 'text'` → ボタンにテキスト '[[]]' を表示

#### 2.3 アイコン/テキストのカスタマイズ

**機能**: ボタンに表示するアイコンやテキストを自由に変更

- **UI**: テキスト入力フィールド（displayType に応じて条件表示）
  - アイコン選択時: "Icon" フィールドが表示される
  - テキスト選択時: "Label" フィールドが表示される
- **データ構造**:
  - `ButtonConfig.icon: string` - 絵文字または任意の文字（例: '📋', '🔗'）
  - `ButtonConfig.text: string` - テキストラベル（例: '[[]]', 'Copy'）
- **実装**: 設定変更が即座に反映され、`PopupManager.refresh()` でポップアップが再構築される

#### 2.4 ツールチップ編集

**機能**: ボタンにマウスホバー時に表示されるツールチップを編集

- **UI**: テキスト入力フィールド
- **データ構造**: `ButtonConfig.tooltip: string`
- **実装**: HTML の `title` 属性として設定される
- **例**: "Convert to internal link", "Copy path and line number"

#### 2.5 キーボードショートカット

**機能**: 各ボタンにキーボードショートカットを割り当て

- **UI**: テキスト入力フィールド（"e.g., Ctrl+L, Ctrl+Shift+C" のプレースホルダー）
- **データ構造**: `ButtonConfig.hotkey?: string`
- **形式**: "Ctrl+L", "Ctrl+Shift+C", "Cmd+K" など
- **実装**:
  - `HotkeyManager.parseHotkey()` でショートカット文字列を解析
  - Obsidian の Command API を使用して登録
  - コマンド ID: `quick-popup-{buttonId}` （例: `quick-popup-link`）
- **動作**: ショートカットを押すと、現在のエディタでボタンアクションが実行される
- **更新**: 設定変更時に `HotkeyManager.updateHotkeys()` で再登録

#### 2.6 ボタンの並び順変更

**機能**: ボタンの表示順序を変更

- **UI**: ↑（Move up）/ ↓（Move down）ボタン
- **データ構造**: `ButtonConfig.order: number` (0-based)
- **実装**:
  - `order` 値を交換してソート順を変更
  - 設定変更後、`ButtonRegistry.getEnabledButtons()` が order 順にソート
  - ポップアップが即座に再構築される
- **動作**: ボタンの表示順序がポップアップに反映される

#### 2.7 セパレータ表示

**機能**: ボタン間にセパレータ（|）を表示するかどうかを切り替え

- **UI**: グローバル設定のトグルスイッチ（"Show separators"）
- **データ構造**: `QuickPopupSettings.showSeparators: boolean`
- **実装**: `PopupManager.create()` でセパレータ要素を条件付きで挿入

---

### 3. システムアーキテクチャ

#### 3.1 コンポーネント構成図

```
QuickPopupPlugin (main.ts)
  ├─ ButtonRegistry (button-registry.ts)
  │    ├─ ボタン設定とアクションの管理
  │    └─ Map<string, RegisteredButton>
  │
  ├─ HotkeyManager (hotkey-manager.ts)
  │    ├─ キーボードショートカット管理
  │    └─ Obsidian Command Registration
  │
  ├─ PopupManager (popup-manager.ts)
  │    ├─ ポップアップUI管理
  │    └─ DOM操作、表示/非表示、位置設定
  │
  ├─ SelectionHandler (selection-handler.ts)
  │    ├─ テキスト選択処理
  │    └─ 選択テキスト取得、位置情報、リンク変換
  │
  ├─ PositionCalculator (position-calculator.ts)
  │    ├─ ポップアップ位置計算
  │    └─ 選択範囲と重ならない位置を計算
  │
  └─ QuickPopupSettingTab (settings-tab.ts)
       ├─ 設定UI構築
       └─ 各ボタンの設定セクション表示
```

#### 3.2 データフロー

**設定変更時のフロー**:
```
1. ユーザーが設定UI変更
   ↓
2. 設定オブジェクト更新
   ↓
3. saveSettings() でプラグインストレージに保存
   ↓
4. ButtonRegistry.updateConfigs() / HotkeyManager.updateHotkeys()
   ↓
5. PopupManager.refresh() でUI再構築
   ↓
6. 変更が即座に反映される
```

**ポップアップ表示時のフロー**:
```
1. ユーザーがテキストを選択
   ↓
2. mouseup イベント検出（150ms遅延）
   ↓
3. SelectionHandler.hasValidSelection() でチェック
   ↓
4. ButtonRegistry.getEnabledButtons() で有効なボタン取得
   ↓
5. PopupManager.create() でポップアップDOM作成
   ↓
6. PositionCalculator.calculate() で位置計算
   ↓
7. PopupManager.show() で表示（アニメーション付き）
```

#### 3.3 設定データ構造

```typescript
interface ButtonConfig {
  id: string;                    // 'link', 'copy', 'cosense', 'split'
  enabled: boolean;              // true/false
  displayType: 'icon' | 'text';  // 表示タイプ
  icon: string;                  // 絵文字（例: '📋'）
  text: string;                  // テキストラベル
  tooltip: string;               // ツールチップ
  order: number;                 // 表示順序（0-based）
  hotkey?: string;               // ショートカット
}

interface QuickPopupSettings {
  version: number;                           // 設定バージョン（現在: 1）
  buttons: { [key: string]: ButtonConfig };  // ボタン設定マップ
  showSeparators: boolean;                   // セパレータ表示フラグ
}
```

**設定ストレージ**:
- 保存先: Obsidian の `.obsidian/plugins/quick-link-popup/data.json`
- フォーマット: JSON
- マイグレーション: `migrateSettings()` 関数が古いバージョンの設定を自動変換

---

### 4. デフォルト設定

Quick Popup は以下のデフォルト設定で初期化されます。

#### 4.1 内部リンクボタン（link）

```typescript
{
  id: 'link',
  enabled: true,
  displayType: 'text',
  icon: '🔗',
  text: '[[]]',
  tooltip: 'Convert to internal link',
  order: 0,
  hotkey: undefined
}
```

- **アクション**: 選択テキストを `[[...]]` で囲む
- **既存のリンク**: 既に `[[...]]` で囲まれている場合は除去して再適用

#### 4.2 パスコピーボタン（copy）

```typescript
{
  id: 'copy',
  enabled: true,
  displayType: 'icon',
  icon: '📋',
  text: 'Copy',
  tooltip: 'Copy path and line number',
  order: 1,
  hotkey: 'Ctrl+C'
}
```

- **アクション**: `@ファイルパス:行番号` 形式でクリップボードにコピー
- **例**: `@notes/meeting.md:42`
- **通知**: コピー完了時に通知を表示

#### 4.3 Cosenseボタン（cosense）

```typescript
{
  id: 'cosense',
  enabled: true,
  displayType: 'icon',
  icon: '✂️',
  text: 'Cosense',
  tooltip: 'Create new note from selection (Cosense)',
  order: 2,
  hotkey: undefined
}
```

- **アクション**: 選択テキストから新規ノートを作成
- **ファイル名**: 選択テキストの最初の行または最初の50文字
- **内容**: 選択テキスト全体
- **動作**: 作成後、新しいノートを自動的に開く

#### 4.4 分割ボタン（split）

```typescript
{
  id: 'split',
  enabled: true,
  displayType: 'icon',
  icon: '🧩',
  text: 'Split',
  tooltip: 'Split text into paragraphs',
  order: 3,
  hotkey: undefined
}
```

- **アクション**: TextSplitter を使用してテキストを段落に分割
- **分割ルール**:
  - 200文字以内または句点3つで分割検討
  - 括弧内の句点は除外
  - 優先度: 句点 > 改行 > ？！ > 読点
  - ハード上限: 500文字
- **出力**: パラグラフ間に `\n\n` を挿入

---

### 5. 技術実装詳細

#### 5.1 ButtonRegistry クラス

**役割**: ボタン設定とアクションの管理

**主要メソッド**:

```typescript
class ButtonRegistry {
  // ボタンを登録（id, config, action）
  register(id: string, config: ButtonConfig, action: Function): void

  // 有効なボタンを order 順で取得
  getEnabledButtons(): RegisteredButton[]

  // 全ボタンを取得（有効/無効問わず）
  getAllButtons(): RegisteredButton[]

  // ボタンアクションを実行
  executeAction(id: string, editor: Editor): Promise<void>

  // 設定更新時に config を同期
  updateConfigs(settings: QuickPopupSettings): void

  // 特定のボタン設定を取得
  getButtonConfig(id: string): ButtonConfig | undefined
}
```

**内部データ**:
- `Map<string, RegisteredButton>` でボタンを管理
- `RegisteredButton = { config: ButtonConfig, action: Function }`

#### 5.2 HotkeyManager クラス

**役割**: キーボードショートカット管理

**主要メソッド**:

```typescript
class HotkeyManager {
  // すべてのショートカットを登録
  registerAllHotkeys(): void

  // ショートカット文字列を解析
  // "Ctrl+L" → { modifiers: ['Ctrl'], key: 'l' }
  parseHotkey(hotkeyStr: string): any

  // 設定変更時に再登録
  updateHotkeys(settings: QuickPopupSettings): void
}
```

**実装詳細**:
- Obsidian の `addCommand()` API を使用
- コマンド ID: `quick-popup-{buttonId}`
- コマンド名: `Quick Popup: {tooltip}`
- 更新時は古いコマンドを削除してから再登録

#### 5.3 PopupManager クラス

**役割**: ポップアップUI管理

**主要メソッド**:

```typescript
class PopupManager {
  // ポップアップDOM作成
  create(): void

  // 表示（アニメーション付き）
  show(): void

  // 非表示
  hide(): void

  // 位置設定
  position(pos: PopupPosition): void

  // 再構築（設定変更時）
  refresh(): void

  // ポップアップ要素を取得
  getElement(): HTMLElement | null

  // 存在チェック
  exists(): boolean
}
```

**DOM構造**:
```html
<div class="text-selection-linker-popup show popup-top">
  <button class="text-selection-linker-button">[[]]</button>
  <span class="text-selection-linker-separator">|</span>
  <button class="text-selection-linker-button">📋</button>
  ...
</div>
```

#### 5.4 SelectionHandler クラス

**役割**: テキスト選択処理

**主要メソッド**:

```typescript
class SelectionHandler {
  // エディターを設定
  setEditor(editor: Editor): void

  // 選択テキストを取得
  getSelectedText(): string

  // 有効な選択か（空白以外）
  hasValidSelection(): boolean

  // 内部リンクに変換
  convertToLink(): void

  // リンクと装飾を削除
  removeFormattingAndLinks(): void

  // 選択範囲の矩形を取得
  getSelectionRect(): DOMRect | null
}
```

#### 5.5 PositionCalculator クラス

**役割**: ポップアップ位置計算

**主要メソッド**:

```typescript
class PositionCalculator {
  // 選択テキストと重ならない位置を計算
  static calculate(selectionRect: DOMRect, popupRect: DOMRect): PopupPosition
}
```

**計算ロジック**:
1. **優先配置**: 選択範囲の上
2. **フォールバック**: 上に空間がない場合は下
3. **水平位置**: 選択範囲の中央に配置（画面端を考慮）
4. **衝突検出**: 選択範囲と重なる場合は安全な位置に強制移動

#### 5.6 設定UI（QuickPopupSettingTab）

**役割**: 設定画面の構築

**UI構成**:
1. **グローバル設定**:
   - セパレータ表示トグル

2. **ボタン設定（各ボタンごと）**:
   - 有効/無効トグル
   - 表示タイプ選択（アイコン/テキスト）
   - アイコン入力（条件表示）
   - テキスト入力（条件表示）
   - ツールチップ入力
   - ショートカット入力
   - 並び順変更ボタン（↑/↓）

**実装特徴**:
- 変更が即座に保存・反映される
- 無効化されたボタンは追加設定が非表示になる
- 並び順変更後、UI が自動的に再描画される

---

### 6. イベント処理とユーザー操作

#### 6.1 テキスト選択検出

**イベント**: `mouseup`
- **遅延**: 150ms（誤検出を防ぐ）
- **チェック**: 有効な選択テキストが存在するか
- **アクション**: ポップアップを作成・表示

#### 6.2 キーボード操作

**Escape キー**: ポップアップを閉じる
**ショートカット**: 登録されたホットキーでボタンアクションを実行
**ナビゲーションキー**: 無視（選択を維持）

#### 6.3 IME 入力対応

**compositionstart**: IME 入力開始時にポップアップを非表示
**compositionend**: IME 入力終了時にフラグをクリア

#### 6.4 スクロール/リサイズ

**scroll/resize イベント**: ポップアップ位置を動的に更新

#### 6.5 ワークスペース変更

**active-leaf-change**: タブ切替時にポップアップを非表示

---

### 7. 現在の制限事項

Quick Popup の現在のバージョンには以下の制限があります：

#### ❌ 実装されていない機能

1. **色のカスタマイズ**
   - ボタンの背景色、テキスト色の変更不可
   - ポップアップの背景色の変更不可
   - セパレータの色の変更不可

2. **画像ファイルのアップロード**
   - 画像ファイルをボタンアイコンとして使用不可
   - 現在は絵文字とテキストのみ対応

3. **カスタムボタンアクション**
   - ボタンアクションは4種固定
   - 新しいボタンの追加不可
   - 任意の Obsidian コマンド実行不可

4. **設定内ビジュアルプレビュー**
   - 設定画面でボタンの見た目をプレビュー不可
   - 実際のポップアップを表示して確認する必要がある

5. **設定のインポート/エクスポート**
   - 設定を JSON ファイルとして保存不可
   - 他のユーザーと設定を共有する機能なし

---

## 第2部: 将来の機能拡張案

### 8. 拡張機能提案

#### 8.1 カラーカスタマイズ（優先度: 高）

**目的**: ボタンとポップアップの色をカスタマイズ可能にする

**実装内容**:
- **ボタン色**:
  - 背景色（`button.backgroundColor`）
  - テキスト色（`button.textColor`）
  - ホバー時の色（`button.hoverColor`）

- **ポップアップ色**:
  - 背景色（`popup.backgroundColor`）
  - 境界線の色（`popup.borderColor`）

- **セパレータ色**:
  - セパレータの色（`separator.color`）

**UI実装**:
- Obsidian の `ColorComponent` を使用
- カラーピッカーで色を選択
- 16進数カラーコード入力（例: `#FF5733`）

**技術実装**:
- CSS 変数を動的に設定
- `popup.style.setProperty('--button-bg-color', color)`
- `styles.css` で CSS 変数を参照

**データ構造**:
```typescript
interface ColorSettings {
  button: {
    backgroundColor: string;
    textColor: string;
    hoverColor: string;
  };
  popup: {
    backgroundColor: string;
    borderColor: string;
  };
  separator: {
    color: string;
  };
}
```

#### 8.2 画像アップロード（優先度: 中）

**目的**: カスタム画像をボタンアイコンとして使用

**実装内容**:
- 画像ファイルのアップロード（PNG, SVG, JPG）
- サイズ制限: 24x24px 推奨
- Data URL またはVaultパスで保存

**UI実装**:
- ファイル選択ボタン
- プレビュー表示
- 削除ボタン

**技術実装**:
- `<input type="file">` でファイル選択
- `FileReader` で Data URL に変換
- `button.config.imageDataUrl` に保存

**データ構造**:
```typescript
interface ButtonConfig {
  // 既存フィールド...
  imageDataUrl?: string;  // Data URL形式の画像
  displayType: 'icon' | 'text' | 'image';  // 'image' を追加
}
```

#### 8.3 カスタムアクション（優先度: 中）

**目的**: ボタンアクションをカスタマイズ可能にする

**実装内容**:
- **アクションタイプ**:
  1. **固定アクション**: 既存の4つのアクション
  2. **Obsidianコマンド**: 任意のコマンドを実行
  3. **テンプレート変換**: テキストを変換（正規表現対応）
  4. **外部スクリプト**: JavaScript コードを実行

- **テンプレート変換の例**:
  - `${selection}` → 選択テキスト
  - `${filename}` → 現在のファイル名
  - `${date}` → 現在の日付

**UI実装**:
- アクションタイプ選択ドロップダウン
- コマンド検索（Obsidianコマンド）
- テンプレート入力（マークダウンエディタ）
- JavaScript エディタ（外部スクリプト）

**技術実装**:
```typescript
interface ButtonAction {
  type: 'builtin' | 'command' | 'template' | 'script';
  value: string;  // コマンドID、テンプレート、またはスクリプト
}

interface ButtonConfig {
  // 既存フィールド...
  action?: ButtonAction;
}
```

#### 8.4 ボタンテンプレート（優先度: 低）

**目的**: 設定を簡単に共有・再利用

**実装内容**:
- **エクスポート**: 現在の設定をJSONファイルとして保存
- **インポート**: JSONファイルから設定を読み込み
- **プリセット**: よく使う設定パターンを提供

**プリセット例**:
1. **ミニマル**: 内部リンクのみ
2. **フル機能**: すべてのボタンを有効化
3. **研究者向け**: 引用、参考文献ボタンを追加
4. **ライター向け**: 文章編集ボタンを追加

**UI実装**:
- エクスポートボタン（設定タブ）
- インポートボタン（設定タブ）
- プリセット選択ドロップダウン

**技術実装**:
```typescript
// エクスポート
const exportSettings = () => {
  const json = JSON.stringify(plugin.settings, null, 2);
  // ダウンロードまたはクリップボードにコピー
};

// インポート
const importSettings = (json: string) => {
  plugin.settings = JSON.parse(json);
  await plugin.saveSettings();
  plugin.refreshPopup();
};
```

#### 8.5 設定内ビジュアルプレビュー（優先度: 中）

**目的**: 設定変更の結果を即座にプレビュー

**実装内容**:
- 設定タブ内にミニポップアップを表示
- 変更がリアルタイムで反映される
- サンプルテキスト選択のシミュレーション

**UI実装**:
```
┌─────────────────────────────────┐
│ Preview                         │
├─────────────────────────────────┤
│  Sample selected text           │
│                                 │
│  ┌────────────────────┐         │
│  │ [[]] | 📋 | ✂️ | 🧩 │         │
│  └────────────────────┘         │
└─────────────────────────────────┘
```

**技術実装**:
- プレビュー用の独立したポップアップ要素を作成
- 設定変更時に `updatePreview()` を呼び出し
- CSS で position: relative にして設定画面内に配置

---

### 9. 実装優先順位

Quick Popup の機能拡張は以下のフェーズで実装することを推奨します。

#### Phase 1（即時）✅ 完了

1. ✅ **main.ts 作成** - すべてのモジュールを統合するエントリーポイント
2. ✅ **仕様書作成** - カスタマイズシステムの包括的なドキュメント
3. ✅ **ビルド確認** - TypeScript コンパイルと型チェック

**目標**: プラグインの基本機能を完全に動作させる

#### Phase 2（短期）🔄 次の目標

1. **カラーカスタマイズ実装**
   - ボタン色、ポップアップ色、セパレータ色
   - ColorComponent を使用したUI
   - CSS変数による動的スタイル適用

2. **設定内ビジュアルプレビュー**
   - 設定タブ内にミニプレビュー
   - リアルタイム更新
   - サンプルテキストのシミュレーション

**目標**: ユーザビリティの大幅向上

#### Phase 3（中期）

1. **画像アップロード機能**
   - カスタム画像アイコン対応
   - ファイル選択UI
   - プレビュー表示

2. **設定エクスポート/インポート**
   - JSONファイル保存
   - 設定の共有機能
   - プリセットテンプレート

**目標**: カスタマイズの自由度をさらに拡大

#### Phase 4（長期）

1. **カスタムアクションシステム**
   - Obsidianコマンド実行
   - テンプレート変換
   - 外部スクリプト対応

2. **ボタンテンプレートライブラリ**
   - コミュニティ共有
   - プリセットコレクション
   - 自動更新機能

**目標**: プラグインをプラットフォーム化

---

### 10. 開発者向け情報

#### 10.1 ビルド方法

```bash
# 依存関係のインストール
npm install

# 開発ビルド（ウォッチモード）
npm run dev

# 本番ビルド
npm run build

# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

#### 10.2 プロジェクト構造

```
quick-popup/
├── src/
│   ├── main.ts                 # エントリーポイント
│   ├── types.ts                # 型定義
│   ├── settings.ts             # デフォルト設定
│   ├── button-registry.ts      # ボタン管理
│   ├── hotkey-manager.ts       # ホットキー管理
│   ├── popup-manager.ts        # ポップアップUI
│   ├── selection-handler.ts    # テキスト選択処理
│   ├── position-calculator.ts  # 位置計算
│   └── settings-tab.ts         # 設定UI
├── text-splitter.js            # テキスト分割ロジック
├── text-splitter.test.js       # テスト
├── styles.css                  # スタイルシート
├── manifest.json               # プラグインメタデータ
├── package.json                # npm設定
└── SPECIFICATION.md            # 本ドキュメント
```

#### 10.3 コーディング規約

- **TypeScript**: strict mode 有効
- **命名規則**:
  - クラス: PascalCase
  - 関数/変数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - ファイル: kebab-case
- **コメント**: JSDoc 形式で関数ドキュメント
- **型安全性**: `any` の使用を最小限に

#### 10.4 テスト戦略

- **ユニットテスト**: Jest を使用
- **対象**: TextSplitter, PositionCalculator
- **カバレッジ目標**: 80%以上
- **テストファイル**: `*.test.js` または `*.test.ts`

---

### 11. トラブルシューティング

#### 11.1 よくある問題

**Q: ポップアップが表示されない**
- A: 少なくとも1つのボタンが有効化されているか確認
- A: IME入力中は表示されないので、確定後に再選択

**Q: ショートカットキーが動作しない**
- A: 他のプラグインと競合していないか確認
- A: ショートカット形式が正しいか確認（例: "Ctrl+L"）

**Q: 設定が保存されない**
- A: `.obsidian/plugins/quick-link-popup/data.json` の書き込み権限を確認
- A: Obsidianを再起動

#### 11.2 デバッグ方法

**デバッグモードの有効化**:
```typescript
// position-calculator.ts または popup-manager.ts
PopupConfig.DEBUG = true;
```

**コンソール出力**:
- Chrome DevTools: Ctrl+Shift+I (Windows/Linux) / Cmd+Option+I (Mac)
- `console.log()` でデバッグ情報を出力

---

### 12. コントリビューション

Quick Popup はオープンソースプロジェクトです。貢献を歓迎します。

**貢献方法**:
1. Issue を作成して機能提案やバグ報告
2. Pull Request を送信（コーディング規約に従ってください）
3. ドキュメントの改善提案

**開発環境**:
- Node.js 16以上
- TypeScript 5.0以上
- Obsidian 最新版

---

## まとめ

Quick Popup プラグインは、Obsidian におけるテキスト選択時の操作を大幅に効率化する、高度にカスタマイズ可能なツールです。

**現在の強み**:
- ✅ 完全にカスタマイズ可能なボタンシステム
- ✅ 柔軟なキーボードショートカット
- ✅ 直感的な設定UI
- ✅ 高性能な位置計算アルゴリズム
- ✅ IME入力対応

**将来の展望**:
- 🔄 カラーカスタマイズ
- 🔄 画像アイコン対応
- 🔄 カスタムアクション
- 🔄 テンプレートライブラリ

この仕様書が、Quick Popup の理解と今後の開発の指針となることを願っています。

---

**バージョン**: 2.0.0
**最終更新**: 2026-02-11
**作成者**: Claude (Anthropic)
