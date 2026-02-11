# Real Code Examples from Analyzed Plugins

Actual implementation code from Editing Toolbar, Highlightr, and Note Toolbar.

---

## 1. Tabbed Interface (Editing Toolbar)

**Source:** `obsidian-editing-toolbar/src/settings/settingsTab.ts` (lines 35-172)

```typescript
// Define tab structure
const SETTING_TABS: SettingTab[] = [
  { id: 'general', name: t('General'), icon: 'gear' },
  { id: 'appearance', name: t('Appearance'), icon: 'brush' },
  { id: 'customcommands', name: t('Custom Commands'), icon: 'lucide-rectangle-ellipsis' },
  { id: 'commands', name: t('Toolbar Commands'), icon: 'lucide-command' },
  { id: 'importexport', name: t('Import/Export'), icon: 'lucide-import' },
];

export class editingToolbarSettingTab extends PluginSettingTab {
  plugin: editingToolbarPlugin;
  activeTab: string = 'general';

  display(): void {
    this.destroyPickrs();
    const { containerEl } = this;
    containerEl.empty();

    // Create header
    this.createHeader(containerEl);

    // Create tab container
    const tabContainer = containerEl.createEl('div', {
      cls: 'editing-toolbar-tabs'
    });

    // Create tab buttons
    SETTING_TABS.forEach(tab => {
      const tabButton = tabContainer.createEl('div', {
        cls: `editing-toolbar-tab ${this.activeTab === tab.id ? 'active' : ''}`
      });
      setIcon(tabButton, tab.icon);
      tabButton.createEl('span', { text: tab.name });

      tabButton.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.display();
      });
    });

    // Create content container
    const contentContainer = containerEl.createEl('div', {
      cls: 'editing-toolbar-content'
    });

    // Render tab content based on activeTab
    switch (this.activeTab) {
      case 'general':
        this.displayGeneralSettings(contentContainer);
        break;
      case 'appearance':
        this.displayAppearanceSettings(contentContainer);
        break;
      case 'customcommands':
        this.displayCustomCommandSettings(contentContainer);
        break;
      case 'commands':
        this.displayCommandSettings(contentContainer);
        break;
      case 'importexport':
        this.displayImportExportSettings(contentContainer);
        break;
    }
  }

  private displayGeneralSettings(containerEl: HTMLElement): void {
    const container = containerEl.createDiv('generalSetting-container');
    container.style.padding = '16px';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = 'var(--background-secondary)';
    container.style.marginBottom = '20px';

    new Setting(container)
      .setName(t('Editing Toolbar Append Method'))
      .setDesc(t('Choose where Editing Toolbar will append upon regeneration.'))
      .addDropdown((dropdown) => {
        let methods: Record<string, string> = {};
        APPEND_METHODS.map((method) => (methods[method] = method));
        dropdown
          .addOptions(methods)
          .setValue(this.plugin.settings.appendMethod)
          .onChange((appendMethod) => {
            this.plugin.settings.appendMethod = appendMethod;
            this.plugin.saveSettings();
          });
      });

    new Setting(container)
      .setName(t('Mobile Enabled or Not'))
      .setDesc(t("Whether to enable on mobile devices with device width less than 768px."))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isLoadOnMobile ?? false)
        .onChange((value) => {
          this.plugin.settings.isLoadOnMobile = value;
          this.plugin.saveSettings();
          this.triggerRefresh();
        }));
  }
}
```

**Key Takeaways:**
- Store active tab as class property
- Render tab buttons with loop
- Use `addEventListener` for tab clicks
- Call `this.display()` to re-render
- Delegate to separate methods for each tab

---

## 2. SortableJS Drag-and-Drop (Editing Toolbar)

**Source:** `obsidian-editing-toolbar/src/settings/settingsTab.ts` (lines 1285-1342)

