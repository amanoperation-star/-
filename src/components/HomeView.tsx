import React from 'react';
import { 
  ListTodo, 
  Clock, 
  CheckCircle2, 
  Radio, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { WelcomeHeroBanner } from './WelcomeHeroBanner';
import { Issue, AppUser, GeneralSettings } from '../types';

interface HomeViewProps {
  currentUser: AppUser;
  issues: Issue[];
  generalSettings?: GeneralSettings;
  breachedCount: number;
  onNavigateToIssues: () => void;
  onNavigateToSla: () => void;
  onNavigateToCustomer?: () => void;
  onNavigateToAdmin?: () => void;
  onSelectTicket?: (issue: Issue) => void;
  onOpenNewTicketModal?: () => void;
  onlineCount?: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  issues = [],
  generalSettings,
  breachedCount = 0,
  onNavigateToIssues,
  onNavigateToSla,
  onlineCount = 1,
}) => {
  const activeIssues = issues.filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Closed'
  );
  const resolvedIssues = issues.filter(
    (i) => i.status === 'Resolved' || i.status === 'Closed'
  );

  const slaCompliance = issues.length > 0 
    ? Math.round(((issues.length - breachedCount) / issues.length) * 100) 
    : 100;

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Professional Welcome Hero Banner (مطابق للصورة تماماً مع تخصيص الإعدادات) */}
      <WelcomeHeroBanner
        currentUser={currentUser}
        onOpenIssues={onNavigateToIssues}
        generalSettings={generalSettings}
        activeTicketsCount={activeIssues.length}
        breachedCount={breachedCount}
      />

      {/* 2. Quick System Pulse KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tickets Card */}
        <div 
          onClick={onNavigateToIssues}
          className="p-4 rounded-2xl bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">التذاكر النشطة</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{activeIssues.length}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">قيد المتابعة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
            <span>انقر للانتقال إلى سجل التذاكر</span>
            <ArrowLeft className="w-3 h-3" />
          </p>
        </div>

        {/* SLA Compliance Card */}
        <div 
          onClick={onNavigateToSla}
          className="p-4 rounded-2xl bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">التزام SLA</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{slaCompliance}%</span>
            {breachedCount > 0 ? (
              <span className="text-xs text-rose-500 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {breachedCount} متأخرة
              </span>
            ) : (
              <span className="text-xs text-emerald-500 font-bold">ممتاز 🟢</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
            <span>مراقبة المواعيد والإنذارات</span>
            <ArrowLeft className="w-3 h-3" />
          </p>
        </div>

        {/* Resolved Tickets Card */}
        <div 
          onClick={onNavigateToIssues}
          className="p-4 rounded-2xl bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">التذاكر المنجزة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{resolvedIssues.length}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">تم حلها بنجاح</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">سجل التذاكر المغلقة والمؤرشفة</p>
        </div>

        {/* Live Cloud Presence Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المزامنة السحابية</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping"></span>
              متصل
            </span>
            <span className="text-xs text-slate-500 font-bold">({onlineCount} مستخدم)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">مزامنة فورية ثانية بثانية ⚡</p>
        </div>
      </div>
    </div>
  );
};
