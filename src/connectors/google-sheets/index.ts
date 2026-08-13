import type { ConnectorManifest } from '../base';

export const manifest: ConnectorManifest = {
  id: 'google-sheets',
  displayName: 'Google Sheets',
  capabilities: [],
  phase: 2,
  notes: 'Planned connector module. MVP Phase 1 uses manual import/export where official sync APIs are not connected yet.'
};
