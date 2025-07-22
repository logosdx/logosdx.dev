---
title: Event Queue
description: Event Queue from using the @logosdx/observer library
published: true
publishedAt: 2025-07-08
slug: /queue
---

The `EventQueue` is a concurrency-aware, rate-limited, lifecycle-observable event processing engine built into `@logosdx/observer`. It is designed for robust background processing in environments where control over queue state, observability, and stability are critical.

## Features

- ✅ Concurrency control
- ✅ FIFO / LIFO queue modes
- ✅ Rate limiting (token bucket)
- ✅ Debounce + jitter control
- ✅ Graceful draining and shutdown
- ✅ Detailed lifecycle events
- ✅ Snapshot and stats tracking
- ✅ Memory-safe processing of large workloads
- ✅ Observable + introspectable by design

## Usage

```ts
const queue = observer.queue(
  'user:signup',
  async (data) => {
    await sendWelcomeEmail(data);
  },
  {
    name: 'signupQueue',
    concurrency: 3,
    pollIntervalMs: 50,
    jitterFactor: 0.25,
    rateLimitCapacity: 100,
    rateLimitIntervalMs: 1000,
    type: 'fifo',
    debug: true
  }
);

queue.add({ email: 'user@example.com' });
// or
observer.emit('user:signup', { email: 'user@example.com' });
```

## Queue Options

| Option            | Type                                 | Default       | Description                                                 |
| ----------------- | ------------------------------------ | ------------- | ----------------------------------------------------------- |
| `name`            | `string`                             | —             | Required. Unique queue name. Used for event names.          |
| `concurrency`     | `number`                             | `1`           | Max number of items processed in parallel.                  |
| `type`            | `'fifo' \| 'lifo'`                   | `'fifo'`      | Determines queue order.                                     |
| `pollIntervalMs`      | `number`                             | `100`         | Delay between idle processing attempts when queue is empty. |
| `jitterFactor`          | `number`                             | `0`           | Randomness multiplier for debounce delay.                   |
| `maxQueueSize`    | `number`                             | `999_999_999` | Max queue size before items are rejected.                   |
| `rateLimitCapacity`  | `number`                             | `999_999_999` | Max items processed per window.                             |
| `rateLimitIntervalMs` | `number` (ms)                        | `1000`        | Time window for rate limiting.                              |
| `autoStart`       | `boolean`                            | `true`        | Whether the queue starts automatically.                     |
| `debug`           | `boolean` or `'info'` or `'verbose'` | `false`       | Logs all internal events.                                   |

## Debugging

Enable debug mode to trace internal activity:

```ts
queue.debug(true); // or 'verbose'
```

Logs look like:

```
[signupQueue] added { data: ..., _taskId: '...' }
[signupQueue] processing { data: ..., startedAt: 1234 }
[signupQueue] success { data: ..., elapsed: 10 }
```

You can also observe everything externally:

```ts
observer.on('queue:signupQueue:success', (payload) => {
  console.log(payload);
});
```

## Comparison to Other Libraries

