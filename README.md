# thinkube.org

The documentation site of the Thinkube platform, built with **Antora** from **AsciiDoc**.

## What it does

- Builds one Antora component, `thinkube-docs`, from five repositories (`antora-playbook.yml`):

  | Module | Repository | Start path |
  |---|---|---|
  | ROOT | this repository | `.` |
  | `install` | `thinkube/thinkube-installer` | `docs` |
  | `control` | `thinkube/thinkube-control` | `docs` |
  | `tandem` | `thinkube/thinkube-tandem` | `docs` |
  | `webapp-template` | `thinkube/tkt-webapp-react-fastapi` | `template-docs` |

- Renders `[d2]` diagram blocks to SVG during the build with the local `d2` binary (`lib/d2-block.js`).
- Fails the build when a page of type `playbook` lacks its card attributes or its Overview / Instructions / Troubleshooting sections (`lib/playbook-check.js`).
- Builds a Lunr search index (`search-index.js`) with the site.
- Serves the built site with nginx on port 8080 (`Containerfile`).

## How it reaches a user

The site is a template. It is deployed from the Templates page of thinkube-control, where it is listed through `repositories.json` of thinkube-metadata. thinkube-control's documentation search reads the site's `search-index.js` from the application named `docs` (`backend/app/api/docs_search.py`), so the site is deployed under that name. The site is not installed on its own. See [thinkube](https://github.com/thinkube/thinkube).

## Deploys

- **Cluster (thinkube template):** the `Containerfile` builds the Antora site and serves it on nginx :8080 at base `/`. This is the primary deploy.
- **GitHub Pages:** `.github/workflows/pages.yml` builds at base `/thinkube.org/` but is **manual-only** (`workflow_dispatch`). The product is not yet announced, so nothing publishes automatically. To publish on every push to `main` at announce time, flip the single documented switch in that workflow: uncomment the `push` trigger.

## Project structure

```
antora-playbook.yml      # Antora playbook (content sources, UI, extensions, output)
antora.yml               # component descriptor (name: thinkube-docs)
lib/d2-block.js          # renders [d2] blocks with the local d2 binary
lib/playbook-check.js    # checks the shape of playbook pages
modules/ROOT/
├── pages/*.adoc         # documentation pages (AsciiDoc)
├── nav.adoc             # navigation
├── attachments/         # files served with the pages, such as the thinkube.yaml schema
├── examples/            # example files the pages include
└── images/              # content images
supplemental-ui/         # Thinkube branding over the default Antora UI
tests/                   # checks of the thinkube.yaml reference page against its schema
tools/capture.mjs        # takes the screen captures
Containerfile            # builds the site and serves it inside the cluster
thinkube.yaml            # how the template is deployed
```

## Built with

- [Antora](https://antora.org/) — multi-repo documentation site generator
- [AsciiDoc](https://asciidoc.org/) — the markup
- [d2](https://d2lang.com/) — the diagrams

## Working on it

### Prerequisites

- Node.js 20+
- `d2` v0.9.0 on `PATH`

### Commands

```bash
# Install dependencies
npm install

# Build the site (output: ./build/site)
npm run build

# Serve the built site locally on http://localhost:4321
npm run serve

# Check the thinkube.yaml examples against the schema (needs pytest, pyyaml and jsonschema)
pytest tests/
```

`--fetch` pulls the other four repositories from GitHub, so a change in one of them is seen here only after it is pushed.

There is no live-reload dev server. To see a change in the cluster, push it and redeploy the `docs` application from thinkube-control.

## License

Apache License 2.0 — see [LICENSE](LICENSE)

## Copyright

Copyright Alejandro Martínez Corriá and the Thinkube contributors
