# Thinkube.org

> **Warning**: under active development; not yet ready for production use.

---

Official documentation site for the Thinkube platform, built with **Antora** and
**AsciiDoc**.

## Develop

### Prerequisites

- Node.js 20+

### Commands

```bash
# Install dependencies
npm install

# Build the site (output: ./build/site)
npm run build

# Serve the built site locally on http://localhost:4321
npm run serve
```

There is no live-reload dev server: the fast authoring loop is the deploy itself
— push the branch and the thinkube template rebuilds the docs in ~90s.

## Project structure

```
antora-playbook.yml      # Antora playbook (content, UI, output, base path)
antora.yml               # component descriptor
modules/ROOT/
├── pages/*.adoc         # documentation pages (AsciiDoc)
├── nav.adoc             # navigation
└── images/              # content images
supplemental-ui/         # Thinkube branding over the default Antora UI
```

## Deploys

- **Cluster (thinkube template):** the `Dockerfile` builds the Antora site and
  serves it on nginx :8080 at base `/`. This is the primary deploy.
- **GitHub Pages:** `.github/workflows/pages.yml` builds at base `/thinkube.org/`
  but is **manual-only** (`workflow_dispatch`) — the product is not yet announced,
  so nothing publishes automatically. To enable auto-publish at announce time,
  flip the single documented switch in that workflow (uncomment the `push`
  trigger).

## Built with

- [Antora](https://antora.org/) — multi-repo documentation site generator
- [AsciiDoc](https://asciidoc.org/) — the markup

## License

Apache License 2.0 — see [LICENSE](LICENSE)

## Copyright

Copyright 2025 Alejandro Martínez Corriá