| Feature / Concern              | **LogosDX `EventQueue`**                      | **BullMQ**                                 | **p-queue**                               | **fastq**                        | **async.queue**                    | **tinyqueue**                      |
| ------------------------------ | --------------------------------------------- | ------------------------------------------ | ----------------------------------------- | -------------------------------- | ---------------------------------- | ---------------------------------- |
| **Persistence**                | ❌ In-memory only                              | ✅ Redis-backed persistence                 | ❌                                         | ❌                                | ❌                                  | ❌                                  |
| **Type Safety**                | ✅ Strong (inferred via observer map)          | ✅ Native TS (BullMQ)                       | ✅ Built-in TS types                       | ✅ Bundled `.d.ts`                | ⚠️ Good via DefinitelyTyped         | ✅ (minimal, via `.d.ts`)           |
| **Concurrency Control**        | ✅ True concurrency pool (runners)             | ✅ Worker pool                              | ✅ Built-in                                | ✅                                | ✅                                  | ❌                                  |
| **Rate Limiting**              | ✅ Token bucket + rate-limited events          | ✅ Global, per-worker, and group-level      | ✅ Token bucket (basic)                    | ❌ Manual                         | ❌ Manual                           | ❌ Manual                           |
| **Backpressure / Queue Cap**   | ✅ Enforced via `maxQueueSize`, rejections     | ❌ (must monitor Redis memory)              | ⚠️ Optional via `.onSizeLessThan()`        | ❌ Manual                         | ⚠️ Needs user to check `.length()`  | ❌ Manual                           |
| **Debounce + Jitter**          | ✅ Built-in (idle loop control)                | ❌                                          | ❌                                         | ❌                                | ❌                                  | ❌                                  |
| **Lifecycle Events**           | ✅ Full (`added`, `processing`, `success`, …)  | ✅ (`waiting`, `active`, `completed`, etc.) | ⚠️ Some (`add`, `active`, `idle`, `error`) | ⚠️ Minimal (`saturated`, `drain`) | ⚠️ Minimal (`saturated`, `drain`)   | ❌                                  |
| **Observability**              | ✅ Observer-based: listen to any event         | ✅ Via `QueueEvents`, plus dashboard tools  | ⚠️ Via EventEmitter, no structured logging | ❌ Minimal                        | ⚠️ Function hooks only              | ❌                                  |
| **Queue Modes**                | ✅ FIFO / LIFO switchable                      | ✅ FIFO + Delays + Priorities               | ✅ FIFO + Priorities (no LIFO)             | ✅ FIFO only                      | ✅ FIFO (or Priority via alt queue) | ✅ Priority heap only               |
| **Graceful Shutdown**          | ✅ `shutdown(force?)` + `pause()` + `resume()` | ✅ `close()` + job cleanup                  | ⚠️ Await `onIdle()`, manual coordination   | ⚠️ Manual `drain` and kill        | ✅ via `.kill()`                    | ❌ Manual (no execution model)      |
| **Active Runners Snapshot**    | ✅ Yes (`snapshot`)                         | ❌ Partial (via Redis UI, not programmatic) | ⚠️ via `pending` + `size`                  | ⚠️ Manual tracking                | ⚠️ Must manually count              | ❌                                  |
| **Memory Safety (Large Load)** | ✅ Explicitly tested at 100k+ items            | ✅ Redis handles queue                      | ⚠️ Bounded if used carefully               | ⚠️ Can OOM if flooded             | ⚠️ Can OOM if not monitored         | ✅ Only if you `pop()` consistently |
| **Integration Flexibility**    | ✅ Any event emitter, not tied to transport    | ❌ Must use Redis API                       | ⚠️ Task functions only                     | ⚠️ Task functions only            | ⚠️ Task callbacks only              | ✅ Totally generic data structure   |
| **Composability**              | ✅ Supports flush, drain, hook-in anywhere     | ✅ Job dependencies via Flows               | ⚠️ Manual                                  | ⚠️ Manual                         | ⚠️ Manual chaining                  | ✅ You build whatever you want      |
| **Multi-Process / Cluster**    | ❌ Single-process only                         | ✅ Full distributed worker support          | ❌                                         | ❌                                | ❌                                  | ❌                                  |
| **Custom Execution Flow**      | ✅ Full control over process batch, idle loop  | ❌ Worker lifecycle is fixed                | ❌                                         | ❌                                | ❌                                  | ✅ You do everything manually       |
| **Scheduling**                 | ❌ Not included (can be done externally)       | ✅ Delay and repeat                         | ❌                                         | ❌                                | ❌                                  | ✅ If you build it yourself         |
| **Footprint / Simplicity**     | ✅ No Redis, no deps except ObserverEngine     | ❌ Requires Redis + Redis Streams           | ✅ Minimal, ESM only                       | ✅ Very minimal                   | ✅ Reasonable                       | ✅ \~1kb                            |

> 🧠 **Why not just use p-queue?** Because `p-queue` is fire-and-forget. No introspection, no eventing, no lifecycle. It's fine for scripts, not for systems. EventQueue can handle both.

> 🧠 **Why not BullMQ?** Because Redis isn’t always an option. `EventQueue` is ideal for local jobs, UI coordination, SSR queues, and more. You can hook into any data source you want, not just Redis.

