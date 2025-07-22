---
title: CodeSandbox Test
description: Testing CodeSandbox plugin
published: true
publishedAt: 2024-01-01
slug: test-codesandbox
---

# Markdown Showcase

Each markdown file is rendered as a page. The frontmatter is used to generate the page metadata and other settings passed onto the Hapi server.

## Frontmatter

**Required frontmatter:**

```yaml
title: CodeSandbox Test
description: Testing CodeSandbox plugin
published: true
publishedAt: 2024-01-01 # Can be future dated
slug: test-codesandbox # Used for the URL, must be unique, will be prefixed with docs/
```

**About `slug`:**

- Must be unique
- If initial `/` is not provided, or if it begins with `./`:
  - It will be prefixed with `docs/:folder-name/:slug`
- If initial `/` is provided, it will be an absolute path
- If initial `./` is provided, it will be prefixed with `docs/:folder-name/`

**Valid slugs:**

- `test-codesandbox` => `docs/category/test-codesandbox`
- `./test-codesandbox` => `docs/category/test-codesandbox`
- `/test-codesandbox` => `/test-codesandbox`
- `/sub-path/test-codesandbox` => `/sub-path/test-codesandbox`

**Optional frontmatter:**


```yaml
image: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png
author: John Doe
excerpt: This is a test of the Callout plugin.

tags: # Tags to categorize the page
  - test
  - callout

sort: 1 # Sort order in the sidebar
layout: main # Eta layout to use

cache: false # Disable cache
cache: # Hapi route cache options
  expiresIn: 60
  expiresAt: 2024-01-01
  privacy: public
  statuses:
    - 200
    - 301
  otherwise: 404

httpHeaders: # Hapi route http headers
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff

meta: # SEO and meta tags
  fbTitle: CodeSandbox Test
  fbDescription: Testing CodeSandbox plugin
  fbImage: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png
  fbType: article
  fbLocale: en_US
  fbSiteName: LogosDX
  twTitle: CodeSandbox Test
  twDescription: Testing CodeSandbox plugin
  twImage: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png
  twAuthor: John Doe
  twCard: summary
  twSite: logosdx.com
  twCreator: @logosdx
  keywords:
    - test
    - callout
  canonical: https://logosdx.com/test-codesandbox
  robots: index, follow
  structuredData:
    - type: Article
      title: CodeSandbox Test

redirect: # If you want to redirect the page
  to: /test-codesandbox
  permanent: true
```

## Callouts

<callout>

# Callout

This is a test of the Callout plugin. [a link](https://www.google.com)

</callout>

<callout info>

This is a test of the Callout plugin. [a link](https://www.google.com)

</callout>

<callout success>

This is a test of the Callout plugin. [a link](https://www.google.com)

</callout>

<callout warning>

This is a test of the Callout plugin. [a link](https://www.google.com)

</callout>

<callout error>

This is a test of the Callout plugin. [a link](https://www.google.com)

</callout>

---

## Code Sandbox

[codesandbox code-sandbox-examples-f54m2]

---

## TypeScript Sandbox

[typescript-sandbox PTAEHUFMBsGMHsC2lQBd5oBYoCoE8AHSAZVgCcBLA1UABWgEM8BzM+AVwDsATAGiwoBnUENANQAd0gAjQRVSQAUCEmYKsTKGYUAbpGF4OY0BoadYKdJMoL+gzAzIoz3UNEiPOofEVKVqAHSKymAAmkYI7NCuqGqcANag8ABmIjQUXrFOKBJMggBcISGgoAC0oACCbvCwDKgU8JkY7p7ehCTkVDQS2E6gnPCxGcwmZqDSTgzxxWWVoASMFmgYkAAeRJTInN3ymj4d-jSCeNsMq-wuoPaOltigAKoASgAywhK7SbGQZIIz5VWCFzSeCrZagNYbChbHaxUDcCjJZLfSDbExIAgUdxkUBIursJzCFJtXydajBBCcQQ0MwAUVWDEQC0gADVHBQGNJ3KAALygABEAAkYNAMOB4GRonzFBTBPB3AERcwABS0+mM9ysygc9wASmCKhwzQ8ZC8iHFzmB7BoXzcZmY7AYzEg-Fg0HUiQ58D0Ii8fLpDKZgj5SWxfPADlQAHJhAA5SASPlBFQAeS+ZHegmdWkgR1QjgUrmkeFATjNOmGWH0KAQiGhwkuNok4uiIgMHGxCyYrA4PCCJSAA]

---

## YouTube

[youtube dQw4w9WgXcQ 1024 576]

---

[youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ 1024 576]

---

[youtube https://youtu.be/dQw4w9WgXcQ?si=U7nmSEf_cS9DbC1u 1024 576]

---

## Vimeo

[vimeo 410053233 1024 576]

---

[vimeo https://vimeo.com/410053233?p=0s 1024 576]

---

## Twitter

[twitter 1576415168426573825]

---

[twitter https://x.com/i/status/1576415168426573825]
