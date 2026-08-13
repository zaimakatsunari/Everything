import { NextResponse } from 'next/server';
import { getProjectBundle } from '@/lib/store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const bundle = await getProjectBundle(params.id);
  if (!bundle) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  const providers = Array.from(new Set(bundle.conversations.map((conversation) => conversation.provider)));
  const docs = bundle.documents.slice(-5).map((doc) => doc.title);
  const decisions = bundle.decisions.slice(-5).map((decision) => decision.title);
  const latest = bundle.timeline.slice(0, 10);
  const summary = [
    `Project: ${bundle.project.name}.`,
    providers.length ? `AI work recorded from ${providers.join(', ')}.` : 'No AI conversations have been recorded yet.',
    docs.length ? `Recent documents include ${docs.join(', ')}.` : 'No documents have been created yet.',
    decisions.length ? `Recent decisions include ${decisions.join(', ')}.` : 'No decisions have been recorded yet.',
    latest.length ? `Latest activity: ${latest[0].provider} — ${latest[0].content}.` : 'No timeline activity yet.'
  ].join(' ');
  return NextResponse.json({ summary, latest_events: latest });
}
