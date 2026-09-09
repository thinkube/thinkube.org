// Captures the platform's screens for the documentation.
//
//   node tools/capture.mjs <out-dir> [name ...]
//
// Runs in Thinkube IDE, where Playwright's Chromium is installed. It signs in
// to Thinkube Identity as the user named in ~/.env (ANSIBLE_BECOME_PASSWORD is
// that user's password; the username defaults to `thinkube`), then opens
// each target and writes <out-dir>/<name>.png at 1600x1000 CSS pixels with a
// 2x device scale factor, so every capture is 3200x2000. With no names every
// target is captured. The domain comes from DOMAIN_NAME in ~/.env.
//
// Targets that sit behind a second sign-in button (Thinkube Notebooks,
// Thinkube Registry) press it; the Keycloak session from the first sign-in
// carries them through.
import pw from '/home/thinkube/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright/index.js';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const { chromium } = pw;

// Thinkube IDE ships Chromium for the Playwright MCP server at this path.
const CHROMIUM = '/usr/bin/chromium-browser';

const env = Object.fromEntries(
  readFileSync(join(homedir(), '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const D = process.env.DOMAIN_NAME || env.DOMAIN_NAME;
const USER = process.env.SYSTEM_USERNAME || env.SYSTEM_USERNAME || 'thinkube';
const PASSWORD = env.ANSIBLE_BECOME_PASSWORD;
if (!D || !PASSWORD) throw new Error('DOMAIN_NAME (shell or ~/.env) and ANSIBLE_BECOME_PASSWORD (~/.env) are required');

const outDir = process.argv[2];
const only = process.argv.slice(3);
if (!outDir) throw new Error('usage: node tools/capture.mjs <out-dir> [name ...]');
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'control-dashboard-all', url: `https://control.${D}/dashboard/all` },
  { name: 'control-llm-gateway', url: `https://control.${D}/llm-gateway` },
  { name: 'control-models', url: `https://control.${D}/models` },
  { name: 'control-templates', url: `https://control.${D}/templates` },
  { name: 'control-optional-components', url: `https://control.${D}/optional-components` },
  { name: 'control-nodes', url: `https://control.${D}/nodes` },
  { name: 'control-harbor-images', url: `https://control.${D}/harbor-images` },
  { name: 'control-jupyter-kernels', url: `https://control.${D}/jupyter-kernels` },
  { name: 'control-jupyterhub-config', url: `https://control.${D}/jupyterhub-config` },
  { name: 'control-secrets', url: `https://control.${D}/secrets` },
  { name: 'control-api-tokens', url: `https://control.${D}/tokens` },
  { name: 'control-knative-services', url: `https://control.${D}/knative-services` },
  { name: 'notebooks-hub', url: `https://notebooks.${D}/hub/home`, press: /Sign in with Keycloak/i },
  { name: 'notebooks-spawn', url: `https://notebooks.${D}/hub/spawn`, press: /Sign in with Keycloak/i },
  { name: 'experiments-home', url: `https://experiments.${D}/` },
  { name: 'ide-home', url: `https://ide.${D}/` },
  { name: 'docs-home', url: `https://docs.${D}/` },
  { name: 'identity-login', url: `https://control.${D}/`, fresh: true, stopAtLogin: true },
];

async function signInIfAsked(page) {
  if (!page.url().includes(`auth.${D}`)) return;
  const user = page.getByLabel('Username or email');
  if (await user.count()) {
    await user.fill(USER);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');
  }
}

const browser = await chromium.launch({
  headless: true,
  ...(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {}),
});
let state = null;

for (const t of targets) {
  if (only.length && !only.includes(t.name)) continue;
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    ...(t.fresh || !state ? {} : { storageState: state }),
  });
  const page = await context.newPage();
  try {
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90000 });
    if (!t.stopAtLogin) {
      await signInIfAsked(page);
      if (t.press) {
        const btn = page.getByRole('button', { name: t.press });
        if (await btn.count()) {
          await btn.first().click();
          await page.waitForLoadState('networkidle');
          await signInIfAsked(page);
        }
      }
      await page.waitForLoadState('networkidle');
      if (!t.fresh) state = await context.storageState();
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(outDir, `${t.name}.png`) });
    console.log(`ok   ${t.name}  ${page.url()}`);
  } catch (e) {
    console.log(`FAIL ${t.name}  ${page.url()}  ${e.message.split('\n')[0]}`);
  }
  await context.close();
}
await browser.close();