```typescript
import Sortable from "sortablejs";

private createCommandList(containerEl: HTMLElement): void {
  const editingToolbarCommandsContainer = containerEl.createEl("div", {
    cls: "editingToolbarSettingsTabsContainer",
  });

  let dragele = "";

  Sortable.create(editingToolbarCommandsContainer, {
    group: "item",
    animation: 500,
    draggable: ".setting-item",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    dragoverBubble: false,
    forceFallback: true,
    fallbackOnBody: true,
    swapThreshold: 0.7,
    fallbackClass: "sortable-fallback",
    easing: "cubic-bezier(1, 0, 0, 1)",
    delay: 800,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    filter: ".setting-item-control button, .dropdown, .editingToolbarMenuTypeDropdown",
    preventOnFilter: false,

    onChoose: function (evt) {
      const item = evt.item;
      item.classList.add('sortable-chosen-feedback');
    },

    onUnchoose: function (evt) {
      const item = evt.item;
      item.classList.remove('sortable-chosen-feedback');
    },

    onSort: (command) => {
      if (command.from.className === command.to.className) {
        const arrayResult = commandsToEdit;
        const [removed] = arrayResult.splice(command.oldIndex, 1)
        arrayResult.splice(command.newIndex, 0, removed);

        // Update based on current config
        if (this.plugin.settings.enableMultipleConfig) {
          switch (this.currentEditingConfig) {
            case 'mobile':
              this.plugin.settings.mobileCommands = arrayResult;
              break;
            case 'following':
              this.plugin.settings.followingCommands = arrayResult;
              break;
            case 'top':
              this.plugin.settings.topCommands = arrayResult;
              break;
            case 'fixed':
              this.plugin.settings.fixedCommands = arrayResult;
              break;
          }
        } else {
          this.plugin.settings.menuCommands = arrayResult;
        }

        this.plugin.saveSettings();
      }
      this.triggerRefresh();
    },

    onStart: function (evt) {
      dragele = evt.item.className;
    },
  });

  // Render items
  currentCommands.forEach((newCommand: Command, index: number) => {
    const setting = new Setting(editingToolbarCommandsContainer)
      .setClass("editingToolbarCommandItem")
      .setName(newCommand.name)
      .addButton((addicon) => {
        addicon.setClass("editingToolbarSettingsIcon")
          .onClick(async () => {
            new ChooseFromIconList(this.plugin, newCommand).open();
          });
        setIcon(addicon.buttonEl, newCommand.icon)
      })
      .addButton((deleteButton) =>
        this.createDeleteButton(deleteButton, async () => {
          currentCommands.remove(newCommand);
          this.plugin.updateCurrentCommands(currentCommands, this.currentEditingConfig);
          await this.plugin.saveSettings();
          this.display();
          this.triggerRefresh();
        })
      );
  });
}
```

**Key Takeaways:**
- `delay: 800` + `delayOnTouchOnly: true` for touch devices
- `filter` to exclude buttons from drag
- `onSort` handler reorders and saves immediately
- `ghostClass`, `chosenClass`, `dragClass` for visual feedback
- Render items in the container AFTER creating Sortable

---

## 3. Simpler Sortable (Highlightr)

**Source:** `Highlightr-Plugin/src/settings/settingsTab.ts` (lines 223-239)

