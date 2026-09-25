import React from 'react';
import { Users, AlertTriangle, Eye, Edit3, Clock, ShieldAlert } from 'lucide-react';
import { TicketViewer } from '../utils/collisionDetector';

interface CollisionAlertBannerProps {
  viewers: TicketViewer[];
  compact?: boolean;
}

export const CollisionAlertBanner: React.FC<CollisionAlertBannerProps> = ({
  viewers,
  compact = false,
}) => {
  if (!viewers || viewers.length === 0) return null;

  const primary = viewers[0];
  const otherCount = viewers.length - 1;

  const getActionLabel = (action: 'viewing' | 'editing' | 'working') => {
    switch (action) {
      case 'editing':
        return { text: 'يعدّل البيانات الآن', icon: <Edit3 className="w-3.5 h-3.5 text-amber-500" />, color: 'text-amber-700 dark:text-amber-300' };
      case 'working':
        return { text: 'يعمل على العداد والحل', icon: <Clock className="w-3.5 h-3.5 text-rose-500" />, color: 'text-rose-700 dark:text-rose-300' };
      case 'viewing':
      default:
        return { text: 'يقرأ التذكرة حالياً', icon: <Eye className="w-3.5 h-3.5 text-indigo-500" />, color: 'text-indigo-700 dark:text-indigo-300' };
    }
  };

  const actionInfo = getActionLabel(primary.action);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-600/50 text-amber-800 dark:text-amber-200 text-[11px] font-bold shadow-2xs animate-pulse">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
          {primary.userAvatar || primary.userName.slice(0, 1)}
        </span>
        <span>
          {primary.userName} {actionInfo.text}
          {otherCount > 0 ? ` (+${otherCount})` : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-rose-500/10 dark:from-amber-950/50 dark:via-slate-900 dark:to-rose-950/40 border-2 border-amber-400/80 dark:border-amber-500/60 p-3.5 sm:p-4 text-xs shadow-md animate-scaleUp">
      {/* Decorative pulse line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-amber-500/20 dark:bg-amber-500/30 border border-amber-400 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>تنبيه منع تضارب العمل (Ticket Collision Guard):</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                زميل متواجد الآن 👥
              </span>
            </div>

            <p className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs leading-relaxed">
              زميلك <strong className="font-extrabold text-amber-800 dark:text-amber-200 underline">{primary.userName}</strong> ({primary.userRole}) متواجد داخل هذه التذكرة الآن و
              <span className={`font-black mx-1 inline-flex items-center gap-0.5 ${actionInfo.color}`}>
                {actionInfo.icon}
                {actionInfo.text}
              </span>
              {otherCount > 0 && <span> بالإضافة إلى {otherCount} زملاء آخرين.</span>}
              {' '}لتفادي التضارب، يرجى التنسيق معه قبل التواصل مع العميل أو حفظ تعديلات متعارضة.
            </p>
          </div>
        </div>

        {/* Viewers Avatars cluster */}
        <div className="flex items-center gap-1.5 mr-auto sm:mr-0 self-end sm:self-center">
          <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden">
            {viewers.slice(0, 3).map((v, idx) => (
              <div
                key={v.userId + idx}
                className="inline-block h-7 w-7 rounded-xl ring-2 ring-white dark:ring-slate-900 bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs"
                title={`${v.userName} (${v.userRole})`}
              >
                {v.userAvatar || v.userName.slice(0, 1)}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
            نشط الآن 🟢
          </span>
        </div>
      </div>
    </div>
  );
};
