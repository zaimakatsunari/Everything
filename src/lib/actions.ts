import { z } from 'zod';
import type { AiAction, DocumentRecord, EverythingData, EventType, Provider, TimelineEvent } from './types';
import { id, now } from './store';

const BaseActionSchema = z.object({
  action: z.string(),
  project_id: z.string().optional(),
  requested_by: z.enum(['Everything', 'Gemini', 'Claude', 'ChatGPT', 'Ollama', 'Other']),
  source_reference: z.string().optional(),
  payload: z.record(z.unknown()).default({})
});

export function createTimelineEvent(input: {
  project_id: string;
  provider: Provider;
  event_type: EventType;
  content: string;
  actor?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  source_reference?: string;
}): TimelineEvent {
  return {
    event_id: id('evt'),
    user_id: 'user_demo',
    project_id: input.project_id,
    source: input.source ?? input.provider,
    provider: input.provider,
    event_type: input.event_type,
    timestamp: now(),
    actor: input.actor ?? input.provider,
    content: input.content,
    metadata: input.metadata ?? {},
    source_reference: input.source_reference
  };
}

export function buildAction(input: Omit<AiAction, 'id' | 'created_at' | 'status'> & { status?: AiAction['status'] }): AiAction {
  return {
    id: id('act'),
    created_at: now(),
    status: input.status ?? 'suggested',
    ...input
  };
}

export function executeAction(data: EverythingData, rawAction: unknown): AiAction {
  const parsed = BaseActionSchema.parse(rawAction);
  const action = buildAction({
    action: parsed.action as AiAction['action'],
    project_id: parsed.project_id,
    requested_by: parsed.requested_by,
    source_reference: parsed.source_reference,
    payload: parsed.payload,
    status: 'completed'
  });

  const payload = parsed.payload as Record<string, string>;
  const projectId = parsed.project_id ?? payload.project_id;
  const project = projectId ? data.projects.find((item) => item.id === projectId) : undefined;

  try {
    switch (parsed.action) {
      case 'create_task': {
        if (!project) throw new Error('Project is required for create_task');
        const task = {
          id: id('task'),
          project_id: project.id,
          title: payload.title ?? 'Untitled task',
          description: payload.description,
          status: 'todo' as const,
          priority: (payload.priority as 'low' | 'medium' | 'high' | 'urgent') ?? 'medium',
          created_by: parsed.requested_by,
          source_reference: parsed.source_reference,
          assigned_to: payload.assigned_to ?? 'User',
          dependencies: [],
          created_at: now(),
          updated_at: now()
        };
        data.tasks.push(task);
        data.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: parsed.requested_by,
          event_type: 'task_created',
          content: `Created task: ${task.title}`,
          source_reference: parsed.source_reference,
          metadata: { task_id: task.id }
        }));
        action.result = task.id;
        break;
      }
      case 'complete_task': {
        if (!project) throw new Error('Project is required for complete_task');
        const task = data.tasks.find((item) => item.project_id === project.id && (item.id === payload.task_id || item.title.toLowerCase() === (payload.title ?? '').toLowerCase()));
        if (!task) throw new Error('Task not found');
        task.status = 'done';
        task.updated_at = now();
        data.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: parsed.requested_by,
          event_type: 'task_completed',
          content: `Completed task: ${task.title}`,
          source_reference: parsed.source_reference,
          metadata: { task_id: task.id }
        }));
        action.result = task.id;
        break;
      }
      case 'create_note': {
        if (!project) throw new Error('Project is required for create_note');
        const note = {
          id: id('note'),
          project_id: project.id,
          title: payload.title ?? 'Imported note',
          content: payload.content ?? '',
          source: parsed.requested_by,
          source_reference: parsed.source_reference,
          created_at: now()
        };
        data.notes.push(note);
        data.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: parsed.requested_by,
          event_type: 'note_created',
          content: `Created note: ${note.title}`,
          source_reference: parsed.source_reference,
          metadata: { note_id: note.id }
        }));
        action.result = note.id;
        break;
      }
      case 'create_decision': {
        if (!project) throw new Error('Project is required for create_decision');
        const decision = {
          id: id('dec'),
          project_id: project.id,
          title: payload.title ?? 'Untitled decision',
          rationale: payload.rationale,
          status: 'accepted' as const,
          source: parsed.requested_by,
          source_reference: parsed.source_reference,
          created_at: now()
        };
        data.decisions.push(decision);
        data.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: parsed.requested_by,
          event_type: 'decision_created',
          content: `Decision recorded: ${decision.title}`,
          source_reference: parsed.source_reference,
          metadata: { decision_id: decision.id }
        }));
        action.result = decision.id;
        break;
      }
      case 'create_document': {
        if (!project) throw new Error('Project is required for create_document');
        const document: DocumentRecord = {
          id: id('doc'),
          project_id: project.id,
          title: payload.title ?? 'Untitled document',
          kind: (payload.kind as DocumentRecord['kind']) ?? 'other',
          content: payload.content ?? '',
          author: parsed.requested_by,
          source_reference: parsed.source_reference,
          created_at: now(),
          updated_at: now()
        };
        data.documents.push(document);
        data.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: parsed.requested_by,
          event_type: 'document_created',
          content: `Created document: ${document.title}`,
          source_reference: parsed.source_reference,
          metadata: { document_id: document.id, kind: document.kind }
        }));
        action.result = document.id;
        break;
      }
      case 'create_memory': {
        if (!project) throw new Error('Project is required for create_memory');
        const memory = {
          id: id('mem'),
          project_id: project.id,
          category: (payload.category as never) ?? 'important_facts',
          content: payload.content ?? '',
          source: parsed.requested_by,
          source_reference: parsed.source_reference,
          created_at: now()
        };
        data.memory.push(memory);
        action.result = memory.id;
        break;
      }
      default:
        throw new Error(`Unsupported MVP action: ${parsed.action}`);
    }
    action.completed_at = now();
  } catch (error: unknown) {
    action.status = 'failed';
    action.result = error instanceof Error ? error.message : 'Unknown action failure';
  }

  data.ai_actions.push(action);
  if (project) project.updated_at = now();
  return action;
}
