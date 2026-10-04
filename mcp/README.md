# Thinkube docs MCP server (local build)

Exposes the Thinkube documentation to a Claude session as MCP tools, **reusing
Antora's built Lunr search index** (`build/site/search-index.js`). No RAG
backend, embeddings service, or chat widget.

On a Thinkube cluster, Claude gets the same two tools from thinkube-control's
MCP server (`backend/app/api/docs_search.py` in thinkube-control). That version
reads the index of the deployed docs site. This folder is the local version: it
reads the site you built in this checkout, for work on the docs.

## Tools

- `search_thinkube_docs(query)` — the best-matching pages (title, url, snippet).
- `get_thinkube_doc(page)` — the full text of a page, by `name` (`components`) or
  `url` (`/thinkube-docs/reference/components.html`).

## Working on it

```bash
npm run build              # produces build/site/search-index.js
(cd mcp && npm install)    # install the server's deps (SDK + lunr)
```

To use it from a local Claude session, register `node mcp/server.mjs` (with its
absolute path) as a stdio MCP server in your `.mcp.json`. Then *"search the
thinkube docs for how to fine-tune a model"* → Claude calls
`search_thinkube_docs`, then `get_thinkube_doc`, and answers from the built
documentation.

Set `THINKUBE_DOCS_SITE` to read another built site directory instead of the
local `build/site`.

## Test

```bash
node mcp/test-client.mjs   # spins up the server over stdio and exercises both tools
```
