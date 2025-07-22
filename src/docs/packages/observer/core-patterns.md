---
title: Core Patterns
description: Core patterns for using the @logosdx/observer library
published: true
publishedAt: 2025-07-08
slug: /core-patterns
---

This guide dives deeper into the **architecture, mental models, and advanced usage patterns** of `ObserverEngine`. If you're building anything non-trivial—queues, state machines, UI frameworks, or real-time systems—this is for you.

---

## Core Concepts

### ObserverEngine is not EventEmitter

`EventEmitter` is simple. It forces you to manually:

* Track listeners
* Clean up memory
* Validate payloads
* Debug event flow

`ObserverEngine` is designed for production-grade systems:

* Type-safe from day 1
* Regex subscriptions
* Promise + generator support
* Leak-proof with built-in cleanup
* Rich introspection

---

## Design Goals

* **Minimal API surface** with maximal power
* **DOM + Node + RN compatibility**
* **TypeScript-first**, not tacked on
* **Composable**: works well with React, workers, queues, or functional logic
* **Replace EventEmitter, RxJS, signals, even Redux in many cases**

---

## Anatomy of ObserverEngine

```ts
new ObserverEngine<Events>({
  name?: string,
  spy?: SpyFn,
  emitValidator?: EmitValidatorFn
});
```

Internally, it tracks:

* `Map<string, Set<Listener>>` — exact event listeners
* `Map<RegExp, Set<Listener>>` — regex listeners
* `EventTarget` — optional bridge for native events (e.g. DOM interop)

No RxJS-style observable wrappers. No nested streams. Just events.

---

## Event Flow Models

### Exact Match Emission

```ts
type Events = {
  save: { id: number; content: string }
};

const observer = new ObserverEngine<Events>();

observer.on('save', ({ id, content }) => {
  console.log(`Saving doc ${id}:`, content);
});

observer.emit('save', { id: 42, content: 'Hello' });
```

You get full type inference here.

### Regex Match Emission

```ts
type Events = {
  'user:login': { userId: string };
  'user:logout': { userId: string };
};

const observer = new ObserverEngine<Events>();

observer.on(/user:/, ({ event, data }) => {
  if (event === 'user:login') logIn(data.userId);
  if (event === 'user:logout') logOut(data.userId);
});

observer.emit('user:login', { userId: 'abc123' });
```

Use this for topic-style grouping, event families, or logical namespaces.

### Promises

```ts
const wait = observer.once('ready');

setTimeout(() => observer.emit('ready'), 100);

await wait;
console.log('System is ready');
```

You can also:

* `promise.cleanup()` to cancel the listener
* `promise.reject(err)` to throw inside `await`

### Generators

```ts
const resize = observer.on('resize');

while (!resize.done) {
  const { width, height } = await resize.next();
  console.log(`Window resized: ${width}x${height}`);
}
```

These are like **async generators**, but with `.emit()` and `.destroy()` baked in. They're ideal for:

* Debounce/throttle logic
* Infinite consumers (queues, streams)
* Conditional workflows
* Processing large datasets

### Emit from Generators

```ts
const userEvents = observer.on(/user:/);

userEvents.emit({ userId: 'abc123', action: 'login' });
```

Generators double as scoped broadcasters. This gives you isolation + flexibility.

---

## Patterns

### Queue Processor

```ts
const queue = observer.on('send-mail');

while (!queue.done) {
  const msg = await queue.next();
  try {
    await mailer.send(msg);
    observer.emit('send-mail-success', { id: msg.id });
  } catch (err) {
    observer.emit('send-mail-fail', { error: err.message });
  }
}
```

Event generators are ideal for job queues or message consumption.


### Signal Bus / Store

```ts
type UIEvents = {
  openModal: { modalId: string };
  closeModal: void;
  setUser: { id: string; name: string };
};

const ui = new ObserverEngine<UIEvents>();

const useModal = () => {
  useEffect(() => ui.on('openModal', ({ modalId }) => open(modalId)), []);
  useEffect(() => ui.on('closeModal', () => close()), []);
}
```

Replace Redux-like state management with direct, event-driven logic.

### Async Control

```ts
const waitForReady = observer.once('ready');

bootup()
  .then(() => observer.emit('ready'))
  .catch(err => waitForReady.reject(err));
```

Use event promises like semaphores or checkpoints in orchestrated flows.

### Observability

```ts
observer.spy = ({ fn, event, data }) => {
  console.debug(`[${fn.toUpperCase()}] ${event}:`, data);
};

observer.debug(true);
```

You can trace, log, or collect metrics from every emit, on, and once. `.debug(true)` prints stack traces.

### Validation + Security

```ts
const observer = new ObserverEngine({
  emitValidator: (event, data) => {
    if (event === 'message' && typeof data.content !== 'string') {
      throw new Error('Invalid message payload');
    }
  }
});
```

Hook in schema validation to block malformed or malicious data.

---

## Cleanup & Lifecycles

Everything returns a cleanup mechanism:

```ts
const off = observer.on('event', handler);
off();

const gen = observer.on('stream');
gen.destroy();

const p = observer.once('thing');
p.cleanup();
```

Use this in:

* React `useEffect`
* Express middleware
* Lifecycle hooks
* Signal termination

---

## Composition

### Class Inheritance

```ts
type Events = { ready: void };

class MyService extends ObserverEngine<Events> {
  start() {
    this.emit('ready');
  }
}
```

### Event Delegation

```ts
myObserver.observe(this);
this.emit('open');
```

Compose components, modules, or services around the same engine. Think event microkernel.

---

## Scaling Up

* Works across microservices via RabbitMQ, Redis pub/sub, etc. Just wrap `.emit()` and `.on()`
* Compose multiple instances with different namespaces
* Use `.spy()` to capture metrics or generate traces
* Use `.debug(true)` to catch silent failures early

---

## TL;DR Mental Models

* **EventEmitter is a dumb pipe.**
* **ObserverEngine is an event bus with memory safety, type safety, and pattern matching.**
* **If you can describe your flow as "do X when Y happens", this fits.**