## Lifecycle Events

All events are emitted via `observer.on()` with `any` typings using the format:

```ts
observer.on('queue:<name>:<event>', (payload) => { ... });
```

Alternatively, you can use the `queue.on()` method to listen to strongly typed events:

```ts
queue.on('start', () => { ... });
```

The same structures are available for `queue.on()` (`EventGenerator` class) and `queue.once()` (`EventPromise` class).

### Core Events

| Event Name     | Observer Event Name         | Payload                                     |
| -------------- | --------------------------- | ------------------------------------------- |
| `start`        | `queue:<name>:start`        | `undefined`                                 |
| `started`      | `queue:<name>:started`      | `undefined`                                 |
| `paused`       | `queue:<name>:paused`       | `undefined`                                 |
| `resumed`      | `queue:<name>:resumed`      | `undefined`                                 |
| `stopped`      | `queue:<name>:stopped`      | `undefined`                                 |
| `idle`         | `queue:<name>:idle`         | `undefined`                                 |
| `empty`        | `queue:<name>:empty`        | `undefined`                                 |
| `added`        | `queue:<name>:added`        | `{ data, _taskId }`                         |
| `processing`   | `queue:<name>:processing`   | `{ data, _taskId, startedAt, rateLimited }` |
| `success`      | `queue:<name>:success`      | `{ data, _taskId, elapsed, rateLimited }`   |
| `error`        | `queue:<name>:error`        | `{ data, _taskId, error, rateLimited }`     |
| `rate-limited` | `queue:<name>:rate-limited` | `{ data, _taskId }`                         |
| `rejected`     | `queue:<name>:rejected`     | `{ data, reason }`                          |
| `flush`        | `queue:<name>:flush`        | `{ pending }`                               |
| `flushed`      | `queue:<name>:flushed`      | `{ flushed }`                               |
| `drain`        | `queue:<name>:drain`        | `{ pending }`                               |
| `drained`      | `queue:<name>:drained`      | `{ drained }`                               |
| `shutdown`     | `queue:<name>:shutdown`     | `{ force, pending? }`                       |
| `purged`       | `queue:<name>:purged`       | `{ count }`                                 |
| `cleanup`      | `queue:<name>:cleanup`      | `undefined`                                 |

## Methods

### `.add(data: T): boolean`

Adds an item to the queue. Returns `false` if the queue is full or not accepting items.

### `.start()`

Starts the queue and launches worker runners.

### `.stop()`

Stops processing and detaches from the observer. In-flight items finish.

### `.pause()`

Temporarily pauses all runners.

### `.resume()`

Resumes runners after pause.

### `.flush(limit = Infinity): Promise<number>`

Processes up to `limit` items immediately. Returns number processed.

### `.shutdown(force = false): Promise<number>`

Gracefully drains queue or forcibly purges if `force = true`. Returns number processed or purged.

### `.purge(): number`

Clears queue and returns count of items removed.

### `.debug(enable: boolean | 'info' | 'verbose')`

Toggles debug mode. `true` is equivalent to `'info'`. `'verbose'` will log all data available in the event payload.

### `.on(event: string, listener?: (payload?: any) => void): EventGenerator | Cleanup`

Adds a listener for an event. Returns an `EventGenerator` or `Cleanup` function depending on whether the listener is passed or not.

### `.once(event: string, listener?: (payload?: any) => void): EventPromise | Cleanup`

Adds a one-time listener for an event. Returns an `EventPromise` or `Cleanup` function depending on whether the listener is passed or not.

### `.off(event: string, listener: (payload?: any) => void): void`

Removes a listener for an event.

## Properties

### `.pending: number`

Number of items in the queue.

### `.stats: { processed, success, error, rejected, avgProcessingTime }`

Live stats object.

### `.snapshot`

Returns an object with current state, active runners, stats, flags.

### `.isRunning | .isIdle | .isPaused | .isDraining | .isStopped`

Convenience booleans for queue status.

## Best Practices

