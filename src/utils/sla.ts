import { Priority } from '../types';

export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  Critical: 4,
  High: 12,
  Medium: 24,
  Low: 48,
};

export function calculateDueDate(createdAtIso: string, priority: Priority, customHours?: number): string {
  const created = new Date(createdAtIso);
  const hours = customHours || DEFAULT_SLA_HOURS[priority] || 24;
  const due = new Date(created.getTime() + hours * 60 * 60 * 1000);
  return due.toISOString();
}

export function isTicketSlaBreached(createdAt: string, dueDate: string, status: string): boolean {
  if (status === 'Resolved' || status === 'Closed') {
    return false;
  }
  const now = new Date();
  const due = new Date(dueDate);
  return now.getTime() > due.getTime();
}

export function getRemainingTimeFormatted(dueDate: string, status: string): { text: string; isOverdue: boolean } {
  if (status === 'Resolved' || status === 'Closed') {
    return { text: 'مكتملة', isOverdue: false };
  }
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;

  if (diff <= 0) {
    const overdueSec = Math.abs(Math.floor(diff / 1000));
    const h = Math.floor(overdueSec / 3600);
    const m = Math.floor((overdueSec % 3600) / 60);
    return { text: `متأخرة بـ ${h} س و ${m} د`, isOverdue: true };
  }

  const remainingSec = Math.floor(diff / 1000);
  const h = Math.floor(remainingSec / 3600);
  const m = Math.floor((remainingSec % 3600) / 60);
  if (h > 24) {
    const days = Math.floor(h / 24);
    return { text: `متبقي ${days} يوم و ${h % 24} س`, isOverdue: false };
  }
  return { text: `متبقي ${h} س و ${m} د`, isOverdue: false };
}

export function formatSecondsToHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

export function formatArabicDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
