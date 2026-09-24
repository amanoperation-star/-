import React, { useState } from 'react';
import { 
  X, 
  GitMerge, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MessageSquare,
  FileText,
  Layers
} from 'lucide-react';
import { Issue, AppUser } from '../types';
import { formatSecondsToHMS } from '../utils/sla';
import { StatusBadge } from './Badges';

interface MergeTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableIssues: Issue[];
  initialTicketIds?: string[];
  currentUser: AppUser;
  onConfirmMerge: (
    primaryTicketId: string,
    secondaryTicketIds: string[],
    mergeOptions: {
      combineWorkTime: boolean;
      copyComments: boolean;
      mergeNote: string;
    }
  ) => void;
}

export const MergeTicketsModal: React.FC<MergeTicketsModalProps> = ({
  isOpen,
  onClose,
  availableIssues,
  initialTicketIds = [],
  currentUser,
  onConfirmMerge,
}) => {
  // Candidate tickets: all unresolved or active tickets, plus initial tickets
  const selectableIssues = availableIssues.filter(
    (i) => initialTicketIds.includes(i.id) || (i.status !== 'Closed' && !i.mergedIntoTicketId)
  );

  // Selected ticket IDs (minimum 2 to merge)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialTicketIds.length >= 2) return initialTicketIds;
    if (initialTicketIds.length === 1) return initialTicketIds;
    return [];
  });

  // The primary ticket that remains open
  const [primaryId, setPrimaryId] = useState<string>(() => {
    return initialTicketIds[0] || '';
  });

  // Merge options
  const [combineWorkTime, setCombineWorkTime] = useState(true);
  const [copyComments, setCopyComments] = useState(true);
  const [mergeNote, setMergeNote] = useState('تم دمج البلاغات المتشابهة في تذكرة موحدة لتسريع المعالجة وتفادي التكرار.');

  if (!isOpen) return null;

  const handleToggleSelect = (ticketId: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(ticketId);
      const next = exists ? prev.filter((id) => id !== ticketId) : [...prev, ticketId];
      if (primaryId === ticketId && exists) {
        setPrimaryId(next[0] || '');
      } else if (!primaryId && next.length > 0) {
        setPrimaryId(next[0]);
      }
      return next;
    });
  };

  const handleExecuteMerge = () => {
    if (!primaryId) {
      alert('يرجى تحديد التذكرة الأساسية التي ستبقى مفتوحة وتستقبل الدمج.');
      return;
    }
    const secondaryIds = selectedIds.filter((id) => id !== primaryId);
    if (secondaryIds.length === 0) {
      alert('يجب اختيار تذكرتين على الأقل لإتمام عملية الدمج.');
      return;
    }

    onConfirmMerge(primaryId, secondaryIds, {
      combineWorkTime,
      copyComments,
      mergeNote: mergeNote.trim(),
    });
    onClose();
  };

  const primaryIssue = availableIssues.find((i) => i.id === primaryId);
  const secondaryIssues = availableIssues.filter(
    (i) => selectedIds.includes(i.id) && i.id !== primaryId
  );

  // Combined stats calculation
  const totalCombinedWorkSeconds = selectedIds.reduce((sum, id) => {
    const iss = availableIssues.find((i) => i.id === id);
    return sum + (iss?.workTime || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/60 flex justify-between items-center overflow-hidden">
          {/* Subtle Ambient Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/20 via-indigo-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>نظام دمج التذاكر المتكررة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Merge & Link
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                دمج التذاكر المكررة في تذكرة رئيسية واحدة وإغلاق البلاغات التابعة تلقائياً.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Step 1: Select tickets to merge */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. اختر التذاكر المراد دمجها (حد أدنى تذكرتين):</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                تم اختيار: {selectedIds.length} تذكرة
              </span>
            </label>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-950/50">
              {selectableIssues.map((issue) => {
                const isChecked = selectedIds.includes(issue.id);
                const isPrimary = primaryId === issue.id;

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleToggleSelect(issue.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? isPrimary
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600'
                          : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div click
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        {issue.id}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {issue.desc}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          العميل: {issue.client} • القسم: {issue.type} • الوقت: {formatSecondsToHMS(issue.workTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-600 text-white text-[10px]">
                          التذكرة الأساسية 🌟
                        </span>
                      )}
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose Primary Ticket */}
          {selectedIds.length >= 2 && (
            <div className="space-y-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80">
              <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. حدد التذكرة الرئيسية (التي ستبقى مفتوحة وتستقبل الدمج):</span>
              </label>

              <select
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {selectedIds.map((id) => {
                  const iss = availableIssues.find((i) => i.id === id);
                  return (
                    <option key={id} value={id}>
                      {id} - {iss?.desc.slice(0, 45)} ({iss?.client})
                    </option>
                  );
                })}
              </select>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">التذكرة الأساسية:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{primaryId}</span>
                  <span className="text-emerald-600 font-bold">(ستظل قيد العمل والنشاط)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-700 dark:text-amber-300">التذاكر الثانوية:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {secondaryIssues.map((i) => i.id).join(', ') || 'لا توجد'}
                  </span>
                  <span className="text-amber-600 font-bold">(سيتم تحويلها لمحلولة ومدمجة)</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Merge Options */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white block text-xs">
              3. خيارات وإعدادات الدمج:
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineWorkTime}
                  onChange={(e) => setCombineWorkTime(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    جمع وقت العمل الفعلي للتذاكر (الإجمالي: {formatSecondsToHMS(totalCombinedWorkSeconds)})
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyComments}
                  onChange={(e) => setCopyComments(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>نقل ومزامنة جميع التعليقات والمرفقات للتذكرة الأساسية</span>
                </span>
              </label>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                ملاحظة توضيحية لسبب الدمج (ستسجل في السجل الزمني للتذاكر):
              </label>
              <input
                type="text"
                value={mergeNote}
                onChange={(e) => setMergeNote(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            إلغاء
          </button>

          <button
            disabled={selectedIds.length < 2 || !primaryId}
            onClick={handleExecuteMerge}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition active:scale-95"
          >
            <GitMerge className="w-4 h-4" />
            <span>تأكيد وتنفيذ دمج التذاكر الآن ({selectedIds.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
