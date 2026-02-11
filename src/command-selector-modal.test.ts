/**
 * CommandSelectorModal - コマンド選択モーダルテスト
 *
 * TDD: RED フェーズ
 * このテストは実装前に書かれています
 */

import { CommandSelectorModal } from './command-selector-modal';
import { ObsidianCommand } from './types';

describe('CommandSelectorModal - コマンド選択モーダル', () => {
  let modal: CommandSelectorModal;
  let mockApp: any;
  let mockOnSelect: jest.Mock;

  beforeEach(() => {
    // Mock Obsidian App
    mockApp = {
      commands: {
        commands: {
          'editor:fold': {
            id: 'editor:fold',
            name: 'Editor: Fold',
          },
          'editor:unfold': {
            id: 'editor:unfold',
            name: 'Editor: Unfold',
          },
          'editor:copy': {
            id: 'editor:copy',
            name: 'Editor: Copy',
          },
          'file:new': {
            id: 'file:new',
            name: 'File: New',
          },
        },
        listCommands: jest.fn(() => [
          { id: 'editor:fold', name: 'Editor: Fold' },
          { id: 'editor:unfold', name: 'Editor: Unfold' },
          { id: 'editor:copy', name: 'Editor: Copy' },
          { id: 'file:new', name: 'File: New' },
        ]),
      },
    };

    mockOnSelect = jest.fn();
    modal = new CommandSelectorModal(mockApp, mockOnSelect);
  });

  describe('initialization', () => {
    it('should create modal with app and callback', () => {
      // Assert
      expect(modal).toBeDefined();
      expect(modal.app).toBe(mockApp);
    });

    it('should store onSelect callback', () => {
      // Arrange
      const callback = jest.fn();
      const testModal = new CommandSelectorModal(mockApp, callback);

      // Assert
      expect(testModal).toBeDefined();
    });
  });

  describe('getAllCommands', () => {
    it('should return all available Obsidian commands', () => {
      // Act
      const commands = modal.getAllCommands();

      // Assert
      expect(commands.length).toBeGreaterThan(0);
      expect(commands).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'editor:fold', name: 'Editor: Fold' }),
        ])
      );
    });

    it('should return commands as ObsidianCommand objects', () => {
      // Act
      const commands = modal.getAllCommands();

      // Assert
      commands.forEach((cmd) => {
        expect(cmd).toHaveProperty('id');
        expect(cmd).toHaveProperty('name');
        expect(typeof cmd.id).toBe('string');
        expect(typeof cmd.name).toBe('string');
      });
    });

    it('should handle empty command list', () => {
      // Arrange
      mockApp.commands.listCommands = jest.fn(() => []);

      // Act
      const commands = modal.getAllCommands();

      // Assert
      expect(commands).toEqual([]);
    });
  });

  describe('filterCommands', () => {
    it('should filter commands by search query', () => {
      // Arrange
      const query = 'fold';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(2); // "Editor: Fold" and "Editor: Unfold"
      expect(filtered).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'editor:fold' }),
          expect.objectContaining({ id: 'editor:unfold' }),
        ])
      );
    });

    it('should filter case-insensitively', () => {
      // Arrange
      const query = 'FOLD';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(2);
    });

    it('should return all commands when query is empty', () => {
      // Arrange
      const query = '';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(4); // All commands
    });

    it('should match against command name', () => {
      // Arrange
      const query = 'Editor';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(3); // "Editor: Fold", "Editor: Unfold", "Editor: Copy"
    });

    it('should match against command id', () => {
      // Arrange
      const query = 'file:new';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('file:new');
    });

    it('should return empty array when no matches', () => {
      // Arrange
      const query = 'nonexistent';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered).toEqual([]);
    });

    it('should handle special characters in query', () => {
      // Arrange
      const query = 'file:';

      // Act
      const filtered = modal.filterCommands(query);

      // Assert
      expect(filtered.length).toBe(1);
    });
  });

  describe('selectCommand', () => {
    it('should call onSelect callback with selected command', () => {
      // Arrange
      const command: ObsidianCommand = {
        id: 'editor:fold',
        name: 'Editor: Fold',
      };

      // Act
      modal.selectCommand(command);

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith(command);
    });

    it('should close modal after selection', () => {
      // Arrange
      const command: ObsidianCommand = {
        id: 'editor:fold',
        name: 'Editor: Fold',
      };
      modal.close = jest.fn();

      // Act
      modal.selectCommand(command);

      // Assert
      expect(modal.close).toHaveBeenCalled();
    });

    it('should handle command with icon', () => {
      // Arrange
      const command: ObsidianCommand = {
        id: 'editor:fold',
        name: 'Editor: Fold',
        icon: 'fold-vertical',
      };

      // Act
      modal.selectCommand(command);

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith(command);
    });
  });

  describe('keyboard navigation', () => {
    it('should support arrow down navigation', () => {
      // Arrange
      modal.selectedIndex = 0;

      // Act
      modal.moveSelection('down');

      // Assert
      expect(modal.selectedIndex).toBe(1);
    });

    it('should support arrow up navigation', () => {
      // Arrange
      modal.selectedIndex = 2;

      // Act
      modal.moveSelection('up');

      // Assert
      expect(modal.selectedIndex).toBe(1);
    });

    it('should wrap around at bottom when moving down', () => {
      // Arrange
      const commands = modal.filterCommands('');
      modal.selectedIndex = commands.length - 1;

      // Act
      modal.moveSelection('down');

      // Assert
      expect(modal.selectedIndex).toBe(0);
    });

    it('should wrap around at top when moving up', () => {
      // Arrange
      modal.selectedIndex = 0;

      // Act
      modal.moveSelection('up');

      // Assert
      const commands = modal.filterCommands('');
      expect(modal.selectedIndex).toBe(commands.length - 1);
    });

    it('should handle Enter key to select current item', () => {
      // Arrange
      modal.selectedIndex = 1;
      const commands = modal.filterCommands('');
      modal.selectCommand = jest.fn();

      // Act
      modal.handleEnterKey();

      // Assert
      expect(modal.selectCommand).toHaveBeenCalledWith(commands[1]);
    });
  });

  describe('search functionality', () => {
    it('should update filtered commands when search query changes', () => {
      // Arrange
      modal.setSearchQuery('fold');

      // Act
      const filtered = modal.getFilteredCommands();

      // Assert
      expect(filtered.length).toBe(2);
    });

    it('should reset selection when search query changes', () => {
      // Arrange
      modal.selectedIndex = 3;

      // Act
      modal.setSearchQuery('fold');

      // Assert
      expect(modal.selectedIndex).toBe(0);
    });

    it('should handle rapid search query changes', () => {
      // Act
      modal.setSearchQuery('e');
      modal.setSearchQuery('ed');
      modal.setSearchQuery('edi');
      modal.setSearchQuery('edit');

      // Assert
      const filtered = modal.getFilteredCommands();
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty app.commands.commands', () => {
      // Arrange
      mockApp.commands.commands = {};
      mockApp.commands.listCommands = jest.fn(() => []);

      // Act
      const commands = modal.getAllCommands();

      // Assert
      expect(commands).toEqual([]);
    });

    it('should handle null onSelect callback gracefully', () => {
      // Arrange
      const modalWithoutCallback = new CommandSelectorModal(mockApp, null as any);
      const command: ObsidianCommand = {
        id: 'editor:fold',
        name: 'Editor: Fold',
      };

      // Act & Assert
      expect(() => {
        modalWithoutCallback.selectCommand(command);
      }).not.toThrow();
    });

    it('should handle very long command names', () => {
      // Arrange
      const longCommand = {
        id: 'test:long',
        name: 'A'.repeat(200),
      };
      mockApp.commands.listCommands = jest.fn(() => [longCommand]);

      // Act
      const commands = modal.getAllCommands();

      // Assert
      expect(commands[0].name.length).toBe(200);
    });

    it('should handle special characters in command names', () => {
      // Arrange
      const specialCommand = {
        id: 'test:special',
        name: 'Command: [Special] (Characters) & More',
      };
      mockApp.commands.listCommands = jest.fn(() => [specialCommand]);

      // Act
      const commands = modal.getAllCommands();
      const filtered = modal.filterCommands('[Special]');

      // Assert
      expect(filtered.length).toBe(1);
    });
  });

  describe('performance', () => {
    it('should handle large number of commands efficiently', () => {
      // Arrange
      const largeCommandList = Array.from({ length: 1000 }, (_, i) => ({
        id: `command:${i}`,
        name: `Command ${i}`,
      }));
      mockApp.commands.listCommands = jest.fn(() => largeCommandList);

      // Act
      const start = Date.now();
      const commands = modal.getAllCommands();
      const filtered = modal.filterCommands('500');
      const duration = Date.now() - start;

      // Assert
      expect(commands.length).toBe(1000);
      expect(filtered.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
