import React, { useState } from 'react';
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
  Building
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
}

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
  onBulkChangeStatus,
  onBulkDelete,
  onOpenCustomerProfile,
  onOpenMergeModal,
  initialFilterStatus = 'ALL',
  onUpdatePhone,
}) => {
  const [search, setSearch] = useState('');
  const [whatsAppIssue, setWhatsAppIssue] = useState<Issue | null>(null);

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
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>📁 كل التذاكر ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketSourceFilter('CLIENT')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'CLIENT'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
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
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              ticketSourceFilter === 'INTERNAL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
              filterStatus === 'Open'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
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
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
              filterStatus === 'In Progress'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
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
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                filterStatus === 'Breached'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
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
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
              filterStatus === 'Resolved'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
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
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
              filterOwner === 'EXTERNAL_ALL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
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
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
              filterStatus === 'ALL' && filterOwner === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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

        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العميل، الكود (INC-..)، الوسم، أو المسؤول..."
              className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tag Filter */}
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">جميع الوسوم (Tags)</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="Open">🔴 Open (مفتوحة)</option>
              <option value="In Progress">🔵 In Progress (قيد العمل)</option>
              <option value="Pending">🟠 Pending (معلقة)</option>
              <option value="Resolved">🟢 Resolved (تم الحل)</option>
              <option value="Closed">⚪ Closed (مغلقة)</option>
              <option value="Breached">⚠️ تجاوزت الـ SLA فقط</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">جميع الأولويات</option>
              <option value="Critical">🔴 Critical (حرج)</option>
              <option value="High">🟠 High (عالي)</option>
              <option value="Medium">🟡 Medium (متوسط)</option>
              <option value="Low">🟢 Low (منخفض)</option>
            </select>

            {/* Owner Filter */}
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* Export CSV */}
            <button
              onClick={() => exportTicketsToCSV(filteredIssues)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              title="تصدير تقرير إكسيل كامل يدعم اللغة العربية بـ UTF-8 BOM"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير CSV</span>
            </button>
          </div>
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

      {/* Issues Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
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
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
                          >
                            عرض جميع التذاكر ({totalCount}) 📋
                          </button>
                        )}
                        {inProgressCount > 0 && filterStatus !== 'In Progress' && (
                          <button
                            type="button"
                            onClick={() => setFilterStatus('In Progress')}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
                          >
                            عرض قيد العمل ({inProgressCount}) 🔵
                          </button>
                        )}
                        {resolvedCount > 0 && filterStatus !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => setFilterStatus('Resolved')}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
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

                  return (
                    <tr
                      key={item.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('input[type="checkbox"], button')) return;
                        onOpenDetails(item);
                      }}
                      className={`cursor-pointer transition ${
                        isBreached
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-950/40'
                          : isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
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
                          className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1"
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
                              className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
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
