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
tools/sync-icons.sh      # copies the thinkube-style hexagon icons into supplemental-ui/img/icons (tools/sync-icons.sh <thinkube-style checkout>)
tools/capture.mjs        # takes the screen captures (DOMAIN_NAME=<domain> node tools/capture.mjs out/ [names])
Containerfile            # builds the site and serves it on nginx :8080 inside the cluster
```

## Build

The deploys are the build (see Deploy): the Pages workflow and the Containerfile both run `antora --fetch antora-playbook.yml`. The site is not built or served in the IDE (see the CI/CD policy); a change is checked on the deployed pages, or in the build log when the build fails.

Diagrams are `[d2,alt="…"]` literal blocks in the page. `lib/d2-block.js` runs the `d2` binary (v0.9.0, ELK layout) on each one and embeds the SVG; the Containerfile and the Pages workflow install `d2`. A missing binary or a diagram d2 rejects stops the build with d2's own message. The Tandem docs carry the same extension in `docs/lib/d2-block.js`; a change to one is made to both.

The build must print no warnings. `--fetch` pulls the other four repositories from GitHub, so a change in one of them is seen here only after it is pushed.

## Tests

```bash
pytest tests/          # needs pytest, pyyaml and jsonschema
```

Thinkube IDE has no pytest. thinkube-control's backend pod has pytest, pyyaml and jsonschema and mounts the IDE's home, so the tests run there from this checkout:

```bash
POD=$(kubectl get pods -n thinkube-control -o name | grep backend | head -1 | cut -d/ -f2)
kubectl exec -n thinkube-control $POD -- sh -c "cd /home/thinkube/thinkube-platform/docs/thinkube.org && PYTHONDONTWRITEBYTECODE=1 python -m pytest -q -p no:cacheprovider tests/"
```

`tests/test_thinkube_yaml_schema.py` validates every example printed under `== Examples` on `reference/thinkube-yaml.adoc` against the schema attached beside it, `modules/ROOT/attachments/thinkube-yaml-v1.0.schema.json`. A change to the page or the schema that is not made in the other fails there.

## Deploy

Two deploys exist. Neither runs on a push.

- **The public site, https://thinkube.org, is GitHub Pages.** `.github/workflows/pages.yml` builds and publishes it, and runs only by hand (`workflow_dispatch`). After pushing, run it from `main` and wait for the run:

  ```bash
  gh workflow run pages.yml -R thinkube/thinkube.org --ref main
  gh run list -R thinkube/thinkube.org -w pages.yml -L 1
  ```

  Then check the page at `https://thinkube.org/thinkube-docs/`.
- **The cluster application `docs`** is this repository deployed as a template; thinkube-control's documentation search reads it. It exists only on a cluster where someone deployed it: the MCP tool `search_thinkube_docs` answers `docs_not_deployed` where it does not, and `redeploy_template` would then create the application instead of updating it, so it is not the way to publish a change. Where the application exists, a change reaches it by tagging the commit with the next `vMAJOR.MINOR.PATCH`, pushing the tag, and running `redeploy_template` (`template_url: https://github.com/thinkube/thinkube.org`, `template_name: docs`); a deploy builds from the newest tag within the platform's `MAJOR.MINOR`, not from the newest commit.

## Writing rules

The rules the pages follow are on the site itself: `contributing/style-guide.adoc` (voice, names, and the shape every page has), `contributing/page-types.adoc` (one type per page, one section order per type), `contributing/documentation-map.adoc` (where a page goes). In short: every page opens with a TL;DR that does the task through your agent; every page names the decision it rests on and what it saves the developer; limits are one line each at the end; clarity over coverage; branded names as the services register them; a playbook's time is 30 minutes at least, longer when its measured run takes longer, with the measured figures under Time & risk; no certification claims; and every factual sentence checked against the source file named in the commit message. A process that fails on the reference cluster is not documented; it is fixed first. The plan behind the structure is `thinkube-release/DOCS-PLAN.md`.
