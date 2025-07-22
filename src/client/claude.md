---
description: Frontend Development Rules (SCSS, HTML, JS)
globs: src/client/**/*,src/views/**/*
alwaysApply: false
---
# Frontend Development Rules (SCSS)

## CSS Philosophy

- ✅ Prefer semantic HTML elements over classes
- ✅ Use element selectors and natural HTML hierarchy
- ✅ Add classes only when necessary
- ✅ Use simple, descriptive global names: `.card`, `.alert`, `.nav`
- ✅ State modifiers: `.alert.success`, `.button.primary`
- ❌ NEVER use BEM or utility classes

## SCSS Rules

- ✅ Use SCSS variables for design tokens
- ✅ Group variables by purpose
- ✅ Semantic variable names: `$color-primary`, `$space-md`
- ✅ Nest only 2-3 levels deep; use `&` for modifiers and states
- ✅ Create mixins for repeated patterns and responsive breakpoints
- ✅ Prefer single quotes

## HTML Rules

- ✅ Use semantic HTML elements: `<article>`, `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`
- ✅ Use proper heading hierarchy: `<h1>` through `<h6>`
- ✅ Include alt text for images: `<img alt="description">`
- ✅ Use descriptive link text: `<a href="/about">About Us</a>`
- ✅ Use form labels: `<label for="email">Email</label>`
- ✅ Use appropriate input types: `<input type="email">`, `<input type="tel">`
- ✅ Use ARIA attributes when needed: `aria-label`, `aria-describedby`
- ✅ Prefer attribute selectors over classes: `[copy]`, `[toggle]`, `[tooltip]`
- ✅ Prefer single quotes for attributes

## SCSS Hierarchy

Entry point: `src/client/styles/app.scss`

- `src/client/styles/utils`
- `src/client/styles/features`
- `src/client/styles/components`
- `src/client/styles/pages`

## Selector Hierarchy

1. ✅ Element selectors: `article`, `nav`, `main`, `section`
2. ✅ Element with ID: `nav#main`, `aside#sidebar`
3. ✅ Element with class: `div.card`, `button.primary`
4. ✅ Simple global classes: `.card`, `.alert`, `.grid`
5. ✅ Combined states: `.alert.success`, `.button.disabled`

## Forbidden Patterns

- ❌ BEM notation
- ❌ Utility frameworks
- ❌ Overly specific: `.homepage-hero-section-title`
- ❌ Deep nesting (>3 levels)
- ❌ CSS custom properties

## JavaScript & DOM

- ✅ JavaScript augments existing HTML
- ✅ Use semantic HTML that works without JavaScript
- ✅ Use simple attribute names: `[copy]`, `[toggle]`, `[tooltip]`
- ❌ NEVER use classes or data attributes for JS

**Example:** `<button copy>Copy</button>`

## Naming Conventions

- ✅ Components: nouns (`.card`)
- ✅ Variations: adjectives (`.primary`)
- ✅ States: present tense (`.active`)
- ✅ Layout: structural (`.grid`)
- ✅ Variables: `$color-primary`, `$space-md`
- ✅ Mixins: `@mixin flex-center`

## SCSS Patterns

`$color-primary: #007acc; @mixin flex-center { display: flex; align-items: center; } .card { background: $color-background; }`

## Anti-Pattern

`.card { .header { .title { .icon { .svg { }}}}} // Too deep!`

## Code Review Checklist

- ✅ Semantic HTML
- ❌ No BEM/utility
- ✅ Simple names
- ✅ Mobile-first
- ✅ SCSS vars
- ✅ Shallow nesting
- ✅ Mixins
- ✅ Simple JS selectors
- ✅ Progressive enhancement
- ✅ Single quotes

## Remember

- ✅ Semantic HTML first, classes second
- ✅ Simple global names, never BEM
- ✅ JavaScript augments HTML via simple attributes
- ✅ Progressive enhancement always
- ✅ Use SCSS features wisely: variables, mixins, nesting
