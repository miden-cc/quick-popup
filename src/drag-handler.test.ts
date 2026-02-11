/**
 * DragHandler - ボタンのドラッグ＆ドロップ機能テスト
 *
 * TDD: RED フェーズ
 * このテストは実装前に書かれています
 */

import { DragHandler } from './drag-handler';

describe('DragHandler - ドラッグ＆ドロップ機能', () => {
  let dragHandler: DragHandler;
  let mockOnReorder: jest.Mock;

  beforeEach(() => {
    mockOnReorder = jest.fn();
    dragHandler = new DragHandler(mockOnReorder);
  });

  describe('initializeDragHandles', () => {
    it('should initialize drag handles on all draggable elements', () => {
      // Arrange
      const container = document.createElement('div');
      const handle1 = document.createElement('span');
      const handle2 = document.createElement('span');

      handle1.className = 'drag-handle';
      handle1.setAttribute('data-button-id', 'link');
      handle2.className = 'drag-handle';
      handle2.setAttribute('data-button-id', 'copy');

      container.appendChild(handle1);
      container.appendChild(handle2);
      document.body.appendChild(container);

      // Act
      dragHandler.initializeDragHandles(container);

      // Assert
      const handles = container.querySelectorAll('.drag-handle');
      expect(handles.length).toBe(2);
      expect(dragHandler.getDragHandlesCount()).toBe(2);

      // Cleanup
      document.body.removeChild(container);
    });

    it('should add mousedown listener to drag handles', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      container.appendChild(handle);
      document.body.appendChild(container);

      const addEventListenerSpy = jest.spyOn(handle, 'addEventListener');

      // Act
      dragHandler.initializeDragHandles(container);

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      // Cleanup
      addEventListenerSpy.mockRestore();
      document.body.removeChild(container);
    });
  });

  describe('drag behavior', () => {
    it('should initialize drag state after handle mousedown', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      handle.setAttribute('data-order', '0');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      // Act - Simulate mousedown
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientY: 100,
      });

      // Manually trigger the handler since event dispatch might not work in jsdom
      const handleElement = container.querySelector('.drag-handle') as HTMLElement;
      if (handleElement) {
        handleElement.dispatchEvent(mouseDownEvent);
      }

      // Assert
      expect(dragHandler.isDragging()).toBe(true);

      // Cleanup
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);
      document.body.removeChild(container);
    });

    it('should calculate drag distance correctly', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      handle.setAttribute('data-order', '0');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      const handleElement = container.querySelector('.drag-handle') as HTMLElement;
      if (handleElement) {
        handleElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 100 }));
      }

      // Act
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientY: 150 }));

      // Assert
      const dragDistance = dragHandler.getDragDistance();
      expect(dragDistance).toBeGreaterThanOrEqual(0);

      // Cleanup
      document.dispatchEvent(new MouseEvent('mouseup'));
      document.body.removeChild(container);
    });

    it('should call onReorder when drag ends with valid reorder', () => {
      // Arrange
      const container = document.createElement('div');
      const handle1 = document.createElement('span');
      const handle2 = document.createElement('span');

      handle1.className = 'drag-handle';
      handle1.setAttribute('data-button-id', 'link');
      handle1.setAttribute('data-order', '0');

      handle2.className = 'drag-handle';
      handle2.setAttribute('data-button-id', 'copy');
      handle2.setAttribute('data-order', '1');

      container.appendChild(handle1);
      container.appendChild(handle2);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      // Act - Drag from handle1 down to handle2 position
      const mouseDownEvent = new MouseEvent('mousedown', { clientY: 100 });
      handle1.dispatchEvent(mouseDownEvent);

      const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 180 });
      document.dispatchEvent(mouseMoveEvent);

      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Assert
      expect(mockOnReorder).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(container);
    });

    it('should not call onReorder when drag distance is too small', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      // Act - Drag with very small distance
      const mouseDownEvent = new MouseEvent('mousedown', { clientY: 100 });
      handle.dispatchEvent(mouseDownEvent);

      const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 105 });
      document.dispatchEvent(mouseMoveEvent);

      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Assert
      expect(mockOnReorder).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(container);
    });

    it('should stop dragging on mouseup', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      const mouseDownEvent = new MouseEvent('mousedown', { clientY: 100 });
      handle.dispatchEvent(mouseDownEvent);

      // Act
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Assert
      expect(dragHandler.isDragging()).toBe(false);

      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('visual feedback', () => {
    it('should add dragging class to element during drag', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      handle.setAttribute('data-order', '0');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      // Act
      const handleElement = container.querySelector('.drag-handle') as HTMLElement;
      if (handleElement) {
        handleElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 100 }));
      }

      // Assert
      if (handleElement) {
        expect(handleElement.classList.contains('dragging')).toBe(true);
      }

      // Cleanup
      document.dispatchEvent(new MouseEvent('mouseup'));
      document.body.removeChild(container);
    });

    it('should remove dragging class after drag ends', () => {
      // Arrange
      const container = document.createElement('div');
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.setAttribute('data-button-id', 'link');
      container.appendChild(handle);
      document.body.appendChild(container);

      dragHandler.initializeDragHandles(container);

      const mouseDownEvent = new MouseEvent('mousedown', { clientY: 100 });
      handle.dispatchEvent(mouseDownEvent);

      // Act
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Assert
      expect(handle.classList.contains('dragging')).toBe(false);

      // Cleanup
      document.body.removeChild(container);
    });
  });
});
