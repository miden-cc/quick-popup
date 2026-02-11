import { PopupPosition } from './types';
import { PopupConfig } from './popup-manager';

/**
 * ポップアップ位置計算
 */
export class PositionCalculator {
  /**
   * 選択テキストと重ならない位置を計算
   */
  static calculate(selectionRect: DOMRect, popupRect: DOMRect): PopupPosition {
    const left = this.calculateHorizontalPosition(selectionRect, popupRect);
    const { top, placement } = this.calculateVerticalPosition(selectionRect, popupRect);

    if (PopupConfig.DEBUG) {
      this.logPositionDebug(selectionRect, popupRect, { top, left, placement });
    }

    if (this.hasCollision(selectionRect, { top, left, placement }, popupRect)) {
      console.warn('⚠️ Collision detected! Forcing safe position.');
      return this.forceSafePosition(selectionRect, popupRect);
    }

    return { top, left, placement };
  }

  /**
   * 水平方向の位置を計算（画面端を考慮）
   */
  private static calculateHorizontalPosition(selectionRect: DOMRect, popupRect: DOMRect): number {
    const centerAligned = selectionRect.left + selectionRect.width / 2 - popupRect.width / 2;
    return this.clampToHorizontalBounds(centerAligned, popupRect.width);
  }

  /**
   * 垂直方向の位置を計算（デフォルト：選択範囲の上）
   */
  private static calculateVerticalPosition(
    selectionRect: DOMRect,
    popupRect: DOMRect
  ): { top: number; placement: 'top' | 'bottom' } {
    const viewportHeight = window.innerHeight;
    const selectionTop = selectionRect.top;
    const selectionBottom = selectionRect.bottom;

    const topPlacement = selectionTop - popupRect.height - PopupConfig.TOTAL_OFFSET;
    if (topPlacement >= PopupConfig.SCREEN_MARGIN) {
      return { top: topPlacement, placement: 'top' };
    }

    const bottomPlacement = selectionBottom + PopupConfig.TOTAL_OFFSET;
    const popupBottom = bottomPlacement + popupRect.height;

    if (popupBottom <= viewportHeight - PopupConfig.SCREEN_MARGIN) {
      return { top: bottomPlacement, placement: 'bottom' };
    }

    const spaceAbove = selectionTop - PopupConfig.SCREEN_MARGIN;
    const spaceBelow = viewportHeight - selectionBottom - PopupConfig.SCREEN_MARGIN;

    if (spaceAbove >= spaceBelow) {
      return {
        top: Math.max(PopupConfig.SCREEN_MARGIN, topPlacement),
        placement: 'top',
      };
    } else {
      return {
        top: Math.min(
          viewportHeight - popupRect.height - PopupConfig.SCREEN_MARGIN,
          bottomPlacement
        ),
        placement: 'bottom',
      };
    }
  }

  /**
   * 水平方向の境界内に収める
   */
  private static clampToHorizontalBounds(left: number, popupWidth: number): number {
    const minLeft = PopupConfig.SCREEN_MARGIN;
    const maxLeft = window.innerWidth - popupWidth - PopupConfig.SCREEN_MARGIN;
    return Math.max(minLeft, Math.min(left, maxLeft));
  }

  /**
   * 衝突チェック（ポップアップと選択範囲が重なっているか）
   */
  private static hasCollision(selectionRect: DOMRect, position: PopupPosition, popupRect: DOMRect): boolean {
    const popupTop = position.top;
    const popupBottom = position.top + popupRect.height;
    const popupLeft = position.left;
    const popupRight = position.left + popupRect.width;

    const selectionTop = selectionRect.top;
    const selectionBottom = selectionRect.bottom;
    const selectionLeft = selectionRect.left;
    const selectionRight = selectionRect.right;

    const verticalOverlap = !(popupBottom < selectionTop || popupTop > selectionBottom);
    const horizontalOverlap = !(popupRight < selectionLeft || popupLeft > selectionRight);

    return verticalOverlap && horizontalOverlap;
  }

  /**
   * 安全な位置を強制的に計算（衝突が検出された場合）
   */
  private static forceSafePosition(selectionRect: DOMRect, popupRect: DOMRect): PopupPosition {
    const viewportHeight = window.innerHeight;
    let top = selectionRect.top - popupRect.height - PopupConfig.TOTAL_OFFSET;
    let placement: 'top' | 'bottom' = 'top';

    if (top < PopupConfig.SCREEN_MARGIN) {
      top = selectionRect.bottom + PopupConfig.TOTAL_OFFSET;
      placement = 'bottom';

      if (top + popupRect.height > viewportHeight - PopupConfig.SCREEN_MARGIN) {
        top = Math.max(
          PopupConfig.SCREEN_MARGIN,
          viewportHeight - popupRect.height - PopupConfig.SCREEN_MARGIN
        );
      }
    }

    const left = this.calculateHorizontalPosition(selectionRect, popupRect);
    return { top, left, placement };
  }

  /**
   * デバッグ情報をログ出力
   */
  private static logPositionDebug(selectionRect: DOMRect, popupRect: DOMRect, position: PopupPosition): void {
    console.group('🔍 Position Debug');
    console.log('Selection:', {
      top: selectionRect.top,
      bottom: selectionRect.bottom,
      left: selectionRect.left,
      right: selectionRect.right,
      height: selectionRect.height,
      width: selectionRect.width,
    });
    console.log('Popup:', {
      top: position.top,
      bottom: position.top + popupRect.height,
      left: position.left,
      right: position.left + popupRect.width,
      height: popupRect.height,
      width: popupRect.width,
    });
    console.log('Gap:', {
      vertical: position.top - selectionRect.bottom,
      margin: PopupConfig.POPUP_MARGIN,
    });
    console.groupEnd();
  }
}
