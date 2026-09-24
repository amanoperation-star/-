import React from 'react';
import { 
  FolderOpen, 
  AlertCircle, 
  Hourglass, 
  AlertTriangle, 
  Star, 
  PieChart, 
  BarChart3, 
  Layers, 
  Users, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { Issue, AppUser, CategoryRule } from '../types';
import { isTicketSlaBreached, formatSecondsToHMS } from '../utils/sla';
import { PriorityBadge } from './Badges';

interface DashboardViewProps {
  issues: Issue[];
  users: AppUser[];
  categories: CategoryRule[];
  onSelectTicket: (ticket: Issue) => void;
  onFilterByStatus: (status: string) => void;
  onOpenCustomerProfile?: (clientName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  issues,
  users,
  categories,
  onSelectTicket,
  onFilterByStatus,
  onOpenCustomerProfile,
}) => {
  const total = issues.length;
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const pendingCount = issues.filter((i) => i.status === 'Pending').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const breachedIssues = issues.filter((i) => isTicketSlaBreached(i.createdAt, i.dueDate, i.status));
  const breachedCount = breachedIssues.length;

  // CSAT Score
  const ratedIssues = issues.filter((i) => i.csat && i.csat > 0);
  const avgCsat =
    ratedIssues.length > 0
      ? (ratedIssues.reduce((acc, curr) => acc + curr.csat, 0) / ratedIssues.length).toFixed(1)
      : '4.8';

  // SLA Compliance Rate
  const complianceRate = total > 0 ? Math.round(((total - breachedCount) / total) * 100) : 100;

  // Total logged work time in hours
  const totalWorkSeconds = issues.reduce((acc, curr) => acc + (curr.workTime || 0), 0);
  const totalWorkHours = (totalWorkSeconds / 3600).toFixed(1);

  // Status breakdown
  const statusCounts = {
    Open: openCount,
    'In Progress': inProgressCount,
    Pending: pendingCount,
    Resolved: resolvedCount,
  };

  // Priority breakdown
  const priorityCounts = {
    Critical: issues.filter((i) => i.priority === 'Critical').length,
    High: issues.filter((i) => i.priority === 'High').length,
    Medium: issues.filter((i) => i.priority === 'Medium').length,
    Low: issues.filter((i) => i.priority === 'Low').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div 
          onClick={() => onFilterByStatus('ALL')}
          className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between cursor-pointer transition hover:border-indigo-500/50"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المشاكل والطلبات</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{total}</h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">سجل شامل لكافة الأقسام</span>
          </div>
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-lg">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Active Open & In Progress */}
        <div 
          onClick={() => onFilterByStatus('Open')}
          className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between cursor-pointer transition hover:border-rose-500/50"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">نشطة (مفتوحة + قيد العمل)</p>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {openCount + inProgressCount}
            </h2>
            <span className="text-[10px] text-rose-500/90 dark:text-rose-300/80 font-medium">
              {openCount} مفتوحة • {inProgressCount} قيد المعالجة
            </span>
          </div>
          <div className="w-11 h-11 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Pending */}
        <div 
          onClick={() => onFilterByStatus('Pending')}
          className="bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between cursor-pointer transition hover:border-amber-500/50"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">معلقة (Pending 🟠)</p>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h2>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-300/80 font-medium">بانتظار العميل أو طرف خارجي</span>
          </div>
          <div className="w-11 h-11 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-lg">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Breached SLA */}
        <div 
          onClick={() => onFilterByStatus('Breached')}
          className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-[11px] font-black text-rose-700 dark:text-rose-400">تجاوزت اتفاقية SLA ⚠️</p>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-300 mt-0.5">{breachedCount}</h2>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold underline">اضغط لعرض التذاكر المتأخرة</span>
          </div>
          <div className="w-11 h-11 bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 rounded-2xl flex items-center justify-center text-lg animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CSAT Banner & SLA Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CSAT Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-500/15 dark:via-slate-800 dark:to-slate-800 p-5 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              <Star className="w-7 h-7 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">مؤشر رضا العملاء العام (CSAT Score)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                متوسط التقييم الإجمالي لجودة المعالجة وسرعة الحل بناءً على التذاكر المكتملة
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <span>⭐ معدل الرضا: ممتاز ({avgCsat} من 5)</span>
                <span>• إجمالي المقيمين: {ratedIssues.length} عميل</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 px-6 py-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 shadow-sm">
            <h2 className="text-4xl font-black text-amber-600 dark:text-amber-400">{avgCsat}</h2>
            <div className="text-right">
              <div className="text-amber-500 flex items-center gap-0.5 text-sm">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mt-0.5">أعلى من المعيار العالمي 4.5</span>
            </div>
          </div>
        </div>

        {/* SLA Compliance Rate Card */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الالتزام بالـ SLA</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{complianceRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${complianceRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>التذاكر المحلولة في وقتها</span>
              <span>{total - breachedCount} من أصل {total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>توزيع المشاكل حسب الحالة</span>
          </h3>

          <div className="space-y-3 pt-1">
            {[
              { label: 'مفتوحة (Open)', count: openCount, color: 'bg-rose-500', barBg: 'bg-rose-500/20' },
              { label: 'قيد العمل (In Progress)', count: inProgressCount, color: 'bg-indigo-500', barBg: 'bg-indigo-500/20' },
              { label: 'معلقة (Pending)', count: pendingCount, color: 'bg-amber-500', barBg: 'bg-amber-500/20' },
              { label: 'تم الحل والإغلاق (Resolved/Closed)', count: resolvedCount, color: 'bg-emerald-500', barBg: 'bg-emerald-500/20' },
            ].map((st) => {
              const pct = total > 0 ? Math.round((st.count / total) * 100) : 0;
              return (
                <div key={st.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{st.label}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{st.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`${st.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>توزيع المشاكل حسب الأولوية</span>
          </h3>

          <div className="space-y-3 pt-1">
            {[
              { label: '🔴 Critical (حرج)', count: priorityCounts.Critical, color: 'bg-rose-600' },
              { label: '🟠 High (عالي)', count: priorityCounts.High, color: 'bg-amber-500' },
              { label: '🟡 Medium (متوسط)', count: priorityCounts.Medium, color: 'bg-yellow-500' },
              { label: '🟢 Low (منخفض)', count: priorityCounts.Low, color: 'bg-emerald-500' },
            ].map((pr) => {
              const pct = total > 0 ? Math.round((pr.count / total) * 100) : 0;
              return (
                <div key={pr.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pr.label}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{pr.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`${pr.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>توزيع المشاكل حسب القسم</span>
          </h3>

          <div className="space-y-3 pt-1">
            {categories.map((c, idx) => {
              const catCount = issues.filter((i) => i.type === c.name).length;
              const pct = total > 0 ? Math.round((catCount / total) * 100) : 0;
              const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-purple-500', 'bg-pink-500'];
              const col = colors[idx % colors.length];

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{c.name}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{catCount} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`${col} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Performance Leaderboard & Urgent Breached Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Breached / Approaching SLA Tickets */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>تذاكر عاجلة تتطلب تدخلاً فورياً (SLA Watchlist)</span>
            </h3>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{breachedCount} متأخرة</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pt-1">
            {breachedIssues.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">رائع! لا توجد تذاكر متأخرة عن اتفاقية SLA حالياً.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">جميع البلاغات تحت السيطرة وضمن السقف الزمني.</p>
              </div>
            ) : (
              breachedIssues.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectTicket(item)}
                  className="p-3 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300">{item.id}</span>
                      <span 
                        onClick={(e) => {
                          if (onOpenCustomerProfile) {
                            e.stopPropagation();
                            onOpenCustomerProfile(item.client);
                          }
                        }}
                        className={`text-xs font-bold text-slate-900 dark:text-white ${onOpenCustomerProfile ? 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline' : ''}`}
                        title="عرض بطاقة العميل 360°"
                      >
                        {item.client}
                      </span>
                      <PriorityBadge priority={item.priority} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-sm">{item.desc}</p>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-semibold">المسؤول: {item.owner}</span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 block">⚠️ تجاوزت SLA</span>
                    <button className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-0.5 mt-1">
                      <span>عرض</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Workload & Activity */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>لوحة أداء الموظفين وعبء العمل الحالي (Workload)</span>
          </h3>

          <div className="space-y-2.5 pt-1">
            {users.map((u) => {
              const assignedCount = issues.filter((i) => i.owner.includes(u.name) || u.name.includes(i.owner)).length;
              const resolvedByU = issues.filter(
                (i) => (i.owner.includes(u.name) || u.name.includes(i.owner)) && (i.status === 'Resolved' || i.status === 'Closed')
              ).length;
              const userWorkSeconds = issues
                .filter((i) => i.owner.includes(u.name) || u.name.includes(i.owner))
                .reduce((acc, curr) => acc + (curr.workTime || 0), 0);

              return (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-xs">
                      {u.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{u.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">المسندة</span>
                      <span className="font-bold text-slate-900 dark:text-white">{assignedCount}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">المحلولة</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{resolvedByU}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">وقت العمل</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatSecondsToHMS(userWorkSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
