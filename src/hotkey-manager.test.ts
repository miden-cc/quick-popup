/**
 * HotkeyManager - キーボードショートカット管理テスト
 *
 * TDD: RED フェーズ
 * このテストは実装前に書かれています
 */

import { HotkeyManager } from './hotkey-manager';
import { QuickPopupSettings, ButtonConfig } from './types';

describe('HotkeyManager - キーボードショートカット管理', () => {
  let hotkeyManager: HotkeyManager;
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      settings: {
        version: 2,
        buttons: {},
        showSeparators: true,
      },
      addCommand: jest.fn(),
      app: {
        commands: {
          commands: {},
        },
      },
      buttonRegistry: {
        executeAction: jest.fn(),
      },
    };

    hotkeyManager = new HotkeyManager(mockPlugin);
  });

  describe('parseHotkey', () => {
    it('should parse single character hotkey', () => {
      // Arrange
      const hotkeyStr = 'L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('l');
      expect(result.modifiers).toEqual([]);
    });

    it('should parse hotkey with Ctrl modifier', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('l');
      expect(result.modifiers).toContain('Ctrl');
    });

    it('should parse hotkey with multiple modifiers', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+Shift+L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('l');
      expect(result.modifiers).toContain('Ctrl');
      expect(result.modifiers).toContain('Shift');
      expect(result.modifiers.length).toBe(2);
    });

    it('should normalize modifier case to Obsidian format', () => {
      // Arrange
      const hotkeyStr = 'ctrl+shift+l';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.modifiers[0]).toBe('Ctrl');
      expect(result.modifiers[1]).toBe('Shift');
    });

    it('should handle Cmd modifier (macOS)', () => {
      // Arrange
      const hotkeyStr = 'Cmd+L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.modifiers).toContain('Cmd');
      expect(result.key).toBe('l');
    });

    it('should handle Alt modifier', () => {
      // Arrange
      const hotkeyStr = 'Alt+A';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.modifiers).toContain('Alt');
      expect(result.key).toBe('a');
    });

    it('should parse multi-character key names', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+Enter';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('Enter');
      expect(result.modifiers).toContain('Ctrl');
    });

    it('should handle special key names', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+Tab';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('Tab');
      expect(result.modifiers).toContain('Ctrl');
    });

    it('should lowercase single-character keys', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+K';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('k');
    });

    it('should preserve case for multi-character keys', () => {
      // Arrange
      const hotkeyStr = 'Shift+Arrow';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('Arrow');
    });

    it('should handle mixed case modifiers', () => {
      // Arrange
      const hotkeyStr = 'cTrL+sHiFt+L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.modifiers[0]).toBe('Ctrl');
      expect(result.modifiers[1]).toBe('Shift');
      expect(result.key).toBe('l');
    });
  });

  describe('registerAllHotkeys', () => {
    it('should register hotkey for enabled button with hotkey', () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+L',
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(mockPlugin.addCommand).toHaveBeenCalled();
      const commandCall = mockPlugin.addCommand.mock.calls[0][0];
      expect(commandCall.id).toBe('quick-popup-link');
      expect(commandCall.name).toBe('Quick Popup: Convert to link');
    });

    it('should not register hotkey for disabled button', () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: false,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+L',
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should not register hotkey when hotkey not defined', () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should register multiple hotkeys', () => {
      // Arrange
      const button1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+L',
      };
      const button2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
        hotkey: 'Ctrl+C',
      };

      mockPlugin.settings.buttons = { link: button1, copy: button2 };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(mockPlugin.addCommand).toHaveBeenCalledTimes(2);
    });

    it('should create editorCallback that executes button action', async () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+L',
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();
      const command = mockPlugin.addCommand.mock.calls[0][0];
      const mockEditor = {};
      await command.editorCallback(mockEditor);

      // Assert
      expect(mockPlugin.buttonRegistry.executeAction).toHaveBeenCalledWith(
        'link',
        mockEditor
      );
    });

    it('should skip buttons without both hotkey and enabled state', () => {
      // Arrange
      const button1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        // no hotkey
      };
      const button2: ButtonConfig = {
        id: 'copy',
        enabled: false,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
        hotkey: 'Ctrl+C',
      };

      mockPlugin.settings.buttons = { link: button1, copy: button2 };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should handle empty settings', () => {
      // Arrange
      mockPlugin.settings.buttons = {};

      // Act & Assert
      expect(() => {
        hotkeyManager.registerAllHotkeys();
      }).not.toThrow();

      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should set command hotkeys array correctly', () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+Shift+L',
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      const command = mockPlugin.addCommand.mock.calls[0][0];
      expect(Array.isArray(command.hotkeys)).toBe(true);
      expect(command.hotkeys.length).toBe(1);
      expect(command.hotkeys[0].modifiers).toContain('Ctrl');
      expect(command.hotkeys[0].modifiers).toContain('Shift');
    });
  });

  describe('updateHotkeys', () => {
    it('should remove old commands before registering new ones', () => {
      // Arrange
      const settings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L',
          },
        },
        showSeparators: true,
      };

      // First, register a hotkey
      hotkeyManager.registerAllHotkeys();
      mockPlugin.addCommand.mockClear();

      // Act
      hotkeyManager.updateHotkeys(settings);

      // Assert
      expect(mockPlugin.addCommand).toHaveBeenCalled();
    });

    it('should update hotkey from settings', () => {
      // Arrange
      const initialSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L',
          },
        },
        showSeparators: true,
      };

      mockPlugin.settings = initialSettings;
      hotkeyManager.registerAllHotkeys();
      mockPlugin.addCommand.mockClear();

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link (updated)',
            order: 0,
            hotkey: 'Ctrl+Shift+L',
          },
        },
        showSeparators: true,
      };

      // Act
      hotkeyManager.updateHotkeys(updatedSettings);

      // Assert
      expect(mockPlugin.addCommand).toHaveBeenCalled();
      const command = mockPlugin.addCommand.mock.calls[0][0];
      expect(command.hotkeys[0].modifiers).toContain('Shift');
    });

    it('should handle removing hotkey from button', () => {
      // Arrange
      const initialSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L',
          },
        },
        showSeparators: true,
      };

      mockPlugin.settings = initialSettings;
      hotkeyManager.registerAllHotkeys();
      mockPlugin.addCommand.mockClear();

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            // hotkey removed
          },
        },
        showSeparators: true,
      };

      // Act
      hotkeyManager.updateHotkeys(updatedSettings);

      // Assert
      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should handle disabling button with hotkey', () => {
      // Arrange
      const initialSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L',
          },
        },
        showSeparators: true,
      };

      mockPlugin.settings = initialSettings;
      hotkeyManager.registerAllHotkeys();
      mockPlugin.addCommand.mockClear();

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false, // disabled
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L',
          },
        },
        showSeparators: true,
      };

      // Act
      hotkeyManager.updateHotkeys(updatedSettings);

      // Assert
      expect(mockPlugin.addCommand).not.toHaveBeenCalled();
    });

    it('should add new hotkey in update', () => {
      // Arrange
      const initialSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            // no hotkey initially
          },
          copy: {
            id: 'copy',
            enabled: true,
            displayType: 'icon',
            icon: '📋',
            text: '',
            tooltip: 'Copy path',
            order: 1,
          },
        },
        showSeparators: true,
      };

      mockPlugin.settings = initialSettings;
      hotkeyManager.registerAllHotkeys();
      mockPlugin.addCommand.mockClear();

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: true,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 0,
            hotkey: 'Ctrl+L', // hotkey added
          },
          copy: {
            id: 'copy',
            enabled: true,
            displayType: 'icon',
            icon: '📋',
            text: '',
            tooltip: 'Copy path',
            order: 1,
          },
        },
        showSeparators: true,
      };

      // Act
      hotkeyManager.updateHotkeys(updatedSettings);

      // Assert
      expect(mockPlugin.addCommand).toHaveBeenCalled();
      const command = mockPlugin.addCommand.mock.calls[0][0];
      expect(command.id).toBe('quick-popup-link');
    });

    it('should handle command deletion gracefully', () => {
      // Arrange
      const settings: QuickPopupSettings = {
        version: 2,
        buttons: {},
        showSeparators: true,
      };

      mockPlugin.settings.buttons = {
        link: {
          id: 'link',
          enabled: true,
          displayType: 'text',
          icon: '[[]]',
          text: 'Link',
          tooltip: 'Convert to link',
          order: 0,
          hotkey: 'Ctrl+L',
        },
      };

      hotkeyManager.registerAllHotkeys();

      // Make deletion throw to simulate edge case
      mockPlugin.app.commands.commands = null;

      // Act & Assert
      expect(() => {
        hotkeyManager.updateHotkeys(settings);
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle button with all modifiers', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+Shift+Alt+L';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.modifiers).toHaveLength(3);
      expect(result.modifiers).toContain('Ctrl');
      expect(result.modifiers).toContain('Shift');
      expect(result.modifiers).toContain('Alt');
      expect(result.key).toBe('l');
    });

    it('should handle arrow keys', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+ArrowUp';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('ArrowUp');
      expect(result.modifiers).toContain('Ctrl');
    });

    it('should handle function keys', () => {
      // Arrange
      const hotkeyStr = 'Shift+F1';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('F1');
      expect(result.modifiers).toContain('Shift');
    });

    it('should handle spaces in key names', () => {
      // Arrange
      const hotkeyStr = 'Ctrl+Space';

      // Act
      const result = hotkeyManager.parseHotkey(hotkeyStr);

      // Assert
      expect(result.key).toBe('Space');
      expect(result.modifiers).toContain('Ctrl');
    });
  });

  describe('error handling', () => {
    it('should handle invalid hotkey gracefully in registerAllHotkeys', () => {
      // Arrange
      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: '', // empty hotkey
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act & Assert
      expect(() => {
        hotkeyManager.registerAllHotkeys();
      }).not.toThrow();
    });

    it('should log error when plugin.addCommand fails', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPlugin.addCommand.mockImplementation(() => {
        throw new Error('Command registration failed');
      });

      const buttonConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
        hotkey: 'Ctrl+L',
      };

      mockPlugin.settings.buttons = { link: buttonConfig };

      // Act
      hotkeyManager.registerAllHotkeys();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle null or undefined in updateHotkeys', () => {
      // Arrange
      const settings: QuickPopupSettings = {
        version: 2,
        buttons: {},
        showSeparators: true,
      };

      // Act & Assert
      expect(() => {
        hotkeyManager.updateHotkeys(settings);
      }).not.toThrow();
    });
  });
});
