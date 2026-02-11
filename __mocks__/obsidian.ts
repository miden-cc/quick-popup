/**
 * Obsidian API Mock for Testing
 */

export class Modal {
  app: any;
  contentEl: any;

  constructor(app: any) {
    this.app = app;
    this.contentEl = {
      empty: jest.fn(),
      createEl: jest.fn((tag: string, opts?: any) => {
        const element = {
          addClass: jest.fn(),
          removeClass: jest.fn(),
          addEventListener: jest.fn(),
          textContent: '',
          value: '',
          focus: jest.fn(),
          createDiv: jest.fn(),
          createEl: jest.fn(),
        };
        if (opts?.text) {
          element.textContent = opts.text;
        }
        return element;
      }),
      createDiv: jest.fn((className?: string, callback?: (el: any) => void) => {
        const element = {
          addClass: jest.fn(),
          removeClass: jest.fn(),
          addEventListener: jest.fn(),
          textContent: '',
          empty: jest.fn(),
          createDiv: jest.fn(),
          createEl: jest.fn(),
        };
        if (className) {
          element.addClass(className);
        }
        if (callback) {
          callback(element);
        }
        return element;
      }),
    };
  }

  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export class App {
  commands: any;

  constructor() {
    this.commands = {
      commands: {},
      listCommands: () => [],
    };
  }
}

export class Plugin {
  app: App;
  manifest: any;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  addCommand(command: any) {}
  registerEvent(event: any) {}
  loadData() {}
  saveData(data: any) {}
}

export class Editor {
  getSelection() { return ''; }
  replaceSelection(text: string) {}
  getCursor() { return { line: 0, ch: 0 }; }
  setCursor(pos: any) {}
}
