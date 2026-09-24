import React, { createContext, useContext } from 'react';
import { Priority, IssueStatus, BadgeStyleType } from '../types';
import { CheckCircle2, Clock, Pause, AlertOctagon, Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const BadgeStyleContext = createContext<BadgeStyleType>('clean-arabic');

export const BadgeStyleProvider: React.FC<{
  style?: BadgeStyleType;
  children: React.ReactNode;
}> = ({ style = 'clean-arabic', children }) => {
  return (
    <BadgeStyleContext.Provider value={style}>
      {children}
    </BadgeStyleContext.Provider>
  );
};

export const useBadgeStyle = (): BadgeStyleType => {
  return useContext(BadgeStyleContext);
};

export interface PriorityBadgeProps {
  priority: Priority;
  style?: BadgeStyleType;
  showEnglish?: boolean;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  style: propStyle,
  showEnglish,
  size = 'sm',
}) => {
  const contextStyle = useBadgeStyle();
  const activeStyle: BadgeStyleType = propStyle || contextStyle || 'clean-arabic';

  // Determine if English tag should show based on activeStyle and prop override
  const shouldShowEnglish = showEnglish !== undefined 
    ? showEnglish 
    : activeStyle === 'bilingual';

  const padSm = activeStyle === 'modern-pill' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[11px]';
  const padMd = activeStyle === 'modern-pill' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-xs';
  const pad = size === 'sm' ? padSm : padMd;

  // Render by Style
  if (activeStyle === 'modern-pill') {
    switch (priority) {
      case 'Critical':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/25 whitespace-nowrap shadow-2xs`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500"></span>
            </span>
            <span>حرج</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Critical</span>
            )}
          </span>
        );

      case 'High':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>مرتفع</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">High</span>
            )}
          </span>
        );

      case 'Medium':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
            <span>متوسط</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Medium</span>
            )}
          </span>
        );

      case 'Low':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
            <span>منخفض</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Low</span>
            )}
          </span>
        );
    }
  }

  if (activeStyle === 'bilingual') {
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
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-rose-200 dark:border-rose-800 pr-1.5 mr-0.5">Critical</span>
          </span>
        );

      case 'High':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>مرتفع</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-amber-200 dark:border-amber-800 pr-1.5 mr-0.5">High</span>
          </span>
        );

      case 'Medium':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-sky-50 text-sky-700 border border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
            <span>متوسط</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-sky-200 dark:border-sky-800 pr-1.5 mr-0.5">Medium</span>
          </span>
        );

      case 'Low':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-slate-50 text-slate-700 border border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
            <span>منخفض</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-slate-200 dark:border-slate-700 pr-1.5 mr-0.5">Low</span>
          </span>
        );
    }
  }

  // Default: 'clean-arabic' (Clean Arabic Only)
  switch (priority) {
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500"></span>
          </span>
          <span>حرج</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Critical</span>
          )}
        </span>
      );

    case 'High':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>مرتفع</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">High</span>
          )}
        </span>
      );

    case 'Medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-sky-50 text-sky-700 border border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
          <span>متوسط</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Medium</span>
          )}
        </span>
      );

    case 'Low':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-slate-100 text-slate-700 border border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          <span>منخفض</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Low</span>
          )}
        </span>
      );
  }
};

export interface StatusBadgeProps {
  status: IssueStatus;
  style?: BadgeStyleType;
  showEnglish?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  style: propStyle,
  showEnglish,
  size = 'sm',
}) => {
  const contextStyle = useBadgeStyle();
  const activeStyle: BadgeStyleType = propStyle || contextStyle || 'clean-arabic';

  const shouldShowEnglish = showEnglish !== undefined 
    ? showEnglish 
    : activeStyle === 'bilingual';

  const padSm = activeStyle === 'modern-pill' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[11px]';
  const padMd = activeStyle === 'modern-pill' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-xs';
  const pad = size === 'sm' ? padSm : padMd;

  // Modern Pill Style
  if (activeStyle === 'modern-pill') {
    switch (status) {
      case 'Open':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/25 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>مفتوحة</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Open</span>
            )}
          </span>
        );

      case 'In Progress':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/25 whitespace-nowrap shadow-2xs`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
            </span>
            <span>قيد العمل</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">In Progress</span>
            )}
          </span>
        );

      case 'Pending':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25 whitespace-nowrap shadow-2xs`}
          >
            <Pause className="w-3 h-3 text-amber-500 shrink-0" />
            <span>معلقة</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Pending</span>
            )}
          </span>
        );

      case 'Resolved':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25 whitespace-nowrap shadow-2xs`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>تم الحل</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Resolved</span>
            )}
          </span>
        );

      case 'Closed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
            <span>مغلقة</span>
            {shouldShowEnglish && (
              <span className="text-[10px] opacity-70 font-mono font-medium">Closed</span>
            )}
          </span>
        );
    }
  }

  // Bilingual Style
  if (activeStyle === 'bilingual') {
    switch (status) {
      case 'Open':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>مفتوحة</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-rose-200 dark:border-rose-800 pr-1.5 mr-0.5">Open</span>
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
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-indigo-200 dark:border-indigo-800 pr-1.5 mr-0.5">In Progress</span>
          </span>
        );

      case 'Pending':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>معلقة</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-amber-200 dark:border-amber-800 pr-1.5 mr-0.5">Pending</span>
          </span>
        );

      case 'Resolved':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 whitespace-nowrap shadow-2xs`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>تم الحل</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-emerald-200 dark:border-emerald-800 pr-1.5 mr-0.5">Resolved</span>
          </span>
        );

      case 'Closed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
            <span>مغلقة</span>
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium border-r border-slate-200 dark:border-slate-700 pr-1.5 mr-0.5">Closed</span>
          </span>
        );
    }
  }

  // Clean Arabic Only (Default)
  switch (status) {
    case 'Open':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
          <span>مفتوحة</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Open</span>
          )}
        </span>
      );

    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
          </span>
          <span>قيد العمل</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">In Progress</span>
          )}
        </span>
      );

    case 'Pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span>معلقة</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Pending</span>
          )}
        </span>
      );

    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 whitespace-nowrap shadow-2xs`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>تم الحل</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Resolved</span>
          )}
        </span>
      );

    case 'Closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold ${pad} rounded-lg bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          <span>مغلقة</span>
          {shouldShowEnglish && (
            <span className="text-[10px] opacity-65 font-mono tracking-tight font-medium">Closed</span>
          )}
        </span>
      );
  }
};
