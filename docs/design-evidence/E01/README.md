# E01 — Frontend environment repair

Recorded 2026-10-03 against the current uncommitted typography working tree.

- Host: macOS ARM64, Node 26.7.0, npm 11.19.0.
- Reproduction: `cd frontend && npm run build` failed with missing `lightningcss.darwin-arm64.node`. Installed optional native packages were for Linux ARM64.
- The lockfile already contains the correct macOS packages: `lightningcss-darwin-arm64@1.30.2`, `@tailwindcss/oxide-darwin-arm64@4.1.17`, and `sass-embedded-darwin-arm64@1.100.0`.
- Normal repair (`npm install --include=optional --ignore-scripts --no-save --package-lock=false`) failed because registry DNS was unavailable. Offline install also lacked a cached Analog package metadata response. Neither changed the manifests.
- Recovery: read the three exact locked tarball cache entries using the existing `cacache` library, check their integrity against `package-lock.json`, seed a writable temporary cache, retrieve with `npm pack --offline --ignore-scripts`, and extract into their missing directories in ignored `node_modules`. The original user cache was only read. No dependency versions or lockfile entries changed.
- `npm run build` now passes. Existing warnings: optional Angular JavaScript cache native binding unavailable for this Node runtime; Restock Review component stylesheet exceeds its warning budget (5.41 kB against 4 kB). Neither prevents output.
- `npm start -- --host 127.0.0.1` now reaches server binding, then fails with `listen EPERM: operation not permitted 127.0.0.1:4200`. This execution sandbox does not allow the required listening socket. E01 remains blocked on serving verification.

In an ordinary local terminal, use `cd frontend && npm ci --include=optional` to install the lockfile for the host platform, then `npm run build` and `npm start`. Keep platform-specific `node_modules` out of shared installations. Do not loosen sandbox restrictions to run the preview.

No rendered screenshots exist for this task. The build verifies compilation, not visual acceptance.

Follow-up permission re-test: the approved Playwright baseline run successfully loaded all five routes from the local Angular server and launched Chromium (20/20 passing checks). Serving verification is complete; E01 is now Done. Sandbox execution still cannot bind the port, so preview commands require approval for execution outside it.
