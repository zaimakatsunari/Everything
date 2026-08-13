export type ProjectStatus = 'planning' | 'active' | 'blocked' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Provider = 'Everything' | 'Gemini' | 'Claude' | 'ChatGPT' | 'Ollama' | 'Other';
export type AutomationLevel = 'manual' | 'semi_automatic' | 'automatic';

export type EventType =
  | 'project_created'
  | 'project_updated'
  | 'conversation_created'
  | 'conversation_updated'
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'document_created'
  | 'document_updated'
  | 'file_added'
  | 'decision_created'
  | 'decision_changed'
  | 'note_created'
  | 'meeting_created'
  | 'github_issue_created'
  | 'github_commit'
  | 'notion_updated'
  | 'google_doc_updated'
  | 'google_sheet_updated'
  | 'ai_response'
  | 'ai_instruction'
  | 'milestone_completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: ProjectStatus;
  owner: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  priority: Priority;
  tags: string[];
  current_phase: string;
  summary: string;
  next_actions: string[];
  automation_level: AutomationLevel;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  created_by: Provider;
  source_reference?: string;
  assigned_to: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  title: string;
  content: string;
  source: Provider;
  source_reference?: string;
  created_at: string;
}

export interface Decision {
  id: string;
  project_id: string;
  title: string;
  rationale?: string;
  status: 'proposed' | 'accepted' | 'changed' | 'rejected';
  source: Provider;
  source_reference?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  project_id: string;
  title: string;
  kind: 'business_plan' | 'research' | 'strategy' | 'requirements' | 'meeting_notes' | 'specification' | 'other';
  content: string;
  author: Provider;
  source_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemory {
  id: string;
  project_id: string;
  category:
    | 'goals'
    | 'requirements'
    | 'decisions'
    | 'people'
    | 'preferences'
    | 'technical_architecture'
    | 'business_information'
    | 'research'
    | 'constraints'
    | 'important_facts'
    | 'open_questions'
    | 'risks'
    | 'completed_work';
  content: string;
  source: Provider;
  source_reference?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  provider: Provider;
  model?: string;
  external_conversation_id?: string;
  title: string;
  source: 'manual_import' | 'sync' | 'api' | 'demo';
  context_used?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface TimelineEvent {
  event_id: string;
  user_id: string;
  project_id: string;
  source: string;
  provider: Provider;
  event_type: EventType;
  timestamp: string;
  actor: string;
  content: string;
  metadata: Record<string, unknown>;
  source_reference?: string;
}

export type ActionName =
  | 'create_project'
  | 'update_project'
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'create_note'
  | 'create_decision'
  | 'create_document'
  | 'update_document'
  | 'attach_conversation'
  | 'create_memory'
  | 'create_timeline_event';

export interface AiAction {
  id: string;
  action: ActionName;
  project_id?: string;
  requested_by: Provider;
  source_reference?: string;
  payload: Record<string, unknown>;
  status: 'suggested' | 'approved' | 'completed' | 'rejected' | 'failed';
  result?: string;
  created_at: string;
  completed_at?: string;
}

export interface EverythingData {
  users: { id: string; name: string; email?: string }[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  decisions: Decision[];
  documents: DocumentRecord[];
  memory: ProjectMemory[];
  conversations: Conversation[];
  messages: Message[];
  ai_actions: AiAction[];
  timeline_events: TimelineEvent[];
}

export interface ProjectBundle {
  project: Project;
  tasks: Task[];
  notes: Note[];
  decisions: Decision[];
  documents: DocumentRecord[];
  memory: ProjectMemory[];
  conversations: Conversation[];
  messages: Message[];
  ai_actions: AiAction[];
  timeline: TimelineEvent[];
}

export interface ContextPackage {
  generated_at: string;
  target_provider: Provider;
  project_summary: string;
  current_goals: string[];
  current_phase: string;
  active_tasks: Task[];
  completed_tasks: Task[];
  recent_decisions: Decision[];
  important_documents: Pick<DocumentRecord, 'id' | 'title' | 'kind' | 'updated_at'>[];
  relevant_previous_conversations: Pick<Conversation, 'id' | 'provider' | 'title' | 'updated_at'>[];
  relevant_memory: ProjectMemory[];
  open_questions: ProjectMemory[];
  latest_timeline_events: TimelineEvent[];
  current_blockers: Task[];
  next_recommended_actions: string[];
  handoff_prompt: string;
}
