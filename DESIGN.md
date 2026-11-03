---
name: Pantry
description: A calm, trustworthy household ledger for stock, recipes, meal plans, and shopping.
colors:
  ember-orange: "#ea580c"
  ember-orange-bright: "#f97316"
  ember-orange-deep: "#c2410c"
  ember-orange-deeper: "#9a3412"
  ember-orange-deepest: "#7c2d12"
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
    backgroundColor: "{colors.ember-orange-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "42px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ember-orange-deeper}"
  button-primary-active:
    backgroundColor: "{colors.ember-orange-deepest}"
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
    textColor: "{colors.slate-500}"
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
    textColor: "{colors.ember-orange-deep}"
---

# Design System: Pantry

> This is the single source of truth for Pantry's visual design. Product context lives in [PRODUCT.md](PRODUCT.md). Older specs are archived in `docs/archive/`; see [Implementation](#implementation).

## Overview

**Creative North Star: "The Calm Kitchen Ledger"**

Pantry is a quiet, trustworthy record of a household's food. The interface behaves like a well-kept ledger. Content sits on clean, nearly opaque surfaces with even rhythm and predictable controls, so you can trust a glance on a phone in the kitchen as much as a planning session at a desk. The system shows information plainly and does not perform.

The atmosphere stays in the background. The app shell carries a static pale Morning Haze sky behind every page. The sky has soft radial glows and a faint 28px dot grid. The sky has no particles, utensils, or waves. Content never competes with it. Cards are 92–96% opaque, so the haze only reads at the margins. Ember Orange is the one warm note in a cool, slate-and-sky world. It marks where you act and where you are. It does nothing else. Status colors (emerald, amber, rose) carry the food's condition. They never decorate.

Density is moderate and intentional. Body text starts at 14px. Every single-line control is 42px tall. Pages keep useful information visible. They do not hide it behind extra framing. Minimalism here means fewer decisions and clearer relationships. It does not mean less information. Light and dark themes are first-class peers. Neither theme is the fallback. The theme follows the stored choice. If no stored choice exists, the theme follows the operating system.

**Key Characteristics:**

- Cool slate neutrals over a pale sky-blue haze; Ember Orange reserved for actions and the current location.
- Nearly opaque frosted cards, quietly layered on borders and tone rather than shadow.
- One 42px control height and soft 12px corners across buttons, inputs, selects, and date pickers.
- Native system sans with five named type roles; natural case, no tracked uppercase labels.
- Emerald / amber / rose status language for fresh / expiring / expired stock.
- Full light and dark themes, toggled by a `.dark` class. The first visit follows `prefers-color-scheme`.
- Text and control colors meet WCAG 2.2 AA (4.5:1 for text, 3:1 for icons and control edges) in both themes.

## Colors

A cool, restrained palette: slate structure, a pale sky atmosphere, and a single warm accent that means "act here."

### Primary

- **Ember Orange Deep** (`ember-orange-deep`, `primary-700`, `#c2410c`): the primary button fill, links, accent text, the active navigation item, and the `primary` badge text in light mode. White text on this fill has a 5.18:1 contrast ratio. Hover goes to `ember-orange-deeper` (`primary-800`). Active (pressed) goes to `ember-orange-deepest` (`primary-900`).
- **Ember Orange** (`ember-orange`, `primary-600`, `#ea580c`): the 3.5px left rule of the active navigation item, tints and selected-state fills, and large decorative accents. Do not use it as a fill behind white text. Do not use it for light-mode text or links, because it has 3.6:1 contrast on white.
- **Ember Orange Soft** (`ember-orange-soft`): in dark mode, accent text, links, and the active navigation item use `ember-orange-soft` or the 300–400 range.
- **Ember Orange Bright** (`ember-orange-bright`): focus borders and focus rings (`ring` at 25% opacity in light, 35% in dark), and status dots for the `primary` badge.
- **Links:** light mode uses `primary-700`. Dark mode uses `primary-300` or `primary-400`. Links keep a visible focus ring.

### Neutral

