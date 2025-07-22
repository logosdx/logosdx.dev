---
title: Core Patterns
description: Core patterns for using the @logosdx/utils library
slug: /core-patterns
---

## Type System Documentation

### Path Type Utilities

The utils package provides advanced TypeScript utilities for working with object paths, including support for Maps, Sets, and arrays:


```ts
// PathNames generates all valid paths
type AllPaths = PathNames<UserData>

```

```typescript
// Example data structure with various collection types
interface UserData {
    profile: {
        name: string
        settings: {
            theme: 'light' | 'dark'
            notifications: boolean
        }
    }
    tags: Set<string>
    scores: Set<{ value: number; label: string }>
    metadata: Map<string, { value: string; updated: Date }>
    preferences: Map<'theme' | 'lang', string>
    history: string[]
    matrix: number[][]
}

// PathNames generates all valid paths
type AllPaths = PathNames<UserData>
// Results in: 'profile' | 'profile.name' | 'profile.settings' |
// 'profile.settings.theme' | 'tags' | 'tags.0' | 'scores' |
// 'scores.0' | 'scores.0.value' | 'metadata' | 'metadata.someKey' |
// 'metadata.someKey.value' | etc.

// PathValue extracts the type at a specific path
type UserName = PathValue<UserData, 'profile.name'> // string
type Theme = PathValue<UserData, 'profile.settings.theme'> // 'light' | 'dark'
type Tag = PathValue<UserData, 'tags.0'> // string
type Score = PathValue<UserData, 'scores.0.value'> // number
type MetaValue = PathValue<UserData, 'metadata.config.value'> // string
type Pref = PathValue<UserData, 'preferences.theme'> // string
type HistoryItem = PathValue<UserData, 'history.0'> // string
type MatrixValue = PathValue<UserData, 'matrix.0.1'> // number

// Use with reach() for type-safe deep access
import { reach } from '@logosdx/utils'

function getUserSetting<P extends PathNames<UserData>>(
    user: UserData,
    path: P
): PathValue<UserData, P> {

    return reach(user, path)
}

// Type-safe access with full IntelliSense
const theme = getUserSetting(user, 'profile.settings.theme') // 'light' | 'dark'
const tag = getUserSetting(user, 'tags.0') // string
const metaValue = getUserSetting(user, 'metadata.config.value') // string
```

**When to use:**

- Building form systems that need dot-notation paths
- Creating type-safe configuration systems
- Implementing state management with deep updates
- Any scenario requiring compile-time validation of property paths

## Advanced Patterns

### Resilient Service Communication

Layer multiple protections for unreliable endpoints:

```ts
// Compose timeout + retry + rate limiting
const protectedService = composeFlow(
    (endpoint: string, body: any, opts?: RequestInit) => fetch(endpoint, { method: 'POST', body, ...opts }),
    {
        withTimeout: {
            timeout: 5000,
            onError: (err) => recordError(err),
        },
        rateLimit: {
            maxCalls: 100,
            windowMs: 1000,
            throws: true,
        },
        retry: {
            attempts: 3,
            delay: 1000,
            backoff: 2,
            jitterFactor: 0.5,
            shouldRetry: (err) => err.status >= 500,
        },
    }
);

// Clean error handling with specific fallbacks
const [data, err] = await attempt(
    () => protectedService('/api/critical')
);

if (err) {

    if (err instanceof TimeoutError) {

        return { error: 'Request timed out' };
    }
    if (err instanceof RateLimitError) {

        return { error: 'Too many requests' };
    }
    if (err instanceof RetryError) {

        return { error: 'Request failed' };
    }

    throw err;
}

const response = data;
```

### ETL Pipeline with Controlled Concurrency

Process large datasets with multiple stages and error recovery:

