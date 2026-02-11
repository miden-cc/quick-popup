# Quick Popup: Recommended UI Patterns for Button Customization

## Executive Summary

Analysis of 3 mature Obsidian plugins reveals **3 standout patterns** ideal for Quick Popup's button customization UX.

---

## 1. Tabbed Settings Interface (Editing Toolbar Pattern)

**Why It Works:** Organizes many related settings without overwhelming the user.

### Implementation
```typescript
// Define tabs with icons for visual identity
const SETTING_TABS = [
  { id: 'general', name: 'General', icon: 'gear' },
  { id: 'buttons', name: 'Buttons', icon: 'lucide-command' },
  { id: 'appearance', name: 'Appearance', icon: 'brush' },
  { id: 'advanced', name: 'Advanced', icon: 'settings' },
];

// Track active tab in settings tab class
activeTab: string = 'general';

// Create clickable tab buttons
SETTING_TABS.forEach(tab => {
  const tabButton = tabContainer.createEl('div', { cls: 'tab-button' });
  setIcon(tabButton, tab.icon);
  tabButton.createEl('span', { text: tab.name });

  tabButton.onClick(() => {
    this.activeTab = tab.id;
    this.display();  // Re-render with new tab
  });
});

// Conditionally render content
switch (this.activeTab) {
  case 'general':
    this.displayGeneralSettings(contentContainer);
    break;
  case 'buttons':
    this.displayButtonSettings(contentContainer);
    break;
  // ...
}
```

### For Quick Popup
**Suggested Tabs:**
1. **General** - Enable/disable, hotkey, basic behavior
2. **Buttons** - Add/edit/reorder buttons (main interface)
3. **Appearance** - Colors, sizes, layout
4. **Advanced** - Special options, troubleshooting

### Pros & Cons
✅ **Pros:**
- Clear visual organization with icons
- Unlimited scalability
- Users can focus on one area at a time
- Easy to document (users learn "go to Buttons tab")

❌ **Cons:**
- Requires navigation clicks between sections
- Some users might not explore all tabs

---

## 2. Drag-and-Drop Reordering with Visual Feedback (SortableJS)

**Why It Works:** Feels natural and immediate, essential for button ordering.

### Implementation (Editing Toolbar's Approach)
```typescript
import Sortable from 'sortablejs';

// Create container
const buttonListContainer = containerEl.createEl('div', {
  cls: 'button-list-sortable'
});

// Initialize SortableJS
Sortable.create(buttonListContainer, {
  animation: 500,
  draggable: '.button-item',
  ghostClass: 'sortable-ghost',      // Semi-transparent during drag
  chosenClass: 'sortable-chosen',     // Highlighted when selected
  dragClass: 'sortable-drag',         // While actively dragging
  delay: 100,                         // Touch-friendly delay
  delayOnTouchOnly: true,
  easing: 'cubic-bezier(1, 0, 0, 1)',

  onSort: async (evt) => {
    // Reorder items
    const [removed] = buttons.splice(evt.oldIndex, 1);
    buttons.splice(evt.newIndex, 0, removed);

    // Save immediately
    await plugin.saveSettings();
  }
});

// Render each button item
buttons.forEach((button, index) => {
  const item = buttonListContainer.createEl('div', {
    cls: 'button-item'
  });

  // Icon display
  setIcon(item, button.icon);

  // Button name
  item.createEl('span', { text: button.name });

  // Action buttons
  const actions = item.createEl('div', { cls: 'button-actions' });
  new ButtonComponent(actions)
    .setIcon('pencil')
    .setTooltip('Edit')
    .onClick(() => this.editButton(button));

  new ButtonComponent(actions)
    .setIcon('trash-2')
    .setTooltip('Delete')
    .onClick(() => this.deleteButton(button));
});
```

