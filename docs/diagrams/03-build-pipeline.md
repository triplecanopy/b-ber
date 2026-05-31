# Build Pipeline

The ordered task sequence executed for each output format. Steps are run
sequentially; each step receives the shared `State` singleton updated by
prior steps.

## Shared base sequence (all formats)

```mermaid
flowchart LR
    CLEAN["clean\nclear dist/"] --> CONTAINER
    CONTAINER["container\ncreate EPUB dir\nstructure"] --> COVER
    COVER["cover\ngenerate cover\nimage"] --> SASS
    SASS["sass\ncompile SCSS\n→ CSS"] --> COPY
    COPY["copy\nassets + fonts\nto dist/"] --> SCRIPTS
    SCRIPTS["scripts\ncopy JS\nto dist/"] --> RENDER
    RENDER["render\nMarkdown → XHTML\n(markdown-renderer)"] --> LOI
    LOI["loi\nlist of\nillustrations"] --> FOOTNOTES
    FOOTNOTES["footnotes\ncollect + write\nnotes.xhtml"] --> INJECT
    INJECT["inject\npatch xhtml\n(nav, ncx refs)"] --> OPF
    OPF["opf\nwrite OPF manifest\n+ NCX spine\n(b-ber-templates)"] --> FMT
    FMT["format\ntask ↓"]
```

## Format-specific tail tasks

```mermaid
flowchart TD
    OPF["opf (shared base ends here)"]

    OPF --> EPUB["epub\nzip dist/ → .epub\n(epub-zipper)"]
    OPF --> MOBI["mobiCSS\npatch CSS\nfor Kindle\n↓\nmobi\nrun Calibre ebook-convert"]
    OPF --> PDF["pdf\nrun wkhtmltopdf\n→ .pdf"]
    OPF --> WEB["web\ncopy + patch\nfor static site"]
    OPF --> XMLF["xml\nInDesign XML\nexport"]
    OPF --> READER["reader\nbuild legacy\nb-ber-reader bundle"]
    OPF --> SAMPLE["sample\nslice of epub\nfor preview"]
```

## State flow through the render step

```mermaid
flowchart TD
    subgraph RENDER["render step"]
        FILES["glob .md files\nfrom _project/"]
        FILES --> |"one file at a time"| MDR

        subgraph MDR["b-ber-markdown-renderer"]
            MDIT["markdown-it instance\n+ registered plugins"]
            MDIT --> GRAM["grammar-* plugins\nparse custom directives\n::: section:ch-01\n::: exit:ch-01"]
            MDIT --> PARS["parser-* plugins\nfootnote markers\nfigure refs\nsection boundaries"]
            GRAM & PARS --> XHTML["rendered XHTML string"]
        end

        XHTML --> WRITE["write .xhtml\nto dist/OPS/"]
        WRITE --> STATE["update State.spine\n(chapter order)"]
    end

    STATE --> LOI_STEP["loi step\nbuilds figure list\nfrom State.loi"]
    STATE --> FN_STEP["footnotes step\nwrites notes.xhtml\nfrom State.footnotes"]
    STATE --> OPF_STEP["opf step\nreads State.spine\nto build manifest"]
```

## External tool dependencies

| Step | External dependency          | Required for    |
| ---- | ---------------------------- | --------------- |
| mobi | Calibre `ebook-convert`      | Mobi/KF8 output |
| pdf  | `wkhtmltopdf`                | PDF output      |
| sass | (none — uses `sass` npm pkg) | —               |
| epub | `epub-zipper` npm pkg        | EPUB packaging  |
