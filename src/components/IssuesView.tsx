import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileSpreadsheet, 
  Play, 
  Pause, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Trash2, 
  Tag as TagIcon, 
  Clock, 
  AlertTriangle,
  User,
  GitMerge,
  MessageSquare,
  Phone,
  Globe,
  Building,
  Trello,
  LayoutGrid,
  List
} from 'lucide-react';
import { Issue, AppUser, Priority, IssueStatus } from '../types';
import { isTicketSlaBreached, getRemainingTimeFormatted, formatSecondsToHMS } from '../utils/sla';
import { exportTicketsToCSV } from '../utils/export';
import { PriorityBadge, StatusBadge } from './Badges';
import { useAllTicketCollisions } from '../utils/collisionDetector';
import { CollisionAlertBanner } from './CollisionAlertBanner';
import { WhatsAppChatModal } from './WhatsAppChatModal';

interface IssuesViewProps {
  issues: Issue[];
  tags: string[];
  users: AppUser[];
  currentUser: AppUser;
  onOpenDetails: (issue: Issue) => void;
  onOpenEdit: (issue: Issue) => void;
  onOpenResolve: (issue: Issue) => void;
  onDeleteIssue: (issueId: string) => void;
  onToggleTimer: (issue: Issue) => void;
  onQuickStatusChange: (issue: Issue, newStatus: IssueStatus) => void;
  onBulkChangeStatus: (issueIds: string[], newStatus: IssueStatus) => void;
  onBulkDelete: (issueIds: string[]) => void;
  onOpenCustomerProfile?: (clientName: string) => void;
  onOpenMergeModal?: (ticketIds: string[]) => void;
  initialFilterStatus?: string;
  onUpdatePhone?: (issueId: string, phone: string) => void;
  appSkin?: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean';
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const isSameDay = (isoStr: string | undefined, y: number, m: number, d: number) => {
  if (!isoStr) return false;
  const date = new Date(isoStr);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
};

export const IssuesView: React.FC<IssuesViewProps> = ({
  issues,
  tags,
  users,
  currentUser,
  onOpenDetails,
  onOpenEdit,
  onOpenResolve,
  onDeleteIssue,
  onToggleTimer,
  onQuickStatusChange,
  onBulkChangeStatus,
  onBulkDelete,
  onOpenCustomerProfile,
  onOpenMergeModal,
  initialFilterStatus = 'ALL',
  onUpdatePhone,
  appSkin = 'standard',
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar'>(() => {
    try {
      const saved = localStorage.getItem('ISSUES_VIEW_MODE');
      return (saved === 'kanban' || saved === 'calendar') ? (saved as any) : 'table';
    } catch {
      return 'table';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ISSUES_VIEW_MODE', viewMode);
    } catch {}
  }, [viewMode]);

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [whatsAppIssue, setWhatsAppIssue] = useState<Issue | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // Hook to watch collisions on all tickets in real-time
  const collisionsMap = useAllTicketCollisions(currentUser);
  const [filterTag, setFilterTag] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterOwner, setFilterOwner] = useState('ALL');
  const [ticketSourceFilter, setTicketSourceFilter] = useState<'ALL' | 'CLIENT' | 'INTERNAL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Status Counts for fast status switching
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const breachedCount = issues.filter((i) => isTicketSlaBreached(i.createdAt, i.dueDate, i.status)).length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const externalCount = issues.filter((i) => i.isExternalOwner).length;
  const clientTicketsCount = issues.filter((i) => i.submittedByClient).length;
  const internalTicketsCount = issues.filter((i) => !i.submittedByClient).length;
  const totalCount = issues.length;

  // Filtering
  const filteredIssues = issues.filter((item) => {
    const breached = isTicketSlaBreached(item.createdAt, item.dueDate, item.status);
    
    // Ticket source filter
    if (ticketSourceFilter === 'CLIENT' && !item.submittedByClient) return false;
    if (ticketSourceFilter === 'INTERNAL' && item.submittedByClient) return false;

    // Status filter
    if (filterStatus === 'Breached') {
      if (!breached) return false;
    } else if (filterStatus !== 'ALL') {
      if (item.status !== filterStatus) return false;
    }

    // Tag filter
    if (filterTag !== 'ALL' && item.tag !== filterTag) return false;

    // Priority filter
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;

    // Owner filter
    if (filterOwner === 'EXTERNAL_ALL') {
      if (!item.isExternalOwner) return false;
    } else if (filterOwner === 'INTERNAL_ALL') {
      if (item.isExternalOwner) return false;
    } else if (filterOwner !== 'ALL' && !item.owner.includes(filterOwner)) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        item.client.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.tag && item.tag.toLowerCase().includes(q)) ||
        item.desc.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.externalOwnerDetails?.company && item.externalOwnerDetails.company.toLowerCase().includes(q)) ||
        (item.externalOwnerDetails?.name && item.externalOwnerDetails.name.toLowerCase().includes(q)) ||
        (item.externalOwnerDetails?.externalTicketId && item.externalOwnerDetails.externalTicketId.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredIssues.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const getPriorityBadge = (p: Priority) => <PriorityBadge priority={p} />;

  const getStatusBadge = (st: IssueStatus) => <StatusBadge status={st} />;

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
        {/* Ticket Source Filter Tab Bar (الفرق بين تذاكر العملاء والتذاكر الداخلية) */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTicketSourceFilter('ALL')}
            className={`ticket-source-btn px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'ALL'
                ? 'is-active bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📁 كل التذاكر ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketSourceFilter('CLIENT')}
            className={`ticket-source-btn px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'CLIENT'
                ? 'is-active bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 بلاغات العملاء الواردة</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${ticketSourceFilter === 'CLIENT' ? 'bg-purple-700 text-white' : 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}`}>
              {clientTicketsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTicketSourceFilter('INTERNAL')}
            className={`ticket-source-btn px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'INTERNAL'
                ? 'is-active bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💼 التذاكر الداخلية (فريق العمل)</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${ticketSourceFilter === 'INTERNAL' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {internalTicketsCount}
            </span>
          </button>
        </div>

        {/* Fast Status Switcher Bar (عرض فوري للتذاكر المفتوحة) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterStatus('Open')}
            className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
              filterStatus === 'Open'
                ? 'is-active bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>التذاكر المفتوحة (Open)</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterStatus === 'Open'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {openCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('In Progress')}
            className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
              filterStatus === 'In Progress'
                ? 'is-active bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>قيد العمل (In Progress)</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterStatus === 'In Progress'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {inProgressCount}
            </span>
          </button>

          {breachedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('Breached')}
              className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
                filterStatus === 'Breached'
                  ? 'is-active bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>متأخرة SLA</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-700 text-white">
                {breachedCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterStatus('Resolved')}
            className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
              filterStatus === 'Resolved'
                ? 'is-active bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم الحل والإغلاق</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterStatus === 'Resolved'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {resolvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterOwner('EXTERNAL_ALL');
              setFilterStatus('ALL');
            }}
            className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
              filterOwner === 'EXTERNAL_ALL'
                ? 'is-active bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>أطراف خارجية (External)</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterOwner === 'EXTERNAL_ALL'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
              }`}
            >
              {externalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus('ALL');
              setFilterOwner('ALL');
            }}
            className={`status-filter-btn px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
              filterStatus === 'ALL' && filterOwner === 'ALL'
                ? 'is-active bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>جميع التذاكر (الكل)</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterStatus === 'ALL' && filterOwner === 'ALL'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {totalCount}
            </span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Main Toolbar Row */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث سريع باسم العميل، الكود (INC-..)، الوسم، أو المسؤول المختص..."
                className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Actions & View Modes (Unified Align) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  showAdvancedFilters
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-750'
                }`}
                title="تصفية وعرض متقدم للتذاكر"
              >
                <span>🔍 التصفية المتقدمة</span>
                {(filterTag !== 'ALL' || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterOwner !== 'ALL') && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={() => exportTicketsToCSV(filteredIssues)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 hover:border-emerald-400 rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                title="تصدير تقرير إكسيل كامل يدعم اللغة العربية بـ UTF-8 BOM"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </button>

              {/* View Mode Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-750 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="عرض الجدول التقليدي"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>الجدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'kanban'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="عرض لوحة كانبان التفاعلية"
                >
                  <Trello className="w-3.5 h-3.5" />
                  <span>الكانبان</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="عرض تقويم المهام الشهري ومواعيد الاستحقاق"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>التقويم</span>
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Filters Shelf */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800/80 rounded-2xl animate-fadeIn">
              {/* Tag Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">🏷️ فلترة بالوسم (Tag):</label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">جميع الوسوم (Tags)</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">🚥 فلترة بالحالة (Status):</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="Open">🔴 Open (مفتوحة)</option>
                  <option value="In Progress">🔵 In Progress (قيد العمل)</option>
                  <option value="Pending">🟠 Pending (معلقة)</option>
                  <option value="Resolved">🟢 Resolved (تم الحل)</option>
                  <option value="Closed">⚪ Closed (مغلقة)</option>
                  <option value="Breached">⚠️ تجاوزت الـ SLA فقط</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">⚡ فلترة بالأولوية (Priority):</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">جميع الأولويات</option>
                  <option value="Critical">🔴 Critical (حرج)</option>
                  <option value="High">🟠 High (عالي)</option>
                  <option value="Medium">🟡 Medium (متوسط)</option>
                  <option value="Low">🟢 Low (منخفض)</option>
                </select>
              </div>

              {/* Owner Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">👤 فلترة بالمسؤول (Owner):</label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-750 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">جميع المسؤولين (داخلي وخارجي)</option>
                  <option value="EXTERNAL_ALL">🌐 جميع الأطراف الخارجية (External)</option>
                  <option value="INTERNAL_ALL">🏢 فريق العمل الداخلي فقط (Internal)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
              تم تحديد ({selectedIds.length}) تذكرة
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenMergeModal && selectedIds.length >= 2 && (
                <button
                  onClick={() => onOpenMergeModal(selectedIds)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  title="دمج التذاكر المحددة في تذكرة رئيسية واحدة"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>دمج التذاكر المحددة ({selectedIds.length}) 🔗</span>
                </button>
              )}
              <button
                onClick={() => {
                  onBulkChangeStatus(selectedIds, 'In Progress');
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                تحويل إلى قيد العمل 🔵
              </button>
              <button
                onClick={() => {
                  onBulkChangeStatus(selectedIds, 'Resolved');
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                تحويل إلى تم الحل 🟢
              </button>
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} تذكرة محددة؟`)) {
                    onBulkDelete(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
              >
                حذف المحدد 🗑️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Handlers */}
      {(() => {
        const handleDragStart = (e: React.DragEvent, ticketId: string) => {
          e.dataTransfer.setData('text/plain', ticketId);
        };

        const handleDragOver = (e: React.DragEvent, colStatus: string) => {
          e.preventDefault();
          if (draggedOverCol !== colStatus) {
            setDraggedOverCol(colStatus);
          }
        };

        const handleDrop = (e: React.DragEvent, targetStatus: IssueStatus) => {
          e.preventDefault();
          setDraggedOverCol(null);
          const ticketId = e.dataTransfer.getData('text/plain');
          if (!ticketId) return;
          const ticket = issues.find((i) => i.id === ticketId);
          if (ticket && ticket.status !== targetStatus) {
            if (onQuickStatusChange) {
              onQuickStatusChange(ticket, targetStatus);
            }
          }
        };

        return (
          <>
            {viewMode === 'table' ? (
              <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden animate-fadeIn">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredIssues.length > 0 && selectedIds.length === filteredIssues.length
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="p-3.5">الكود</th>
                        <th className="p-3.5">العميل / الوسم</th>
                        <th className="p-3.5">نوع المشكلة</th>
                        <th className="p-3.5 max-w-xs">وصف المشكلة</th>
                        <th className="p-3.5">المُسنَد إليه</th>
                        <th className="p-3.5 whitespace-nowrap">وقت العمل</th>
                        <th className="p-3.5 whitespace-nowrap">الأولوية</th>
                        <th className="p-3.5 whitespace-nowrap">الحالة</th>
                        <th className="p-3.5 whitespace-nowrap">اتفاقية SLA</th>
                        <th className="p-3.5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <div className="max-w-md mx-auto space-y-3">
                              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                                {filterStatus === 'Open'
                                  ? 'لا توجد تذاكر جديدة بحالة مفتوحة حالياً (تم حل أو معالجة كافة البلاغات السابقة) 🟢'
                                  : 'لا توجد تذاكر تطابق معايير البحث والفلترة المحددة'}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {filterStatus === 'Open'
                                  ? 'يمكنك استعراض التذاكر قيد العمل أو جميع التذاكر من الأزرار السريعة أدناه:'
                                  : 'جرب تغيير شروط الفلترة أو إنشاء تذكرة جديدة'}
                              </p>
                              <div className="flex flex-wrap justify-center gap-2 pt-2">
                                {filterStatus !== 'ALL' && (
                                  <button
                                    type="button"
                                    onClick={() => setFilterStatus('ALL')}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                                  >
                                    عرض جميع التذاكر ({totalCount}) 📋
                                  </button>
                                )}
                                {inProgressCount > 0 && filterStatus !== 'In Progress' && (
                                  <button
                                    type="button"
                                    onClick={() => setFilterStatus('In Progress')}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                                  >
                                    عرض قيد العمل ({inProgressCount}) 🔵
                                  </button>
                                )}
                                {resolvedCount > 0 && filterStatus !== 'Resolved' && (
                                  <button
                                    type="button"
                                    onClick={() => setFilterStatus('Resolved')}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                                  >
                                    عرض التذاكر المحلولة ({resolvedCount}) 🟢
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((item) => {
                          const isBreached = isTicketSlaBreached(item.createdAt, item.dueDate, item.status);
                          const remaining = getRemainingTimeFormatted(item.dueDate, item.status);
                          const isSelected = selectedIds.includes(item.id);
                          const hasCollision = collisionsMap[item.id] && collisionsMap[item.id].length > 0;

                          return (
                            <tr
                              key={item.id}
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('input[type="checkbox"], button')) return;
                                onOpenDetails(item);
                              }}
                              className={`cursor-pointer transition border-r-4 ${
                                hasCollision
                                  ? 'border-r-amber-500 bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/15'
                                  : isBreached
                                  ? 'border-r-rose-500 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-950/40'
                                  : isSelected
                                  ? 'border-r-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40'
                                  : 'border-r-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="p-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                                  className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>

                              {/* Ticket ID */}
                              <td className="p-3.5">
                                <button
                                  onClick={() => onOpenDetails(item)}
                                  className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{item.id}</span>
                                </button>
                              </td>

                              {/* Client & Tag */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white block">{item.client}</span>
                                  {onOpenCustomerProfile && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenCustomerProfile(item.client);
                                      }}
                                      className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition cursor-pointer"
                                      title={`عرض بطاقة العميل الشاملة 360° لـ (${item.client})`}
                                    >
                                      <User className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* 1-Click WhatsApp Quick Action */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWhatsAppIssue(item);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold transition shadow-2xs cursor-pointer active:scale-95"
                                    title={`مراسلة العميل (${item.client}) عبر واتساب بنقرة واحدة`}
                                  >
                                    <MessageSquare className="w-3 h-3 fill-emerald-600/20 text-emerald-600 dark:text-emerald-400" />
                                    <span>واتساب 💬</span>
                                  </button>
                                </div>

                                {/* Collision Detection Live Chip */}
                                {collisionsMap[item.id] && collisionsMap[item.id].length > 0 && (
                                  <div className="mt-1">
                                    <CollisionAlertBanner viewers={collisionsMap[item.id]} compact />
                                  </div>
                                )}

                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {item.tag && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                      <TagIcon className="w-2.5 h-2.5" />
                                      <span>{item.tag}</span>
                                    </span>
                                  )}
                                  {item.mergedIntoTicketId && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                      <GitMerge className="w-2.5 h-2.5" />
                                      <span>مدمجة مع {item.mergedIntoTicketId}</span>
                                    </span>
                                  )}
                                  {item.mergedTicketIds && item.mergedTicketIds.length > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                                      <GitMerge className="w-2.5 h-2.5" />
                                      <span>مدمج معها ({item.mergedTicketIds.length})</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{item.type}</td>

                              {/* Desc snippet */}
                              <td className="p-3.5 max-w-xs text-slate-500 dark:text-slate-400 truncate" title={item.desc}>
                                {item.desc}
                              </td>

                              {/* Assignee & Team */}
                              <td className="p-3.5">
                                {item.isExternalOwner ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                                      <Globe className="w-2.5 h-2.5" />
                                      <span>طرف خارجي</span>
                                    </span>
                                    <span className="font-bold text-purple-950 dark:text-purple-200 block text-xs truncate max-w-[150px]" title={item.externalOwnerDetails?.name || item.owner}>
                                      {item.owner}
                                    </span>
                                    {item.externalOwnerDetails?.company && (
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]" title={item.externalOwnerDetails.company}>
                                        🏢 {item.externalOwnerDetails.company}
                                      </span>
                                    )}
                                    {item.externalOwnerDetails?.externalTicketId && (
                                      <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 block">
                                        #{item.externalOwnerDetails.externalTicketId}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-bold text-amber-700 dark:text-amber-400 block">{item.owner}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{item.assigned}</span>
                                  </>
                                )}
                              </td>

                              {/* Work Timer */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{formatSecondsToHMS(item.workTime || 0)}</span>
                                  </span>
                                  {item.status !== 'Resolved' && item.status !== 'Closed' && (
                                    <button
                                      onClick={() => onToggleTimer(item)}
                                      className={`p-1 rounded-lg transition ${
                                        item.isWorkingNow
                                          ? 'bg-rose-600 text-white animate-pulse'
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                                      }`}
                                      title={item.isWorkingNow ? 'إيقاف عداد العمل مؤقتاً' : 'بدء العمل وتشغيل العداد'}
                                    >
                                      {item.isWorkingNow ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Priority */}
                              <td className="p-3.5 whitespace-nowrap">{getPriorityBadge(item.priority)}</td>

                              {/* Status */}
                              <td className="p-3.5 whitespace-nowrap">{getStatusBadge(item.status)}</td>

                              {/* SLA */}
                              <td className="p-3.5 font-mono">
                                {isBreached ? (
                                  <div className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{remaining.text}</span>
                                  </div>
                                ) : (
                                  <span
                                    className={`text-[11px] font-semibold ${
                                      item.status === 'Resolved' || item.status === 'Closed'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    {remaining.text}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {/* 1-Click WhatsApp Direct Chat with Client */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWhatsAppIssue(item);
                                    }}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition"
                                    title={`مراسلة العميل (${item.client}) عبر واتساب`}
                                  >
                                    <MessageSquare className="w-4 h-4 fill-emerald-600/20" />
                                  </button>

                                  {/* 1-Click WhatsApp Direct Chat with External Owner */}
                                  {item.isExternalOwner && item.externalOwnerDetails?.phone && (
                                    <a
                                      href={`https://wa.me/${item.externalOwnerDetails.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                        `السلام عليكم أستاذ ${item.externalOwnerDetails.name || ''}، بخصوص البلاغ رقم ${item.id} لدى شركتكم الموقرة.`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition"
                                      title={`مراسلة المسؤول الخارجي (${item.externalOwnerDetails.name || item.owner}) مباشرة عبر واتساب`}
                                    >
                                      <Globe className="w-4 h-4" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => onOpenDetails(item)}
                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="عرض التفاصيل والتايم لاين"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onOpenEdit(item)}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="تعديل بيانات التذكرة"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {item.status !== 'Resolved' && item.status !== 'Closed' && (
                                    <button
                                      onClick={() => onOpenResolve(item)}
                                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                      title="حل وإغلاق التذكرة"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف التذكرة ${item.id} نهائياً؟`)) {
                                        onDeleteIssue(item.id);
                                      }
                                    }}
                                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="حذف التذكرة"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
            ) : viewMode === 'kanban' ? (
              /* KANBAN BOARD VIEW WITH PREMIUM 3D GLASSMORPHIC CARDS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4 animate-fadeIn [perspective:1000px]" dir="rtl">
                {[
                  { status: 'Open', label: '🆕 مفتوحة (Open)', bgClass: 'bg-rose-500/5', borderClass: 'border-rose-500/20', textClass: 'text-rose-600 dark:text-rose-400' },
                  { status: 'In Progress', label: '🛠️ قيد العمل (In Progress)', bgClass: 'bg-indigo-500/5', borderClass: 'border-indigo-500/20', textClass: 'text-indigo-600 dark:text-indigo-400' },
                  { status: 'Pending', label: '⏳ معلقة (Pending)', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/20', textClass: 'text-amber-600 dark:text-amber-400' },
                  { status: 'Resolved', label: '🟢 تم الحل (Resolved)', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/20', textClass: 'text-emerald-600 dark:text-emerald-400' },
                  { status: 'Closed', label: '⚪ مغلقة (Closed)', bgClass: 'bg-slate-500/5', borderClass: 'border-slate-500/20', textClass: 'text-slate-600 dark:text-slate-400' },
                ].map((col) => {
                  const colIssues = filteredIssues.filter((i) => i.status === col.status);
                  
                  // Compute theme-specific columns styling
                  const isOver = draggedOverCol === col.status;
                  let columnGlowClass = "";
                  if (appSkin === 'amethyst') {
                    columnGlowClass = isOver 
                      ? "shadow-[0_10px_40px_rgba(139,92,246,0.3)] border-purple-500 bg-purple-500/15 scale-[1.02] backdrop-blur-md" 
                      : "shadow-[0_4px_25px_rgba(139,92,246,0.06)] border-purple-200/40 dark:border-purple-900/30 bg-purple-500/5 dark:bg-indigo-950/10 backdrop-blur-md";
                  } else if (appSkin === 'cyberpunk') {
                    columnGlowClass = isOver 
                      ? "shadow-[0_10px_40px_rgba(244,63,94,0.35)] border-rose-500 bg-rose-500/15 scale-[1.02] backdrop-blur-md" 
                      : "shadow-[0_4px_25px_rgba(244,63,94,0.06)] border-rose-300/30 dark:border-rose-950/20 bg-rose-500/5 dark:bg-slate-950/30 backdrop-blur-md";
                  } else if (appSkin === 'ocean') {
                    columnGlowClass = isOver 
                      ? "shadow-[0_10px_40px_rgba(14,165,233,0.3)] border-sky-400 bg-sky-500/15 scale-[1.02] backdrop-blur-md" 
                      : "shadow-[0_4px_25px_rgba(14,165,233,0.06)] border-sky-300/30 dark:border-sky-950/30 bg-sky-500/5 dark:bg-slate-900/10 backdrop-blur-md";
                  } else {
                    columnGlowClass = isOver 
                      ? "shadow-lg border-indigo-500 bg-indigo-500/10 scale-[1.02] dark:bg-indigo-950/20" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-500/5";
                  }

                  return (
                    <div
                      key={col.status}
                      onDragOver={(e) => handleDragOver(e, col.status)}
                      onDragLeave={() => setDraggedOverCol(null)}
                      onDrop={(e) => handleDrop(e, col.status as IssueStatus)}
                      className={`rounded-3xl p-3 flex flex-col space-y-3 min-h-[520px] border transition-all duration-300 ${columnGlowClass}`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className={`font-black text-xs ${col.textClass}`}>{col.label}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-400">
                          {colIssues.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
                        {colIssues.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-[10px] font-bold border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                            اسحب تذكرة هنا 🎯
                          </div>
                        ) : (
                          colIssues.map((item) => {
                            const isBreached = isTicketSlaBreached(item.createdAt, item.dueDate, item.status);
                            const remaining = getRemainingTimeFormatted(item.dueDate, item.status);
                            const hasCollision = collisionsMap[item.id] && collisionsMap[item.id].length > 0;

                            // Compute dynamic card-skin classes for luxurious 3D look
                            let cardSkinClasses = "p-3.5 rounded-2xl shadow-md space-y-3 cursor-grab hover:scale-[1.03] active:cursor-grabbing [transform-style:preserve-3d] hover:[transform:perspective(800px)_rotateX(2.5deg)_rotateY(-2.5deg)_translateZ(8px)] transition-all duration-300 ease-out relative border-r-4 ";
                            
                            if (hasCollision) {
                              cardSkinClasses += "border-r-amber-500 ";
                            } else if (isBreached) {
                              cardSkinClasses += "border-r-rose-500 ";
                            } else {
                              cardSkinClasses += "border-r-indigo-500 ";
                            }

                            if (appSkin === 'amethyst') {
                              cardSkinClasses += "bg-white/70 dark:bg-indigo-950/20 backdrop-blur-lg border border-purple-200/40 dark:border-purple-900/30 hover:shadow-[0_10px_25px_rgba(168,85,247,0.25)]";
                            } else if (appSkin === 'cyberpunk') {
                              cardSkinClasses += "bg-white/65 dark:bg-slate-950/45 backdrop-blur-lg border border-rose-300/30 dark:border-rose-950/45 hover:shadow-[0_10px_25px_rgba(244,63,94,0.3)]";
                            } else if (appSkin === 'ocean') {
                              cardSkinClasses += "bg-white/70 dark:bg-slate-900/40 backdrop-blur-lg border border-sky-200/40 dark:border-sky-950/30 hover:shadow-[0_10px_25px_rgba(14,165,233,0.25)]";
                            } else {
                              cardSkinClasses += "bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:shadow-lg";
                            }

                            return (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onClick={() => onOpenDetails(item)}
                                className={cardSkinClasses}
                              >
                                {/* Card ID & Priority */}
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                    {item.id}
                                  </span>
                                  <PriorityBadge priority={item.priority} size="sm" />
                                </div>

                                {/* Client & Department */}
                                <div>
                                  <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                                    {item.client}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.type}</p>
                                </div>

                                {/* Collision badge if teammate inside */}
                                {hasCollision && (
                                  <div className="mt-1">
                                    <CollisionAlertBanner viewers={collisionsMap[item.id]} compact />
                                  </div>
                                )}

                                {/* Timeline / SLA Indicator */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    <span>المهلة:</span>
                                  </div>
                                  <span className={`font-mono font-bold ${isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {item.status === 'Resolved' || item.status === 'Closed' ? '✓ مكتملة' : remaining.text}
                                  </span>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                    👤 {item.owner}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {/* WhatsApp Quick Link */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWhatsAppIssue(item);
                                      }}
                                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
                                      title="مراسلة واتساب"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenEdit(item);
                                      }}
                                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-amber-600 dark:text-amber-400 transition cursor-pointer"
                                      title="تعديل"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* CALENDAR & DATE INQUIRY VIEW (تقويم الـ SLA والبحث الفوري عن التذاكر حسب التاريخ) */
              <div className="space-y-6 animate-fadeIn">
                {/* Info Alert Banner */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2 font-bold">
                  <span className="text-sm">💡</span>
                  <span>هذه الواجهة مخصصة لمتابعة استحقاقات اتفاقية الخدمة (SLA) بشكل شهري تفاعلي ومراقبة تدفق البلاغات الواردة في أي تاريخ محدد!</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Calendar Grid */}
                  <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl space-y-4">
                    
                    {/* Calendar Title & Month Navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                          <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                            📅 تقويم استحقاق الـ SLA وتذاكر الموظفين
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            استعرض مواعيد الحل النهائية واضغط على أي يوم لمعاينة تذاكره بالتفصيل.
                          </p>
                        </div>
                      </div>

                      {/* Month Swinger Navigation */}
                      <div className="flex items-center justify-between sm:justify-end gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            const prev = new Date(calendarDate);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalendarDate(prev);
                            setSelectedDay(null);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800 transition shadow-2xs cursor-pointer"
                        >
                          ◀ السابق
                        </button>
                        <span className="font-black text-xs text-slate-900 dark:text-white px-3 font-mono min-w-[100px] text-center">
                          {MONTHS_AR[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Date(calendarDate);
                            next.setMonth(next.getMonth() + 1);
                            setCalendarDate(next);
                            setSelectedDay(null);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800 transition shadow-2xs cursor-pointer"
                        >
                          التالي ▶
                        </button>
                      </div>
                    </div>

                    {/* Weekday Names (Arabic Labels starting on Sunday) */}
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                      <div>الأحد</div>
                      <div>الإثنين</div>
                      <div>الثلاثاء</div>
                      <div>الأربعاء</div>
                      <div>الخميس</div>
                      <div>الجمعة</div>
                      <div>السبت</div>
                    </div>

                    {/* Calendar Days Cells Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Previous month filler cells */}
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();
                        const firstDayIdx = new Date(year, month, 1).getDay();
                        const prevTotalDays = new Date(year, month, 0).getDate();
                        
                        return Array.from({ length: firstDayIdx }).map((_, idx) => {
                          const dayNum = prevTotalDays - firstDayIdx + idx + 1;
                          return (
                            <div
                              key={`prev-${idx}`}
                              className="aspect-square p-1.5 bg-slate-100/10 dark:bg-slate-950/10 text-slate-400/40 dark:text-slate-700/40 rounded-xl sm:rounded-2xl flex flex-col justify-between border border-transparent select-none text-[10px] font-mono"
                            >
                              <span>{dayNum}</span>
                            </div>
                          );
                        });
                      })()}

                      {/* Current Month Days Cells */}
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();
                        const totalDays = new Date(year, month + 1, 0).getDate();
                        const today = new Date();

                        return Array.from({ length: totalDays }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const isToday = 
                            today.getDate() === dayNum && 
                            today.getMonth() === month && 
                            today.getFullYear() === year;
                          
                          const isSelected = selectedDay === dayNum;

                          // Open tickets due today (SLA)
                          const dueOnDay = issues.filter(item => 
                            item.status !== 'Resolved' && 
                            item.status !== 'Closed' && 
                            isSameDay(item.dueDate, year, month, dayNum)
                          );

                          // Tickets created today
                          const openedOnDay = issues.filter(item => 
                            isSameDay(item.createdAt, year, month, dayNum)
                          );

                          // Dynamic skin border styles
                          let cellClasses = "aspect-square p-2 rounded-xl sm:rounded-2xl border flex flex-col justify-between transition cursor-pointer relative select-none ";
                          
                          if (isSelected) {
                            if (appSkin === 'amethyst') {
                              cellClasses += "bg-purple-500/20 border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]";
                            } else if (appSkin === 'cyberpunk') {
                              cellClasses += "bg-rose-500/20 border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)]";
                            } else if (appSkin === 'ocean') {
                              cellClasses += "bg-cyan-500/20 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.4)]";
                            } else {
                              cellClasses += "bg-indigo-600/15 dark:bg-indigo-500/20 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]";
                            }
                          } else if (isToday) {
                            cellClasses += "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 font-bold ring-1 ring-slate-400/20";
                          } else {
                            cellClasses += "bg-slate-50/50 dark:bg-slate-900/35 hover:bg-slate-100 dark:hover:bg-slate-850/60 border-slate-200/80 dark:border-slate-800/50";
                          }

                          return (
                            <div
                              key={`day-${dayNum}`}
                              onClick={() => {
                                setSelectedDay(dayNum);
                                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                setSelectedDateFilter(formattedDate);
                              }}
                              className={cellClasses}
                            >
                              {/* Day Number and Today indicator */}
                              <div className="flex justify-between items-center w-full">
                                <span className={`font-mono text-[11px] sm:text-xs font-black ${
                                  isToday 
                                    ? 'text-indigo-600 dark:text-indigo-400 underline decoration-2' 
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {dayNum}
                                </span>
                                {isToday && (
                                  <span className="text-[8px] bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-1 rounded-sm font-bold scale-90 sm:scale-100">
                                    اليوم
                                  </span>
                                )}
                              </div>

                              {/* Glowing Task Counts inside cell */}
                              <div className="space-y-1 w-full text-right mt-1.5">
                                {dueOnDay.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] text-rose-600 dark:text-rose-400 font-extrabold leading-none truncate" title={`${dueOnDay.length} تذكرة مستحقة الـ SLA`}>
                                      {dueOnDay.length} مستحق
                                    </span>
                                  </div>
                                )}
                                {openedOnDay.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold leading-none truncate" title={`${openedOnDay.length} تذكرة تم افتتاحها اليوم`}>
                                      {openedOnDay.length} افتتحت
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {/* Next month filler cells */}
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();
                        const firstDayIdx = new Date(year, month, 1).getDay();
                        const totalDays = new Date(year, month + 1, 0).getDate();
                        const nextFillerCount = (42 - (totalDays + firstDayIdx)) % 7;
                        
                        return Array.from({ length: nextFillerCount }).map((_, idx) => {
                          const dayNum = idx + 1;
                          return (
                            <div
                              key={`next-${idx}`}
                              className="aspect-square p-1.5 bg-slate-100/10 dark:bg-slate-950/10 text-slate-400/40 dark:text-slate-700/40 rounded-xl sm:rounded-2xl flex flex-col justify-between border border-transparent select-none text-[10px] font-mono"
                            >
                              <span>{dayNum}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Custom Date Inquiry and Details Lists */}
                  <div className="space-y-4">
                    
                    {/* Interactive Date Picker Container */}
                    <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                          🔍 استعلام فوري عن التذاكر حسب تاريخ الإنشاء
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        اختر أي تاريخ بالأسفل من اختيارك أو اضغط يوماً بالتقويم لجلب كل البلاغات التي **تفتتحت** أو **استحقت** في ذلك التاريخ تلقائياً.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={selectedDateFilter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDateFilter(val);
                            if (val) {
                              const d = new Date(val);
                              // Sync calendar active month if they select a different month
                              if (d.getMonth() !== calendarDate.getMonth() || d.getFullYear() !== calendarDate.getFullYear()) {
                                setCalendarDate(d);
                              }
                              setSelectedDay(d.getDate());
                            } else {
                              setSelectedDay(null);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                        />
                        {selectedDateFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDateFilter('');
                              setSelectedDay(null);
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 rounded-xl text-xs font-black transition cursor-pointer"
                          >
                            مسح ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tickets Lists Panel (Lists for selected date) */}
                    <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-lg space-y-4">
                      {selectedDateFilter ? (
                        <>
                          {/* Selected Date Header */}
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex justify-between items-center">
                            <h4 className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                              📅 تفاصيل يوم: {selectedDateFilter}
                            </h4>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                              {new Date(selectedDateFilter).toLocaleDateString('ar-EG', { weekday: 'long' })}
                            </span>
                          </div>

                          {/* 1. SLA Due (Open/In Progress/Pending due on selected date) */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span>⏳ تذاكر مستحقة الـ SLA (مطلوب حلها):</span>
                            </h5>

                            {(() => {
                              const d = new Date(selectedDateFilter);
                              const list = issues.filter(item => 
                                item.status !== 'Resolved' && 
                                item.status !== 'Closed' && 
                                isSameDay(item.dueDate, d.getFullYear(), d.getMonth(), d.getDate())
                              );

                              if (list.length === 0) {
                                return (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-5 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50">
                                    لا توجد تذاكر مستحقة الـ SLA في هذا اليوم 🟢
                                  </p>
                                );
                              }

                              return (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {list.map(ticket => (
                                    <div
                                      key={ticket.id}
                                      onClick={() => onOpenDetails(ticket)}
                                      className="p-3 bg-white dark:bg-slate-950/45 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl transition cursor-pointer text-right text-xs relative overflow-hidden group hover:border-indigo-400"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                          {ticket.id}
                                        </span>
                                        <PriorityBadge priority={ticket.priority} size="sm" />
                                      </div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {ticket.client}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {ticket.desc}
                                      </div>
                                      <div className="mt-2 pt-1.5 border-t border-slate-100/50 dark:border-slate-900/50 flex justify-between items-center text-[9px] text-slate-400">
                                        <span>👤 {ticket.owner}</span>
                                        <span className="text-rose-500 font-extrabold">
                                          مستحق: {new Date(ticket.dueDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          {/* 2. Opened on this day (Created on selected date) */}
                          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>🆕 تذاكر تم افتتاحها في هذا اليوم (تاريخ الإنشاء):</span>
                            </h5>

                            {(() => {
                              const d = new Date(selectedDateFilter);
                              const list = issues.filter(item => 
                                isSameDay(item.createdAt, d.getFullYear(), d.getMonth(), d.getDate())
                              );

                              if (list.length === 0) {
                                return (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-5 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50">
                                    لا توجد تذاكر تم افتتاحها في هذا اليوم 📁
                                  </p>
                                );
                              }

                              return (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {list.map(ticket => (
                                    <div
                                      key={ticket.id}
                                      onClick={() => onOpenDetails(ticket)}
                                      className="p-3 bg-white dark:bg-slate-950/45 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl transition cursor-pointer text-right text-xs relative overflow-hidden group hover:border-emerald-400"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                          {ticket.id}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <StatusBadge status={ticket.status} />
                                          <PriorityBadge priority={ticket.priority} size="sm" />
                                        </div>
                                      </div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {ticket.client}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {ticket.desc}
                                      </div>
                                      <div className="mt-2 pt-1.5 border-t border-slate-100/50 dark:border-slate-900/50 flex justify-between items-center text-[9px] text-slate-400">
                                        <span>👤 {ticket.owner}</span>
                                        <span className="text-indigo-500 font-extrabold">
                                          أنشئ: {new Date(ticket.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-16 space-y-3">
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-lg">
                            📅
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            انقر على أي يوم بالتقويم
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
                            أو حدد تاريخًا معينًا من الحقل بالأعلى لعرض البلاغات المستحقة أو التي تم افتتاحها في هذا التاريخ فوراً وبأقصى سرعة!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* 1-Click WhatsApp Direct Chat Modal */}
      <WhatsAppChatModal
        isOpen={Boolean(whatsAppIssue)}
        onClose={() => setWhatsAppIssue(null)}
        issue={whatsAppIssue}
        currentUser={currentUser}
        onUpdatePhone={onUpdatePhone}
      />
    </div>
  );
};
