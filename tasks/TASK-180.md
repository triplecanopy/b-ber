# TASK-180: Declare config.yml in one schema and resolve it into typed config

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #844 — https://github.com/triplecanopy/b-ber/issues/844
**Scope:** b-ber-lib, b-ber-cli, b-ber-tasks

## Description

From [TASK-162](./TASK-162.md): "one schema that produces the TypeScript type, the defaults,
validation with clear messages, and the CLI flags".

Today config is declared in four places that disagree: `Config.ts`'s interface
and defaults, `Yaml.ts`'s schema (which is never applied to `config.yml`), and
the CLI's `withConfigOptions` and `blacklistedConfigOptions`. Some keys the code
reads are declared nowhere. After this, one schema declares the decided key set:

```yaml
src: _project
dist: project            # becomes dist with TASK-169's output layout
theme: b-ber-theme-serif
url: /
noindex: false
navigation: toc.yml
footnotes: { numbering: document }
reader: { layout: columns, downloads: [], controls: { … } }
pdf: { calibre: { … } }
deploy: { bucket: s3://… }
```

Keys are **shared** (top level, or any `<target>:` section), **target-only**
(`reader.*`, `pdf.calibre`) or the one non-target group, `deploy:`. Every
read goes through the resolved, typed config that TASK-163's layering
produces, under the new names.

## Subtasks

- [ ] The schema, and the TypeScript type, defaults and CLI flags generated from it; delete the other three declarations
- [ ] Validation with messages: unknown key (the GitLab projects have `baseurl` and `web_url`), wrong type, a target-only key at the top level or in the wrong section (naming where it belongs)
- [ ] Merge layers without lodash `defaultsDeep`, which merges arrays by index and pads a short list with the defaults (audit bug 3)
- [ ] Read options inside the task, not at import, so every layer reaches them (bug 4)
- [ ] Declare `--no-compile`, which warns "Invalid configuration option [compile]" on every use today (bug 9)
- [ ] Consumers read the renamed keys: `noindex`, which stops writing a robots meta into EPUB pages (bug 8, an output change); `reader.layout`/`downloads`/`controls`, mapped back to reader-react's `uiOptions` prop; `pdf.calibre`, with the whitelist re-keyed; `deploy.bucket`; `footnotes.numbering`
- [ ] `--summary` prints the resolved config

## Notes

- Key set and per-key reasons: [TASK-162](./TASK-162.md), "Proposed key set" (decided 2026-11-25).
- Depends on TASK-163 (`loadProject` and the layering). Ships in the same
  release as TASK-181, so existing projects keep working.
- Audit bugs 1 and 7 are fixed elsewhere: TASK-163 (flags applied too late)
  and TASK-169 (`deploy` ignores `dist`).
