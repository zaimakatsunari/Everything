import { NextResponse } from 'next/server';
import { getProjectBundle } from '@/lib/store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const bundle = await getProjectBundle(params.id);
  if (!bundle) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(bundle);
}
