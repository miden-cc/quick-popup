# Quick Popup UI Patterns - Quick Reference

## 3 Standout Patterns

### 1️⃣ Tabbed Settings Interface
**From:** Editing Toolbar
**Best For:** Organizing 15+ settings into logical groups
**Implementation Time:** 2-3 hours
**Complexity:** Medium

```typescript
// Store active tab
activeTab: string = 'buttons'

// Switch tabs
tabs.forEach(tab => {
  tabButton.onClick(() => {
    this.activeTab = tab.id
    this.display()  // Re-render
  })
})

// Render conditionally
switch(this.activeTab) {
  case 'buttons': this.displayButtons()
  case 'appearance': this.displayAppearance()
}
```

**Use Case For Quick Popup:** Separate General → Buttons → Appearance → Advanced

---

### 2️⃣ Drag-and-Drop Button Reordering
**From:** Editing Toolbar (SortableJS)
**Best For:** Reordering buttons intuitively
**Implementation Time:** 1-2 hours
**Complexity:** Low (library does heavy lifting)

```typescript
import Sortable from 'sortablejs'

Sortable.create(container, {
  animation: 500,
  ghostClass: 'sortable-ghost',      // Semi-transparent
  chosenClass: 'sortable-chosen',     // Highlighted
  dragClass: 'sortable-drag',         // While dragging
  onSort: async (evt) => {
    // Reorder array
    const [item] = array.splice(evt.oldIndex, 1)
    array.splice(evt.newIndex, 0, item)
    // Save
    await plugin.saveSettings()
  }
})
```

**Key Points:**
- Add `cursor: grab` to items
- Use `delayOnTouchOnly: true` for mobile
- Save immediately after reorder
- Show visual feedback with CSS classes

---

### 3️⃣ Modal for Editing Complex Properties
**From:** Note Toolbar
**Best For:** Editing button properties (name, icon, command)
**Implementation Time:** 2-3 hours
**Complexity:** Medium

```typescript
// In SettingTab - show list
button.onClick(() => {
  new ButtonEditModal(app, plugin, button, this).open()
})

// ButtonEditModal extends Modal
onOpen() {
  // Name input
  new Setting(contentEl)
    .setName('Button Name')
    .addText(txt => {
      txt.setValue(button.name)
        .onChange(v => button.name = v)
    })

  // Icon picker
  new Setting(contentEl)
    .setName('Icon')
    .addButton(btn => {
      btn.setIcon(button.icon)
        .onClick(() => openIconPicker())
    })

  // Save button
  new Setting(contentEl)
    .addButton(btn => {
      btn.setButtonText('Save').setCta()
        .onClick(async () => {
          await plugin.saveSettings()
          this.close()
          parent.display()  // Refresh list
        })
    })
}
```

**Benefits:**
- Keep main list clean
- Easy to add more properties later
- Better UX than form-within-form
- Natural workflow: list → select → edit

---

## Supporting Patterns

### Delete with Confirmation
```typescript
let confirming = false

deleteBtn.onClick(async () => {
  if (confirming) {
    await deleteAction()
    confirming = false
  } else {
    confirming = true
    deleteBtn.setIcon('check').addClass('mod-warning')
    setTimeout(() => {
      confirming = false
      deleteBtn.setIcon('trash-2').removeClass('mod-warning')
    }, 3500)
  }
})
```

### Live Icon Display
```typescript
// Show icon next to name
const iconEl = span.createEl('span')
setIcon(iconEl, button.icon)

// Update on change
onIconChange(newIcon) {
  setIcon(iconEl, newIcon)  // Re-render icon
  button.icon = newIcon
}
```

### Collapsible Sections (Advanced)
```typescript
// From Note Toolbar - only for 10+ items
const isOpen = true

// Toggle on click
header.onClick(() => {
  isOpen = !isOpen
  this.display()
})

// Show count when collapsed
const label = isOpen
  ? 'Advanced Settings'
  : `Advanced Settings (${count} items)`
```

---

## Library Recommendations

| Library | Use | Version | Notes |
|---------|-----|---------|-------|
| **SortableJS** | Drag-drop reordering | 1.15+ | Used by all 3 plugins |
| **Pickr** | Color picker | 1.8+ | Optional, only if colors needed |
| **Obsidian API** | Settings UI | Built-in | `Setting`, `Modal`, `ButtonComponent` |

---

## CSS Classes to Use

```css
/* From Obsidian default */
.mod-cta {}          /* Call-to-action button */
.mod-warning {}      /* Warning/delete styling */
.mod-destructive {}  /* Very destructive action */

/* From plugins */
.sortable-ghost {}      /* Dragging transparency */
.sortable-chosen {}      /* Selected item */
.sortable-drag {}       /* Active drag */

/* Your custom classes */
.button-item {}         /* List item */
.button-item-icon {}    /* Icon container */
.button-list {}         /* Sortable container */
.tab-button {}          /* Tab selector */
.tab-button.active {}   /* Active tab */
```

---

## Component Hierarchy