```ts
// Multi-stage pipeline with different concurrency limits per stage
const pipeline = async (records: Record[]) => {

    // Stage 1: Validate and transform (high concurrency)
    const [validated, stage1Errors] = await attempt(
        () => batch(validateRecord, {
            items: records,
            concurrency: 100,
            failureMode: 'continue'
        })
    );

    // Stage 2: Enrich with external data (rate limited)
    const enrichFn = rateLimit(enrichRecord, { maxCalls: 50, windowMs: 1000 });

    const [enriched, stage2Errors] = await attempt(
        () => batch(enrichFn, {
            items: validated.filter(v => v.result),
            concurrency: 25,
            failureMode: 'continue'
        })
    );

    // Stage 3: Write to database (controlled for connection pool)
    const writeFn = composeFlow(
        writeToDatabase,
        {
            withTimeout: {
                timeout: 10000,
                onError: (err) => recordError(err),
            },
            retry: {
                attempts: 3,
                delay: 1000,
                backoff: 2,
                jitterFactor: 0.5,
                shouldRetry: (err) => [
                    'ECONNREFUSED',
                    'ECONNRESET',
                    'ETIMEDOUT'
                ].filter(
                    msg => err.message.includes(msg)
                )
            },
        }
    );

    const [written, stage3Errors] = await attempt(() =>
        batch(writeFn, {
            items: enriched.filter(e => e.result),
            concurrency: 10,
            failureMode: 'continue',
            onError: async (err, item) => {

                await deadLetterQueue.push({ error: err, record: item });
            }
        })
    );

    return {
        processed: written.filter(w => w.result).length,
        errors: {
            validation: stage1Errors,
            enrichment: stage2Errors,
            persistence: stage3Errors
        }
    };
};
```

### Reactive State with Immutable Updates

Complex state management with time-travel debugging:

```ts
// State machine with history tracking and computed values
class AdvancedStateManager<T> {

    private history: T[] = [];
    private computedCache = new Map<string, any>();
    private subscribers = new Map<string, Set<Function>>();

    constructor(
        private state: T,
        private computed: Record<string, (state: T) => any> = {}
    ) {

        this.history.push(clone(state));
    }

    update(updater: (draft: T) => void | Partial<T>) {

        const draft = clone(this.state);
        const result = updater(draft);
        const newState = result ? merge(draft, result) : draft;

        if (!equals(this.state, newState)) {

            this.state = newState;
            this.history.push(clone(newState));
            this.computedCache.clear();
            this.notify();
        }
    }

    // Memoized computed values
    get<K extends keyof typeof this.computed>(key: K): ReturnType<typeof this.computed[K]> {

        if (!this.computedCache.has(key as string)) {

            const compute = memoizeSync(this.computed[key as string], { maxSize: 1 });
            this.computedCache.set(key as string, compute(this.state));
        }
        return this.computedCache.get(key as string);
    }

    // Time travel
    undo() {

        if (this.history.length > 1) {

            this.history.pop();
            this.state = clone(this.history[this.history.length - 1]);
            this.computedCache.clear();
            this.notify();
        }
    }

    private notify() {

        this.subscribers.forEach((subs, path) => {

            const value = reach(this.state, path);
            subs.forEach(fn => fn(value));
        });
    }
}
```

## TypeScript Usage Guidelines

### Type Inference

The utilities are designed with TypeScript-first, providing excellent type inference:

```typescript
import { attempt, clone, merge, memoizeSync } from '@logosdx/utils';

// Full type inference for error handling
async function example() {
    // TypeScript knows: result is User | null, error is Error | null
    const [result, error] = await attempt(() => fetchUser('123'));

    if (error) {
        // error is Error here
        console.error(error.message);
        return;
    }

    // result is User here (non-null)
    console.log(result.name);
}

// Deep operations preserve types
interface AppState {
    users: Map<string, { name: string; roles: Set<string> }>;
    config: { theme: 'light' | 'dark'; features: string[] };
}

const state: AppState = {
    users: new Map([['u1', { name: 'Alice', roles: new Set(['admin']) }]]),
    config: { theme: 'dark', features: ['search', 'export'] }
};

// cloned has exact same type as state
const cloned = clone(state);

// merged has exact same type as state
const userState = {
    user: {
        id: 'u1',
        name: 'Alice',
        roles: new Set(['admin'])
    },
    invoices: [
        { id: 'i1', amount: 100, status: 'paid' },
        { id: 'i2', amount: 200, status: 'pending' }
    ],
    payments: [
        { id: 'p1', amount: 100, status: 'pending' },
        { id: 'p2', amount: 200, status: 'paid' }
    ],
}

// Both state and userState will be merged into a new type
const merged = merge(state, userState);

// This function is expensive to call, so we memoize it
const expensiveCalculation = (a: number, b: string) => {
    return {
        result: a * b.length,
    }
}

// Type-safe memoization
const calculate = memoizeSync(
    expensiveCalculation,
    { ttl: 1000 }
);

// TypeScript enforces correct arguments and knows return type
const output = calculate(5, 'hello'); // { result: number }
```

