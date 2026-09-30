import { Issue, AppUser, CabBusinessActivity, ExternalVendor, SlaSettings } from '../types';

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
  onSystemResetProduction?: (actor: string) => void;
  onCabCreated?: (activity: CabBusinessActivity, author: string) => void;
  onCabUpdated?: (activity: CabBusinessActivity, author: string, details?: string) => void;
  onCabDeleted?: (activityId: string, author: string) => void;
  onNotificationsCleared?: (actor: string) => void;
  onNotificationClearedSingle?: (id: string, actor: string) => void;
  onStateSynced: (fullState: any) => void;
  onPresenceUpdated: (users: ActiveUserPresence[], totalConnections: number) => void;
  onStatusChanged: (status: SyncConnectionStatus) => void;
  onCollisionsUpdated?: (collisions: any) => void;
  onExternalVendorsUpdated?: (vendors: ExternalVendor[]) => void;
  onSlaSettingsUpdated?: (slaSettings: any) => void;
  onSupabaseConfigUpdated?: (config: any) => void;
}

class RealtimeSyncManager {
  private socket: WebSocket | null = null;
  private status: SyncConnectionStatus = 'connecting';
  private handlers: RealtimeEventHandlers | null = null;
  private currentUser: AppUser | null = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 30;
  private messageQueue: string[] = [];
  private isDestroyed = false;
  private lastPongTime = Date.now();

  public init(handlers: RealtimeEventHandlers, currentUser: AppUser) {
    this.handlers = handlers;
    this.currentUser = currentUser;
    this.isDestroyed = false;
    this.reconnectAttempts = 0;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    this.connect();
  }

