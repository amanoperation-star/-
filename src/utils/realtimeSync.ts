import { Issue, AppUser, CategoryRule, GeneralSettings, SoundSettings, AuditLog } from '../types';

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
  onStateSynced: (fullState: any) => void;
  onPresenceUpdated: (users: ActiveUserPresence[], totalConnections: number) => void;
  onStatusChanged: (status: SyncConnectionStatus) => void;
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

      this.ws.onerror = (err) => {
        console.warn('[RealtimeSync] WebSocket encountered error:', err);
        this.setStatus('disconnected');
        try {
          this.ws?.close();
        } catch {}
      };
    } catch (err) {
      console.error('[RealtimeSync] Connection initialization failed:', err);
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
        if (data.state && data.state.issues && data.state.issues.length > 0) {
          this.handlers?.onStateSynced(data.state);
        }
        if (Array.isArray(data.activeUsers)) {
          this.handlers?.onPresenceUpdated(data.activeUsers, data.totalConnections || 1);
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