- Avoid `.add()` if `queue.isRunning` is `false`.
- Use `await observer.once('queue:name:idle')` to wait until queue is idle. Alternatively, you can use `await queue.once('idle')`.
- Prefer `await queue.shutdown()` in teardown logic without `force` argument. This will wait for all items to be processed before shutting down. No new items will be accepted after shutdown is called.
- Use `.debug(true)` during development to log all internal events.
- Ensure observer handlers are cleaned up if listening externally.

## FAQ

### What happens if `.add()` is called while paused?

The item is accepted, but processing is deferred until resume.

### Can I manually emit lifecycle events?

Technically, yes. All lifecycle events are internal-only and managed by the queue engine. However, you can use `observer.emit()` to emit any event you want. You will only produce false-positives for yourself if you do this.

### How do I implement retries?

Handle in your `process` function — the queue does not retry by design. You can use `queue.on('error', (error) => { ... })` to handle errors and re-enqueue the item:

```ts
queue.on('error', (error) => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    queue.add(error.data); // re-enqueue the item
  }
});
```

### Does it leak memory with large batches?

No. The internal queue is array-based, and memory is released after processing. This is tested with 100k+ items in unit tests.

### Is the queue type-safe?

Yes — if used through `observer.queue()`, types are inferred from your event map. You can also use `queue.on()` to listen to strongly typed queue events.

### How do I connect it to a data source?

Because this queue is event-based, all you need to do is emit events and the queue will handle the rest. You can use `observer.emit()` to emit any event you want, or `queue.add()`.

Sample `observer.ts` file:

```ts

const observer = new ObserverEngine<{
  'job:process': { id: string; data: any };
  'job:complete': { id: string; result: any };
  'job:error': { id: string; error: Error };
}>();

// Log all job events
observer.on(/job:*+/, ({ event, data }) => logger.info(event, data));

```

Sample `redis.ts` file:

```ts
// Redis Pub/Sub integration example
import Redis from 'ioredis';
import { observer } from './observer';

const redis = new Redis();

// Subscribe to Redis channel for incoming jobs
redis.subscribe('jobs:incoming');

redis.on('message', (channel, message) => {

  if (channel === 'jobs:incoming') {

    const job = JSON.parse(message);

    // Add job to queue for processing
    observer.emit('job:process', job);
  }
});

// Handle job completion by publishing to Redis
observer.on('queue:someWorker:success', (event) => {

  redis.publish('jobs:completed', JSON.stringify(event.data));
});

// Handle job errors by publishing to Redis
observer.on('queue:someWorker:error', (event) => {

  redis.publish('jobs:failed', JSON.stringify({
    id: event.data.id,
    error: event.data.error.message
  }));
});

// Graceful shutdown
observer.on('queue:someWorker:shutdown', () => redis.disconnect());

```

Sample `worker.ts` file:

```ts
import { observer } from './observer';

// Create a queue for processing jobs
const jobQueue = observer.queue(
    'job:process',
        async (job) => {
        // Process the job
        const result = await processJob(job.data);

        // Emit completion event
        observer.emit('job:complete', { id: job.id, result });

        return result;
    },
    {
        name: 'someWorker',
        concurrency: 5,
        pollIntervalMs: 100,
        jitterFactor: 0.25,
        rateLimitCapacity: 100,
        rateLimitIntervalMs: 1000,
        type: 'fifo',
        debug: true
    }
);

// Graceful shutdown
process.on('SIGTERM', async () => {

  await jobQueue.shutdown();
});
```

Let's say, alternatively, you want to use a different data source, like a database. You can do that too.

```ts
import { observer } from './observer';
import { dbClient } from './my-db-client';

const payments = await dbClient.select('payments')
    .where('status', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .all();

for (const payment of payments) {
    observer.emit('payment:process', payment);
}
```

Or, say you're batch-processing a massive CSV file. You can do that too.

```ts
import { observer } from './observer';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const fileStream = createReadStream('payments.csv');
const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

let headers = [];

for await (const line of rl) {

    if (headers.length === 0) {
        headers = line.split(',');
        continue;
    }

    const payment = {} as Record<string, string>;

    for (const index in headers) {
        payment[headers[index]] = line[index];
    }

    observer.emit('payment:process', payment);
}
```
