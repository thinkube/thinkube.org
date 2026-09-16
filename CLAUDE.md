# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The documentation site for Thinkube, built with Antora from AsciiDoc. It is one Antora component, `thinkube-docs`, assembled from five repositories:

| Module | Repository | Start path |
|---|---|---|
| ROOT | this repository | `.` |
| `install` | `thinkube/thinkube-installer` | `docs` |
| `control` | `thinkube/thinkube-control` | `docs` |
| `tandem` | `thinkube/thinkube-tandem` | `docs` |
| `webapp-template` | `thinkube/tkt-webapp-react-fastapi` | `template-docs` |

Pages of the other four stay in their own repositories, beside the code they describe. Do not move them here.

## Layout

```
antora-playbook.yml      # the five content sources, the UI bundle, the d2 extension
lib/d2-block.js          # renders [d2] blocks with the local d2 binary during the build
antora.yml               # the component descriptor (name: thinkube-docs)
modules/ROOT/nav.adoc    # the one sidebar; every page of every module is listed here once
modules/ROOT/pages/      # the site's own pages
modules/ROOT/images/     # captures and diagrams
supplemental-ui/         # branding over the default Antora UI; layouts/home.hbs is the home page
tools/capture.mjs        # takes the screen captures (DOMAIN_NAME=<domain> node tools/capture.mjs out/ [names])
Dockerfile               # builds the site and serves it on nginx :8080 inside the cluster
```

## Build

```bash
npx --no-install antora --fetch antora-playbook.yml   # output in build/site
```

Diagrams are `[d2,alt="…"]` literal blocks in the page. `lib/d2-block.js` runs the `d2` binary (v0.9.0, ELK layout) on each one and embeds the SVG, so the build needs `d2` on PATH: the Dockerfile and the Pages workflow install it, and Thinkube IDE's image carries it. A missing binary or a diagram d2 rejects stops the build with d2's own message. The Tandem docs carry the same extension in `docs/lib/d2-block.js`; a change to one is made to both.

The build must print no warnings. `--fetch` pulls the other four repositories from GitHub, so a change in one of them is seen here only after it is pushed. To build from local working trees, write a playbook that points each source at its local path with `branches: HEAD`.

## Tests

```bash
pytest tests/          # needs pytest, pyyaml and jsonschema
```

`tests/test_thinkube_yaml_schema.py` validates every example printed under `== Examples` on `reference/thinkube-yaml.adoc` against the schema attached beside it, `modules/ROOT/attachments/thinkube-yaml-v1.0.schema.json`. A change to the page or the schema that is not made in the other fails there.

## Deploy

The site is deployed inside the cluster as the application `docs` and read by thinkube-control's documentation search. After pushing, redeploy with the MCP tool `redeploy_template` (`template_url: https://github.com/thinkube/thinkube.org`, `template_name: docs`), wait for the build, and check the served pages at `https://docs.<domain>/thinkube-docs/`.

## Writing rules

The rules the pages follow are on the site itself: `contributing/style-guide.adoc` (voice, names, and the shape every page has), `contributing/page-types.adoc` (one type per page, one section order per type), `contributing/documentation-map.adoc` (where a page goes). In short: every page opens with a TL;DR that does the task through Claude Code; every page names the decision it rests on and what it saves the developer; limits are one line each at the end; clarity over coverage; branded names as the services register them; no time figures, no certification claims; and every factual sentence checked against the source file named in the commit message. A process that fails on the reference cluster is not documented; it is fixed first. The plan behind the structure is `thinkube-release/DOCS-PLAN.md`.
