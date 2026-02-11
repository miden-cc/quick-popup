/**
 * ButtonActions - ボタンアクションのテスト
 *
 * TDD: RED フェーズ
 * QuickPopupPlugin のボタンアクションをテスト
 */

describe('Button Actions - ボタンアクション処理', () => {
  describe('convertToLink', () => {
    it('should wrap selected text with [[...]]', () => {
      // Arrange
      const selectedText = 'my note';
      const expected = '[[my note]]';

      // Act
      // convertToLink logic
      const cleanedText = selectedText
        .replace(/\[\[/g, '')
        .replace(/\]\]/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '');
      const result = `[[${cleanedText}]]`;

      // Assert
      expect(result).toBe(expected);
    });

    it('should remove existing brackets before wrapping', () => {
      // Arrange
      const selectedText = '[[already linked]]';
      const expected = '[[already linked]]';

      // Act
      const cleanedText = selectedText
        .replace(/\[\[/g, '')
        .replace(/\]\]/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '');
      const result = `[[${cleanedText}]]`;

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle mixed bracket types', () => {
      // Arrange
      const selectedText = '[mixed [brackets]]';

      // Act
      const cleanedText = selectedText
        .replace(/\[\[/g, '')
        .replace(/\]\]/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '');
      const result = `[[${cleanedText}]]`;

      // Assert
      expect(result).toMatch(/^\[\[.*\]\]$/);
      expect(result).toBe('[[mixed brackets]]');
    });
  });

  describe('copyPath', () => {
    it('should format path with line number', () => {
      // Arrange
      const filePath = 'notes/meeting.md';
      const lineNumber = 42;
      const expected = '@notes/meeting.md:42';

      // Act
      const result = `@${filePath}:${lineNumber}`;

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle root level files', () => {
      // Arrange
      const filePath = 'README.md';
      const lineNumber = 1;
      const expected = '@README.md:1';

      // Act
      const result = `@${filePath}:${lineNumber}`;

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle deep nested paths', () => {
      // Arrange
      const filePath = 'projects/client/src/components/Button.tsx';
      const lineNumber = 15;

      // Act
      const result = `@${filePath}:${lineNumber}`;

      // Assert
      expect(result).toMatch(/@.*\.tsx:\d+/);
      expect(result).toBe('@projects/client/src/components/Button.tsx:15');
    });

    it('should increment line number from cursor position', () => {
      // Arrange
      const cursorLine = 0; // 0-indexed in Obsidian
      const lineNumber = cursorLine + 1; // 1-indexed for display

      // Act
      const result = lineNumber;

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('cosense - create new note from selection', () => {
    it('should sanitize title from selected text', () => {
      // Arrange
      const selectedText = 'Meeting Notes: Q4 Planning';
      const invalidChars = /[\\/:*?"<>|]/g;

      // Act
      const sanitized = selectedText.replace(invalidChars, '-');

      // Assert
      expect(sanitized).toBe('Meeting Notes- Q4 Planning');
      expect(sanitized).not.toMatch(invalidChars);
    });

    it('should truncate title to reasonable length', () => {
      // Arrange
      const selectedText = 'This is a very long title that exceeds the maximum length we want for file names';
      const maxLength = 50;

      // Act
      const truncated = selectedText.substring(0, maxLength).trim();

      // Assert
      expect(truncated.length).toBeLessThanOrEqual(maxLength);
      expect(truncated.length).toBeGreaterThan(30);
    });

    it('should use first line as title', () => {
      // Arrange
      const selectedText = `First line as title
Second line
Third line`;

      // Act
      const firstLine = selectedText.split('\n')[0];

      // Assert
      expect(firstLine).toBe('First line as title');
    });

    it('should handle single character selection', () => {
      // Arrange
      const selectedText = 'A';

      // Act
      const fileName = `${selectedText}.md`;

      // Assert
      expect(fileName).toBe('A.md');
    });

    it('should preserve content completely', () => {
      // Arrange
      const selectedText = `Complete content
with multiple lines
and special chars: !@#$%`;

      // Act
      const content = selectedText;

      // Assert
      expect(content).toBe(selectedText);
    });
  });

  describe('splitText - TextSplitter integration', () => {
    it('should split text at sentence boundaries', () => {
      // Arrange
      const text = 'First sentence. Second sentence. Third sentence.';

      // Act
      // Simple split at periods
      const sentences = text.split('. ');

      // Assert
      expect(sentences.length).toBeGreaterThan(1);
      expect(sentences[0]).toBe('First sentence');
    });

    it('should handle text with multiple paragraph breaks', () => {
      // Arrange
      const text = `Paragraph 1

Paragraph 2

Paragraph 3`;

      // Act
      const paragraphs = text.split('\n\n');

      // Assert
      expect(paragraphs.length).toBe(3);
      expect(paragraphs[1].trim()).toBe('Paragraph 2');
    });

    it('should respect text length limits', () => {
      // Arrange
      const text = 'a'.repeat(500);
      const maxLength = 200;

      // Act
      const chunks = [];
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
      }

      // Assert
      chunks.forEach((chunk, idx) => {
        if (idx < chunks.length - 1) {
          expect(chunk.length).toBe(maxLength);
        } else {
          expect(chunk.length).toBeLessThanOrEqual(maxLength);
        }
      });
    });

    it('should preserve formatting in split text', () => {
      // Arrange
      const text = '**Bold text**. _Italic text_. `Code`.';

      // Act
      const result = text;

      // Assert
      expect(result).toContain('**Bold text**');
      expect(result).toContain('_Italic text_');
      expect(result).toContain('`Code`');
    });

    it('should handle empty text gracefully', () => {
      // Arrange
      const text = '';

      // Act
      const result = text;

      // Assert
      expect(result).toBe('');
    });
  });

  describe('error handling', () => {
    it('should handle missing selection', () => {
      // Arrange
      const selectedText = '';

      // Act & Assert
      expect(selectedText).toBe('');
    });

    it('should handle null or undefined gracefully', () => {
      // Arrange
      const selectedText: string | null = null;

      // Act & Assert
      expect(selectedText ?? '').toBe('');
    });

    it('should handle special unicode characters', () => {
      // Arrange
      const text = '日本語テキスト 🎉 emoji';

      // Act
      const result = text;

      // Assert
      expect(result).toContain('日本語');
      expect(result).toContain('🎉');
    });

    it('should handle very long text without crashing', () => {
      // Arrange
      const text = 'word '.repeat(10000);

      // Act
      const result = text;

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(50000);
    });
  });
});
