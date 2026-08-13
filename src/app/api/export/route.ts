import { NextResponse } from 'next/server';
import { readData } from '@/lib/store';

export async function GET(request: Request) {
  const data = await readData();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'json';
  const exported_at = new Date().toISOString();

  if (format === 'markdown') {
    const markdown = [
      `# Everything Export`,
      ``,
      `Exported at: ${exported_at}`,
      ``,
      ...data.projects.map((project) => {
        const tasks = data.tasks.filter((task) => task.project_id === project.id).map((task) => `- [${task.status === 'done' ? 'x' : ' '}] ${task.title} (${task.priority}, source: ${task.created_by})`).join('\n') || '- No tasks';
        const decisions = data.decisions.filter((decision) => decision.project_id === project.id).map((decision) => `- ${decision.title} (source: ${decision.source})`).join('\n') || '- No decisions';
        const docs = data.documents.filter((doc) => doc.project_id === project.id).map((doc) => `- ${doc.title} (${doc.kind}, author: ${doc.author})`).join('\n') || '- No documents';
        return `## ${project.name}\n\nGoal: ${project.goal}\n\nStatus: ${project.status}\n\nPhase: ${project.current_phase}\n\n### Tasks\n${tasks}\n\n### Decisions\n${decisions}\n\n### Documents\n${docs}`;
      })
    ].join('\n');
    return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="everything-export.md"' } });
  }

  if (format === 'csv') {
    const rows = [
      ['type', 'project', 'title', 'status_or_kind', 'source', 'updated_at'],
      ...data.projects.map((project) => ['project', project.name, project.goal, project.status, 'Everything', project.updated_at]),
      ...data.tasks.map((task) => ['task', data.projects.find((project) => project.id === task.project_id)?.name ?? '', task.title, task.status, task.created_by, task.updated_at]),
      ...data.decisions.map((decision) => ['decision', data.projects.find((project) => project.id === decision.project_id)?.name ?? '', decision.title, decision.status, decision.source, decision.created_at]),
      ...data.documents.map((doc) => ['document', data.projects.find((project) => project.id === doc.project_id)?.name ?? '', doc.title, doc.kind, doc.author, doc.updated_at])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="everything-export.csv"' } });
  }

  return NextResponse.json({
    exported_at,
    formats_supported: ['json', 'csv', 'markdown'],
    data
  });
}
