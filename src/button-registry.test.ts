/**
 * ButtonRegistry - ボタン登録・管理システム テスト
 *
 * TDD: RED フェーズ
 * このテストは実装前に書かれています
 */

import { ButtonRegistry } from './button-registry';
import { ButtonConfig, RegisteredButton, QuickPopupSettings } from './types';

describe('ButtonRegistry - ボタン登録・管理システム', () => {
  let registry: ButtonRegistry;
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      app: {},
      manifest: {},
    };
    registry = new ButtonRegistry(mockPlugin);
  });

  describe('register', () => {
    it('should register a button with config and action', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const action = jest.fn();

      // Act
      registry.register('link', config, action);

      // Assert
      const button = registry.getButtonConfig('link');
      expect(button).toBeDefined();
      expect(button?.id).toBe('link');
      expect(button?.enabled).toBe(true);
    });

    it('should store action function with button', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };
      const action = jest.fn();

      // Act
      registry.register('copy', config, action);

      // Assert
      // Action should be executable (verified in executeAction tests)
      const button = registry.getButtonConfig('copy');
      expect(button).toBeDefined();
    });

    it('should allow multiple buttons to be registered', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      // Act
      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());

      // Assert
      expect(registry.getButtonConfig('link')).toBeDefined();
      expect(registry.getButtonConfig('copy')).toBeDefined();
    });

    it('should overwrite existing button with same id', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'link',
        enabled: false,
        displayType: 'icon',
        icon: '🔗',
        text: '',
        tooltip: 'Link (updated)',
        order: 1,
      };

      // Act
      registry.register('link', config1, jest.fn());
      registry.register('link', config2, jest.fn());

      // Assert
      const button = registry.getButtonConfig('link');
      expect(button?.enabled).toBe(false);
      expect(button?.tooltip).toBe('Link (updated)');
    });
  });

  describe('getEnabledButtons', () => {
    it('should return only enabled buttons', () => {
      // Arrange
      const enabledConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const disabledConfig: ButtonConfig = {
        id: 'copy',
        enabled: false,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      registry.register('link', enabledConfig, jest.fn());
      registry.register('copy', disabledConfig, jest.fn());

      // Act
      const enabledButtons = registry.getEnabledButtons();

      // Assert
      expect(enabledButtons.length).toBe(1);
      expect(enabledButtons[0].config.id).toBe('link');
    });

    it('should return enabled buttons sorted by order', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 2,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 0,
      };
      const config3: ButtonConfig = {
        id: 'split',
        enabled: true,
        displayType: 'icon',
        icon: '🧩',
        text: '',
        tooltip: 'Split text',
        order: 1,
      };

      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());
      registry.register('split', config3, jest.fn());

      // Act
      const enabledButtons = registry.getEnabledButtons();

      // Assert
      expect(enabledButtons.length).toBe(3);
      expect(enabledButtons[0].config.id).toBe('copy');
      expect(enabledButtons[1].config.id).toBe('split');
      expect(enabledButtons[2].config.id).toBe('link');
    });

    it('should return empty array when no buttons enabled', () => {
      // Arrange
      const disabledConfig: ButtonConfig = {
        id: 'link',
        enabled: false,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      registry.register('link', disabledConfig, jest.fn());

      // Act
      const enabledButtons = registry.getEnabledButtons();

      // Assert
      expect(enabledButtons.length).toBe(0);
    });

    it('should return empty array when no buttons registered', () => {
      // Act
      const enabledButtons = registry.getEnabledButtons();

      // Assert
      expect(enabledButtons).toEqual([]);
    });
  });

  describe('getAllButtons', () => {
    it('should return all buttons regardless of enabled state', () => {
      // Arrange
      const enabledConfig: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const disabledConfig: ButtonConfig = {
        id: 'copy',
        enabled: false,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      registry.register('link', enabledConfig, jest.fn());
      registry.register('copy', disabledConfig, jest.fn());

      // Act
      const allButtons = registry.getAllButtons();

      // Assert
      expect(allButtons.length).toBe(2);
    });

    it('should return all buttons sorted by order', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 2,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: false,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 0,
      };
      const config3: ButtonConfig = {
        id: 'split',
        enabled: true,
        displayType: 'icon',
        icon: '🧩',
        text: '',
        tooltip: 'Split text',
        order: 1,
      };

      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());
      registry.register('split', config3, jest.fn());

      // Act
      const allButtons = registry.getAllButtons();

      // Assert
      expect(allButtons.length).toBe(3);
      expect(allButtons[0].config.id).toBe('copy');
      expect(allButtons[1].config.id).toBe('split');
      expect(allButtons[2].config.id).toBe('link');
    });

    it('should return empty array when no buttons registered', () => {
      // Act
      const allButtons = registry.getAllButtons();

      // Assert
      expect(allButtons).toEqual([]);
    });
  });

  describe('executeAction', () => {
    it('should execute registered button action', async () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const action = jest.fn();

      registry.register('link', config, action);

      // Act
      await registry.executeAction('link', {} as any);

      // Assert
      expect(action).toHaveBeenCalledWith(mockPlugin);
    });

    it('should execute async action', async () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };
      const asyncAction = jest.fn(async () => {
        return new Promise((resolve) => setTimeout(resolve, 10));
      });

      registry.register('copy', config, asyncAction);

      // Act
      await registry.executeAction('copy', {} as any);

      // Assert
      expect(asyncAction).toHaveBeenCalledWith(mockPlugin);
    });

    it('should not throw when button id not found', async () => {
      // Act & Assert
      await expect(registry.executeAction('nonexistent', {} as any)).resolves.not.toThrow();
    });

    it('should pass plugin instance to action', async () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const action = jest.fn();

      registry.register('link', config, action);

      // Act
      await registry.executeAction('link', {} as any);

      // Assert
      expect(action).toHaveBeenCalledWith(mockPlugin);
      expect(action.mock.calls[0][0]).toBe(mockPlugin);
    });

    it('should execute correct action when multiple registered', async () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };
      const action1 = jest.fn();
      const action2 = jest.fn();

      registry.register('link', config1, action1);
      registry.register('copy', config2, action2);

      // Act
      await registry.executeAction('copy', {} as any);

      // Assert
      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalled();
    });
  });

  describe('updateConfigs', () => {
    it('should update button config from settings', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      registry.register('link', config, jest.fn());

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false,
            displayType: 'icon',
            icon: '🔗',
            text: '',
            tooltip: 'Link (updated)',
            order: 1,
          },
        },
        showSeparators: true,
      };

      // Act
      registry.updateConfigs(updatedSettings);

      // Assert
      const updated = registry.getButtonConfig('link');
      expect(updated?.enabled).toBe(false);
      expect(updated?.displayType).toBe('icon');
      expect(updated?.icon).toBe('🔗');
      expect(updated?.order).toBe(1);
    });

    it('should update multiple button configs', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 1,
          },
          copy: {
            id: 'copy',
            enabled: false,
            displayType: 'icon',
            icon: '📋',
            text: '',
            tooltip: 'Copy path',
            order: 0,
          },
        },
        showSeparators: true,
      };

      // Act
      registry.updateConfigs(updatedSettings);

      // Assert
      expect(registry.getButtonConfig('link')?.enabled).toBe(false);
      expect(registry.getButtonConfig('copy')?.enabled).toBe(false);
      expect(registry.getButtonConfig('link')?.order).toBe(1);
      expect(registry.getButtonConfig('copy')?.order).toBe(0);
    });

    it('should not update buttons not in settings', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());

      const partialSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false,
            displayType: 'text',
            icon: '[[]]',
            text: 'Link',
            tooltip: 'Convert to link',
            order: 1,
          },
        },
        showSeparators: true,
      };

      // Act
      registry.updateConfigs(partialSettings);

      // Assert
      expect(registry.getButtonConfig('link')?.enabled).toBe(false);
      expect(registry.getButtonConfig('copy')?.enabled).toBe(true); // Unchanged
    });

    it('should preserve action when updating config', async () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const action = jest.fn();

      registry.register('link', config, action);

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false,
            displayType: 'icon',
            icon: '🔗',
            text: '',
            tooltip: 'Link (updated)',
            order: 1,
          },
        },
        showSeparators: true,
      };

      // Act
      registry.updateConfigs(updatedSettings);
      await registry.executeAction('link', {} as any);

      // Assert
      expect(action).toHaveBeenCalled(); // Action still works after update
    });

    it('should handle empty settings gracefully', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      registry.register('link', config, jest.fn());

      const emptySettings: QuickPopupSettings = {
        version: 2,
        buttons: {},
        showSeparators: true,
      };

      // Act & Assert
      expect(() => {
        registry.updateConfigs(emptySettings);
      }).not.toThrow();

      // Original config should be unchanged
      expect(registry.getButtonConfig('link')?.enabled).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should remove a registered button', () => {
      const config: ButtonConfig = {
        id: 'custom-1',
        enabled: true,
        displayType: 'text',
        icon: '',
        text: 'Custom',
        tooltip: 'Custom button',
        order: 5,
        commandId: 'editor:fold',
      };
      registry.register('custom-1', config, jest.fn());

      // Act
      const result = registry.unregister('custom-1');

      // Assert
      expect(result).toBe(true);
      expect(registry.getButtonConfig('custom-1')).toBeUndefined();
    });

    it('should return false when button does not exist', () => {
      const result = registry.unregister('nonexistent');
      expect(result).toBe(false);
    });

    it('should not affect other buttons', () => {
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'custom-1',
        enabled: true,
        displayType: 'text',
        icon: '',
        text: 'Custom',
        tooltip: 'Custom',
        order: 5,
        commandId: 'editor:fold',
      };
      registry.register('link', config1, jest.fn());
      registry.register('custom-1', config2, jest.fn());

      registry.unregister('custom-1');

      expect(registry.getButtonConfig('link')).toBeDefined();
      expect(registry.getAllButtons().length).toBe(1);
    });

    it('should remove button from getEnabledButtons', () => {
      const config: ButtonConfig = {
        id: 'custom-1',
        enabled: true,
        displayType: 'text',
        icon: '',
        text: 'Custom',
        tooltip: 'Custom',
        order: 5,
        commandId: 'editor:fold',
      };
      registry.register('custom-1', config, jest.fn());

      expect(registry.getEnabledButtons().length).toBe(1);

      registry.unregister('custom-1');

      expect(registry.getEnabledButtons().length).toBe(0);
    });
  });

  describe('getButtonConfig', () => {
    it('should return button config for registered button', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      registry.register('link', config, jest.fn());

      // Act
      const result = registry.getButtonConfig('link');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('link');
      expect(result?.enabled).toBe(true);
    });

    it('should return undefined for unregistered button', () => {
      // Act
      const result = registry.getButtonConfig('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return updated config after updateConfigs', () => {
      // Arrange
      const config: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };

      registry.register('link', config, jest.fn());

      const updatedSettings: QuickPopupSettings = {
        version: 2,
        buttons: {
          link: {
            id: 'link',
            enabled: false,
            displayType: 'icon',
            icon: '🔗',
            text: '',
            tooltip: 'Link (updated)',
            order: 1,
          },
        },
        showSeparators: true,
      };

      registry.updateConfigs(updatedSettings);

      // Act
      const result = registry.getButtonConfig('link');

      // Assert
      expect(result?.enabled).toBe(false);
      expect(result?.icon).toBe('🔗');
    });

    it('should return correct config for specific button when multiple registered', () => {
      // Arrange
      const config1: ButtonConfig = {
        id: 'link',
        enabled: true,
        displayType: 'text',
        icon: '[[]]',
        text: 'Link',
        tooltip: 'Convert to link',
        order: 0,
      };
      const config2: ButtonConfig = {
        id: 'copy',
        enabled: true,
        displayType: 'icon',
        icon: '📋',
        text: '',
        tooltip: 'Copy path',
        order: 1,
      };

      registry.register('link', config1, jest.fn());
      registry.register('copy', config2, jest.fn());

      // Act
      const linkConfig = registry.getButtonConfig('link');
      const copyConfig = registry.getButtonConfig('copy');

      // Assert
      expect(linkConfig?.id).toBe('link');
      expect(copyConfig?.id).toBe('copy');
      expect(linkConfig?.icon).toBe('[[]]');
      expect(copyConfig?.icon).toBe('📋');
    });
  });
});