```typescript
const highlightersContainer = containerEl.createEl("div", {
  cls: "HighlightrSettingsTabsContainer",
});

Sortable.create(highlightersContainer, {
  animation: 500,
  ghostClass: "highlighter-sortable-ghost",
  chosenClass: "highlighter-sortable-chosen",
  dragClass: "highlighter-sortable-drag",
  dragoverBubble: true,
  forceFallback: true,
  fallbackClass: "highlighter-sortable-fallback",
  easing: "cubic-bezier(1, 0, 0, 1)",
  onSort: (command: { oldIndex: number; newIndex: number }) => {
    const arrayResult = this.plugin.settings.highlighterOrder;
    const [removed] = arrayResult.splice(command.oldIndex, 1);
    arrayResult.splice(command.newIndex, 0, removed);
    this.plugin.settings.highlighterOrder = arrayResult;
    this.plugin.saveSettings();
  },
});

// Render items
this.plugin.settings.highlighterOrder.forEach((highlighter) => {
  const icon = `<svg ...>${color}</svg>`;
  const settingItem = highlightersContainer.createEl("div");
  settingItem.addClass("highlighter-item-draggable");

  const colorIcon = settingItem.createEl("span");
  colorIcon.addClass("highlighter-setting-icon");
  colorIcon.innerHTML = icon;

  new Setting(settingItem)
    .setClass("highlighter-setting-item")
    .setName(highlighter)
    .setDesc(this.plugin.settings.highlighters[highlighter])
    .addButton((button) => {
      button
        .setIcon("highlightr-delete")
        .onClick(async () => {
          delete this.plugin.settings.highlighters[highlighter];
          this.plugin.settings.highlighterOrder.remove(highlighter);
          await this.plugin.saveSettings();
          this.display();
        });
    });
});
```

**Differences from Editing Toolbar:**
- No `filter` (all items draggable)
- No `delay` config (not touch-optimized)
- Simpler `onSort` (no nested zones)
- Uses `dragoverBubble: true` (allows drag over item)

---

## 4. Modal for Editing (Note Toolbar)

**Source:** `obsidian-note-toolbar/src/Settings/UI/Modals/ItemModal.ts`

```typescript
import { Modal, Setting, ButtonComponent } from "obsidian";

export default class ItemModal extends Modal {
  private toolbarItemUi: ToolbarItemUi;

  constructor(
    public ntb: NoteToolbarPlugin,
    toolbar: ToolbarSettings,
    private toolbarItem: ToolbarItemSettings,
    private parent?: ToolbarSettingsModal
  ) {
    super(ntb.app);
    this.toolbarItemUi = new ToolbarItemUi(this.ntb, this, toolbar);
  }

  /**
   * Displays the item UI within the modal window.
   */
  onOpen() {
    this.setTitle(t('setting.item.title'));
    this.display();
  }

  /**
   * Removes modal window and refreshes the parent settings window if provided.
   */
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.parent) this.parent.display();  // Refresh parent!
  }

  /**
   * Displays the item UI.
   */
  public display() {
    this.contentEl.empty();
    this.modalEl.addClass('note-toolbar-setting-modal-container');

    // Update plugin status
    this.ntb.adapters.checkPlugins();

    // Generate form
    let itemForm = this.toolbarItemUi.generateItemForm(this.toolbarItem);
    this.contentEl.append(itemForm);

    // Close button
    const doneButton = new Setting(this.contentEl)
      .addButton((btn: ButtonComponent) => {
        btn.setButtonText(t('setting.item.button-close'))
          .setCta()
          .setTooltip(t('setting.item.button-close-description'))
          .onClick(async (event) => {
            this.close();
          });
      });
    doneButton.settingEl.addClass('note-toolbar-setting-no-border');

    // Keyboard shortcut: Cmd/Ctrl+Enter to close
    this.ntb.registerDomEvent(
      this.modalEl, 'keydown', async (e: KeyboardEvent) => {
        switch (e.key) {
          case "Enter": {
            const modifierPressed = (Platform.isWin || Platform.isLinux)
              ? e?.ctrlKey : e?.metaKey;
            if (modifierPressed) {
              this.close();
            }
            break;
          }
        }
      }
    );
  }
}
```

**Key Takeaways:**
- Always call `parent.display()` in `onClose()`
- Add accessibility: keyboard shortcuts (Cmd+Enter to close)
- Delegate form generation to separate UI component
- Add modal-specific CSS classes

---

## 5. Two-Click Delete (Editing Toolbar)

**Source:** `obsidian-editing-toolbar/src/settings/settingsTab.ts` (lines 173-215)

