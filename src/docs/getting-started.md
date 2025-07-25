---
title: Getting Started
description: Getting Started
published: true
publishedAt: 2024-06-06
slug: getting-started
excerpt: |
    Get started with LogosDX and start extending your DOM usage today!
---

## Getting Started

Each package can be installed independently:

```bash
npm install @logosdx/dom @logosdx/fetch @logosdx/observer
```

Or get everything at once:

```bash
npm install @logosdx/kit
```

All packages work in modern browsers, Node.js, Deno, Bun, and React Native. TypeScript support is built-in, not bolted on.

## Framework Agnostic

LogosDX utilities are designed to work with any framework or no framework at all:

- **React/Vue/Angular**: Perfect for handling side effects, state management, and DOM interactions
- **Node.js**: Ideal for building resilient APIs and background services
- **Vanilla JavaScript**: Powerful enough to build complete applications
- **Web Workers**: Utilities work seamlessly in worker environments
- **React Native**: Cross-platform event handling and state management


### DOM Manipulation

**[@logosdx/dom](/docs/packages/dom)** - A lightweight, utility-first DOM toolkit for developers who prefer raw DOM over heavyweight frameworks.

- Intuitive selectors with `$()` and `html.events`
- Declarative behavior binding with automatic cleanup
- Type-safe CSS and attribute manipulation
- Viewport utilities and element positioning
- Works wherever the DOM is available

```typescript
import { $, html } from '@logosdx/dom';

// Simple, powerful DOM manipulation
html.events.on($('[copy]'), 'click', ({ target }) => copyToClipboard(target.closest('[copy]')?.textContent));

html.behaviors.create({
    lazyLoad: {
        els: 'img[data-src]',
        handler: (el) => lazyLoad(el),
    },
    tooltip: {
        els: '[tooltip], [title]',
        handler: (el) => new Tooltip(el),
        shouldObserve: true,
    }
})
```

### HTTP Client with Resilience

**[@logosdx/fetch](/docs/packages/fetch)** - Type-safe wrapper for the Fetch API with production-grade resilience features.

- Built-in retry logic with exponential backoff
- Request cancellation and timeout handling
- State management for headers and authentication
- Observable request lifecycle with events
- Standards-first design extending native Fetch

```typescript
import { FetchEngine } from '@logosdx/fetch';

const api = new FetchEngine({
    baseUrl: 'https://api.example.com',
    retryConfig: {
        maxAttempts: 3,
        retryableStatusCodes: [429, 501, 502, 503, 504]
    }
});

const userData = await api.get('/user/profile');
```

### Event-Driven Architecture

**[@logosdx/observer](/docs/packages/observer)** - Type-safe, regex-native event system with memory-leak protection.

- Fully type-safe event handling
- Regex-based event matching for structured events
- Promise and generator support for async flow
- Built-in memory management and debugging
- Works in Node, browsers, workers, and React Native

```typescript
import { ObserverEngine } from '@logosdx/observer';

type Events = {
    'user:login': { id: string; name: string };
    'user:logout': void;
};

const observer = new ObserverEngine<Events>();

// Listen to all user events with regex
observer.on(/user:/, ({ event, data }) => {
    if (event === 'user:login') {
        welcomeUser(data.name);
    }
});
```

### State Management

**[@logosdx/state-machine](/docs/packages/state-machine)** - Lightweight, utility-first state management with time travel capabilities.

- Stream-based state updates with reducers
- Forward and backward navigation through state history
- Child instance clones for ephemeral state
- Type-safe state and reducer definitions
- Perfect for complex forms and document editors

```typescript
import { StateMachine } from '@logosdx/state-machine';

type AppState = {
    user: User | null;
    preferences: UserPreferences;
};

const stateMachine = new StateMachine<AppState, StateAction>(initialState);

stateMachine.addReducer((action, state) => {
    // Handle state changes with full type safety
    return { ...state, user: action.user };
});
```

### Localization Made Simple

**[@logosdx/localize](/docs/packages/localize)** - Type-safe, runtime-friendly localization with dynamic language switching.

- Type-safe translation keys and values
- Runtime language switching and dictionary updates
- Nested object support with dot notation
- Event-driven language change notifications
- Dynamic value interpolation

```typescript
import { LocaleManager } from '@logosdx/localize';

const locales = new LocaleManager({
    current: 'en',
    fallback: 'en',
    locales: { en: english, es: spanish }
});

const greeting = locales.t('welcome.message', { name: 'John' });
```

### Storage Simplified

**[@logosdx/storage](/docs/packages/storage)** - Type-safe, event-driven storage adapter for any LocalStorage-compatible storage.

- Type-safe key-value operations
- Event-driven storage changes
- Prefix support for namespace isolation
- Convenient wrapper functions for single keys
- Works with localStorage, sessionStorage, or custom implementations

```typescript
import { StorageAdapter } from '@logosdx/storage';

type StorageSchema = {
    user: User;
    preferences: UserPreferences;
    authToken: string;
};

const storage = new StorageAdapter<StorageSchema>(localStorage, 'myapp');
```

### Production Utilities

**[@logosdx/utils](/docs/packages/utils)** - Flow control, data structures, and runtime type safety utilities for resilient applications.

- Resilience primitives: retry, circuit breaker, rate limiting
- Safe data operations: clone, equals, merge for modern JS types
- Runtime type guards and assertions
- Composable flow control with `composeFlow`
- Memory-safe memoization and caching

```typescript
import { attempt, retry, clone, equals } from '@logosdx/utils';

const [user, error] = await attempt(() =>
    retry(() => fetchUser(id), {
        retries: 3,
        shouldRetry: (err) => err.status >= 500
    })
);
```

### All-in-One Kit

**[@logosdx/kit](/docs/packages/kit)** - Every LogosDX package combined into a single, cohesive toolkit.

Perfect for new projects or when you need the full power of LogosDX. Provides a unified configuration interface and streamlined instantiation process with strong typing across all components.

```typescript
import { appKit } from '@logosdx/kit';

const kit = appKit({
    observer: { name: 'app-events' },
    fetch: { baseUrl: 'https://api.example.com' },
    storage: { implementation: localStorage, prefix: 'myapp' },
    locales: { current: 'en', locales: { en, es } }
});
```
