import { PopupPosition, RegisteredButton } from './types';

export class PopupConfig {
  static readonly TAIL_SIZE = 6;
  static readonly POPUP_MARGIN = 10;
  static readonly TOTAL_OFFSET = PopupConfig.TAIL_SIZE + PopupConfig.POPUP_MARGIN;
  static readonly SCREEN_MARGIN = 10;
  static readonly SELECTION_CHECK_DELAY = 150;
  static readonly DEBUG = false;
  static readonly POPUP_CLASS = 'text-selection-linker-popup';
  static readonly BUTTON_CLASS = 'text-selection-linker-button';
  static readonly SHOW_CLASS = 'show';
  static readonly PLACEMENT_TOP_CLASS = 'popup-top';
  static readonly PLACEMENT_BOTTOM_CLASS = 'popup-bottom';
}

export class PopupManager {
  private popup: HTMLElement | null = null;
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  /**
   * ポップアップ要素を作成
   */
  create(): void {
    const popup = document.createElement('div');
    popup.className = PopupConfig.POPUP_CLASS;

    const enabledButtons = this.plugin.buttonRegistry.getEnabledButtons();

    enabledButtons.forEach((registeredButton: RegisteredButton, index: number) => {
      const buttonEl = this.createButton(registeredButton);
      popup.appendChild(buttonEl);

      if (
        this.plugin.settings.showSeparators &&
        index < enabledButtons.length - 1
      ) {
        popup.appendChild(this.createSeparator());
      }
    });

    this.popup = popup;
  }

  /**
   * ボタン要素を作成
   */
  private createButton(registeredButton: any): HTMLButtonElement {
    const { config } = registeredButton;
    const button = document.createElement('button');
    button.className = PopupConfig.BUTTON_CLASS;
    button.title = config.tooltip;

    if (config.displayType === 'icon') {
      button.innerHTML = config.icon;
    } else {
      button.textContent = config.text;
    }

    button.addEventListener('click', async () => {
      await this.plugin.buttonRegistry.executeAction(config.id, null);
    });

    return button;
  }

  /**
   * セパレータを作成
   */
  private createSeparator(): HTMLElement {
    const sep = document.createElement('span');
    sep.className = 'text-selection-linker-separator';
    sep.textContent = '|';
    return sep;
  }

  /**
   * ポップアップを表示（アニメーション付き）
   */
  show(): void {
    if (!this.popup) return;
    document.body.appendChild(this.popup);
    requestAnimationFrame(() => {
      this.popup?.classList.add(PopupConfig.SHOW_CLASS);
    });
  }

  /**
   * ポップアップを非表示
   */
  hide(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  /**
   * ポップアップの位置を設定
   */
  position(pos: PopupPosition): void {
    if (!this.popup) return;
    this.popup.classList.remove(
      PopupConfig.PLACEMENT_TOP_CLASS,
      PopupConfig.PLACEMENT_BOTTOM_CLASS
    );
    this.popup.classList.add(`popup-${pos.placement}`);
    this.popup.style.top = `${pos.top}px`;
    this.popup.style.left = `${pos.left}px`;
  }

  /**
   * ポップアップ要素を取得
   */
  getElement(): HTMLElement | null {
    return this.popup;
  }

  /**
   * ポップアップが存在するか
   */
  exists(): boolean {
    return this.popup !== null;
  }

  /**
   * ポップアップを更新（設定変更時）
   */
  refresh(): void {
    const wasVisible = this.exists();
    const position: PopupPosition | null = wasVisible && this.popup
      ? {
          top: parseFloat(this.popup.style.top),
          left: parseFloat(this.popup.style.left),
          placement: this.popup.classList.contains(PopupConfig.PLACEMENT_TOP_CLASS)
            ? 'top' as const
            : 'bottom' as const,
        }
      : null;

    this.hide();

    if (wasVisible) {
      this.create();
      this.show();
      if (position) {
        this.position(position);
      }
    }
  }
}