### Generic Constraints

Many utilities use generic constraints for flexibility with type safety:

```typescript
import { batch, Func, BatchResult } from '@logosdx/utils';

// Batch accepts any function returning a promise
async function processBatch<T, R>(
    items: T[],
    processor: Func<[T], Promise<R>>
): Promise<R[]> {
    const results = await batch(processor, {
        items,
        concurrency: 5
    });

    // Extract successful results, filtering out errors
    return results
        .filter(result => result.error === null)
        .map(result => result.result as R);
}

// Type-safe usage
interface User { id: string; name: string }
const users: User[] = [/* ... */];

const enrichedUsers = await processBatch(users, async (user) => ({
    ...user,
    score: await calculateScore(user.id)
}));
// enrichedUsers is (User & { score: number })[]
```

### Strict Mode Compatibility

All utilities work with TypeScript strict mode:

```typescript
// tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "noImplicitAny": true
    }
}

// Utilities handle strict null checks properly
import { attempt, merge } from '@logosdx/utils';

const [data, error] = await attempt(() => fetchData());

if (!error && data) {
    // TypeScript knows data is non-null here
    const merged = merge(data, updates);
}
```

### Custom Type Guards

Combine validation utilities with TypeScript type guards:

```typescript
import { isObject, isDefined, assert } from '@logosdx/utils';

// Create type guards
interface ApiResponse {
    data: unknown;
    status: number;
}

function isValidResponse(value: unknown): value is ApiResponse {
    return isObject(value) &&
           isDefined((value as any).data) &&
           typeof (value as any).status === 'number';
}

// Use with attempt pattern
const [response, error] = await attempt(() => fetch('/api').then(r => r.json()));

if (!error) {
    assert(isValidResponse(response), 'Invalid API response shape');
    // response is typed as ApiResponse here
    console.log(response.status);
}

// Or create validated wrapper
async function fetchTyped<T>(
    url: string,
    validator: (data: unknown) => data is T
): Promise<[T | null, Error | null]> {
    const [data, error] = await attempt(() =>
        fetch(url).then(r => r.json())
    );

    if (error) return [null, error];

    if (!validator(data)) {
        return [null, new Error('Response validation failed')];
    }

    return [data, null];
}
```

## Why These Utilities?

Building reliable applications requires handling numerous edge cases:

- **Complex error handling patterns** that compose well across async boundaries
- **Network resilience** with timeouts, retries, and circuit breakers
- **Modern JavaScript support** for Maps, Sets, WeakRefs, and circular references
- **Performance optimization** through intelligent caching and batching

This library provides battle-tested implementations so you can focus on your application logic rather than reimplementing these patterns.

## Real-World Examples

