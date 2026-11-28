# TASK-177: Keep per-document directive state in markdown-it env instead of State

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #840 — https://github.com/triplecanopy/b-ber/issues/840
**Scope:** grammar packages, parser packages, b-ber-markdown-renderer

## Description

Plan step 4 of [TASK-161](./TASK-161.md).

The grammar stops importing `State`. Per-document state (figures, footnotes,
diagnostics) lives in markdown-it's `env`, and per-target behaviour comes from
`ctx.target.features` (TASK-164). That is also what lets TASK-168 parse once.

Module-level state that carries from one `render()` call to the next is not
allowed. TASK-160's spike found the footnote `Counter`, which TASK-166 moves
onto the context.

## Subtasks

- [x] No grammar or parser package imports `State` (nor b-ber-markdown-renderer)
- [x] Per-document state in `env`
- [x] No module-level mutable state that outlives a `render()` call
- [x] #735: front matter guide items are validated, in their own commit, with a test that names the issue

## Notes

- Depends on TASK-163, TASK-164 and TASK-175.

## Findings

### 2026-11-28: the env

Every render's env carries b-ber-lib's `DocumentEnv` (`markdown.ts`), two
objects:

- **`env.document`**, what the build tells the grammars, read only: the file
  name and its spine title, the `Target` (render code reads
  `target.features`), the project's images (a path function) and its audio and
  video files, media.yml, `groupFootnotes`, how many figures and footnote
  pages the earlier documents gave (`figuresBefore`, `footnotesBefore`), and
  the book's footnote numbering;
- **`env.result`**, what the document collects, in source order: figures,
  footnotes, guide items, front matter and remote assets.

`renderDocument(document, source)` returns the XHTML with `env.result` and
the diagnostics. `render(fileName, data, env)` stays, and fills in a default
document (the first document of an epub, no media) for whatever the env
leaves out, for tests.

What each grammar read from State, and where it comes from now:

| Read | Was | Now |
| ---- | --- | --- |
| the target's features | `state.target.features` | `env.document.target.features` |
| the file being rendered | `context.fileName`, i.e. `MarkdownRenderer.fileName`, reassigned on every render | `env.document.fileName` |
| an image's path | `state.src.images()` | `env.document.images()` |
| the project's audio and video | `state.audio`, `state.video` | `env.document.audio`, `.video` |
| media.yml and the target's name | `state.media`, `state.build` | `env.document.media`, `.target.name` |
| a figure's `pageOrder` | `state.figures.length` | `figuresBefore` plus the document's figures so far (`nextFigure`) |
| the notes page's title | `state.find('spine.flattened')` | `env.document.title`, which the render task looks up the same way |
| `group_footnotes`, the footnote page | `state.config`, `state.footnotes.length` | `groupFootnotes`, `footnotesBefore` plus the document's notes so far |

And what each wrote: `state.add('figures' | 'footnotes' | 'guide' |
'remoteAssets')` and `state.spine.frontMatter.set(…)` became pushes onto
`env.result`.

**Renders inside a render share the document.** A caption, a gallery item's
caption, a resolved `media` line and the notes page are rendered with
`nestedEnv(env)`: the same `document` and `result`, and none of
markdown-it's own env keys (`footnotes`, the directive rule's `diagnostics`
and `tree`), since a nested render always started with an empty env. So a
caption's footnote still makes a notes entry of its own, as it did, and a
figure inside a resolved `media` line is still collected.

**What had no env to read.** markdown-it calls render rules with the env,
but three callbacks did not get one:

- the grammars' `render` took `(tokens, index)`. They take markdown-it's
  rule arguments now, `(tokens, index, options, env)`, so the old parser
  plugins, which register them as rules directly, still work. Each
  single-line directive's `validate` takes the env as a third argument, and
  the block closes (`section`'s and `pullquote`'s) as well;
- b-ber-parser-footnotes' callback now gets `state.env` from its core rule;
- markdown-it-front-matter calls back with the front matter alone, from
  inside its block rule. Its rule is wrapped, at registration, so that the
  callback is given the env of the parse it is in. The reference is set for
  the rule's call only.

b-ber-lib's `utils.ensurePoster` and `utils.ensureSupportedClassNames` read
State, and only b-ber-grammar-iframe used them. The grammar has its own now,
reading the document; the two in b-ber-lib are left, unused, for whoever
deletes `State` (TASK-173).

`validateOpen` (b-ber-grammar-renderer and -pullquote) still names the file
from a `context` passed to the grammar's `renderer`. Only the old parser
plugins call it, which the build no longer registers, so the renderer passes
no context.

### 2026-11-28: the footnote counter

b-ber-parser-footnotes kept one `Counter` at module scope. Under
`group_footnotes: false` it numbers the notes across the whole book, which
five published books rely on (`i29-malm`, `i29-pires`,
`i28-goldin-senneby-essay`, `i29-jeremy-toussaint-baptiste`,
`the-great-equalizer`), so it cannot be per document.