```typescript
private createDeleteButton(
  button: any,
  deleteAction: () => Promise<void>,
  tooltip: string = t('Delete')
) {
  let isConfirming = false;
  let confirmTimeout: NodeJS.Timeout;

  button
    .setIcon('editingToolbarDelete')
    .setTooltip(tooltip)
    .onClick(async () => {
      if (isConfirming) {
        // Already confirmed - EXECUTE DELETE
        clearTimeout(confirmTimeout);
        button
          .setIcon('editingToolbarDelete')
          .setTooltip(tooltip);
        button.buttonEl.removeClass('mod-warning');
        isConfirming = false;

        // Do the delete
        await deleteAction();

      } else {
        // First click - ENTER CONFIRM MODE
        isConfirming = true;
        button
          .setTooltip(t('Confirm Delete?'))
          .setButtonText(t('Confirm Delete?'));
        button.buttonEl.addClass('mod-warning');

        // Auto-reset after 3.5 seconds
        confirmTimeout = setTimeout(() => {
          button
            .setIcon('editingToolbarDelete')
            .setTooltip(tooltip);
          button.buttonEl.removeClass('mod-warning');
          isConfirming = false;
        }, 3500);
      }
    });
}

// Usage:
.addButton(button => this.createDeleteButton(button, async () => {
  this.plugin.settings.customCommands.splice(index, 1);
  await this.plugin.saveSettings();
  this.plugin.reloadCustomCommands();
  this.display();
  new Notice(t('Command Deleted'));
}))
```

**Key Points:**
- Icon changes from trash to check on first click
- `mod-warning` CSS class makes it red
- Auto-resets with timeout if not confirmed
- Clear timeout to prevent memory leak

---

## 6. Inline Color Input with Picker (Highlightr)

**Source:** `Highlightr-Plugin/src/settings/settingsTab.ts` (lines 89-217)

```typescript
const highlighterSetting = new Setting(containerEl);

highlighterSetting
  .setName("Choose highlight colors")
  .setDesc("Create new highlight colors...");

// Two input fields
const colorInput = new TextComponent(highlighterSetting.controlEl);
colorInput.setPlaceholder("Color name");
colorInput.inputEl.addClass("highlighter-settings-color");

const valueInput = new TextComponent(highlighterSetting.controlEl);
valueInput.setPlaceholder("Color hex code");
valueInput.inputEl.addClass("highlighter-settings-value");

// Color picker button
highlighterSetting
  .addButton((button) => {
    button.setClass("highlightr-color-picker");
  })
  .then(() => {
    let input = valueInput.inputEl;
    let currentColor = valueInput.inputEl.value || null;

    // Get existing colors as swatches
    const colorMap = this.plugin.settings.highlighterOrder.map(
      (highlightKey) => this.plugin.settings.highlighters[highlightKey]
    );

    // Create Pickr instance
    let pickrCreate = new Pickr({
      el: ".highlightr-color-picker",
      theme: "nano",
      swatches: colorMap,  // Show existing colors!
      defaultRepresentation: "HEXA",
      default: colorMap[colorMap.length - 1],  // Last color
      comparison: false,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsla: false,
          input: true,
          cancel: true,
          save: true,
        },
      },
    });

    // Update input field color in real-time
    pickrCreate.on("change", function (color: Pickr.HSVaColor) {
      const colorHex = color.toHEXA().toString();
      const newColor = colorHex.length == 6
        ? `${colorHex}A6`
        : colorHex;

      // Show color in background
      colorInput.inputEl.setAttribute(
        "style",
        `background-color: ${newColor}; color: var(--text-normal);`
      );

      valueInput.inputEl.setAttribute(
        "style",
        `background-color: ${newColor}; color: var(--text-normal);`
      );

      valueInput.inputEl.value = newColor;
    });

    // Save on "save" button in picker
    pickrCreate.on("save", function (color: Pickr.HSVaColor, instance: Pickr) {
      let newColorValue = color.toHEXA().toString();
      valueInput.inputEl.value = newColorValue;
      instance.hide();
      instance.addSwatch(color.toHEXA().toString());  // Add to swatches
    });
  })
  .addButton((button) => {
    button
      .setIcon("highlightr-save")
      .setTooltip("Save")
      .onClick(async (buttonEl: any) => {
        let color = colorInput.inputEl.value.replace(" ", "-");
        let value = valueInput.inputEl.value;

        // Validation
        if (!color) {
          new Notice("Highlighter name missing");
          return;
        }
        if (!value) {
          new Notice("Highlighter hex code missing");
          return;
        }
        if (this.plugin.settings.highlighterOrder.includes(color)) {
          new Notice("This color already exists");
          return;
        }

        // Add to settings
        this.plugin.settings.highlighterOrder.push(color);
        this.plugin.settings.highlighters[color] = value;

        await this.plugin.saveSettings();
        this.display();
      });
  });
```

