# Form Builder Design Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop question reordering, eight theme presets, and fixed header/logo uploads that render in both builder and public forms.

**Architecture:** Store all design selections in `forms.settings`, reuse the existing `api.forms.update`, `api.questions.reorder`, and `api.storage.upload` helpers, and keep rendering parity through shared theme/header helpers. Use `@dnd-kit` around the existing builder question list without changing question IDs or conditional-rule references.

**Tech Stack:** React 18, TypeScript, Vite, `@dnd-kit/core`, `@dnd-kit/sortable`, InsForge database/storage SDK.

---

### Task 1: Theme Helpers

**Files:**
- Create: `src/theme/formThemes.ts`

- [ ] **Step 1: Create theme definitions**

Create `FORM_THEMES`, `getFormTheme`, `resolveFormTheme`, `themeToSettings`, and `buildThemeStyle`. Include eight theme IDs and set `background_color`, `text_color`, `accent_color`, `bold_text_color`, `theme_font_family`, `surface_color`, and `border_color`.

- [ ] **Step 2: Verify theme file**

Run: `npm run lint`

Expected: no TypeScript or lint errors.

### Task 2: Shared Header Renderer

**Files:**
- Create: `src/components/FormHeader.tsx`

- [ ] **Step 1: Build shared header component**

Create a component that accepts `title`, `description`, `settings`, optional edit handlers, and theme colors. Render a fixed cover header when `header_image_url` exists, a logo at the top/right when `logo_url` exists, and title/description below in an editable or readonly section.

- [ ] **Step 2: Verify component**

Run: `npm run lint`

Expected: no TypeScript or lint errors.

### Task 3: Design Panel

**Files:**
- Create: `src/components/FormDesignPanel.tsx`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add storage removal helper**

Add `api.storage.remove(bucket, key)` if not already present and keep existing upload behavior.

- [ ] **Step 2: Build design panel**

Create a toolbar popover component that renders eight theme choices, upload buttons for header image and logo, and remove buttons. Validate header image as JPEG/PNG/WebP up to 5 MB. Validate logo as JPEG/PNG/WebP/SVG up to 2 MB. Upload to `form-uploads` using `form-design/{formId}/...` paths and return settings patches.

- [ ] **Step 3: Verify panel**

Run: `npm run lint`

Expected: no TypeScript or lint errors.

### Task 4: Builder Integration

**Files:**
- Modify: `src/components/steps/FormBuilder.tsx`
- Create: `src/components/SortableQuestionBlock.tsx`

- [ ] **Step 1: Add sortable wrapper**

Create `SortableQuestionBlock` using `useSortable`, stable transform styles, and a visible drag handle. The wrapper should accept children and render them without changing inner question behavior.

- [ ] **Step 2: Add DnD state and handlers**

In `FormBuilder.tsx`, import DnD utilities. Add pointer and keyboard sensors. On drag end, reorder visible questions by ID, reassign sequential `question_order` and `order`, update local state, and call `api.questions.reorder`.

- [ ] **Step 3: Add design panel and shared header**

Replace the inline title/description header with `FormHeader`. Add `FormDesignPanel` to the toolbar. Apply selected theme to `globalColors` and save merged settings through `api.forms.update`.

- [ ] **Step 4: Verify builder**

Run: `npm run lint` and `npm run build`

Expected: both pass.

### Task 5: Public Form Integration

**Files:**
- Modify: `src/pages/PublicForm.tsx`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Fetch full settings publicly**

Update public form select to include form `settings`.

- [ ] **Step 2: Apply theme and header**

Use `resolveFormTheme` and `FormHeader` in `PublicForm.tsx`. Apply theme font, surface, and border settings to the form page and question separators.

- [ ] **Step 3: Verify public form**

Run: `npm run lint` and `npm run build`

Expected: both pass.

### Task 6: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 2: Review changed files**

Run:

```bash
git diff --stat
git status --short
```

Expected: only implementation files and docs are changed.