```typescript
// 1. Replace nested try-catch with composable error handling
import { attempt } from '@logosdx/utils';

async function fetchUserProfile(userId: string) {
    const [user, fetchError] = await attempt(() =>
        fetch(`/api/users/${userId}`).then(r => r.json())
    );

    if (fetchError) {
        // Check specific error types for appropriate handling
        if (fetchError.name === 'TypeError') {
            return getCachedUser(userId); // Network offline - use cache
        }
        logger.error('User fetch failed', { userId, error: fetchError });
        throw new ServiceError('Unable to load user profile', { cause: fetchError });
    }

    return user;
}

// 2. Add resilience to external API calls
import { composeFlow } from '@logosdx/utils';

const resilientStripeCall = composeFlow(fetch, {
    withTimeout: { timeout: 5000 },
    retry: {
        retries: 3,
        delay: 1000,
        shouldRetry: (err) => err.status >= 500 // Only retry server errors
    },
    circuitBreaker: {
        maxFailures: 5,
        resetAfter: 30000,
        onOpen: () => notifyOps('Stripe circuit breaker opened')
    }
});

// 3. Handle complex state updates safely
import { clone, merge } from '@logosdx/utils';

function updateUserPermissions(currentState: AppState, updates: PermissionUpdate) {
    // Safely clone to prevent mutations
    const newState = clone(currentState);

    // Merge updates while preserving existing Maps/Sets
    return merge(newState, {
        users: {
            [updates.userId]: {
                permissions: new Set(updates.permissions),
                lastModified: new Date()
            }
        }
    });
}

// 4. Optimize expensive operations
import { memoizeSync, batch } from '@logosdx/utils';

const calculateRiskScore = memoizeSync(
    (userData: UserData) => expensiveMLCalculation(userData),
    {
        ttl: 300000, // 5 minutes
        keyGenerator: (userData) => userData.id // Custom cache key
    }
);

// Process large datasets efficiently
await batch(enrichUserData, {
    items: userIds.map(id => [id]),
    concurrency: 10,
    onError: (error, userId) => {
        logger.warn(`Failed to enrich user ${userId}`, error);
        return null; // Continue processing other users
    }
});
```

## Core Patterns

### Composable Error Handling

The `attempt` pattern provides explicit, composable error handling that scales with your application:

```typescript
import { attempt } from '@logosdx/utils';

// Simple usage
async function saveUserPreferences(userId: string, prefs: UserPrefs) {

    const [user, fetchError] = await attempt(() => fetchUser(userId));

    if (fetchError) {

        if (fetchError.status === 404) {
            throw new NotFoundError('User not found');
        }

        if (fetchError.status === 403) {
            throw new ForbiddenError('User not allowed to update preferences');
        }

        throw fetchError;
    };

    const [updated, updateError] = await attempt(() =>
        updateUser(userId, { ...user, preferences: prefs })
    );

    if (updateError) {

        // handle other errors
        throw updateError;
    };

    // Clear cache after successful update
    await attempt(() => clearUserCache(userId)); // Non-critical, don't fail on error

    return updated;
}

// Compose with other patterns
async function processOrderWithFallback(order: Order) {
    const [result, error] = await attempt(() => processPayment(order));

    if (error && error.status === 504) {

        // Check if we've already queued for processing
        const queued = await isOrderQueued(order.id);

        if (queued) return {
            status: 'queued',
            orderId: order.id
        };

        // Queue for retry instead of failing immediately
        await queueForProcessing(order);

        return {
            status: 'queued',
            orderId: order.id
        };
    }

    if (error) throw error; // Re-throw unexpected errors
    return result;
}
```

### Resilient Network Operations

Build robust API clients that handle real-world network conditions:

```typescript
import { composeFlow, attempt } from '@logosdx/utils';

// Configure once, use everywhere
const apiClient = composeFlow(fetch, {
    withTimeout: { timeout: 5000 },
    retry: {
        retries: 3,
        delay: 1000,
        backoff: 2,
        shouldRetry: (error, attempt) => {
            // Don't retry client errors
            if (error.status >= 400 && error.status < 500) return false;
            // Exponential backoff for rate limits
            if (error.status === 429) {
                const retryAfter = error.headers?.['retry-after'];
                return { delay: parseInt(retryAfter) * 1000 || 60000 };
            }
            return attempt < 3;
        }
    },
    circuitBreaker: {
        maxFailures: 5,
        resetAfter: 30000,
        onOpen: () => metrics.increment('circuit_breaker.opened'),
        onClose: () => metrics.increment('circuit_breaker.closed')
    }
});

// Use it like normal fetch
const [data, error] = await attempt(() =>
    apiClient('/api/users').then(r => r.json())
);
```

