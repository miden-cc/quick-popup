/**
 * DragHandler - ボタンのドラッグ＆ドロップ機能
 *
 * ユーザーがボタンの上下移動をドラッグで実行できるようにする
 */

// 定数
const DRAG_HANDLE_CLASS = 'drag-handle';
const DRAGGING_CLASS = 'dragging';
const DATA_BUTTON_ID = 'data-button-id';
const DATA_ORDER = 'data-order';
const MIN_DRAG_DISTANCE = 10; // ピクセル
const BUTTON_HEIGHT = 48; // ボタン行の高さ

export interface DragStartEvent {
  buttonId: string;
  originalOrder: number;
  startY: number;
}

/**
 * ドラッグ＆ドロップハンドラー
 *
 * 機能：
 * - ボタンをドラッグして上下移動
 * - 最小移動距離で reorder を実行
 * - ビジュアルフィードバック付き
 */
export class DragHandler {
  private isDragState = false;
  private dragStartEvent: DragStartEvent | null = null;
  private currentDragDistance = 0;
  private draggedElement: HTMLElement | null = null;
  private readonly onReorder: (fromId: string, toOrder: number) => void;

  constructor(onReorder: (fromId: string, toOrder: number) => void) {
    this.onReorder = onReorder;
    this.setupGlobalListeners();
  }

  /**
   * ドラッグハンドルを初期化
   */
  initializeDragHandles(container: HTMLElement): void {
    const handles = container.querySelectorAll(`.${DRAG_HANDLE_CLASS}`);

    handles.forEach((handle) => {
      handle.addEventListener('mousedown', (e) => this.handleDragStart(e, handle as HTMLElement));
    });
  }

  /**
   * グローバルマウスリスナーを設定
   */
  private setupGlobalListeners(): void {
    document.addEventListener('mousemove', (e) => this.handleDragMove(e));
    document.addEventListener('mouseup', () => this.handleDragEnd());
  }

  /**
   * ドラッグ開始
   */
  private handleDragStart(event: MouseEvent, handle: HTMLElement): void {
    const buttonId = handle.getAttribute(DATA_BUTTON_ID);
    const order = handle.getAttribute(DATA_ORDER);

    if (!buttonId || order === null) {
      return;
    }

    this.isDragState = true;
    this.draggedElement = handle;
    this.dragStartEvent = {
      buttonId,
      originalOrder: parseInt(order, 10),
      startY: event.clientY,
    };
    this.currentDragDistance = 0;

    handle.classList.add(DRAGGING_CLASS);
  }

  /**
   * ドラッグ中の移動
   */
  private handleDragMove(event: MouseEvent): void {
    if (!this.isDragState || !this.dragStartEvent || !this.draggedElement) {
      return;
    }

    const distance = event.clientY - this.dragStartEvent.startY;
    this.currentDragDistance = Math.abs(distance);

    // ビジュアルフィードバック
    this.draggedElement.style.transform = `translateY(${distance}px)`;
    this.draggedElement.style.opacity = '0.7';
  }

  /**
   * ドラッグ終了
   */
  private handleDragEnd(): void {
    if (!this.isDragState || !this.dragStartEvent || !this.draggedElement) {
      return;
    }

    try {
      this.processDragEnd();
    } finally {
      this.cleanup();
    }
  }

  /**
   * ドラッグ終了時の処理
   */
  private processDragEnd(): void {
    if (this.currentDragDistance < MIN_DRAG_DISTANCE) {
      return;
    }

    const moveDistance = this.extractMoveDistance();
    const orderChange = Math.round(moveDistance / BUTTON_HEIGHT);

    if (orderChange !== 0 && this.dragStartEvent) {
      const newOrder = Math.max(0, this.dragStartEvent.originalOrder + orderChange);
      this.onReorder(this.dragStartEvent.buttonId, newOrder);
    }
  }

  /**
   * transform 属性から移動距離を抽出
   */
  private extractMoveDistance(): number {
    if (!this.draggedElement) {
      return 0;
    }

    const transform = this.draggedElement.style.transform;
    const match = transform.match(/translateY\(([^p]+)px/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * リソースをクリーンアップ
   */
  private cleanup(): void {
    if (this.draggedElement) {
      this.draggedElement.classList.remove(DRAGGING_CLASS);
      this.draggedElement.style.transform = '';
      this.draggedElement.style.opacity = '';
    }

    this.isDragState = false;
    this.dragStartEvent = null;
    this.draggedElement = null;
    this.currentDragDistance = 0;
  }

  /**
   * ドラッグ中か判定
   */
  isDragging(): boolean {
    return this.isDragState;
  }

  /**
   * 現在のドラッグ距離を取得（テスト用）
   */
  getDragDistance(): number {
    return this.currentDragDistance;
  }

  /**
   * ドラッグハンドル数を取得（テスト用）
   */
  getDragHandlesCount(): number {
    return document.querySelectorAll(`.${DRAG_HANDLE_CLASS}`).length;
  }
}
