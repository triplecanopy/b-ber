# Architecture Overview

High-level data flow from author source files to output formats and the
browser reader.

```mermaid
flowchart TD
    subgraph INPUT["Author project (_project/)"]
        SRC["Markdown\n(.md files)"]
        YAML["Metadata\n(YAML config)"]
        SCSS["Styles\n(SCSS overrides)"]
    end

    subgraph CLI_LAYER["Entry point"]
        CLI["b-ber-cli\nyargs command router"]
    end

    subgraph BUILD["b-ber-tasks — ordered build pipeline"]
        direction LR
        T_CLEAN["clean"] --> T_INIT["container\ncover\nscripts"]
        T_INIT --> T_STYLE["sass\ncopy"]
        T_STYLE --> T_RENDER["render\nb-ber-markdown-renderer"]
        T_RENDER --> T_POST["loi\nfootnotes\ninject"]
        T_POST --> T_PKG["opf\nb-ber-templates"]
        T_PKG --> T_FMT["format task\nepub · pdf · web · xml · mobi · reader"]
    end

    subgraph MDR["Markdown rendering (inside render step)"]
        MI["markdown-it\nparsing engine"]
        GRAM["grammar-* (14 pkgs)\ncustom directive → HTML/XML"]
        PARS["parser-* (5 pkgs)\nfootnotes · figures · gallery\nsection · dialogue"]
        MI -->|"plugins"| GRAM
        MI -->|"plugins"| PARS
    end

    subgraph FOUNDATION["Shared foundation (used by all layers above)"]
        direction LR
        LIB["b-ber-lib\nutility functions · State singleton"]
        LOG["b-ber-logger"]
        SHAPES["b-ber-shapes-*\ndata contracts for directives,\nDublin Core, build sequences"]
        THEMES["b-ber-theme-*\nbase SCSS (serif · sans)"]
        VAL["b-ber-validator"]
    end

    subgraph OUTPUT["_project/builds/"]
        EPUB["EPUB 3\n(.epub)"]
        MOBI["Mobi / KF8\n(.mobi via Calibre)"]
        PDF["PDF\n(via wkhtmltopdf)"]
        WEB["Static website"]
        XML["InDesign XML"]
        READER_PKG["Reader build\n(legacy b-ber-reader)"]
    end

    subgraph BROWSER["Browser reader"]
        CDN["S3 / CDN\nspine manifest JSON"]
        RREACT["b-ber-reader-react\nReact + Redux\nEPUB viewer"]
        CDN --> RREACT
    end

    SRC & YAML & SCSS --> CLI
    CLI -->|"bber build [format]"| BUILD
    T_RENDER --> MI
    BUILD --> OUTPUT
    EPUB -->|"deployed to"| CDN

    FOUNDATION -.->|"imported by all pipeline packages"| BUILD
    FOUNDATION -.-> MDR
```

## See also

- [Package dependency graph](02-package-dependencies.md) — full internal dep map
- [Build pipeline](03-build-pipeline.md) — step ordering and State flow
- [Markdown rendering layer](04-markdown-rendering-layer.md) — grammar/parser detail
- [Reader React](05-reader-react.md) — browser reader component tree
- [Tooling matrix](06-tooling-matrix.md) — versions and build tooling per package
- [External dependencies](07-external-dependencies.md) — version audit and staleness flags
- [Diagram index](README.md)
