import { Issue, AppUser, CategoryRule, GeneralSettings, SoundSettings, AuditLog, ExternalVendor, CabBusinessActivity } from '../types';

export type SyncConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline';

export interface ActiveUserPresence {
  name: string;
  role: string;
  department: string;
  location?: string;
  joinedAt: string;
}

export interface RealtimeEventHandlers {
  onTicketCreated: (issue: Issue, author: string, location?: string) => void;
  onTicketUpdated: (issue: Issue, actor: string, changeType?: string, details?: string) => void;
  onTicketCommentAdded: (issueId: string, comment: any, actor: string) => void;
  onTicketDeleted: (issueId: string, actor: string) => void;
  onTicketBulkDeleted?: (issueIds: string[], actor: string) => void;
  onTicketsCleared?: (actor: string) => void;
  onCabCreated?: (activity: CabBusinessActivity, author: string) => void;
  onCabUpdated?: (activity: CabBusinessActivity, author: string, details?: string) => void;
  onCabDeleted?: (activityId: string, author: string) => void;
  onStateSynced: (fullState: any) => void;
  onPresenceUpdated: (users: ActiveUserPresence[], totalConnections: number) => void;
  onStatusChanged: (status: SyncConnectionStatus) => void;
  onCollisionsUpdated?: (collisions: any) => void;
  onExternalVendorsUpdated?: (vendors: ExternalVendor[]) => void;
  onSlaSettingsUpdated?: (slaSettings: any) => void;
  onSupabaseConfigUpdated?: (config: any) => void;
}

class RealtimeSyncManager {
  private status: SyncConnectionStatus = 'connected';
  private handlers: RealtimeEventHandlers | null = null;
  private currentUser: AppUser | null = null;

  public init(handlers: RealtimeEventHandlers, currentUser: AppUser) {
    this.handlers = handlers;
    this.currentUser = currentUser;
    this.setStatus('connected');
  }

  public updateCurrentUser(user: AppUser) {
    this.currentUser = user;
  }

  private setStatus(newStatus: SyncConnectionStatus) {
    this.status = newStatus;
    this.handlers?.onStatusChanged(newStatus);
  }

  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  // All broadcast and sync methods are now completely no-op to eliminate local Express server/WS dependencies.
  // Real-time synchronization is handled directly and robustly via Supabase Postgres Changes and Broadcast channel subscriptions.
  public async broadcastTicketCreate(_issue: Issue, _author: string, _location?: string) {}
  public async broadcastTicketUpdate(_issue: Issue, _actor: string, _changeType?: string, _details?: string) {}
  public async broadcastComment(_issueId: string, _comment: any, _actor: string) {}
  public async broadcastTicketDelete(_issueId: string, _actor: string) {}
  public async broadcastBulkTicketDelete(_issueIds: string[], _actor: string) {}
  public async broadcastClearAllTickets(_actor: string) {}
  public async broadcastCabCreate(_activity: CabBusinessActivity, _author: string) {}
  public async broadcastCabUpdate(_activity: CabBusinessActivity, _author: string, _details?: string) {}
  public async broadcastCabDelete(_activityId: string, _author: string) {}
  
  public async fetchServerState() {
    return null;
  }

  public async seedInitialServerData(_data: any) {}
  public async broadcastSupabaseConfig(_config: any) {}
  
  public sendTicketFocus(_ticketId: string, _action: 'viewing' | 'editing' | 'working', _user: any) {}
  public sendTicketBlur(_ticketId: string) {}
  
  public destroy() {}
}

export const realtimeSync = new RealtimeSyncManager();
