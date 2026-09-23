import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Clock, 
  Play, 
  Pause, 
  Star, 
  Send, 
  Paperclip, 
  Tag as TagIcon, 
  CheckCircle2, 
  MessageSquare, 
  History,
  FileText,
  User,
  GitMerge,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Issue, AppUser } from '../types';
import { formatSecondsToHMS, isTicketSlaBreached, getRemainingTimeFormatted } from '../utils/sla';
import { PriorityBadge, StatusBadge } from './Badges';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  currentUser: AppUser;
  cannedResponses: string[];
  onToggleTimer: (issue: Issue) => void;
  onStartTimer?: (issue: Issue) => void;
  onPauseTimer?: (issue: Issue) => void;
  onUpdateCsat: (issueId: string, rating: number) => void;
  onAddComment: (issueId: string, commentText: string, attachment?: { name: string; url: string }) => void;
  onOpenCustomerProfile?: (clientName: string) => void;
  onOpenMergeModal?: (ticketId: string) => void;
  onNavigateToTicket?: (ticketId: string) => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  issue,
  cannedResponses,
  onToggleTimer,
  onStartTimer,
  onPauseTimer,
  onUpdateCsat,
  onAddComment,
  onOpenCustomerProfile,
  onOpenMergeModal,
  onNavigateToTicket,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [tempCommentAttachment, setTempCommentAttachment] = useState<{ name: string; url: string } | undefined>(undefined);

  // Automatically guarantee timer starts as soon as ticket details modal opens
  useEffect(() => {
    if (isOpen && issue && issue.status !== 'Resolved' && issue.status !== 'Closed') {
      if (!issue.isWorkingNow) {
        if (onStartTimer) {
          onStartTimer(issue);
        } else {
          onToggleTimer(issue);
        }
      }
    }
  }, [isOpen, issue?.id]);

  if (!isOpen || !issue) return null;

  const isBreached = isTicketSlaBreached(issue.createdAt, issue.dueDate, issue.status);
  const remaining = getRemainingTimeFormatted(issue.dueDate, issue.status);

  const handlePrint = () => {
    window.print();
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() && !tempCommentAttachment) return;

    onAddComment(issue.id, commentInput.trim(), tempCommentAttachment);
    setCommentInput('');
    setTempCommentAttachment(undefined);
  };

  const handleCommentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('الحد الأقصى للمرفق هو 2 ميجابايت!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempCommentAttachment({
        name: file.name,
        url: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        id="printable-report"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 text-slate-900 dark:text-white">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-black bg-indigo-600 px-2.5 py-1 rounded-xl text-white shadow">
              {issue.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{issue.client}</h3>
                {onOpenCustomerProfile && (
                  <button
                    onClick={() => onOpenCustomerProfile(issue.client)}
                    className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                    title="فتح بطاقة العميل الشاملة 360°"
                  >
                    <User className="w-3 h-3" />
                    <span>ملف العميل 360°</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                  <TagIcon className="w-2.5 h-2.5" />
                  <span>{issue.tag || 'عام'}</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">• {issue.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMergeModal && issue.status !== 'Closed' && !issue.mergedIntoTicketId && (
              <button
                onClick={() => onOpenMergeModal(issue.id)}
                className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                title="دمج هذه التذكرة مع بلاغ آخر مكرر"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">دمج التذكرة</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              title="طباعة التقرير أو تصديره إلى PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Merged Into Secondary Banner */}
          {issue.mergedIntoTicketId && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">
                    🔗 تم دمج هذا البلاغ في التذكرة الأساسية: {issue.mergedIntoTicketId}
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    تم إغلاق هذه التذكرة كنسخة مدمجة، وتُنقل كافة الإجراءات للتذكرة الرئيسية.
                  </span>
                </div>
              </div>
              {onNavigateToTicket && (
                <button
                  onClick={() => onNavigateToTicket(issue.mergedIntoTicketId!)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition"
                >
                  <span>فتح التذكرة الأساسية {issue.mergedIntoTicketId}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0" />
                </button>
              )}
            </div>
          )}

          {/* Primary Ticket Showing Merged Sub-Tickets */}
          {issue.mergedTicketIds && issue.mergedTicketIds.length > 0 && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2 text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs">
                  التذاكر المدمجة في هذا البلاغ ({issue.mergedTicketIds.length} تذكرة تابعة):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {issue.mergedTicketIds.map((subId) => (
                  <button
                    key={subId}
                    onClick={() => onNavigateToTicket && onNavigateToTicket(subId)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-slate-800 transition shadow-xs"
                    title={`عرض التذكرة المدمجة ${subId}`}
                  >
                    <span>{subId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Active Work Timer Widget */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                  ⏱️ عداد وقت العمل الفعلي للتذكرة (Stopwatch):
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatSecondsToHMS(issue.workTime || 0)}
                  </span>
                  {issue.isWorkingNow ? (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>العداد يعمل تلقائياً</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                      متوقف مؤقتاً
                    </span>
                  )}
                </div>
              </div>
            </div>

            {issue.status !== 'Resolved' && issue.status !== 'Closed' && (
              <button
                onClick={() => onToggleTimer(issue)}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow ${
                  issue.isWorkingNow
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {issue.isWorkingNow ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>إيقاف مؤقت للعداد</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>استئناف تشغيل العداد</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 items-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-1">الأولوية</span>
              <div>
                <PriorityBadge priority={issue.priority} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-1">الحالة الحالية</span>
              <div>
                <StatusBadge status={issue.status} size="sm" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">المسؤول المباشر</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">{issue.owner}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">موعد استحقاق الـ SLA</span>
              <span className={`font-mono font-bold text-xs ${isBreached ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
                {remaining.text}
              </span>
            </div>
          </div>

          {/* Description & Attachment */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>تفاصيل وفحوى المشكلة:</span>
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {issue.desc}
            </div>

            {issue.attachment && (
              <div className="mt-2">
                <a
                  href={issue.attachment.url}
                  download={issue.attachment.name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold transition"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>تحميل المرفق: {issue.attachment.name}</span>
                </a>
              </div>
            )}
          </div>

          {/* Resolution Reason (if resolved) */}
          {issue.resolutionReason && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>سبب الحل والإجراء المعتمد:</span>
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">{issue.resolutionReason}</p>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>سجل النشاط الزمني (Activity Timeline & SLA Flow)</span>
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">توثيق شفاف لكل حركة</span>
            </div>

            <div className="space-y-2 border-r-2 border-indigo-500/40 pr-3.5 max-h-40 overflow-y-auto">
              {issue.timeline?.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-0.5 shadow-2xs"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{ev.actor}</span>
                    <span className="text-slate-400 font-mono">{ev.time}</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{ev.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{ev.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CSAT Customer Satisfaction Rating */}
          <div className="bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-500/15 dark:via-slate-800 dark:to-slate-800 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-500/30 flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">⭐ تقييم رضا العميل (CSAT)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">انقر على النجوم لتسجيل تقييم جودة الخدمة</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onUpdateCsat(issue.id, star)}
                  className="p-1 hover:scale-125 transition"
                  title={`تقييم ${star} من 5`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (issue.csat || 5)
                        ? 'fill-amber-400 text-amber-500 dark:text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold mr-1">
                ({issue.csat || 5}/5)
              </span>
            </div>
          </div>

          {/* Comments & Discussion */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>التعليقات والملاحظات الداخلية ({issue.comments?.length || 0})</span>
            </h4>

            {/* Comment List */}
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {issue.comments?.length === 0 ? (
                <p className="text-slate-400 text-center py-3">لا توجد تعليقات حتى الآن</p>
              ) : (
                issue.comments?.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1 shadow-2xs"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">{c.user}</span>
                      <span className="text-slate-400 font-mono">{c.time}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">{c.text}</p>
                    {c.attachment && (
                      <div className="mt-1">
                        <a
                          href={c.attachment.url}
                          download={c.attachment.name}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] flex items-center gap-1 font-semibold"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{c.attachment.name}</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSendComment} className="space-y-2">
              <div className="flex gap-2">
                {/* Canned response select */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setCommentInput(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[140px]"
                >
                  <option value="">⚡ رد سريع...</option>
                  {cannedResponses.map((res, i) => (
                    <option key={i} value={res}>
                      {res.length > 35 ? res.substring(0, 35) + '...' : res}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="أضف تعليقاً أو إجراءً متخذاً على التذكرة..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </div>

              {/* Comment file input */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1 font-medium">
                  <Paperclip className="w-3 h-3" />
                  <span>إرفاق ملف في التعليق</span>
                  <input
                    type="file"
                    onChange={handleCommentFile}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                </label>
                {tempCommentAttachment && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ مرفق: {tempCommentAttachment.name}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
