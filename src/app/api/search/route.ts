import { NextResponse } from 'next/server';
import { readData } from '@/lib/store';

interface SearchResult {
  project_id: string;
  project_name: string;
  type: string;
  title: string;
  excerpt: string;
  source?: string;
  updated_at?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim().toLowerCase();
  const data = await readData();
  if (!query) return NextResponse.json({ query, grouped: [] });

  const projectName = (projectId: string) => data.projects.find((project) => project.id === projectId)?.name ?? 'Unknown project';
  const results: SearchResult[] = [];
  const match = (...values: Array<string | undefined>) => values.some((value) => value?.toLowerCase().includes(query));
  const excerpt = (value: string) => {
    const index = value.toLowerCase().indexOf(query);
    if (index < 0) return value.slice(0, 180);
    return value.slice(Math.max(0, index - 70), index + query.length + 110);
  };

  for (const project of data.projects) {
    if (match(project.name, project.description, project.goal, project.summary, project.current_phase, project.next_actions.join(' '))) {
      results.push({ project_id: project.id, project_name: project.name, type: 'project', title: project.name, excerpt: excerpt(`${project.goal}\n${project.summary}`), updated_at: project.updated_at });
    }
  }
  for (const task of data.tasks) if (match(task.title, task.description, task.status, task.priority)) results.push({ project_id: task.project_id, project_name: projectName(task.project_id), type: 'task', title: task.title, excerpt: excerpt(`${task.title} ${task.description ?? ''}`), source: task.created_by, updated_at: task.updated_at });
  for (const note of data.notes) if (match(note.title, note.content)) results.push({ project_id: note.project_id, project_name: projectName(note.project_id), type: 'note', title: note.title, excerpt: excerpt(note.content), source: note.source, updated_at: note.created_at });
  for (const decision of data.decisions) if (match(decision.title, decision.rationale, decision.status)) results.push({ project_id: decision.project_id, project_name: projectName(decision.project_id), type: 'decision', title: decision.title, excerpt: excerpt(`${decision.title} ${decision.rationale ?? ''}`), source: decision.source, updated_at: decision.created_at });
  for (const document of data.documents) if (match(document.title, document.kind, document.content)) results.push({ project_id: document.project_id, project_name: projectName(document.project_id), type: 'document', title: document.title, excerpt: excerpt(document.content), source: document.author, updated_at: document.updated_at });
  for (const memory of data.memory) if (match(memory.category, memory.content)) results.push({ project_id: memory.project_id, project_name: projectName(memory.project_id), type: 'memory', title: memory.category, excerpt: excerpt(memory.content), source: memory.source, updated_at: memory.created_at });
  for (const conversation of data.conversations) if (match(conversation.title, conversation.provider, conversation.model, conversation.external_conversation_id)) results.push({ project_id: conversation.project_id, project_name: projectName(conversation.project_id), type: 'conversation', title: conversation.title, excerpt: `${conversation.provider} ${conversation.title}`, source: conversation.provider, updated_at: conversation.updated_at });
  for (const message of data.messages) {
    const conversation = data.conversations.find((item) => item.id === message.conversation_id);
    if (conversation && match(message.content)) results.push({ project_id: conversation.project_id, project_name: projectName(conversation.project_id), type: 'message', title: `${conversation.provider} ${message.role}`, excerpt: excerpt(message.content), source: conversation.provider, updated_at: message.timestamp });
  }
  for (const event of data.timeline_events) if (match(event.content, event.event_type, event.provider)) results.push({ project_id: event.project_id, project_name: projectName(event.project_id), type: 'timeline', title: event.event_type, excerpt: excerpt(event.content), source: event.provider, updated_at: event.timestamp });

  const grouped = Object.values(results.reduce<Record<string, { project_id: string; project_name: string; results: SearchResult[] }>>((acc, result) => {
    acc[result.project_id] ??= { project_id: result.project_id, project_name: result.project_name, results: [] };
    acc[result.project_id].results.push(result);
    return acc;
  }, {}));

  return NextResponse.json({ query, grouped, count: results.length });
}
