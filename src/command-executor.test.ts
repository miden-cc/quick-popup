/**
 * CommandExecutor - Obsidian コマンド実行テスト
 *
 * TDD: RED フェーズ
 *
 * ボタンクリック時に commandId で Obsidian コマンドを実行する
 */

import { CommandExecutor } from './command-executor';

describe('CommandExecutor - Obsidian コマンド実行', () => {
  let executor: CommandExecutor;
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      commands: {
        commands: {
          'editor:fold': { id: 'editor:fold', name: 'Editor: Fold' },
          'editor:unfold': { id: 'editor:unfold', name: 'Editor: Unfold' },
          'file:new': { id: 'file:new', name: 'File: New' },
        },
        executeCommandById: jest.fn(),
        listCommands: jest.fn(() => [
          { id: 'editor:fold', name: 'Editor: Fold' },
          { id: 'editor:unfold', name: 'Editor: Unfold' },
          { id: 'file:new', name: 'File: New' },
        ]),
      },
    };

    executor = new CommandExecutor(mockApp);
  });

  describe('execute', () => {
    it('should execute a command by id', () => {
      // Act
      executor.execute('editor:fold');

      // Assert
      expect(mockApp.commands.executeCommandById).toHaveBeenCalledWith('editor:fold');
    });

    it('should execute different commands', () => {
      // Act
      executor.execute('file:new');

      // Assert
      expect(mockApp.commands.executeCommandById).toHaveBeenCalledWith('file:new');
    });

    it('should return true when command exists', () => {
      // Act
      const result = executor.execute('editor:fold');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when command does not exist', () => {
      // Act
      const result = executor.execute('nonexistent:command');

      // Assert
      expect(result).toBe(false);
      expect(mockApp.commands.executeCommandById).not.toHaveBeenCalled();
    });

    it('should handle empty command id', () => {
      // Act
      const result = executor.execute('');

      // Assert
      expect(result).toBe(false);
      expect(mockApp.commands.executeCommandById).not.toHaveBeenCalled();
    });

    it('should handle executeCommandById throwing error', () => {
      // Arrange
      mockApp.commands.executeCommandById.mockImplementation(() => {
        throw new Error('Execution failed');
      });

      // Act
      const result = executor.execute('editor:fold');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('commandExists', () => {
    it('should return true for existing command', () => {
      // Act
      const exists = executor.commandExists('editor:fold');

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existing command', () => {
      // Act
      const exists = executor.commandExists('nonexistent:command');

      // Assert
      expect(exists).toBe(false);
    });

    it('should return false for empty id', () => {
      // Act
      const exists = executor.commandExists('');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('getCommandName', () => {
    it('should return command name for existing command', () => {
      // Act
      const name = executor.getCommandName('editor:fold');

      // Assert
      expect(name).toBe('Editor: Fold');
    });

    it('should return undefined for non-existing command', () => {
      // Act
      const name = executor.getCommandName('nonexistent:command');

      // Assert
      expect(name).toBeUndefined();
    });
  });

  describe('integration with button system', () => {
    it('should execute command from ButtonConfig.commandId', () => {
      // Arrange
      const buttonConfig = {
        id: 'custom-1',
        commandId: 'editor:fold',
        enabled: true,
      };

      // Act
      const result = executor.execute(buttonConfig.commandId!);

      // Assert
      expect(result).toBe(true);
      expect(mockApp.commands.executeCommandById).toHaveBeenCalledWith('editor:fold');
    });

    it('should handle undefined commandId gracefully', () => {
      // Arrange
      const buttonConfig = {
        id: 'custom-2',
        commandId: undefined,
        enabled: true,
      };

      // Act
      const result = executor.execute(buttonConfig.commandId || '');

      // Assert
      expect(result).toBe(false);
    });
  });
});
