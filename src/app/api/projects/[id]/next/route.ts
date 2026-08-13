import { NextResponse } from 'next/server';
import { getProjectBundle } from '@/lib/store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const bundle = await getProjectBundle(params.id);
  if (!bundle) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  const active = bundle.tasks.filter((task) => task.status !== 'done');
  const blockers = active.filter((task) => task.status === 'blocked');
  const highPriority = active.filter((task) => task.priority === 'high' || task.priority === 'urgent');
  const latestProvider = bundle.conversations.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]?.provider;
  const suggestions = [
    ...blockers.map((task) => ({ action: `Unblock: ${task.title}`, source: `Blocked task created by ${task.created_by}` })),
    ...highPriority.map((task) => ({ action: task.title, source: `High-priority active task from ${task.created_by}` })),
    ...bundle.project.next_actions.map((action) => ({ action, source: 'Project next_actions' })),
    ...(latestProvider ? [{ action: `Continue from the latest ${latestProvider} work with a focused next-step prompt`, source: `Latest AI conversation from ${latestProvider}` }] : [])
  ];
  const unique = suggestions.filter((item, index, array) => array.findIndex((other) => other.action === item.action) === index).slice(0, 8);
  return NextResponse.json({ suggestions: unique });
}
