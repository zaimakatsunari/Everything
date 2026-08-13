-- Everything canonical PostgreSQL schema.
-- Phase 1 uses the same domain model through a local JSON adapter for preview convenience;
-- this schema is the PostgreSQL source-of-truth contract for production deployment.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planning',
  owner UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  current_phase TEXT NOT NULL DEFAULT 'Planning',
  summary TEXT NOT NULL DEFAULT '',
  next_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  automation_level TEXT NOT NULL DEFAULT 'semi_automatic'
);

CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE project_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'accepted',
  source TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_by TEXT NOT NULL,
  source_reference TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_dependencies (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'other',
  content TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_uri TEXT NOT NULL,
  source TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  conversation_id TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider_id, name)
);

CREATE TABLE ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  source_reference TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'suggested',
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE action_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES ai_actions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE timeline_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_reference TEXT
);

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  external_account_id TEXT,
  encrypted_credentials BYTEA,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE google_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, external_id TEXT NOT NULL, name TEXT NOT NULL, mime_type TEXT, web_url TEXT, hash TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE google_sheets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, external_id TEXT NOT NULL, title TEXT NOT NULL, web_url TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE google_sheet_rows (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sheet_id UUID REFERENCES google_sheets(id) ON DELETE CASCADE, external_row_id TEXT, row_data JSONB NOT NULL DEFAULT '{}'::jsonb, hash TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE google_docs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, external_id TEXT NOT NULL, title TEXT NOT NULL, web_url TEXT, hash TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE notion_pages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, external_id TEXT NOT NULL, title TEXT NOT NULL, web_url TEXT, hash TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE github_repositories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, owner TEXT NOT NULL, name TEXT NOT NULL, external_id TEXT, web_url TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE github_issues (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), repository_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE, number INTEGER NOT NULL, title TEXT NOT NULL, state TEXT NOT NULL, web_url TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE github_pull_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), repository_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE, number INTEGER NOT NULL, title TEXT NOT NULL, state TEXT NOT NULL, web_url TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE github_commits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), repository_id UUID REFERENCES github_repositories(id) ON DELETE CASCADE, sha TEXT NOT NULL, message TEXT NOT NULL, author TEXT, committed_at TIMESTAMPTZ);

CREATE TABLE tags (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE);
CREATE TABLE project_tags (project_id UUID REFERENCES projects(id) ON DELETE CASCADE, tag_id UUID REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(project_id, tag_id));
CREATE TABLE conversation_tags (conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE, tag_id UUID REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(conversation_id, tag_id));

CREATE TABLE context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_provider TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id UUID REFERENCES integration_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON projects(owner);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_timeline_project_timestamp ON timeline_events(project_id, timestamp DESC);
CREATE INDEX idx_memory_project_category ON project_memory(project_id, category);
CREATE INDEX idx_conversations_project_provider ON conversations(project_id, provider);
