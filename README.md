# Thinkube.org

> **Warning**: This project is under active development and not yet ready for production use.

---

Official documentation website for the Thinkube platform, built with Astro and Starlight.

## Overview

This repository contains the source for [thinkube.org](https://thinkube.org), providing:
- Getting started guides
- Platform documentation
- Tutorials and examples
- Architecture documentation

## Development

### Prerequisites

- Node.js 18+

### Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/          # Images, logos, static assets
├── content/
│   └── docs/        # Documentation content (Markdown/MDX)
│       ├── index.mdx
│       ├── installation/
│       ├── learn/
│       ├── components/
│       └── architecture/
├── styles/          # Custom CSS
└── content.config.ts
```

## Built With

- [Astro](https://astro.build/) - Static site generator
- [Starlight](https://starlight.astro.build/) - Documentation theme

## Contributing

For now, contributions are limited to reporting issues and feedback. Code contributions via pull requests are planned for a future version.

- **Issues & Feedback**: https://github.com/thinkube/thinkube/issues

## License

Apache License 2.0 - See [LICENSE](LICENSE)

## Copyright

Copyright 2025 Alejandro Martínez Corriá
