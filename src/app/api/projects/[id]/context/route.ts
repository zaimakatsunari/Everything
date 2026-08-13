import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildContextPackage } from '@/lib/context';
import { getProjectBundle } from '@/lib/store';

const ContextSchema = z.object({
  provider: z.enum(['Everything', 'Gemini', 'Claude', 'ChatGPT', 'Ollama', 'Other']).default('Claude')
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = ContextSchema.parse(await request.json().catch(() => ({})));
  const bundle = await getProjectBundle(params.id);
  if (!bundle) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(buildContextPackage(bundle, body.provider));
}