- **Slate 50 → 950** (`slate-50` … `slate-950`): the entire structural range. Slate 50 is the light page base. Slate 900 is the dark page base. Use Slate 950 only for the deepest dark tints. Never use it as a page base. Slate 900 / 100 is primary text in light / dark. Slate 600 / 300 is labels and secondary text. Slate 200 / 700 is borders and separators. Slate 100 is the light input fill.
- **Morning Haze** (`morning-haze`): the pale sky-blue radial wash at the top of the shell background, supported by faint blue glows at the corners. It is atmosphere only; never use it as a fill for content or controls.
- **Night Navy** (`night-navy`, `night-navy-deep`): floating menus and workspace popovers that need to sit above both themes.
- **Minimum text contrast:** secondary and meta text uses Slate 500 or darker in light mode. In dark mode, it uses Slate 400 or lighter. Do not use `text-surface-400` for meta text in light mode.

### Status

- **Fresh Emerald** (`fresh-emerald`): fresh stock, in-cart items, positive metrics.
- **Expiring Amber** (`expiring-amber`): expiring soon, warnings.
- **Expired Rose** (`expired-rose`): expired stock, errors, destructive actions.

Status badges use the hue at 10% fill with a 20% border. Badge and alert text uses the 700 level in light mode. In dark mode, it uses the 300–400 level. The 600 level fails AA at 12px.

Error text is the exception. Error text and the `btn-danger` text use `rose-600` in light mode (4.7:1) and `rose-400` in dark mode. Do not change error text to `rose-700`.

**Expiry window:** an item is "expiring soon" when it expires in 7 days or fewer. Home, Inventory overview, and the stock utilities use this one value. Do not add a second window.

### Named Rules

**The One Warm Note Rule.** Ember Orange is the only warm hue outside status. It marks an action, a selection, or where you are. If an orange element is not clickable or current, it is wrong.

**The Status Is Not Decoration Rule.** Emerald, amber, and rose describe the food's condition. Never use them for category color, branding, or emphasis. Always pair them with a label or icon. Color alone never carries status. Category and group colors never use the status hues. See Documented Exceptions for the allowed palette clamp.

**The Orange Means Clickable Rule.** A non-clickable orange fill is wrong. A `primary` badge is not clickable. Use it only where it is a link or a filter. A taxonomy reference that has no link uses a `neutral` badge. Documented Exceptions lists the only non-clickable orange exceptions.

## Typography

**Body Font:** native system sans (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), used for everything including PrimeNG fields and dialogs.

**Character:** the platform's own voice. It is familiar, legible at small sizes, and free to load. Hierarchy comes from five named roles and semibold weight, never from extra-bold or tracked capitals.

### Hierarchy

- **Page title** (600, fluid 24–30px, 1.2, −0.025em): one per page, in the page header.
- **Section title** (600, 18px, 1.35, −0.015em): headings for cards and page sections.
- **Value** (600, 24px, 1.2, tabular numerals): summary numbers such as stock counts and totals. Do not use Value for counts inside list rows.
- **Body** (400, 14px, 1.5): default text and control text.
- **Label** (500, 13px, 1.4, natural case): field and table labels, and counts in list rows (`type-label tabular-nums`). Labels can wrap. Label rows use a minimum height, not a fixed one.
- **Meta** (400, 12px, 1.5): supporting metadata, timestamps, and badge text (badges use 500 weight).

### Named Rules

**The Natural Case Rule.** Use sentence case for all UI text: headings, labels, buttons, navigation, and menu items. Capitalize only the first word and proper nouns. Uppercase is only for a deliberate short overline, never for routine field labels. Do not combine `uppercase` with `tracking-*`.

**The Minimum Size Rule.** Do not use text smaller than `text-xs` (12px). Do not use arbitrary 9–11px sizes. Do not use `font-extrabold`.

**The Role, Not Size Rule.** Use the named role classes (`type-page-title`, `type-section-title`, `type-label`, `type-meta`, `type-value`) instead of ad hoc size and weight utilities. Keep each role's color token; a quieter weight must not make help text unreadable.

## Layout

The app shell owns the outer gutters inside a 1280px workspace: 16px on phones, 24px from 640px, 32px from 1024px. Pages must not add another outer horizontal or vertical padding wrapper. The breadcrumb, page heading, and content share the shell edge.

