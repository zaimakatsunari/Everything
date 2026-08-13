'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ContextPackage, Project, ProjectBundle, Provider } from '@/lib/types';

type ProviderOption = Extract<Provider, 'Gemini' | 'Claude' | 'ChatGPT' | 'Ollama' | 'Other'>;

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [contextPackage, setContextPackage] = useState<ContextPackage | null>(null);
  const [idea, setIdea] = useState('I want to build an online clothing business.');
  const [provider, setProvider] = useState<ProviderOption>('Gemini');
  const [targetProvider, setTargetProvider] = useState<ProviderOption>('Claude');
  const [conversation, setConversation] = useState('Market research suggests focusing on a clear clothing niche, comparing competitor pricing, and validating demand on TikTok. We decided to use Shopify for the store. Tasks: compare 10 competitor stores, define the target customer, and shortlist suppliers. What is the first launch collection?');
  const [searchQuery, setSearchQuery] = useState('Shopify');
  const [searchResults, setSearchResults] = useState<Array<{ project_id: string; project_name: string; results: Array<{ type: string; title: string; excerpt: string; source?: string }> }>>([]);
  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedId), [projects, selectedId]);

  async function refreshProjects(nextSelectedId?: string) {
    const response = await fetch('/api/projects');
    const json = await response.json();
    setProjects(json.projects);
    const next = nextSelectedId || selectedId || json.projects[0]?.id || '';
    if (next) setSelectedId(next);
  }

  async function refreshBundle(id = selectedId) {
    if (!id) return;
    const response = await fetch(`/api/projects/${id}`);
    const json = await response.json();
    setBundle(json);
  }

  useEffect(() => {
    refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) {
      refreshBundle(selectedId);
      setContextPackage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function createProject() {
    const response = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea }) });
    const json = await response.json();
    await refreshProjects(json.project.id);
    await refreshBundle(json.project.id);
  }

  async function loadDemo() {
    const response = await fetch('/api/demo', { method: 'POST' });
    const json = await response.json();
    await refreshProjects(json.project_id);
    await refreshBundle(json.project_id);
  }

  async function importConversation() {
    if (!selectedId) return;
    await fetch('/api/conversations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedId,
        provider,
        title: `${provider} project work`,
        user_message: `Continue work on ${selectedProject?.name ?? 'this project'}.`,
        assistant_message: conversation
      })
    });
    await refreshBundle();
  }

  async function continueProject(nextProvider = targetProvider) {
    if (!selectedId) return;
    const response = await fetch(`/api/projects/${selectedId}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: nextProvider })
    });
    const json = await response.json();
    setContextPackage(json);
  }

  async function runSearch() {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    const json = await response.json();
    setSearchResults(json.grouped ?? []);
  }

  async function approveAction(actionId: string) {
    await fetch(`/api/actions/${actionId}/approve`, { method: 'POST' });
    await refreshBundle();
  }

  async function rejectAction(actionId: string) {
    await fetch(`/api/actions/${actionId}/reject`, { method: 'POST' });
    await refreshBundle();
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">EVERYTHING</div>
        <div className="tagline">One workspace, canonical project memory, replaceable AI workers.</div>
        <nav className="nav">
          {['Dashboard', 'My Projects', 'AI Chat', 'Conversations', 'Tasks', 'Documents', 'Files', 'Memory', 'Timeline', 'Search', 'Workflows', 'Integrations', 'Settings'].map((item) => (
            <span key={item} className={item === 'Dashboard' ? 'active' : ''}>{item}</span>
          ))}
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <div className="card">
            <span className="pill">Phase 1 MVP</span>
            <h1>A universal project OS for AI handoff.</h1>
            <p className="muted">Create a project once, import work from Gemini, Claude, ChatGPT, or Ollama, and let Everything assemble the fresh context package for the next AI.</p>
            <div className="row">
              <button className="btn" onClick={loadDemo}>Load acceptance-test demo</button>
              <a className="btn secondary" href="/api/export" target="_blank">Export JSON</a>
              <a className="btn secondary" href="/api/export?format=markdown" target="_blank">Export Markdown</a>
              <a className="btn secondary" href="/api/export?format=csv" target="_blank">Export CSV</a>
            </div>
          </div>
          <div className="card grid three">
            <div className="stat"><strong>{projects.length}</strong><span className="muted">Projects</span></div>
            <div className="stat"><strong>{bundle?.conversations.length ?? 0}</strong><span className="muted">AI conversations</span></div>
            <div className="stat"><strong>{bundle?.timeline.length ?? 0}</strong><span className="muted">Timeline events</span></div>
          </div>
        </section>

        <section className="columns">
          <div className="grid">
            <div className="card">
              <h2>Create project from idea</h2>
              <p className="muted">Everything extracts project state: goal, tasks, notes, document, memory, and timeline.</p>
              <textarea value={idea} onChange={(event) => setIdea(event.target.value)} />
              <div style={{ height: 10 }} />
              <button className="btn" onClick={createProject}>Create / capture idea</button>
            </div>

            <div className="card">
              <h2>Projects</h2>
              <div className="list">
                {projects.map((project) => (
                  <button key={project.id} className={`item ${project.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(project.id)} style={{ textAlign: 'left', color: 'inherit' }}>
                    <div className="item-title">{project.name}</div>
                    <div className="muted">{project.current_phase} · {project.status}</div>
                  </button>
                ))}
                {!projects.length && <div className="muted">No projects yet. Create one or load the demo.</div>}
              </div>
            </div>

            <div className="card">
              <h2>Manual AI import</h2>
              <p className="muted">MVP import simulates technically supported provider sync/export without scraping or bypassing security.</p>
              <select value={provider} onChange={(event) => setProvider(event.target.value as ProviderOption)}>
                {['Gemini', 'Claude', 'ChatGPT', 'Ollama', 'Other'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div style={{ height: 10 }} />
              <textarea value={conversation} onChange={(event) => setConversation(event.target.value)} />
              <div style={{ height: 10 }} />
              <button className="btn" onClick={importConversation} disabled={!selectedId}>Import conversation and extract artifacts</button>
            </div>

            <div className="card">
              <h2>Universal Search</h2>
              <p className="muted">Search projects, tasks, documents, decisions, notes, memory, conversations, messages, and timeline events.</p>
              <div className="row">
                <input className="input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} />
                <button className="btn" onClick={runSearch}>Search</button>
              </div>
              <div className="list" style={{ marginTop: 12 }}>
                {searchResults.map((group) => (
                  <div className="item" key={group.project_id}>
                    <div className="item-title">{group.project_name}</div>
                    {group.results.slice(0, 5).map((result, index) => (
                      <div key={`${result.type}-${index}`} className="muted">{result.type}: {result.title} — {result.excerpt}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid">
            {bundle && (
              <ProjectDashboard bundle={bundle} onContinue={continueProject} targetProvider={targetProvider} setTargetProvider={setTargetProvider} approveAction={approveAction} rejectAction={rejectAction} />
            )}

            {contextPackage && (
              <div className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <span className="pill">Continue Project Package</span>
                    <h2>Send this to {contextPackage.target_provider}</h2>
                  </div>
                  <button className="btn small secondary" onClick={() => navigator.clipboard.writeText(contextPackage.handoff_prompt)}>Copy handoff prompt</button>
                </div>
                <pre>{contextPackage.handoff_prompt}</pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ProjectDashboard({ bundle, onContinue, targetProvider, setTargetProvider, approveAction, rejectAction }: { bundle: ProjectBundle; onContinue: (provider?: ProviderOption) => void; targetProvider: ProviderOption; setTargetProvider: (provider: ProviderOption) => void; approveAction: (actionId: string) => void; rejectAction: (actionId: string) => void }) {
  const active = bundle.tasks.filter((task) => task.status !== 'done');
  const completed = bundle.tasks.filter((task) => task.status === 'done');
  const providers = Array.from(new Set(bundle.conversations.map((conversation) => conversation.provider)));
  return (
    <div className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="pill">Project Dashboard</span>
            <h1>{bundle.project.name}</h1>
          </div>
          <div className="row">
            <select value={targetProvider} onChange={(event) => setTargetProvider(event.target.value as ProviderOption)}>
              {['Claude', 'ChatGPT', 'Gemini', 'Ollama', 'Other'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <button className="btn" onClick={() => onContinue()}>CONTINUE PROJECT</button>
          </div>
        </div>
        <p>{bundle.project.goal}</p>
        <p className="muted">{bundle.project.summary}</p>
        <div className="grid three">
          <div className="stat"><strong>{active.length}</strong><span className="muted">Active tasks</span></div>
          <div className="stat"><strong>{completed.length}</strong><span className="muted">Completed</span></div>
          <div className="stat"><strong>{providers.length}</strong><span className="muted">AI providers</span></div>
        </div>
      </div>

      <div className="grid two">
        <Panel title="Tasks" items={bundle.tasks.map((task) => `${task.title} — ${task.status} (${task.created_by})`)} empty="No tasks yet." />
        <Panel title="Decisions" items={bundle.decisions.map((decision) => `${decision.title} — ${decision.source}`)} empty="No decisions yet." />
        <Panel title="Documents" items={bundle.documents.map((document) => `${document.title} — ${document.kind} (${document.author})`)} empty="No documents yet." />
        <Panel title="Project Memory" items={bundle.memory.map((memory) => `${memory.category}: ${memory.content} — ${memory.source}`)} empty="No memory yet." />
      </div>

      <div className="card">
        <h2>AI History</h2>
        <div className="list">
          {bundle.conversations.map((conversation) => (
            <div className="item" key={conversation.id}>
              <div className="item-title">{conversation.provider}: {conversation.title}</div>
              <div className="muted">{new Date(conversation.updated_at).toLocaleString()} · source: {conversation.source}</div>
            </div>
          ))}
          {!bundle.conversations.length && <div className="muted">No conversations imported.</div>}
        </div>
      </div>

      <div className="card">
        <h2>Action Log & Human Approval</h2>
        <p className="muted">Safe actions can complete automatically. Important state changes, such as completing tasks, are suggested first in semi-automatic mode.</p>
        <div className="list">
          {bundle.ai_actions.slice().reverse().slice(0, 12).map((action) => (
            <div className="item" key={action.id}>
              <div className="item-title">{action.action} · {action.status}</div>
              <div className="muted">Requested by {action.requested_by} · {action.result ?? 'No result yet'}</div>
              {action.status === 'suggested' && (
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn small" onClick={() => approveAction(action.id)}>Confirm</button>
                  <button className="btn small secondary" onClick={() => rejectAction(action.id)}>Reject</button>
                  <button className="btn small secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(action.payload, null, 2))}>Copy/Edit Payload</button>
                </div>
              )}
            </div>
          ))}
          {!bundle.ai_actions.length && <div className="muted">No actions yet.</div>}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>What happened?</h2>
          <button className="btn small secondary" onClick={() => onContinue(targetProvider)}>What should I do next?</button>
        </div>
        <div className="timeline">
          {bundle.timeline.map((event) => (
            <div className="event" key={event.event_id}>
              <div className="item-title">{event.provider} · {event.event_type}</div>
              <div>{event.content}</div>
              <div className="muted">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="list">
        {items.slice(0, 8).map((item) => <div className="item" key={item}>{item}</div>)}
        {!items.length && <div className="muted">{empty}</div>}
      </div>
    </div>
  );
}
