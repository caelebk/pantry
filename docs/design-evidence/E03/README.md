# E03: repeatable design baseline

**Captured and independently reviewed.** All 20 original checks passed after approval to execute Playwright outside the sandbox. Astra inspected all matching PNGs and manifests; [the review](astra-review.md) records page findings and evidence limits. Live typography/control checks are documented in [T01](../T01/README.md), and the geometry pilot with final screenshots is documented in [S01](../S01/README.md). Additional platform and unshown-state checks remain open.

The initial run passed 18/20; mobile Home checks matched multiple kitchen headings in the shell. Scoping the assertion to the page-title heading fixed the capture script; no application changes were needed. The next run passed 20/20 in 19.2s. All manifests show matching themes, no document horizontal overflow, and no console/network errors. Internal table scrolling and clipped controls still require visual review; document overflow alone does not establish a good mobile layout.

Computer-use tooling still reports incomplete onboarding. Playwright works independently and is the verified capture route.

From `frontend/`, in a local environment that can start Angular and Chromium:

```sh
npx playwright test e2e/design-baseline.spec.ts --workers=1
```

The existing Playwright configuration starts `npm start` or reuses the development server at `http://localhost:4200`. It uses the project's existing Chromium installation. No backend or real account is needed: every `/api/` request is intercepted before navigation. The synthetic refresh/profile fixture authenticates an owner of “Weekend Kitchen”; theme comes from the synthetic user's persisted preference. Unexpected API paths or mutations return an error and fail the check rather than reaching a real kitchen.

| Page             | Route                                               | Loaded state                                                 |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Home             | `/home`                                             | Expired, expiring soon and fresh stock; one available recipe |
| Ingredient Items | `/inventory/items`                                  | Populated default list with a long item name                 |
| Add Item         | `/inventory/items/new?ingredientId=ingredient-rice` | Long ingredient preselected; no submission                   |
| Recipes          | `/recipes`                                          | Populated list with available and unavailable recipes        |
| Shopping         | `/shopping-list`                                    | Checked and unchecked items; long name and store name        |

Each page runs at 1440 × 900 and 390 × 844 in both light and dark themes. Synthetic application time is fixed to `2026-10-03T12:00:00.000Z`, locale is English, and reduced motion is enabled for capture. Full page screenshots may be taller than the viewport. Animated background positions are not a pixel comparison contract.

Each completed capture writes `<page>-<viewport>-<theme>.png` and a JSON manifest in this directory. Manifests record the route, requested and observed theme, viewport, fixture/state, fixed application time, current Git revision, dirty-tree flag, tracked diff hash, source tree hash (including untracked application and fixture files), browser/platform, title typography, horizontal overflow, and console/network observations. They are also written on assertion failure when the browser is available; `capture: null` means no screenshot was successfully recorded. Re-running replaces the corresponding files, so retain accepted evidence before starting another iteration.

The suite asserts loaded fixture content, completion of skeleton loading, correct document theme, and absence of unexpected API calls, browser errors, failed requests and HTTP errors. Google icon font requests remain real asset requests: a failure is reported and fails the run. No network or console failures are silently ignored.

After running, open and inspect every screenshot before updating E03 or T01. Passing capture assertions does **not** establish visual acceptance. Check long labels, title/section/label/metadata/value hierarchy, mobile clipping and both themes. Keyboard/focus behavior, empty/error states, PrimeNG overlays and dialogs, zoom/reflow, screen reader behavior and additional platform coverage remain pending separate browser review.
