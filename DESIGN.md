---
name: Pantry
description: A calm, trustworthy household ledger for stock, recipes, meal plans, and shopping.
colors:
  ember-orange: "#ea580c"
  ember-orange-bright: "#f97316"
  ember-orange-deep: "#c2410c"
  ember-orange-soft: "#fb923c"
  slate-50: "#f8fafc"
  slate-100: "#f1f5f9"
  slate-200: "#e2e8f0"
  slate-300: "#cbd5e1"
  slate-400: "#94a3b8"
  slate-500: "#64748b"
  slate-600: "#475569"
  slate-700: "#334155"
  slate-800: "#1e293b"
  slate-900: "#0f172a"
  slate-950: "#020617"
  night-navy: "#141c2e"
  night-navy-deep: "#0d1322"
  morning-haze: "rgba(56, 189, 248, 0.08)"
  fresh-emerald: "#059669"
  expiring-amber: "#d97706"
  expired-rose: "#e11d48"
  white: "#ffffff"
typography:
  page-title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.5rem, 1.25rem + 1vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  value:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  badge-sm: "6px"
  badge: "8px"
  control: "12px"
  card: "16px"
  pill: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-sm: "24px"
  gutter-lg: "32px"
  section-gap: "24px"
  action-gap: "12px"
  form-measure: "640px"
  workspace-max: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "42px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ember-orange-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.slate-700}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "42px"
  button-secondary-hover:
    backgroundColor: "{colors.slate-100}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-500}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "42px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.slate-400}"
    rounded: "{rounded.control}"
    size: "42px"
  input:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.slate-900}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "42px"
  card:
    backgroundColor: "rgba(255, 255, 255, 0.94)"
    rounded: "{rounded.card}"
    padding: "20px"
  sub-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.control}"
  badge-neutral:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.slate-700}"
    rounded: "{rounded.badge}"
    padding: "4px 10px"
    typography: "{typography.meta}"
  nav-item-active:
    backgroundColor: "rgba(249, 115, 22, 0.1)"
    textColor: "{colors.ember-orange}"
---

# Design System: Pantry

> This is the single source of truth for Pantry's visual design. Product context lives in [PRODUCT.md](PRODUCT.md). Older specs are archived in `docs/archive/`; see [Implementation](#implementation).

## Overview

**Creative North Star: "The Calm Kitchen Ledger"**

Pantry is a quiet, trustworthy record of a household's food. The interface behaves like a well-kept ledger. Content sits on clean, nearly opaque surfaces with even rhythm and predictable controls, so you can trust a glance on a phone in the kitchen as much as a planning session at a desk. The system shows information plainly and does not perform.

The atmosphere stays in the background. The app shell carries a pale Morning Haze sky (soft radial glows and a faint 28px dot grid) behind every page. Content never competes with it: cards are 92–96% opaque, so the haze only reads at the margins. Ember Orange is the one warm note in a cool, slate-and-sky world. It marks where you act and where you are, and it does nothing else. Status colors (emerald, amber, rose) carry the food's condition and never decorate.

Density is moderate and intentional. Body text starts at 14px, every single-line control is 42px tall, and pages keep useful information visible instead of hiding it behind extra framing. Minimalism here means fewer decisions and clearer relationships, not less information. Light and dark themes are first-class peers; neither is the fallback.

**Key Characteristics:**

- Cool slate neutrals over a pale sky-blue haze; Ember Orange reserved for actions and the current location.
- Nearly opaque frosted cards, quietly layered on borders and tone rather than shadow.
- One 42px control height and soft 12px corners across buttons, inputs, selects, and date pickers.
- Native system sans with five named type roles; natural case, no tracked uppercase labels.
- Emerald / amber / rose status language for fresh / expiring / expired stock.
- Full light and dark themes, toggled by a `.dark` class.

## Colors

A cool, restrained palette: slate structure, a pale sky atmosphere, and a single warm accent that means "act here."

### Primary

- **Ember Orange** (`ember-orange`): primary buttons, the active navigation item and its 3.5px left rule, selected states, and accent text. In dark mode, accent text and active nav lift to **Ember Orange Soft** (`ember-orange-soft`) or the 300–400 range for legibility.
- **Ember Orange Bright** (`ember-orange-bright`): focus borders and focus rings (`ring` at 25% opacity in light, 35% in dark), and status dots for the primary/location badge.
- **Ember Orange Deep** (`ember-orange-deep`): primary button hover.

