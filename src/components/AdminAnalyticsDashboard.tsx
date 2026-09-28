import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Download,
  Info,
  Building2,
  Flame,
  ShieldCheck,
  CalendarDays,
  CalendarRange,
  RotateCcw,
} from 'lucide-react';
import { Issue, CategoryRule, Priority } from '../types';
import { isTicketSlaBreached } from '../utils/sla';
import { exportTicketsToCSV } from '../utils/export';

interface AdminAnalyticsDashboardProps {
  issues: Issue[];
  categories: CategoryRule[];
}

const PRIORITY_COLORS: Record<Priority, string> = {
  Critical: '#ef4444', // Red-500
  High: '#f97316',     // Orange-500
  Medium: '#eab308',   // Amber-500
  Low: '#10b981',      // Emerald-500
};

const PRIORITY_LABELS: Record<Priority, string> = {
  Critical: 'حرجة (Critical)',
  High: 'عالية (High)',
  Medium: 'متوسطة (Medium)',
  Low: 'منخفضة (Low)',
};

const STATUS_COLORS: Record<string, string> = {
  Open: '#f43f5e',
  'In Progress': '#3b82f6',
  Pending: '#f59e0b',
  Resolved: '#10b981',
  Closed: '#64748b',
};

const DEPARTMENT_PALETTE = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f43f5e', // Rose
];

