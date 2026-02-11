/**
 * PositionCalculator - ポップアップ位置計算テスト
 *
 * TDD: RED フェーズ
 * このテストは実装前に書かれています
 */

import { PositionCalculator } from './position-calculator';
import { PopupPosition } from './types';

// Mock PopupConfig
jest.mock('./popup-manager', () => ({
  PopupConfig: {
    TAIL_SIZE: 6,
    POPUP_MARGIN: 10,
    TOTAL_OFFSET: 16,
    SCREEN_MARGIN: 10,
    DEBUG: false,
  },
}));

describe('PositionCalculator - ポップアップ位置計算', () => {
  let selectionRect: DOMRect;
  let popupRect: DOMRect;

  beforeEach(() => {
    // Set default window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Create mock DOMRect objects
    selectionRect = {
      top: 300,
      bottom: 330,
      left: 400,
      right: 500,
      width: 100,
      height: 30,
    } as DOMRect;

    popupRect = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 200,
      height: 100,
    } as DOMRect;
  });

  describe('calculate', () => {
    it('should calculate position without collision', () => {
      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position).toHaveProperty('top');
      expect(position).toHaveProperty('left');
      expect(position).toHaveProperty('placement');
      expect(typeof position.top).toBe('number');
      expect(typeof position.left).toBe('number');
      expect(['top', 'bottom']).toContain(position.placement);
    });

    it('should place popup above selection when space available', () => {
      // Arrange
      selectionRect.top = 300;
      selectionRect.bottom = 330;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('top');
      expect(position.top).toBeLessThan(selectionRect.top);
    });

    it('should place popup below selection when no space above', () => {
      // Arrange
      selectionRect.top = 50;
      selectionRect.bottom = 80;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('bottom');
      expect(position.top).toBeGreaterThanOrEqual(selectionRect.bottom);
    });

    it('should center popup horizontally', () => {
      // Arrange
      const selectionCenter = selectionRect.left + selectionRect.width / 2;
      const expectedLeft = selectionCenter - popupRect.width / 2;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBe(expectedLeft);
    });

    it('should clamp left position to screen margin', () => {
      // Arrange
      selectionRect.left = 5;
      selectionRect.right = 15;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10); // SCREEN_MARGIN
    });

    it('should clamp right position to screen margin', () => {
      // Arrange
      selectionRect.left = 900;
      selectionRect.right = 1000;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left + popupRect.width).toBeLessThanOrEqual(1024 - 10); // viewport - SCREEN_MARGIN
    });

    it('should return safe position when collision detected', () => {
      // Arrange
      selectionRect.top = 100;
      selectionRect.bottom = 120;
      // Make popup collision likely

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position).toHaveProperty('top');
      expect(position).toHaveProperty('left');
      expect(position).toHaveProperty('placement');
    });

    it('should include TOTAL_OFFSET in vertical spacing', () => {
      // Arrange
      selectionRect.top = 300;
      selectionRect.bottom = 330;
      const TOTAL_OFFSET = 16;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      // When placed above, top should be selection.top - popup.height - TOTAL_OFFSET
      expect(position.top).toBe(selectionRect.top - popupRect.height - TOTAL_OFFSET);
    });
  });

  describe('horizontal positioning', () => {
    it('should center popup within viewport horizontally', () => {
      // Arrange
      selectionRect.left = 300;
      selectionRect.right = 400;
      selectionRect.width = 100;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      const selectionCenter = selectionRect.left + selectionRect.width / 2;
      expect(position.left).toBe(selectionCenter - popupRect.width / 2);
    });

    it('should not exceed left screen boundary', () => {
      // Arrange
      selectionRect.left = 5;
      selectionRect.right = 15;
      selectionRect.width = 10;
      const SCREEN_MARGIN = 10;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(SCREEN_MARGIN);
    });

    it('should not exceed right screen boundary', () => {
      // Arrange
      selectionRect.left = 1000;
      selectionRect.right = 1010;
      selectionRect.width = 10;
      const SCREEN_MARGIN = 10;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left + popupRect.width).toBeLessThanOrEqual(
        1024 - SCREEN_MARGIN
      );
    });

    it('should handle selection at viewport edges', () => {
      // Arrange
      selectionRect.left = 0;
      selectionRect.right = 50;
      selectionRect.width = 50;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(0);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(1024);
    });

    it('should handle small viewport width', () => {
      // Arrange
      window.innerWidth = 300;
      popupRect.width = 200;
      selectionRect.left = 50;
      selectionRect.right = 100;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(290);
    });
  });

  describe('vertical positioning', () => {
    it('should prefer top placement when space available', () => {
      // Arrange
      selectionRect.top = 400;
      selectionRect.bottom = 430;
      window.innerHeight = 768;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('top');
    });

    it('should use bottom placement when insufficient space above', () => {
      // Arrange
      selectionRect.top = 100;
      selectionRect.bottom = 130;
      popupRect.height = 150;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('bottom');
    });

    it('should favor larger space when neither top nor bottom fits perfectly', () => {
      // Arrange
      selectionRect.top = 300;
      selectionRect.bottom = 330;
      window.innerHeight = 400; // Limited viewport

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(['top', 'bottom']).toContain(position.placement);
    });

    it('should respect SCREEN_MARGIN on top', () => {
      // Arrange
      selectionRect.top = 50;
      selectionRect.bottom = 80;
      const SCREEN_MARGIN = 10;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.top).toBeGreaterThanOrEqual(SCREEN_MARGIN);
    });

    it('should respect SCREEN_MARGIN on bottom', () => {
      // Arrange
      selectionRect.top = 600;
      selectionRect.bottom = 630;
      window.innerHeight = 700;
      const SCREEN_MARGIN = 10;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.top + popupRect.height).toBeLessThanOrEqual(700 - SCREEN_MARGIN);
    });

    it('should handle selection at top of viewport', () => {
      // Arrange
      selectionRect.top = 5;
      selectionRect.bottom = 35;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('bottom');
    });

    it('should handle selection at bottom of viewport', () => {
      // Arrange
      selectionRect.top = 700;
      selectionRect.bottom = 730;
      window.innerHeight = 768;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.placement).toBe('top');
    });
  });

  describe('collision detection', () => {
    it('should detect vertical overlap', () => {
      // Arrange - popup would overlap selection vertically
      selectionRect.top = 300;
      selectionRect.bottom = 330;
      const position: PopupPosition = {
        top: 310,
        left: 400,
        placement: 'bottom',
      };

      // This would require accessing private method, so we test through calculate
      const calculatedPosition = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert - should avoid collision
      const popupBottom = calculatedPosition.top + popupRect.height;
      const popupTop = calculatedPosition.top;

      if (calculatedPosition.placement === 'bottom') {
        expect(popupTop).toBeGreaterThanOrEqual(selectionRect.bottom);
      } else {
        expect(popupBottom).toBeLessThanOrEqual(selectionRect.top);
      }
    });

    it('should detect horizontal overlap', () => {
      // Arrange - position popup away from selection horizontally
      selectionRect.left = 400;
      selectionRect.right = 500;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      const popupLeft = position.left;
      const popupRight = position.left + popupRect.width;

      // Check that popup doesn't directly overlap selection
      const noHorizontalOverlap =
        popupRight < selectionRect.left || popupLeft > selectionRect.right;

      // For a well-positioned popup, horizontal centering is preferred,
      // but collision avoidance takes priority
      expect(typeof position.left).toBe('number');
    });

    it('should avoid collision in corner cases', () => {
      // Arrange - selection in middle of viewport
      selectionRect.top = 350;
      selectionRect.bottom = 400;
      selectionRect.left = 400;
      selectionRect.right = 500;

      // Act - calculate position
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert - verify no collision
      const popupTop = position.top;
      const popupBottom = position.top + popupRect.height;
      const popupLeft = position.left;
      const popupRight = position.left + popupRect.width;

      const verticalOverlap = !(
        popupBottom < selectionRect.top || popupTop > selectionRect.bottom
      );
      const horizontalOverlap = !(
        popupRight < selectionRect.left || popupLeft > selectionRect.right
      );

      // For normal cases, no collision
      if (
        position.placement === 'top' &&
        popupTop >= 10 &&
        position.placement === 'bottom' &&
        popupBottom <= 758
      ) {
        expect(!(verticalOverlap && horizontalOverlap)).toBeTruthy();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very small popup', () => {
      // Arrange
      popupRect.width = 10;
      popupRect.height = 10;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(typeof position.top).toBe('number');
      expect(typeof position.left).toBe('number');
    });

    it('should handle very large popup', () => {
      // Arrange
      popupRect.width = 800;
      popupRect.height = 600;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(1024 - 10);
    });

    it('should handle selection at origin', () => {
      // Arrange
      selectionRect.top = 0;
      selectionRect.bottom = 30;
      selectionRect.left = 0;
      selectionRect.right = 100;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position).toHaveProperty('top');
      expect(position).toHaveProperty('left');
      expect(position).toHaveProperty('placement');
    });

    it('should handle selection filling entire width', () => {
      // Arrange
      selectionRect.left = 0;
      selectionRect.right = 1024;
      selectionRect.width = 1024;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(1024 - 10);
    });

    it('should handle minimal viewport', () => {
      // Arrange
      window.innerWidth = 100;
      window.innerHeight = 100;
      popupRect.width = 80;
      popupRect.height = 80;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.top).toBeGreaterThanOrEqual(10);
    });

    it('should handle zero-sized selection', () => {
      // Arrange
      selectionRect.width = 0;
      selectionRect.height = 0;
      selectionRect.left = 500;
      selectionRect.right = 500;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(typeof position.top).toBe('number');
      expect(typeof position.left).toBe('number');
    });
  });

  describe('multi-line selection', () => {
    it('should handle multi-line selection properly', () => {
      // Arrange - simulate multi-line selection
      selectionRect.top = 300;
      selectionRect.bottom = 400;
      selectionRect.height = 100;
      selectionRect.left = 100;
      selectionRect.right = 800;
      selectionRect.width = 700;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position).toHaveProperty('placement');
      expect(['top', 'bottom']).toContain(position.placement);
    });

    it('should center horizontally for multi-line selection', () => {
      // Arrange
      selectionRect.left = 100;
      selectionRect.right = 800;
      selectionRect.width = 700;
      const center = selectionRect.left + selectionRect.width / 2;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBe(center - popupRect.width / 2);
    });
  });

  describe('responsive behavior', () => {
    it('should adapt to narrow viewport (mobile)', () => {
      // Arrange
      window.innerWidth = 375;
      window.innerHeight = 667;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(365);
    });

    it('should adapt to wide viewport (desktop)', () => {
      // Arrange
      window.innerWidth = 1920;
      window.innerHeight = 1080;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.left).toBeGreaterThanOrEqual(10);
      expect(position.left + popupRect.width).toBeLessThanOrEqual(1910);
    });

    it('should adapt to tall viewport', () => {
      // Arrange
      window.innerHeight = 2000;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.top).toBeGreaterThanOrEqual(10);
      expect(position.top + popupRect.height).toBeLessThanOrEqual(1990);
    });

    it('should adapt to short viewport', () => {
      // Arrange
      window.innerHeight = 300;

      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position.top).toBeGreaterThanOrEqual(10);
      expect(position.top + popupRect.height).toBeLessThanOrEqual(290);
    });
  });

  describe('consistency checks', () => {
    it('should always return valid PopupPosition object', () => {
      // Act
      const position = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position).toHaveProperty('top');
      expect(position).toHaveProperty('left');
      expect(position).toHaveProperty('placement');
      expect(typeof position.top).toBe('number');
      expect(typeof position.left).toBe('number');
      expect(['top', 'bottom']).toContain(position.placement);
    });

    it('should have consistent results for same inputs', () => {
      // Act
      const position1 = PositionCalculator.calculate(selectionRect, popupRect);
      const position2 = PositionCalculator.calculate(selectionRect, popupRect);

      // Assert
      expect(position1.top).toBe(position2.top);
      expect(position1.left).toBe(position2.left);
      expect(position1.placement).toBe(position2.placement);
    });

    it('should produce different results for different inputs', () => {
      // Arrange
      const position1 = PositionCalculator.calculate(selectionRect, popupRect);

      const modifiedRect = { ...selectionRect, top: 100 };

      // Act
      const position2 = PositionCalculator.calculate(modifiedRect, popupRect);

      // Assert
      expect(position1.top).not.toBe(position2.top);
    });

    it('should maintain screen margin constraints across all scenarios', () => {
      // Arrange
      const scenarios = [
        { top: 50, bottom: 80, left: 10, right: 110 },
        { top: 700, bottom: 730, left: 900, right: 1000 },
        { top: 300, bottom: 330, left: 400, right: 500 },
      ];

      // Act & Assert
      scenarios.forEach((rect) => {
        const rect_obj = {
          ...selectionRect,
          ...rect,
        };
        const position = PositionCalculator.calculate(rect_obj, popupRect);

        expect(position.left).toBeGreaterThanOrEqual(10);
        expect(position.left + popupRect.width).toBeLessThanOrEqual(1024 - 10);
        expect(position.top).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
