/**
 * Web Actions - Webブラウザビューでのボタンアクション テスト
 *
 * TDD: RED → GREEN
 */

import { WebActions } from './web-actions';

// moment モック
const mockMoment = {
  format: jest.fn((fmt: string) => {
    if (fmt === 'HH:mm') return '19:10';
    if (fmt === 'YYYY-MM-DD') return '2026-02-12';
    return '2026-02-12';
  }),
};

describe('WebActions - Webブラウザビューアクション', () => {
  describe('formatThinoEntry', () => {
    it('should format text in Thino style: - HH:mm text', () => {
      const result = WebActions.formatThinoEntry('ハイライト文字', mockMoment as any);
      expect(result).toBe('- 19:10 ハイライト文字');
    });

    it('should handle multi-line text', () => {
      const result = WebActions.formatThinoEntry('line1\nline2', mockMoment as any);
      expect(result).toBe('- 19:10 line1\nline2');
    });

    it('should handle empty text', () => {
      const result = WebActions.formatThinoEntry('', mockMoment as any);
      expect(result).toBe('- 19:10 ');
    });

    it('should trim trailing whitespace from text', () => {
      const result = WebActions.formatThinoEntry('  text with spaces  ', mockMoment as any);
      expect(result).toBe('- 19:10 text with spaces');
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace unsafe characters', () => {
      const result = WebActions.sanitizeFileName('file/name:with*bad?chars');
      expect(result).toBe('file-name-with-bad-chars');
    });

    it('should truncate to 50 characters', () => {
      const longName = 'a'.repeat(80);
      const result = WebActions.sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should trim whitespace', () => {
      const result = WebActions.sanitizeFileName('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should handle empty string', () => {
      const result = WebActions.sanitizeFileName('');
      expect(result).toBe('Untitled');
    });

    it('should use first line only', () => {
      const result = WebActions.sanitizeFileName('first line\nsecond line');
      expect(result).toBe('first line');
    });
  });

  describe('getNewFilePath', () => {
    it('should create path in specified folder', () => {
      const result = WebActions.getNewFilePath('My Note', 'Notes');
      expect(result).toBe('Notes/My Note.md');
    });

    it('should handle root folder (empty string)', () => {
      const result = WebActions.getNewFilePath('My Note', '');
      expect(result).toBe('My Note.md');
    });

    it('should handle folder with trailing slash', () => {
      const result = WebActions.getNewFilePath('My Note', 'Notes/');
      expect(result).toBe('Notes/My Note.md');
    });

    it('should sanitize the filename', () => {
      const result = WebActions.getNewFilePath('Bad:Name', 'Notes');
      expect(result).toBe('Notes/Bad-Name.md');
    });
  });

  describe('buildDailyContent', () => {
    it('should append Thino entry to existing content', () => {
      const existing = '# 2026-02-12\n\n- 10:00 earlier entry';
      const result = WebActions.buildDailyContent(existing, 'new highlight', mockMoment as any);
      expect(result).toBe('# 2026-02-12\n\n- 10:00 earlier entry\n- 19:10 new highlight');
    });

    it('should handle empty existing content', () => {
      const result = WebActions.buildDailyContent('', 'first entry', mockMoment as any);
      expect(result).toBe('\n- 19:10 first entry');
    });

    it('should not add extra blank lines', () => {
      const existing = '# 2026-02-12\n\n- 10:00 entry\n';
      const result = WebActions.buildDailyContent(existing, 'new', mockMoment as any);
      // Should not have double newlines before the entry
      expect(result).not.toContain('\n\n\n');
    });
  });

  describe('buildNoteContent', () => {
    it('should create note with selected text as content', () => {
      const result = WebActions.buildNoteContent('Selected text from web');
      expect(result).toContain('Selected text from web');
    });

    it('should include source URL when provided', () => {
      const result = WebActions.buildNoteContent('Some text', 'https://example.com');
      expect(result).toContain('https://example.com');
    });

    it('should work without source URL', () => {
      const result = WebActions.buildNoteContent('Some text');
      expect(result).not.toContain('Source');
    });
  });
});
