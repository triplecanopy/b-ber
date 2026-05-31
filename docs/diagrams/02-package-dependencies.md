# Package Dependency Graph

All internal (`@canopycanopycanopy/*`) dependencies. Arrows point from
dependent to dependency. Packages with no internal deps are leaf nodes.

External dependencies (lodash, markdown-it, fs-extra, etc.) are omitted.

```mermaid
graph LR
    subgraph ENTRY["Entry / orchestration"]
        cli["b-ber-cli"]
        tasks["b-ber-tasks"]
    end

    subgraph RENDERING["Rendering pipeline"]
        mdr["b-ber-markdown-renderer"]
    end

    subgraph GRAMMAR["Grammar packages (directive transformers)"]
        gr-sec["grammar-section"]
        gr-img["grammar-image"]
        gr-gal["grammar-gallery"]
        gr-spr["grammar-spread"]
        gr-dial["grammar-dialogue"]
        gr-av["grammar-audio-video"]
        gr-iframe["grammar-iframe"]
        gr-logo["grammar-logo"]
        gr-vim["grammar-vimeo"]
        gr-pq["grammar-pullquote"]
        gr-fn["grammar-footnotes"]
        gr-fm["grammar-frontmatter"]
        gr-epig["grammar-epigraph"]
        gr-media["grammar-media"]
    end

    subgraph GRAMMAR_PRIM["Grammar primitives"]
        gr-rend["grammar-renderer"]
        gr-attr["grammar-attributes"]
    end

    subgraph PARSERS["Parser packages (content handlers)"]
        p-sec["parser-section"]
        p-fig["parser-figure"]
        p-fn["parser-footnotes"]
        p-gal["parser-gallery"]
        p-dial["parser-dialogue"]
    end

    subgraph CORE["Core library"]
        lib["b-ber-lib"]
        tpl["b-ber-templates"]
        val["b-ber-validator"]
    end

    subgraph FOUNDATION["Foundation (leaf nodes — no internal deps)"]
        log["b-ber-logger"]
        shapes-dir["shapes-directives"]
        shapes-dc["shapes-dublin-core"]
        shapes-seq["shapes-sequences"]
        theme-serif["theme-serif"]
        theme-sans["theme-sans"]
        res["b-ber-resources"]
        reader["b-ber-reader\n(legacy)"]
        reader-react["b-ber-reader-react"]
    end

    %% Entry / orchestration
    cli --> tasks & lib & log & shapes-seq & tpl
    tasks --> lib & log & mdr & reader & res & shapes-seq & tpl & val

    %% Rendering pipeline
    mdr --> gr-sec & gr-img & gr-gal & gr-spr & gr-dial
    mdr --> gr-av & gr-iframe & gr-logo & gr-vim & gr-pq
    mdr --> gr-fn & gr-fm & gr-epig & gr-media
    mdr --> p-fn & p-gal

    %% Grammar primitives
    gr-rend --> lib & log & shapes-dir
    gr-attr --> lib & log & shapes-dir

    %% Grammar packages
    gr-sec --> gr-attr & gr-rend & lib & log & p-sec & shapes-dir
    gr-img --> gr-attr & lib & log & p-fig & shapes-dir & tpl
    gr-gal --> gr-attr & gr-rend & lib & p-gal
    gr-spr --> gr-attr & gr-rend & lib & log & p-gal
    gr-dial --> gr-attr & gr-rend & p-dial
    gr-av --> gr-attr & lib & log & p-fig & shapes-dir
    gr-iframe --> gr-attr & lib & log & p-fig & shapes-dir
    gr-logo --> gr-attr & lib & log & p-fig & shapes-dir
    gr-vim --> gr-attr & lib & log & p-fig & shapes-dir
    gr-pq --> gr-attr & lib & log & p-sec & shapes-dir
    gr-fn --> lib
    gr-fm --> lib
    gr-epig --> log & p-fig
    gr-media --> lib & log & shapes-dir

    %% Parsers
    p-sec --> lib & log & shapes-dir & tpl
    p-fig --> lib & log & shapes-dir & tpl
    p-fn --> lib & log & shapes-dir & tpl
    p-gal --> gr-attr & lib & log & shapes-dir & tpl
    p-dial --> lib & log & shapes-dir & tpl

    %% Core library
    lib --> log & shapes-dc & shapes-seq & theme-serif & theme-sans
    tpl --> lib & log
    val -.->|"no internal deps"| val

    %% Theme
    theme-sans --> theme-serif
```

## Dependency layers (bottom-up)

| Layer                  | Packages                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0 — leaf               | logger, shapes-directives, shapes-dublin-core, shapes-sequences, theme-serif, theme-sans, resources, reader, reader-react, validator |
| 1 — core lib           | b-ber-lib (→ logger, shapes, themes), b-ber-templates (→ lib, logger)                                                                |
| 2 — grammar primitives | grammar-renderer, grammar-attributes (→ lib, logger, shapes-directives)                                                              |
| 3 — parsers            | parser-\* (→ lib, logger, shapes-directives, templates)                                                                              |
| 4 — grammars           | grammar-_ (→ grammar-renderer, grammar-attributes, parser-_, lib, logger, shapes-directives)                                         |
| 5 — rendering          | b-ber-markdown-renderer (→ all grammar-\*, parser-footnotes, parser-gallery)                                                         |
| 6 — pipeline           | b-ber-tasks (→ markdown-renderer, lib, logger, templates, validator, resources, reader, shapes-sequences)                            |
| 7 — entry              | b-ber-cli (→ tasks, lib, logger, templates, shapes-sequences)                                                                        |
