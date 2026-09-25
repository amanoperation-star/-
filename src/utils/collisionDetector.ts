import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { realtimeSync } from './realtimeSync';

export interface TicketViewer {
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string;
  ticketId: string;
  action: 'viewing' | 'editing' | 'working';
  timestamp: number;
}

const COLLISION_STORAGE_PREFIX = 'ENTERPRISE_COLLISION_';

class CollisionManager {
  private activeViewers: Map<string, TicketViewer[]> = new Map();
  private listeners: Set<() => void> = new Set();
  private heartbeatInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(COLLISION_STORAGE_PREFIX)) {
          this.syncFromStorage();
          this.notifyListeners();
        }
      });

      // Cleanup expired entries periodically (every 10 seconds)
      this.heartbeatInterval = setInterval(() => {
        this.cleanupExpired();
      }, 10000);

      this.syncFromStorage();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private syncFromStorage() {
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(COLLISION_STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const viewer: TicketViewer = JSON.parse(raw);
            if (now - viewer.timestamp < 45000) {
              const list = this.activeViewers.get(viewer.ticketId) || [];
              const filtered = list.filter((v) => v.userId !== viewer.userId && v.userName !== viewer.userName);
              filtered.push(viewer);
              this.activeViewers.set(viewer.ticketId, filtered);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {}
  }

  private cleanupExpired() {
    const now = Date.now();
    let changed = false;

    for (const [ticketId, viewers] of this.activeViewers.entries()) {
      const valid = viewers.filter((v) => now - v.timestamp < 45000);
      if (valid.length !== viewers.length) {
        changed = true;
        if (valid.length === 0) {
          this.activeViewers.delete(ticketId);
        } else {
          this.activeViewers.set(ticketId, valid);
        }
      }
    }

    if (changed) {
      this.notifyListeners();
    }
  }

  /**
   * Set collisions state received from WebSocket server
   */
  public updateServerCollisions(serverMap: Record<string, TicketViewer[]>) {
    const now = Date.now();
    for (const [ticketId, viewers] of Object.entries(serverMap)) {
      const valid = (viewers || []).filter((v) => now - v.timestamp < 60000);
      if (valid.length > 0) {
        this.activeViewers.set(ticketId, valid);
      } else {
        this.activeViewers.delete(ticketId);
      }
    }
    this.notifyListeners();
  }

  /**
   * Notify that current user is focusing/editing/working on a ticket
   */
  public notifyFocus(ticketId: string, action: 'viewing' | 'editing' | 'working', user: AppUser) {
    if (!ticketId || !user) return;
    const viewer: TicketViewer = {
      ticketId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userAvatar: user.avatar,
      action,
      timestamp: Date.now(),
    };

    // 1. Send via WebSocket if available
    realtimeSync.sendTicketFocus(ticketId, action, {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });

    // 2. Set in localStorage for instant multi-tab presence
    try {
      localStorage.setItem(`${COLLISION_STORAGE_PREFIX}${ticketId}_${user.id}`, JSON.stringify(viewer));
    } catch {}

    // 3. Local state
    const list = this.activeViewers.get(ticketId) || [];
    const filtered = list.filter((v) => v.userId !== user.id && v.userName !== user.name);
    filtered.push(viewer);
    this.activeViewers.set(ticketId, filtered);
    this.notifyListeners();
  }

  /**
   * Notify that user closed modal or stopped editing/viewing
   */
  public notifyBlur(ticketId: string, user: AppUser) {
    if (!ticketId || !user) return;

    realtimeSync.sendTicketBlur(ticketId);

    try {
      localStorage.removeItem(`${COLLISION_STORAGE_PREFIX}${ticketId}_${user.id}`);
    } catch {}

    const list = this.activeViewers.get(ticketId) || [];
    const filtered = list.filter((v) => v.userId !== user.id && v.userName !== user.name);
    if (filtered.length > 0) {
      this.activeViewers.set(ticketId, filtered);
    } else {
      this.activeViewers.delete(ticketId);
    }
    this.notifyListeners();
  }

  /**
   * Returns all other team members currently in this ticket
   */
  public getOtherViewers(ticketId: string, currentUserId: string, currentUserName: string): TicketViewer[] {
    const list = this.activeViewers.get(ticketId) || [];
    const now = Date.now();
    return list.filter(
      (v) =>
        now - v.timestamp < 45000 &&
        v.userId !== currentUserId &&
        v.userName.trim().toLowerCase() !== currentUserName.trim().toLowerCase()
    );
  }

  public getAllCollisionsMap(currentUserId: string, currentUserName: string): Record<string, TicketViewer[]> {
    const result: Record<string, TicketViewer[]> = {};
    for (const [ticketId] of this.activeViewers.entries()) {
      const others = this.getOtherViewers(ticketId, currentUserId, currentUserName);
      if (others.length > 0) {
        result[ticketId] = others;
      }
    }
    return result;
  }
}

export const collisionManager = new CollisionManager();

/**
 * React hook to watch collisions for a specific ticket
 */
export function useTicketCollision(ticketId: string | undefined | null, currentUser: AppUser) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsub = collisionManager.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  if (!ticketId) {
    return {
      otherViewers: [],
      hasCollision: false,
      primaryCollision: null,
    };
  }

  const otherViewers = collisionManager.getOtherViewers(ticketId, currentUser.id, currentUser.name);
  return {
    otherViewers,
    hasCollision: otherViewers.length > 0,
    primaryCollision: otherViewers[0] || null,
  };
}

/**
 * React hook to watch all ticket collisions across the system (for the table & cards)
 */
export function useAllTicketCollisions(currentUser: AppUser) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsub = collisionManager.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  return collisionManager.getAllCollisionsMap(currentUser.id, currentUser.name);
}
