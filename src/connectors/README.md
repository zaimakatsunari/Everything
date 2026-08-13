# Connector Architecture

Connectors are intentionally independent modules. Everything remains the source of truth; connectors are external work surfaces.

Phase 1 ships manual conversation import and the internal action/context system. Phase 2+ modules will add OAuth, read/search/create/update/sync/webhook/disconnect only where officially supported by each provider.
