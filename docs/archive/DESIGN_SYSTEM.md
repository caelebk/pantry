> [!WARNING]
> ARCHIVED 2026-08-21: superseded by docs/design-system.md (canonical source of truth).

# 🎨 Pantry Authoritative Design System Manifest & Architecture Specification

**Version:** 2.0.0  
**Stack:** Angular 20 (Standalone Components) | Tailwind CSS v4 | PrimeNG 19+ (Aura Preset) | Transloco i18n  
**Target:** Global Application Guidelines (`frontend/src/app/`)

---

## 🏛️ 1. Core Principles & Philosophy

1. **Strict 4-Tier Domain Hierarchy:**  
   Every domain model, table column, card header, and filter must use the canonical taxonomy:
   ```
   [ Ingredient Category ] (Tier 1) ──> [ Ingredient Group ] (Tier 2) ──> [ Ingredient ] (Tier 3) ──> [ Ingredient Item ] (Tier 4)
   ```
   - *Never use "Nutrient Group", "Nutrient Type", "Master Ingredient", or plain "Item"*.

2. **Pixel-Perfect Form Vertical Rhythm (`42px` Standard):**  
   Every single-line form control (text inputs, numbers, selects, date pickers, search fields) rendered side-by-side MUST have an explicit height of `42px` (`h-[42px]`) with `rounded-xl` corners.

3. **Horizontal Baseline Alignment (`h-6 mb-1.5`):**  
   All multi-column grid form headers must be wrapped in `<div class="form-label-header">` or `<div class="flex items-center justify-between h-6 mb-1.5">` to prevent label jitter.

4. **Curated Semantic Palette (Zero Ad-Hoc Hex Colors):**  
   All colors must resolve to semantic Tailwind tokens (`surface-*`, `primary-*`, `emerald-*`, `amber-*`, `rose-*`, `indigo-*`). No arbitrary hex strings in templates.

5. **100% Internationalization (Transloco i18n):**  
   Zero hardcoded user-facing strings in HTML templates. Every label, button, badge, and error message must use Transloco directives/pipes and resolve in `frontend/public/i18n/en.json`.

---

## 🎨 2. Design Tokens Matrix

### 2.1 Surface Canvas & Text Scales
| Token | Light Mode HEX | Dark Mode HEX | Semantic Role |
| :--- | :--- | :--- | :--- |
| `surface-50` | `#f8fafc` | `#020617` | Base application canvas background |
| `surface-100` | `#f1f5f9` | `#0f172a` | Secondary container fill, input surfaces |
| `surface-200` | `#e2e8f0` | `#1e293b` | Card borders, dividers, subtle outlines |
| `surface-300` | `#cbd5e1` | `#334155` | Hover borders, disabled controls, tertiary icons |
| `surface-400` | `#94a3b8` | `#475569` | Placeholder text, auxiliary icons |
| `surface-500` | `#64748b` | `#64748b` | Field hints, timestamps, metadata labels |
| `surface-600` | `#475569` | `#94a3b8` | Section subheadings, secondary labels |
| `surface-700` | `#334155` | `#cbd5e1` | High-contrast body text, tab titles |
| `surface-800` | `#1e293b` | `#e2e8f0` | Card titles, prominent text |
| `surface-900` | `#0f172a` | `#f8fafc` | Page `<h1>` headings, hero titles |

### 2.2 Semantic Brand & Status Tokens
| Palette | 500 / Base HEX | 600 / Accent HEX | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Primary (Orange)** | `#f97316` | `#ea580c` | Primary CTAs, active tab indicators, focus rings |
| **Emerald (Success)** | `#10b981` | `#059669` | Fresh inventory items (>7 days), in-stock items, save feedback |
| **Amber (Warning)** | `#f59e0b` | `#d97706` | Expiring soon items (≤7 days), unit locks, substitution tips |
| **Rose (Danger)** | `#f43f5e` | `#e11d48` | Expired stock, form error banners, destructive deletions |
| **Indigo (Info)** | `#6366f1` | `#4f46e5` | Taxonomy categories, macro groups, new item tags |

---

## 🧩 3. Component Contracts & CSS Utility Classes

### 3.1 Button Contracts
```scss
/* 1. Primary Action Button */
.btn-primary {
  @apply h-[42px] px-5 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] 
         text-white font-bold text-sm shadow-md shadow-primary-600/20 transition-all 
         disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer;
}

/* 2. Secondary / Outline Button */
.btn-secondary {
  @apply h-[42px] px-5 rounded-xl border border-surface-200 dark:border-surface-700 
         hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 
         font-semibold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2;
}

/* 3. Subtle / Ghost Button */
.btn-ghost {
  @apply h-[42px] px-3.5 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-white 
         hover:bg-surface-100 dark:hover:bg-surface-800 transition-all cursor-pointer 
         inline-flex items-center justify-center gap-1.5;
}

/* 4. Destructive / Danger Button */
.btn-danger {
  @apply h-[42px] px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 
         border border-rose-500/20 font-semibold text-sm transition-all cursor-pointer 
         inline-flex items-center justify-center gap-2;
}

/* 5. Square Action Icon Button */
.btn-icon {
  @apply h-[42px] w-[42px] p-2.5 rounded-xl text-surface-400 hover:text-surface-600 
         dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 
         border border-surface-200 dark:border-surface-700 transition-all cursor-pointer 
         flex items-center justify-center shrink-0 shadow-xs;
}
```