- **Page layout:** full workspace width, 24px gaps between sections. The root element of a page template must not set `max-w-*` with `mx-auto`. Use `page-layout` and `page-header`.
- **Auth pages:** the login and sign-up forms sit inside a `pantry-card`, not directly on the haze.
- **Form layout:** left-aligned, 640px maximum measure, for compact forms only. Never narrow tables or long editors.
- **Page header:** title and context first, then actions. It stacks on phones and goes horizontal from 640px. The action group wraps with 12px gaps.
- **Compact header:** If a page has a back link, put the back link above the title, inside the header. Align the back link flush with the left edge of the title. Do not put the back action on the same row as the title.
- **Toolbars** wrap instead of squeezing. Search keeps a 240px minimum on desktop. Filter buttons keep 42px targets and unbroken labels.
- **Tables** keep full workspace width and scroll horizontally inside their card. Never shrink a desktop table to fit a phone; on phones, put names and next actions first.
- **Skip link and main landmark:** the first focusable element in the shell is a "Skip to content" link. It moves focus to `<main id="main" tabindex="-1">`.
- Breakpoints follow Tailwind defaults (640 / 768 / 1024 / 1280). Primary flows must reflow at 320px without clipping.

## Elevation & Depth

Quietly layered. Depth comes mostly from tone and borders: nearly opaque cards over the haze, white or translucent sub-panels inside them, and 1px slate borders that define every edge. Card shadows are ambient and barely visible in light mode. Only floating layers (select overlays, date pickers, popovers, dialogs) visibly lift off the page.

### Shadow Vocabulary

