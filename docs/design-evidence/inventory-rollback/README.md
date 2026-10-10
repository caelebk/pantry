# Inventory rollback

At the user's request, Ingredient, Ingredient Item and Ingredient Group pages and their add/edit forms were restored from the original branch code (`HEAD`, `cd6074a`). Nested inventory components, category view and unit reconciliation were also restored so these flows use their original composition and behavior. Inventory Overview and unrelated app changes were preserved. Backend safeguards and the independent date-only parsing fix remain.

46 original source/test files were restored. 21 cleanup-only files, including five redesign browser suites, were archived under `/tmp/pantry-ingredient-design-rollback`; `manifest.json` lists them. Cleanup-only inventory CSS, follow-up form/control surface changes, gallery example and translation namespaces were removed/restored. Earlier design evidence remains historical.

The full frontend design-system gate passed: formatting, lint, design/i18n checks, 267 unit tests across 53 files and production build. Four browser cases passed, covering 24 page/theme/width captures. Browser verification uses synthetic API data for the three collection pages and their create forms at 1440px and 390px in both themes. Screenshots are named by page, width and theme. This verifies restoration and loading; it does not claim the original design has been improved or that its prior layout limitations are fixed.