### Neutral

- **Slate 50 → 950** (`slate-50` … `slate-950`): the entire structural range. Slate 50 is the light page base, 950 the dark one. Slate 900 / 100 is primary text in light / dark. Slate 600 / 300 is labels and secondary text. Slate 200 / 700 is borders and separators. Slate 100 is the light input fill.
- **Morning Haze** (`morning-haze`): the pale sky-blue radial wash at the top of the shell background, supported by faint blue glows at the corners. It is atmosphere only; never use it as a fill for content or controls.
- **Night Navy** (`night-navy`, `night-navy-deep`): floating menus and workspace popovers that need to sit above both themes.

### Status

- **Fresh Emerald** (`fresh-emerald`): fresh stock, in-cart items, positive metrics.
- **Expiring Amber** (`expiring-amber`): expiring soon, warnings.
- **Expired Rose** (`expired-rose`): expired stock, errors, destructive actions.

Status badges use the hue at 10% fill with a 20% border and full-strength text (400-level text in dark mode).

### Named Rules

**The One Warm Note Rule.** Ember Orange is the only warm hue outside status. It marks an action, a selection, or where you are. If an orange element is not clickable or current, it is wrong.

**The Status Is Not Decoration Rule.** Emerald, amber, and rose describe the food's condition. Never use them for category color, branding, or emphasis. Always pair them with a label or icon; color alone never carries status.

## Typography

**Body Font:** native system sans (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), used for everything including PrimeNG fields and dialogs.

**Character:** the platform's own voice. It is familiar, legible at small sizes, and free to load. Hierarchy comes from five named roles and semibold weight, never from extra-bold or tracked capitals.

### Hierarchy

- **Page title** (600, fluid 24–30px, 1.2, −0.025em): one per page, in the page header.
- **Section title** (600, 18px, 1.35, −0.015em): headings for cards and page sections.
- **Value** (600, 24px, 1.2, tabular numerals): summary numbers such as stock counts and totals.
- **Body** (400, 14px, 1.5): default text and control text.
- **Label** (500, 13px, 1.4, natural case): field and table labels. Labels can wrap; label rows use a minimum height, not a fixed one.
- **Meta** (400, 12px, 1.5): supporting metadata, timestamps, and badge text (badges use 500 weight).

### Named Rules

**The Natural Case Rule.** Labels keep their source casing. Uppercase is only for a deliberate short overline, never for routine field labels.

**The Role, Not Size Rule.** Use the named role classes (`type-page-title`, `type-section-title`, `type-label`, `type-meta`, `type-value`) instead of ad hoc size and weight utilities. Keep each role's color token; a quieter weight must not make help text unreadable.

## Layout

The app shell owns the outer gutters inside a 1280px workspace: 16px on phones, 24px from 640px, 32px from 1024px. Pages must not add another outer horizontal or vertical padding wrapper. The breadcrumb, page heading, and content share the shell edge.

- **Page layout:** full workspace width, 24px gaps between sections.
- **Form layout:** left-aligned, 640px maximum measure, for compact forms only. Never narrow tables or long editors.
- **Page header:** title and context first, then actions. It stacks on phones and goes horizontal from 640px. The action group wraps with 12px gaps.
- **Compact header:** title and a short trailing back action share one row.
- **Toolbars** wrap instead of squeezing. Search keeps a 240px minimum on desktop. Filter buttons keep 42px targets and unbroken labels.
- **Tables** keep full workspace width and scroll horizontally inside their card. Never shrink a desktop table to fit a phone; on phones, put names and next actions first.
- Breakpoints follow Tailwind defaults (640 / 768 / 1024 / 1280). Primary flows must reflow at 320px without clipping.

## Elevation & Depth

Quietly layered. Depth comes mostly from tone and borders: nearly opaque cards over the haze, white or translucent sub-panels inside them, and 1px slate borders that define every edge. Card shadows are ambient and barely visible in light mode. Only floating layers (select overlays, date pickers, popovers, dialogs) visibly lift off the page.

### Shadow Vocabulary

