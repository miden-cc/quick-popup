/**
 * SelectionHandler - テキスト選択処理テスト
 *
 * TDD: RED フェーズ
 */

import { SelectionHandler } from './selection-handler';
import { Editor } from 'obsidian';

describe('SelectionHandler - テキスト選択処理', () => {
  let handler: SelectionHandler;
  let mockEditor: Partial<Editor>;

  beforeEach(() => {
    handler = new SelectionHandler();

    // Mock Editor
    mockEditor = {
      getSelection: jest.fn(() => 'selected text'),
      replaceSelection: jest.fn(),
      setCursor: jest.fn(),
      getCursor: jest.fn(() => ({ line: 0, ch: 10 })),
    };

    handler.setEditor(mockEditor as Editor);
  });

  describe('getSelectedText', () => {
    it('should return selected text from editor', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('Hello, World!');

      // Act
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('Hello, World!');
      expect(mockEditor.getSelection).toHaveBeenCalled();
    });

    it('should return empty string when no selection', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('');

      // Act
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('');
    });
  });

  describe('hasValidSelection', () => {
    it('should return true when text is selected', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('some text');

      // Act
      const result = handler.hasValidSelection();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when no text is selected', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('');

      // Act
      const result = handler.hasValidSelection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when only whitespace is selected', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('   ');

      // Act
      const result = handler.hasValidSelection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when whitespace and text are mixed', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('  text  ');

      // Act
      const result = handler.hasValidSelection();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('convertToLink', () => {
    it('should wrap selected text with [[...]]', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('my note');

      // Act
      handler.convertToLink();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('[[my note]]');
    });

    it('should handle text that already has brackets', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('[[already linked]]');

      // Act
      handler.convertToLink();

      // Assert
      // Should remove existing brackets and re-wrap
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('[[already linked]]');
    });

    it('should handle text with mixed brackets', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('[[partial] link]');

      // Act
      handler.convertToLink();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalled();
      const call = (mockEditor.replaceSelection as jest.Mock).mock.calls[0][0];
      expect(call).toMatch(/^\[\[.*\]\]$/);
    });

    it('should insert empty brackets when no text selected', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('');
      (mockEditor.getCursor as jest.Mock).mockReturnValue({ line: 0, ch: 5 });

      // Act
      handler.convertToLink();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('[[]]');
      expect(mockEditor.setCursor).toHaveBeenCalled();
    });

    it('should position cursor inside empty brackets', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('');
      const cursorPos = { line: 0, ch: 5 };
      (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPos);

      // Act
      handler.convertToLink();

      // Assert
      expect(mockEditor.setCursor).toHaveBeenCalledWith({
        line: cursorPos.line,
        ch: cursorPos.ch + 2, // After [[
      });
    });
  });

  describe('removeFormattingAndLinks', () => {
    it('should remove [[...]] wrapping', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('[[link]]');

      // Act
      handler.removeFormattingAndLinks();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('link');
    });

    it('should remove markdown formatting', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('**bold** _italic_ ~~strike~~');

      // Act
      handler.removeFormattingAndLinks();

      // Assert
      const call = (mockEditor.replaceSelection as jest.Mock).mock.calls[0][0];
      expect(call).toBe('bold italic strike');
    });

    it('should remove code formatting', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('`code` and `more`');

      // Act
      handler.removeFormattingAndLinks();

      // Assert
      const call = (mockEditor.replaceSelection as jest.Mock).mock.calls[0][0];
      expect(call).toBe('code and more');
    });

    it('should handle complex formatting', () => {
      // Arrange
      const text = '[[**bold link**]] and _[[italic]]_';
      (mockEditor.getSelection as jest.Mock).mockReturnValue(text);

      // Act
      handler.removeFormattingAndLinks();

      // Assert
      const call = (mockEditor.replaceSelection as jest.Mock).mock.calls[0][0];
      expect(call).toBe('bold link and italic');
    });

    it('should not modify plain text', () => {
      // Arrange
      const text = 'plain text without formatting';
      (mockEditor.getSelection as jest.Mock).mockReturnValue(text);

      // Act
      handler.removeFormattingAndLinks();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith(text);
    });
  });

  describe('getSelectionRect', () => {
    it('should return DOMRect of selected text', () => {
      // Arrange
      const mockSelection = {
        toString: jest.fn(() => 'selected'),
        rangeCount: 1,
        getRangeAt: jest.fn(() => ({
          getBoundingClientRect: jest.fn(() => ({
            top: 100,
            left: 50,
            width: 100,
            height: 20,
            bottom: 120,
            right: 150,
          })),
        })),
      };

      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      const rect = handler.getSelectionRect();

      // Assert
      expect(rect).not.toBeNull();
      expect(rect?.top).toBe(100);
      expect(rect?.left).toBe(50);

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });

    it('should return null when no selection', () => {
      // Arrange
      jest.spyOn(window, 'getSelection').mockReturnValue(null as any);

      // Act
      const rect = handler.getSelectionRect();

      // Assert
      expect(rect).toBeNull();

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });

    it('should return null when empty selection', () => {
      // Arrange
      const mockSelection = {
        toString: jest.fn(() => ''),
        rangeCount: 0,
      };

      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      const rect = handler.getSelectionRect();

      // Assert
      expect(rect).toBeNull();

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });
  });

  describe('getCursorRect', () => {
    it('should return cursor position rect', () => {
      // Arrange
      let dummyElement: HTMLElement | null = null;
      const mockRange = {
        insertNode: jest.fn((node: HTMLElement) => {
          dummyElement = node;
        }),
        removeChild: jest.fn(),
      };

      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jest.fn(() => mockRange),
      };

      // Mock getBoundingClientRect to return after insertNode
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        value: jest.fn(function() {
          return {
            top: 100,
            left: 50,
            width: 0,
            height: 20,
            bottom: 120,
            right: 50,
          };
        }),
        configurable: true,
      });

      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      const rect = handler.getCursorRect();

      // Assert
      expect(rect).not.toBeNull();

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });

    it('should return null when no selection', () => {
      // Arrange
      jest.spyOn(window, 'getSelection').mockReturnValue(null as any);

      // Act
      const rect = handler.getCursorRect();

      // Assert
      expect(rect).toBeNull();

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });
  });

  describe('toggleHighlight', () => {
    it('should add == markers to selected text', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('important text');

      // Act
      handler.toggleHighlight();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('==important text==');
    });

    it('should remove == markers from already highlighted text', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('==highlighted==');

      // Act
      handler.toggleHighlight();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('highlighted');
    });

    it('should do nothing when no editor is set', () => {
      // Arrange
      handler.setEditor(null as any);

      // Act
      handler.toggleHighlight();

      // Assert
      expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
    });

    it('should do nothing when no text is selected', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('');

      // Act
      handler.toggleHighlight();

      // Assert
      expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
    });

    it('should handle text with == inside but not wrapping', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('a == b');

      // Act
      handler.toggleHighlight();

      // Assert
      expect(mockEditor.replaceSelection).toHaveBeenCalledWith('==a == b==');
    });
  });

  describe('formatAsLink', () => {
    it('should wrap plain text with [[...]]', () => {
      const result = handler.formatAsLink('my note');
      expect(result).toBe('[[my note]]');
    });

    it('should clean existing brackets before wrapping', () => {
      const result = handler.formatAsLink('[[already linked]]');
      expect(result).toBe('[[already linked]]');
    });

    it('should handle partial brackets', () => {
      const result = handler.formatAsLink('[partial]');
      expect(result).toBe('[[partial]]');
    });

    it('should handle empty string', () => {
      const result = handler.formatAsLink('');
      expect(result).toBe('[[]]');
    });

    it('should handle nested brackets', () => {
      const result = handler.formatAsLink('[[nested [text]]]');
      expect(result).toBe('[[nested text]]');
    });
  });

  describe('formatAsPlain', () => {
    it('should remove bold formatting', () => {
      const result = handler.formatAsPlain('**bold**');
      expect(result).toBe('bold');
    });

    it('should remove italic formatting', () => {
      const result = handler.formatAsPlain('_italic_');
      expect(result).toBe('italic');
    });

    it('should remove strikethrough formatting', () => {
      const result = handler.formatAsPlain('~~strike~~');
      expect(result).toBe('strike');
    });

    it('should remove highlight markers', () => {
      const result = handler.formatAsPlain('==highlighted==');
      expect(result).toBe('highlighted');
    });

    it('should remove code backticks', () => {
      const result = handler.formatAsPlain('`code`');
      expect(result).toBe('code');
    });

    it('should remove link brackets', () => {
      const result = handler.formatAsPlain('[[link]]');
      expect(result).toBe('link');
    });

    it('should remove all formatting at once', () => {
      const result = handler.formatAsPlain('**[[bold link]]** and _~~italic strike~~_');
      expect(result).toBe('bold link and italic strike');
    });

    it('should preserve plain text', () => {
      const result = handler.formatAsPlain('plain text');
      expect(result).toBe('plain text');
    });
  });

  describe('clearEditor', () => {
    it('should clear editor reference and fall back to DOM selection', () => {
      // Arrange - editor is set from beforeEach
      (mockEditor.getSelection as jest.Mock).mockReturnValue('editor text');
      expect(handler.getSelectedText()).toBe('editor text');

      const mockSelection = {
        toString: jest.fn(() => 'dom text'),
      };
      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      handler.clearEditor();
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('dom text');

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });
  });

  describe('getSelectedText - Reading View fallback', () => {
    it('should use window.getSelection when editor is null', () => {
      // Arrange
      handler.setEditor(null as any);
      const mockSelection = {
        toString: jest.fn(() => 'reading view text'),
      };
      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('reading view text');

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });

    it('should return empty string when window.getSelection returns null', () => {
      // Arrange
      handler.setEditor(null as any);
      jest.spyOn(window, 'getSelection').mockReturnValue(null as any);

      // Act
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('');

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });

    it('should prefer editor over window.getSelection when editor is set', () => {
      // Arrange
      (mockEditor.getSelection as jest.Mock).mockReturnValue('editor text');
      const mockSelection = {
        toString: jest.fn(() => 'window text'),
      };
      jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

      // Act
      const result = handler.getSelectedText();

      // Assert
      expect(result).toBe('editor text');
      expect(mockSelection.toString).not.toHaveBeenCalled();

      // Cleanup
      (window.getSelection as jest.Mock).mockRestore();
    });
  });
});
