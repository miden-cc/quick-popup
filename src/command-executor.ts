/**
 * CommandExecutor - Obsidian コマンド実行
 *
 * commandId を受け取り、Obsidian API でコマンドを実行する
 */

export class CommandExecutor {
  private app: any;

  constructor(app: any) {
    this.app = app;
  }

  /**
   * コマンドを実行
   * @returns true: 実行成功、false: 実行失敗
   */
  execute(commandId: string): boolean {
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
  commandExists(commandId: string): boolean {
    if (!commandId) return false;
    return !!this.app.commands.commands[commandId];
  }

  /**
   * コマンド名を取得
   */
  getCommandName(commandId: string): string | undefined {
    return this.app.commands.commands[commandId]?.name;
  }
}
