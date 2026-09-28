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
  private ws: WebSocket | null = null;
  private status: SyncConnectionStatus = 'disconnected';
  private handlers: RealtimeEventHandlers | null = null;
  private currentUser: AppUser | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isDestroyed = false;

  public init(handlers: RealtimeEventHandlers, currentUser: AppUser) {
    this.handlers = handlers;
    this.currentUser = currentUser;
    this.connect();
  }

  public updateCurrentUser(user: AppUser) {
    this.currentUser = user;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendPresenceJoin();
    }
  }

  private setStatus(newStatus: SyncConnectionStatus) {
    this.status = newStatus;
    this.handlers?.onStatusChanged(newStatus);
  }

  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  private connect() {
    if (this.isDestroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.sendPresenceJoin();

        // Setup ping heartbeat every 20 seconds
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.error('[RealtimeSync] Error parsing incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
        try {
          this.ws?.close();
        } catch {}
      };
    } catch {
      this.setStatus('offline');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff capped at 8 seconds
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private sendPresenceJoin() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'presence:join',
        user: {
          name: this.currentUser?.name || 'مستخدم متصل',
          role: this.currentUser?.role || 'عضو فريق',
          department: this.currentUser?.department || 'الدعم الفني',
          location: this.currentUser?.department || 'فرع متصل',
        },
      })
    );
  }

  private handleIncomingMessage(data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'init': {
        // Initial state from server
        if (data.state) {
          this.handlers?.onStateSynced(data.state);
        }
        if (Array.isArray(data.activeUsers)) {
          this.handlers?.onPresenceUpdated(data.activeUsers, data.totalConnections || 1);
        }
        if (data.collisions) {
          this.handlers?.onCollisionsUpdated?.(data.collisions);
        }
        break;
      }

      case 'ticket:created': {
        if (data.issue) {
          this.handlers?.onTicketCreated(data.issue, data.author || 'زميل في الفريق', data.location);
        }
        break;
      }

      case 'ticket:updated': {
        if (data.issue) {
          this.handlers?.onTicketUpdated(data.issue, data.actor || 'زميل في الفريق', data.changeType, data.details);
        }
        break;
      }

      case 'ticket:comment_added': {
        if (data.issueId && data.comment) {
          this.handlers?.onTicketCommentAdded(data.issueId, data.comment, data.actor || 'الدعم الفني');
        }
        break;
      }

      case 'ticket:deleted': {
        if (data.issueId) {
          this.handlers?.onTicketDeleted(data.issueId, data.actor || 'مدير النظام');
        }
        break;
      }

      case 'state:synced': {
        if (data.state) {
          this.handlers?.onStateSynced(data.state);
        }
        break;
      }

      case 'presence:update': {
        if (Array.isArray(data.activeUsers)) {
          this.handlers?.onPresenceUpdated(data.activeUsers, data.totalConnections || 1);
        }
        break;
      }

      case 'ticket:collisions_update': {
        if (data.collisions) {
          this.handlers?.onCollisionsUpdated?.(data.collisions);
        }
        break;
      }

      case 'external_vendors:updated': {
        if (Array.isArray(data.externalVendors)) {
          this.handlers?.onExternalVendorsUpdated?.(data.externalVendors);
        }
        break;
      }

      case 'sla_settings:updated': {
        if (data.slaSettings) {
          this.handlers?.onSlaSettingsUpdated?.(data.slaSettings);
        }
        break;
      }

      case 'cab:created': {
        if (data.activity) {
          this.handlers?.onCabCreated?.(data.activity, data.author || 'زميل في الفريق');
        }
        break;
      }

      case 'cab:updated': {
        if (data.activity) {
          this.handlers?.onCabUpdated?.(data.activity, data.author || 'زميل في الفريق', data.details);
        }
        break;
      }

      case 'cab:deleted': {
        if (data.activityId) {
          this.handlers?.onCabDeleted?.(data.activityId, data.author || 'مدير النظام');
        }
        break;
      }

      case 'supabase:config_updated': {
        if (data.supabaseConfig) {
          this.handlers?.onSupabaseConfigUpdated?.(data.supabaseConfig);
        }
        break;
      }

      default:
        break;
    }
  }

  // 1. Broadcast ticket creation to all team members instantly
  public async broadcastTicketCreate(issue: Issue, author: string, location?: string) {
    // Send via WebSocket for instant millisecond delivery
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ticket:create',
          issue,
          author,
          location,
        })
      );
    }

    // Also persist via REST API for server durability
    try {
      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, author, location }),
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST broadcast fallback error:', err);
    }
  }

  // 2. Broadcast ticket update (status, SLA, priority, assignee, timer)
  public async broadcastTicketUpdate(
    issue: Issue,
    actor: string,
    changeType?: string,
    details?: string
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ticket:update',
          issue,
          actor,
          changeType,
          details,
        })
      );
    }

    try {
      await fetch(`/api/issues/${issue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, actor, changeType, details }),
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST update fallback error:', err);
    }
  }

  // 3. Broadcast comment
  public async broadcastComment(issueId: string, comment: any, actor: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ticket:comment',
          issueId,
          comment,
          actor,
        })
      );
    }

    try {
      await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, actor }),
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST comment fallback error:', err);
    }
  }

  // 4. Broadcast ticket delete
  public async broadcastTicketDelete(issueId: string, actor: string) {
    try {
      await fetch(`/api/issues/${issueId}?actor=${encodeURIComponent(actor)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST delete error:', err);
    }
  }

  // 4b. Broadcast CAB activity create
  public async broadcastCabCreate(activity: CabBusinessActivity, author: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'cab:create',
          activity,
          author,
        })
      );
    }
    try {
      await fetch('/api/cab-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, author }),
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST CAB create error:', err);
    }
  }

  // 4c. Broadcast CAB activity update
  public async broadcastCabUpdate(activity: CabBusinessActivity, author: string, details?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'cab:update',
          activity,
          author,
          details,
        })
      );
    }
    try {
      await fetch(`/api/cab-activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, author, details }),
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST CAB update error:', err);
    }
  }

  // 4d. Broadcast CAB activity delete
  public async broadcastCabDelete(activityId: string, author: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'cab:delete',
          activityId,
          author,
        })
      );
    }
    try {
      await fetch(`/api/cab-activities/${activityId}?author=${encodeURIComponent(author)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[RealtimeSync] REST CAB delete error:', err);
    }
  }

  // 5. Initial fetch from server to get latest state
  public async fetchServerState() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('[RealtimeSync] Failed to fetch server state:', err);
    }
    return null;
  }

  // 6. Seed initial data to server if server is empty
  public async seedInitialServerData(data: {
    issues: Issue[];
    categories: CategoryRule[];
    users: AppUser[];
    tags: string[];
    cannedResponses: string[];
    generalSettings: GeneralSettings;
    soundSettings: SoundSettings;
    auditLogs: AuditLog[];
    externalVendors?: ExternalVendor[];
    slaSettings?: any;
    cabActivities?: CabBusinessActivity[];
    supabaseConfig?: any;
  }) {
    try {
      await fetch('/api/init-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('[RealtimeSync] Seed error:', err);
    }
  }

  // 7. Broadcast Supabase configuration update to all connected browsers & persist centrally
  public async broadcastSupabaseConfig(config: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'supabase:config_update',
            config,
          })
        );
      } catch (err) {
        console.warn('[RealtimeSync] sendSupabaseConfig WS error:', err);
      }
    }
    try {
      await fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (err) {
      console.warn('[RealtimeSync] sendSupabaseConfig REST error:', err);
    }
  }

  // 8. Send ticket focus (collision detection)
  public sendTicketFocus(ticketId: string, action: 'viewing' | 'editing' | 'working', user: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'ticket:focus',
            ticketId,
            action,
            user,
          })
        );
      } catch (err) {
        console.warn('[RealtimeSync] sendTicketFocus error:', err);
      }
    }
  }

  // 8. Send ticket blur (collision detection)
  public sendTicketBlur(ticketId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'ticket:blur',
            ticketId,
          })
        );
      } catch (err) {
        console.warn('[RealtimeSync] sendTicketBlur error:', err);
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
