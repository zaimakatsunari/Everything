import type { ConnectorManifest } from '../base';

export const manifest: ConnectorManifest = {
  id: 'claude',
  displayName: 'Claude',
  capabilities: [],
  phase: 3,
  notes: 'Planned connector module. MVP Phase 1 uses manual import/export where official sync APIs are not connected yet.'
};