- **Card ambient** (`0 4px 14px -4px rgba(15,23,42,0.05), 0 1px 3px 0 rgba(15,23,42,0.03)`; dark: `0 4px 14px -4px rgba(0,0,0,0.3), 0 1px 3px 0 rgba(0,0,0,0.2)`): main cards.
- **Sub-panel inset** (`inset 0 1px 2px #fff, 0 1px 3px rgba(15,23,42,0.04)`; dark: `inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.25)`): panels nested inside a card.
- **Floating overlay** (`0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)`; dark at 0.5 / 0.4): select overlays, date pickers, popovers.
- **Focus ring** (`0 0 0 2px rgba(249,115,22,0.25)`; dark 0.35): focused fields, paired with an Ember Orange Bright border.

### Named Rules

**The Only Floaters Lift Rule.** A surface casts a noticeable shadow only when it floats above the page (menus, overlays, dialogs). Content cards stay flat-feeling; to separate content, add a border or a tonal step, not a bigger shadow.

**The One Frame Rule.** Don't nest framed surfaces more than one level deep (a card can hold sub-panels; a sub-panel never holds another card).

## Shapes

Soft, consistent corners at two main sizes. Controls (buttons, inputs, selects, date pickers, overlays) use a 12px radius. Cards and structural containers use 16px. Sub-panels use 12px. Badges use 8px (6px at the small size), and progress tracks and legacy pill badges are fully rounded. Every surface has a 1px border; there are no borderless floating panels and no sharp corners.

## Components

Refined and restrained: polished, low-contrast chrome that steps back behind the food data. Shared primitives are exported from `@ui` (`frontend/src/app/components/ui/index.ts`); check `@ui` before building anything, and never hand-roll a local copy of a primitive. The dev-only `/design-system` route renders every primitive in its key states.

### Buttons

Buttons are global CSS classes in `frontend/src/styles.scss`, applied as `<button class="btn-*">`. Layout utilities (`w-full`, margins, positioning) compose freely; visual styling is never re-declared inline.

- **Shape:** gently rounded (12px), always 42px tall.
- **Primary (`btn-primary`):** Ember Orange fill, white 14px semibold text, 20px side padding, 8px icon gap, no shadow. Hover deepens to Ember Orange Deep; press scales to 0.98. Disabled is 50% opacity.
- **Secondary (`btn-secondary`):** transparent with a 1px Slate 200 border and Slate 700 text; hover fills with Slate 100. In dark mode it uses a Slate 700 border, Slate 300 text, and Slate 800 hover.
- **Ghost (`btn-ghost`):** transparent, Slate 500 text, 14px padding; hover darkens the text and fills with Slate 100.
- **Danger (`btn-danger`):** rose at 10% fill with a 20% rose border and rose text; hover goes to 20% fill.
- **Icon (`btn-icon`):** 42×42, bordered, Slate 400 icon.
- **Compact icon (`btn-icon-sm`):** 32×32 with an 8px radius, for dense contexts (table rows, card headers). It must always carry an `aria-label`. There are no further sizes.
- **Transitions:** 200ms ease on color and background.

### Badges (`pantry-badge`)

- **Style:** tinted fill (hue at 10%), 20% border, full-strength text, 12px medium text, 8px radius (6px at `sm`).
- **Variants:** `fresh` (emerald), `expiring` (amber), `expired` (rose), `primary` (orange), `neutral` (slate), `location` (slate with an orange dot, for Fridge / Freezer / Pantry), `outline`. Sizes: `sm`, `md`. Request a new variant rather than inventing markup.
- **Options:** `icon`; `dot` (6px status dot); `live` pulses the dot and is only for data that updates continuously; `borderless` drops the outline for subtle unit and tag chips in tables (for example, the Default Unit column).
- **Taxonomy reference columns:** when a table column shows a reference to another taxonomy entity (Ingredient, Ingredient Group, Ingredient Category), render it as `<pantry-badge variant="primary">`. A missing reference renders as muted italic "Unassigned" meta text (`text-surface-400 italic text-xs`), never a hand-rolled pill.

### Cards / Containers (`pantry-card`)

