import React from 'react';
import { Priority, IssueStatus } from '../types';
import { CheckCircle2, Clock, Pause, AlertOctagon, Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  showEnglish?: boolean;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showEnglish = true,
  size = 'sm',
}) => {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (priority) {
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500"></span>
          </span>
          <span>حرج</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Critical</span>
          )}
        </span>
      );

    case 'High':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>مرتفع</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">High</span>
          )}
        </span>
      );

    case 'Medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-sky-50 text-sky-700 border border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
          <span>متوسط</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Medium</span>
          )}
        </span>
      );

    case 'Low':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-slate-50 text-slate-700 border border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          <span>منخفض</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Low</span>
          )}
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: IssueStatus;
  showEnglish?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showEnglish = true,
  size = 'sm',
}) => {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'Open':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
          <span>مفتوحة</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Open</span>
          )}
        </span>
      );

    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
          </span>
          <span>قيد العمل</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">In Progress</span>
          )}
        </span>
      );

    case 'Pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>معلقة</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Pending</span>
          )}
        </span>
      );

    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 whitespace-nowrap shadow-2xs`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>تم الحل</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Resolved</span>
          )}
        </span>
      );

    case 'Closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          <span>مغلقة</span>
          {showEnglish && (
            <span className="text-[10px] opacity-75 font-mono tracking-tight font-medium">Closed</span>
          )}
        </span>
      );
  }
};