### Safe Data Manipulation

Work confidently with complex data structures:

```typescript
import { clone, equals, merge } from '@logosdx/utils';

// Application state with complex structures
const appState = {
    users: new Map([
        ['user1', {
            name: 'Alice',
            permissions: new Set(['read', 'write']),
            metadata: new WeakRef(metadataObj)
        }]
    ]),
    config: {
        features: new Map([['darkMode', true]]),
        lastSync: new Date()
    }
};

// Safe state updates
function updateState(currentState: AppState, updates: StateUpdate) {
    // Clone prevents accidental mutations
    const newState = clone(currentState);

    // Merge preserves special types (Maps, Sets, Dates)
    const merged = merge(newState, updates, {
        arrays: 'replace', // or 'concat' based on your needs
        maps: 'merge',
        sets: 'union'
    });

    // Only trigger updates if actually changed
    if (!equals(currentState, merged)) {
        setState(merged);
        persistState(merged);
    }

    return merged;
}
```

### Performance Optimization

Optimize expensive operations without manual caching logic:

```typescript
import { memoize, memoizeSync, batch } from '@logosdx/utils';

// Cache API responses
const fetchUserDetails = memoize(
    async (userId: string) => {
        const response = await fetch(`/api/users/${userId}`);
        return response.json();
    },
    {
        ttl: 300000, // 5 minutes
        keyGenerator: (userId) => `user:${userId}`,
        onEvict: (key, value) => metrics.increment('cache.eviction')
    }
);

// Batch process with controlled concurrency
async function enrichUserProfiles(userIds: string[]) {
    return batch(
        async (userId) => {
            const profile = await fetchUserDetails(userId);
            const score = calculateRiskScore(profile);
            return { ...profile, riskScore: score };
        },
        {
            items: userIds.map(id => [id]),
            concurrency: 10,
            onProgress: (completed, total) => {
                updateProgress(completed / total * 100);
            }
        }
    );
}
```


## Migration Guides

### Migrating from Lodash

```typescript
// ❌ Lodash (breaks with modern JS types)
import { cloneDeep, isEqual, merge, debounce } from 'lodash';

const state = new Map([['user', { permissions: new Set(['read']) }]]);
const broken = cloneDeep(state); // Returns {} - data lost!

// ✅ @logosdx/utils (handles all JS types)
import { clone, equals, merge, debounce } from '@logosdx/utils';

const state = new Map([['user', { permissions: new Set(['read']) }]]);
const perfect = clone(state); // Preserves Map and Set structures

// Migration mapping
// _.cloneDeep() → clone()
// _.isEqual() → equals()
// _.merge() → merge()
// _.debounce() → debounce()
// _.throttle() → throttle()
// _.memoize() → memoizeSync()
```

### Migrating from Try-Catch tAttempt Pattern**

```typescript
// ❌ Traditional try-catch pyramid
async function oldPattern() {
    try {
        const user = await fetchUser();
        try {
            const profile = await fetchProfile(user.id);
            try {
                return await mergeData(user, profile);
            } catch (e) {
                console.error('Merge failed');
                throw e;
            }
        } catch (e) {
            console.error('Profile fetch failed');
            throw e;
        }
    } catch (e) {
        console.error('User fetch failed');
        throw e;
    }
}

// ✅ Linear attempt pattern
import { attempt } from '@logosdx/utils';

async function newPattern() {
    const [user, userErr] = await attempt(() => fetchUser());
    if (userErr) {
        console.error('User fetch failed');
        return [null, userErr];
    }

    const [profile, profileErr] = await attempt(() => fetchProfile(user.id));
    if (profileErr) {
        console.error('Profile fetch failed');
        return [null, profileErr];
    }

    const [result, mergeErr] = await attempt(() => mergeData(user, profile));
    if (mergeErr) {
        console.error('Merge failed');
        return [null, mergeErr];
    }

    return [result, null];
}
```

### Migrating from Native Fetch tResilient Patterns**

