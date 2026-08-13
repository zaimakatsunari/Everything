import type { ContextPackage, ProjectBundle, Provider } from './types';

export function buildContextPackage(bundle: ProjectBundle, targetProvider: Provider): ContextPackage {
  const activeTasks = bundle.tasks.filter((task) => task.status !== 'done');
  const completedTasks = bundle.tasks.filter((task) => task.status === 'done');
  const blockers = bundle.tasks.filter((task) => task.status === 'blocked');
  const latestTimeline = bundle.timeline.slice(0, 12);
  const recentDecisions = bundle.decisions.slice(-8).reverse();
  const importantDocs = bundle.documents
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8)
    .map(({ id, title, kind, updated_at }) => ({ id, title, kind, updated_at }));
  const relevantMemory = bundle.memory
    .filter((item) => item.category !== 'open_questions')
    .slice(-14)
    .reverse();
  const openQuestions = bundle.memory
    .filter((item) => item.category === 'open_questions')
    .slice(-8)
    .reverse();
  const previousConversations = bundle.conversations
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8)
    .map(({ id, provider, title, updated_at }) => ({ id, provider, title, updated_at }));

  const nextActions = bundle.project.next_actions.length
    ? bundle.project.next_actions
    : activeTasks.slice(0, 3).map((task) => task.title);

  const handoffPrompt = renderHandoff({ bundle, targetProvider, activeTasks, completedTasks, recentDecisions, relevantMemory, openQuestions, latestTimeline, nextActions });

  return {
    generated_at: new Date().toISOString(),
    target_provider: targetProvider,
    project_summary: bundle.project.summary,
    current_goals: [bundle.project.goal, ...bundle.memory.filter((item) => item.category === 'goals').map((item) => item.content)].filter(Boolean),
    current_phase: bundle.project.current_phase,
    active_tasks: activeTasks,
    completed_tasks: completedTasks,
    recent_decisions: recentDecisions,
    important_documents: importantDocs,
    relevant_previous_conversations: previousConversations,
    relevant_memory: relevantMemory,
    open_questions: openQuestions,
    latest_timeline_events: latestTimeline,
    current_blockers: blockers,
    next_recommended_actions: nextActions,
    handoff_prompt: handoffPrompt
  };
}

function renderHandoff(args: {
  bundle: ProjectBundle;
  targetProvider: Provider;
  activeTasks: ProjectBundle['tasks'];
  completedTasks: ProjectBundle['tasks'];
  recentDecisions: ProjectBundle['decisions'];
  relevantMemory: ProjectBundle['memory'];
  openQuestions: ProjectBundle['memory'];
  latestTimeline: ProjectBundle['timeline'];
  nextActions: string[];
}) {
  const { bundle, targetProvider, activeTasks, completedTasks, recentDecisions, relevantMemory, openQuestions, latestTimeline, nextActions } = args;
  const providerWork = bundle.conversations
    .map((conversation) => `- ${conversation.provider}: ${conversation.title} (${new Date(conversation.updated_at).toLocaleString()})`)
    .join('\n') || '- No imported AI conversations yet.';

  return `You are continuing this project using ${targetProvider}. Everything is the source of truth. Do not assume facts that are not in this context. If you create tasks, decisions, notes, documents, or completed-work updates, return them clearly so Everything can record them through its action system.\n\nPROJECT: ${bundle.project.name}\n\nGOAL:\n${bundle.project.goal}\n\nCURRENT PHASE:\n${bundle.project.current_phase}\n\nSTATUS SUMMARY:\n${bundle.project.summary}\n\nWHAT PREVIOUS AI PROVIDERS CONTRIBUTED:\n${providerWork}\n\nACTIVE TASKS:\n${activeTasks.map((task) => `- ${task.title} [${task.priority}, ${task.status}]`).join('\n') || '- No active tasks.'}\n\nCOMPLETED TASKS:\n${completedTasks.map((task) => `- ${task.title}`).join('\n') || '- No completed tasks yet.'}\n\nIMPORTANT DECISIONS:\n${recentDecisions.map((decision) => `- ${decision.title} (source: ${decision.source})`).join('\n') || '- No decisions recorded yet.'}\n\nPROJECT MEMORY / RESEARCH:\n${relevantMemory.map((memory) => `- ${memory.category}: ${memory.content} (source: ${memory.source})`).join('\n') || '- No project memory recorded yet.'}\n\nOPEN QUESTIONS:\n${openQuestions.map((memory) => `- ${memory.content}`).join('\n') || '- No open questions recorded.'}\n\nLATEST TIMELINE:\n${latestTimeline.map((event) => `- ${new Date(event.timestamp).toLocaleString()}: ${event.provider} — ${event.content}`).join('\n') || '- No timeline events yet.'}\n\nNEXT RECOMMENDED ACTIONS:\n${nextActions.map((action) => `- ${action}`).join('\n') || '- Ask the user which direction to take next.'}\n`;
}