  public updateCurrentUser(user: AppUser) {
    this.currentUser = user;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'presence:join',
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
          location: user.department || 'الفرع الرئيسي',
        },
      });
    }
  }

  private handleOnline = () => {
    console.log('[RealtimeSync] Network back online, reconnecting...');
    this.setStatus('connecting');
    this.connect();
  };

  private handleOffline = () => {
    console.log('[RealtimeSync] Network offline');
    this.setStatus('offline');
    this.closeSocket();
  };

  private connect() {
    if (this.isDestroyed || typeof window === 'undefined') return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.closeSocket();
    this.setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        if (this.isDestroyed) {
          this.closeSocket();
          return;
        }
        console.log('[RealtimeSync] WebSocket connected successfully to', wsUrl);
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.lastPongTime = Date.now();

        // 1. Send Presence Join
        if (this.currentUser) {
          this.send({
            type: 'presence:join',
            user: {
              id: this.currentUser.id,
              name: this.currentUser.name,
              role: this.currentUser.role,
              department: this.currentUser.department,
              location: this.currentUser.department || 'الفرع الرئيسي',
            },
          });
        }

        // 2. Flush queued messages
        while (this.messageQueue.length > 0) {
          const queued = this.messageQueue.shift();
          if (queued) {
            try {
              this.socket?.send(queued);
            } catch (err) {
              console.warn('[RealtimeSync] Error sending queued message:', err);
            }
          }
        }

        // 3. Start Heartbeat
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.error('[RealtimeSync] Error parsing incoming WS message:', err);
        }
      };

      this.socket.onclose = (_event) => {
        this.stopHeartbeat();
        if (!this.isDestroyed) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[RealtimeSync] WebSocket connection error:', err);
        this.stopHeartbeat();
        if (!this.isDestroyed) {
          this.setStatus('disconnected');
        }
      };
    } catch (err) {
      console.error('[RealtimeSync] Failed to instantiate WebSocket:', err);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private handleIncomingMessage(data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'pong':
        this.lastPongTime = Date.now();
        break;

      case 'init':
        if (Array.isArray(data.activeUsers)) {
          this.handlers?.onPresenceUpdated(data.activeUsers, data.totalConnections || 1);
        }
        if (data.collisions) {
          this.handlers?.onCollisionsUpdated?.(data.collisions);
        }
        if (data.state) {
          this.handlers?.onStateSynced(data.state);
        }
        break;

      case 'presence:updated':
        if (Array.isArray(data.activeUsers)) {
          this.handlers?.onPresenceUpdated(data.activeUsers, data.totalConnections || 1);
        }
        break;

      case 'collisions:updated':
        if (data.collisions) {
          this.handlers?.onCollisionsUpdated?.(data.collisions);
        }
        break;

      case 'ticket:created':
        if (data.issue) {
          this.handlers?.onTicketCreated(data.issue, data.author || 'عضو في الفريق', data.location);
        }
        break;

      case 'ticket:updated':
        if (data.issue) {
          this.handlers?.onTicketUpdated(data.issue, data.actor || 'عضو في الفريق', data.changeType, data.details);
        }
        break;

      case 'ticket:comment_added':
        if (data.issueId && data.comment) {
          this.handlers?.onTicketCommentAdded(data.issueId, data.comment, data.actor || 'عضو في الفريق');
        }
        break;

      case 'ticket:deleted':
        if (data.issueId) {
          this.handlers?.onTicketDeleted(data.issueId, data.actor || 'مدير النظام');
        }
        break;

      case 'ticket:bulk_deleted':
        if (Array.isArray(data.issueIds)) {
          this.handlers?.onTicketBulkDeleted?.(data.issueIds, data.actor || 'مدير النظام');
        }
        break;

      case 'tickets:cleared':
        this.handlers?.onTicketsCleared?.(data.actor || 'مدير النظام');
        break;

      case 'system:reset_production':
        this.handlers?.onSystemResetProduction?.(data.actor || 'مدير النظام');
        break;

      case 'cab:created':
        if (data.activity) {
          this.handlers?.onCabCreated?.(data.activity, data.author || 'عضو في الفريق');
        }
        break;

      case 'cab:updated':
        if (data.activity) {
          this.handlers?.onCabUpdated?.(data.activity, data.author || 'عضو في الفريق', data.details);
        }
        break;

      case 'cab:deleted':
        if (data.activityId) {
          this.handlers?.onCabDeleted?.(data.activityId, data.author || 'مدير النظام');
        }
        break;

      case 'notifications:cleared':
        this.handlers?.onNotificationsCleared?.(data.actor || 'عضو في الفريق');
        break;

      case 'notification:cleared_single':
        if (data.id) {
          this.handlers?.onNotificationClearedSingle?.(data.id, data.actor || 'عضو في الفريق');
        }
        break;

      case 'supabase:config_updated':
        if (data.supabaseConfig) {
          this.handlers?.onSupabaseConfigUpdated?.(data.supabaseConfig);
        }
        break;

      case 'state:synced':
        if (data.state) {
          this.handlers?.onStateSynced(data.state);
        }
        break;

      default:
        break;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send Ping
        this.send({ type: 'ping' });
        // Check if pong was missed for more than 40s
        if (Date.now() - this.lastPongTime > 40000) {
          console.warn('[RealtimeSync] Ping timeout, reconnecting...');
          this.connect();
        }
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDestroyed) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, Math.min(this.reconnectAttempts, 8)), 12000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  private closeSocket() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }

  private setStatus(newStatus: SyncConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.handlers?.onStatusChanged(newStatus);
    }
  }

  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  private send(payload: any) {
    const raw = JSON.stringify(payload);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(raw);
      } catch (err) {
        console.warn('[RealtimeSync] Failed to send message, queuing:', err);
        this.enqueue(raw);
      }
    } else {
      this.enqueue(raw);
    }
  }

  private enqueue(raw: string) {
    if (this.messageQueue.length > 50) {
      this.messageQueue.shift();
    }
    this.messageQueue.push(raw);
  }

  // --- Broadcast methods called by the app ---

  public async broadcastTicketCreate(issue: Issue, author: string, location?: string) {
    this.send({
      type: 'ticket:create',
      issue,
      author,
      location,
    });
  }

  public async broadcastTicketUpdate(issue: Issue, actor: string, changeType?: string, details?: string) {
    this.send({
      type: 'ticket:update',
      issue,
      actor,
      changeType,
      details,
    });
  }

  public async broadcastComment(issueId: string, comment: any, actor: string) {
    this.send({
      type: 'ticket:comment',
      issueId,
      comment,
      actor,
    });
  }

  public async broadcastTicketDelete(issueId: string, actor: string) {
    this.send({
      type: 'ticket:delete',
      issueId,
      actor,
    });
  }

  public async broadcastBulkTicketDelete(issueIds: string[], actor: string) {
    this.send({
      type: 'ticket:bulk_delete',
      issueIds,
      actor,
    });
  }

  public async broadcastClearAllTickets(actor: string) {
    this.send({
      type: 'tickets:clear',
      actor,
    });
  }

  public async broadcastResetProduction(actor: string) {
    this.send({
      type: 'system:reset_production',
      actor,
    });
  }

  public async broadcastCabCreate(activity: CabBusinessActivity, author: string) {
    this.send({
      type: 'cab:create',
      activity,
      author,
    });
  }

  public async broadcastCabUpdate(activity: CabBusinessActivity, author: string, details?: string) {
    this.send({
      type: 'cab:update',
      activity,
      author,
      details,
    });
  }

  public async broadcastCabDelete(activityId: string, author: string) {
    this.send({
      type: 'cab:delete',
      activityId,
      author,
    });
  }

  public async broadcastClearNotifications(actor: string) {
    this.send({
      type: 'notifications:clear_all',
      actor,
    });
  }

  public async broadcastClearSingleNotification(id: string, actor: string) {
    this.send({
      type: 'notification:clear_single',
      id,
      actor,
    });
  }

  public async broadcastSupabaseConfig(config: any) {
    this.send({
      type: 'supabase:config_update',
      config,
    });
  }

  public sendTicketFocus(ticketId: string, action: 'viewing' | 'editing' | 'working', user: any) {
    this.send({
      type: 'ticket:focus',
      ticketId,
      action,
      user,
    });
  }

  public sendTicketBlur(ticketId: string) {
    this.send({
      type: 'ticket:blur',
      ticketId,
    });
  }

  public async fetchServerState() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const fullState = await res.json();
        if (this.handlers) {
          this.handlers.onStateSynced(fullState);
        }
        return fullState;
      }
    } catch (err) {
      console.warn('[RealtimeSync] fetchServerState error:', err);
    }
    return null;
  }

  public async seedInitialServerData(data: any) {
    try {
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('[RealtimeSync] seedInitialServerData error:', err);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.closeSocket();
  }
}

export const realtimeSync = new RealtimeSyncManager();
