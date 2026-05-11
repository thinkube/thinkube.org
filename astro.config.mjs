// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkD2 from 'remark-d2';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
	site: 'https://thinkube.org',
	base: '/thinkube.org/',
	markdown: {
		remarkPlugins: [[remarkD2, { compilePath: 'public/d2', linkPath: '/d2' }]],
	},
	integrations: [
		starlight({
			plugins: [starlightImageZoom()],
			title: 'Thinkube',
			logo: {
				src: './src/assets/logo.svg',
			},
			head: [
				{
					tag: 'script',
					content: `document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('div');s.id='dgx-stamp';s.textContent='Runs on DGX Spark';document.body.appendChild(s);const v=document.createElementNS('http://www.w3.org/2000/svg','svg');v.setAttribute('width','0');v.setAttribute('height','0');v.style.position='absolute';v.innerHTML='<filter id="rough-edges"><feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/></filter>';document.body.appendChild(v)})`,
				},
			],
			customCss: [
				'./src/styles/custom.css',
				'./src/styles/fonts.css',
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/thinkube/thinkube' },
			],
			sidebar: [
				{
					label: 'Set Up',
					items: [
						{ label: 'Why Thinkube', slug: 'intro' },
						{ label: 'Connect from Anywhere', slug: 'installation/overlay-network' },
						{ label: 'Set Up Your Domain', slug: 'installation/cloudflare-token' },
						{ label: 'Connect to GitHub', slug: 'installation/github-token' },
						{ label: 'Unlock AI Models', slug: 'installation/huggingface-token' },
						{ label: 'Prepare Your Machines', slug: 'installation/node-setup' },
						{ label: 'Install Thinkube', slug: 'installation/overview' },
						{ label: 'Expand Your Cluster', slug: 'installation/adding-nodes' },
					],
				},
				{
					label: 'Build',
					items: [
						{ label: 'Overview', slug: 'learn/overview' },
						{ label: 'tk-llm Python SDK', slug: 'learn/tk-llm' },
					],
				},
				{
					label: 'Control Panel',
					items: [
						{ label: 'Control Panel', slug: 'thinkube-control' },
						{ label: 'Service Dashboard', slug: 'thinkube-control/dashboard' },
						{ label: 'App Templates', slug: 'thinkube-control/templates' },
						{ label: 'Image Registry', slug: 'thinkube-control/registry' },
						{ label: 'AI Model Library', slug: 'thinkube-control/models' },
						{ label: 'Add-Ons', slug: 'thinkube-control/components' },
					],
				},
				{
					label: 'Build Templates',
					items: [
						{ label: 'Create a Template', slug: 'thinkube-control/creating-templates' },
						{ label: 'manifest.yaml Reference', slug: 'thinkube-control/spec-manifest' },
						{ label: 'Environment Variables', slug: 'thinkube-control/spec-variables' },
						{ label: 'thinkube.yaml Reference', slug: 'thinkube-control/spec-thinkube-yaml' },
					],
				},
				{
					label: 'Components',
					autogenerate: { directory: 'components' },
				},
				{
					label: 'Architecture',
					autogenerate: { directory: 'architecture' },
				},
			],
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
			},
		}),
	],
});