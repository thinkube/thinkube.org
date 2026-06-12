# Thinkube docs MCP server (Context7-style)

Exposes the Thinkube documentation to a Claude session as MCP tools, **reusing
Antora's built Lunr search index** (`build/site/search-index.js`). No new RAG
backend, embeddings service, or chat widget — the docs simply become a capability
Claude has, in the cockpit (code-server) where you actually work.

## Tools

- `search_thinkube_docs(query)` — the best-matching pages (title, url, snippet).
- `get_thinkube_doc(page)` — the full text of a page, by `name` (`components`) or
  `url` (`/thinkube-docs/components.html`).

## Setup

```bash
npm run build              # produces build/site/search-index.js
(cd mcp && npm install)    # install the server's deps (SDK + lunr)
```

Then register it in your `.mcp.json` (this auto-loads into your Claude sessions —
add it yourself; an agent can't self-modify its own startup config):

```json
"thinkube-docs": {
  "command": "node",
  "args": ["/home/thinkube/thinkube-platform/docs/thinkube.org/mcp/server.mjs"]
}
```

Optional: set `THINKUBE_DOCS_SITE` to point at a different built site (e.g. a
deployed copy) instead of the local `build/site`.

Now, in any Claude session: *"search the thinkube docs for how to fine-tune a
model"* → Claude calls `search_thinkube_docs`, then `get_thinkube_doc`, and answers
grounded in the actual documentation.

## Test

```bash
node mcp/test-client.mjs   # spins up the server over stdio and exercises both tools
```