- **Variants:** `glass` (default, the main card), `sub` (a panel nested inside a card), `elevated` (solid white / Slate 800 with a stronger shadow, for the rare surface that must stand above its neighbors). `hover` makes a sub-panel interactive. Padding: `none`, `sm` (12–16px), `md` (20–24px, default), `lg` (24–32px); each grows at 640px.
- **Corner Style:** 16px for cards, 12px for sub-panels.
- **Background:** white at 94% (dark: Slate 800 at 92%). Sub-panels are solid white (dark: Slate 800 at 45%).
- **Shadow Strategy:** card ambient and sub-panel inset (see Elevation & Depth).
- **Border:** 1px Slate 200 at 80–90% (dark: white at 8%).
- **Hover (interactive sub-panels only):** border steps up to Slate 300; dark mode raises the fill to 65%.

### Inputs / Fields

- **Style:** 42px fixed height, 12px radius, 1px Slate 200 border, 14px medium text, 14px side padding. Standalone fields fill with Slate 100. Textareas keep their multiline height.
- **Hover:** border steps up one tone.
- **Focus:** Ember Orange Bright border plus a 2px orange ring at 25% (35% in dark). There is no browser outline.
- **Form fields (`pantry-form-field`):** owns the label, required asterisk, hint, error, and optional badge. Inside it, inputs, selects, number inputs, textareas, and date-picker containers share one surface: white at 80% (dark: Slate 900 at 80%) with the same border. Date-picker inner inputs stay transparent so the container supplies one continuous surface. `forId` must match the native focus target or the PrimeNG `inputId`. The field associates projected `NgControl` targets with its hint/error IDs and invalid state, and preserves external `aria-describedby` tokens; a plain input without Angular forms needs `#fieldControl`. Labels wrap. Long forms may focus an actionable validation summary after an invalid submit; each error button focuses its field.
- **Search (`pantry-search-input`):** the only search field. 42px, leading search icon, clear button, Escape clears, focus managed.

### Selects / Dropdowns

- Always PrimeNG `p-select` (with `[filter]="true"` for type-to-filter) or `p-autoComplete`. Never a native `<select>` or a hand-rolled `<ul><li>` menu.
- Always `appendTo="body"` on `p-select`, `p-dialog`, and `p-datepicker` to prevent clipping.
- **Trigger:** 42px, 12px radius, 1px Slate 200 border (dark: Slate 700). Form selects are the default (`data-select-variant="form"` is optional). Outside `pantry-form-field` they inherit the global input surface.
- **Filter variant:** toolbar filters and sort controls carry `data-select-variant="filter"` to keep the segmented pill-bar surface (Slate 100 / Slate 800) and muted labels. Clearable table filters use `styleClass="pantry-filter-select"` with `[showClear]="true"`: the trigger fits its content with 4px extra inline padding, a trailing chevron, and a 30px borderless clear area only while a selection is active. Long labels truncate; clearing restores the unfiltered state.
- **Overlay:** Slate 100 (dark: Slate 800), 12px radius, floating overlay shadow.

### Feedback & Loading

- **Spinner (`pantry-spinner`):** sizes `xs`–`lg`; colors `primary`, `white`, `surface`; `inline` or `stacked`. It announces itself (`role="status"`, polite). Never copy an `animate-spin` SVG or border spinner into a page.
- **Skeleton (`pantry-skeleton`):** `card`, `row`, `text`, `circle`, `custom`, with `count`. Never use raw `animate-pulse` placeholder divs.
- **Empty state (`pantry-empty-state`):** title, optional description, icon, and one action; `glass` or `plain`.
- **Notifications:** success is a polite status announcement; errors are assertive alerts that persist until dismissed. Neither moves focus. Toasts wrap long text, respect safe areas, and fit a narrow viewport. An actionable save error belongs next to the form with retry and retained input; a toast only complements confirmed success.

### Dialogs

Body-mounted dialogs have viewport bounds and restore focus to a visible, non-inert opener (breakpoint changes may update `returnFocusTo`). Kitchen creation always uses the shared `KitchenCreateDialogComponent` (sidebar and Profile): it owns validation, the pending request, the `KitchenService` cache update, translated success feedback, and persistent inline failure. A pending create blocks dismissal and duplicate submission.

### Pagination

One quiet range status and a plain page indicator with `aria-current="page"`; every control uses the 42px contract. Inventory table footers sit inside their table cards with the same border, padding, and type roles. Phones show previous / current / next and a labeled row-count selector; desktop adds first / last. Filtering or shrinking a result set resets or clamps the page. Static results never pulse.