**Key Patterns:**
1. **Two-column input** - name and value side-by-side
2. **Shared color picker** - one picker for both fields
3. **Swatches from existing** - shows previously-created colors
4. **Live visual feedback** - input background shows selected color
5. **Validation checks** - name required, value required, no duplicates
6. **Error messages** - specific message for each validation failure

---

## 7. Adaptive Search (Note Toolbar)

**Source:** `obsidian-note-toolbar/src/Settings/UI/NoteToolbarSettingTab.ts` (lines 159-206)

```typescript
// Only show search if >4 toolbars
if (this.ntb.settings.toolbars.length > 4) {
  if (!Platform.isPhone) {
    // Desktop: render search field
    this.renderSearchField(toolbarListSetting.controlEl);
  } else {
    // Mobile: render search button
    const searchButton = toolbarListSetting
      .addExtraButton((cb) => {
        cb.setIcon('search')
          .setTooltip(t('setting.search.button-tooltip'))
          .onClick(async () => {
            this.toggleSearch();
            // Un-collapse list if collapsed
            if (!this.isSectionOpen['itemList']) {
              this.toggleToolbarList();
            }
          });
        this.ntb.settingsUtils.handleKeyClick(cb.extraSettingsEl);
        cb.extraSettingsEl.id = 'ntb-tbar-search-button';
      });
  }
}

// Adaptive heading with count
const toolbarListHeading = this.isSectionOpen['itemList']
  ? t('setting.toolbars.name')
  : t('setting.toolbars.name-with-count',
      { count: this.ntb.settings.toolbars.length });

// Collapse support
if (this.ntb.settings.toolbars.length > 4) {
  this.renderSettingToggle(
    toolbarListSetting,
    '.note-toolbar-setting-items-container',
    'itemList',
    () => {
      toolbarListSetting.setName(
        this.isSectionOpen['itemList']
          ? t('setting.toolbars.name')
          : t('setting.toolbars.name-with-count',
              { count: this.ntb.settings.toolbars.length })
      );
    }
  );
}
```

**Adaptive Patterns:**
- Show search only when >4 items
- Desktop = field, mobile = button
- Show item count in collapsed header
- Auto-open section when searching

---

## 8. Keyboard Navigation (Note Toolbar)

**Source:** `obsidian-note-toolbar/src/Settings/UI/NoteToolbarSettingTab.ts` (lines 369-395)

