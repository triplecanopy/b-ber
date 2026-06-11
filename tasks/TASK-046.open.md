# TASK-046: Refactor b-ber-logger

**Status:** not started
**Feature:** Node.js modernization
**Scope:** b-ber-logger
**Priority:** medium
**GitHub Issue:** #514 — https://github.com/triplecanopy/b-ber/issues/514

## Description

`b-ber-logger` has two problems: the implementation is structurally awkward,
and the output format is inconsistent. Both need to be addressed together
since the refactor will touch every method.

### Implementation problems

**Bind-everything-in-constructor pattern.** Every method on the `Logger` class
is implemented as a standalone function in its own file, then imported and
bound to `this` in the constructor:

```ts
this.warn = warn.bind(this)
this.error = error.bind(this)
// ... ~30 more
```

This was a pre-class mixin pattern from ES5. In TypeScript it produces
`this: any` on every function (since there is no class context at definition
time), which eliminates all type safety and makes refactoring dangerous.
The 21 separate files for 808 lines of code create navigation friction with
no benefit — the files are too small to justify the split.

**`process.exit(1)` inside `log.error`.** The logger calls `process.exit`
when an error is logged. This makes it impossible to test error paths without
mocking `process.exit`, forces all callers to treat logging as a terminal
operation, and means any future caller that wants to handle errors (rather
than terminate) cannot use `log.error` at all.

**`process.argv` parsing in the constructor.** The logger reads and parses
`process.argv` at instantiation time to configure its log level and output
options. A logger should not know about CLI flags; that is the CLI's
responsibility. The logger should accept a config object.

**EventEmitter inheritance via Timer.** The `Logger` extends `Timer`, which
presumably extends `EventEmitter`. The `begin`/`end`/`done` event listeners
wired in `listeners.ts` are how the logger tracks build task progress. This
is not wrong per se, but the inheritance chain is opaque — it is not obvious
from reading `index.ts` that `Logger` is an EventEmitter.

### Output format problems

The current output mixes several visual styles:

- Some messages use the `b-ber ERR!` prefix (styled with chalk)
- Some use `b-ber info` prefix
- Indentation level is mutated via `incrementIndent` / `decrementIndent`
  side effects triggered by `begin`/`end` events
- The `notice` level, `warn` level, and `info` level are visually similar
- Error output is immediately followed by `process.exit`, so there is no
  post-error summary

The desired output is: clean, consistent prefix per level, readable without
colour (since some CI environments strip ANSI), and distinct enough that
`warn` vs `error` vs `notice` are immediately recognisable at a glance.

### Proposed refactor

1. **Consolidate into a single class file** (or at most two: `Logger.ts` and
   `Timer.ts`). Each log method becomes a proper class method — no external
   functions, no binding.

2. **Replace `process.exit` with an event or thrown error.** `log.error`
   should emit an `'error'` event (or re-throw) and let the caller decide
   what to do. `b-ber-cli` (the only top-level caller) can listen for the
   event and call `process.exit` there.

3. **Remove `process.argv` parsing from the constructor.** Accept a config
   object: `new Logger({ logLevel: 2, boringOutput: false })`. `b-ber-cli`
   is responsible for reading CLI flags and passing them to the logger.

4. **Improve the output format.** Define consistent level prefixes. Ensure
   the output is legible in no-colour mode. Consider whether `notice` and
   `info` can be collapsed into a single level.

5. **Keep the EventEmitter interface.** The `begin`/`end`/`done` event
   system is load-bearing for task progress tracking — do not remove it.
   Clarify the inheritance (`Logger extends EventEmitter` rather than via
   Timer if Timer only adds timing utils).

### Migration note

Every package that calls `log.error` and expects the process to exit will
need to handle the new error event. There are not many call sites — audit
before starting. The change to `configure()` (removing argv parsing) will
require `b-ber-cli` to pass settings explicitly.

## Subtasks

- [ ] Audit all `log.error` call sites across the monorepo; count how many
      rely on `process.exit` being called implicitly
- [ ] Audit all `log.configure` / `log.settings` usage; understand what
      CLI flags currently reach the logger via argv
- [ ] Rewrite `Logger` as a proper class with methods (no bind pattern)
- [ ] Remove `process.argv` parsing; accept config object in constructor
- [ ] Replace `process.exit` in `log.error` with event emission; update
      `b-ber-cli` to call `process.exit` on the error event
- [ ] Consolidate the 21 source files into `Logger.ts` + `Timer.ts`
- [ ] Improve output format: consistent level prefixes, no-colour legibility
- [ ] Update `b-ber-logger` tests to cover the new interface
- [ ] Run the test suite of every package that imports `b-ber-logger` to
      catch breakage (per the test propagation rule in AGENTS.md)

## Notes

Branch: dedicated feature branch off `feat/upgrades` (e.g. `feat/logger-refactor`).

The refactor does not need to change the external API (`log.warn(msg)`,
`log.error(msg)`, etc.) — only the implementation and the `process.exit`
side effect. Callers should not need to update their `log.*` call sites,
only the error-handling setup in `b-ber-cli`.

Do not use an external logging library (winston, pino, etc.) — the custom
format and EventEmitter integration are intentional design choices that
would be lost in a library wrapper.

Related: [[TASK-011]] (original logger TS conversion — the bind pattern is inherited from that work)
