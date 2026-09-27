import { Priority, SlaSettings, Issue } from '../types';

export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  Critical: 4,
  High: 12,
  Medium: 24,
  Low: 48,
};

export const DEFAULT_SLA_SETTINGS: SlaSettings = {
  businessHoursOnly: false,
  workStartHour: 9,
  workEndHour: 17,
  workDays: [0, 1, 2, 3, 4], // Sun - Thu
  pauseOnExternalPending: true,
  pauseOnCustomerPending: true,
  warningThresholdMinutes: 120, // 2 hours
  autoEscalateOnBreach: true,
  soundAlertOnRisk: true,
  activePreset: 'standard',
};

const EXTERNAL_TICKET_SEQ_KEY = 'EXT_TICKET_SEQ_COUNTER';

/**
 * توليد رقم البلاغ أو التذكرة لدى الطرف الخارجي تلقائياً بالتسلسل المطلوب
 * بصيغة مثل: INC-1006 ويمشي بالترتيب
 */
export function generateExternalTicketRef(
  _company?: string,
  _vendorName?: string,
  existingIssues?: Issue[]
): string {
  let highestNum = 1005; // البداية لتكون التذكرة القادمة 1006 فما فوق

  // فحص أرقام التذاكر الخارجية والداخلية الموجودة مسبقاً لاستخراج أعلى تسلسل
  if (Array.isArray(existingIssues) && existingIssues.length > 0) {
    existingIssues.forEach((issue) => {
      // فحص رقم التذكرة الخارجي
      const extId = issue.externalOwnerDetails?.externalTicketId;
      if (extId) {
        const m = extId.match(/INC-(\d+)/i);
        if (m && m[1]) {
          const val = parseInt(m[1], 10);
          if (!isNaN(val) && val > highestNum) highestNum = val;
        }
      }
      // فحص معرّف التذكرة الداخلي أيضاً
      if (issue.id) {
        const m = issue.id.match(/INC-(\d+)/i);
        if (m && m[1]) {
          const val = parseInt(m[1], 10);
          if (!isNaN(val) && val > highestNum) highestNum = val;
        }
      }
    });
  }

  // فحص العداد المحفوظ محلياً أيضاً لضمان الترتيب التراكمي الدائم
  try {
    const saved = localStorage.getItem(EXTERNAL_TICKET_SEQ_KEY);
    if (saved) {
      const savedNum = parseInt(saved, 10);
      if (!isNaN(savedNum) && savedNum > highestNum) {
        highestNum = savedNum;
      }
    }
  } catch {}

  const nextSeq = highestNum + 1;

  // حفظ الرقم الأحدث للتسلسل التالي
  try {
    localStorage.setItem(EXTERNAL_TICKET_SEQ_KEY, nextSeq.toString());
  } catch {}

  return `INC-${nextSeq}`;
}

export function calculateDueDate(
  createdAtIso: string,
  priority: Priority,
  customHours?: number,
  options?: { businessHoursOnly?: boolean; workStartHour?: number; workEndHour?: number; workDays?: number[] }
): string {
  const created = new Date(createdAtIso);
  const hours = customHours || DEFAULT_SLA_HOURS[priority] || 24;

  if (options?.businessHoursOnly) {
    // حساب الموعد وفقاً لساعات وأيام العمل الرسمية
    const startH = options.workStartHour ?? 9;
    const endH = options.workEndHour ?? 17;
    const workHoursPerDay = Math.max(1, endH - startH);
    const workDays = options.workDays ?? [0, 1, 2, 3, 4];

    let remainingHours = hours;
    let current = new Date(created);

    while (remainingHours > 0) {
      const day = current.getDay();
      const currentH = current.getHours();

      if (workDays.includes(day)) {
        if (currentH >= startH && currentH < endH) {
          const hoursLeftToday = endH - currentH;
          if (remainingHours <= hoursLeftToday) {
            current.setHours(currentH + remainingHours);
            remainingHours = 0;
            break;
          } else {
            remainingHours -= hoursLeftToday;
            current.setDate(current.getDate() + 1);
            current.setHours(startH, 0, 0, 0);
          }
        } else if (currentH < startH) {
          current.setHours(startH, 0, 0, 0);
        } else {
          current.setDate(current.getDate() + 1);
          current.setHours(startH, 0, 0, 0);
        }
      } else {
        current.setDate(current.getDate() + 1);
        current.setHours(startH, 0, 0, 0);
      }
    }
    return current.toISOString();
  }

  const due = new Date(created.getTime() + hours * 60 * 60 * 1000);
  return due.toISOString();
}

export function isTicketSlaBreached(createdAt: string, dueDate: string, status: string, slaPaused?: boolean): boolean {
  if (status === 'Resolved' || status === 'Closed' || slaPaused) {
    return false;
  }
  const now = new Date();
  const due = new Date(dueDate);
  return now.getTime() > due.getTime();
}

export function isTicketSlaAtRisk(dueDate: string, status: string, warningThresholdMinutes = 120, slaPaused?: boolean): boolean {
  if (status === 'Resolved' || status === 'Closed' || slaPaused) {
    return false;
  }
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  return diff > 0 && diff <= warningThresholdMinutes * 60 * 1000;
}

export function getRemainingTimeFormatted(dueDate: string, status: string, slaPaused?: boolean, pausedReason?: string): { text: string; isOverdue: boolean; isPaused?: boolean } {
  if (status === 'Resolved' || status === 'Closed') {
    return { text: 'مكتملة', isOverdue: false };
  }
  if (slaPaused) {
    return { 
      text: pausedReason ? `⏸️ العداد مجمّد (${pausedReason})` : '⏸️ العداد مجمّد (طرف خارجي)', 
      isOverdue: false, 
      isPaused: true 
    };
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