```typescript
// ❌ Fragile fetch
async function oldFetch(url: string) {
    const response = await fetch(url); // No timeout, no retry
    if (!response.ok) throw new Error('Failed');
    return response.json();
}

// ✅ Production-ready fetch
import { composeFlow, attempt } from '@logosdx/utils';

const resilientFetch = composeFlow(fetch, {
    withTimeout: { timeout: 5000 },
    retry: { retries: 3, delay: 1000 }
});

async function newFetch(url: string) {
    const [response, error] = await attempt(() => resilientFetch(url));
    if (error) return handleError(error);

    const [data, parseError] = await attempt(() => response.json());
    if (parseError) return handleError(parseError);

    return data;
}
```

## Framework Integration Examples

### React Integration

```typescript
// React Hook with error boundaries
import { attempt, memoize } from '@logosdx/utils';
import { useState, useEffect } from 'react';

function useUserData(userId: string) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Memoized fetch to prevent duplicate requests
    const fetchUser = memoize(
        async (id: string) => {
            const response = await fetch(`/api/users/${id}`);
            if (!response.ok) throw new Error('Failed to fetch');
            return response.json();
        },
        { ttl: 300000 } // 5 minute cache
    );

    useEffect(() => {
        async function loadUser() {
            setLoading(true);
            const [user, err] = await attempt(() => fetchUser(userId));

            if (err) {
                setError(err);
                setData(null);
            } else {
                setData(user);
                setError(null);
            }

            setLoading(false);
        }

        loadUser();
    }, [userId]);

    return { data, error, loading, retry: () => loadUser() };
}

// Error Boundary Integration
class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        // Log to your error tracking service
        const [tracked, trackError] = attemptSync(() =>
            errorTracker.log(error, errorInfo)
        );

        if (trackError) {
            console.error('Failed to track error:', trackError);
        }
    }
}
```

### Next.js API Routes

```typescript
// pages/api/users/[id].ts
import { attempt, composeFlow } from '@logosdx/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create resilient database client
const resilientDB = composeFlow(dbQuery, {
    withTimeout: { timeout: 3000 },
    retry: { retries: 2, delay: 100 },
    circuitBreaker: { maxFailures: 10, resetAfter: 60000 }
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query;

    const [user, error] = await attempt(() =>
        resilientDB('SELECT * FROM users WHERE id = ?', [id])
    );

    if (error) {
        // Different responses based on error type
        if (error.name === 'CircuitBreakerOpen') {
            return res.status(503).json({
                error: 'Service temporarily unavailable'
            });
        }

        if (error.name === 'TimeoutError') {
            return res.status(504).json({
                error: 'Database timeout'
            });
        }

        // Generic error
        return res.status(500).json({
            error: 'Internal server error'
        });
    }

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
}
```

### Express Middleware

```typescript
import { rateLimit, attempt } from '@logosdx/utils';
import express from 'express';

const app = express();

// Rate limiting middleware
const createRateLimiter = (maxRequests: number, windowMs: number) => {
    const limiters = new Map();

    return async (req, res, next) => {
        const clientId = req.ip;

        if (!limiters.has(clientId)) {
            limiters.set(clientId, rateLimit(
                async () => next(),
                { maxCalls: maxRequests, windowMs }
            ));
        }

        const limiter = limiters.get(clientId);
        const [, error] = await attempt(() => limiter());

        if (error && error.message.includes('Rate limit exceeded')) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    };
};

// Apply to routes
app.use('/api/', createRateLimiter(100, 60000)); // 100 req/min

// Error handling middleware using attempt
app.use(async (err, req, res, next) => {
    const [logged, logError] = await attempt(() =>
        logger.error(err, { url: req.url, method: req.method })
    );

    if (logError) {
        console.error('Failed to log error:', logError);
    }

    res.status(500).json({ error: 'Internal server error' });
});
```

## Debugging Guide

### Debugging Retry Loops

