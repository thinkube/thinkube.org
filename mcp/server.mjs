#!/usr/bin/env node
// Thinkube docs MCP server (Context7-style).
// Exposes the Thinkube documentation to a Claude session as MCP tools,
// reusing Antora's built Lunr index. No new RAG/backend/chat widget.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { search, getPage, SITE } from './lib.mjs';

const server = new McpServer({ name: 'thinkube-docs', version: '0.1.0' });

server.registerTool(
  'search_thinkube_docs',
  {
    description:
      'Search the Thinkube documentation. Returns the best-matching pages (title, url, snippet). Use this to find where something is documented before answering.',
    inputSchema: { query: z.string().describe('What to look for in the Thinkube docs') },
  },
  async ({ query }) => {
    const hits = search(query, 8);
    const text = hits.length
      ? hits.map((h) => `### ${h.title}\n${h.url}\n${h.snippet}`).join('\n\n')
      : `No matches for "${query}".`;
    return { content: [{ type: 'text', text }] };
  }
);

server.registerTool(
  'get_thinkube_doc',
  {
    description:
      'Get the full text of a Thinkube documentation page by name or url (e.g. "components" or "/thinkube-docs/components.html"). Use after search to ground an answer.',
    inputSchema: { page: z.string().describe('Page name or url, as returned by search') },
  },
  async ({ page }) => {
    const p = getPage(page);
    const text = p ? `# ${p.title}\n(${p.url})\n\n${p.text}` : `No page found for "${page}".`;
    return { content: [{ type: 'text', text }] };
  }
);

await server.connect(new StdioServerTransport());
console.error(`[thinkube-docs-mcp] ready — docs from ${SITE}`);
