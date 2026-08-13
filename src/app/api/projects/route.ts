import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAction, createTimelineEvent } from '@/lib/actions';
import { inferProjectPlan } from '@/lib/extract';
import { id, now, readData, updateData } from '@/lib/store';

const CreateProjectSchema = z.object({
  idea: z.string().min(3),
  owner: z.string().default('Demo User')
});

export async function GET() {
  const data = await readData();
  return NextResponse.json({ projects: data.projects.sort((a, b) => b.updated_at.localeCompare(a.updated_at)) });
}

export async function POST(request: Request) {
  const body = CreateProjectSchema.parse(await request.json());
  const plan = inferProjectPlan(body.idea);
  let createdProjectId = '';

  const data = await updateData((draft) => {
    const project = {
      id: id('proj'),
      name: plan.name,
      description: body.idea,
      goal: plan.goal,
      status: 'planning' as const,
      owner: body.owner,
      created_at: now(),
      updated_at: now(),
      priority: 'medium' as const,
      tags: [],
      current_phase: 'Planning',
      summary: plan.summary,
      next_actions: plan.next_actions,
      automation_level: 'semi_automatic' as const
    };
    createdProjectId = project.id;
    draft.projects.push(project);
    draft.timeline_events.push(createTimelineEvent({
      project_id: project.id,
      provider: 'Everything',
      event_type: 'project_created',
      content: `Created project: ${project.name}`,
      actor: 'Everything',
      metadata: { idea: body.idea }
    }));

    for (const task of plan.tasks) {
      executeAction(draft, {
        action: 'create_task',
        project_id: project.id,
        requested_by: 'Everything',
        payload: { title: task, priority: task.toLowerCase().includes('website') ? 'high' : 'medium' }
      });
    }
    for (const note of plan.notes) {
      executeAction(draft, {
        action: 'create_note',
        project_id: project.id,
        requested_by: 'Everything',
        payload: { title: 'Original idea', content: note }
      });
    }
    for (const decision of plan.decisions) {
      executeAction(draft, {
        action: 'create_decision',
        project_id: project.id,
        requested_by: 'Everything',
        payload: { title: decision }
      });
    }
    for (const document of plan.documents) {
      executeAction(draft, {
        action: 'create_document',
        project_id: project.id,
        requested_by: 'Everything',
        payload: document
      });
    }
    for (const memory of plan.memory) {
      executeAction(draft, {
        action: 'create_memory',
        project_id: project.id,
        requested_by: 'Everything',
        payload: memory
      });
    }
  });

  return NextResponse.json({ project: data.projects.find((item) => item.id === createdProjectId) }, { status: 201 });
}
