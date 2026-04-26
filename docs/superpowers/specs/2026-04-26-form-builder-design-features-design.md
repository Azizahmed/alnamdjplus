# Form Builder Design Features

Date: 2026-04-26

## Goal

Add three production-ready form design capabilities:

1. Drag-and-drop reordering for form questions.
2. Eight selectable visual themes.
3. Header image and logo upload with a simple fixed header layout.

These features must affect both the builder canvas and the published public form so users see the final appearance while editing.

## Current Context

The application already has the main primitives needed for this work:

- `form_questions` records contain `order`, normalized in the frontend as `question_order`.
- `api.questions.reorder()` updates question order values.
- Form appearance already lives in `forms.settings`.
- Builder colors are controlled from `FormBuilder.tsx` through `formData.settings`.
- Published form colors are read in `PublicForm.tsx` from `formData.settings`.
- Storage upload is available through `api.storage.upload(bucket, file, path)`.
- `@dnd-kit/core` and related packages are already installed.

## Recommended Architecture

Use `forms.settings` as the single source of truth for all new design data. This avoids new tables and keeps the builder and public renderer aligned.

New settings fields:

```ts
{
  theme_id?: string;
  theme_font_family?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  bold_text_color?: string;
  header_image_url?: string;
  header_image_key?: string;
  logo_url?: string;
  logo_key?: string;
}
```

The theme preset stores color/font values in the same fields already used by the app. Header and logo assets store both the public URL and storage key so future removal/replacement can delete stale files if needed.

## Feature Design

### 1. Drag-and-Drop Reordering

Wrap the visible question list in `DndContext` and `SortableContext` from `@dnd-kit`.

Each question block becomes a sortable item with:

- A visible drag handle near the existing edit/condition/color/delete controls.
- Keyboard and pointer sensor support.
- A lightweight dragging style: raised shadow, subtle opacity, and stable dimensions.

On drag end:

1. Sort current questions by `question_order`.
2. Move the dragged question to the new index.
3. Reassign sequential `question_order` values.
4. Update `formData.questions` immediately for responsive UI.
5. Persist with `api.questions.reorder()`.
6. If persistence fails, refetch the form and show an error notification.

This keeps conditional rules intact because question IDs do not change.

### 2. Theme Selection

Add a compact design panel in the builder toolbar. It should expose eight pre-designed theme presets with names, swatches, and a one-click apply action.

Themes should include a mix of practical production styles:

- Alnamdj Core
- Executive Ink
- Calm Mint
- Civic Blue
- Warm Paper
- Clinic Green
- Event Night
- Minimal Slate

Each theme controls:

- Page background.
- Primary text.
- Accent color.
- Bold/highlight color.
- Font family token.
- Subtle surface/border styling where needed.

When a theme is selected:

1. Update `forms.settings` locally.
2. Save settings through `api.forms.update(formId, { settings })`.
3. Update the existing `globalColors` state so older color controls remain consistent.
4. Render the selected theme in both builder and public form.

The existing manual background/text color buttons should remain available for fine tuning after a preset is chosen.

### 3. Header Image and Logo Upload

Add upload controls in the same design panel:

- Header image upload.
- Logo upload.
- Remove header image.
- Remove logo.

Accepted files:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/svg+xml` for logos only

Suggested limits:

- Header image: 5 MB.
- Logo: 2 MB.

Storage paths:

```txt
form-design/{formId}/header-{uuid}-{safeName}
form-design/{formId}/logo-{uuid}-{safeName}
```

The simple fixed layout:

- Header image spans the top of the form as a cover image.
- Header has a readable overlay gradient.
- Logo appears inside the header, aligned top/right for RTL.
- Title and description remain below or over the header depending on readability; initial implementation should place title/description below the image in a clean white/surface area to avoid text contrast problems.

Builder and public form should use the same `FormHeaderPreview` style so visual parity is high.

## Components and Files

Expected changes:

- `src/theme/formThemes.ts`
  - Theme definitions and helper functions.
- `src/components/FormDesignPanel.tsx`
  - Theme picker and upload controls.
- `src/components/FormHeader.tsx`
  - Shared builder/public header rendering.
- `src/components/SortableQuestionBlock.tsx`
  - Sortable wrapper around existing builder question content.
- `src/components/steps/FormBuilder.tsx`
  - Integrate sortable list, design panel, settings saves, header preview.
- `src/pages/PublicForm.tsx`
  - Apply selected theme and render header image/logo.
- `src/services/api.ts`
  - Add optional storage removal helper if needed.

## Data Flow

Theme:

```txt
User selects theme
  -> FormDesignPanel emits settings patch
  -> FormBuilder merges patch into formData.settings
  -> api.forms.update persists settings
  -> Builder preview and PublicForm read same settings
```

Header/logo:

```txt
User selects image file
  -> Validate type and size
  -> api.storage.upload('form-uploads', file, path)
  -> Save returned url/key in forms.settings
  -> Header preview updates immediately
```

Reorder:

```txt
User drags question
  -> DnD computes old/new index
  -> local question_order values reassigned
  -> api.questions.reorder persists each order
  -> refetch on failure
```

## Error Handling

- Invalid file type or size shows a notification and does not upload.
- Upload failure leaves existing header/logo unchanged.
- Reorder failure refetches the form from the backend.
- Theme save failure keeps local UI responsive but shows an error and allows retry by selecting again.
- Public form falls back to default colors if a theme or setting is missing.

## Testing and Verification

Manual checks:

- Reorder questions with mouse drag; refresh builder and confirm order persists.
- Reorder first to last and last to first.
- Select all eight themes and confirm colors/fonts change in builder.
- Publish/preview form and confirm selected theme appears on public form.
- Upload header image and logo; confirm both render in builder and public form.
- Remove uploaded assets and confirm fallback layout.
- Validate upload rejection for unsupported file type and oversized file.

Automated/project checks:

- `npm run lint`
- `npm run build`

## Scope Boundaries

This version intentionally does not include:

- Freeform logo drag positioning.
- Image crop editor.
- Per-question theme overrides.
- New database tables.
- Advanced theme marketplace/import.

Those can be added later if users need deeper brand control.
