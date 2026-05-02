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
				{ label: 'Build', slug: 'learn/overview' },
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