### 3.2 Form Control Contracts
* **Single-Line Controls (`input[type="text"]`, `p-select`, `p-inputNumber`, `p-datePicker`):**
  ```html
  <input 
    pInputText 
    class="w-full h-[42px] px-3.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm font-medium focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" />
  ```
* **Form Grid Column Label Alignment:**
  ```html
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <div class="flex items-center justify-between h-6 mb-1.5">
        <label for="field1" class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
          Field 1 <span class="text-rose-500">*</span>
        </label>
      </div>
      <input id="field1" class="w-full h-[42px] ..." />
    </div>
    <div>
      <div class="flex items-center justify-between h-6 mb-1.5">
        <label for="field2" class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
          Field 2
        </label>
        <span class="text-[10px] text-surface-400">Optional</span>
      </div>
      <p-select inputId="field2" styleClass="w-full !h-[42px]" ...></p-select>
    </div>
  </div>
  ```

### 3.3 Semantic Badge Tokens
| Badge Class | Semantic Usage | Definition |
| :--- | :--- | :--- |
| `.badge-emerald` | Fresh items (>7d), in-stock recipes | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20` |
| `.badge-amber` | Expiring soon items (≤7d), low stock | `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20` |
| `.badge-rose` | Expired stock, form error alerts | `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20` |
| `.badge-surface` | Out of stock items (qty = 0) | `bg-surface-500/10 text-surface-600 dark:text-surface-400 border border-surface-500/20` |
| `.badge-primary` | Ingredient groups & taxonomy links | `bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20` |
| `.badge-indigo` | Ingredient categories & info pills | `bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20` |

### 3.4 Minimalist Glass Progress Bar & Pill Track Contract (`.progress-track`)
All progress bars (shelf-life expiration tracks, recipe makeability matchers, location distributions, password strength meters, shopping checklist completion) MUST use the `.progress-track` frosted-glass container:
- **Light Mode:** Translucent frosted glass track (`rgba(0, 0, 0, 0.04)`) with ultra-fine border (`rgba(0, 0, 0, 0.05)`), `backdrop-blur-md`, and subtle inner ambient depth.
- **Dark Mode:** Luminous translucent white-glow glass channel (`rgba(255, 255, 255, 0.06)`) with feather-light glass rim (`rgba(255, 255, 255, 0.09)`), `backdrop-blur-lg`, and soft inner depth shadow.
- **Indicator Fill:** Vibrant gradient pill (`bg-gradient-to-r from-*-500 to-*-400`) with smooth width transition.
```html
<div class="progress-track h-1.5">
  <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 shadow-xs" [style.width.%]="progress()"></div>
</div>
```

---

## 📐 4. Elevation & Glassmorphism Tiers

1. **Tier 1: Canvas (`bg-surface-50`)** — Clean application background with soft animated gradient mesh.
2. **Tier 2: Outer Section / Modal (`.glass-card`)** — `bg-white/60 dark:bg-surface-900/60 backdrop-blur-xl border border-surface-200/80 dark:border-surface-800/80 rounded-2xl shadow-xl`.
3. **Tier 3: Sub-Card / Interactive Inset (`.sub-card`)** — `bg-white dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60 rounded-xl shadow-xs`.
4. **Tier 4: Floating Action Bar** — `bg-surface-900/90 dark:bg-surface-950/90 backdrop-blur-xl border border-surface-700/80 rounded-2xl shadow-2xl text-white`.

---

## 🛠️ 5. Pre-Completion Verification Checklist

Every pull request or feature addition MUST satisfy the following:
- [ ] No raw inline hex colors or hardcoded generic palette names (`orange-*`, `red-*`, `gray-*`).
- [ ] Every single-line input or selector has height `h-[42px]` (`42px`).
- [ ] Side-by-side form grid labels wrapped in `<div class="flex items-center justify-between h-6 mb-1.5">`.
- [ ] All user-facing text referenced through Transloco keys in `frontend/public/i18n/en.json`.
- [ ] Contrast checked in both Light and Dark modes (WCAG AA compliance).
- [ ] Clean verification: `npm run format`, `npm run lint`, `npm run test`, and `npm run build`.
