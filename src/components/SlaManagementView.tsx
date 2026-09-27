import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Zap,
  Calendar,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Settings,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search,
  ExternalLink,
  MessageCircle,
  Building,
  Globe,
  User,
  Info,
  Check,
  Save,
  HelpCircle,
  TrendingUp,
  Plus,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Issue, CategoryRule, Priority, SlaSettings, AppUser, ExternalVendor } from '../types';
import {
  calculateDueDate,
  formatArabicDate,
  isTicketSlaBreached,
  isTicketSlaAtRisk,
  getRemainingTimeFormatted,
  DEFAULT_SLA_HOURS,
  DEFAULT_SLA_SETTINGS,
  generateExternalTicketRef
} from '../utils/sla';
import { PriorityBadge, StatusBadge } from './Badges';

interface SlaManagementViewProps {
  issues: Issue[];
  categories: CategoryRule[];
  slaSettings: SlaSettings;
  onUpdateSlaSettings: (newSettings: SlaSettings) => void;
  onUpdateCategorySla: (categoryId: string, rules: Record<Priority, number>) => void;
  onUpdateIssue?: (issueId: string, updates: Partial<Issue>) => void;
  onSelectTicket?: (ticketId: string) => void;
  currentUser: AppUser;
  externalVendors?: ExternalVendor[];
}