```
QuickPopupSettingTab (extends PluginSettingTab)
├── Tabs (buttons, appearance, advanced)
├── displayButtonsTab()
│   ├── Button List (SortableJS container)
│   │   └── Button Items (foreach button)
│   │       ├── Icon + Name
│   │       ├── Edit Button → ButtonEditModal
│   │       └── Delete Button
│   └── Add Button → ButtonEditModal
└── Other tabs...

ButtonEditModal (extends Modal)
├── Name input
├── Icon picker button → IconPickerModal
├── Command search
└── Save button
```

---

## Implementation Checklist

### Phase 1: Basic (Day 1)
- [ ] Create tabbed SettingTab structure
- [ ] Display button list in "Buttons" tab
- [ ] Add "Edit" button for each item → opens modal
- [ ] Add "Delete" button with confirmation
- [ ] Modal with name + command inputs
- [ ] Save and refresh list

### Phase 2: Reordering (Day 2)
- [ ] Install SortableJS
- [ ] Initialize Sortable on button list
- [ ] Implement onSort handler
- [ ] Add CSS for drag states
- [ ] Test on mobile (touch)

### Phase 3: Polish (Day 3)
- [ ] Add icon picker to modal
- [ ] Create appearance tab (color, size)
- [ ] Live preview of buttons
- [ ] Add general tab (enable/disable)
- [ ] Error handling & validation
- [ ] Unit tests

---

## Code Snippets You Can Copy

### Minimal Tabbed Interface
```typescript
export class MySettingTab extends PluginSettingTab {
  activeTab = 'general'

  display() {
    const { containerEl } = this
    containerEl.empty()

    // Tabs
    const tabs = ['general', 'advanced']
    const tabContainer = containerEl.createEl('div', { cls: 'tabs' })
    tabs.forEach(tab => {
      const btn = tabContainer.createEl('button', {
        text: tab,
        cls: this.activeTab === tab ? 'active' : ''
      })
      btn.onClick(() => {
        this.activeTab = tab
        this.display()
      })
    })

    // Content
    const content = containerEl.createEl('div')
    if (this.activeTab === 'general') {
      new Setting(content).setName('Option 1').addToggle(t => {})
    }
  }
}
```

### Minimal Button List with Sortable
```typescript
const list = containerEl.createEl('div', { cls: 'button-list' })

Sortable.create(list, {
  animation: 200,
  onSort: async (evt) => {
    const [item] = buttons.splice(evt.oldIndex, 1)
    buttons.splice(evt.newIndex, 0, item)
    await plugin.saveSettings()
  }
})

buttons.forEach(button => {
  const item = list.createEl('div', { cls: 'button-item' })
  item.createEl('span', { text: button.name })

  new ButtonComponent(item)
    .setIcon('pencil')
    .onClick(() => edit(button))
})
```

### Minimal Modal
```typescript
class ButtonEditModal extends Modal {
  onOpen() {
    new Setting(this.contentEl)
      .setName('Name')
      .addText(t => t.setValue(this.button.name)
        .onChange(v => this.button.name = v))

    new Setting(this.contentEl)
      .addButton(b => b.setButtonText('Save').setCta()
        .onClick(async () => {
          await plugin.saveSettings()
          this.close()
        }))
  }
}
```

---

## Common Pitfalls to Avoid

❌ **Don't:** Make tabs if only 2-3 settings exist
✅ **Do:** Use simple toggles/dropdowns inline

❌ **Don't:** Save on every keystroke
✅ **Do:** Save on blur or explicit save button

❌ **Don't:** Forget to refresh parent after modal closes
✅ **Do:** Call `parentTab.display()` in modal's `onClose()`

❌ **Don't:** Make drag-drop without visual feedback
✅ **Do:** Use all 3 Sortable classes (ghost, chosen, drag)

❌ **Don't:** Delete without confirmation
✅ **Do:** Use 2-click or modal confirmation

---

## Performance Tips

- Use `requestAnimationFrame()` for heavy previews (Note Toolbar pattern)
- Debounce search inputs (for icon/command selection)
- Lazy-load modals only when opened
- Save settings asynchronously, don't await unless necessary
- Use `setTimeout()` to defer heavy DOM operations

---

## Testing Checklist

- [ ] Desktop browser - drag reordering works
- [ ] Mobile browser - touch drag works (800ms delay)
- [ ] Click to edit - modal opens
- [ ] Click to delete - confirmation state shows, auto-resets
- [ ] Save in modal - list updates without page reload
- [ ] Tab switching - scroll position preserved (Note Toolbar pattern)
- [ ] Add new button - appears at end of list
- [ ] Icon picker - shows random selection of Obsidian icons
- [ ] Command search - autocomplete works

---

## Next Steps

1. **Review full analysis:** See `OBSIDIAN_PLUGINS_ANALYSIS.md`
2. **Clone reference repos:**
   - `github.com/PKM-er/obsidian-editing-toolbar`
   - `github.com/chrisgurney/obsidian-note-toolbar`
3. **Start with Phase 1** of checklist
4. **Copy code snippets** from above
5. **Test extensively** on mobile + desktop

---

**Last Updated:** 2026-02-12
**Analysis Sources:** 3 mature Obsidian plugins (1.2k-3.2k stars, 3+ years maintained)
