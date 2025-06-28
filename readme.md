# LogosDX Markdown Server

## Getting started

**Prerequisites:**

```bash
# Node 20 is required
nvm install 20
nvm use 20

# PNPM is our package manager
corepack enable
corepack install pnpm
```

**Install:**

```bash

pnpm install
```

**Start developing:**

```bash
pnpm watch
```

## Files

- `src/client`
  - Vite generated CSS and JS files to be run in the browser
  - SCSS files
  - Frontend TypeScript files

- `src/server`
  - Server TypeScript files
  - `index.ts` is the entry point
  - `methods` are where you add universal server methods
  - `routes` are where you add server routes
  - `plugins` are where you add and configure server plugins
  - `helpers` are where you add helper and utility functions

- `src/views`
  - Eta templates, partials, and layouts

- `src/docs`
  - Markdown files to be served as HTML

## Markdown Features

- [Callouts](dev/markdown-showcase.md#callout)
- [Code Sandbox](dev/markdown-showcase.md#codesandbox)
- [TypeScript Sandbox](dev/markdown-showcase.md#typescript-sandbox)
- [YouTube](dev/markdown-showcase.md#youtube)
- [Vimeo](dev/markdown-showcase.md#vimeo)
- [Twitter](dev/markdown-showcase.md#twitter)

### Adding new markdown features

- Add a new plugin in [`src/server/plugins/md-docs/plugins`](src/server/plugins/md-docs/plugins)
- Register the plugin in [`src/server/plugins/md-docs/method.ts`](src/server/plugins/md-docs/method.ts)

## Frontend Architecture

The philosophy is:

- We dogfood LogosDX
- MPA (Multi Page Application)
- No JS framework
- Atomic features
- Organized by domain / feature
- Styles and JS are in separate files but in the same domain directory

### Compiled Assets

- The entrypoint for all the Vite assets is [`src/client/app.ts`](src/client/app.ts)
  - This also has the task of registering all the frontend features
- All the SCSS files are imported in the [`src/client/app.scss`](src/client/app.scss) file
