# T01 typography and S01 geometry checks

The browser suites separate rendered typography verification from layout regression checks. They use the synthetic authenticated kitchen in `frontend/e2e/fixtures/design-baseline.ts`; no product data is changed or submitted.

## Executed result: 2026-10-03

**T01 is accepted for the supported macOS Chromium pilot coverage. Windows native font rendering remains unverified.** The root agent executed all 24 observation cases successfully: Home, Ingredient Items and Add Ingredient at 1440, 1280, 390 and 320px in both themes. The recorded manifests contain no unexpected API requests or browser/console errors. The separate baseline capture run also passed all 24 pilot cases with its network and asset assertions active.

The fixture agent inspected all eight Add Ingredient overlay screenshots in `before/` and all eight resting Add Ingredient baseline screenshots in `../S01/before/`. Native text remains consistent between fields, labels, select options and page titles. The long taxonomy label wraps to two lines at 320px without clipping. Both themes show a visible keyboard focus ring, a contained overlay and readable options; the executed checks verify Arrow Down opening, Escape dismissal and restored trigger focus.

The computed Home roles match the approved hierarchy: title 24–30px/600, section 18px/600, label 13px/500, metadata 12px/400 and value 24px/600. Tested text inputs and PrimeNG selects measure 42px high with 12px corner radii, and the overlay inherits the same native font family.

The screenshots also confirm separate S01 layout debt: the desktop form is too wide and displaced from the shell gutter; the 320px Save Ingredient action wraps; breadcrumbs clip on narrow screens; and the Back icon is missing in the original baseline. Those findings do not require a font change. They need geometry/icon remediation and matching after captures. T01 acceptance covers these pilot roles and interactions; it does not mark the later page cleanup tasks complete.

From `frontend/`, capture the unchanged S01 pilot pages before implementation:

```sh
DESIGN_CAPTURE_GEOMETRY=1 DESIGN_EVIDENCE_DIR=../docs/design-evidence/S01/before npx playwright test e2e/design-baseline.spec.ts --workers=1
DESIGN_GEOMETRY_BASELINE=1 DESIGN_EVIDENCE_DIR=../docs/design-evidence/T01/before npx playwright test e2e/design-geometry.spec.ts --workers=1
```

After implementation:

```sh
DESIGN_CAPTURE_GEOMETRY=1 DESIGN_EVIDENCE_DIR=../docs/design-evidence/S01/after npx playwright test e2e/design-baseline.spec.ts --workers=1
DESIGN_EVIDENCE_DIR=../docs/design-evidence/T01/after npx playwright test e2e/design-geometry.spec.ts --workers=1
```

Each command covers Home, Ingredient Items and Add Ingredient at 1440 × 900, 1280 × 900, 390 × 844 and 320 × 844, in both themes. The default baseline suite also includes Add Item, Recipes and Shopping at desktop/mobile widths. The evidence-directory option preserves the original E03 captures.

`design-geometry.spec.ts` measures the actual computed native font family and title hierarchy on every pilot. Home exercises all five typography roles. Add Ingredient exercises a long name, the taxonomy field's long label, text/select control height and radius, visible keyboard focus, a PrimeNG select overlay's inherited font, opening with Arrow Down and dismissal with Escape. It captures the open overlay as well as the resting page and records measured role styles and bounding boxes in JSON.

Normal geometry mode enforces breadcrumb/title/content alignment, a left-aligned compact form no wider than 640px, full workspace width for the inventory table, contained status controls with adequate height, no page spill into the shell, and header actions that fit without overlapping the title. `DESIGN_GEOMETRY_BASELINE=1` records those measurements before implementation without asserting the new geometry contract. Typography and keyboard assertions remain active in observation mode.

The application uses an inner scrolling region inside a fixed-height shell. A browser “full page” screenshot can show only its visible portion, even if the PNG is the full document size. Geometry-suite screenshots deliberately capture the current viewport; baseline manifests record inner scroll dimensions. Screenshots do not establish that sections below the fold were inspected. Exercise and capture those lower sections separately when their content changes.

Readiness must be based on executed results and human inspection of screenshots. Static checks or test discovery alone do not establish rendered acceptance. Chromium on macOS can establish macOS native-font behavior; Windows native font rendering, other engines, physical devices and assistive technology remain separate coverage gaps. These checks do not claim full keyboard or accessibility coverage, and empty/error states and additional dialogs remain outside this slice.