### CSS Support Needed
```css
.button-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  background: var(--background-secondary);
  cursor: grab;
  user-select: none;
}

.button-item:active {
  cursor: grabbing;
}

.sortable-ghost {
  opacity: 0.5;
  background: var(--background-tertiary);
}

.sortable-chosen {
  background: var(--background-hover);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.sortable-drag {
  opacity: 1;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

### For Quick Popup
- **Handles naturally** - Users expect to drag items
- **Visual feedback is critical** - Show drag state clearly
- **Immediate save** - Save order as soon as drag completes
- **Touch-friendly** - Use `delayOnTouchOnly` and reasonable thresholds

---

## 3. Modal Editing Pattern for Complex Properties (Note Toolbar's Approach)

**Why It Works:** Keeps list view clean while allowing powerful property editing.

### Implementation
```typescript
// Main settings tab shows button list
class QuickPopupSettingTab extends PluginSettingTab {
  display() {
    // Button list view
    const buttonListDiv = containerEl.createEl('div');

    settings.buttons.forEach((button) => {
      const setting = new Setting(buttonListDiv)
        .setName(button.name || 'Unnamed button')
        .setDesc(`Command: ${button.command}`);

      // Edit button opens modal
      setting.addButton((btn) => {
        btn.setIcon('pencil')
          .setTooltip('Edit button')
          .onClick(() => {
            new ButtonEditModal(this.app, this.plugin, button, this)
              .open();
          });
      });

      // Delete button
      setting.addButton((btn) => {
        btn.setIcon('trash-2')
          .setTooltip('Delete button')
          .onClick(() => this.deleteButton(button));
      });
    });

    // Add button
    new Setting(containerEl)
      .addButton((btn) => {
        btn.setButtonText('+ Add Button')
          .setCta()
          .onClick(() => {
            new ButtonEditModal(
              this.app,
              this.plugin,
              { name: '', command: '', icon: 'lucide-plus' },  // New button template
              this
            ).open();
          });
      });
  }
}

// Modal for editing individual button
class ButtonEditModal extends Modal {
  constructor(
    app: App,
    plugin: Plugin,
    private button: QuickPopupButton,
    private parent: QuickPopupSettingTab
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle('Edit Button');

    // Button name
    new Setting(contentEl)
      .setName('Button Name')
      .setDesc('Display name for this button')
      .addText((txt) => {
        txt.setValue(this.button.name || '')
          .onChange((value) => {
            this.button.name = value;
          });
      });

    // Icon picker
    new Setting(contentEl)
      .setName('Icon')
      .setDesc('Choose an icon for this button')
      .addButton((btn) => {
        btn.setIcon(this.button.icon)
          .setTooltip('Click to choose icon')
          .onClick(() => {
            new IconPickerModal(this.app, this.plugin, this.button)
              .open();
          });
      });

    // Command/action selector
    new Setting(contentEl)
      .setName('Command')
      .setDesc('What should this button do?')
      .addSearch((search) => {
        search.setPlaceholder('Search commands...')
          .setValue(this.button.command || '')
          .onChange((value) => {
            this.button.command = value;
          });
      });

    // Close button
    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText('Save')
          .setCta()
          .onClick(async () => {
            // Validate
            if (!this.button.name) {
              new Notice('Please enter a button name');
              return;
            }

            // Save
            await this.plugin.saveSettings();

            // Close and refresh parent
            this.close();
            this.parent.display();
          });
      });
  }
}
```

### For Quick Popup
**Advantages:**
- ✅ Button list stays concise and scannable
- ✅ Complex property editing doesn't clutter main view
- ✅ Easy to add new property types later
- ✅ Natural workflow: list → select → edit

**Implementation Tips:**
1. Show preview of button in modal (icon + name)
2. Auto-focus first field when modal opens
3. Allow Cmd/Ctrl+Enter to save (power users)
4. Show validation errors near fields
5. Refresh parent list when modal closes

---

## 4. Two-Click Delete with Auto-Reset (Editing Toolbar Pattern)

**Why It Works:** Prevents accidental deletions while maintaining quick workflow.

### Implementation
```typescript
private createDeleteButton(
  button: ButtonComponent,
  deleteAction: () => Promise<void>,
  tooltip: string = 'Delete'
) {
  let isConfirming = false;
  let confirmTimeout: NodeJS.Timeout;

  button
    .setIcon('trash-2')
    .setTooltip(tooltip)
    .onClick(async () => {
      if (isConfirming) {
        // Already confirmed - execute delete
        clearTimeout(confirmTimeout);
        await deleteAction();
        isConfirming = false;

        // Reset button
        button
          .setIcon('trash-2')
          .setTooltip(tooltip);
        button.buttonEl.removeClass('mod-warning');

      } else {
        // First click - enter confirm mode
        isConfirming = true;
        button
          .setIcon('check')
          .setTooltip('Confirm Delete');
        button.buttonEl.addClass('mod-warning');

        // Auto-reset after 3.5 seconds if not confirmed
        confirmTimeout = setTimeout(() => {
          isConfirming = false;
          button
            .setIcon('trash-2')
            .setTooltip(tooltip);
          button.buttonEl.removeClass('mod-warning');
        }, 3500);
      }
    });
}

