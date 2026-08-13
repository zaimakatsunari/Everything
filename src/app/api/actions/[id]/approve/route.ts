import { NextResponse } from 'next/server';
import { createTimelineEvent } from '@/lib/actions';
import { now, updateData } from '@/lib/store';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  let result: unknown = null;
  await updateData((draft) => {
    const action = draft.ai_actions.find((item) => item.id === params.id);
    if (!action) throw new Error('Action not found');
    if (action.status === 'completed') {
      result = action;
      return;
    }

    if (action.action === 'complete_task') {
      const taskId = String(action.payload.task_id ?? '');
      const title = String(action.payload.title ?? '');
      const task = draft.tasks.find((item) => item.id === taskId || (item.project_id === action.project_id && item.title.toLowerCase() === title.toLowerCase()));
      if (!task) throw new Error('Task not found');
      task.status = 'done';
      task.updated_at = now();
      action.status = 'completed';
      action.result = `Marked complete: ${task.title}`;
      action.completed_at = now();
      draft.timeline_events.push(createTimelineEvent({
        project_id: task.project_id,
        provider: action.requested_by,
        event_type: 'task_completed',
        actor: 'User approval',
        content: `Approved ${action.requested_by} suggestion and completed task: ${task.title}`,
        source_reference: action.source_reference,
        metadata: { task_id: task.id, action_id: action.id }
      }));
      const project = draft.projects.find((item) => item.id === task.project_id);
      if (project) project.updated_at = now();
      result = action;
      return;
    }

    throw new Error(`Approval not implemented for ${action.action}`);
  });

  return NextResponse.json({ action: result });
}