```typescript
// Support up/down arrow keys to navigate list
this.ntb.registerDomEvent(
  toolbarListDiv, 'keydown', (keyEvent) => {
    if (!['ArrowUp', 'ArrowDown'].contains(keyEvent.key)) return;

    const currentFocussed = activeDocument.activeElement as HTMLElement;
    if (currentFocussed) {
      // Get all visible buttons of same type
      const buttonSelector = `.setting-item-control > button.${currentFocussed.className}`;
      const toolbarButtonEls = Array.from(
        toolbarListDiv.querySelectorAll<HTMLElement>(buttonSelector)
      ).filter((btn) => getComputedStyle(btn.closest('.setting-item')!).display !== 'none');

      const currentIndex = toolbarButtonEls.indexOf(currentFocussed);

      switch (keyEvent.key) {
        case 'ArrowUp':
          if (currentIndex > 0) {
            toolbarButtonEls[currentIndex - 1].focus();
            keyEvent.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (currentIndex < toolbarButtonEls.length - 1) {
            toolbarButtonEls[currentIndex + 1].focus();
            keyEvent.preventDefault();
          }
          break;
      }
    }
  }
);

// Also support Cmd+D to duplicate
this.ntb.registerDomEvent(
  toolbarListItemSetting.settingEl, 'keydown', (e: KeyboardEvent) => {
    switch (e.key) {
      case "d": {
        const modifierPressed = (Platform.isWin || Platform.isLinux)
          ? e?.ctrlKey : e?.metaKey;
        if (modifierPressed) {
          this.ntb.settingsManager.duplicateToolbar(toolbar);
        }
      }
    }
  }
);
```

**Accessibility Features:**
- Arrow keys navigate list items
- Cmd/Ctrl+D to duplicate
- Cmd/Ctrl+Enter to close modals
- Focus management preserved

---

## 9. Styled Container Pattern

**Source:** `obsidian-editing-toolbar/src/settings/settingsTab.ts` (lines 217-222)

```typescript
const generalSettingContainer = containerEl.createDiv('generalSetting-container');
generalSettingContainer.style.padding = '16px';
generalSettingContainer.style.borderRadius = '8px';
generalSettingContainer.style.backgroundColor = 'var(--background-secondary)';
generalSettingContainer.style.marginBottom = '20px';

// All settings in this container
new Setting(generalSettingContainer)
  .setName('Option 1')
  .addToggle(toggle => {});

new Setting(generalSettingContainer)
  .setName('Option 2')
  .addDropdown(dropdown => {});

// Each tab gets its own container(s)
const appearanceContainer = containerEl.createDiv('appearance-container');
// ... more settings
```

**Benefits:**
- Visual grouping with background color
- Consistent padding/spacing
- Readable separation between sections
- Easy to style globally with CSS

---

## Recommended Pattern for Quick Popup

**Combining best practices:**

```typescript
export class QuickPopupSettingTab extends PluginSettingTab {
  activeTab = 'buttons';  // From Editing Toolbar

  display() {
    // 1. Tabs (Editing Toolbar pattern)
    const tabs = ['buttons', 'appearance', 'advanced'];
    tabs.forEach(tab => {
      // Create clickable tabs
    });

    // 2. Button list with drag (Editing Toolbar + Highlightr)
    const listContainer = this.displayButtonsTab(content);

    // SortableJS for reordering
    Sortable.create(listContainer, {
      animation: 500,
      onSort: async (evt) => {
        const [item] = this.plugin.settings.buttons.splice(evt.oldIndex, 1);
        this.plugin.settings.buttons.splice(evt.newIndex, 0, item);
        await this.plugin.saveSettings();
      }
    });

    // 3. Edit buttons (Note Toolbar pattern)
    setting.addButton(btn => btn.onClick(() => {
      new ButtonEditModal(this.app, this.plugin, button, this).open();
    }));

    // 4. Delete with confirmation (Editing Toolbar pattern)
    setting.addButton(btn => this.createDeleteButton(btn, async () => {
      // delete
    }));
  }
}
```

This combines:
- ✅ Tab organization from Editing Toolbar
- ✅ Drag reordering from both
- ✅ Modal editing from Note Toolbar
- ✅ Two-click delete from Editing Toolbar
- ✅ Live validation from Highlightr

---

**All code is from open-source plugins and follows Obsidian API conventions.**