- **Card ambient** (`0 4px 14px -4px rgba(15,23,42,0.05), 0 1px 3px 0 rgba(15,23,42,0.03)`; dark: `0 4px 14px -4px rgba(0,0,0,0.3), 0 1px 3px 0 rgba(0,0,0,0.2)`): main cards.
- **Sub-panel inset** (`inset 0 1px 2px #fff, 0 1px 3px rgba(15,23,42,0.04)`; dark: `inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.25)`): panels nested inside a card.
- **Floating overlay** (`0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)`; dark at 0.5 / 0.4): select overlays, date pickers, popovers, dialogs, and toasts. This is Tailwind `shadow-xl`. Overlays and toasts use `rounded-xl` and an opaque background.
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
- **Primary (`btn-primary`):** Ember Orange Deep (`primary-700`) fill, white 14px semibold text, 20px side padding, 8px icon gap, no shadow. Hover goes to `primary-800`. Active goes to `primary-900` and scales to 0.98. Disabled is 50% opacity.
- **Secondary (`btn-secondary`):** transparent with a 1px Slate 200 border and Slate 700 text; hover fills with Slate 100. In dark mode it uses a Slate 700 border, Slate 300 text, and Slate 800 hover.
- **Ghost (`btn-ghost`):** transparent, Slate 500 text (dark: Slate 300), 14px padding. Hover darkens the text and fills with Slate 100 (dark: Slate 800).
- **Danger (`btn-danger`):** rose at 10% fill with a 20% rose border and `rose-600` text (dark: `rose-400`). Hover goes to 20% fill. It uses 16px side padding, not 20px. When you next change button padding, align it with the other buttons.
- **Icon (`btn-icon`):** 42×42, bordered, Slate 500 icon (dark: Slate 400). The icon must have at least 3:1 contrast.
- **Compact icon (`btn-icon-sm`):** 32×32 with an 8px radius. It uses the same icon colors as `btn-icon`. It must always carry an `aria-label`. There are no further sizes. See [Sizing](#sizing) for where to use it.
- **Labels:** all `btn-*` classes use `white-space: nowrap`. Keep button labels short.
- **Disclosure toggle variant:** the category disclosure on the Ingredient Groups page is a `btn-ghost`. It has a documented restyle: full-width, left-aligned, and a rotating chevron. Do not copy it to other pages.
- **Transitions:** 200ms ease on color and background.

### Badges (`pantry-badge`)

- **Style:** tinted fill (hue at 10%), 20% border, 12px medium text, 8px radius (6px at `sm`). Text is the 700 level in light mode. In dark mode, it is the 400 level.
- **Variants:** `fresh` (emerald), `expiring` (amber), `expired` (rose), `primary` (orange, clickable use only), `neutral` (slate), `location` (slate with no dot, for Fridge / Freezer / Pantry), `outline`. Sizes: `sm`, `md`. Request a new variant rather than inventing markup.
- **Options:** `icon`; `dot` (6px status dot); `live` pulses the dot and is only for data that updates continuously; `borderless` drops the outline for subtle unit and tag chips in tables (for example, the Default Unit column).
- **Taxonomy reference columns:** when a table column shows a reference to another taxonomy entity (Ingredient, Ingredient Group, Ingredient Category), render it as a link if a filter or detail page exists. If no link exists, render it as `<pantry-badge variant="neutral">`. Do not use `variant="primary"` for a non-clickable reference. A missing reference renders as muted italic "Unassigned" meta text (`type-meta italic text-surface-500 dark:text-surface-400`). Never use a hand-rolled pill for it.

### Cards / Containers (`pantry-card`)

- **Variants:** `glass` (default, the main card), `sub` (a panel nested inside a card), `elevated` (solid white / Slate 800 with a stronger shadow, for the rare surface that must stand above its neighbors). `hover` makes a sub-panel interactive. Padding: `none`, `sm` (12–16px), `md` (20–24px, default), `lg` (24–32px); each grows at 640px.
- **Corner Style:** 16px for cards, 12px for sub-panels.
- **Background:** white at 94% (dark: Slate 800 at 92%). Sub-panels are solid white (dark: Slate 800 at 45%).
- **Shadow Strategy:** card ambient and sub-panel inset (see Elevation & Depth).
- **Border:** 1px Slate 200 at 80–90% (dark: white at 8%).
- **Hover (interactive sub-panels and clickable cards):** border steps up to Slate 300. In dark mode, it raises the fill to 65%. Do not lift or scale the card. Do not use a shadow on hover.

### Inputs / Fields

- **Style:** 42px fixed height, 12px radius, 1px Slate 200 border, 14px medium text, 14px side padding. Standalone fields fill with Slate 100. Textareas keep their multiline height.
- **Hover:** border steps up one tone.
- **Focus:** Ember Orange Bright border plus a 2px orange ring at 25% (35% in dark). There is no browser outline.
- **Form fields (`pantry-form-field`):** owns the label, required asterisk, hint, error, and optional badge. Inside it, inputs, selects, number inputs, textareas, and date-picker containers share one surface: white at 80% (dark: Slate 900 at 80%) with the same border. Date-picker inner inputs stay transparent so the container supplies one continuous surface. `forId` must match the native focus target or the PrimeNG `inputId`. Labels wrap. Error text uses `rose-600` (dark: `rose-400`) with an icon. Long forms may focus an actionable validation summary after an invalid submit. Each error button focuses its field.
- **Form-field accessibility contract:**
  - The field exposes `labelId()`, `hintId()`, and `errorId()`. Each ID derives from `forId`, or from a generated ID when `forId` is empty.
  - The field sets `aria-describedby` on projected `NgControl` targets and on elements marked `#fieldControl`. It points to the error ID when an error shows, and to the hint ID otherwise. It keeps external `aria-describedby` tokens.
  - The field sets `aria-invalid="true"` on the target while an error shows. It removes the attribute after the error hides. It restores an external value.
  - The error element has `role="alert"`.
  - A plain input without Angular forms needs `#fieldControl`.
  - A PrimeNG combobox (`p-select`, `p-autoComplete`) uses a template reference on the field and binds the label: `<pantry-form-field #f ...><p-select [ariaLabelledBy]="f.labelId()" /></pantry-form-field>`. The field finds `[role="combobox"]` in the projected content.
- **Search (`pantry-search-input`):** the only search field. 42px, leading search icon, clear button, Escape clears, focus managed.

### Segmented control (`pantry-segmented-control`)

Use it for a single choice among two to five short options: view toggles, filters, and state selectors. Do not hand-roll a segmented control.

- **API:** `[options]` is an array of `{ value, label, icon? }`. Two-way bind the selection with `[(value)]`. Optional inputs are `disabled`, `ariaLabel`, and `ariaLabelledBy`. Always set one of `ariaLabel` or `ariaLabelledBy`.
- **Semantics:** the control is a `radiogroup` of `radio` buttons. The selected option is the only tab stop (roving `tabindex`). The arrow keys, Home, and End move and select.
- **Style:** each option is at least 42px tall. The selected option uses the Ember Orange tint (10% fill, dark 20%) with `primary-700` text (dark: `primary-400`). Orange for selection is intentional (see The One Warm Note Rule).

### Checkbox

Use PrimeNG `p-checkbox`. Put it in a hit area of at least 42×42px. Include its label in the hit area. Do not use a native `<input type="checkbox">` or a 16px target on phones.

### Alert (`pantry-alert`)

Use it for an inline message inside a page or form: info, success, warning, or danger. Do not hand-roll a colored message box.

- **API:** `variant` (`info`, `success`, `warning`, `danger`). The default is `info`. The API also has `title`, `dismissible`, `dismissLabel`, and the `dismissed` output. Put the message in the content.
- **Semantics:** `danger` has `role="alert"` (assertive). The other variants have `role="status"` (polite).
- **Style:** 10% hue fill, 20% border, `rounded-xl`, an icon for each variant. Text is the 700 level in light mode. In dark mode, it is the 300 level. The `info` variant is neutral slate.
- **Use with forms:** an actionable save error uses `pantry-alert` with `variant="danger"` next to the form. A toast does not replace it.

### Sizing

- **Touch targets:** keep 42px as the standard target. Do not use a target smaller than 42px on phones. Pantry does not adopt the 44px platform guideline.
- **`btn-icon-sm` (32px):** use it only at `sm` (640px) and wider, in dense desktop tables and card headers. On phones, switch to `btn-icon` (42px).
- **Forced heights:** do not use `!h-[...]`. Use the primitive size variants or a token.

### Selects / Dropdowns

- Always PrimeNG `p-select` (with `[filter]="true"` for type-to-filter) or `p-autoComplete`. Never a native `<select>` or a hand-rolled `<ul><li>` menu.
- Always `appendTo="body"` on `p-select`, `p-dialog`, and `p-datepicker` to prevent clipping.
- **Trigger:** 42px, 12px radius, 1px Slate 200 border (dark: Slate 700). Form selects are the default (`data-select-variant="form"` is optional). Outside `pantry-form-field` they inherit the global input surface.
- **Filter variant:** toolbar filters and sort controls carry `data-select-variant="filter"` to keep the segmented pill-bar surface (Slate 100 / Slate 800) and muted labels. Clearable table filters use `styleClass="pantry-filter-select"` with `[showClear]="true"`: the trigger fits its content with 4px extra inline padding, a trailing chevron, and a 30px borderless clear area only while a selection is active. Long labels truncate; clearing restores the unfiltered state.
- **Overlay:** Slate 100 (dark: Slate 800), 12px radius, floating overlay shadow.

### Feedback & Loading

- **Spinner (`pantry-spinner`):** sizes `xs`–`lg`; colors `primary`, `white`, `surface`; `inline` or `stacked`. It announces itself (`role="status"`, polite). Never copy an `animate-spin` SVG or border spinner into a page.
- **Skeleton (`pantry-skeleton`):** `card`, `row`, `text`, `circle`, `custom`, with `count`. Never use raw `animate-pulse` placeholder divs.
- **Loading:** show a `pantry-skeleton` for page and list content. Show a `pantry-spinner` (`inline`) inside a button or beside a short action. Do not use `pi-spin`. Give a loading region an accessible name (for example, "Loading recipe"). A load failure shows an error state with a retry action, not an endless spinner.
- **Empty state (`pantry-empty-state`):** title, optional description, icon, and one action; `glass` or `plain`.
- **Notifications:** success is a polite status announcement. Errors are assertive alerts that persist until dismissed. Neither moves focus. Toasts wrap long text, respect safe areas, and fit a narrow viewport. Toasts use an opaque background, `rounded-xl`, and the floating overlay shadow. An actionable save error belongs next to the form, with retry and retained input. A toast only complements confirmed success.

### Dialogs

Body-mounted dialogs have viewport bounds and restore focus to a visible, non-inert opener (breakpoint changes may update `returnFocusTo`). Kitchen creation always uses the shared `KitchenCreateDialogComponent` (sidebar and Profile): it owns validation, the pending request, the `KitchenService` cache update, translated success feedback, and persistent inline failure. A pending create blocks dismissal and duplicate submission.

### Confirmation (`pantry-confirm-dialog`)

Use it for every confirmation. Never call native `confirm()`.

- **Mount:** put one `<pantry-confirm-dialog />` in the page template. It needs no provider.
- **Call:** `const ok = await confirmDialog.confirm({ title, message, acceptLabel?, rejectLabel?, destructive?, icon? })` with `ConfirmDialogService` from `@ui`. The promise resolves `true` on accept. It resolves `false` on cancel, Escape, or backdrop dismissal.
- **Destructive:** set `destructive: true` for an action that removes data or signs the user out. The accept button becomes `btn-danger` and the icon becomes a warning triangle. Focus goes to Cancel first.
- **Copy:** the title names the action as a question ("Log out of all devices?"). The message states the effect. Use specific button labels, not "OK".

### Pagination

One quiet range status and a plain page indicator with `aria-current="page"`; every control uses the 42px contract. Inventory table footers sit inside their table cards with the same border, padding, and type roles. Phones show previous / current / next and a labeled row-count selector; desktop adds first / last. Filtering or shrinking a result set resets or clamps the page. Static results never pulse.

### Navigation

- **Sidebar:** a near-transparent glass rail (4px blur) with a hairline right border. Items use 500-weight Slate 600 text (dark: Slate 300). All navigation labels use sentence case.
- **Order:** the sub-navigation items follow the taxonomy tier order (Categories and groups, Ingredients, Ingredient items). The shopping sub-pages (stores, restock review) are not in the navigation. Reach them from the shopping list.
- **Tablet rail:** from 768px to 1023px the sidebar shows as a collapsed icon rail. Below 768px it is the mobile drawer. From 1024px it is the full sidebar.
- **Icons:** navigation icons are PrimeIcons (`pi pi-*`). The brand mark is the Material Symbols `skillet` glyph. `index.html` loads the Material Symbols font, subset to this one glyph. Use the `pantry-skillet-icon` component to show it. Do not use Material Symbols for other icons.
- **Logo:** the orange logo tile on mobile is a link to Home (`routerLink`) and has an accessible name. It is a brand mark, not an action. See Documented Exceptions.
- **Hover:** soft Slate 200 at 50% fill (dark: white at 10%, with the text tinted orange).
- **Active:** Ember Orange at 10% fill (dark: 20%), a 3.5px Ember Orange left rule, and semibold orange text. The current-page marker requires an exact normalized path match.
- **Sub-navigation:** text-only. Slate 500 at rest, darker on hover, semibold orange when active, with no fill.
- **Semantics:** destinations are native `RouterLink` anchors; disclosure and action controls stay buttons. Navigation targets keep a 42px minimum height.
- **Breadcrumbs:** quiet text in a semantic ordered list, with only the final item marked current. Deep paths show parent / current on phones and the full path on desktop.
- **Mobile drawer:** a modal drawer, almost opaque so it stays readable over the atmosphere. Closed content is inert; opening focuses its close button; Tab stays inside; Escape, the backdrop, and choosing a destination close it, and focus returns to the menu trigger. Desktop collapse is a separate preference and never hides mobile sub-navigation.
- **Motion:** 240ms `cubic-bezier(0.22, 1, 0.36, 1)` on background, border, and shadow. Under `prefers-reduced-motion`, the app disables Angular animations. It reads the media query into a signal and binds `[@.disabled]`. Use Tailwind `motion-reduce:` utilities for CSS transitions and animations.
- **Header:** white at 96% (dark: Slate 900 at 96%) with a hairline bottom border.

### Shell Atmosphere (signature)

The fixed background behind every page combines a Slate 50 base (dark: Slate 900) with a Morning Haze radial wash at the top. It also has two faint blue corner glows and a 28px dot grid at 12% opacity (8% in dark). It is static. It has no particles, utensils, waves, or other ambient motion. Do not add any. Any other animation stops under `prefers-reduced-motion`.

### Theme

The theme is the stored choice (`localStorage` key `pantry.theme`) when it exists. Otherwise it follows `prefers-color-scheme`. A script in `index.html` sets the `.dark` class before the first paint, so the page does not flash the wrong theme. `ThemeService` keeps the class in sync afterward. The page is never "always dark" before boot.

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
- **Do** use `pantry-confirm-dialog` for confirmations, `pantry-alert` for inline messages, and `pantry-segmented-control` for single-choice toggles.
- **Do** use sentence case for all UI text.
- **Do** keep touch targets at 42px or larger on phones.

### Don't:

- **Don't** use emerald, amber, or rose for decoration, categories, or branding.
- **Don't** use tracked uppercase field labels or extra-bold headings.
- **Don't** nest a card inside a sub-panel, or add competing headings and badge clusters around a task.
- **Don't** add outer horizontal or vertical padding wrappers to pages.
- **Don't** put content directly on the haze background; it belongs on a card.
- **Don't** shrink desktop tables or controls to fit phones; restructure instead.
- **Don't** hand-roll search inputs, spinners, skeletons, empty states, badge pills, segmented controls, alerts, confirm dialogs, native selects, or popup menus. Use the `@ui` primitive or PrimeNG control.
- **Don't** write long inline Tailwind button strings; use the `btn-*` classes.
- **Don't** hardcode brand hexes (`#ea580c`, `#141c2e`, `#0d1322`, `#f8fafc`) in templates.
- **Don't** use native `confirm()`, `pi-spin`, `font-extrabold`, `text-gray-*`, `red-*` colors, or text smaller than 12px.
- **Don't** use an orange fill on an element that is not clickable or current.
- **Don't** introduce new control heights, radii, button variants, or badge variants without recording them in this file.

## Implementation

This file is the single source of truth for Pantry's visual design. If another document disagrees with it, this file wins; fix the other document or archive it. Product facts live in `PRODUCT.md`; the sidecar `.impeccable/design.json` carries machine-readable extensions and is regenerated with this file.

### Where to change things

| To change                                                                                                 | Location                                                                                    | Notes                                                                                                                                                                                                                                                          |
| :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color, font, and type-role tokens                                                                         | `frontend/src/styles.scss` (`@theme`, `type-*` classes)                                     | Update the frontmatter here in the same change.                                                                                                                                                                                                                |
| Brand primary palette                                                                                     | `frontend/src/app/app.config.ts` (`MyPreset`) + `@theme` `--color-primary-*`                | Change both together.                                                                                                                                                                                                                                          |
| Navy popovers                                                                                             | `@theme` `--color-navy-900`                                                                 | Consume via `bg-navy-900`.                                                                                                                                                                                                                                     |
| All buttons                                                                                               | `frontend/src/styles.scss` button contract classes                                          | Every `btn-*` consumer inherits.                                                                                                                                                                                                                               |
| All inputs, selects, overlays, date pickers                                                               | `frontend/src/styles.scss` PrimeNG override block                                           | Every PrimeNG control inherits.                                                                                                                                                                                                                                |
| Card surfaces and atmosphere                                                                              | `frontend/src/styles.scss` (`.glass-card`, `.sub-card`, shell background) and `pantry-card` |                                                                                                                                                                                                                                                                |
| Search, spinner, skeleton, empty state, badge, form field, card, alert, segmented control, confirm dialog | `frontend/src/app/components/ui/<name>/`                                                    | Edit the primitive. Add a typed variant prop for page-specific needs. Use a scoped override only when no prop genuinely fits. Record it under Documented Exceptions.                                                                                           |
| Dark mode                                                                                                 | `frontend/src/app/core/services/theme.service.ts`                                           | `ThemeService` is the only writer of the `.dark` class on `<html>`. It syncs with the user's `themePreference`. `index.html` applies the stored or system theme before boot to prevent a flash. Never touch `documentElement.classList` for theming elsewhere. |

### Documented Exceptions

These are the only sanctioned deviations. Each is allowlisted in `frontend/tools/check-design-system.mjs` and must keep its reason here.

| Location                                        | Pattern                                                    | Why it remains                                                                                                                                       |
| :---------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ingredient-category.component.html`            | Raw hex fallback `#ea580c` for data-driven category colors | Colors come from backend data; hex concatenation builds tints dynamically.                                                                           |
| `ingredient-categories-page.component.html`     | Raw hex fallback `#8b5cf6` for data-driven group colors    | Same data-driven tinting; violet-500 is the fallback for missing group color data.                                                                   |
| `daily-focus.component.html` (status tile)      | Emerald / rose pill ternary inside a 40px icon tile        | A composite status tile (icon + text), not a badge.                                                                                                  |
| `signup.component.ts` (password strength meter) | Rose / amber / emerald meter segments                      | The meter shows password strength, not food status. It always shows a text verdict next to the color. Color is never the only signal.                |
| `sidebar.component.html` (mobile logo tile)     | Orange fill on the logo tile                               | The tile is a brand mark and a link to Home. It is clickable, so it follows The One Warm Note Rule.                                                  |
| Ingredient category and group colors            | A clamped data-driven palette                              | Users pick category and group colors. The palette excludes the status hues (emerald, amber, rose), so a category color is never read as food status. |

The `ingredient-categories-page` component is not routed. Delete it or route it in a separate task. Its hex fallback stays listed until then.

Anything else that trips the guardrails is a regression; fix it with the canonical pattern. To request a new exception, add an entry to `ALLOWLIST` in `frontend/tools/check-design-system.mjs` **and** a row above. Unexplained allowlist entries are rejected in review.

### Enforcement

- `npm run lint:design-system` scans page and component templates (including inline `.ts` templates and the app shell). It fails on two kinds of rule.
  - **Hard rules** (no legacy offenders allowed): native `<select>`, `animate-spin` spinners, `animate-pulse` skeletons, inline primary-button strings, inline badge pills, and hardcoded brand hexes.
  - **Ratchet rules** (legacy offenders are counted per file): `pi-spin`, native `confirm()`, `font-extrabold`, `uppercase` with `tracking-*`, arbitrary 9–11px text, Tailwind `red-*` colors, `text-gray-*`, forced heights (`!h-[...]`), a page root with `max-w-*` and `mx-auto` (first root element only), and the remaining native `<select>` in Profile. A file can never exceed its stored count. A new file starts at zero.
- `npm run lint:i18n` fails on a template without Transloco and on user-visible English literals. The literal detector finds text nodes outside `{{ }}` and literal `placeholder`, `title`, `aria-label`, and `alt` attributes. The literal detector excludes the `ui/` primitives.
- **Ratchet files:** `frontend/tools/design-system-ratchet.json` and `frontend/tools/i18n-literals-ratchet.json` store the counts. The check scripts hold the `ALLOWLIST` and the `I18N_DEBT` list.
- **Regenerate the counts:** run `npm run lint:ratchet:update` in `frontend/` only after you fix offenders. Counts only go down. Never run it to hide a new offender. Review the diff of both JSON files before you commit.
- `npm run validate:design-system` is the full gate for every UI task: Prettier → ESLint → design-system guardrails → i18n guardrail → Vitest → production build.
- Component specs in `frontend/src/app/components/ui/*/` cover each primitive's variants and states.
- When replacing a pattern, migrate every caller, then remove the dead styles; never leave a parallel "temporary" implementation.

### Current state notes

- **Typography** is the October 2026 system-font prototype (it replaced Inter). Validate wrapping and platform font differences before treating it as final. Background: `docs/typography-prototype.md`.
- **Page geometry** (`page-layout`, `page-header`) is used by all routed pages except the auth pages, the design-system page and the unused categories page. Page titles are `h1`. A back link sits above the title in the header.
- **Open follow-ups:**
  - `text-surface-400` meta text in about 35 pages.
  - The dark `glass-card` contrast against the Slate 900 body.
  - Migration of existing call sites to `pantry-confirm-dialog`, `pantry-segmented-control`, and `pantry-alert`.
  - The legacy `Tab` enum (now in `core/models/tab.model.ts`).
  - The "Forgot password" flow. It is a follow-up feature. The login page has no link for it.
- **Inventory rollback (2026-10-04):** the Ingredient, Ingredient Item, and Ingredient Group pages and forms were restored to their original implementations at the user's request. The cleanup-specific inventory toolbar, table, shared editor, and centered-form classes are gone; earlier I-phase screenshots and contracts no longer describe the live inventory pages. See `docs/design-evidence/inventory-rollback/README.md`.

### Related records (history, not authority)

- `docs/design-review-2026-10-03.md`: the full-application design review and its findings.
- `docs/ui-cleanup-plan.md`: the living cleanup plan and task progress.
- `docs/design-evidence/`: rendered verification evidence (for example, `S03-S07/README.md`).
- `docs/archive/`: superseded specifications (`design-system.md`, `design-system-index.md`, `design-system-audit.md`, `DESIGN_SYSTEM.md`).
