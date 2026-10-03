# Pantry — full application design review

Review date: October 3, 2026. Scope: all routed page templates, shared navigation and feedback, and the remaining legacy page templates. Prepared through parallel inventory, planning/shopping, and independent design-system exploration.

**Status: comprehensive source-based audit; rendered review remains blocked.** This is a cleanup proposal, not an implemented redesign or a claim that every visible state has been tested. The current working tree already contains extensive frontend edits; this review examines that working tree, not only the committed version. No application source changes were made for the review.

## Contents

- [Overall assessment](#overall-assessment)
- [Evidence, limits, and priority definitions](#evidence-limits-and-priority-definitions)
- [Route coverage](#route-coverage)
- [Reference principles and proposed foundation](#reference-principles-and-proposed-foundation)
- [Shared wayfinding, notifications, and pagination](#shared-wayfinding-notifications-and-pagination)
- [Shared shell and navigation — all protected pages](#shared-shell-and-navigation--all-protected-pages)
- [Home — `/home`](#home--home)
- [Login — `/auth/login`](#login--authlogin)
- [Signup — `/auth/signup`](#signup--authsignup)
- [Profile — `/profile`](#profile--profile)
- [Shared typography, fields, and motion](#shared-typography-fields-and-motion)
- [Design-system gallery — `/design-system`](#design-system-gallery--design-system)
- [Legacy Dashboard — not independently routed](#legacy-dashboard--not-independently-routed)
- [Inventory pages — evidence and conventions](#inventory-pages--evidence-and-conventions)
- [/inventory — Inventory overview](#inventory--inventory-overview)
- [/inventory/items — Stock list, grid, selection and restock](#inventoryitems--stock-list-grid-selection-and-restock)
- [/inventory/items/new — Add stock](#inventoryitemsnew--add-stock)
- [/inventory/items/:id/edit — Edit stock](#inventoryitemsidedit--edit-stock)
- [/inventory/ingredients — Ingredients catalog](#inventoryingredients--ingredients-catalog)
- [/inventory/ingredients/new — Add ingredient](#inventoryingredientsnew--add-ingredient)
- [/inventory/ingredients/:id/edit — Edit ingredient](#inventoryingredientsidedit--edit-ingredient)
- [/inventory/ingredients/:id/unit-reconciliation?targetUnitId=… — Unit reconciliation](#inventoryingredientsidunit-reconciliationtargetunitid--unit-reconciliation)
- [/inventory/groups — Categories and groups](#inventorygroups--categories-and-groups)
- [/inventory/groups/new — Add group](#inventorygroupsnew--add-group)
- [/inventory/groups/:id/edit — Edit group](#inventorygroupsidedit--edit-group)
- [Ingredient Categories — currently unrouted implementation](#ingredient-categories--currently-unrouted-implementation)
- [Recipes — `/recipes`](#recipes--recipes)
- [Recipe detail — `/recipes/:id`](#recipe-detail--recipesid)
- [New recipe — `/recipes/new`](#new-recipe--recipesnew)
- [Edit recipe — `/recipes/:id/edit`](#edit-recipe--recipesidedit)
- [Meal planner — `/meal-planner`](#meal-planner--meal-planner)
- [Plan a meal — `/meal-planner/new`](#plan-a-meal--meal-plannernew)
- [Shopping list — `/shopping-list`](#shopping-list--shopping-list)
- [New shopping item — `/shopping-list/new`](#new-shopping-item--shopping-listnew)
- [Edit shopping item — `/shopping-list/:id/edit`](#edit-shopping-item--shopping-listidedit)
- [Stores — `/shopping-list/stores`](#stores--shopping-liststores)
- [Restock review — `/shopping-list/restock`](#restock-review--shopping-listrestock)
- [Potential layout resolutions — conceptual, not screenshots](#potential-layout-resolutions--conceptual-not-screenshots)
- [Remediation sequence](#remediation-sequence)
- [Required rendered coverage before calling the cleanup complete](#required-rendered-coverage-before-calling-the-cleanup-complete)
- [Verification record and handoff](#verification-record-and-handoff)

## Overall assessment

The existing navy/slate foundation, warm orange actions, and atmospheric background can support a refined kitchen application. The main opportunity is to make the useful content more prominent: what needs using, what can be cooked, what is planned, and what needs buying. The templates repeatedly add competing headings, small uppercase labels, nested surfaces, metadata badges, and explanatory structures around these tasks.

The recommended direction is a calm, practical household tool. Preserve the background and color theme. Change the typography, establish predictable page layouts, and reduce repeated visual framing. Minimalism here means fewer decisions and clearer relationships, while retaining useful information density and explicit actions.

### The first three changes

1. **Make inventory and home task-first.** Move taxonomy education into contextual help. Bring stock, expiration, and next actions forward.
2. **Unify page geometry and typography.** Give the shell responsibility for outer gutters; use one title/action pattern and one UI font family. Replace routine extra-bold, tiny uppercase labeling with a readable hierarchy.
3. **Make primary workflows resilient on phones and keyboards.** Prioritize recipe editing, shopping, meal planning, forms, and navigation. Fix semantics and state feedback before ornamental polish.

### What already works and must be preserved

- The existing background, navy/slate palette, orange primary action, and semantic freshness colors establish continuity.
- Dedicated add/edit/detail routes allow complex work to have sufficient space and support direct navigation.
- Ingredient Category → Ingredient Group → Ingredient → Ingredient Item is a useful domain model. Preserve the distinctions while explaining them where they affect decisions.
- Shared search, field, skeleton, badge, card, and pagination primitives are a good foundation for a coordinated cleanup.
- Filtering, ingredient availability, shopping progress, and inventory reconciliation address real kitchen tasks. Refine their presentation without removing their capabilities.

## Evidence, limits, and priority definitions

Every finding below is based on source inspection unless explicitly stated otherwise. A source finding can establish a fixed width, missing template binding, conditional state, or navigation destination. It cannot establish actual clipping, perceived contrast, font loading, touch behavior, or animation quality.

| Attempt                                    | Result                                               | Consequence                                           |
| ------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| Documented `npm start -- --host 127.0.0.1` | Failed: missing `lightningcss.darwin-arm64.node`     | No live application capture                           |
| Existing Playwright Chromium launch        | Failed: macOS `bootstrap_check_in` permission denied | Browser unavailable in this sandbox                   |
| Repository screenshot search               | No PNG/JPEG/WebP evidence found outside dependencies | No current before screenshots available               |
| Route/template/style/service inspection    | Completed across the route inventory below           | Supports structural and interaction-contract findings |

No dependencies or application configuration were changed to bypass these blockers. No fabricated screenshots or generated pictures are presented as evidence. Concept layouts later in this document are proposals only. Desktop 1440×900, laptop 1280×800, tablet 768×1024, mobile 390×844 and 320px reflow, both themes, keyboard behavior, zoom, real mobile keyboards, screen readers, and measured contrast remain unverified.

**High impact:** affects a primary workflow, access, recovery, or shared hierarchy. **Medium impact:** repeated friction, unclear grouping, inconsistent presentation. **Polish:** lower-consequence refinement. Distinguish confirmed source behavior from risks to verify in a browser and from optional aesthetic preferences.

## Route coverage

All 27 component-bearing route declarations are represented, including the development gallery. Shared add/edit templates are assessed in both task contexts. Source coverage does not mean rendered coverage.

| Area              | Pages                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Account           | `/auth/login`, `/auth/signup`, `/profile`                                                                                                   |
| Home              | `/home`                                                                                                                                     |
| Inventory         | `/inventory`, `/inventory/items`, `/inventory/items/new`, `/inventory/items/:id/edit`                                                       |
| Ingredients       | `/inventory/ingredients`, `/inventory/ingredients/new`, `/inventory/ingredients/:id/edit`, `/inventory/ingredients/:id/unit-reconciliation` |
| Ingredient Groups | `/inventory/groups`, `/inventory/groups/new`, `/inventory/groups/:id/edit`                                                                  |
| Recipes           | `/recipes`, `/recipes/new`, `/recipes/:id`, `/recipes/:id/edit`                                                                             |
| Shopping          | `/shopping-list`, `/shopping-list/new`, `/shopping-list/:id/edit`, `/shopping-list/stores`, `/shopping-list/restock`                        |
| Planning          | `/meal-planner`, `/meal-planner/new`                                                                                                        |
| Development       | `/design-system`                                                                                                                            |

Aliases are not separate designs: `/`, `/dashboard`, `/inventory/new`, `/inventory/:id/edit`, `/inventory/nutrients`, `/shopping-list/add`, and `/meal-planner/add` redirect to canonical routes. Unknown URLs redirect home. The legacy Dashboard and Ingredient Categories components are addressed separately because they exist in source but are not independently routed.

## Reference principles and proposed foundation

Linear's recent interface review emphasizes making task content dominant, placing actions consistently, and reducing unnecessary icon and border emphasis. Apply those principles to Pantry's repeated page chrome and taxonomy badges without copying Linear's product density or palette. [Linear: A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh).

Stripe describes testing color relationships systematically across its interface library. For Pantry, retain the palette and validate text, controls, and statuses against their actual composited glass backgrounds in both themes. A muted label is only useful if it remains legible. [Stripe: Designing accessible color systems](https://stripe.com/blog/accessible-color-systems).

Apple's typography guidance is a reference for the eventual hierarchy and text-scaling review. Its documentation page required JavaScript in this research environment, so no detailed Apple-specific claim is used as evidence here. [Apple Human Interface Guidelines: Typography](https://developer.apple.com/design/human-interface-guidelines/typography).

### Font and hierarchy direction

Current source explicitly chooses Inter, including local overrides in PrimeNG styles. Changing only the root font token would leave a mixed system. Prototype a **native system sans stack** (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif) as the first replacement candidate. This provides a restrained interface without another font request. This is an aesthetic proposal, not a measured improvement; compare macOS and Windows before choosing it. Do not distribute Apple's proprietary font assets as a web font.

Use one family for navigation, data, fields, and headings. Give hierarchy to size, spacing, and a small set of weights rather than mixing decorative families. Avoid a display serif in routine data-entry and inventory screens.

| Role                      | Prototype starting range, to validate       | Intended relationship                                         |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Page title                | 26–30px desktop, 24–28px mobile; 600 weight | Clear orientation without consuming a hero-sized block        |
| Section title             | 17–20px; 600                                | Distinct groups within the task                               |
| Body and input value      | 14–16px; 400–500                            | Comfortable sustained reading and form entry                  |
| Field label / row name    | 13–14px; 500–600, sentence case             | Readable, stable anchors                                      |
| Secondary metadata        | 12–13px; 400–500                            | Secondary but still readable; avoid 10px critical information |
| Quantities, dates, prices | Match body; tabular numerals where aligned  | Reliable scanning and comparison                              |

These ranges are prototype candidates, not new mandatory pixel rules. Validate long ingredient names, fractions, translations, browser zoom, and mobile input behavior. The current 42px control contract remains the baseline; any new touch-target or sizing variants must be explicit system decisions.

### Layout and surface direction

- One outer gutter owned by the application shell. Page templates define content layout rather than repeating the same horizontal padding.
- One page heading with one primary action. Filters belong beside the collection they affect. Put infrequent administrative actions in a secondary location.
- Use wide workspaces for tables/calendars and bounded reading widths for short forms. Do not force both into identical centered card compositions.
- Keep one meaningful glass surface per major group. Use spacing, alignment, and restrained dividers inside it. A taxonomy reference can be text; freshness can remain a status badge.
- On phones, give names and next actions priority. Stack related field groups intentionally and avoid shrinking desktop tables and controls to fit.
- Preserve visible focus and explicit destructive actions. Minimalism must not make necessary controls hover-only or unlabeled.

### Design-system decisions required before implementation

Some current noise is mandated by existing guidance: uppercase tracked labels and primary-colored badges for taxonomy references. Update `docs/design-system.md`, its index, and the relevant local UI skill guidance as part of an authorized redesign so the cleanup does not fight the guardrails. Keep canonical primitives and PrimeNG; propose sentence-case label roles, quiet reference text, and shared page-header/form-section patterns. No system contract was changed in this review.

## Shared wayfinding, notifications, and pagination

These findings apply wherever the corresponding primitive appears. They should be solved centrally, then checked on each consumer page.

### SH-01 — Breadcrumbs omit specific destinations — Medium impact

**Evidence:** `frontend/src/app/components/breadcrumbs/breadcrumbs.component.ts:80`, `:153`. Ingredient reconciliation falls through to Ingredients; shopping edit and store management fall through to Shopping List; Profile has no branch and retains Home.

**Problem and consequence:** the orientation trail can describe the parent rather than the current task. Generic recipe detail labels also discard the entity name. The current-page pill adds a second emphasized label above an already prominent page heading.

**Recommendation:** represent each canonical route explicitly, including the entity name when loaded. Keep ancestors quiet and the current location legible without a raised pill. On small screens, show a clear parent/back destination rather than squeezing the entire hierarchy.

**Acceptance:** Profile, Stores, Edit Shopping Ingredient Item, and Unit Reconciliation have accurate current-location labels; long names wrap or shorten predictably; all ancestor links return to the intended collection and preserve useful context.

### SH-02 — Login loses the deep-link destination — Medium impact

**Evidence:** `frontend/src/app/core/guards/auth.guard.ts:42–52` creates `/auth/login` without the requested destination.

**Problem and consequence:** opening a saved recipe or edit link while signed out discards the task context at the guard boundary.

**Recommendation:** retain a validated internal return destination and restore it after authentication; present a clear fallback if the object no longer exists. This is behavior to design, not authorization to change authentication code in this review.

**Acceptance:** sign out, open a recipe URL, sign in, and return to that recipe. Unknown or unavailable destinations have a purposeful recovery state.

### SH-03 — Toast feedback lacks announcement semantics and durable recovery — High impact for failures

**Evidence:** `frontend/src/app/components/toast-container/toast-container.component.ts:10` has no live-region or status/alert role; `frontend/src/app/services/toast.service.ts:25` defaults to four seconds, errors to six seconds.

**Problem and consequence:** a visual-only transient message can be missed, especially when it is the only explanation of a failed save. Actual screen-reader behavior has not been tested.

**Recommendation:** announce feedback according to urgency; keep actionable form failures beside the relevant task until resolved. Use toast confirmations for completed actions, with undo only where the operation supports it. Keep recovery instructions available after a toast disappears.

**Acceptance:** a failed save retains entered values and a visible retry path; assistive technology announces the failure once; routine success does not interrupt typing or move focus.

### SH-04 — Toast positioning needs a narrow-screen constraint — Medium impact, browser verification required

**Evidence:** toast wrapper uses `fixed bottom-5 right-5 max-w-sm w-full px-4`.

**Problem and consequence:** combining a viewport-relative full width with a right offset can exceed the available left edge on narrow screens; lower controls may also be obscured. These are CSS risks, not observed screenshots.

**Recommendation:** use explicit responsive inline insets and a bounded desktop width; account for device safe areas and fixed page actions. Reduce the icon/background treatment relative to the actual message.

**Acceptance:** at 320px and 390px, long success and error messages stay within the viewport and do not hide the only recovery action.

### SH-05 — Pagination is overemphasized and its selected page is only styled — Medium impact

**Evidence:** `frontend/src/app/components/ui/data-table-pagination/data-table-pagination.component.ts:14–17` adds a separate bordered surface and pulsing green dot; `:75–89` styles the current page without `aria-current`.

**Problem and consequence:** static result counts appear live, while assistive navigation does not receive the same explicit selected-page indication as visual users. Four directional controls plus page buttons can crowd a phone.

**Recommendation:** use a quiet list footer with count and page navigation, remove the live dot, expose the current page semantically, and consider previous/next plus a compact page indicator on mobile.

**Acceptance:** page changes are understandable without color; filtering resets/clamps pagination appropriately; touch targets remain distinct; the footer does not compete with the first row.

## Shared shell and navigation — all protected pages

The shared wayfinding/notification findings above also apply. File references here are relative to `frontend/src/app/` unless prefixed otherwise.

### SYS-01 — Closed mobile navigation remains focusable offscreen — High impact

**Evidence:** `components/sidebar/sidebar.component.html:83` translates an always-mounted aside; `sidebar.component.ts:155` toggles state without Escape/focus transfer/restoration or containment.

**Problem / consequence:** translated controls retain keyboard access despite being visually hidden; the open drawer lacks an explicit modal-navigation contract. **Recommendation:** a drawer primitive or equivalent focus/inert behavior. **Acceptance:** closed controls are absent from Tab order; opening focuses navigation; Escape closes and restores focus; desktop/mobile resizing does not lose access. Runtime focus behavior remains untested.

### SYS-02 — Destination navigation uses buttons — Medium impact

**Evidence:** sidebar template `:224, :259, :315, :342, :370` invokes navigation methods. **Recommendation:** links for destinations, buttons for disclosures/theme/menu actions. **Acceptance:** users can inspect and open destinations in another tab; active destination retains `aria-current`.

### SYS-03 — Parent and child give competing location signals — Medium impact

**Evidence:** sidebar `:257–263` marks the Inventory group `aria-current="page"` on every inventory route; sublinks `:315–335` only have visual active classes. **Recommendation:** distinguish expanded group from current page; exact destination receives semantics. **Acceptance:** one correct current-page announcement.

### SYS-04 — Desktop collapse state suppresses mobile subnavigation — Medium impact

**Evidence:** `isCollapsed()` controls desktop density and sublink rendering at sidebar `:312`. **Recommendation:** separate desktop collapse from mobile visibility. **Acceptance:** collapsing desktop then resizing to mobile still exposes labeled Inventory destinations.

### SYS-05 — Kitchen switcher needs an explicit keyboard model — Medium impact

**Evidence:** sidebar `:139–210` custom absolute dropdown; TypeScript `:53` handles document clicks. **Recommendation:** choose disclosure semantics with ordinary controls or a full menu model; Escape/focus return must match. **Acceptance:** select and dismiss entirely by keyboard without focus loss.

### SYS-06 — Outer gutters have multiple owners — Medium impact

**Evidence:** `app.component.html:87` adds responsive horizontal padding; `pages/home/home.component.html:1` repeats it; gallery adds further `p-6 sm:p-10`. **Problem:** guaranteed additional insets, with mobile width costs and inconsistent breadcrumb/content alignment. **Recommendation:** shell owns outer gutters; pages own internal rhythm and explicit compact/form/wide layouts. **Acceptance:** consistent title/breadcrumb/content anchors at all audited widths.

### SYS-07 — Decorative hover scaling creates unnecessary activity — Polish

**Evidence:** sidebar `:104, :239, :273, :357` scales icons/logos. **Recommendation:** restrained background/focus feedback; motion for state-changing disclosures. **Acceptance:** pointer movement does not repeatedly animate decorative parts of navigation.

### SYS-08 — Kitchen creation has two presentations — Medium impact

**Evidence:** sidebar dialog `:582` and `pages/profile/profile.component.ts:283` differ in wording, size, styling, and loading behavior. **Recommendation:** shared creation experience, retaining both entry points. **Acceptance:** same fields, validation, progress, failure, and successful outcome from either entry point.

## Home — `/home`

### HOME-01 — Load failure looks like normal empty data — High impact

**Evidence:** `pages/home/home.component.ts:119` logs failure then clears loading without an error view. **Problem:** zero statistics and no-ready-recipe messages can misrepresent a failed request. **Recommendation:** visible retryable failure and retained last-successful data where appropriate. **Acceptance:** first use, no cookable recipes, and failed load are distinct states.

### HOME-02 — Stock actions are hover-only — High impact

**Evidence:** `pages/home/home-components/items-container/items-container.component.html:55` hides actions with opacity and only restores on group hover. **Recommendation:** focus-within visibility and persistent touch affordance or visible row menu. **Acceptance:** edit/remove are visible when focused and discoverable without hover.

### HOME-03 — Cookable recipes are click-only containers — High impact

**Evidence:** `pages/home/home-components/cookable-recipes-container/cookable-recipes-container.component.html:21` clickable div lacks link/keyboard semantics. **Recommendation:** real recipe link with visible focus. **Acceptance:** recipes open with keyboard and support standard link operations.

### HOME-04 — Repeated warnings and actions flatten priority — Medium impact

**Evidence:** `pages/home/home.component.html:43` alerts, `:90` four stats, `:125, :138` expiry lists; header Add actions `:20` repeat quick-actions `:12, :22`.

**Recommendation:** concise kitchen/date header; one primary Add Ingredient Item; actionable Needs attention summary; cookable recipes and compact inventory overview. Remove duplicate creation shortcuts. **Acceptance:** urgent decisions and next actions lead without repeating the same message in three formats.

### HOME-05 — Mobile order follows desktop columns, not priorities — Medium impact

**Evidence:** home `:118–165` places shortcuts/storage after recipes and three lists in DOM order. **Recommendation:** keep frequent actions in header/top toolbar and distribution below core work. **Acceptance:** mobile access to frequent actions does not require traversing long stock lists.

### HOME-06 — Warning banners need narrow-screen reflow — Medium impact, layout risk

**Evidence:** home `:48, :69` horizontal flex; `:60, :81` actions do not shrink. **Recommendation:** stack actions below full messages at narrow widths. **Acceptance:** 320–390px and long translations retain readable warnings and accessible actions.

### HOME-07 — Expired names may suggest completion before resolution — Medium impact, visual hypothesis

**Evidence:** stock-list component `:25–28` uses line-through and reduced opacity for expired stock. **Recommendation:** readable names with explicit expiry/date and rose status cues. **Acceptance:** users can identify unresolved expired stock without interpreting strike-through as completed removal.

### HOME-08 — Missing recipe metadata is replaced with plausible facts — Medium impact

**Evidence:** cookable-recipe component `:43` substitutes 15 minutes each for prep and cooking; `:47` substitutes two servings. **Recommendation:** unknown/omitted metadata, preserving legitimate zero values. **Acceptance:** unspecified recipes never appear to take a fabricated 30 minutes.

### HOME-09 — Repeated nested surfaces may reduce useful list density — Medium impact, visual hypothesis

**Evidence:** stock-list component `:1, :3, :5, :22` has glass outer panel, accent stripe, padding, and individual subcards, repeated across three lists. **Recommendation:** one panel with readable rows and dividers. **Acceptance:** names/quantities gain space without shrinking type or removing task information.

### HOME-10 — Empty states do not identify the next useful task — Medium impact

**Evidence:** stock-list `:77` generic “No items found”; recipe component `:63–69` advises adding ingredients while offering Explore All Recipes. **Recommendation:** distinguish no recipes, no stock, and unavailable recipe matches. **Acceptance:** first-run Home presents a coherent setup path instead of multiple generic empty panels.

### HOME-11 — Expansion changes text geometry and suppresses focus — Polish

**Evidence:** stock-list `:86` uses hover letter spacing and `focus:outline-none`. **Recommendation:** stable typography, visible focus, `aria-expanded` and controlled-region association. **Acceptance:** expansion is clear and operable without hover.

### HOME-12 — Expiry jump moves the viewport but not focus — Medium impact

**Evidence:** `pages/home/home.component.ts:144–149` smooth-scrolls only. **Recommendation:** intentional section focus transfer and immediate scrolling under reduced motion. **Acceptance:** keyboard reading resumes at the destination rather than remaining on the source action.

## Login — `/auth/login`

### LOGIN-01 — Password recovery is a dead control — High impact

**Evidence:** `pages/auth/login/login.component.ts:232–236` button has no handler/destination. **Recommendation:** working recovery flow or a truthful available recovery path. **Acceptance:** activating recovery always provides a usable next step.

### LOGIN-02 — Auth containment risks clipping short viewports — High impact, browser verification required

**Evidence:** shell `app.component.html:2` uses `h-screen overflow-hidden`; auth wrapper `:73` is full height; login `:17` uses `min-h-screen overflow-hidden` without a designated vertical scroller. Signup shares this structure.

**Recommendation:** vertically scrollable auth content and appropriate dynamic viewport sizing. **Acceptance:** landscape phone, short laptop, validation, and virtual keyboard do not hide fields or submit. Actual clipping is unverified.

### LOGIN-03 — Autofill intent is unspecified — Medium impact

**Evidence:** login `:206, :241` lacks explicit autocomplete. **Recommendation:** username/current-password semantics; appropriate capitalization/spelling settings for identifiers. **Acceptance:** password managers fill the correct fields and email-or-username remains supported.

### LOGIN-04 — Password visibility suppresses focus outline — Medium impact

**Evidence:** login `:252`, signup `:303`. **Recommendation:** visible keyboard focus and visibility state semantics, preserving accessible names. **Acceptance:** focusing the visibility control is distinct from focusing the input.

### LOGIN-05 — Promotional half-screen competes with returning-user task — Medium impact, aesthetic proposal

**Evidence:** login `:34–157` dedicates half of large layouts to food vectors, promotional heading, sample inventory card, and slogan. **Recommendation:** calmer bounded form and restrained brand context; retain palette/background. **Acceptance:** sign-in form leads the composition when rendered, without eliminating helpful brand continuity.

### LOGIN-06 — Example inventory may imply actual synchronized data — Polish, visual hypothesis

**Evidence:** login `:139–149` shows Kitchen Inventory, Synced, and an expiring food before authentication. **Recommendation:** label illustrative preview or simplify it. **Acceptance:** no implied account state before sign-in.

## Signup — `/auth/signup`

LOGIN-02 through LOGIN-04 apply to shared containment and controls.

### SIGNUP-01 — Disabled submit prevents revealing all errors — High impact

**Evidence:** `pages/auth/signup/signup.component.ts:424` disables invalid submission; errors depend on touch; requirements `:312` appear only after typing. The submit handler's touch-all branch cannot be reached through a disabled button.

**Recommendation:** allow validation submission that focuses the first issue, or make all blocking requirements explicit before disabling. Standardize the model with other forms. **Acceptance:** a user can always determine why account creation cannot proceed.

### SIGNUP-02 — Requirements arrive as a large new block — Medium impact

**Evidence:** `:312–409` conditionally inserts a bordered panel with five criteria. **Recommendation:** compact visible requirements before entry, progressively checked without large layout changes. **Acceptance:** starting a password does not unexpectedly displace submission; guidance is readable without 10px uppercase text.

### SIGNUP-03 — Positive strength copy contradicts acceptability — Medium impact

**Evidence:** `:326` labels scores three/four Good, while `:462–474` requires all five criteria. **Recommendation:** accurate completion wording such as requirements remaining; separate strength advice from validity. **Acceptance:** status text explains disabled/incomplete state truthfully.

### SIGNUP-04 — Browser-assisted account completion is underspecified — Medium impact

**Evidence:** `:202, :262, :292` omit autocomplete intent. **Recommendation:** name, username, email, new-password semantics and generated-password support. **Acceptance:** browser completion matches each visible label.

### SIGNUP-05 — Celebrity placeholders distract from account creation — Polish

**Evidence:** `:208, :238` celebrity name/handle examples. **Recommendation:** neutral examples or omit redundant placeholders while retaining username-format help. **Acceptance:** supporting copy explains constraints rather than adding personality unrelated to the task.

## Profile — `/profile`

### PROFILE-01 — Kitchen selection is click-only — High impact

**Evidence:** `pages/profile/profile.component.ts:249–253` clickable div lacks keyboard semantics. **Recommendation:** keyboard-operable selection with selected state; separate Manage control rather than nested buttons. **Acceptance:** select/manage any kitchen through keyboard with unambiguous focus.

### PROFILE-02 — Kitchen creation lacks pending/failure feedback — High impact

**Evidence:** `:320` only disables invalid input; `isCreatingKitchen` is set at `:552` but not consumed by the button; `:555` subscription has no error callback. **Recommendation:** pending state, duplicate prevention, retained input, inline error and retry; unify with sidebar. **Acceptance:** one submission, clear outcome, no lost name on failure.

### PROFILE-03 — Security/member actions need explicit consequences — High impact

**Evidence:** revoke-all `:194, :538` and member removal `:403, :624` execute immediately. **Recommendation:** state whether current device is included, confirm named member removal, provide pending/error feedback and a clear post-action destination. **Acceptance:** users understand scope before acting and can recognize success/failure afterward.

### PROFILE-04 — Sessions lack load/empty/error distinctions — Medium impact

**Evidence:** empty initial array `:426`, list-only template `:199`, console-only failure `:473`. **Recommendation:** stable loading placeholder, retryable failure, genuine empty state. **Acceptance:** no blank section after failed load.

### PROFILE-05 — Raw user-agent string is the session title — Medium impact

**Evidence:** `:211`. **Recommendation:** readable device/browser label with current-device and available activity information; full string in secondary details. **Acceptance:** long strings do not dominate or crowd the row at mobile widths.

### PROFILE-06 — Account, security, and kitchen administration have uneven composition — Medium impact

**Evidence:** `:49–226` stacks three large sections in two-thirds column; kitchens `:230` use the remaining third and follow security on mobile. **Recommendation:** clear Account / Appearance / Security / Kitchens sections, via simple navigation or bounded single-column layout. **Acceptance:** kitchen management remains easy to reach without traversing unrelated settings.

### PROFILE-07 — Controls and feedback diverge from the shared system — Medium impact

**Evidence:** native selects `:103, :361`, `p-toast` `:31`, and bespoke styling alongside app toast/PrimeNG contracts. **Recommendation:** existing canonical primitives and one feedback vocabulary. **Acceptance:** equivalent account and inventory actions share focus, error, sizing, and pending behavior.

### PROFILE-08 — Dialogs omit the documented overlay attachment — Medium impact, clipping unverified

**Evidence:** profile dialogs `:283, :327` and sidebar `:582` omit `appendTo="body"`. **Recommendation:** apply overlay contract, then verify focus/scroll/backdrop/small-screen boundaries. **Acceptance:** dialogs and their dropdowns remain visible inside the shell's clipping/transform context.

### PROFILE-09 — Password guidance differs from signup — Medium impact

**Evidence:** profile `:445` checks minimum length; signup `:462–474` uses five criteria. **Recommendation:** align displayed rules with intended backend policy and reuse concise requirement/visibility/autofill behavior. **Acceptance:** changing and creating passwords teach the same valid policy.

### PROFILE-10 — Session and invitation rows need responsive composition — Medium impact, layout risk

**Evidence:** `:188` title/revoke-all row; `:341` horizontal invitation controls; `:393` member identity/action. **Recommendation:** stack related controls at narrow widths and retain readable names/emails. **Acceptance:** long emails/translations fit and destructive actions stay distinct.

### PROFILE-11 — Disabled email has no explanation — Polish

**Evidence:** `:93–100`. **Recommendation:** readable noneditable value with reason, or supported change-email action. **Acceptance:** users understand the capability without guessing from disabled styling.

## Shared typography, fields, and motion

### TYPE-01 — Small uppercase labels and weight substitute for hierarchy — Medium impact

**Evidence:** `components/ui/form-field/form-field.component.ts:15` tracked uppercase labels; `:42` 11px hints; `components/ui/badge/badge.component.ts:43` 10px badges; extra-bold row names/headings throughout. **Recommendation:** implement the font/role proposal above with sentence case, regular body, medium controls, semibold headings. **Acceptance:** readable names and field labels lead; metadata recedes without becoming illegible.

### TYPE-02 — Font replacement has multiple hardcoded dependencies — Medium impact

**Evidence:** `frontend/src/styles.scss:8, :585, :601`; `frontend/src/index.html:17, :33`. **Recommendation:** centralize family inheritance and remove conflicting widget overrides when changing the family. **Acceptance:** inputs, dropdown overlays, data, and headings use the intended font in both themes; no mixed fallback surprise after loading.

### TYPE-03 — Shared help/error text lacks an association contract — Medium impact

**Evidence:** `components/ui/form-field/form-field.component.ts:37, :42` messages have no IDs; only label uses `forId`. **Recommendation:** IDs, input descriptions, invalid-state propagation. **Acceptance:** focusing an invalid field exposes its label and relevant error, without relying solely on alert announcement.

### TYPE-04 — Fixed label heights conflict with longer content — Medium impact, layout risk

**Evidence:** shared field `:11` uses `h-5`; auth uses `h-6`. **Recommendation:** allow intentional wrapping while preserving adjacent-field alignment. **Acceptance:** translated labels and badges do not overlap inputs or force smaller type.

### MOTION-01 — Reduced motion does not cover framework triggers — Medium impact

**Evidence:** CSS `styles.scss:480, :1594` covers selected classes; `utility/animationUtility/animations.ts:18, :47, :67` always translate/fade; `app.config.ts:84` enables animations without preference wiring. **Recommendation:** preference handling for framework motion and deliberate smooth scrolling. **Acceptance:** static background identity remains, while route/list displacement stops under reduced motion.

### MOTION-02 — Noninteractive panels may appear actionable on hover — Polish, visual hypothesis

**Evidence:** Home outer list/shortcut/recipe/location containers use `hover:shadow-lg` independently from actual inner actions. **Recommendation:** reserve hover feedback for actionable targets. **Acceptance:** pointer feedback reliably indicates interaction, with calmer passive surfaces.

## Design-system gallery — `/design-system`

Development-only; do not treat this as a customer page.

### DS-01 — Gallery lacks the compositions needed for cleanup acceptance — Medium impact

**Evidence:** `pages/design-system/design-system-page.component.ts:45–164` shows a limited primitive set. **Recommendation:** add real page headers, dense rows, pagination, dialogs/navigation, long-content, error/loading/empty and confirmation compositions. **Acceptance:** redesigned product patterns have an inspectable reference in both themes and widths.

### DS-02 — Example fields use different rendering paths — Medium impact

**Evidence:** `:96` uses `pInputText`; quantity/error examples `:102, :109` use plain inputs. **Recommendation:** canonical input paths in comparable examples. **Acceptance:** observed differences represent deliberate states, not accidental missing styling.

### DS-03 — Gallery repeats shell padding and frames every example — Polish

**Evidence:** `:38` adds `p-6 sm:p-10`, then repeated cards. **Recommendation:** simple section index/demonstration zones; display surfaces when they are the subject. **Acceptance:** examples align with shell geometry and are easy to compare.

## Legacy Dashboard — not independently routed

**Evidence:** `pages/dashboard/dashboard.component.html:9–66` contains four stats, three stock lists, and quick actions. `app.routes.ts` redirects `/dashboard` to `/home`.

### LEG-01 — A duplicate dashboard can reintroduce outdated patterns — Medium impact

**Problem / consequence:** the unused implementation retains the same extra-bold heading, large metric band, boxed lists, and duplicate shortcuts reviewed on Home. Treating it as another live page would overstate coverage and create parallel cleanup work. **Recommendation:** explicitly retire it if unused, or document a real intended role before redesigning it. **Acceptance:** one authoritative Home/dashboard composition; no accidental reintroduction of the legacy screen. Deletion is a future implementation decision, not performed by this review.

## Inventory pages — evidence and conventions

File references in these inventory sections are relative to `frontend/src/app/pages/inventory/` unless otherwise stated. Each numbered finding combines problem, consequence, recommendation, and acceptance criteria. These are source-based findings; actual visual consequences require rendered confirmation. Short proposed navigation labels must retain the canonical entity names wherever ambiguity would arise.

## /inventory — Inventory overview

Strength: primary Add Stock Item action is already differentiated, and location distribution offers useful context.

1. **High — architecture explanation dominates the page.** `inventory-overview-page/inventory-overview-page.component.html:50–403` places the large four-tier interactive pyramid before quick access and stock distribution. This teaches internal relationships before helping users act on expiring or depleted food. Move the diagram into a collapsed “How inventory is organized” help area; lead with items needing attention and recent stock. Acceptance: users can reach urgent stock and Add Stock Item from the opening viewport without expanding a conceptual diagram.
2. **High — physical inventory access sits below conceptual content.** The three destination cards begin at line 406 and repeat destinations already available in the hierarchy and action launchpad (16). Replace them with compact Stock / Ingredients / Groups local navigation aligned to the page title, and one useful stock summary. Acceptance: each destination has one obvious navigation affordance rather than several differently named entry points.
3. **Medium — terminology feels like system documentation.** Lines 59–73, 409, 479–489 use “Interactive Domain Model,” “4-Tier Hierarchy,” “Sub-Systems,” “Manage Taxonomy,” and “tiers.” Preserve correct entities but use task-first labels and short contextual descriptions; hide implementation language in optional help. Acceptance: a cook understands where to check stock without knowing the database hierarchy.
4. **Medium — counts and labels repeat inside every tier.** Lines 93–113, 319–353 repeat tier badges, titles, descriptions and batch counts; the layout uses 10–11px supporting text and very heavy weights. Use fewer type roles, normal supporting weight, and one count per level; avoid reducing type to fit the pyramid. Acceptance: a level reads as name → meaning → count at mobile width with no truncation of necessary meaning.
5. **High — click-only cards and tiers.** The pyramid and destination cards use `(click)` on divs (89, 321, 415, 443, 470). These do not provide native keyboard affordances. Use buttons for disclosure with expanded state, and links for destinations. Acceptance: all actions are reachable with Tab and perform their expected action using keyboard input.
6. **High — failed loading appears as valid empty counts.** TS:122 logs an error and sets loading false without an error view. Users can infer that inventory has zero contents. Show inline failure/retry state and preserve previously fetched data where available. Acceptance: failed API response cannot render zero metrics as successful results.
7. **Polish — decorative motion competes with a utility overview.** Repeated hover scale on tier/icon tiles (95, 327) and entry panel animation (52) can be replaced with restrained border/background feedback; retain motion only for disclosure continuity. Verify reduced motion rather than assuming global CSS covers Angular animations.

## /inventory/items — Stock list, grid, selection and restock

Strength: searchable/filterable stock, table/grid choice, pagination and bulk actions give a strong functional foundation.

1. **High — eight-column table has no intentional mobile composition.** `inventory.component.html:187–420` exposes selection, name/status, ingredient, location, quantity, expiration, purchased date with horizontal scrolling. Primary cooking decisions are name, quantity, expiry; purchase date and taxonomy can be secondary details. Create a mobile row/card with those primary fields and overflow actions, and reduce default desktop columns. Acceptance: at 375px the user can identify, assess and open an item without horizontal scrolling.
2. **Medium — filter toolbar has excessive simultaneous controls.** Lines 18–181 contain five stock status pills plus search, location, table/grid switching. Make search + location the main row, status a compact secondary row or filter menu, and show active filters/count distinctly. Acceptance: no control clipping at 320/375/768px and active filters are clear without reading every counter.
3. **Medium — type hierarchy relies on small uppercase heavy text.** Headers use 11px extra-bold tracked uppercase (194); creator metadata uses 10px (334); quantities and badges compete with bold item names. Adopt readable sentence-case column labels, restrained semibold item names, neutral ordinary metadata, and aligned tabular quantities. Acceptance: names/quantities/expiration scan first; metadata remains legible without zoom.
4. **Medium — each reference and location becomes a badge.** Lines 349–365 make category associations visually prominent, while every healthy item also has a Fresh badge (326). Reduce routine status/reference emphasis, retain urgent expiry cues and the existing palette; any change to reference badges must update the governing docs/design-system.md:118 rule rather than creating page-only exceptions. Acceptance: urgent stock draws more attention than taxonomy or healthy stock.
5. **Medium — out-of-stock names are crossed out and entire rows faded.** Lines 292, 311 imply completion or deletion, despite these items being actionable for restock. Keep names readable and use a neutral zero-stock label; reserve disabled styling for disabled operations. Acceptance: depleted item names and their actions retain readable contrast in both modes.
6. **High — primary row action relies on click-only table row; sorting relies on click-only th.** Lines 207, 232, 249, 266 and 285 lack native action/sort buttons. Provide a named item link and keyboard sort controls with aria-sort; row checkbox at 299 needs a unique accessible name and select-all needs a visible/accessible scope. Acceptance: keyboard users can sort, open and select items with announced state.
7. **High — bulk bar can exceed mobile width.** Fixed centered flex bar (861) contains count plus four labeled actions and deselect, with no wrapping/mobile width constraint. Use a bounded mobile selection dock with one primary action and More menu, reserve bottom space, and respect safe-area/navigation height. Acceptance: selection produces no horizontal viewport overflow and does not cover the last row or mobile navigation.
8. **Medium — selection context across filtering/pagination is unclear.** Header says Select All Visible (203), while floating count is global. Show “N selected” and selection scope, and make clear whether hidden/previous-page selection remains actionable. Acceptance: changing filters cannot lead to surprise bulk edits of hidden rows.
9. **Medium — empty filter and first-use empty state need different recovery.** Lines 448–473 show No Items Found. Present first-use Add Stock and filtered-no-match Reset Filters separately; loading should mirror actual rows instead of a generic card-only placeholder. Acceptance: no-match recovery preserves existing inventory; first use explains the next step.
10. **High — restock changes purchase date in a low-priority notice.** Restock sections 663–668 and 799–803 update all purchase dates to today; bulk form applies one added amount across heterogeneous units (723). Promote unit-specific effect and purchase-date change into a plain preview before confirming; group different units or require per-item values. Acceptance: confirmation states each final quantity/unit and date effect accurately.
11. **Medium — restock inputs and shortcuts are undersized and inconsistent.** Date shortcuts are 10px (645 etc.), submit button overrides 42px contract to 40px (680/816), and mixed native date vs PrimeNG controls differ from create/edit. Unify control height and date interaction; enlarge shortcut targets while preserving compact visual styling. Acceptance: consistent field geometry and usable touch targets across add/edit/restock.
12. **Medium — grid and table disagree in action discoverability.** `inventory-components/item-card/item-card.component.html:63–79` exposes notes/edit/delete directly, whereas table opening dominates. Align the common action model; keep one open/edit affordance and a quieter contextual menu. Acceptance: switching views preserves access to the same actions and selection expectations.

## /inventory/items/new — Add stock

Strength: grouped ingredient/location/quantity/date fields, inherited unit cue and inline quick creation support a useful flow.

1. **High — a five-column live preview consumes space better used for the form.** `add-item-page/add-item-page.component.html:35–38,385–486` allocates 5/12 desktop columns to a duplicate stock card; mobile renders it after all fields. Make the form a comfortable reading width; replace preview with a short selected-ingredient summary or optional disclosure. Acceptance: required fields and save action dominate; mobile users do not scroll through duplicate content after completion.
2. **Medium — four separate bordered form cards create excessive vertical rhythm.** Lines 39, 141, 249, 335 create repeated surface headings, uppercase labels and decorative dots. Keep one main form surface with quiet section dividers; move optional opened date and notes behind an Additional details disclosure. Acceptance: required stock creation feels short and date context remains understandable.
3. **High — save is disabled for invalid form without necessarily exposing why.** Lines 359–375 disable submit until valid. Prefer an enabled submission that reveals field errors and focuses the first invalid field, or clearly list blocking requirements. Acceptance: untouched/incomplete fields produce actionable feedback, not an inert primary button.
4. **Medium — storage buttons are fixed three columns.** Lines 168–198 use grid-cols-3 regardless of location count/name length. Allow custom locations and long names to wrap intentionally; selected state should be semantic, not styling alone. Acceptance: one, three and six locations remain readable/touchable at mobile widths.
5. **High — preview progress is fabricated.** Lines 475–481 show a fixed emerald w-3/4 bar under Time Remaining. It can imply a quantity of freshness not represented by data. Remove until driven by a defined, valid time calculation; no-date should show unknown expiry. Acceptance: preview cannot show a reassuring fixed green lifespan for expired or undated stock.
6. **Medium — development-facing preview wording adds clutter.** “Real-time Rendering” (394) has no task value. Remove and reserve badge semantics for actual stock states. Acceptance: summary contains food/location/quantity/date information only.
7. **High — quick-create fields have labels without for/inputId association.** Lines 503–534; modal lacks appendTo body (492–498), unlike selects. Associate labels, expose required-unit validation, provide inline creation error; retain working overlay placement. Acceptance: screen-reader/keyboard users can identify all fields and understand why creation failed.
8. **Medium — save action is described as sticky in a comment but ordinary flow layout.** Line 354 contains no sticky rule; after dates and notes it is far from initial inputs. Keep actions adjacent to the meaningful form end or use a bounded persistent footer with bottom spacing. Acceptance: mobile completion has an obvious save without duplicate preview intervening.

## /inventory/items/:id/edit — Edit stock

1. **High — apply the same form width, grouping and optional-details treatment as Add Stock.** `edit-item-page/edit-item-page.component.html:35–385,388` repeats the two-column editing/preview arrangement. Acceptance: create/edit have matching field order, section hierarchy and control geometry.
2. **Medium — duplicate “Updated Live Preview”/“Live Preview” badges.** Lines 393–395 spend hierarchy on rendering behavior. Replace with a concise stock context line only where it helps users identify the batch. Acceptance: edited item name and current stock are the principal context.
3. **High — invalid-edit save also becomes inert.** Line 373 disables save if invalid; use the same explicit validation model as Add Stock and keep loading/error states inside the form layout. Acceptance: invalid quantity/name/date provides named field feedback and useful focus behavior.
4. **Medium — navigation discards list context.** Inspect cancel/save navigation behavior and preserve prior search, filter, page and view in return path. Current inventory subpages generally navigate to fixed destinations. Acceptance: editing an item opened from a filtered list returns to that list context rather than a reset overview.
5. **Medium — quick-create dialog duplicates add-page label/validation patterns.** Lines 480–541 need the same associated labels, unit requirements and readable control/action dimensions. Acceptance: create/select behavior stays consistent between add and edit.

## /inventory/ingredients — Ingredients catalog

Strength: clear catalog/stock distinction, useful expansion into physical batches, search and group filtering.

1. **High — nested table requires sideways reading on mobile.** `ingredients-page/ingredients-page.component.html:202–268,409–455` has a six-column outer table and minimum-600px inner table. Provide compact primary ingredient rows, stock summary and a mobile batch list in expansion. Acceptance: user can inspect stock and add a batch at 375px without horizontal scrolling.
2. **High — stock status counts existence instead of available quantity.** TS:154–168 uses connected item count for in/out stock; template:335 renders In Stock whenever any batch exists. Zero-quantity connected batches can appear in stock, unlike Stock list's separate out-of-stock handling. Define available stock consistently and separate recorded batches from positive quantities. Acceptance: an ingredient with only depleted batches is Out of Stock in list, filter and expansion.
3. **Medium — catalog status pills likely overrun narrow widths.** Lines 33–110 keep All, In Stock, Out of Stock counters in a single nowrap flex container. Use a responsive filter control or smaller summary labels with accessible full names. Acceptance: 320px has no toolbar overflow.
4. **Medium — oversized language obscures an uncomplicated task.** “Master ingredient definitions,” “Pantry Stock Status,” “Ingredient Items for,” “Add Ingredient Item Now” (183,257,384,406). Use clear entity names with short stock actions, consistent with the agreed taxonomy. Acceptance: labels distinguish definitions/batches without repeatedly explaining internal concepts.
5. **High — sorting and expansion semantics incomplete.** Click th sorting (209 etc.) has no keyboard sort button/aria-sort; expansion button (284) lacks aria-expanded/controls; parent row also clicks (275). Use named native controls and announced expanded region. Acceptance: keyboard operations match pointer operations with state announcements.
6. **Medium — unnecessary inner sub-card and broad badge emphasis.** Lines 317–346 and 378 add badges for group/unit/healthy status and a boxed drawer within boxed table. Keep one surface and prioritize ingredient → available quantity → batches; taxonomy as quiet metadata. Acceptance: expanded content visually belongs to its row without a second competing card.
7. **Polish — expander orientation appears contradictory.** Lines 295–299 swap right/down chevron and also rotate-90 when expanded. Use either glyph swap or rotation, then verify orientation. Acceptance: collapsed points right, expanded points down.
8. **Medium — filtered-empty copy implies a new ingredient is needed.** Line 183 says create a new ingredient even when filters hide existing entries. Branch empty copy; prioritize Reset Filters for no-match and Add Ingredient for first use. Acceptance: each empty state offers the appropriate recovery.
9. **Medium — delete is permanently exposed beside edit.** Lines 361–367 place a destructive action in every row. Move less frequent deletion into a row menu while retaining confirmation and batch impact explanation. Acceptance: ordinary catalog scanning has one primary row action; deletion consequences are clear before confirmation.

## /inventory/ingredients/new — Add ingredient

1. **Medium — three-field form spans max-w-4xl with shadow-xl.** `add-ingredient-page/add-ingredient-page.component.html:1,37` produces excessive horizontal field travel for simple creation. Use a narrower consistent form width and restrained shadow while keeping current glass background. Acceptance: name/group/unit read as one concise form with labels close to values.
2. **Medium — labels and placeholders over-explain taxonomy.** Lines 60–73,80–95 use “Ingredient Group (Taxonomy Category)” and long example strings. Use short labels, concise examples and one explanatory hint where classification matters. Acceptance: required unit is clear and group is explicitly optional without confusing category/group identity.
3. **Medium — option loading and prerequisite failure need in-form handling.** Inspect ingredient/unit/group loading: the template has no loading branches and selection dependencies can arrive later. Add option loading/failed/retry states and a clear prerequisite response if no units exist. Acceptance: empty option lists cannot masquerade as successfully loaded empty data.
4. **Medium — first-use choices may deserve defaults.** Required default unit with a large searchable list introduces a decision without describing its effect on stock. Add one short hint on inherited stock measurement and prioritize common units. Acceptance: user understands the measurement choice before creating an ingredient.

## /inventory/ingredients/:id/edit — Edit ingredient

1. **High — changing unit introduces a consequential workflow without advance explanation.** `edit-ingredient-page/edit-ingredient-page.component.html:86–103`; TS:120 routes to reconciliation after unit change. Explain affected stock count and whether conversion can be automatic before save. Acceptance: user understands the conversion step before submitting, and no context is lost.
2. **Medium — creation/edit presentation drifts.** Edit input has !p-3 at line 62 unlike add, lacks the group hint, and uses the same broad form shell (1,43). Reuse one field hierarchy and shared field geometry. Acceptance: add/edit have matching spacing, labels and heights.
3. **Medium — ingredient name is absent from page title.** Generic Edit Ingredient (10) provides no context until loaded fields. Include the loaded name as restrained subtitle and stable loading skeleton. Acceptance: users can verify the entity before changing a shared catalog definition.

## /inventory/ingredients/:id/unit-reconciliation?targetUnitId=… — Unit reconciliation

1. **High — suggested numeric values can imply safe conversion across incompatible dimensions.** TS:105–116 converts only when unit type matches, otherwise retains raw quantity; template:84–94 shows all values identically. Mark “Converted” vs “Enter quantity” explicitly and require review for incompatible units. Acceptance: a mass-to-count change cannot silently suggest the same numeric quantity as a valid conversion.
2. **High — zero-stock rows conflict with minimum quantity.** Template:86 min=0.01 while connected items can be zero quantity. Permit zero where valid and validate all rows before submit; don't force phantom stock. Acceptance: depleted stock remains zero after reconciliation.
3. **High — quantity inputs have no item-specific accessible label.** Template:84–91 relies on column heading, which does not label each control. Associate each input with item + target unit, associate per-row errors, provide error summary. Acceptance: keyboard/screen-reader editing identifies both batch and unit.
4. **High — banner and editable table need mobile reflow.** Lines 31–47 uses side-by-side title/unit pills; table has four columns and w-36 inputs (90). Stack unit transition and use mobile batch panels with old → new quantity. Acceptance: each new quantity can be entered with original quantity visible at 375px.
5. **Medium — no distinction between computed suggestion and confirmed value.** Add conversion explanation, affected batch count, total where units are compatible and a “Review quantities” confirmation. Acceptance: changing shared default units is visibly different from harmless metadata edits.
6. **Medium — cancel drops edit context.** TS:182–183 returns to catalog. Preserve edit draft/return context for cancellation rather than losing the user’s name/group edits or prior list position. Acceptance: cancelling reconciliation restores the correct ingredient editing state.

## /inventory/groups — Categories and groups

1. **High — multiple nested disclosure layers hide the main management task.** `ingredient-groups-page/…html:24`; `inventory-components/ingredient-category/…html:67–78`; `ingredient-group/…html:75–257` nests category → group → ingredient → physical stock. Offer a flatter group directory with category metadata and optional detail panel; keep deep stock browsing in stock/catalog. Acceptance: finding and managing a group does not require expanding three layers.
2. **High — group edit route has no discoverable link on the groups listing.** Group/category templates show expand and add ingredient/stock operations, but no edit group action; edit route exists in app.routes.ts:133. Add an explicit contextual Edit Group action to each group and explain category assignment. Acceptance: every listed group can be edited directly without typing a URL.
3. **High — group disclosure uses click-only div and ingredient click-only tr.** `ingredient-group/…html:4–10,110–125`; category button is native but lacks aria-expanded (category:8). Use native buttons with expanded/controls semantics at every tier. Acceptance: taxonomy browsing works with keyboard and state is announced.
4. **Medium — ornamental nesting costs useful content width.** Category accent stripe, large emoji tile, count badge, live stock badge, item pill, boxed chevron (category:4–59) surround another glass-card (group:1). Retain category identity but reduce to compact heading/count/disclosure; avoid nested shadows. Acceptance: hierarchy is explained by indentation/type, not six competing containers/badges.
5. **Medium — taxonomy page mixes organizing definitions and managing stock.** Group heading says ingredients/items/Active (group:40–62), while list contains total quantity and physical items. Prioritize group name/category/ingredient count, provide secondary stock summary only in details. Acceptance: primary task is unambiguous and users can distinguish zero ingredients from zero available stock.
6. **Medium — filtered-empty state offers no reset or creation recovery.** Container:111–123 only states nothing matched. Add Clear Filters and retain Add Group when library is empty; distinguish missing category data from filter no-match. Acceptance: empty search can be cleared from the state itself.
7. **Medium — mobile hides relevant stock totals.** Group:88 hides Total Quantity below md; category:43 hides stock summary below sm. If totals are retained, expose them in mobile details rather than removing essential data. Acceptance: same meaningful data is available across widths.

## /inventory/groups/new — Add group

1. **High — one autocomplete combines search, creation and reassignment without enough explicit consequence.** `add-ingredient-group-page/…html:76–183` invites existing or new names; suggestions show current group at 137 and chips say from previous group at 166. Existing selection may move ingredients and new names create catalog entities. Distinguish Select Existing and Create New as explicit actions; summarize reassignments before save. Acceptance: users can identify each pending create/move and previous group before committing.
2. **High — custom autocomplete lacks combobox semantics and arrow-key selection.** Input:99–107 supports Enter; dropdown:119–154 consists of button suggestions without combobox/listbox state. Use an accessible autocomplete primitive or implement label/expanded/active-descendant/arrow navigation/escape and dismissal. Acceptance: entire flow is usable with keyboard and announced suggestions.
3. **Medium — repeated Add/Save primary buttons compete.** Add at 110–115 and Save Group at 193 are both primary; creation can be confused with submission. Make ingredient addition a secondary action and group save primary; explain chips are pending. Acceptance: one page-level committing action has highest emphasis.
4. **Medium — broad shell and chip-heavy selection hinder long membership lists.** max-w-4xl (1), shadow-xl (37) and chips:156–182 make many assignments hard to scan. Use a simple selected-ingredient list with name/current group/new status and full remove target, leaving chips for few selections. Acceptance: 20 selections can be reviewed and removed without a dense badge cloud.
5. **Medium — tiny removal icon and hover-only Select text.** Lines 146–150 show +Select only on hover; remove chip uses 10px icon (178). Keep essential guidance visible and ensure adequate interactive area. Acceptance: touch users can discover selection and reliably remove a pending member.

## /inventory/groups/:id/edit — Edit group

1. **High — edit supports only name/category while creation supports membership.** `edit-ingredient-group-page/…html:43–76` has two fields and no membership editor or link. Provide group ingredients management or an obvious navigation to it. Acceptance: users can correct memberships after initial creation through discoverable UI.
2. **Medium — changing parent category provides no affected-content context.** Category select:65 affects group classification but template gives no current ingredient count or preview. Include compact current category/group summary and affected ingredient count. Acceptance: moving a populated group has understandable scope before save.
3. **Medium — same broad-card/title issues as other short forms.** Lines 1,9,42 use 4xl width, 3xl extra-bold generic heading and shadow-xl around two fields. Adopt the shared short-form geometry and include current group name. Acceptance: edit identity and concise controls are legible without inflated canvas.

## Ingredient Categories — currently unrouted implementation

`ingredient-categories-page/ingredient-categories-page.component.html` exists, but app.routes.ts has no route for it; `/inventory/nutrients` redirects to groups. Treat this as existing implementation coverage, not a publicly accessible page.

1. **Medium — decide whether this is a useful standalone destination.** It shows category cards with description and group chips (20–76), but no navigation or management action. If retained, integrate as a category detail within Groups rather than adding a redundant top-level browse destination. Acceptance: one clear place to view category/group relationships.
2. **Medium — dense headers can crowd long category names and counts.** Lines 25–43 force icon/name/count into one flex row, no deliberate long-name handling. Allow name wrapping and put count below name. Acceptance: long names and large counts fit at mobile width.
3. **Medium — chips appear actionable without being interactive.** Lines 64–69 display associated group names in bordered pills. Render quiet text/list if informational, or link directly to relevant group detail. Acceptance: affordance matches behavior.
4. **Polish — repeated “Ingredient Category” metadata under every title.** Lines 32–34 repeats the known page context. Remove and use meaningful description/count in that slot. Acceptance: each card conveys unique information before repeating structure.

## Recipes — `/recipes`

Evidence paths in the page sections below are relative to `frontend/src/app/pages/` unless otherwise specified. All observations remain source-based.

### REC-01 — Catalog cards contain too much of the recipe — High impact

**Evidence:** `recipes/recipe-components/recipe-card/recipe-card.component.html:7–9` fixes height to 480px and hides overflow; `:99–156` includes four statistics, stock progress, ingredients, and instructions.

**Problem / consequence:** discovery, pantry reconciliation, instruction reading, and destructive actions compete within every object. Fixed height also introduces a long-content clipping risk.

**Recommendation:** lead with name, short description, time, servings, and concise readiness. Move full ingredients, instructions, history, and deletion into detail or an overflow menu. Use natural height or a deliberate compact list.

**Acceptance:** users can compare names, duration, and readiness without reading instructions; long names remain identifiable and essential actions never disappear.

### REC-02 — Skeletons predict the wrong grid — Medium impact

**Evidence:** `recipes/recipes.component.html:200` uses one/two/three loading columns; `:259` uses one/two loaded columns.

**Problem / consequence:** loading completion changes the structure rather than replacing placeholders. **Recommendation:** match skeleton columns and approximate content height. **Acceptance:** the grid does not reorganize when data arrives.

### REC-03 — Administrative metadata competes with practical metadata — Medium impact

**Evidence:** recipe card `:15, :50, :57, :102, :130, :160` mixes extra-bold headings with 10–12px descriptions, timestamps, and uppercase labels.

**Recommendation:** readable descriptions, restrained heading weight, one quiet practical metadata row; history moves to detail. **Acceptance:** name leads, time/readiness follow, administrative metadata stays tertiary.

### REC-04 — Failed load needs its own persistent state — Medium impact

**Evidence:** `recipes/recipes.component.ts:138` uses a failure toast; template `:216–255` renders empty and filtered-empty states.

**Problem / consequence:** failure can be mistaken for an empty catalog after a toast disappears. **Recommendation:** persistent error/retry; clear filters for no results; create-first-recipe for true emptiness. **Acceptance:** these three conditions have distinct explanations and actions.

## Recipe detail — `/recipes/:id`

### RDET-01 — Edit and summary tiles compete with cooking — High impact

**Evidence:** `recipes/recipe-detail/recipe-detail.component.html:95` makes Edit primary; `:134–159` adds four statistic tiles before tags and cooking content.

**Recommendation:** compact inline time/servings; secondary Edit; consider a supported Plan meal or cooking action as the primary task. **Acceptance:** the title and cooking content lead; edit/delete remain discoverable without dominating.

### RDET-02 — Ingredients and steps are overboxed — Medium impact

**Evidence:** detail template `:175–197` nests bordered ingredient rows inside glass; `:247–277` individually boxes steps.

**Problem / consequence:** each instruction looks like a separate interface object instead of a readable sequence. **Recommendation:** retain section surfaces, use ingredient separators and numbered prose; emphasize exceptions only. **Acceptance:** the recipe can be followed as a continuous sequence.

### RDET-03 — Ingredient row and substitution action are nested — Medium impact

**Evidence:** `:191–197` makes a keyboard-operable button-like row; `:227–234` embeds a substitution button.

**Recommendation:** separate the ingredient inventory link and substitution action. **Acceptance:** each action receives distinct focus and activation; clicking substitution does not also navigate.

### RDET-04 — Substitution explanation exposes ambiguous taxonomy — Polish

**Evidence:** `:302–307` describes sharing “the same category or ingredient category.” **Recommendation:** explain why a replacement is suggested in plain kitchen terms; distinguish no suggestions from lookup failure. **Acceptance:** users understand the match and next step without decoding implementation vocabulary.

## New recipe — `/recipes/new`

### RNEW-01 — Ingredient rows need a mobile composition — High impact

**Evidence:** `recipes/recipe-components/add-recipe-form/add-recipe-form.component.html:310` uses one horizontal row; `:346` reserves `w-24` for quantity, `:359` reserves `w-28` for unit, alongside selector and drag/remove controls. `:273–299` adds two long header actions without a mobile wrap.

**Problem / consequence:** the selector may become unusably narrow or overflow. **Recommendation:** ingredient selection on a full-width first row; quantity/unit together beneath; add-row at list end; create-ingredient as a quieter contextual action. **Acceptance:** at 375/390px, names and inputs remain readable and long translated actions fit. Actual clipping remains unverified.

### RNEW-02 — Reordering relies on native dragging — High impact

**Evidence:** `:305–323` and `:429–447` put dragging on entire ingredient/step rows; handles have pointer events disabled.

**Problem / consequence:** no visible keyboard reorder path and possible interference with input editing. **Recommendation:** a dedicated drag handle plus move-up/down controls or accessible sortable behavior. **Acceptance:** keyboard and touch users reorder without disrupting text entry, and receive order feedback.

### RNEW-03 — Two simultaneous action bars — Medium impact

**Evidence:** `:17–33` header Save/Cancel and `:497–513` fixed footer Save/Cancel.

**Recommendation:** one intentional persistent action region for the long form. Verify safe areas, keyboard occlusion, and the final field. **Acceptance:** one action hierarchy and no obscured focused content.

### RNEW-04 — Error summary needs field destinations — Medium impact

**Evidence:** `:36–67` renders validation strings in a summary. **Recommendation:** attach errors to their field/row and make summary entries focus those fields. **Acceptance:** correcting an error does not require searching the entire form.

### RNEW-05 — Tag removal lacks a meaningful name/focus treatment — Polish

**Evidence:** `:253–258` uses × with `focus:outline-none` and no explicit accessible label. **Recommendation:** “Remove [tag]” and visible focus. **Acceptance:** removal is distinguishable by keyboard and assistive technology.

## Edit recipe — `/recipes/:id/edit`

This route shares the create template: RNEW-01 through RNEW-05 apply. Keep the same layout and control placement in both modes.

### REDIT-01 — Failed loading and unsaved navigation need explicit continuity — High impact

**Evidence:** `recipes/recipe-components/add-recipe-form/add-recipe-form.component.ts:139–175` loads an existing recipe and redirects on load error; `:547–551` handles save failure. No `canDeactivate` or unsaved-change handling was found in the inspected route/page files.

**Problem / consequence:** silent return to the catalog obscures why editing failed; long edits are vulnerable to accidental navigation. **Recommendation:** distinct loading, missing-recipe, and retryable failure states; preserve values after failed update; protect dirty navigation; return to the edited detail after successful save. **Acceptance:** test each state, including browser Back and a deleted recipe. The full runtime behavior remains unverified.

## Meal planner — `/meal-planner`

### MP-01 — Two view-control layers and nested cards compete with meals — High impact

**Evidence:** `meal-planner/meal-planner.component.html:33` has Calendar/Daily controls; `weekly-view/weekly-view.component.html:3` adds a glass View Layout bar; `:62–100` nests day cards and meal subcards.

**Recommendation:** one compact toolbar with current week/day and view choice. Prefer a clear weekly desktop layout and mobile agenda; retain optional alternatives in a quieter menu. **Acceptance:** users identify current date range and mode in one place; meals dominate the workspace.

### MP-02 — Constructive shopping actions look destructive — High impact

**Evidence:** planner template `:13–15`, weekly view `:149–153`, daily focus `:142–144` use `btn-danger` for missing-ingredient shopping actions.

**Recommendation:** secondary/primary action styling with consistent wording, “Add missing ingredients to shopping list.” Keep stock warnings semantic. **Acceptance:** danger styling consistently means a destructive operation.

### MP-03 — Removal is hover-dependent — Medium impact

**Evidence:** weekly view `:124` uses `opacity-0 group-hover:opacity-100`. **Recommendation:** show on focus and touch, or use a visible overflow control. **Acceptance:** removal is discoverable without hover.

### MP-04 — Missing values become invented facts — Medium impact

**Evidence:** weekly view `:110` substitutes 15 minutes and 400 kcal. **Problem / consequence:** missing data appears measured. **Recommendation:** omit unknown values or label them unknown; identify real estimates explicitly. **Acceptance:** no invented nutrition or timing values.

### MP-05 — Daily summaries precede the task and overstate readiness — Medium impact

**Evidence:** `daily-focus/daily-focus.component.html:18` has three cards before the timeline; `:62` displays 100% Ready when no ingredients are missing, including an empty day.

**Recommendation:** meals first, compact summary second; a distinct “No meals planned” state. **Acceptance:** empty and fully supplied days are visibly different.

### MP-06 — Ingredient checklist heading overpromises — Medium impact

**Evidence:** daily focus `:175–215` shows missing names per recipe or “All ingredients in pantry,” rather than a full checklist. **Recommendation:** name it Missing ingredients or provide a consolidated quantity-aware checklist. **Acceptance:** heading matches content, including repeated ingredients across meals.

## Plan a meal — `/meal-planner/new`

### PM-01 — Catalog failure presents fictional selectable recipes — High impact

**Evidence:** `meal-planner/plan-meal-page/plan-meal-page.component.ts:75–109` creates mock recipes in the error branch and selects the first.

**Problem / consequence:** a failed request appears successful and users can choose nonexistent content. **Recommendation:** explicit error and retry; fixtures only in tests. **Acceptance:** no fictional recipes appear after a failed request.

### PM-02 — Save leaves before persistence completes — High impact

**Evidence:** component `:149–160` calls the service then immediately navigates; template `:231–236` disables only for missing selection.

**Recommendation:** pending state, duplicate-submission prevention, navigation only after success, inline retry on failure. **Acceptance:** one submission creates one meal and users see the outcome before leaving.

### PM-03 — Long catalog separates selection from confirmation — Medium impact

**Evidence:** template `:125–183` renders all filtered recipes; servings begin at `:188`, actions at `:227`.

**Recommendation:** bounded searchable results plus selected-recipe summary; group date, meal, servings, and confirmation around the selection. **Acceptance:** choosing a recipe does not require scrolling past all remaining recipes to save.

### PM-04 — Miniature controls depart from shared sizing — Medium impact

**Evidence:** template `:104` uses text-xs/py-1.5 search; day buttons `:52`, servings controls `:209–219` use ad hoc sizing. **Recommendation:** shared search and consistent labeled day/meal/stepper controls. **Acceptance:** aligned controls with clear selected states and comfortable mobile operation.

## Shopping list — `/shopping-list`

### SHOP-01 — Seven-column table carries the mobile workflow — High impact

**Evidence:** `shopping-list/shopping-list.component.html:214–218` places the table in horizontal overflow; bought-state control at `:477–505` follows category, store, quantity, and price.

**Problem / consequence:** the primary action may require horizontal navigation. **Recommendation:** mobile rows with bought control, name, quantity/unit, and store together; optional details expand or open edit. Preserve useful desktop columns. **Acceptance:** at 375/390px, mark bought without horizontal scrolling.

### SHOP-02 — Leading checkbox means selection, not bought — High impact

**Evidence:** `:331–339` uses the leading checkbox for bulk selection; `:480–505` uses a rightmost button for bought.

**Problem / consequence:** the familiar shopping-list affordance performs an unexpected task. **Recommendation:** leading checkbox marks bought; bulk selection becomes an explicit mode. **Acceptance:** selected and purchased states are immediately distinguishable.

### SHOP-03 — Sorting and inline editing are pointer-oriented — Medium impact

**Evidence:** `:248–302` clickable `<th>`; `:424–435` and `:459–471` clickable divs with hover pencil icons.

**Recommendation:** labeled sorting/edit buttons, visible focus, sort-state semantics. **Acceptance:** sort, quantity edit, and price edit work with keyboard alone.

### SHOP-04 — Unknown price looks like a free item — Medium impact

**Evidence:** `:463–468` renders falsy prices as $0.00 while totals are prominent above. **Recommendation:** “Price not set” and count of unpriced rows beside estimated totals. **Acceptance:** zero cost and unknown cost are distinct.

### SHOP-05 — Bulk dock has competing strong actions — Medium impact

**Evidence:** `:516–559` fixed dock has green Mark bought, primary Restock, and danger Delete. **Recommendation:** one contextually leading action; quieter secondary/destructive access; mobile bounds and safe-area handling. **Acceptance:** dock does not obscure rows and has a clear next action.

## New shopping item — `/shopping-list/new`

### SNEW-01 — Repeated ingredient identity adds unnecessary framing — Medium impact

**Evidence:** `shopping-list/add-item-page/add-item-page.component.html:64–110` has selection followed by an emphasized name/category/unit summary.

**Recommendation:** place inherited unit/category beside quantity as quiet context. **Acceptance:** ingredient and amount read as one task without redundant identity cards.

### SNEW-02 — Inline creation fields depend on placeholders — Medium impact

**Evidence:** `:113–143` new ingredient name/group/unit; `:200–210` new store name. **Recommendation:** persistent labels and a compact, clearly bounded creation section. **Acceptance:** fields remain identifiable after typing, and catalog creation is distinguishable from adding a shopping row.

### SNEW-03 — Duplicate resolution can state the result more clearly — Polish

**Evidence:** `:26–40` offers increase-existing and open-existing. **Preserve** this useful behavior. **Recommendation:** show resulting quantity before the user increases it. **Acceptance:** the duplicate decision has a predictable outcome.

## Edit shopping item — `/shopping-list/:id/edit`

SNEW-01 and SNEW-02 apply to the shared template.

### SEDIT-01 — Edit states must preserve identity and purchase context — Medium impact, verification required

**Evidence:** shared `shopping-list/add-item-page` component; edit route in `app.routes.ts`.

**Recommendation:** distinguish loading/missing item from a blank new form; retain bought status; explain ingredient changes; keep input after failure. **Acceptance:** test existing bought and unbought rows, missing IDs, and failed updates. These are required state checks rather than claimed observed defects.

## Stores — `/shopping-list/stores`

### STORE-01 — A simple list has too many boundary layers — Medium impact

**Evidence:** `shopping-list/stores-page/stores-page.component.html:15, :37, :51` uses separate glass panels and individually bordered/shadowed rows. **Recommendation:** one outer surface, separators, compact add control. **Acceptance:** names and management actions lead the scan.

### STORE-02 — Rename row needs a mobile arrangement — Medium impact, layout risk

**Evidence:** `:54–75` has input/Save/Cancel in one nonwrapping row; archive controls remain alongside at `:103–114`. **Recommendation:** full-width edit row with stacked actions on mobile; archive outside active editing. **Acceptance:** usable input width and all actions fit at 375/390px.

### STORE-03 — Trash icon means archive — Medium impact

**Evidence:** `:106–113` invokes archive but displays `pi-trash`. **Recommendation:** archive icon and label; archived group/filter. **Acceptance:** affordance communicates reversible archiving accurately.

### STORE-04 — Store name needs a persistent label — Polish

**Evidence:** `:21–27` relies on placeholder. **Recommendation:** persistent or accessible label plus pending feedback. **Acceptance:** input purpose remains clear while editing and saving.

## Restock review — `/shopping-list/restock`

### REST-01 — Eligibility conflicts with the explanation — High impact

**Evidence:** `shopping-list/restock-review-page/restock-review-page.component.ts:170–171` falls back to eligible items when none are bought; template `:74–76` says to check items as bought first.

**Problem / consequence:** stock may be added for items not purchased. **Recommendation:** define eligibility explicitly; if unbought selections are allowed, label and confirm that decision; otherwise show the bought-items empty state. **Acceptance:** review rows and explanation agree.

### REST-02 — Expiry looks known when it is guessed — High impact

**Evidence:** component `:173–184` initializes draft expiries to two weeks. **Recommendation:** label estimated values and allow unknown expiry or meaningful ingredient-aware defaults. **Acceptance:** users never mistake a default estimate for recorded information.

### REST-03 — Every row expands the full editing task — Medium impact

**Evidence:** template `:84–171` includes editable name, badges, and mode controls per card; `:263` onward adds quantity/unit/location/date fields.

**Recommendation:** compact review row with amount, match outcome, and resulting stock; expand uncertain/edited rows. **Acceptance:** a large trip can be reviewed quickly without sacrificing corrections.

### REST-04 — Excluded rows remain editable but faded — Medium impact

**Evidence:** `:83–103` applies opacity while controls stay active. **Recommendation:** collapse or clearly disable excluded details; keep title and reinclude action legible. **Acceptance:** submitted scope is unmistakable and editing does not require reading faded text.

### REST-05 — Inclusion checkbox lacks an explicit name — Medium impact

**Evidence:** `:88–91` lacks label/ARIA name. **Recommendation:** “Include [item] in restock.” **Acceptance:** each inclusion control is distinguishable to assistive technology.

### REST-06 — Success loses the restocked items — Medium impact

**Evidence:** component `:457–463` navigates to `/inventory` after a toast. **Recommendation:** completion summary with View restocked items / Return to shopping list, or relevant Ingredient Items result view. **Acceptance:** users can verify the exact stock just added or updated.

## Potential layout resolutions — conceptual, not screenshots

These sketches show proposed reading order. They do not represent rendered measurements or an implemented result. Keep the existing background visible around the work surface and retain the current semantic colors.

### Home: use the first viewport for decisions

```text
Today in your kitchen                             Add Ingredient Item
Saturday, October 3

Use soon                          Cook with what you have
Spinach         2 days            Vegetable rice bowl     View recipe
Yogurt          3 days            Tomato pasta            View recipe
View affected Ingredient Items    View all recipes

Tonight                           Shopping
Vegetable rice bowl · 2 servings   4 remaining · estimated $18.50
View meal plan                    Open shopping list

Storage totals and nonurgent summaries follow the work.
```

**Design intent:** put decisions before totals, and attach each action to the information that motivates it. The exact order should be validated with everyday kitchen use, not treated as a fixed universal dashboard.

### Ingredient Items: one collection workspace

```text
Inventory / Ingredient Items                     Add Ingredient Item
Ingredient Items

Search ingredient items…       Location ▾    Status ▾    More filters
Active filters: Fridge ×  Expiring soon ×                       Clear

Ingredient Item        Quantity      Location       Expiration      ⋯
Greek yogurt           500 g         Fridge         In 3 days       ⋯
Spinach                200 g         Fridge         In 2 days       ⋯

Showing 1–15 of 42                                  Previous 1 Next
```

**Mobile direction:** name and freshness on the first line; quantity and location on the second; explicit row action with enough touch area. Preserve comparison-friendly desktop columns. Keep Ingredient and Ingredient Item distinct where both names appear.

### Recipe editor: an intentional form, including mobile

```text
Recipes / New recipe
New recipe

Recipe name
[ Vegetable rice bowl                                      ]
Description (optional)
[                                                          ]
Servings [2]     Prep [10 min]     Cook [20 min]

Ingredients                                      Add ingredient row
[ Spinach                                                ▾ ]
Quantity [200]   Unit [g ▾]              Move up / down       Remove
[ Jasmine rice                                           ▾ ]
Quantity [150]   Unit [g ▾]              Move up / down       Remove

Method                                               Add step
1  [ Wash and prepare the vegetables…                     ]
2  [ Cook the rice…                                       ]

Cancel                                                  Save recipe
```

**Design intent:** the same group relationships survive on a phone. Ingredient selection gets the whole available width; quantity and unit stay together; drag is optional rather than the only reorder mechanism. The final action stays discoverable without obscuring the last field.

### Shopping: optimize for checking items in a store

```text
Shopping list                                           Add item
4 remaining · estimated total $28.50                  More actions ⋯
Search…                               Store ▾       To buy / Bought

Store A
☐  Spinach                 200 g                         $3.00    ⋯
☐  Greek yogurt            500 g                         $5.50    ⋯

Store B
☐  Jasmine rice            1 kg                          $8.00    ⋯

Bought (3) ▾                                      Review for restock
```

**Design intent:** checkboxes and ingredient names dominate. Store management and meal-plan synchronization remain available as secondary actions. Restock is a review step that explains what will be added to inventory, not an ambiguous completion button.

## Remediation sequence

| Phase                                          | Concrete deliverables                                                                                                                    | Exit criteria                                                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Restore review evidence                     | Repair the local native dependency outside this review; use an environment that permits browser launch; capture the current working tree | Reproducible screenshot set for the full route matrix, with synthetic data and state labels                                                             |
| 2. Repair confirmed interaction/state failures | Working recovery affordance, honest planner load states, save completion feedback, keyboard drawer behavior, accurate stock/expiry data  | No dead controls, fictional fallback content, premature success navigation, or offscreen navigation focus; affected flows verified before visual polish |
| 3. Shared layout and typography                | Font comparison, root and PrimeNG font unification, page-header/gutter rules, sentence-case labels, quiet reference text                 | Home, one inventory table, one complex form, and one shopping view approved at desktop/mobile widths in both themes                                     |
| 4. Core task layouts                           | Inventory overview, stock/ingredient/group lists, home, shopping collection                                                              | Users reach task content without explanatory diagrams or repeated summary chrome blocking it                                                            |
| 5. Complex editing and planning                | Recipe editor/detail, meal planner, stock forms, reconciliation/restock                                                                  | Keyboard and mobile paths work; validation is local; unsaved input is protected; consequences are explicit                                              |
| 6. Account layout and state consistency        | Login/signup, profile/kitchens/sessions, loading/error/retry/empty states, global feedback                                               | No dead controls; failures cannot masquerade as successful emptiness; return navigation preserves task context                                          |
| 7. Polish and retirement                       | Motion consistency, long-text/localization checks, gallery updates, explicit decision on legacy pages                                    | No redundant design implementations; regression evidence and updated system documentation agree                                                         |

Design and behavior work should ship in reviewable groups, with each shared change checked against its consumers. Do not introduce new production dependencies simply to achieve a font or layout change.

## Required rendered coverage before calling the cleanup complete

Capture **every canonical route** in the route table. Reuse the same synthetic kitchen and comparable data for before/after images. Record route, viewport, theme, role, fixture, and state in a manifest. The minimum screenshot pair is 1440×900 desktop and 390×844 mobile for each route; inspect 1280×800 and 768×1024 where table/calendar/editor breakpoints differ. Include 320px reflow for dense controls. Screenshots must be opened and inspected, not merely generated.

| Flow/state       | Required scenarios                                                                                  | What success looks like                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Navigation       | Expanded/collapsed desktop; open/closed mobile; long kitchen name; multiple kitchens; profile       | Current location is accurate; hidden navigation cannot receive focus; close restores focus; content remains reachable |
| Home             | Populated, first use, no expiring stock, partial data failure                                       | Distinct urgent and optional content; errors never show as reassuring zero totals                                     |
| Inventory        | 0, 1, 50+ Ingredient Items; long labels; unassigned refs; all freshness states; active filters      | Names/actions fit; counts match the visible scope; no-result reset differs from first-use creation                    |
| Ingredient forms | Blank, touched-invalid, duplicate, missing reference data, saving, save failure, successful return  | Visible labels, local errors, entered values preserved, focused recovery, context retained                            |
| Reconciliation   | No work, several units, incompatible units, changed quantities, failure                             | Before/after quantities and affected stock are understandable before committing                                       |
| Recipes          | Long title/description; missing ingredient; available/unavailable; no results; card overflow        | Name and availability scan first; detail and list agree; actions remain accessible                                    |
| Recipe editor    | Many ingredient rows and steps; long options; keyboard reorder; dirty navigation                    | No squeezed selectors; move controls announce order; input survives recoverable errors                                |
| Planner          | Empty/populated week; daily view; many meals/day; cooked/uncooked; unavailable recipe; sync failure | Day and meal hierarchy is clear; status differs from action; dates remain anchored                                    |
| Shopping         | Long names; multiple stores; purchased rows; price editing; failed toggle; sync; zero results       | Touch checking is reliable; price meaning is explicit; failed mutations are visible                                   |
| Restock          | Several reviewed rows; mixed matches; unresolved ingredient; quantity/location/date errors          | User understands new vs existing stock and exactly which rows will be committed                                       |
| Account          | Login failure; password visibility; signup requirements; invalid/mismatched values; busy            | No dead links or unexplained disabled primary actions                                                                 |
| Profile          | Owner/editor/viewer; many kitchens/members/sessions; failed load; destructive operations            | Role-appropriate controls, legible device identity, explicit consequence and recovery                                 |
| Global           | Light/dark; reduced motion; zoom; long translations; keyboard-only; toast stack                     | Focus remains visible; no accidental page overflow; essential messages persist; motion preferences respected          |

### Screenshot naming and annotations

Use names such as `inventory-items__390x844__dark__filtered-before.png` and `inventory-items__390x844__dark__filtered-proposed.png`. Annotate the actual problem region and identify the finding ID. A proposed screenshot must be labeled “prototype” and captured from the prototype; it must not be presented as a shipped fix. A different fixture or viewport cannot prove a before/after improvement.

### Interaction and motion acceptance

- Preserve the background's visual identity. Reduced-motion mode should retain a static version of it and suppress nonessential entry, hover-scale, stagger, and smooth-scroll effects.
- Use motion to explain an object entering, leaving, expanding, or changing state. Avoid persistent pulses for static pagination or totals.
- Prefer one short transition per interaction rather than simultaneous route, panel, and row entrances. Existing ~160–180ms transitions are reasonable candidates to test; they are not evidence of actual frame rate.
- Retain keyboard focus after deletion, pagination, modal dismissal, and reordering. Add keyboard alternatives wherever dragging is supported.
- Distinguish hover, focus, selected, disabled, pending, and failed states. No color-only status or hover-only essential action.
- Measure contrast against the actual rendered surfaces; no WCAG conformance claim is made by this report.

## Verification record and handoff

- Read route configuration, page templates, supporting components/services/styles, repository design documentation, the visual-design-review framework, browser-qa, and the local UI/UX guidance.
- Three subagents performed bounded inventory, planning/shopping, and independent shared-system/account exploration. Findings were integrated into this page-organized report.
- `npm run validate:design-system`: formatting check, ESLint, design-system guardrail, and i18n guardrail passed. The Vitest stage reported native CSS/PostCSS loading failures, zero-test suites, and extensive existing runtime errors, then stopped producing output. The process was interrupted. **Tests did not receive a passing result; the chained build stage did not run.**
- The dev server failed on the missing native CSS module. Playwright failed on sandbox permission. No live UI, screenshot, keyboard, contrast, or motion verification was completed.
- No backend code was changed and backend tests were not run for this documentation-only review. No new UI components, tokens, variants, or page overrides were introduced.
- Existing application changes were preserved. The deliverable is this Markdown review; actual redesign implementation and final visual acceptance remain future work.
