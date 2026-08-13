import { promises as fs } from 'fs';
import path from 'path';
import type { EverythingData, ProjectBundle } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'everything.local.json');

const seedData: EverythingData = {
  users: [{ id: 'user_demo', name: 'Demo User' }],
  projects: [],
  tasks: [],
  notes: [],
  decisions: [],
  documents: [],
  memory: [],
  conversations: [],
  messages: [],
  ai_actions: [],
  timeline_events: []
};

export function now() {
  return new Date().toISOString();
}

export function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function readData(): Promise<EverythingData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as EverythingData;
  } catch (error: unknown) {
    await writeData(seedData);
    return structuredClone(seedData);
  }
}

export async function writeData(data: EverythingData) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function updateData(mutator: (data: EverythingData) => void | Promise<void>) {
  const data = await readData();
  await mutator(data);
  await writeData(data);
  return data;
}

export async function getProjectBundle(projectId: string): Promise<ProjectBundle | null> {
  const data = await readData();
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return null;
  const conversations = data.conversations.filter((item) => item.project_id === projectId);
  const conversationIds = new Set(conversations.map((item) => item.id));
  return {
    project,
    tasks: data.tasks.filter((item) => item.project_id === projectId),
    notes: data.notes.filter((item) => item.project_id === projectId),
    decisions: data.decisions.filter((item) => item.project_id === projectId),
    documents: data.documents.filter((item) => item.project_id === projectId),
    memory: data.memory.filter((item) => item.project_id === projectId),
    conversations,
    messages: data.messages.filter((item) => conversationIds.has(item.conversation_id)),
    ai_actions: data.ai_actions.filter((item) => item.project_id === projectId),
    timeline: data.timeline_events
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  };
}

export function slugTitle(input: string) {
  return input
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'Untitled Project';
}
