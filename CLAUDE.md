# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Prerequisites:**

- Node 20+ required (`nvm use 20`)
- PNPM package manager (`corepack enable && corepack install pnpm`)
- Install dependencies: `pnpm install`

**Core Development Commands:**

- `pnpm watch` - Start development server with hot reload (primary dev command)
- `pnpm server` - Start server only (`tsx src/server/index.ts`)
- `pnpm client` - Build client assets (`vite build --config src/client/vite.config.ts`)
- `pnpm start` - Start production server

**Watch Mode Interactive Commands:**

- `r` or `restart` - Restart both server and client
- `s` or `server` - Restart server only
- `c` or `client` - Restart client only
- `q` or `quit` - Exit watch mode
- `kill <port>` - Kill process on specific port
- `var KEY=value` - Set environment variables
- `debug` - Toggle debug mode
- `help` - Show help text

## Architecture Overview

**Technology Stack:**

- **Backend**: HapiJS server with TypeScript
- **Frontend**: Multi-page application (MPA) with no JS framework, uses LogosDX utilities
- **Templating**: Eta templates for server-side rendering
- **Styling**: SCSS with semantic HTML-first approach
- **Markdown**: Custom markdown processing with plugins for YouTube, Vimeo, CodeSandbox, etc.

**Project Structure:**

- `src/server/` - HapiJS server code
  - `index.ts` - Main server entry point with Hapi configuration
  - `methods/` - Universal server methods
  - `routes/` - HTTP route handlers
  - `plugins/` - Server plugins and extensions
  - `helpers/` - Utility functions
  - `data/` - Static data (nav, packages, metadata, redirects)
- `src/client/` - Frontend TypeScript and SCSS
  - `app.ts` - Main frontend entry point that registers all features
  - `features/` - Domain-specific frontend functionality (alerts, copy, TOC, etc.)
  - `components/` - Reusable UI components
  - Uses LogosDX DOM utilities for behavior binding
- `src/views/` - Eta templates, partials, and layouts
- `src/docs/` - Markdown content served as HTML
- `scripts/` - Development tooling (watch.ts for hot reload)

**Server Architecture:**

- HapiJS with Joi validation and Catbox memory caching
- Exiting manager for graceful shutdown
- Built-in redirect handling via `data/redirects.json`
- Extension system for request/response processing
- Method registration for server utilities

**Frontend Architecture:**

- MPA with progressive enhancement via TypeScript
- Atomic features organized by domain
- Uses LogosDX behavior system for DOM binding
- SCSS entry point: `src/client/app.scss`
- No build step required for development (handled by watch script)

**Markdown System:**

- Custom markdown-it configuration with plugins
- Supports YouTube, Vimeo, CodeSandbox, TypeScript Sandbox embeds
- Front matter processing for metadata
- Table of contents generation
- Code syntax highlighting with highlight.js
- Custom callout syntax and task lists

**Development Workflow:**

- Watch script monitors file changes and hot reloads appropriate services
- Server changes restart server process
- Client changes rebuild assets and reload browser
- Doc/view changes restart server
- Browser connects via WebSocket for live reload

## Code Conventions

**Frontend (SCSS/HTML/JS):**

- Semantic HTML first, classes only when necessary
- Element selectors preferred over class selectors
- Simple global class names (`.card`, `.alert`, `.nav`)
- SCSS variables for design tokens, shallow nesting (2-3 levels max)
- JavaScript uses attribute selectors for DOM binding (`[copy]`, `[toggle]`)
- No BEM, utility classes, or CSS custom properties

**TypeScript:**

- Strict TypeScript configuration with `noEmit: true`
- ES modules with `.ts` extensions in imports
- Server uses HapiJS type extensions for app state

**File Organization:**

- Features grouped by domain, not by file type
- Each feature can have both `.ts` and `.scss` files in same directory
- Styles imported centrally in `app.scss`
- Behaviors registered centrally in `app.ts`

## Leverage `@logosdx` utilities in the project as much as possible

- Observer engine class for event-driven architecture @.claude/logosdx/observer.md
- Fetch engine class for a mature FetchAPI wrapper @.claude/logosdx/fetch.md
- Utility functions for flow-control, data structures, and runtime validation @.claude/logosdx/utils.md
- DOM utilities @.claude/logosdx/dom.md
