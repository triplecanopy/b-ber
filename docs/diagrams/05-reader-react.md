# b-ber-reader-react Architecture

The browser-based EPUB viewer. Reads a spine manifest from S3/CDN and
renders chapter XHTML files as a paginated single-page application.

## Data flow

```mermaid
flowchart TD
    subgraph BUILD["Build output (from b-ber-tasks)"]
        EPUB_ASSETS["EPUB assets\nXHTML · CSS · images · fonts"]
        MANIFEST["spine manifest\n(JSON — chapter list + metadata)"]
    end

    subgraph HOSTING["Hosting"]
        S3["S3 / CDN\npublic static hosting"]
        EPUB_ASSETS & MANIFEST --> S3
    end

    subgraph READER["b-ber-reader-react (browser)"]
        direction TB

        BOOT["bootstrap\nfetch manifest JSON\nfrom S3"]

        subgraph STORE["Redux store"]
            S_SPINE["spine\n(chapter list, current position)"]
            S_UI["ui\n(layout, sidebar, controls)"]
            S_BOOK["book metadata\n(title, author, cover)"]
        end

        subgraph COMPONENTS["React component tree"]
            APP["<App>"]
            LAYOUT["<Layout>\n#layout container"]
            NAV["<Navigation>\nchapter TOC · prev/next"]
            VIEWER["<Viewer>\nchapter XHTML iframe / div"]
            LEAVES["<Leaves>\npagination markers\n(leaf elements)"]
            CONTROLS["<Controls>\nfont size · theme · fullscreen"]
        end

        subgraph PAGINATION["Pagination engine"]
            RO["ResizeObserver\ndetects layout changes"]
            MARKERS["leaf element markers\ninjected into chapter XHTML"]
            CALC["column offset\ncalculation"]
            RO --> CALC --> MARKERS
        end

        BOOT --> STORE
        STORE --> COMPONENTS
        VIEWER --> PAGINATION
    end

    S3 -->|"fetch manifest"| BOOT
    S3 -->|"fetch chapter XHTML on navigate"| VIEWER
```

## Component hierarchy

```mermaid
graph TD
    APP["App\nrouting + store provider"]
    APP --> LAYOUT["Layout\n#layout — flex container\nsets viewport dimensions"]
    LAYOUT --> NAV["Navigation\n- TOC sidebar\n- prev/next controls\n- chapter title"]
    LAYOUT --> VIEWER["Viewer\n- renders chapter XHTML\n- handles internal links\n- emits navigate actions"]
    LAYOUT --> LEAVES["Leaves\n- pagination leaf elements\n- positioned via column CSS\n- used to calculate page count"]
    LAYOUT --> CONTROLS["Controls\n- font-size toggle\n- theme toggle\n- fullscreen"]
    VIEWER --> CHAPTER["Chapter XHTML\n(injected as innerHTML\nor iframe srcdoc)"]
```

## Redux action flow (navigation)

```mermaid
sequenceDiagram
    participant U as User
    participant NAV as Navigation
    participant STORE as Redux Store
    participant VIEWER as Viewer
    participant S3 as S3 / CDN

    U->>NAV: click next chapter
    NAV->>STORE: dispatch(navigate(nextIndex))
    STORE->>STORE: update spine.currentSpineItem
    STORE->>VIEWER: re-render (new chapterUrl)
    VIEWER->>S3: fetch chapter XHTML
    S3-->>VIEWER: XHTML content
    VIEWER->>VIEWER: inject XHTML into DOM
    VIEWER->>STORE: dispatch(chapterLoaded)
    STORE->>STORE: update ui.loading = false
```

## Build tooling

| Concern    | Current                       | Planned (TASK-006)            |
| ---------- | ----------------------------- | ----------------------------- |
| Bundler    | webpack 5                     | Vite                          |
| Transpiler | Babel + `@babel/preset-react` | Vite (esbuild under the hood) |
| Dev server | webpack-dev-server            | Vite dev server (HMR)         |
| CSS        | SCSS via sass-loader          | SCSS via vite-plugin-sass     |
| Linting    | ESLint + Prettier             | Biome (TASK-015)              |
