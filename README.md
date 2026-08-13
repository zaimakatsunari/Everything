# Everything

**Everything** is a universal project operating system and shared memory layer for AI-powered work.

It is intentionally **not** another chatbot. The core principle is:

> The user owns the project and data. AI providers are workers that can come and go.

This repository currently implements a working **Phase 1 MVP** that proves the required handoff workflow: create a project, capture an idea, import provider conversations, extract useful project artifacts, and generate a fresh project context package for the next AI.

## What works in Phase 1

- Project dashboard
- Automatic project creation from an idea
- Canonical project record: goal, status, phase, summary, next actions
- Central tasks, notes, decisions, documents, memory, conversations, messages, actions, and timeline events
- Manual conversation import for Gemini, Claude, ChatGPT, Ollama, or Other
- Heuristic artifact extraction from AI conversations
- Internal action system for validated project changes
- Project context package / AI handoff prompt
- “Continue Project” workflow
- “What happened?” timeline view and API
- “What should I do next?” source-backed suggestions API
- Universal search across projects, tasks, documents, decisions, notes, memory, conversations, messages, and timeline events
- Human approval queue for important AI-suggested changes such as task completion
- JSON, CSV, and Markdown export
- PostgreSQL production schema contract in `db/schema.sql`
- Connector module layout in `src/connectors`

## Run locally

```bash
npm install
npm run dev
```

Open the app and click **Load acceptance-test demo** to see the scenario:

1. Online Clothing Business project exists.
2. Gemini market research is attached.
3. Gemini decision and research memory are recorded.
4. Claude continues from the project state.
5. ChatGPT continues from the updated project state.
6. Dashboard shows each AI contribution, tasks, documents, decisions, memory, and timeline.
7. **CONTINUE PROJECT** generates a provider-specific handoff prompt.

## Data storage

For preview convenience, Phase 1 uses a local JSON storage adapter at `data/everything.local.json`.

The production database contract is PostgreSQL and is defined in:

```text
db/schema.sql
```

The schema includes all requested core tables: users, projects, members, goals, requirements, decisions, memory, tasks, dependencies, notes, documents, files, conversations, messages, AI providers/models/actions, action results, timeline events, integrations, Google/Notion/GitHub surfaces, tags, context snapshots, sync/import jobs, and audit logs.

## Architecture

```text
src/app                 Next.js UI and API routes
src/lib/types.ts        Universal project/domain record types
src/lib/store.ts        Storage adapter used by the MVP
src/lib/extract.ts      Project/conversation artifact extraction
src/lib/actions.ts      Validated internal AI action layer
src/lib/context.ts      Project context package engine
src/connectors          Independent connector modules
 db/schema.sql          PostgreSQL schema contract
```

## Design notes

- Everything is the canonical source of truth.
- AI providers are replaceable workers.
- External tools are connected surfaces, never the central database.
- Important generated artifacts should become project records, not stay trapped in a chat transcript.
- No scraping or provider security bypass is used; the MVP starts with manual import/export and connector stubs for official integrations.
