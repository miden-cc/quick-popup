/**
 * CommandSelectorModal - コマンド選択モーダル
 *
 * Obsidian のすべてのコマンドを検索・選択できるモーダル
 */

import { App, Modal } from 'obsidian';
import { ObsidianCommand } from './types';

export class CommandSelectorModal extends Modal {
  private onSelect: (command: ObsidianCommand) => void;
  private searchQuery = '';
  public selectedIndex = 0;
  private filteredCommands: ObsidianCommand[] = [];

  constructor(app: App, onSelect: (command: ObsidianCommand) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  /**
   * 全 Obsidian コマンドを取得
   */
  getAllCommands(): ObsidianCommand[] {
    const commands = this.app.commands.listCommands();
    return commands.map((cmd: any) => ({
      id: cmd.id,
      name: cmd.name,
      icon: cmd.icon,
    }));
  }

  /**
   * コマンドをフィルタリング
   */
  filterCommands(query: string): ObsidianCommand[] {
    const allCommands = this.getAllCommands();

    if (!query || query.trim() === '') {
      return allCommands;
    }

    const lowerQuery = query.toLowerCase();
    return allCommands.filter((cmd) => {
      return (
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.id.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * コマンドを選択
   */
  selectCommand(command: ObsidianCommand): void {
    if (this.onSelect) {
      this.onSelect(command);
    }
    this.close();
  }

  /**
   * 選択を上下に移動
   */
  moveSelection(direction: 'up' | 'down'): void {
    const commands = this.getFilteredCommands();
    const commandsLength = commands.length;
    if (commandsLength === 0) return;

    if (direction === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % commandsLength;
    } else {
      this.selectedIndex =
        (this.selectedIndex - 1 + commandsLength) % commandsLength;
    }
  }

  /**
   * Enter キーで選択
   */
  handleEnterKey(): void {
    const commands = this.getFilteredCommands();
    if (commands.length > 0 && this.selectedIndex < commands.length) {
      this.selectCommand(commands[this.selectedIndex]);
    }
  }

  /**
   * 検索クエリを設定
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query;
    this.selectedIndex = 0; // Reset selection
    this.filteredCommands = this.filterCommands(query);
  }

  /**
   * フィルタリングされたコマンドを取得
   */
  getFilteredCommands(): ObsidianCommand[] {
    if (this.filteredCommands.length === 0 && this.searchQuery === '') {
      this.filteredCommands = this.filterCommands('');
    }
    return this.filteredCommands;
  }

  /**
   * モーダルを開く
   */
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // タイトル
    contentEl.createEl('h2', { text: 'コマンドを選択' });

    // 検索ボックス
    const searchContainer = contentEl.createDiv('command-search-container');
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'コマンドを検索...',
    });
    searchInput.addClass('command-search-input');

    // コマンドリスト
    const commandList = contentEl.createDiv('command-list');

    // 検索入力時のハンドラ
    const updateResults = () => {
      this.setSearchQuery(searchInput.value);
      this.renderCommandList(commandList);
    };

    searchInput.addEventListener('input', updateResults);

    // キーボードナビゲーション
    searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveSelection('down');
        this.renderCommandList(commandList);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection('up');
        this.renderCommandList(commandList);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.handleEnterKey();
      }
    });

    // 初期表示
    updateResults();
    searchInput.focus();
  }

  /**
   * コマンドリストを描画
   */
  private renderCommandList(container: HTMLElement): void {
    container.empty();

    const commands = this.getFilteredCommands();

    if (commands.length === 0) {
      container.createDiv('command-empty', (div) => {
        div.textContent = '該当するコマンドがありません';
      });
      return;
    }

    commands.forEach((cmd, index) => {
      const item = container.createDiv('command-item');
      if (index === this.selectedIndex) {
        item.addClass('is-selected');
      }

      item.textContent = cmd.name;
      item.addEventListener('click', () => {
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
}