### Navigation

- **Sidebar:** a near-transparent glass rail (4px blur) with a hairline right border. Items use 500-weight Slate 600 text (dark: Slate 300).
- **Hover:** soft Slate 200 at 50% fill (dark: white at 10%, with the text tinted orange).
- **Active:** Ember Orange at 10% fill (dark: 20%), a 3.5px Ember Orange left rule, and semibold orange text. The current-page marker requires an exact normalized path match.
- **Sub-navigation:** text-only. Slate 500 at rest, darker on hover, semibold orange when active, with no fill.
- **Semantics:** destinations are native `RouterLink` anchors; disclosure and action controls stay buttons. Navigation targets keep a 42px minimum height.
- **Breadcrumbs:** quiet text in a semantic ordered list, with only the final item marked current. Deep paths show parent / current on phones and the full path on desktop.
- **Mobile drawer:** a modal drawer, almost opaque so it stays readable over the atmosphere. Closed content is inert; opening focuses its close button; Tab stays inside; Escape, the backdrop, and choosing a destination close it, and focus returns to the menu trigger. Desktop collapse is a separate preference and never hides mobile sub-navigation.
- **Motion:** 240ms `cubic-bezier(0.22, 1, 0.36, 1)` on background, border, and shadow.
- **Header:** white at 96% (dark: Slate 900 at 96%) with a hairline bottom border.

### Shell Atmosphere (signature)

The fixed background behind every page combines a Slate 50 base (dark: Slate 900) with a Morning Haze radial wash at the top, two faint blue corner glows, and a 28px dot grid at 12% opacity (8% in dark). It is static by default; any ambient motion stops under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:

- **Do** keep every single-line control at exactly 42px tall with a 12px radius.
- **Do** use Ember Orange only for primary actions, focus, selection, and the current navigation location.
- **Do** use the five named type roles and natural-case labels.
- **Do** separate content with 1px slate borders and tonal steps before reaching for shadow.
- **Do** pair every status color with a text label or icon, in both themes.
- **Do** let the shell own outer gutters; pages set only their content measure.
- **Do** verify light and dark themes together; check contrast against the composited card surface, not the raw token.
- **Do** provide `prefers-reduced-motion` fallbacks for any animation.
- **Do** use design tokens (`primary-*`, `surface-*`, `navy-900`) instead of hex values in templates.

### Don't:

- **Don't** use emerald, amber, or rose for decoration, categories, or branding.
- **Don't** use tracked uppercase field labels or extra-bold headings.
- **Don't** nest a card inside a sub-panel, or add competing headings and badge clusters around a task.
- **Don't** add outer horizontal or vertical padding wrappers to pages.
- **Don't** put content directly on the haze background; it belongs on a card.
- **Don't** shrink desktop tables or controls to fit phones; restructure instead.
- **Don't** hand-roll search inputs, spinners, skeletons, empty states, badge pills, native selects, or popup menus; use the `@ui` primitive or PrimeNG control.
- **Don't** write long inline Tailwind button strings; use the `btn-*` classes.
- **Don't** hardcode brand hexes (`#ea580c`, `#141c2e`, `#0d1322`, `#f8fafc`) in templates.
- **Don't** introduce new control heights, radii, button variants, or badge variants without recording them in this file.

## Implementation

This file is the single source of truth for Pantry's visual design. If another document disagrees with it, this file wins; fix the other document or archive it. Product facts live in `PRODUCT.md`; the sidecar `.impeccable/design.json` carries machine-readable extensions and is regenerated with this file.

### Where to change things

