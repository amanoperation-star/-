export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
export type UserRole = 'Admin' | 'Supervisor' | 'Agent';

export interface IssueComment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  time: string;
  attachment?: {
    name: string;
    url: string;
    size?: string;
  };
}

export interface TimelineEvent {
  id: string;
  time: string;
  actor: string;
  title: string;
  details: string;
  type: 'create' | 'status' | 'assign' | 'comment' | 'resolve' | 'timer' | 'sla' | 'merge';
}

export interface Issue {
  id: string;
  client: string;
  clientEmail?: string;
  clientPhone?: string;
  tag: string;
  type: string; // Category
  desc: string;
  assigned: string; // Team
  owner: string; // Assignee name
  priority: Priority;
  status: IssueStatus;
  createdAt: string; // ISO string with full timestamp
  dueDate: string; // ISO string for SLA deadline
  workTime: number; // In seconds
  isWorkingNow?: boolean;
  activeWorker?: string | null;
  csat: number; // 1-5
  resolutionReason?: string;
  resolvedAt?: string;
  attachment?: {
    name: string;
    url: string;
    size?: string;
  };
  comments: IssueComment[];
  timeline: TimelineEvent[];
  mergedIntoTicketId?: string; // If this ticket is merged into another
  mergedTicketIds?: string[]; // IDs of tickets that were merged into this one
  clientNotes?: string;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  permissions?: string[];
}

export interface CategoryRule {
  id: string;
  name: string;
  assignedTeam: string;
  defaultOwner: string;
  description?: string;
  color?: string;
  active?: boolean;
  routingStrategy?: 'direct' | 'round_robin' | 'least_busy';
  keywords?: string[];
  escalationEmail?: string;
  businessHoursOnly?: boolean;
  slaHours: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  ticketId?: string;
}

export interface SoundSettings {
  muted: boolean;
  alarmUrl: string;
  alarmStyle: 'pulse-red' | 'dark-rose' | 'amber-warning';
  volume: number;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  connected: boolean;
  lastSync?: string;
}