export type TimeRangeFilter = 
  | 'today' 
  | 'yesterday'
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_30_days' 
  | 'quarter' 
  | 'custom' 
  | 'all';

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  issues,
  categories,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'internal'>('all');
  const [chartViewType, setChartViewType] = useState<'stacked' | 'grouped'>('stacked');

  // Filter issues based on Time Range & Source
  const filteredIssues = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Start of today
    const startOfToday = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
    // Start of yesterday
    const startOfYesterday = new Date(currentYear, currentMonth, currentDay - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(currentYear, currentMonth, currentDay - 1, 23, 59, 59, 999);

    // Start of this week (assuming Saturday or Sunday start)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 6 ? 0 : dayOfWeek + 1));
    startOfWeek.setHours(0, 0, 0, 0);

    return issues.filter((issue) => {
      // Source Filter
      if (sourceFilter === 'client' && !issue.submittedByClient && !issue.clientEmail && !issue.clientPhone) return false;
      if (sourceFilter === 'internal' && (issue.submittedByClient || (issue.clientEmail && !issue.owner))) return false;

      // Time Range Filter
      const issueDate = new Date(issue.createdAt || now);
      if (isNaN(issueDate.getTime())) return true;

      if (timeRange === 'today') {
        return issueDate >= startOfToday;
      } else if (timeRange === 'yesterday') {
        return issueDate >= startOfYesterday && issueDate <= endOfYesterday;
      } else if (timeRange === 'this_week') {
        return issueDate >= startOfWeek;
      } else if (timeRange === 'this_month') {
        return issueDate.getFullYear() === currentYear && issueDate.getMonth() === currentMonth;
      } else if (timeRange === 'last_month') {
        const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return issueDate.getFullYear() === lastMonthYear && issueDate.getMonth() === lastMonthIndex;
      } else if (timeRange === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return issueDate >= thirtyDaysAgo;
      } else if (timeRange === 'quarter') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const issueQuarter = Math.floor(issueDate.getMonth() / 3);
        return issueDate.getFullYear() === currentYear && issueQuarter === currentQuarter;
      } else if (timeRange === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (issueDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (issueDate > end) return false;
        }
        return true;
      }

      return true; // 'all'
    });
  }, [issues, timeRange, customStartDate, customEndDate, sourceFilter]);

  // Key KPI calculations
  const totalCount = filteredIssues.length;
  const resolvedCount = filteredIssues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const openCount = filteredIssues.filter((i) => i.status === 'Open').length;
  const inProgressCount = filteredIssues.filter((i) => i.status === 'In Progress').length;
  const criticalCount = filteredIssues.filter((i) => i.priority === 'Critical').length;
  const highCount = filteredIssues.filter((i) => i.priority === 'High').length;
  const breachedCount = filteredIssues.filter((i) => isTicketSlaBreached(i.createdAt, i.dueDate, i.status)).length;

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const slaComplianceRate = totalCount > 0 ? Math.max(0, Math.round(((totalCount - breachedCount) / totalCount) * 100)) : 100;

  // 1. Department Distribution Data
  const departmentDistributionData = useMemo(() => {
    const deptMap: Record<string, { name: string; total: number; Open: number; 'In Progress': number; Resolved: number; Critical: number }> = {};

    // Initialize with all known categories
    categories.forEach((cat) => {
      deptMap[cat.name] = {
        name: cat.name,
        total: 0,
        Open: 0,
        'In Progress': 0,
        Resolved: 0,
        Critical: 0,
      };
    });

    // Populate with filtered issues
    filteredIssues.forEach((issue) => {
      const deptName = issue.assigned || 'غير محدد';
      if (!deptMap[deptName]) {
        deptMap[deptName] = {
          name: deptName,
          total: 0,
          Open: 0,
          'In Progress': 0,
          Resolved: 0,
          Critical: 0,
        };
      }
      deptMap[deptName].total += 1;
      if (issue.status === 'Open') deptMap[deptName].Open += 1;
      else if (issue.status === 'In Progress') deptMap[deptName]['In Progress'] += 1;
      else if (issue.status === 'Resolved' || issue.status === 'Closed') deptMap[deptName].Resolved += 1;

      if (issue.priority === 'Critical') deptMap[deptName].Critical += 1;
    });

    return Object.values(deptMap)
      .filter((d) => d.total > 0 || categories.some((c) => c.name === d.name))
      .sort((a, b) => b.total - a.total);
  }, [filteredIssues, categories]);

  // 2. Priority Distribution Data (Donut Chart)
  const priorityDistributionData = useMemo(() => {
    const priorityCounts: Record<Priority, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    filteredIssues.forEach((i) => {
      if (priorityCounts[i.priority] !== undefined) {
        priorityCounts[i.priority] += 1;
      } else {
        priorityCounts.Medium += 1;
      }
    });

    return (['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((p) => ({
      priority: p,
      name: PRIORITY_LABELS[p],
      count: priorityCounts[p],
      percentage: totalCount > 0 ? Math.round((priorityCounts[p] / totalCount) * 100) : 0,
      color: PRIORITY_COLORS[p],
    }));
  }, [filteredIssues, totalCount]);

  // 3. Status Distribution Data
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      'مفتوحة (Open)': 0,
      'قيد العمل (In Progress)': 0,
      'معلقة (Pending)': 0,
      'تم الحل (Resolved)': 0,
      'مغلقة (Closed)': 0,
    };

    filteredIssues.forEach((i) => {
      if (i.status === 'Open') counts['مفتوحة (Open)'] += 1;
      else if (i.status === 'In Progress') counts['قيد العمل (In Progress)'] += 1;
      else if (i.status === 'Pending') counts['معلقة (Pending)'] += 1;
      else if (i.status === 'Resolved') counts['تم الحل (Resolved)'] += 1;
      else if (i.status === 'Closed') counts['مغلقة (Closed)'] += 1;
    });

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: DEPARTMENT_PALETTE[index % DEPARTMENT_PALETTE.length],
    }));
  }, [filteredIssues]);

  // 4. Daily Inflow & Resolution Velocity (Trend by Day)
  const dailyTimelineData = useMemo(() => {
    const dayMap: Record<string, { dayLabel: string; dateObj: Date; created: number; resolved: number }> = {};

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const maxDaysToDisplay = timeRange === 'this_month' ? daysInMonth : 30;

    for (let d = 1; d <= maxDaysToDisplay; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dayMap[dateKey] = {
        dayLabel: `${d} ${new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(new Date(year, month, d))}`,
        dateObj: new Date(year, month, d),
        created: 0,
        resolved: 0,
      };
    }

    filteredIssues.forEach((issue) => {
      const createDate = new Date(issue.createdAt);
      if (!isNaN(createDate.getTime())) {
        const createKey = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, '0')}-${String(createDate.getDate()).padStart(2, '0')}`;
        if (dayMap[createKey]) {
          dayMap[createKey].created += 1;
        }
      }

      if (issue.status === 'Resolved' || issue.status === 'Closed') {
        const resolvedEvent = issue.timeline?.find((t) => t.type === 'resolve' || t.title?.includes('حل') || t.details?.includes('حل'));
        const resDate = resolvedEvent ? new Date(resolvedEvent.time) : issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.dueDate || issue.createdAt);
        if (!isNaN(resDate.getTime())) {
          const resKey = `${resDate.getFullYear()}-${String(resDate.getMonth() + 1).padStart(2, '0')}-${String(resDate.getDate()).padStart(2, '0')}`;
          if (dayMap[resKey]) {
            dayMap[resKey].resolved += 1;
          }
        }
      }
    });

    return Object.values(dayMap)
      .filter((d) => d.dateObj <= now || d.created > 0 || d.resolved > 0)
      .slice(-20);
  }, [filteredIssues, timeRange]);

  // Executive Insights
  const topDepartment = departmentDistributionData[0];
  const highRiskRatio = totalCount > 0 ? Math.round(((criticalCount + highCount) / totalCount) * 100) : 0;

  const getHumanPeriodLabel = () => {
    if (timeRange === 'today') return 'اليوم';
    if (timeRange === 'yesterday') return 'أمس';
    if (timeRange === 'this_week') return 'هذا الأسبوع';
    if (timeRange === 'this_month') return 'الشهر الحالي';
    if (timeRange === 'last_month') return 'الشهر الماضي';
    if (timeRange === 'last_30_days') return 'آخر 30 يوم';
    if (timeRange === 'quarter') return 'الربع الحالي';
    if (timeRange === 'custom') {
      if (customStartDate && customEndDate) return `من ${customStartDate} إلى ${customEndDate}`;
      if (customStartDate) return `من تاريخ ${customStartDate}`;
      if (customEndDate) return `حتى تاريخ ${customEndDate}`;
      return 'تاريخ مخصص';
    }
    return 'كافة الفترات';
  };

  return (
    <div className="space-y-6 animate-fadeIn font-['Cairo',sans-serif]">
      {/* Top Banner & Time Range Controls */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 text-white shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>لوحة التحليلات ورسوم توزيع التذاكر (Recharts Analytics)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                    مباشر ومحدث ⚡
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/80 font-medium">
                  رسوم بيانية تفاعلية متطورة توضح توزيع التذاكر حسب الأقسام والأولويات لدعم اتخاذ القرارات الإدارية • <strong className="text-white">{getHumanPeriodLabel()}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Source Filter & Export Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="bg-slate-800/90 text-slate-200 border border-indigo-500/30 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">📁 جميع المصادر</option>
              <option value="client">🌐 بلاغات العملاء فقط</option>
              <option value="internal">💼 التذاكر الداخلية فقط</option>
            </select>

            <button
              type="button"
              onClick={() => exportTicketsToCSV(filteredIssues, `Recharts_Distribution_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title="تصدير بيانات الرسم البياني إلى ملف Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* 📅 Interactive Date Filters Bar (فلتر التاريخ الاحترافي) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <CalendarRange className="w-4 h-4 text-indigo-400" />
              <span>تحديد النطاق الزمني والفلترة بالتاريخ:</span>
            </div>

            {timeRange === 'custom' && (
              <button
                type="button"
                onClick={() => {
                  setTimeRange('this_month');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط للشهر الحالي</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'yesterday'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              أمس
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('this_week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              📅 الشهر الحالي
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'last_month'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              الشهر الماضي
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('last_30_days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'last_30_days'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'quarter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              الربع الحالي
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                timeRange === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-300'
                  : 'bg-slate-900/80 text-indigo-300 hover:text-white hover:bg-slate-800 border border-indigo-500/40'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>تاريخ مخصص (Custom Date Range)</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              كافة الفترات
            </button>
          </div>

          {/* Custom Date Range Pickers Form */}
          {timeRange === 'custom' && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">من تاريخ:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 text-white border border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">إلى تاريخ:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 text-white border border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition"
                >
                  مسح التاريخ
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-indigo-300 font-bold block">إجمالي التذاكر ({getHumanPeriodLabel()})</span>
            <span className="text-xl font-black text-white">{totalCount}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-emerald-300 font-bold block">تم الحل والإغلاق</span>
            <span className="text-xl font-black text-emerald-400">{resolvedCount} ({resolutionRate}%)</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-rose-300 font-bold block">تذاكر مفتوحة وقيد العمل</span>
            <span className="text-xl font-black text-rose-400">{openCount + inProgressCount}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-amber-300 font-bold block">تذاكر حرجة (Critical)</span>
            <span className="text-xl font-black text-amber-400">{criticalCount}</span>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-purple-300 font-bold block">الالتزام بالـ SLA</span>
            <span className="text-xl font-black text-purple-300">{slaComplianceRate}%</span>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-cyan-300 font-bold block">الأقسام النشطة</span>
            <span className="text-xl font-black text-cyan-300">{departmentDistributionData.filter((d) => d.total > 0).length}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Bar Chart: Tickets Distribution per Department (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>توزيع التذاكر حسب الأقسام (Department Distribution)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مقارنة حجم البلاغات الواردة والمحلولة لكل قسم خلال {getHumanPeriodLabel()}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartViewType('stacked')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartViewType === 'stacked'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                تراكمي (Stacked)
              </button>
              <button
                type="button"
                onClick={() => setChartViewType('grouped')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartViewType === 'grouped'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                منفصل (Grouped)
              </button>
            </div>
          </div>

          {/* Recharts BarChart Container */}
          <div className="h-80 w-full pt-2">
            {departmentDistributionData.length > 0 && departmentDistributionData.some((d) => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentDistributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} تذكرة`,
                      name === 'Open'
                        ? 'مفتوحة (Open)'
                        : name === 'In Progress'
                        ? 'قيد المعالجة (In Progress)'
                        : name === 'Resolved'
                        ? 'تم الحل (Resolved)'
                        : name,
                    ]}
                    labelStyle={{ color: '#818cf8', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {val === 'Open'
                          ? '🔴 مفتوحة'
                          : val === 'In Progress'
                          ? '🔵 قيد المعالجة'
                          : val === 'Resolved'
                          ? '🟢 تم الحل'
                          : val}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="Open"
                    fill="#f43f5e"
                    stackId={chartViewType === 'stacked' ? 'a' : undefined}
                    radius={chartViewType === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="In Progress"
                    fill="#3b82f6"
                    stackId={chartViewType === 'stacked' ? 'a' : undefined}
                    radius={chartViewType === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Resolved"
                    fill="#10b981"
                    stackId={chartViewType === 'stacked' ? 'a' : undefined}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <span>لا توجد بيانات تذاكر كافية لهذه الفترة لعرض المخطط</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Donut Chart: Priority Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-750 pb-3">
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-500" />
              <span>توزيع التذاكر حسب الأولوية (Priority Distribution)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              نسبة التذاكر الحرجة والعالية والمتوسطة لاتخاذ قرارات التوزيع
            </p>
          </div>

          {/* Recharts PieChart Container */}
          <div className="h-64 w-full relative flex items-center justify-center">
            {totalCount > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistributionData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {priorityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} تذكرة (${item.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Stats in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {totalCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    إجمالي التذاكر
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <PieChartIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <span>لا توجد تذاكر مسجلة حالياً لهذه الفترة</span>
              </div>
            )}
          </div>

          {/* Custom Detailed Legend List */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            {priorityDistributionData.map((item) => (
              <div
                key={item.priority}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{item.name}</span>
                </div>
                <div className="font-black text-slate-900 dark:text-white text-xs">
                  {item.count} <span className="text-[10px] text-slate-400">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Timeline Velocity & Managerial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3. Area Chart: Daily Influx & Resolution Velocity (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>مسار وتدفق التذاكر اليومي (Daily Influx vs Resolution Velocity)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مقارنة معدل البلاغات الجديدة المستلمة مقابل معدل إنجاز وإغلاق التذاكر يوماً بيوم
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-1">
            {dailyTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTimelineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="dayLabel" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} تذكرة`,
                      name === 'created' ? '📥 بلاغات واردة' : '✅ تم حلها',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    formatter={(val) => (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {val === 'created' ? '📥 بلاغات جديدة منشأة' : '✅ تذاكر تم حلها وإغلاقها'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>لا توجد بيانات حركة يومية متاحة</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Executive Decision Insights (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 p-5 sm:p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/60 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-sm">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>توصيات القيادة واتخاذ القرارات (Executive Insights)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              تحليل ذكي فوري للمؤشرات يساعد مديري العمليات على إعادة توجيه الموارد وفرق الدعم:
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Overload Alert */}
              {topDepartment && topDepartment.total > 0 && (
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-xs space-y-1 shadow-2xs">
                  <div className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>القسم الأكثر ضغطاً: {topDepartment.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    يستقبل <strong>{topDepartment.total}</strong> تذكرة (حوالي {totalCount > 0 ? Math.round((topDepartment.total / totalCount) * 100) : 0}% من إجمالي العمل). يوصى بإسناد مهندسين دعم إضافيين.
                  </p>
                </div>
              )}

              {/* Priority Ratio Insight */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-xs space-y-1 shadow-2xs">
                <div className="font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>نسبة البلاغات عالية الخطورة: {highRiskRatio}%</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  {highRiskRatio > 30
                    ? '⚠️ نسبة البلاغات الحرجة مرتفعة هذا الشهر، يرجى مراجعة أنشطة الـ CAB والأنظمة الجذرية.'
                    : '🟢 مؤشر الاستقرار ممتاز؛ معظم البلاغات تقع في النطاق المتوسط والمنخفض.'}
                </p>
              </div>

              {/* SLA Health */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-xs space-y-1 shadow-2xs">
                <div className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>مستوى الامتثال لـ SLA: {slaComplianceRate}%</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  {breachedCount === 0
                    ? '🌟 لم يتم تسجيل أي تجاوز لمهل الحل الرسمية خلال هذه الفترة!'
                    : `يوجد ${breachedCount} تذكرة تجاوزت المهلة المحددة، راجع تقرير المتأخرات.`}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center font-bold">
            مبني ومحدث بواسطة Recharts v3.10 • أحدث معايير ITIL
          </div>
        </div>
      </div>
    </div>
  );
};