export const SlaManagementView: React.FC<SlaManagementViewProps> = ({
  issues,
  categories,
  slaSettings,
  onUpdateSlaSettings,
  onUpdateCategorySla,
  onUpdateIssue,
  onSelectTicket,
  currentUser,
  externalVendors = [],
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'rules' | 'queue' | 'simulator' | 'reports'>('queue');
  const [searchFilter, setSearchFilter] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'breached' | 'at-risk' | 'paused' | 'on-track'>('all');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Editable copy of SLA settings for the rules form
  const [localSettings, setLocalSettings] = useState<SlaSettings>({
    ...DEFAULT_SLA_SETTINGS,
    ...slaSettings,
  });

  // Editable copy of Category SLA matrix: { [categoryId]: { Critical: 4, High: 12, ... } }
  const [matrixValues, setMatrixValues] = useState<Record<string, Record<Priority, number>>>(() => {
    const map: Record<string, Record<Priority, number>> = {};
    categories.forEach((cat) => {
      map[cat.id] = {
        Critical: cat.slaHours?.Critical || DEFAULT_SLA_HOURS.Critical,
        High: cat.slaHours?.High || DEFAULT_SLA_HOURS.High,
        Medium: cat.slaHours?.Medium || DEFAULT_SLA_HOURS.Medium,
        Low: cat.slaHours?.Low || DEFAULT_SLA_HOURS.Low,
      };
    });
    return map;
  });

  // Extension Modal state
  const [extendTicket, setExtendTicket] = useState<Issue | null>(null);
  const [extendHours, setExtendHours] = useState<number>(4);
  const [extendReason, setExtendReason] = useState<string>('تنسيق تقني إضافي مع المورد الخارجي');

  // Simulator State
  const [simCatId, setSimCatId] = useState<string>(categories[0]?.id || '');
  const [simPriority, setSimPriority] = useState<Priority>('High');
  const [simDate, setSimDate] = useState<string>(new Date().toISOString().slice(0, 16));

  // Compute live SLA statistics
  const stats = useMemo(() => {
    const activeIssues = issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed');
    const resolvedIssues = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed');

    const breachedList = activeIssues.filter((i) =>
      isTicketSlaBreached(i.createdAt, i.dueDate, i.status, i.slaPaused)
    );

    const atRiskList = activeIssues.filter((i) =>
      isTicketSlaAtRisk(i.dueDate, i.status, localSettings.warningThresholdMinutes, i.slaPaused)
    );

    const pausedList = activeIssues.filter((i) => Boolean(i.slaPaused));

    const onTrackList = activeIssues.filter((i) =>
      !isTicketSlaBreached(i.createdAt, i.dueDate, i.status, i.slaPaused) &&
      !isTicketSlaAtRisk(i.dueDate, i.status, localSettings.warningThresholdMinutes, i.slaPaused) &&
      !i.slaPaused
    );

    // Calculate resolved within SLA compliance rate
    let resolvedOnTimeCount = 0;
    resolvedIssues.forEach((i) => {
      const resolvedAt = i.resolvedAt ? new Date(i.resolvedAt).getTime() : new Date(i.dueDate).getTime();
      const due = new Date(i.dueDate).getTime();
      if (resolvedAt <= due) resolvedOnTimeCount++;
    });

    const totalCalculated = resolvedIssues.length + breachedList.length;
    const complianceRate = totalCalculated > 0
      ? Math.round((resolvedOnTimeCount / totalCalculated) * 100)
      : 98;

    return {
      activeTotal: activeIssues.length,
      breachedCount: breachedList.length,
      atRiskCount: atRiskList.length,
      pausedCount: pausedList.length,
      onTrackCount: onTrackList.length,
      complianceRate,
      resolvedTotal: resolvedIssues.length,
    };
  }, [issues, localSettings.warningThresholdMinutes]);

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    return issues.filter((issue) => {
      // Basic text search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesClient = issue.client?.toLowerCase().includes(q);
        const matchesId = issue.id?.toLowerCase().includes(q);
        const matchesDesc = issue.desc?.toLowerCase().includes(q);
        const matchesOwner = issue.owner?.toLowerCase().includes(q);
        const matchesExtRef = issue.externalOwnerDetails?.externalTicketId?.toLowerCase().includes(q);
        if (!matchesClient && !matchesId && !matchesDesc && !matchesOwner && !matchesExtRef) {
          return false;
        }
      }

      const isBreached = isTicketSlaBreached(issue.createdAt, issue.dueDate, issue.status, issue.slaPaused);
      const isAtRisk = isTicketSlaAtRisk(issue.dueDate, issue.status, localSettings.warningThresholdMinutes, issue.slaPaused);
      const isPaused = Boolean(issue.slaPaused);
      const isResolved = issue.status === 'Resolved' || issue.status === 'Closed';

      if (queueFilter === 'breached') return isBreached;
      if (queueFilter === 'at-risk') return isAtRisk;
      if (queueFilter === 'paused') return isPaused;
      if (queueFilter === 'on-track') return !isBreached && !isAtRisk && !isPaused && !isResolved;

      // 'all' tab shows all active non-resolved
      return !isResolved;
    });
  }, [issues, searchFilter, queueFilter, localSettings.warningThresholdMinutes]);

  // Handle Preset Application to Matrix
  const handleApplyPreset = (preset: 'enterprise' | 'standard' | 'relaxed') => {
    let presetHours: Record<Priority, number>;
    if (preset === 'enterprise') {
      presetHours = { Critical: 2, High: 6, Medium: 12, Low: 24 };
    } else if (preset === 'standard') {
      presetHours = { Critical: 4, High: 12, Medium: 24, Low: 48 };
    } else {
      presetHours = { Critical: 8, High: 24, Medium: 48, Low: 72 };
    }

    const newMap: Record<string, Record<Priority, number>> = {};
    categories.forEach((cat) => {
      newMap[cat.id] = { ...presetHours };
      onUpdateCategorySla(cat.id, { ...presetHours });
    });
    setMatrixValues(newMap);
    setSaveSuccessMessage(`تم تطبيق (${preset === 'enterprise' ? 'باقة الدعم الفائق الفوري' : preset === 'standard' ? 'باقة الأعمال القياسية' : 'باقة الدعم الممتد'}) بنجاح على جميع الأقسام!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Stepper helper for matrix cell
  const handleStepHours = (catId: string, prio: Priority, delta: number) => {
    setMatrixValues((prev) => {
      const current = prev[catId]?.[prio] || DEFAULT_SLA_HOURS[prio];
      const nextVal = Math.max(1, current + delta);
      const updatedCat = { ...(prev[catId] || DEFAULT_SLA_HOURS), [prio]: nextVal };
      onUpdateCategorySla(catId, updatedCat);
      return { ...prev, [catId]: updatedCat };
    });
  };

  // Direct cell change for matrix
  const handleCellChange = (catId: string, prio: Priority, valStr: string) => {
    const num = parseInt(valStr, 10);
    if (isNaN(num) || num < 1) return;
    setMatrixValues((prev) => {
      const updatedCat = { ...(prev[catId] || DEFAULT_SLA_HOURS), [prio]: num };
      onUpdateCategorySla(catId, updatedCat);
      return { ...prev, [catId]: updatedCat };
    });
  };

  // Handle saving general SLA rules
  const handleSaveSlaRules = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSlaSettings(localSettings);
    setSaveSuccessMessage('تم حفظ وتفعيل خيارات وقواعد الـ SLA والأتمتة بنجاح!');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Handle extending a ticket's SLA
  const handleExecuteExtendSla = () => {
    if (!extendTicket || !onUpdateIssue) return;
    const currentDue = new Date(extendTicket.dueDate);
    const newDueDate = new Date(currentDue.getTime() + extendHours * 60 * 60 * 1000).toISOString();

    const note = `[تمديد SLA رسمي] تم تمديد المهلة بمقدار ${extendHours} ساعة بواسطة (${currentUser.name}) - السبب: ${extendReason}`;
    const newTimeline = [
      ...(extendTicket.timeline || []),
      {
        id: `sla-ext-${Date.now()}`,
        time: new Date().toISOString(),
        actor: currentUser.name,
        title: `تمديد مهلة الـ SLA (+${extendHours} ساعة)`,
        details: extendReason,
        type: 'sla' as const,
      },
    ];

    onUpdateIssue(extendTicket.id, {
      dueDate: newDueDate,
      slaExtendedHours: (extendTicket.slaExtendedHours || 0) + extendHours,
      slaExtensionReason: extendReason,
      timeline: newTimeline,
    });

    setExtendTicket(null);
    setSaveSuccessMessage(`تم تمديد مهلة التذكرة #${extendTicket.id} بنجاح!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Handle manual toggle pause on ticket
  const handleTogglePauseTicket = (issue: Issue) => {
    if (!onUpdateIssue) return;
    const isCurrentlyPaused = Boolean(issue.slaPaused);
    const updates: Partial<Issue> = {
      slaPaused: !isCurrentlyPaused,
      slaPausedAt: !isCurrentlyPaused ? new Date().toISOString() : undefined,
      slaPausedReason: !isCurrentlyPaused
        ? (issue.isExternalOwner ? `تنسيق مع الطرف الخارجي: ${issue.externalOwnerDetails?.company || issue.owner}` : 'بانتظار موافقة أو إفادة')
        : undefined,
      timeline: [
        ...(issue.timeline || []),
        {
          id: `sla-pause-${Date.now()}`,
          time: new Date().toISOString(),
          actor: currentUser.name,
          title: !isCurrentlyPaused ? 'تجميد عداد المهلة (SLA Paused)' : 'استئناف عداد المهلة (SLA Resumed)',
          details: !isCurrentlyPaused ? 'تم إيقاف احتساب الوقت مؤقتاً للتنسيق' : 'تم استئناف احتساب الوقت رسمياً',
          type: 'sla' as const,
        },
      ],
    };
    onUpdateIssue(issue.id, updates);
  };

  // Simulator calculated output
  const simSelectedCat = categories.find((c) => c.id === simCatId) || categories[0];
  const simHours = matrixValues[simCatId]?.[simPriority] || simSelectedCat?.slaHours?.[simPriority] || DEFAULT_SLA_HOURS[simPriority];
  const simCalculatedDueDate = calculateDueDate(
    new Date(simDate).toISOString(),
    simPriority,
    simHours,
    localSettings.businessHoursOnly
      ? {
          businessHoursOnly: true,
          workStartHour: localSettings.workStartHour,
          workEndHour: localSettings.workEndHour,
          workDays: localSettings.workDays,
        }
      : undefined
  );
  const simWarningDate = new Date(
    new Date(simCalculatedDueDate).getTime() - localSettings.warningThresholdMinutes * 60 * 1000
  ).toISOString();

  // Export SLA Report to CSV
  const handleExportSlaReport = () => {
    const rows = [
      ['رقم التذكرة', 'العميل', 'القسم', 'الأولوية', 'المسؤول', 'نوع المسؤول', 'رقم البلاغ الخارجي', 'تاريخ الإنشاء', 'الموعد النهائي', 'الحالة', 'حالة الـ SLA'],
      ...issues.map((i) => {
        const isBreached = isTicketSlaBreached(i.createdAt, i.dueDate, i.status, i.slaPaused);
        const isAtRisk = isTicketSlaAtRisk(i.dueDate, i.status, localSettings.warningThresholdMinutes, i.slaPaused);
        let slaLabel = 'ضمن المهلة (On Track)';
        if (i.status === 'Resolved' || i.status === 'Closed') slaLabel = 'مكتملة';
        else if (i.slaPaused) slaLabel = `مجمّد (${i.slaPausedReason || 'طرف خارجي'})`;
        else if (isBreached) slaLabel = 'متأخرة تجاوزت المهلة';
        else if (isAtRisk) slaLabel = 'مهددة بالانتهاء';

        return [
          i.id,
          `"${i.client}"`,
          i.type,
          i.priority,
          `"${i.owner}"`,
          i.isExternalOwner ? 'طرف خارجي' : 'داخلي',
          i.externalOwnerDetails?.externalTicketId || '-',
          i.createdAt,
          i.dueDate,
          i.status,
          slaLabel,
        ];
      }),
    ];

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SLA_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl">
                <Clock className="w-7 h-7 text-indigo-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                منظومة إدارة مستويات الخدمة (SLA & Response Times)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>إصدار احترافي متكامل</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              مركز الرقابة الشامل لاتفاقيات مستوى الخدمة (SLA): تخصيص مهل الاستجابة والحل لجميع الأقسام، الرقابة اللحظية على البلاغات المهددة، تجميد العداد مع الأطراف الخارجية، وحاسبة المهل التفاعلية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportSlaReport}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              title="تصدير تقرير الـ SLA الشامل كملف إكسيل CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير تقرير SLA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>حاسبة ومحاكي الـ SLA</span>
            </button>
          </div>
        </div>

        {/* Live KPI Cards Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-white/10">
          {/* Compliance Rate */}
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-right">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>نسبة الالتزام</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats.complianceRate}%
            </div>
            <span className="text-[10px] text-slate-400">التذاكر المغلقة بالموعد</span>
          </div>

          {/* Breached */}
          <div
            onClick={() => {
              setActiveTab('queue');
              setQueueFilter('breached');
            }}
            className="bg-white/5 hover:bg-rose-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-rose-500/30 text-right cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
              <span>تجاوزت المهلة</span>
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {stats.breachedCount}
            </div>
            <span className="text-[10px] text-rose-300 group-hover:underline">عرض المتأخرات 🔴</span>
          </div>

          {/* At-Risk */}
          <div
            onClick={() => {
              setActiveTab('queue');
              setQueueFilter('at-risk');
            }}
            className="bg-white/5 hover:bg-amber-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-amber-500/30 text-right cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
              <span>مهددة بالانتهاء</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {stats.atRiskCount}
            </div>
            <span className="text-[10px] text-amber-300 group-hover:underline">أقل من ساعتين 🟡</span>
          </div>

          {/* Paused on External */}
          <div
            onClick={() => {
              setActiveTab('queue');
              setQueueFilter('paused');
            }}
            className="bg-white/5 hover:bg-purple-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-purple-500/30 text-right cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
              <span>مجمّد (طرف خارجي)</span>
              <Pause className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono">
              {stats.pausedCount}
            </div>
            <span className="text-[10px] text-purple-300 group-hover:underline">العداد متوقف مؤقتاً</span>
          </div>

          {/* On-Track */}
          <div
            onClick={() => {
              setActiveTab('queue');
              setQueueFilter('on-track');
            }}
            className="bg-white/5 hover:bg-emerald-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/30 text-right cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span>ضمن المهلة</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats.onTrackCount}
            </div>
            <span className="text-[10px] text-emerald-300 group-hover:underline">سير عمل نظامي 🟢</span>
          </div>

          {/* Active Total */}
          <div
            onClick={() => {
              setActiveTab('queue');
              setQueueFilter('all');
            }}
            className="bg-white/5 hover:bg-indigo-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-right cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>إجمالي المفتوحة</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats.activeTotal}
            </div>
            <span className="text-[10px] text-indigo-300 group-hover:underline">كل البلاغات الحية</span>
          </div>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main SLA Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>طابور المتابعة والتدخل السريع</span>
            {stats.breachedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {stats.breachedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مصفوفة مهل الأقسام (SLA Matrix)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>سياسات العمل وقواعد الأتمتة (كل الأوبشن)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>حاسبة ومحاكي المهل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تحليلات الالتزام والتقارير</span>
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="بحث بالعميل، التذكرة، المورد..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      {/* TAB 1: Live At-Risk & Breached Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Quick Sub-filters */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit text-xs font-bold">
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                queueFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل ({stats.activeTotal})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('breached')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                queueFilter === 'breached'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>متأخرة تجاوزت المهلة ({stats.breachedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('at-risk')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                queueFilter === 'at-risk'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>مهددة بالانتهاء ({stats.atRiskCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('paused')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                queueFilter === 'paused'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>مجمّدة مع طرف خارجي ({stats.pausedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('on-track')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                queueFilter === 'on-track'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ضمن المهلة ({stats.onTrackCount})</span>
            </button>
          </div>

          {/* Queue Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="p-3.5">معرف التذكرة والعميل</th>
                    <th className="p-3.5">القسم والأولوية</th>
                    <th className="p-3.5">المسؤول عن التذكرة</th>
                    <th className="p-3.5">تاريخ ووقت الإنشاء</th>
                    <th className="p-3.5">الموعد النهائي لـ SLA</th>
                    <th className="p-3.5">العداد المتبقي / حالة المهلة</th>
                    <th className="p-3.5 text-center">إجراءات التدخل السريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                        <p className="font-bold text-sm">لا توجد بلاغات تطابق شروط الفلتر المحددة حالياً!</p>
                        <p className="text-xs text-slate-500 mt-1">جميع البلاغات تعمل وفق المعايير الزمنية المعتمدة.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => {
                      const isBreached = isTicketSlaBreached(item.createdAt, item.dueDate, item.status, item.slaPaused);
                      const isAtRisk = isTicketSlaAtRisk(item.dueDate, item.status, localSettings.warningThresholdMinutes, item.slaPaused);
                      const remaining = getRemainingTimeFormatted(item.dueDate, item.status, item.slaPaused, item.slaPausedReason);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                            isBreached ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''
                          }`}
                        >
                          {/* Ticket & Client */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onSelectTicket?.(item.id)}
                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                #{item.id}
                              </button>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.client}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                              {item.desc}
                            </p>
                          </td>

                          {/* Category & Priority */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                                {item.type}
                              </span>
                              <PriorityBadge priority={item.priority} size="sm" />
                            </div>
                          </td>

                          {/* Owner & External Indicator */}
                          <td className="p-3.5">
                            {item.isExternalOwner ? (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] font-bold">
                                  <Globe className="w-3 h-3 text-purple-600" />
                                  <span>{item.externalOwnerDetails?.name || item.owner}</span>
                                </div>
                                {item.externalOwnerDetails?.company && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    🏢 {item.externalOwnerDetails.company}
                                  </div>
                                )}
                                {item.externalOwnerDetails?.externalTicketId && (
                                  <div className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 w-fit">
                                    #{item.externalOwnerDetails.externalTicketId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{item.owner}</span>
                              </div>
                            )}
                          </td>

                          {/* Created At */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {formatArabicDate(item.createdAt)}
                          </td>

                          {/* Due Date */}
                          <td className="p-3.5 font-mono text-[11px]">
                            <span className={isBreached ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {formatArabicDate(item.dueDate)}
                            </span>
                            {item.slaExtendedHours && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                + تمديد {item.slaExtendedHours} س
                              </div>
                            )}
                          </td>

                          {/* SLA Timer Badge */}
                          <td className="p-3.5">
                            {item.slaPaused ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-bold text-[11px]">
                                <Pause className="w-3.5 h-3.5 text-purple-600" />
                                <span>{remaining.text}</span>
                              </div>
                            ) : isBreached ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold text-[11px] animate-pulse">
                                <Flame className="w-3.5 h-3.5 text-rose-600" />
                                <span>{remaining.text}</span>
                              </div>
                            ) : isAtRisk ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>{remaining.text}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{remaining.text}</span>
                              </div>
                            )}
                          </td>

                          {/* Quick Intervention Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Details */}
                              <button
                                type="button"
                                onClick={() => onSelectTicket?.(item.id)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition"
                                title="عرض تفاصيل التذكرة"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Extend SLA */}
                              <button
                                type="button"
                                onClick={() => setExtendTicket(item)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition"
                                title="تمديد مهلة SLA استثنائياً"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Pause / Resume SLA */}
                              <button
                                type="button"
                                onClick={() => handleTogglePauseTicket(item)}
                                className={`p-1.5 rounded-lg transition ${
                                  item.slaPaused
                                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300'
                                }`}
                                title={item.slaPaused ? 'استئناف تشغيل عداد الـ SLA' : 'تجميد عداد الـ SLA مؤقتاً'}
                              >
                                {item.slaPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Category SLA Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Quick Presets Banner */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/30 p-4 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>الباقات القياسية الجاهزة لتطبيقها بنقرة واحدة على جميع الأقسام:</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يمكنك تطبيق أي باقة جاهزة معتمدة عالمياً، أو تخصيص ساعات كل قسم على حدة بالجدول أدناه.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('enterprise')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡ باقة الدعم الفائق (2س / 6س / 12س / 24س)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('standard')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>🏢 باقة الأعمال القياسية (4س / 12س / 24س / 48س)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('relaxed')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>🌿 باقة الدعم الممتد (8س / 24س / 48س / 72س)</span>
              </button>
            </div>
          </div>

          {/* SLA Hours Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  جدول مهل الحل القصوى لكل قسم مصنفاً حسب الأولوية
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  الساعات المدخلة هنا يتم اعتمادها فوراً كمهلة رسمية (SLA Due Date) عند فتح أي بلاغ جديد في هذا القسم.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="p-4">اسم القسم / التصنيف</th>
                    <th className="p-4">الفريق المختص والمسؤول</th>
                    <th className="p-4 text-center text-rose-600 dark:text-rose-400">
                      حرجة جداً (Critical)
                    </th>
                    <th className="p-4 text-center text-amber-600 dark:text-amber-400">
                      مرتفعة (High)
                    </th>
                    <th className="p-4 text-center text-blue-600 dark:text-blue-400">
                      متوسطة (Medium)
                    </th>
                    <th className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                      منخفضة (Low)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories.map((cat) => {
                    const currentRules = matrixValues[cat.id] || cat.slaHours || DEFAULT_SLA_HOURS;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {cat.name}
                          </div>
                          {cat.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {cat.description}
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                            {cat.assignedTeam}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            الافتراضي: {cat.defaultOwner}
                          </div>
                        </td>

                        {/* Critical Input Stepper */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Critical', -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={currentRules.Critical}
                              onChange={(e) => handleCellChange(cat.id, 'Critical', e.target.value)}
                              className="w-14 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl px-1.5 py-1 text-xs focus:ring-2 focus:ring-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Critical', 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400">ساعة</span>
                          </div>
                        </td>

                        {/* High Input Stepper */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'High', -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={currentRules.High}
                              onChange={(e) => handleCellChange(cat.id, 'High', e.target.value)}
                              className="w-14 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl px-1.5 py-1 text-xs focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'High', 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400">ساعة</span>
                          </div>
                        </td>

                        {/* Medium Input Stepper */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Medium', -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={currentRules.Medium}
                              onChange={(e) => handleCellChange(cat.id, 'Medium', e.target.value)}
                              className="w-14 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-900 text-blue-700 dark:text-blue-400 rounded-xl px-1.5 py-1 text-xs focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Medium', 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400">ساعة</span>
                          </div>
                        </td>

                        {/* Low Input Stepper */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Low', -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={currentRules.Low}
                              onChange={(e) => handleCellChange(cat.id, 'Low', e.target.value)}
                              className="w-14 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl px-1.5 py-1 text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepHours(cat.id, 'Low', 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400">ساعة</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLA Rules & Automations ("كل الأوبشن") */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveSlaRules} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Business Hours Schedule */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    جدول وساعات العمل الرسمية (Working Schedule)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تحديد ما إذا كان عداد المهلة يُحسب على مدار الساعة 24/7 أو في الدوام فقط
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    احتساب ساعات الدوام والعمل فقط (Business Hours Only)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    إيقاف احتساب الوقت تلقائياً بعد انتهاء الدوام وفي أيام العطلات الأسبوعية
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.businessHoursOnly}
                  onChange={(e) => setLocalSettings({ ...localSettings, businessHoursOnly: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {localSettings.businessHoursOnly && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        بداية الدوام اليومي
                      </label>
                      <select
                        value={localSettings.workStartHour}
                        onChange={(e) => setLocalSettings({ ...localSettings, workStartHour: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        {[7, 8, 9, 10].map((h) => (
                          <option key={h} value={h}>
                            {h}:00 صباحاً
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نهاية الدوام اليومي
                      </label>
                      <select
                        value={localSettings.workEndHour}
                        onChange={(e) => setLocalSettings({ ...localSettings, workEndHour: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        {[15, 16, 17, 18, 19, 20].map((h) => (
                          <option key={h} value={h}>
                            {h > 12 ? `${h - 12}:00 مساءً` : `${h}:00 ظهراً`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      أيام العمل الأسبوعية المعتمدة:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-xs">
                      {[
                        { day: 0, label: 'الأحد' },
                        { day: 1, label: 'الإثنين' },
                        { day: 2, label: 'الثلاثاء' },
                        { day: 3, label: 'الأربعاء' },
                        { day: 4, label: 'الخميس' },
                        { day: 5, label: 'الجمعة' },
                        { day: 6, label: 'السبت' },
                      ].map((d) => {
                        const isSelected = localSettings.workDays.includes(d.day);
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => {
                              const nextDays = isSelected
                                ? localSettings.workDays.filter((x) => x !== d.day)
                                : [...localSettings.workDays, d.day];
                              setLocalSettings({ ...localSettings, workDays: nextDays });
                            }}
                            className={`py-1.5 px-2 rounded-xl font-bold border transition text-[11px] ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Auto-Pause Conditions (الأطراف الخارجية وانتظار العميل) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Pause className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    قواعد تجميد وإيقاف العداد التلقائي (Auto-Pause Rules)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ضمان عدالة التقييم وتجنب تسجيل تأخير على الفريق الداخلي أثناء انتظار جهات خارجية
                  </p>
                </div>
              </div>

              {/* Pause on External Pending */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-950 dark:text-purple-200">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>تجميد عداد SLA تلقائياً عندما تكون التذكرة مع طرف خارجي (Vendor Paused)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    عند إسناد التذكرة لمورد أو مقاول أو شريك خارجي (مثل: فودافون / AWS / شركة الصيانة)، يتم تجميد العداد تلقائياً حتى استلام الإفادة.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.pauseOnExternalPending}
                  onChange={(e) => setLocalSettings({ ...localSettings, pauseOnExternalPending: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Pause on Customer Pending */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    تجميد عداد الـ SLA عند انتظار إفادة أو رد العميل (Pending Client)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    إيقاف احتساب الوقت أثناء انتظار إرسال تفاصيل إضافية أو موافقة من طرف العميل.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.pauseOnCustomerPending}
                  onChange={(e) => setLocalSettings({ ...localSettings, pauseOnCustomerPending: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Section 3: Early Warning Alerts */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    نظام الإنذار المبكر والتنبيهات (Early Warning Alerts)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تنبيه الفريق بشكل استباقي قبل اقتراب موعد انتهاء المهلة المحددة
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  توقيت إطلاق الإنذار المبكر قبل انتهاء المهلة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { minutes: 30, label: '30 دقيقة' },
                    { minutes: 60, label: 'ساعة واحدة' },
                    { minutes: 120, label: 'ساعتان (موصى به)' },
                    { minutes: 240, label: '4 ساعات' },
                  ].map((opt) => (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, warningThresholdMinutes: opt.minutes })}
                      className={`py-2 px-3 rounded-xl font-bold border transition text-xs ${
                        localSettings.warningThresholdMinutes === opt.minutes
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <div>
                  <span className="font-bold text-xs text-amber-950 dark:text-amber-200 block">
                    تشغيل نغمة إنذار صوتية عند اقتراب انتهاء SLA
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    إطلاق تنبيه صوتي لافت لأعضاء الفريق الفني عند دخول أي تذكرة منطقة الخطر
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.soundAlertOnRisk}
                  onChange={(e) => setLocalSettings({ ...localSettings, soundAlertOnRisk: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Section 4: Escalation Policies */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    إجراءات التصعيد التلقائي (Automatic Escalation)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    إجراءات حاسمة يتم اتخاذها برمجياً عند تجاوز أو اقتراب نفاذ المهلة
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-xs text-rose-950 dark:text-rose-200 block">
                    رفع مستوى الأولوية تلقائياً عند تجاوز 80% من المهلة (Auto-bump)
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    ترقية التذكرة من (متوسطة) إلى (عالية) أو من (عالية) إلى (حرجة) لتتصدر قوائم الفنيين وتلفت الانتباه فوراً.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.autoEscalateOnBreach}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoEscalateOnBreach: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded text-rose-500 focus:ring-rose-500 cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتفعيل خيارات وقواعد الـ SLA</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Simulator & Calculator */}
      {activeTab === 'simulator' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                حاسبة ومحاكي الـ SLA التفاعلي (Interactive SLA Simulator)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختبر كيفية احتساب وتعيين المواعيد النهائية بدقة متناهية بناءً على القسم والأولوية وتوقيت فتح التذكرة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اختر القسم الفني:
              </label>
              <select
                value={simCatId}
                onChange={(e) => setSimCatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.assignedTeam})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اختر مستوى الأولوية:
              </label>
              <select
                value={simPriority}
                onChange={(e) => setSimPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="Critical">حرجة جداً (Critical)</option>
                <option value="High">مرتفعة (High)</option>
                <option value="Medium">متوسطة (Medium)</option>
                <option value="Low">منخفضة (Low)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ ووقت فتح التذكرة المفترض:
              </label>
              <input
                type="datetime-local"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Simulator Results Display Card */}
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>نتائج المحاكاة والحساب البرمجي المباشر:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1">المهلة المعتمدة:</span>
                <span className="text-xl font-black text-indigo-600 font-mono">{simHours} ساعة</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1">الموعد النهائي للحل (Due Date):</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                  {formatArabicDate(simCalculatedDueDate)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <span className="text-[10px] text-amber-600 block mb-1">موعد إطلاق الإنذار المبكر:</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block font-mono">
                  {formatArabicDate(simWarningDate)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-1">نظام الاحتساب الفعلي:</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {localSettings.businessHoursOnly ? 'ساعات العمل الرسمية فقط' : 'مستمر 24/7 (تقويمي)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Compliance Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  تقرير وتحليلات الأداء والالتزام باتفاقيات SLA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ملخص شامل لجميع البلاغات ونسب الامتثال الزمني الموزعة على الأقسام والفرق
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportSlaReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>تحميل تقرير Excel / CSV</span>
              </button>
            </div>

            {/* Department Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                نسبة الالتزام والانتهاكات لكل قسم وتصنيف:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const catIssues = issues.filter((i) => i.type === cat.name);
                  const catBreached = catIssues.filter((i) =>
                    isTicketSlaBreached(i.createdAt, i.dueDate, i.status, i.slaPaused)
                  );
                  const catRate = catIssues.length > 0
                    ? Math.round(((catIssues.length - catBreached.length) / catIssues.length) * 100)
                    : 100;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{cat.name}</h5>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {catIssues.length} تذكرة إجمالية • {catBreached.length} متأخرة
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        <span
                          className={`text-sm font-black ${
                            catRate >= 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : catRate >= 75
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {catRate}%
                        </span>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              catRate >= 90 ? 'bg-emerald-500' : catRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${catRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA Extension Modal */}
      {extendTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-xs animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  تمديد مهلة SLA استثنائياً للتذكرة #{extendTicket.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExtendTicket(null)}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عدد ساعات التمديد الإضافية:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 12, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setExtendHours(h)}
                      className={`py-2 px-3 rounded-xl font-bold border transition text-xs ${
                        extendHours === h
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      +{h} ساعات
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب التمديد (يُسجل في سجل التدقيق):
                </label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="مثال: بانتظار رد المورد الخارجي أو إجراء تجارب تقنية"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtendTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExtendSla}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد التمديد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