```typescript
import { retry, attempt } from '@logosdx/utils';

// Add debugging callbacks
const debuggedRetry = (fn) => retry(fn, {
    retries: 3,
    delay: 1000,
    onRetry: (error, attemptNumber) => {
        console.log(`Retry ${attemptNumber} after error:`, error.message);
        console.trace(); // Stack trace for debugging
    }
});

// Use with DevTools conditional breakpoints
const [result, error] = await attempt(() => debuggedRetry(apiCall));
```

### Monitoring Circuit BreakeState**

```typescript
import { circuitBreaker } from '@logosdx/utils';

// Create observable circuit breaker
const breaker = circuitBreaker(apiCall, {
    maxFailures: 5,
    resetAfter: 30000,
    onOpen: () => {
        console.warn('Circuit breaker opened at', new Date());
        // Set breakpoint here in DevTools
        debugger;
    },
    onClose: () => console.log('Circuit breaker closed'),
    onHalfOpen: () => console.log('Circuit breaker testing recovery')
});

// Monitor state in console
Object.defineProperty(window, 'breakerState', {
    get: () => breaker.getState() // If implementation exposes state
});
```

### Performance Profiling

```typescript
// Profile batch operations
console.time('batch-processing');
const results = await batch(processItem, {
    items: items.map(i => [i]),
    concurrency: 10,
    onProgress: (completed, total) => {
        console.log(`Processed ${completed}/${total} items`);
    }
});
console.timeEnd('batch-processing');

// Memory profiling for memoization
if (performance.memory) {
    const before = performance.memory.usedJSHeapSize;
    const memoized = memoizeSync(expensiveFn, { maxSize: 1000 });

    // Run operations...

    const after = performance.memory.usedJSHeapSize;
    console.log(`Memory used by cache: ${(after - before) / 1024 / 1024}MB`);
}
```

## Configuration Best Practices

### Environment-Specific Settings

```typescript
// config/resilience.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const apiConfig = {
    timeout: isTest ? 100 : isDevelopment ? 5000 : 3000,
    retry: {
        retries: isTest ? 0 : isDevelopment ? 1 : 3,
        delay: isTest ? 0 : 1000,
        backoff: 2
    },
    circuitBreaker: {
        maxFailures: isDevelopment ? 20 : 5,
        resetAfter: isDevelopment ? 10000 : 30000
    }
};

// Usage
const resilientAPI = composeFlow(fetch, apiConfig);
```

### Service-SpecifiConfigurations**

```typescript
// Different settings for different services
const configs = {
    // Critical payment service - conservative settings
    payment: {
        timeout: 10000, // Longer timeout for financial
        retry: {
            retries: 5,
            shouldRetry: (err) => err.status >= 500 // Only server errors
        },
        circuitBreaker: {
            maxFailures: 3, // Open quickly to prevent cascading
            resetAfter: 60000 // Slower recovery
        }
    },

    // Analytics service - aggressive settings
    analytics: {
        timeout: 1000, // Fast fail
        retry: { retries: 1 }, // Minimal retries
        circuitBreaker: {
            maxFailures: 10, // Tolerate more failures
            resetAfter: 5000 // Quick recovery
        }
    },

    // User service - balanced settings
    users: {
        timeout: 3000,
        retry: {
            retries: 3,
            delay: 500,
            backoff: 2
        },
        rateLimit: {
            maxCalls: 100,
            windowMs: 60000
        }
    }
};

// Create service-specific clients
export const paymentAPI = composeFlow(fetch, configs.payment);
export const analyticsAPI = composeFlow(fetch, configs.analytics);
export const usersAPI = composeFlow(fetch, configs.users);
```

### Dynamic Configuration

```typescript
// Allow runtime configuration updates
class DynamicConfig {
    private config = new Map();

    set(service: string, settings: any) {
        this.config.set(service, settings);
        // Optionally persist to database/config service
    }

    get(service: string) {
        return this.config.get(service) || defaultConfigs[service];
    }

    createClient(service: string) {
        return composeFlow(fetch, this.get(service));
    }
}

export const config = new DynamicConfig();

// Update config without restart
config.set('payment', {
    ...config.get('payment'),
    timeout: 15000 // Increase timeout during high load
});
```
