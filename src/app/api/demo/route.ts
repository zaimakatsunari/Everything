import { NextResponse } from 'next/server';
import { createTimelineEvent, executeAction } from '@/lib/actions';
import { inferProjectPlan } from '@/lib/extract';
import { id, now, updateData } from '@/lib/store';

export async function POST() {
  let projectId = '';
  const idea = 'I want to build an online clothing business.';
  const plan = inferProjectPlan(idea);

  await updateData((draft) => {
    draft.projects = [];
    draft.tasks = [];
    draft.notes = [];
    draft.decisions = [];
    draft.documents = [];
    draft.memory = [];
    draft.conversations = [];
    draft.messages = [];
    draft.ai_actions = [];
    draft.timeline_events = [];

    const project = {
      id: id('proj'),
      name: 'Online Clothing Business',
      description: idea,
      goal: 'Build an online clothing business.',
      status: 'planning' as const,
      owner: 'Demo User',
      created_at: now(),
      updated_at: now(),
      priority: 'medium' as const,
      tags: ['mvp-demo'],
      current_phase: 'Planning',
      summary: plan.summary,
      next_actions: ['Validate target customer', 'Compare ecommerce platforms', 'Research suppliers'],
      automation_level: 'semi_automatic' as const
    };
    projectId = project.id;
    draft.projects.push(project);
    draft.timeline_events.push(createTimelineEvent({ project_id: project.id, provider: 'Everything', event_type: 'project_created', content: 'Created Online Clothing Business project' }));
    for (const task of plan.tasks) executeAction(draft, { action: 'create_task', project_id: project.id, requested_by: 'Everything', payload: { title: task, priority: 'medium' } });
    executeAction(draft, { action: 'create_note', project_id: project.id, requested_by: 'Everything', payload: { title: 'Original idea', content: idea } });
    executeAction(draft, { action: 'create_document', project_id: project.id, requested_by: 'Everything', payload: plan.documents[0] });
    executeAction(draft, { action: 'create_memory', project_id: project.id, requested_by: 'Everything', payload: { category: 'goals', content: 'Build an online clothing business.' } });

    const gemini = { id: id('conv'), project_id: project.id, provider: 'Gemini' as const, title: 'Market research and Shopify direction', source: 'demo' as const, created_at: now(), updated_at: now() };
    draft.conversations.push(gemini);
    draft.messages.push({ id: id('msg'), conversation_id: gemini.id, role: 'assistant', timestamp: now(), content: 'Market research suggests starting with a narrow streetwear audience, validating demand on TikTok and Instagram, and using Shopify for the first ecommerce site. Tasks: compare 10 competitor stores, define target customer, shortlist suppliers. We decided to use Shopify for the store.' });
    draft.timeline_events.push(createTimelineEvent({ project_id: project.id, provider: 'Gemini', event_type: 'conversation_created', content: 'Gemini conversation imported: market research', source_reference: gemini.id }));
    executeAction(draft, { action: 'create_decision', project_id: project.id, requested_by: 'Gemini', source_reference: gemini.id, payload: { title: 'Use Shopify for the first ecommerce store' } });
    executeAction(draft, { action: 'create_document', project_id: project.id, requested_by: 'Gemini', source_reference: gemini.id, payload: { title: 'Gemini Market Research', kind: 'research', content: 'Focus on a specific clothing niche, validate via social channels, compare competitor pricing, and shortlist suppliers before building inventory.' } });
    executeAction(draft, { action: 'create_memory', project_id: project.id, requested_by: 'Gemini', source_reference: gemini.id, payload: { category: 'research', content: 'Potential go-to-market: niche streetwear audience, social validation, Shopify MVP, supplier shortlist.' } });

    const claude = { id: id('conv'), project_id: project.id, provider: 'Claude' as const, title: 'Competitor analysis next steps', source: 'demo' as const, created_at: now(), updated_at: now() };
    draft.conversations.push(claude);
    draft.messages.push({ id: id('msg'), conversation_id: claude.id, role: 'assistant', timestamp: now(), content: 'Claude continued from Gemini research and proposed a competitor analysis table, brand positioning document, and pricing assumptions. Next tasks: create competitor spreadsheet, draft buyer persona, define launch collection.' });
    draft.timeline_events.push(createTimelineEvent({ project_id: project.id, provider: 'Claude', event_type: 'conversation_created', content: 'Claude conversation imported: competitor analysis', source_reference: claude.id }));
    executeAction(draft, { action: 'create_task', project_id: project.id, requested_by: 'Claude', source_reference: claude.id, payload: { title: 'Create competitor spreadsheet', priority: 'high' } });
    executeAction(draft, { action: 'create_document', project_id: project.id, requested_by: 'Claude', source_reference: claude.id, payload: { title: 'Brand Positioning Draft', kind: 'strategy', content: 'Position the brand around a clear niche, define the buyer persona, choose three differentiators, and test a small launch collection.' } });

    const chatgpt = { id: id('conv'), project_id: project.id, provider: 'ChatGPT' as const, title: 'Launch checklist preparation', source: 'demo' as const, created_at: now(), updated_at: now() };
    draft.conversations.push(chatgpt);
    draft.messages.push({ id: id('msg'), conversation_id: chatgpt.id, role: 'assistant', timestamp: now(), content: 'ChatGPT received the updated state and prepared a launch checklist covering Shopify setup, product pages, supplier outreach, legal basics, email capture, and first marketing experiments.' });
    draft.timeline_events.push(createTimelineEvent({ project_id: project.id, provider: 'ChatGPT', event_type: 'conversation_created', content: 'ChatGPT conversation imported: launch checklist', source_reference: chatgpt.id }));
    executeAction(draft, { action: 'create_task', project_id: project.id, requested_by: 'ChatGPT', source_reference: chatgpt.id, payload: { title: 'Prepare Shopify launch checklist', priority: 'high' } });
  });

  return NextResponse.json({ project_id: projectId });
}
