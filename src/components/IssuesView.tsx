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
  GitMerge
} from 'lucide-react';
import { Issue, AppUser, Priority, IssueStatus } from '../types';
import { isTicketSlaBreached, getRemainingTimeFormatted, formatSecondsToHMS } from '../utils/sla';
import { exportTicketsToCSV } from '../utils/export';
import { PriorityBadge, StatusBadge } from './Badges';

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
}

export const IssuesView: React.FC<IssuesViewProps> = ({
  issues,
  tags,
  users,
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
}) => {
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterOwner, setFilterOwner] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering
  const filteredIssues = issues.filter((item) => {
    const breached = isTicketSlaBreached(item.createdAt, item.dueDate, item.status);
    
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
    if (filterOwner !== 'ALL' && !item.owner.includes(filterOwner)) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        item.client.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.tag && item.tag.toLowerCase().includes(q)) ||
        item.desc.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);
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
              <option value="ALL">جميع الموظفين</option>
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
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد تذاكر تطابق معايير البحث والفلترة المحددة</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جرب تغيير شروط الفلترة أو إضافة تذكرة جديدة</p>
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
                        </div>
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
                        <span className="font-bold text-amber-700 dark:text-amber-400 block">{item.owner}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{item.assigned}</span>
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
    </div>
  );
};
