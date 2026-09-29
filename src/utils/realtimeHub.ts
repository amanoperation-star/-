import { supabase } from './supabaseClient';
import { realtimeSync } from './realtimeSync';
import { Issue, CabBusinessActivity } from '../types';

export type TeamRealtimeEventType =
  | 'ticket:created'
  | 'ticket:updated'
  | 'ticket:deleted'
  | 'ticket:bulk_deleted'
  | 'ticket:comment'
  | 'cab:created'
  | 'cab:updated'
  | 'cab:deleted'
  | 'team:ping';

export interface TeamRealtimePayload {
  event: TeamRealtimeEventType;
  data: any;
  senderId: string;
  senderName: string;
  timestamp: number;
}

type RealtimeListener = (payload: TeamRealtimePayload) => void;

class TeamRealtimeHub {
  private listeners: Set<RealtimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private clientInstanceId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  private isSubscribed = false;

  constructor() {
    this.initCrossTabChannel();
    this.initSupabaseChannel();
  }

  private initCrossTabChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('enterprise_team_realtime_hub');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.senderId !== this.clientInstanceId) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('[RealtimeHub] BroadcastChannel init warning:', err);
      }
    }
  }

  public initSupabaseChannel() {
    if (!supabase || this.isSubscribed) return;

    try {
      this.supabaseChannel = supabase
        .channel('system:team_realtime_hub', {
          config: {
            broadcast: { ack: false, self: false },
          },
        })
        .on('broadcast', { event: 'team_event' }, (payload: any) => {
          if (payload && payload.payload) {
            const data = payload.payload as TeamRealtimePayload;
            if (data.senderId !== this.clientInstanceId) {
              console.log('[RealtimeHub] Received remote Supabase broadcast:', data.event, data);
              this.notifyListeners(data);
            }
          }
        })
        .subscribe((status: string) => {
          console.log('[RealtimeHub] Supabase Broadcast Channel status:', status);
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
          }
        });
    } catch (err) {
      console.warn('[RealtimeHub] Supabase broadcast subscription warning:', err);
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(payload: TeamRealtimePayload) {
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('[RealtimeHub] Listener error:', err);
      }
    });
  }

  /**
   * Broadcast an event across all devices, browsers, and tabs simultaneously!
   */
  public broadcast(event: TeamRealtimeEventType, data: any, senderName = 'عضو في الفريق') {
    const payload: TeamRealtimePayload = {
      event,
      data,
      senderId: this.clientInstanceId,
      senderName,
      timestamp: Date.now(),
    };

    // 1. Send via Supabase Broadcast (reaches every device anywhere in the world)
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'team_event',
        payload,
      }).catch((err: any) => {
        console.warn('[RealtimeHub] Supabase broadcast send error:', err);
      });
    }

    // 2. Send via local WebSockets
    switch (event) {
      case 'ticket:created':
        if (data.issue) {
          realtimeSync.broadcastTicketCreate(data.issue, senderName, data.location);
        }
        break;
      case 'ticket:updated':
        if (data.issue) {
          realtimeSync.broadcastTicketUpdate(data.issue, senderName, data.changeType, data.details);
        }
        break;
      case 'ticket:deleted':
        if (data.issueId) {
          realtimeSync.broadcastTicketDelete(data.issueId, senderName);
        }
        break;
      case 'ticket:bulk_deleted':
        if (data.issueIds) {
          realtimeSync.broadcastBulkTicketDelete(data.issueIds, senderName);
        }
        break;
      case 'ticket:comment':
        if (data.issueId && data.comment) {
          realtimeSync.broadcastComment(data.issueId, data.comment, senderName);
        }
        break;
      case 'cab:created':
        if (data.activity) {
          realtimeSync.broadcastCabCreate(data.activity, senderName);
        }
        break;
      case 'cab:updated':
        if (data.activity) {
          realtimeSync.broadcastCabUpdate(data.activity, senderName, data.details);
        }
        break;
      case 'cab:deleted':
        if (data.activityId) {
          realtimeSync.broadcastCabDelete(data.activityId, senderName);
        }
        break;
      default:
        break;
    }

    // 3. Send via Browser BroadcastChannel (0ms multi-tab)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (err) {
        console.warn('[RealtimeHub] BroadcastChannel post error:', err);
      }
    }
  }
}

export const realtimeHub = new TeamRealtimeHub();
