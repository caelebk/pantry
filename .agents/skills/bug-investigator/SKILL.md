---
name: bug-investigator
description: Debugging & Diagnostics Agent skill for empirical root-cause analysis, log inspection, stack trace debugging, and TDD bug reproduction.
---

# Skill: Bug Investigator Agent

Use this skill when diagnosing runtime errors, unhandled exceptions, unexpected behavior, broken API responses, or failing tests in Pantry.

## Investigation Protocol

### 1. Log & Stack Trace Extraction (Mandatory First Step)
- **Do Not Guess:** Never form diagnostic hypotheses without inspecting actual error tracebacks or runtime logs.
- Fetch un-truncated terminal logs or run `deno task test` / `npm run test` to capture exact stack traces.

### 2. Empirical Root-Cause Analysis
- Trace upstream data flow from the point of failure to the original data source.
- Avoid superficial symptom patches (e.g. wrapping broken calls in silent `try/catch` blocks, returning fake fallback data, or deleting failing assertions).

### 3. TDD Reproduction & Fix
1. **Write Reproduction Test First (Red):** Create a minimal unit or integration test reproducing the exact failure scenario. Confirm the test fails.
2. **Implement Root-Cause Fix (Green):** Resolve the underlying logical flaw or contract mismatch. Confirm the test passes.
3. **Verify Zero Regressions:** Execute the full test suite to guarantee the fix did not break surrounding functionality.

## Investigation Output Format
- **Observed Behavior & Error Trace:** Exact error message and location.
- **Root Cause:** Explanation of why the contract broke.
- **Reproduction Test:** Path to the newly created failing test.
- **Resolution:** Details of the fix and empirical verification results.
