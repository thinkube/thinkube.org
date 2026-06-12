// Core docs-query logic — reuses Antora's built Lunr search-index.js.
// Kept separate from the MCP transport so it is directly testable.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lunr from 'lunr';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Where the built site lives (search-index.js). Override to point at a deploy.
export const SITE = process.env.THINKUBE_DOCS_SITE || join(__dirname, '..', 'build', 'site');

let cache;
export function load() {
  if (cache) return cache;
  const src = readFileSync(join(SITE, 'search-index.js'), 'utf8');
  let data;
  const antoraSearch = { initSearch: (_lunr, d) => { data = d; } };
  // the file body is: antoraSearch.initSearch(lunr, {...})
  new Function('lunr', 'antoraSearch', src)(lunr, antoraSearch);
  cache = { index: lunr.Index.load(data.index), store: data.store };
  return cache;
}

const snippet = (t, n = 240) => (t && t.length > n ? t.slice(0, n).trimEnd() + '…' : (t || ''));

export function search(query, limit = 8) {
  const { index, store } = load();
  let hits;
  try {
    hits = index.search(query);
  } catch {
    // fall back to a lenient wildcard query for free-text questions
    hits = index.query((q) => {
      for (const term of String(query).toLowerCase().split(/\W+/)) {
        if (term) q.term(term, { wildcard: lunr.Query.wildcard.TRAILING });
      }
    });
  }
  const docs = store.documents || {};
  const results = [];
  for (const h of hits) {
    const d = docs[h.ref]; // skip section-level refs that aren't whole pages
    if (!d) continue;
    results.push({ title: d.title, url: d.url, name: d.name, snippet: snippet(d.text) });
    if (results.length >= limit) break;
  }
  return results;
}

export function getPage(page) {
  const { store } = load();
  const docs = store.documents || {};
  const key = String(page).replace(/^\//, '').replace(/\.html$/, '');
  const entry = Object.values(docs).find(
    (d) => d && (d.name === page || d.url === page || d.name === key || (d.url && d.url.includes(key)))
  );
  return entry ? { title: entry.title, url: entry.url, name: entry.name, text: entry.text } : null;
}
