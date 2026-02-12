/**
 * i18n - 多言語対応テスト
 *
 * TDD: RED フェーズ
 */

import { I18n, translations } from './i18n';

describe('I18n - 多言語対応', () => {
  describe('translations', () => {
    it('should have English translations', () => {
      expect(translations.en).toBeDefined();
    });

    it('should have Japanese translations', () => {
      expect(translations.ja).toBeDefined();
    });

    it('should have same keys in both languages', () => {
      const enKeys = Object.keys(translations.en).sort();
      const jaKeys = Object.keys(translations.ja).sort();
      expect(enKeys).toEqual(jaKeys);
    });
  });

  describe('I18n.t()', () => {
    it('should return English text by default', () => {
      const i18n = new I18n('en');
      expect(i18n.t('globalSettings')).toBe('Global Settings');
    });

    it('should return Japanese text when locale is ja', () => {
      const i18n = new I18n('ja');
      expect(i18n.t('globalSettings')).toBe('全体設定');
    });

    it('should return key when translation not found', () => {
      const i18n = new I18n('en');
      expect(i18n.t('nonexistent' as any)).toBe('nonexistent');
    });
  });

  describe('setLocale', () => {
    it('should switch language', () => {
      const i18n = new I18n('en');
      expect(i18n.t('buttonSettings')).toBe('Button Settings');

      i18n.setLocale('ja');
      expect(i18n.t('buttonSettings')).toBe('ボタン設定');
    });

    it('should fall back to en for unknown locale', () => {
      const i18n = new I18n('fr' as any);
      expect(i18n.t('globalSettings')).toBe('Global Settings');
    });
  });

  describe('settings UI strings', () => {
    it('should have showSeparators translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('showSeparators')).toBe('Show separators');
      expect(ja.t('showSeparators')).toBeTruthy();
    });

    it('should have button setting translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('displayType')).toBe('Display type');
      expect(ja.t('displayType')).toBeTruthy();

      expect(en.t('deleteButton')).toBe('Delete button');
      expect(ja.t('deleteButton')).toBeTruthy();
    });

    it('should have add button translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('addNewButton')).toBe('Add new button');
      expect(ja.t('addNewButton')).toBeTruthy();
    });
  });

  describe('notice strings', () => {
    it('should have notice translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('noTextSelected')).toBe('No text selected');
      expect(ja.t('noTextSelected')).toBeTruthy();

      expect(en.t('textSplit')).toBe('Text split into paragraphs');
      expect(ja.t('textSplit')).toBeTruthy();

      expect(en.t('failedToCreateNote')).toBe('Failed to create note');
      expect(ja.t('failedToCreateNote')).toBeTruthy();
    });
  });

  describe('command selector strings', () => {
    it('should have command selector translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('selectCommand')).toBe('Select command');
      expect(ja.t('selectCommand')).toBe('コマンドを選択');

      expect(en.t('searchCommands')).toBe('Search commands...');
      expect(ja.t('searchCommands')).toBe('コマンドを検索...');

      expect(en.t('noMatchingCommands')).toBe('No matching commands');
      expect(ja.t('noMatchingCommands')).toBe('該当するコマンドがありません');
    });
  });

  describe('interpolation', () => {
    it('should interpolate values with {{key}}', () => {
      const en = new I18n('en');
      expect(en.t('copiedPath', { path: '@file.md:10' })).toBe('Copied: @file.md:10');
    });

    it('should interpolate in Japanese', () => {
      const ja = new I18n('ja');
      expect(ja.t('copiedPath', { path: '@file.md:10' })).toBe('コピー済み: @file.md:10');
    });

    it('should interpolate createdNote', () => {
      const en = new I18n('en');
      expect(en.t('createdNote', { fileName: 'test.md' })).toBe('Created note: test.md');
    });

    it('should interpolate position', () => {
      const en = new I18n('en');
      expect(en.t('position', { n: '3' })).toBe('Position: 3');
    });
  });

  describe('language setting string', () => {
    it('should have language setting translations', () => {
      const en = new I18n('en');
      const ja = new I18n('ja');

      expect(en.t('language')).toBe('Language');
      expect(ja.t('language')).toBe('言語');
    });
  });
});