| To change                                                       | Location                                                                                    | Notes                                                                                                                                                                                                                                       |
| :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Color, font, and type-role tokens                               | `frontend/src/styles.scss` (`@theme`, `type-*` classes)                                     | Update the frontmatter here in the same change.                                                                                                                                                                                             |
| Brand primary palette                                           | `frontend/src/app/app.config.ts` (`MyPreset`) + `@theme` `--color-primary-*`                | Change both together.                                                                                                                                                                                                                       |
| Navy popovers                                                   | `@theme` `--color-navy-900`                                                                 | Consume via `bg-navy-900`.                                                                                                                                                                                                                  |
| All buttons                                                     | `frontend/src/styles.scss` button contract classes                                          | Every `btn-*` consumer inherits.                                                                                                                                                                                                            |
| All inputs, selects, overlays, date pickers                     | `frontend/src/styles.scss` PrimeNG override block                                           | Every PrimeNG control inherits.                                                                                                                                                                                                             |
| Card surfaces and atmosphere                                    | `frontend/src/styles.scss` (`.glass-card`, `.sub-card`, shell background) and `pantry-card` |                                                                                                                                                                                                                                             |
| Search, spinner, skeleton, empty state, badge, form field, card | `frontend/src/app/components/ui/<name>/`                                                    | Edit the primitive; add a typed variant prop for page-specific needs. Fall back to a scoped override only when a prop genuinely doesn't fit, and record it under Documented Exceptions.                                                     |
| Dark mode                                                       | `frontend/src/app/core/services/theme.service.ts`                                           | `ThemeService` is the only writer of the `.dark` class on `<html>`; it syncs with the user's `themePreference`. `index.html` applies dark pre-boot to prevent a light flash. Never touch `documentElement.classList` for theming elsewhere. |

### Documented Exceptions

These are the only sanctioned deviations. Each is allowlisted in `frontend/tools/check-design-system.mjs` and must keep its reason here.

| Location                                               | Pattern                                                              | Why it remains                                                                                  |
| :----------------------------------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `ingredient-category.component.html`                   | Raw hex fallback `#ea580c` for data-driven category colors           | Colors come from backend data; hex concatenation builds tints dynamically.                      |
| `ingredient-categories-page.component.html`            | Raw hex fallback `#8b5cf6` for data-driven group colors              | Same data-driven tinting; violet-500 is the fallback for missing group color data.              |
| `app.component.html` (hero SVG)                        | Literal gradient stops `#38bdf8` / `#60a5fa` / `#3b82f6` / `#0ea5e9` | Decorative artwork; SVG `stop-color` has no token equivalent.                                   |
| `add-recipe-form.component.html` (difficulty selector) | Emerald / amber / rose bordered state buttons                        | A segmented state selector whose branches are the visual state; not a badge or standard button. |
| `daily-focus.component.html` (status tile)             | Emerald / rose pill ternary inside a 40px icon tile                  | A composite status tile (icon + text), not a badge.                                             |

Anything else that trips the guardrails is a regression; fix it with the canonical pattern. To request a new exception, add an entry to `ALLOWLIST` in `frontend/tools/check-design-system.mjs` **and** a row above. Unexplained allowlist entries are rejected in review.

### Enforcement

- `npm run lint:design-system` scans page and component templates (including inline `.ts` templates and the app shell) and fails on native `<select>`, `animate-spin` spinners, `animate-pulse` skeletons, inline primary-button strings, inline badge pills, and hardcoded brand hexes.
- `npm run validate:design-system` is the full gate for every UI task: Prettier → ESLint → design-system guardrails → i18n guardrail → Vitest → production build.
- Component specs in `frontend/src/app/components/ui/*/` cover each primitive's variants and states.
- When replacing a pattern, migrate every caller, then remove the dead styles; never leave a parallel "temporary" implementation.

### Current state notes

- **Typography** is the October 2026 system-font prototype (it replaced Inter). Validate wrapping and platform font differences before treating it as final. Background: `docs/typography-prototype.md`.
- **Page geometry** (`page-layout`, `page-header`) is adopted by Home, Ingredient Items, and Add Ingredient; migrate other pages in their own tasks.
- **Inventory rollback (2026-10-04):** the Ingredient, Ingredient Item, and Ingredient Group pages and forms were restored to their original implementations at the user's request. The cleanup-specific inventory toolbar, table, shared editor, and centered-form classes are gone; earlier I-phase screenshots and contracts no longer describe the live inventory pages. See `docs/design-evidence/inventory-rollback/README.md`.

### Related records (history, not authority)

- `docs/design-review-2026-10-03.md`: the full-application design review and its findings.
- `docs/ui-cleanup-plan.md`: the living cleanup plan and task progress.
- `docs/design-evidence/`: rendered verification evidence (for example, `S03-S07/README.md`).
- `docs/archive/`: superseded specifications (`design-system.md`, `design-system-index.md`, `design-system-audit.md`, `DESIGN_SYSTEM.md`).
