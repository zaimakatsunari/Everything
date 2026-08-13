import type { Provider } from './types';

export interface ExtractedProjectPlan {
  name: string;
  goal: string;
  summary: string;
  tasks: string[];
  notes: string[];
  decisions: string[];
  documents: { title: string; kind: 'business_plan' | 'research' | 'strategy' | 'requirements' | 'other'; content: string }[];
  memory: { category: 'goals' | 'research' | 'decisions' | 'important_facts' | 'open_questions' | 'requirements'; content: string }[];
  next_actions: string[];
}

const commonTaskMap: Record<string, string[]> = {
  clothing: ['Research market and competitors', 'Define target customer', 'Create brand strategy', 'Research suppliers', 'Plan ecommerce website', 'Create marketing plan'],
  restaurant: ['Design website', 'Select technology', 'Build payment system', 'Design delivery workflow', 'Create marketing plan'],
  software: ['Define requirements', 'Design architecture', 'Create backlog', 'Set up repository', 'Build MVP', 'Test core workflow'],
  app: ['Define requirements', 'Design user experience', 'Create technical plan', 'Build MVP', 'Collect feedback']
};

export function inferProjectPlan(input: string): ExtractedProjectPlan {
  const text = input.trim();
  const lower = text.toLowerCase();
  const name = inferName(text);
  const keyword = Object.keys(commonTaskMap).find((key) => lower.includes(key));
  const tasks = keyword ? commonTaskMap[keyword] : ['Clarify project goal', 'Define requirements', 'Create initial plan', 'Identify resources', 'Choose next milestone'];

  const explicitNeeds = [...lower.matchAll(/(?:need|needs|include|includes|with)\s+([^.!?]+)/g)]
    .flatMap((match) => match[1].split(/,| and | & /g))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const requirementTasks = explicitNeeds.map((need) => `Plan ${need}`);
  const mergedTasks = [...new Set([...tasks, ...requirementTasks])];
  return {
    name,
    goal: normalizeGoal(text),
    summary: `Project created from the user's idea: ${text}`,
    tasks: mergedTasks,
    notes: [`Original project idea: ${text}`],
    decisions: extractDecisions(text),
    documents: [
      {
        title: 'Initial Project Brief',
        kind: 'requirements',
        content: `# ${name}\n\n## Goal\n${normalizeGoal(text)}\n\n## Initial requirements\n${explicitNeeds.length ? explicitNeeds.map((item) => `- ${item}`).join('\n') : '- To be clarified'}\n\n## Suggested first tasks\n${mergedTasks.map((item) => `- ${item}`).join('\n')}`
      }
    ],
    memory: [
      { category: 'goals', content: normalizeGoal(text) },
      ...explicitNeeds.map((need) => ({ category: 'requirements' as const, content: need }))
    ],
    next_actions: mergedTasks.slice(0, 3)
  };
}

export function extractConversationArtifacts(args: { projectName: string; provider: Provider; text: string }) {
  const text = args.text.trim();
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const tasks = lines
    .filter((line) => /^[-*]\s+/.test(line) || /\b(todo|task|next|should|need to|action)\b/i.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^(task|todo|action):\s*/i, '').trim())
    .filter((line) => line.length > 8)
    .slice(0, 10);

  const decisions = extractDecisions(text);
  const openQuestions = lines.filter((line) => line.endsWith('?')).slice(0, 5);
  const hasResearch = /research|competitor|market|finding|analysis|customer|supplier|pricing|trend/.test(lower);
  const hasPlan = /plan|strategy|roadmap|requirements|specification/.test(lower);
  const completed = lines
    .filter((line) => /\b(complete|completed|done|finished)\b/i.test(line))
    .slice(0, 5);
  const completedTaskCandidates = extractCompletedTaskCandidates(text);

  const documents = [] as { title: string; kind: 'research' | 'strategy' | 'requirements' | 'other'; content: string }[];
  if (hasResearch) {
    documents.push({ title: `${args.provider} Research Notes`, kind: 'research', content: text });
  } else if (hasPlan) {
    documents.push({ title: `${args.provider} Strategy Notes`, kind: 'strategy', content: text });
  }

  const memory = [
    ...(hasResearch ? [{ category: 'research' as const, content: summarize(text, 360) }] : []),
    ...decisions.map((decision) => ({ category: 'decisions' as const, content: decision })),
    ...openQuestions.map((question) => ({ category: 'open_questions' as const, content: question })),
    ...completed.map((item) => ({ category: 'completed_work' as const, content: item }))
  ];

  return {
    tasks: [...new Set(tasks)],
    decisions,
    notes: [{ title: `${args.provider} conversation import`, content: summarize(text, 900) }],
    documents,
    memory,
    completedTaskCandidates
  };
}

function inferName(text: string) {
  const lower = text.toLowerCase();
  const quoted = text.match(/["“](.+?)["”]/)?.[1];
  if (quoted && quoted.length < 80) return titleCase(quoted);
  const buildMatch = lower.match(/(?:build|create|start|launch)\s+(?:an?\s+)?(.+?)(?:\.|$|,| with | that | for )/i);
  if (buildMatch?.[1]) return titleCase(buildMatch[1].replace(/^online\s+/, 'Online '));
  return titleCase(text.split(/[.!?]/)[0].slice(0, 60));
}

function normalizeGoal(text: string) {
  const sentence = text.split(/[.!?]/)[0].trim();
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

function titleCase(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractDecisions(text: string) {
  const decisions = [] as string[];
  const patterns = [
    /(?:we decided to|decided to|decision:|we will|we chose|chose to|use)\s+([^.!?]+)/gi,
    /(?:selected|picked)\s+([^.!?]+)/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const decision = match[1]?.trim();
      if (decision && decision.length > 3) decisions.push(decision.charAt(0).toUpperCase() + decision.slice(1));
    }
  }
  return [...new Set(decisions)].slice(0, 8);
}

function extractCompletedTaskCandidates(text: string) {
  const candidates = [] as string[];
  const patterns = [
    /(?:the\s+)?(.{4,80}?)\s+(?:is|are|was|were)\s+(?:complete|completed|done|finished)/gi,
    /(?:completed|finished|done)\s*:?\s*(.{4,80}?)(?:\.|\n|$)/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = match[1]?.replace(/^[-*]\s*/, '').trim();
      if (value && !/^(task|work|it|this)$/i.test(value)) candidates.push(value);
    }
  }
  return [...new Set(candidates)].slice(0, 5);
}

function summarize(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}
