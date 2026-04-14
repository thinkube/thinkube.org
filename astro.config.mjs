// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://thinkube.org',
	base: '/thinkube.org/',
	integrations: [
		starlight({
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
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'intro' },
						{ label: 'ZeroTier Setup', slug: 'installation/zerotier-token' },
						{ label: 'Cloudflare Token', slug: 'installation/cloudflare-token' },
						{ label: 'GitHub Token', slug: 'installation/github-token' },
						{ label: 'Hugging Face Token', slug: 'installation/huggingface-token' },
						{ label: 'Node Setup', slug: 'installation/node-setup' },
						{ label: 'Running the Installer', slug: 'installation/overview' },
					],
				},
				{
					label: 'Learn',
					items: [
						{ label: 'Overview', slug: 'learn/overview' },
						{ label: 'Web Applications', slug: 'learn/web-apps' },
						{ label: 'AI & Machine Learning', slug: 'learn/ai-ml' },
						{ label: 'GitOps & Automation', slug: 'learn/devops' },
					],
				},
				{
					label: 'Thinkube Control',
					items: [
						{ label: 'Overview', slug: 'thinkube-control' },
						{ label: 'Dashboard', slug: 'thinkube-control/dashboard' },
						{ label: 'Templates', slug: 'thinkube-control/templates' },
						{ label: 'Container Registry', slug: 'thinkube-control/registry' },
						{ label: 'AI Models', slug: 'thinkube-control/models' },
						{ label: 'Optional Components', slug: 'thinkube-control/components' },
					],
				},
				{
					label: 'Template Development',
					items: [
						{ label: 'Creating Templates', slug: 'thinkube-control/creating-templates' },
						{ label: 'Manifest Spec', slug: 'thinkube-control/spec-manifest' },
						{ label: 'Environment Variables', slug: 'thinkube-control/spec-variables' },
						{ label: 'thinkube.yaml Spec', slug: 'thinkube-control/spec-thinkube-yaml' },
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