---
title: Debugging Tools
description: Debugging tools for using the @logosdx/observer library
published: true
publishedAt: 2025-07-08
slug: /debugging
---

If you've ever lost an hour chasing silent event failures, you know why this matters. `ObserverEngine` ships with **first-class debugging**, not a guessing game.

---

## Overview

These tools are designed to:

* Trace event flow end-to-end
* Reveal missing or duplicate listeners
* Audit memory usage and lifecycle state
* Inspect internal engine mappings safely

---

## `spy()` Function

Every event (`on`, `once`, `emit`, etc.) triggers a `spy` action if provided.

```ts
const observer = new ObserverEngine({
  spy: ({ fn, event, data, listener }) => {
    console.log(`[${fn.toUpperCase()}] ${event}:`, data ?? listener);
  }
});
```

This enables:

* Custom logging
* Dev-only diagnostics
* Telemetry and tracing

Use `fn` to distinguish calls: `"on"`, `"emit"`, `"once"`, etc.

---

## `debug(true)`

Enables built-in stack-trace style logging for all emits and listeners.

```ts
observer.debug(true);

observer.emit('save', { id: 1 });
```

Logs:

```
[EMIT] save:
  at src/features/save.ts:42
```

Turn off with:

```ts
observer.debug(false);
```

Useful for:

* Locating dead or dangling emits
* Quickly scanning event activity during runtime

---

## `$facts()`

Returns **parsed metadata** about the observer instance:

```ts
console.log(observer.$facts());
```

Example output:

```ts
{
  listeners: ['ready', 'error', 'message'],
  rgxListeners: [/user:/],
  listenerCounts: {
    ready: 2,
    error: 1,
    message: 4,
    '/user/': 3
  },
  hasSpy: true
}
```

Great for:

* Live health checks
* Displaying stats in dev dashboards
* Validating expected event wiring

---

## `$has(event)`

Checks whether any listener exists for a given event (string or regex).

```ts
observer.$has('ready');       // true
observer.$has(/user:/);       // true
observer.$has('nonexistent'); // false
```

Use this before emitting if needed, or as part of a monitoring hook.

---

## `$internals()`

Returns a **safe clone of the internal listener mappings**.

```ts
console.log(observer.$internals());
```

Output:

```ts
{
  listenerMap: Map(2) {
    'ready' => Set(2),
    'message' => Set(4)
  },
  rgxListenerMap: Map(1) {
    /user:/ => Set(3)
  },
  internalListener: EventTarget,
  name: 'myObserver',
  spy: [Function: spyFn]
}
```

> ⚠️ This is meant for **debugging only**. Do not mutate this data.

Use this to:

* Track down memory leaks
* Confirm all cleanup hooks ran
* Validate regex behavior

---

## Memory Debug Checklist

When hunting leaks, here’s what to verify:

* All `.on()` listeners return cleanups and are called
* All `.once()` promises are resolved, rejected, or `.cleanup()` is called
* All generator `.destroy()` methods are called
* `$facts().listenerCounts` should drop to 0 during teardown
* `$internals().listenerMap` should be empty in terminal states

---

## Observability Hooks

Want to build your own dashboards or traces?

* Use `.spy()` to emit events into a monitoring pipeline
* Use `.debug(true)` during CI, E2E, or staging sessions
* Use `$facts()` to snapshot usage at runtime

---

## Best Practices

* Always enable `.debug(true)` during dev
* Never ship with `.debug(true)` in production
* Use `.spy()` to integrate with existing loggers (e.g. Pino, Winston)
* Guard against excessive listeners by watching `$facts().listenerCounts`

---

## Final Word

Debugging should be a feature, not an afterthought. ObserverEngine gives you the tools to build confidently—and trace when things go wrong.

If you're still `console.log`-ing your way through emit chains, you're doing it wrong.

Want live event tracing dashboards? You're 80% of the way there with `.spy()` and `$facts()`.