**It is now one per render task.** b-ber-tasks' `render` makes one with the
renderer's `createFootnoteNumbering()` before its loop and passes it in every
document's input (`env.document.footnotes`). Every footnote render rule reads
it from there. That keeps the numbering book-wide and per target, and nothing
of it outlives the task. TASK-166 moves it onto the build context.

The old counter reset itself at the first footnote page of a build (when
`state.footnotes` was empty), so a fresh counter per render task numbers the
same. The one thing it carried further was the queue of note ids, from one
build's last document into the next target's, when a document defined more
notes than it cited. The differential runs every project's render task for
every target in one process, and no output changed.

### 2026-11-28: b-ber-tasks

Only `src/render/index.ts` changed, plus tests in `__tests__/render.test.js`:

- `documentInput(fileName, footnotes)` builds the document from State, as the
  grammars read it: `state.target`, `state.src.images`, `state.audio`,
  `state.video`, `state.media`, `state.config.group_footnotes`, the spine
  entry's title, `state.figures.length` and `state.footnotes.length`;
- `collect(fileName, rendered)` writes the results back where State held
  them: `state.add('figures')`, `('footnotes')`, `('guide')`,
  `('remoteAssets')`, and the front matter merged into
  `state.spine.frontMatter`;
- `render()` makes the footnote numbering, and `createXTHMLFile` and
  `createPageLayout` pass it down.

No other reader of that data (`loi`, `footnotes`, `opf`, `web`) changed: they
read the same State fields, filled in the same order. When TASK-165 makes the
render task return its results, `collect` is what goes.

**One difference, only after a throw.** A grammar that throws (a missing
image, an id media.yml lacks) used to leave in State what the document had
collected before the throw. `renderDocument` returns nothing then, so those
partial results are not written. The throw stops the build either way, and no
task reads them. The differential's book runs show exactly this: the 140
render tasks that throw, and only those, differ in State's guide, front
matter and footnotes.

### 2026-11-28: #735, front matter guide items

Front matter is unvalidated YAML, and a guide item was made from it whatever
it held. Now:

- front matter with a `type` and no `title` (or an empty one) throws, naming
  the file. The OPF's guide read `title="undefined"`;
- front matter with no `type` makes no guide item. The opf task already
  skipped such items, so the guide is unchanged;
- front matter that is not a mapping (empty, a list, a lone value) gives
  nothing. A string used to be spread into the guide item and the spine entry
  one character per key;
- a title YAML reads as a number (`title: 14.`) is kept, as a string.

**GitLab:** of 2,642 Markdown files, 2,638 have front matter: 2,628 with both
keys, 10 with a title and no type, none with a type and no title. So no book
gains the error, and every OPF `<guide>` is unchanged (checked by rendering
`Guide.items` from each file's guide items). State's guide items change in
41 files: the 10 without a type have none, and in 31 the numeric titles are
strings now.

### 2026-11-28: verification

Each commit was checked with `npm test`, `npm run typecheck`, the golden test
and a differential run.

- **`npm test`:** 172 suites, 1,865 tests after the env commit, 1,870 after
  #735. `typecheck`: 32 projects.
- **Golden** (`npx playwright test --project=cli golden`): 5 passed,
  unchanged, after each commit.
- **The differential** (a scratch harness, not committed) ran twice per
  commit against the commit before:
  - **every Markdown file** of the GitLab projects, each in a fresh build,
    for all seven targets: 17,423 renders, comparing the XHTML (footnote ids
    normalized), each figure page through the figure templates (1,768), the
    footnote entries, the guide items, the front matter merged into the spine
    entry, the remote assets, the error thrown (358) and every warning and
    error logged (7,503). With the new API the harness writes the env's
    results to State as the render task does, after a throw too;
  - **every project's render task**, 263 projects for all seven targets
    (1,841 runs, 16,221 files), with each project's `group_footnotes`, so
    that book-wide numbering and figure order are compared too. 35 of the
    runs number notes across the book.

  The env commit: every file render identical. Every render task identical
  except the 140 that throw, which differ only in what a throwing document
  left in State (above). #735: XHTML identical everywhere; only State's guide
  items, as above.

### 2026-11-28: notes for later

- **A build race.** b-ber-validator's `build` runs `biome check src/` while
  other packages' builds are cleaning their `dist/`. Once, b-ber-lib's
  `index.d.ts` was missing at that moment; Biome then resolved the package
  from the main checkout above the worktree and panicked ("path is expected
  to be under the root"), the validator's build failed, and the packages
  after it were left cleaned. Rebuilding b-ber-lib and building again fixed
  it. It can only happen in a worktree nested inside another checkout.
- b-ber-tasks' `render.test.js` fails its first test when run on its own
  (`Project directory … does not exist`), on the base too: State loads its
  builds before `createProject` points it at the project. It passes in the
  full suite.
