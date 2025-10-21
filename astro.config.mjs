// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://thinkube.org',
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
						{ label: 'Installing Thinkube', slug: 'installation/overview' },
					],
				},
				{
					label: 'Learn',
					items: [
						{ label: 'Overview', slug: 'learn/overview' },
						{ label: 'Web Applications', slug: 'learn/web-apps' },
						{ label: 'AI & Machine Learning', slug: 'learn/ai-ml' },
						{ label: 'DevOps Platform', slug: 'learn/devops' },
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