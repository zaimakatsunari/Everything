import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createTimelineEvent, executeAction } from '@/lib/actions';
import { extractConversationArtifacts } from '@/lib/extract';
import { id, now, updateData } from '@/lib/store';

function fuzzyIncludes(candidate: string, title: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const a = normalize(candidate);
  const b = normalize(title);
  return a.includes(b) || b.includes(a) || b.split(' ').filter((word) => word.length > 3).every((word) => a.includes(word));
}

const ImportSchema = z.object({
  project_id: z.string(),
  provider: z.enum(['Gemini', 'Claude', 'ChatGPT', 'Ollama', 'Other']),
  title: z.string().default('Imported AI conversation'),
  model: z.string().optional(),
  user_message: z.string().optional(),
  assistant_message: z.string().min(1),
  external_conversation_id: z.string().optional()
});

export async function POST(request: Request) {
  const body = ImportSchema.parse(await request.json());
  let conversationId = '';

  const data = await updateData((draft) => {
    const project = draft.projects.find((item) => item.id === body.project_id);
    if (!project) throw new Error('Project not found');

    const conversation = {
      id: id('conv'),
      project_id: project.id,
      provider: body.provider,
      model: body.model,
      external_conversation_id: body.external_conversation_id,
      title: body.title,
      source: 'manual_import' as const,
      created_at: now(),
      updated_at: now()
    };
    conversationId = conversation.id;
    draft.conversations.push(conversation);
    if (body.user_message) {
      draft.messages.push({ id: id('msg'), conversation_id: conversation.id, role: 'user', content: body.user_message, timestamp: now() });
    }
    draft.messages.push({ id: id('msg'), conversation_id: conversation.id, role: 'assistant', content: body.assistant_message, timestamp: now() });
    draft.timeline_events.push(createTimelineEvent({
      project_id: project.id,
      provider: body.provider,
      event_type: 'conversation_created',
      content: `${body.provider} conversation imported: ${body.title}`,
      metadata: { conversation_id: conversation.id },
      source_reference: conversation.id
    }));

    const artifacts = extractConversationArtifacts({ projectName: project.name, provider: body.provider, text: `${body.user_message ?? ''}\n${body.assistant_message}` });
    for (const note of artifacts.notes) {
      executeAction(draft, { action: 'create_note', project_id: project.id, requested_by: body.provider, source_reference: conversation.id, payload: note });
    }
    for (const task of artifacts.tasks) {
      const exists = draft.tasks.some((item) => item.project_id === project.id && item.title.toLowerCase() === task.toLowerCase());
      if (!exists) executeAction(draft, { action: 'create_task', project_id: project.id, requested_by: body.provider, source_reference: conversation.id, payload: { title: task, priority: 'medium' } });
    }
    for (const decision of artifacts.decisions) {
      executeAction(draft, { action: 'create_decision', project_id: project.id, requested_by: body.provider, source_reference: conversation.id, payload: { title: decision } });
    }
    for (const document of artifacts.documents) {
      executeAction(draft, { action: 'create_document', project_id: project.id, requested_by: body.provider, source_reference: conversation.id, payload: document });
    }
    for (const memory of artifacts.memory) {
      executeAction(draft, { action: 'create_memory', project_id: project.id, requested_by: body.provider, source_reference: conversation.id, payload: memory });
    }
    for (const candidate of artifacts.completedTaskCandidates) {
      const matchingTask = draft.tasks.find((task) => task.project_id === project.id && task.status !== 'done' && fuzzyIncludes(candidate, task.title));
      if (matchingTask) {
        draft.ai_actions.push({
          id: id('act'),
          action: 'complete_task',
          project_id: project.id,
          requested_by: body.provider,
          source_reference: conversation.id,
          payload: { task_id: matchingTask.id, title: matchingTask.title, suggestion: `${body.provider} suggested marking this task complete.` },
          status: project.automation_level === 'automatic' ? 'approved' : 'suggested',
          result: project.automation_level === 'automatic' ? 'Awaiting execution' : 'Requires user approval',
          created_at: now()
        });
        draft.timeline_events.push(createTimelineEvent({
          project_id: project.id,
          provider: body.provider,
          event_type: 'task_updated',
          content: `${body.provider} suggested marking task complete: ${matchingTask.title}`,
          source_reference: conversation.id,
          metadata: { task_id: matchingTask.id, requires_approval: project.automation_level !== 'automatic' }
        }));
      }
    }

    project.summary = `${project.summary}\n\nLatest ${body.provider} update: ${body.title}`;
    project.updated_at = now();
  });

  const project = data.projects.find((item) => item.id === body.project_id);
  return NextResponse.json({ conversation_id: conversationId, project }, { status: 201 });
}
