// Smoke test: spin up the docs MCP server over stdio and exercise it like a real client.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({ command: 'node', args: [join(__dirname, 'server.mjs')] });
const client = new Client({ name: 'test', version: '0.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('tools:', tools.tools.map((t) => t.name).join(', '));

const s = await client.callTool({ name: 'search_thinkube_docs', arguments: { query: 'how do I fine-tune a model' } });
console.log('\nsearch_thinkube_docs("how do I fine-tune a model"):\n' + s.content[0].text.split('\n').slice(0, 6).join('\n'));

const g = await client.callTool({ name: 'get_thinkube_doc', arguments: { page: 'components' } });
console.log('\nget_thinkube_doc("components") — first line:\n' + g.content[0].text.split('\n')[0]);

await client.close();
console.log('\nMCP round-trip OK ✔');