// Usage
setting.addButton((btn) =>
  this.createDeleteButton(btn, async () => {
    settings.buttons.remove(button);
    await plugin.saveSettings();
    this.display();  // Refresh list
  })
);
```

### For Quick Popup
- Change icon to visual confirmation (trash → check)
- Add CSS class for warning color (`mod-warning`)
- Auto-reset prevents "stuck" state
- No extra modal needed

---

## Comparison: When to Use Which Pattern

| Scenario | Pattern | Example |
|----------|---------|---------|
| 5+ button properties | **Modal Editing** | Name, icon, command, category, hotkey |
| Reordering buttons | **Drag-and-Drop** | Users expect to drag to organize |
| 20+ settings total | **Tabs** | Split into General/Buttons/Appearance/Advanced |
| Simple settings | **Inline Toggle/Dropdown** | Enable popup, transparency level |
| Destructive action | **Two-Click Confirm** | Delete button or reset all |

---

## Integration Roadmap for Quick Popup

### Phase 1: Foundation (MVP)
- ✅ Single "Buttons" tab with list
- ✅ Drag-and-drop reordering
- ✅ Edit/Delete buttons with confirmation

### Phase 2: Polish
- Add "General" tab (basic settings)
- Add "Appearance" tab (colors, sizes)
- Icon picker modal
- Live preview of buttons

### Phase 3: Advanced
- Add "Advanced" tab (behaviors)
- Import/export configuration
- Preset button templates
- Button categories/groups

---

## Code Template: Minimal Implementation

```typescript
import { PluginSettingTab, Setting, Modal, ButtonComponent } from 'obsidian';
import Sortable from 'sortablejs';

export class QuickPopupSettingTab extends PluginSettingTab {
  activeTab = 'buttons';

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // Tabs
    const tabs = containerEl.createEl('div', { cls: 'quick-popup-tabs' });
    ['buttons', 'appearance', 'advanced'].forEach(tabId => {
      const tab = tabs.createEl('button', {
        text: tabId.charAt(0).toUpperCase() + tabId.slice(1),
        cls: this.activeTab === tabId ? 'active' : ''
      });
      tab.onClick(() => {
        this.activeTab = tabId;
        this.display();
      });
    });

    // Content
    const content = containerEl.createEl('div', { cls: 'quick-popup-content' });

    if (this.activeTab === 'buttons') {
      this.displayButtonsTab(content);
    }
    // ... other tabs
  }

  displayButtonsTab(containerEl: HTMLElement) {
    // List container
    const listEl = containerEl.createEl('div', { cls: 'button-list' });

    Sortable.create(listEl, {
      animation: 200,
      onSort: async (evt) => {
        const [removed] = this.plugin.settings.buttons.splice(evt.oldIndex, 1);
        this.plugin.settings.buttons.splice(evt.newIndex, 0, removed);
        await this.plugin.saveSettings();
      }
    });

    // Render buttons
    this.plugin.settings.buttons.forEach((button) => {
      const item = listEl.createEl('div', { cls: 'button-item' });
      item.createEl('span', { text: button.name });

      const actions = item.createEl('div');
      new ButtonComponent(actions)
        .setIcon('pencil')
        .onClick(() => {
          new ButtonEditModal(this.app, this.plugin, button, this).open();
        });

      new ButtonComponent(actions)
        .setIcon('trash-2')
        .onClick(async () => {
          this.plugin.settings.buttons.remove(button);
          await this.plugin.saveSettings();
          this.display();
        });
    });

    // Add button
    new Setting(containerEl)
      .addButton((btn) => {
        btn.setButtonText('+ Add Button')
          .setCta()
          .onClick(() => {
            new ButtonEditModal(
              this.app,
              this.plugin,
              { name: '', command: '', icon: 'plus' },
              this
            ).open();
          });
      });
  }
}

class ButtonEditModal extends Modal {
  onOpen() {
    const { contentEl } = this;

    new Setting(contentEl)
      .setName('Name')
      .addText((txt) => {
        txt.setValue(this.button.name)
          .onChange((v) => this.button.name = v);
      });

    new Setting(contentEl)
      .setName('Command')
      .addSearch((search) => {
        search.setValue(this.button.command)
          .onChange((v) => this.button.command = v);
      });

    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText('Save').setCta()
          .onClick(async () => {
            await this.plugin.saveSettings();
            this.close();
          });
      });
  }
}
```

---

## Resources Used

| Plugin | Repository | Key Files |
|--------|-----------|-----------|
| Editing Toolbar | `github.com/PKM-er/obsidian-editing-toolbar` | `src/settings/settingsTab.ts` (1765 lines) |
| Highlightr | `github.com/chetachiezikeuzor/Highlightr-Plugin` | `src/settings/settingsTab.ts` (327 lines) |
| Note Toolbar | `github.com/chrisgurney/obsidian-note-toolbar` | `src/Settings/UI/NoteToolbarSettingTab.ts` (700+ lines) |

All repos use SortableJS for drag-and-drop and Pickr for color picking.
