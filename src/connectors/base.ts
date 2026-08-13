export type ConnectorCapability = 'authentication' | 'read' | 'search' | 'create' | 'update' | 'sync' | 'webhook' | 'disconnect';

export interface ConnectorManifest {
  id: string;
  displayName: string;
  capabilities: ConnectorCapability[];
  phase: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface Connector {
  manifest: ConnectorManifest;
  authenticate?: () => Promise<void>;
  search?: (query: string) => Promise<unknown[]>;
  sync?: () => Promise<{ imported: number; updated: number; skipped: number }>;
  disconnect?: () => Promise<void>;
}
