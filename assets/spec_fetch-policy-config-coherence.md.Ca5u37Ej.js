import{_ as t,c as n,o,a7 as i}from"./chunks/framework.BVGSIcOn.js";const p=JSON.parse('{"title":"Fetch policy config coherence","description":"","frontmatter":{},"headers":[],"relativePath":"spec/fetch-policy-config-coherence.md","filePath":"spec/fetch-policy-config-coherence.md"}'),r={name:"spec/fetch-policy-config-coherence.md"};function a(s,e,c,l,d,h){return o(),n("div",null,[...e[0]||(e[0]=[i(`<h1 id="fetch-policy-config-coherence" tabindex="-1">Fetch policy config coherence <a class="header-anchor" href="#fetch-policy-config-coherence" aria-label="Permalink to “Fetch policy config coherence”">​</a></h1><h2 id="goal" tabindex="-1">Goal <a class="header-anchor" href="#goal" aria-label="Permalink to “Goal”">​</a></h2><p>Every FetchEngine config surface — runtime <code>config.set()</code>, per-call overrides, response metadata, convenience methods, and construction-time policy keys — drives the same behavior it reports. No path lets config say one thing while the request does another.</p><h2 id="non-goals" tabindex="-1">Non-goals <a class="header-anchor" href="#non-goals" aria-label="Permalink to “Non-goals”">​</a></h2><ul><li>No per-call <code>skipDedupe</code> / <code>skipRateLimit</code> options.</li><li>No extraction of the attempt-timeout machinery out of the retry plugin.</li><li>No runtime mutation surface for custom (non-policy) plugins.</li><li><code>@logosdx/utils</code> changes limited to the <code>PathValue</code> union-distribution fix (dotted paths into keys typed as <code>Config | false</code> currently resolve to <code>never</code>); no other utils surface changes.</li></ul><h2 id="success-criteria" tabindex="-1">Success criteria <a class="header-anchor" href="#success-criteria" aria-label="Permalink to “Success criteria”">​</a></h2><ul><li>[ ] <code>FetchPlugin</code> gains an optional <code>reconfigure</code> member; a plugin that doesn&#39;t implement it is unaffected by a <code>config.set()</code> targeting its key.</li><li>[ ] A runtime <code>config.set()</code> of a policy key whose plugin was installed via the <code>plugins:</code> array throws, matching the construction-time ownership rule.</li><li>[ ] <code>config.set(&#39;retry.maxAttempts&#39;, …)</code> after construction changes the attempt count used on the next request.</li><li>[ ] <code>config.set()</code> against rate-limit, cache, or dedupe config rebuilds that policy&#39;s rule cache/state per its existing <code>init()</code> semantics (e.g. a new rate-limit budget produces fresh buckets).</li><li>[ ] <code>config.set()</code> against the cache plugin&#39;s TTLs, rules, or methods reconfigures in place without evicting entries already in the request-flight store; a <code>config.set()</code> that changes the cache plugin&#39;s adapter throws before the store mutates, leaving <code>config.get(&#39;cachePolicy&#39;)</code> reporting the prior value.</li><li>[ ] <code>config.set(&#39;retry.maxAttempts&#39;, …)</code> and every other documented dotted policy path typechecks — the tests workspace <code>tsc --noEmit</code> is green.</li><li>[ ] <code>attemptTimeout</code> aborts an individual attempt under <code>retry: false</code> (or <code>maxAttempts: 0</code>) the same way it does when retrying is enabled.</li><li>[ ] <code>clearCache</code>, <code>clearCacheKey</code>, <code>deleteCache</code>, <code>invalidateCache</code>, <code>invalidatePath</code>, and <code>cacheStats</code> operate correctly when the cache/dedupe plugin is installed via the <code>plugins:</code> array or a post-construction <code>engine.use()</code> call, instead of only the config key.</li><li>[ ] <code>res.config.retry</code> on a response reflects the retry configuration actually used for that request, including a per-call override.</li><li>[ ] A falsy explicit config key (e.g. <code>dedupePolicy: false</code>) plus the same-name plugin in <code>plugins:</code> warns once at construction and installs the plugin, instead of throwing.</li><li>[ ] A truthy explicit config key plus the same-name plugin still throws at construction.</li></ul><h2 id="approach" tabindex="-1">Approach <a class="header-anchor" href="#approach" aria-label="Permalink to “Approach”">​</a></h2><p>Optional <code>reconfigure</code> hook on <code>FetchPlugin</code>, invoked by the engine on its own <code>config-change</code> event; each divergence point (F2-F5) fixed at its own source — see <code>docs/design/fetch-policy-config-coherence.md</code>.</p><h2 id="change-tree" tabindex="-1">Change tree <a class="header-anchor" href="#change-tree" aria-label="Permalink to “Change tree”">​</a></h2><pre><code>packages/utils/src/
└── types.ts .................... M  (PathValue distributes over object unions with primitive members)

packages/fetch/src/
├── engine/
│   ├── types.ts ................ M  (FetchPlugin: optional reconfigure member + optional pre-mutation reconfigure guard)
│   ├── index.ts ................ M  (config-change subscription + routing; runtime ownership-conflict throw; #cachePlugin/#dedupePlugin refs captured from any install path; falsy-key + plugin warns instead of throwing)
│   └── executor.ts ............. M  (response config attachment uses the per-request resolved retry config)
└── plugins/
    ├── retry.ts ................ M  (reconfigure; zero-attempts path normalized through per-attempt wiring; resolution reused for response metadata)
    ├── rate-limit.ts ........... M  (reconfigure)
    ├── cache.ts ................ M  (reconfigure)
    ├── dedupe.ts ................ M  (reconfigure)
    └── cookies/plugin.ts ....... M  (reconfigure)

tests/src/fetch/
├── engine/plugin-resolution.test.ts ....... M  (runtime set() ownership conflict; convenience methods across install paths; falsy-key + plugin warns and installs)
├── engine/configuration.test.ts ........... M  (config.set() changes behavior per policy; cache TTLs/rules/methods survive in place; adapter-changing set() throws)
├── executor/retry.test.ts ................. M  (attemptTimeout fires under retry: false)
└── executor/per-call-overrides.test.ts .... M  (res.config.retry reflects the per-call resolved retry config)
</code></pre><h2 id="outline" tabindex="-1">Outline <a class="header-anchor" href="#outline" aria-label="Permalink to “Outline”">​</a></h2><pre><code>packages/utils/src/types.ts
  PathValue — dotted-path resolution distributes over unions so a key typed as Config | false resolves to its object member&#39;s paths instead of never

packages/fetch/src/engine/types.ts
  FetchPlugin
    reconfigure — optional; invoked when the plugin&#39;s owned config key changes
    reconfigure guard — optional; consulted by the engine&#39;s pre-mutation validation to reject an unacceptable new value before the store commits

packages/fetch/src/engine/index.ts
  config-change subscription — routes a changed policy key to its installed plugin&#39;s reconfigure
  ownership-conflict check on set() — pre-mutation validator; throws when the changed key&#39;s plugin came from the plugins: array, mirroring the construction-time rule
  reconfigure guard on set() — pre-mutation validator consults the owning plugin&#39;s guard where one exists (cache adapter construction-only check), so a rejected set() never commits
  #resolvePlugins / #buildPluginsFromOptions — capture cache/dedupe plugin refs regardless of install path
  use() ref capture — captures #cachePlugin/#dedupePlugin refs when the matching plugin is installed post-construction via use()
  falsy/truthy construction conflict check — distinguishes falsy from truthy explicit keys: falsy + same-name plugin warns once and installs; truthy + same-name plugin still throws

packages/fetch/src/engine/executor.ts
  response config attachment — reports the retry config actually resolved for the current request instead of the engine-level default

packages/fetch/src/plugins/retry.ts
  resolveRetryConfig — merges a per-call override over the current base config; reused by the executor&#39;s response metadata
  reconfigure — replaces the resolved base config when the retry key changes
  zero-attempts path — runs through the same per-attempt controller/timer wiring as the retry loop, so attemptTimeout always applies

packages/fetch/src/plugins/rate-limit.ts
  RateLimitPolicy
    reconfigure — re-runs init() with the updated config, rebuilding rule cache and token buckets

packages/fetch/src/plugins/cache.ts
  cachePlugin
    reconfigure — re-runs CachePolicy.init() with updated TTLs, rules, and methods; the wrapped SingleFlight store survives untouched
    adapter guard — exposed to the engine&#39;s pre-mutation validation: rejects an update that changes the adapter, since SingleFlight binds its adapter at construction and cannot swap stores without dropping entries

packages/fetch/src/plugins/dedupe.ts
  DedupePolicy
    reconfigure — re-runs init() with the updated config, rebuilding rule cache

packages/fetch/src/plugins/cookies/plugin.ts
  reconfigure — applies an updated adapter/syncOnRequest/exclude without clearing the existing jar

tests/src/fetch/engine/plugin-resolution.test.ts
  runtime set() on a plugins:-owned policy key throws
  cache/dedupe convenience methods work when installed via plugins: array or a post-construction use() call
  falsy config key + same-name plugin warns and installs; truthy key + plugin still throws

tests/src/fetch/engine/configuration.test.ts
  config.set() on retry/rate-limit/cache/dedupe changes behavior on the next request
  cache entries survive a config.set() against TTLs, rules, or methods
  config.set() that changes the cache adapter throws

tests/src/fetch/executor/retry.test.ts
  attemptTimeout aborts an attempt under retry: false / maxAttempts: 0

tests/src/fetch/executor/per-call-overrides.test.ts
  res.config.retry reflects a per-call retry override
</code></pre><h2 id="flows" tabindex="-1">Flows <a class="header-anchor" href="#flows" aria-label="Permalink to “Flows”">​</a></h2><pre><code>Flow: runtime policy reconfiguration
1. caller calls engine.config.set(...) on a policy key (retry, rate-limit, cache, dedupe, or cookies)
2. ConfigStore runs pre-set validators BEFORE mutating: the engine validates every changed policy key — a plugins:-array-owned key throws the ownership-conflict error; a cachePolicy value that changes the adapter throws (the adapter is construction-only; a new adapter requires a new engine)
3. validation passing, ConfigStore commits the new value and emits config-change
4. the engine&#39;s config-change listener routes each changed policy key to the owning plugin&#39;s reconfigure
5. the plugin rebuilds via its existing init() (or, for retry, replaces its resolved base config); subsequent requests observe the new behavior
6. any validation throw leaves the store unchanged — config.get() keeps reporting the pre-set value, for every key in the set() including multi-key merges

Flow: attemptTimeout fires with retrying disabled
1. caller sets retry: false (engine-level or per-call), which resolves to maxAttempts: 0
2. the request enters the retry plugin&#39;s execute hook with attemptTimeout set
3. the zero-attempts path runs through the same per-attempt controller/timer wiring the multi-attempt loop uses
4. the attempt aborts at attemptTimeout regardless of retry count; the resulting error carries timedOut: true

Flow: cache/dedupe convenience methods across install paths
1. the cache or dedupe plugin is installed via its config key, the plugins: array, or a post-construction use() call
2. plugin resolution captures a reference to the installed plugin regardless of which path supplied it
3. caller invokes a convenience method (e.g. clearCache, cacheStats)
4. the method operates against the captured reference instead of silently no-oping

Flow: response retry metadata matches request behavior
1. caller issues a request with (or without) a per-call retry override
2. the executor resolves the effective retry config for that request using the same resolution the retry plugin applies
3. the response&#39;s config.retry field is populated with that resolved value
4. the reported config always matches the retry behavior the request actually ran with

Flow: falsy config key with a same-name plugin
1. caller constructs an engine with a falsy explicit policy key (e.g. dedupePolicy: false) and a same-name plugin in plugins:
2. plugin resolution sees the key configured nothing and the same-name plugin present
3. a warning is logged once, naming the key and the plugin
4. the plugin installs and becomes the sole owner of that policy; construction does not throw
</code></pre><h2 id="checkpoints" tabindex="-1">Checkpoints <a class="header-anchor" href="#checkpoints" aria-label="Permalink to “Checkpoints”">​</a></h2><table tabindex="0"><thead><tr><th>#</th><th>Checkpoint</th><th>Files/areas</th><th>Agent</th><th>Est. files</th><th>Verifies</th></tr></thead><tbody><tr><td>1</td><td>F1 — reconfigure plumbing: plugin contract member, engine subscription, runtime ownership-conflict throw</td><td><code>engine/types.ts</code>, <code>engine/index.ts</code>, <code>tests/.../engine/plugin-resolution.test.ts</code></td><td>atomic-implementer (mode: feature)</td><td>~3</td><td>runtime <code>set()</code> on a <code>plugins:</code>-owned policy key throws; a plugin without <code>reconfigure</code> is unaffected</td></tr><tr><td>2</td><td>F1 — per-policy reconfigure wiring: retry, rate-limit, cache, dedupe, cookies</td><td><code>plugins/retry.ts</code>, <code>plugins/rate-limit.ts</code>, <code>plugins/cache.ts</code>, <code>plugins/dedupe.ts</code>, <code>plugins/cookies/plugin.ts</code>, <code>tests/.../engine/configuration.test.ts</code></td><td>atomic-implementer (mode: feature)</td><td>~6</td><td><code>config.set()</code> on each policy key changes behavior on the next request; cache TTLs/rules/methods reconfigure in place while the store survives; a <code>config.set()</code> that changes the cache adapter throws</td></tr><tr><td>3</td><td>F2 — attemptTimeout wired through the zero-attempts retry path</td><td><code>plugins/retry.ts</code>, <code>tests/.../executor/retry.test.ts</code></td><td>atomic-implementer (mode: surgical)</td><td>~2</td><td><code>attemptTimeout</code> aborts an attempt under <code>retry: false</code> the same way it does under retrying</td></tr><tr><td>4</td><td>F3 — cache/dedupe convenience methods work for any install path</td><td><code>engine/index.ts</code>, <code>tests/.../engine/plugin-resolution.test.ts</code></td><td>atomic-implementer (mode: surgical)</td><td>~2</td><td>convenience methods act on the plugin regardless of whether it came from a config key, <code>plugins:</code>, or a post-construction <code>use()</code> call</td></tr><tr><td>5</td><td>F4 — response retry metadata matches per-request resolution</td><td><code>engine/executor.ts</code>, <code>plugins/retry.ts</code>, <code>tests/.../executor/per-call-overrides.test.ts</code></td><td>atomic-implementer (mode: surgical)</td><td>~3</td><td><code>res.config.retry</code> reflects the per-call resolved retry config, not the engine default</td></tr><tr><td>6</td><td>F5 — falsy config key + same-name plugin warns and installs</td><td><code>engine/index.ts</code>, <code>tests/.../engine/plugin-resolution.test.ts</code></td><td>atomic-implementer (mode: surgical)</td><td>~2</td><td>falsy key + same-name plugin warns once and installs; truthy key + plugin still throws</td></tr></tbody></table><h2 id="risks" tabindex="-1">Risks <a class="header-anchor" href="#risks" aria-label="Permalink to “Risks”">​</a></h2><table tabindex="0"><thead><tr><th>Risk</th><th>Likelihood</th><th>Mitigation</th></tr></thead><tbody><tr><td>Reconfiguring a policy mid-flight changes behavior for requests already in progress</td><td>med</td><td>requests resolve their own options at start; reconfigure rebuilds state for requests started after the <code>set()</code> call, not in-flight ones</td></tr><tr><td>cookies <code>reconfigure</code> accidentally clears cookies already loaded into the jar</td><td>med</td><td>reconfigure replaces only adapter/syncOnRequest/exclude; the jar&#39;s contents are left untouched</td></tr><tr><td>Sharing retry resolution between the plugin and the executor drifts apart over time</td><td>low</td><td>both call sites resolve through the same function/state; checkpoint 5&#39;s test asserts the reported config equals the config the request ran with</td></tr><tr><td>New test-server ports collide with existing allocations</td><td>low</td><td>existing suite uses 4121-4142 and 4300-4303; new tests pick unused ports outside that range</td></tr></tbody></table><h2 id="change-log" tabindex="-1">Change log <a class="header-anchor" href="#change-log" aria-label="Permalink to “Change log”">​</a></h2><h3 id="_2026-07-11-—-pre-mutation-validation-everywhere-narrow-utils-exception" tabindex="-1">2026-07-11 — Pre-mutation validation everywhere; narrow utils exception <a class="header-anchor" href="#_2026-07-11-—-pre-mutation-validation-everywhere-narrow-utils-exception" aria-label="Permalink to “2026-07-11 — Pre-mutation validation everywhere; narrow utils exception”">​</a></h3><p><strong>What changed:</strong> Flow 1 rewritten: all runtime-set validation (ownership conflict AND the cache adapter construction-only guard) runs in ConfigStore&#39;s pre-set validators, before the store mutates; a rejected <code>set()</code> — single-key or multi-key merge — commits nothing. The cache adapter guard moved from inside <code>reconfigure()</code> to a plugin-exposed guard consulted pre-mutation (Outline: engine/types.ts, engine/index.ts, cache.ts). Success criteria tightened accordingly. Non-goals: the blanket &quot;no <code>@logosdx/utils</code> changes&quot; narrowed to permit the <code>PathValue</code> union-distribution fix, and a criterion added that documented dotted policy paths typecheck.</p><p><strong>Why:</strong> Iteration 3 review reproduced a throw-after-mutate coherence violation via the adapter guard placement the original Flow literally prescribed, and surfaced that <code>config.set(&#39;retry.maxAttempts&#39;, …)</code> — the API this spec exists to make real — fails to typecheck because <code>PathValue</code> collapses <code>RetryConfig | false</code> to <code>never</code>.</p><p><strong>Superseded:</strong> Flow 1&#39;s post-mutation validation ordering (store commits, then the listener throws) and the unconditional utils non-goal.</p><h2 id="implementation-log" tabindex="-1">Implementation log <a class="header-anchor" href="#implementation-log" aria-label="Permalink to “Implementation log”">​</a></h2><h3 id="shipped-—-2026-07-11" tabindex="-1">shipped — 2026-07-11 <a class="header-anchor" href="#shipped-—-2026-07-11" aria-label="Permalink to “shipped — 2026-07-11”">​</a></h3><p>Built across 7 iterations of /subagent-implementation. Commits (chronological):</p><ul><li><code>436ae68</code> — CP-1 reconfigure plumbing: FetchPlugin.reconfigure, engine routing, pre-mutation ownership validation (ConfigStore.onBeforeSet)</li><li><code>5c35d91</code> — CP-2 per-policy reconfigure on all five plugins; cache adapter guard pre-mutation; utils PathValue union-distribution fix</li><li><code>5087874</code> — CP-3 attemptTimeout fires when retrying is disabled (shared runAttempt wiring)</li><li><code>b3a45a1</code> — CP-4/5/6 convenience refs across install paths; per-request retry metadata; falsy-key + plugin warns and installs</li><li><code>0794385</code> — polish: follow-ups F-2..F-9 closed</li></ul><p><strong>Out-of-scope work performed during this build:</strong></p><ul><li><code>FetchConfig.retry</code> tightened to <code>Required&lt;RetryConfig&gt;</code> (CP-5) — the field was always fully resolved at runtime; the shared-resolution change made the type mismatch visible.</li></ul><p><strong>Unforeseens — surprises that emerged during implementation:</strong></p><ul><li>The spec&#39;s original Flow 1 prescribed post-mutation validation; iteration-3 review reproduced a throw-after-mutate store corruption through it. Spec amended (see Change log) to pre-mutation validation everywhere.</li><li><code>config.set(&#39;retry.maxAttempts&#39;, …)</code> — the API this spec exists to make real — failed to typecheck (<code>PathValue</code> collapsed <code>RetryConfig | false</code> to <code>never</code>); the utils non-goal was narrowed to permit the fix.</li></ul><p><strong>Deferred items still open:</strong></p><ul><li>none — all nine loop follow-ups (F-1..F-9) fixed in-loop per user triage (fix-all-now).</li></ul>`,34)])])}const g=t(r,[["render",a]]);export{p as __pageData,g as default};
