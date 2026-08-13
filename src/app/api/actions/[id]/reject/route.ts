import { NextResponse } from 'next/server';
import { createTimelineEvent } from '@/lib/actions';
import { now, updateData } from '@/lib/store';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  let result: unknown = null;
  await updateData((draft) => {
    const action = draft.ai_actions.find((item) => item.id === params.id);
    if (!action) throw new Error('Action not found');
    action.status = 'rejected';
    action.result = 'Rejected by user';
    action.completed_at = now();
    if (action.project_id) {
      draft.timeline_events.push(createTimelineEvent({
        project_id: action.project_id,
        provider: action.requested_by,
        event_type: 'task_updated',
        actor: 'User approval',
        content: `Rejected ${action.requested_by} suggested action: ${action.action}`,
        source_reference: action.source_reference,
        metadata: { action_id: action.id }
      }));
    }
    result = action;
  });
  return NextResponse.json({ action: result });
}
