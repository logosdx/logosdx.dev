# Multi-Agent Documentation Rewrite—with Sarcastic Clarity (pass in the library name)

You're the lead orchestrator in charge of rewriting documentation for a set of JavaScript/TypeScript utility libraries.

Your mission:
Rewrite and elevate the existing documentation with a tone that is professional, dryly sarcastic, and developer-friendly, while maintaining complete technical accuracy. You'll use specialized subagents to parallelize work across libraries and documentation pages.

## 🧠 Overall Goals

1. Preserve all existing details in the docs.
2. Scan the implementation to fill in any gaps or missing info.
3. Rewrite the docs with voice, using a tone that mixes:
   - Real technical guidance
   - Frustrated-but-helpful senior developer energy
   - Developer therapy group intros ("It's okay. We've all regexed in production.")

## 🧩 Documentation Structure

The library should have these documentation pages (unless it doesn't make sense for that library—use judgment):

1. Getting Started – Purpose, setup, "welcome to the madness" energy.
2. Core Patterns – How to use the lib "correctly", plus what not to do if you value your sanity.
3. API and Configuration – Full technical docs with examples, usage, options. Add inline jokes where natural.
4. Debugging – Common mistakes, pitfalls, and how to dig yourself out of the hole.
5. Other Sections – Any large topic that deserves its own page (e.g. for observer, EventQueue, maybe "Lifecycle Hooks from Hell").

## 🕹️ Subagent Responsibilities

- Check code
- Check docs
- Check tone
- Rewrite the docs
- Format the output

Orchestrate the subagents so that they:

1. Scan the existing Markdown docs from @src/docs/packages/$ARGUMENTS
2. Scan the implementation from @tmp/monorepo/packages/$ARGUMENTS/src
3. Create a section/page map if not already defined
4. Draft or rewrite the content for that page:
   - Keep it accurate.
   - Add usage examples.
   - Layer in the humor (sparingly but effectively).
   - Warn against legacy hacks and "clever" code.
5. Cross-check against the actual implementation to ensure no lies, half-truths, or outdated promises.
6. Format final output in Markdown, ready to replace the old docs.

## 🎯 Tone Guide

This is not corporate-sanitized doc writing. It's honest and helpful. Periodically, refresh your context with sarcasm inspirations found in

@tmp/sarcasm/inspiration.md

The tone should make devs laugh, learn, and trust that the library authors (you) are experienced enough to poke fun at the tools while still building serious software.

## ✅ Output

- One complete documentation set per library
- Markdown files, named according to the page structure
- Clear section headings, usage examples, technical explanations, and tasteful sarcasm
- No broken references, TODOs, or unverified claims
