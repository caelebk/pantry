# H01 — Home priorities and next actions

Implemented 2026-10-04 in the current working tree. No commit, deployment, dependency change or database operation.

## Delivered

Home leads with expired and soon-expiring stock, followed by cookable recipes in DOM/mobile order. Desktop pairs attention and recipes; storage is subordinate below them. The header now shows the date without an inventory-count link. Four repeated statistics, the shortcuts panel and the fresh-stock preview no longer repeat the same actions and counts. After user feedback, the plain Needs attention/Review heading was replaced with a single semantic red/amber callout styled like the original notices. It states the expired or soon-expiring count and exposes an explicit review/browse action.

Stock and recipe previews retain outer glass surfaces with simple rows. Expired names wrap without a strike-through. Edit links and remove buttons are always visible, named for their ingredient item, and 42px. Wider stock panels show metadata/actions beside names; narrow panels stack them. Previews stay bounded to four items with a real inventory link for the remainder. Recipe rows are native links with visible focus, retain Q02 metadata honesty and omit fabricated fallback descriptions/readiness percentages.

A failed load shows a persistent retry state instead of empty stock. First-use Home has one clear add-stock action. A healthy populated kitchen with no attention-needed stock has an all-clear state. The review jump focuses its target, visibly outlines it for mouse as well as keyboard users, and respects reduced motion. Home's expiring-soon window is explicitly seven days, matching its explanation; the shared utility previously defaulted to fourteen.

Existing native removal confirmation, success/error toasts and inventory routes remain functional. A shared confirmation workflow belongs to S05. Other Home consumers under legacy Dashboard were not migrated.

## Verification

- Four parent regressions were reproduced before repair: failure vs empty state, canonical navigation, review focus, and the seven-day boundary. Child tests reproduced three failures for native recipe navigation and discoverable stock controls/footer.
- Full design-system gate passed: formatting, ESLint, design and i18n guardrails, 50 files/231 unit tests and production build. Existing optional cache binding and Restock Review stylesheet-budget warnings remain.
- 20 Home browser cases passed: populated at 1440/1280/390/320px in both themes; mobile first-use, load error with retry, all-clear; removal cancellation, failure and successful retry; long names and bounded five-item previews at 390/320px.
- Keyboard Enter opens recipe links and invokes stock removal; review transfers focus. Edit/remove targets measure 42px with subpixel tolerance; no Home content overflow was observed.
- 34 shared geometry/typography/keyboard/icon regression cases passed after the composition changes. Home checks now inspect the retained typography roles and primary-action icon rather than removed statistic/alert elements. Prior S01 evidence is preserved; current regression artifacts are in `geometry/`.
- Populated flows report no page errors or unexpected synthetic API requests. Error/removal cases intentionally return 503 and exercise recovery. Browser data is synthetic; no real inventory was changed.
- `git diff --check` passed.

## Rendered review

Astra's initial pass found the new priority clearer and requested two refinements: compact desktop stock rows, and remove the wrapping summary strip above attention. Both were implemented and recaptured. Astra's follow-up hit a usage limit, so there is **no independent final Astra acceptance** for H01. Codex inspected refreshed desktop/laptop/mobile/narrow, lower-page, long-name, first-use, error and all-clear screenshots directly and closed the implementation/QA slice.

Before evidence: [S01 Home captures](../S01/regression/). Final populated/top and lower captures here preserve the fixed-shell viewport; the application scrolls in an inner container. The root scroll container is reset for top captures. These are responsive emulation, not physical-device or screen-reader verification; contrast ratios and every possible data state were not audited.

## Finding disposition

HOME-01–07 and HOME-09–12 are addressed within the covered Home flows. HOME-08 was handled by Q02. Global navigation/breadcrumbs, shared confirmations, role-aware actions and broader stock correctness remain their own tasks. Final independent Astra review may be resumed when available without blocking the next implementation slice.

## Design-system impact

Native typography, background and colors are preserved. Existing skeleton, empty-state and badge primitives are reused. New strings use Transloco; local container queries and focus outlines shape Home rows without introducing global variants.

User refinement (2026-10-04): removed the inventory-count link and restored callout styling. Rechecked 20 Home browser cases and the full 231-test design-system gate; inspected refreshed desktop and narrow-phone screenshots. Review focus now has a visible outline. Earlier geometry artifacts preserve the pre-refinement H01 composition.
