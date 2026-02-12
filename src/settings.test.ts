/**
 * settings - 設定マイグレーション テスト
 *
 * TDD: RED フェーズ
 */

import { migrateSettings, DEFAULT_SETTINGS } from './settings';
import { QuickPopupSettings, ButtonConfig } from './types';

describe('migrateSettings - 設定マイグレーション', () => {
  describe('version 1 settings', () => {
    it('should return version 1 settings as-is', () => {
      const v1Settings: QuickPopupSettings = {
        version: 1,
        showSeparators: true,
        locale: 'en',
        buttons: {
          link: { ...DEFAULT_SETTINGS.buttons.link },
        },
      };

      const result = migrateSettings(v1Settings);

      expect(result.version).toBe(1);
      expect(result.buttons.link).toBeDefined();
    });
  });

  describe('empty/missing settings', () => {
    it('should return defaults for empty object', () => {
      const result = migrateSettings({});

      expect(result.version).toBe(1);
      expect(result.showSeparators).toBe(true);
      expect(Object.keys(result.buttons)).toEqual(['link', 'copy', 'cosense', 'split', 'highlight', 'dailynote']);
    });

    it('should return defaults for null', () => {
      const result = migrateSettings(null);

      expect(result.version).toBe(1);
    });

    it('should return defaults for undefined', () => {
      const result = migrateSettings(undefined);

      expect(result.version).toBe(1);
    });
  });

  describe('preserving custom buttons', () => {
    it('should preserve custom buttons during migration', () => {
      const settingsWithCustom = {
        version: 1,
        showSeparators: true,
        buttons: {
          ...DEFAULT_SETTINGS.buttons,
          'custom-123': {
            id: 'custom-123',
            enabled: true,
            displayType: 'text',
            icon: '',
            text: 'Fold',
            tooltip: 'Editor: Fold',
            order: 4,
            commandId: 'editor:fold',
          },
        },
      };

      const result = migrateSettings(settingsWithCustom);

      expect(result.buttons['custom-123']).toBeDefined();
      expect(result.buttons['custom-123'].commandId).toBe('editor:fold');
    });

    it('should preserve commandId on existing buttons', () => {
      const settings = {
        version: 1,
        showSeparators: false,
        buttons: {
          ...DEFAULT_SETTINGS.buttons,
          'custom-1': {
            id: 'custom-1',
            enabled: true,
            displayType: 'text',
            icon: '',
            text: 'Test',
            tooltip: 'Test command',
            order: 5,
            commandId: 'file:new',
          },
        },
      };

      const result = migrateSettings(settings);

      expect(result.buttons['custom-1'].commandId).toBe('file:new');
      expect(result.showSeparators).toBe(false);
    });
  });

  describe('removing deprecated hotkey field', () => {
    it('should remove hotkey field from buttons', () => {
      const oldSettings = {
        version: 1,
        showSeparators: true,
        buttons: {
          link: {
            ...DEFAULT_SETTINGS.buttons.link,
            hotkey: 'Ctrl+L',
          },
          copy: {
            ...DEFAULT_SETTINGS.buttons.copy,
            hotkey: 'Ctrl+C',
          },
        },
      };

      const result = migrateSettings(oldSettings);

      expect((result.buttons.link as any).hotkey).toBeUndefined();
      expect((result.buttons.copy as any).hotkey).toBeUndefined();
    });
  });

  describe('adding missing default buttons', () => {
    it('should add missing default buttons when some are missing', () => {
      const incompleteSettings = {
        version: 1,
        showSeparators: true,
        buttons: {
          link: DEFAULT_SETTINGS.buttons.link,
          // copy, cosense, split are missing
        },
      };

      const result = migrateSettings(incompleteSettings);

      expect(result.buttons.link).toBeDefined();
      expect(result.buttons.copy).toBeDefined();
      expect(result.buttons.cosense).toBeDefined();
      expect(result.buttons.split).toBeDefined();
    });

    it('should not overwrite user-modified default buttons', () => {
      const modifiedSettings = {
        version: 1,
        showSeparators: true,
        buttons: {
          link: {
            ...DEFAULT_SETTINGS.buttons.link,
            text: 'My Custom Link Text',
            icon: '💎',
          },
        },
      };

      const result = migrateSettings(modifiedSettings);

      expect(result.buttons.link.text).toBe('My Custom Link Text');
      expect(result.buttons.link.icon).toBe('💎');
    });
  });

  describe('deep copy', () => {
    it('should not mutate the input settings', () => {
      const original = {
        version: 1,
        showSeparators: true,
        buttons: {
          link: { ...DEFAULT_SETTINGS.buttons.link },
        },
      };
      const originalJson = JSON.stringify(original);

      migrateSettings(original);

      expect(JSON.stringify(original)).toBe(originalJson);
    });
  });
});
