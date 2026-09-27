import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Tag, 
  Star, 
  RefreshCw, 
  ChevronRight, 
  Globe, 
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Issue, AppUser } from '../types';
import { isTicketSlaBreached, getRemainingTimeFormatted, formatArabicDate, calculateDueDate } from '../utils/sla';
import { PriorityBadge } from './Badges';

interface CustomerPortalViewProps {
  issues: Issue[];
  onSelectTicket?: (ticketId: string) => void;
  onUpdateIssue?: (issueId: string, updates: Partial<Issue>) => void;
  onAddComment?: (issueId: string, commentText: string, attachment?: { name: string; url: string }) => void;
  currentUser?: AppUser;
  onOpenNewTicketModal: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  issues,
  onSelectTicket,
  onUpdateIssue,
  onAddComment,
  currentUser,
  onOpenNewTicketModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [clientCommentInput, setClientCommentInput] = useState('');
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Find matching tickets by search term (Ticket ID, Phone, Client name, Email)
  const filteredIssues = issues.filter((i) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesId = i.id.toLowerCase().includes(term);
    const matchesClient = i.client.toLowerCase().includes(term);
    const matchesPhone = i.clientPhone && i.clientPhone.toLowerCase().includes(term);
    const matchesDesc = i.desc && i.desc.toLowerCase().includes(term);
    const matchesExt = i.externalOwnerDetails?.externalTicketId?.toLowerCase().includes(term);
    return matchesId || matchesClient || matchesPhone || matchesDesc || matchesExt;
  });

  const selectedTicket = issues.find((i) => i.id === selectedTicketId);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCommentInput.trim() || !selectedTicketId) return;
    if (onAddComment) {
      onAddComment(selectedTicketId, clientCommentInput.trim());
      setClientCommentInput('');
    }
  };

  const handleRateCsat = (ticketId: string) => {
    if (onUpdateIssue) {
      onUpdateIssue(ticketId, {
        csat: selectedRating,
        clientNotes: ratingComment,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn" dir="rtl">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Globe className="w-4 h-4" />
            <span>بوابة تتبع خدمات العملاء (Customer Service Portal)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            متابعة حالة طلباتك وبلاغاتك لحظة بلحظة ⏱️
          </h1>

          <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
            أدخل رقم البلاغ أو رقم الهاتف الخاص بك للاطلاع الفوري على حالة التنفيذ، نسبة إنجاز اتفاقية مستوى الخدمة (SLA)، وسجل المتابعة مع فريق الدعم الفني.
          </p>

          {/* Search Box */}
          <div className="pt-2">
            <div className="relative w-full">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم البلاغ (مثال: INC-1001) أو رقم الهاتف أو اسم العميل..."
                className="w-full bg-white/10 dark:bg-slate-900/80 border border-white/20 rounded-2xl pr-12 pl-4 py-3.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-md shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column / Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>البلاغات المتاحة للمتابعة ({filteredIssues.length})</span>
            </h2>
            <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs">
              {['All', 'Open', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterStatus === st 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'All' ? 'الكل' : st === 'Open' ? 'نشطة' : 'منجزة'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">لا توجد بلاغات مطابقة للبحث</p>
                <p className="text-xs text-slate-500">جرب البحث برقم البلاغ INC أو رقم هاتف العميل.</p>
              </div>
            ) : (
              filteredIssues
                .filter((i) => {
                  if (filterStatus === 'Open') return i.status !== 'Resolved' && i.status !== 'Closed';
                  if (filterStatus === 'Resolved') return i.status === 'Resolved' || i.status === 'Closed';
                  return true;
                })
                .map((ticket) => {
                  const isSelected = selectedTicketId === ticket.id;
                  const breached = isTicketSlaBreached(ticket.createdAt, ticket.dueDate, ticket.status, ticket.slaPaused);
                  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 text-right ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-400/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          {ticket.id}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isResolved 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                            : breached 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {isResolved ? 'منجز ✅' : breached ? 'متأخر 🔴' : 'قيد المعالجة ⏱️'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
                          {ticket.client}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{ticket.tag || 'بلاغ دعم'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <span>{ticket.type || 'عام'}</span>
                        <PriorityBadge priority={ticket.priority} size="sm" />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Column / Ticket Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">اختر تذكرة لعرض التفاصيل الكاملة</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                انقر على أي بلاغ من القائمة الجانبية أو ابحث برقم البلاغ لمتابعة حالة التنفيذ، عداد الـ SLA، والتواصل مع فريق الدعم.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                      {selectedTicket.id}
                    </span>
                    {selectedTicket.externalOwnerDetails?.externalTicketId && (
                      <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        مرجع خارجي: {selectedTicket.externalOwnerDetails.externalTicketId}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedTicket.client} - {selectedTicket.tag}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTicket && onSelectTicket(selectedTicket.id)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>عرض التفاصيل الكاملة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status & SLA Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">حالة البلاغ</span>
                  <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{selectedTicket.status}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">المسؤول عن التنفيذ</span>
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedTicket.owner || 'غير مسند'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">الموعد المستهدف (SLA)</span>
                  <p className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {formatArabicDate(selectedTicket.dueDate || calculateDueDate(selectedTicket.createdAt, selectedTicket.priority))}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedTicket.desc && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">تفاصيل البلاغ والمشكلة:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedTicket.desc}
                  </p>
                </div>
              )}

              {/* CSAT Rating Section if Resolved */}
              {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') && (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                    <span>تقييم جودة الخدمة (CSAT)</span>
                  </div>
                  {selectedTicket.csat && selectedTicket.csat > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${
                              s <= selectedTicket.csat
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-xs mr-2 text-emerald-700 dark:text-emerald-300">
                          ({selectedTicket.csat} / 5 نجوم)
                        </span>
                      </div>
                      {selectedTicket.clientNotes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{selectedTicket.clientNotes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        تم إنجاز طلبك بنجاح! نود معرفة رأيك في جودة الخدمة المقدمة:
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedRating(s)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              s <= selectedRating
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 scale-110'
                                : 'bg-white dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${s <= selectedRating ? 'fill-amber-400' : ''}`} />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="أضف تعليقاً أو ملاحظة على الخدمة (اختياري)..."
                          className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRateCsat(selectedTicket.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          إرسال التقييم 🌟
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline & Chat History */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>سجل المتابعة والتطورات</span>
                </h3>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                    selectedTicket.timeline.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 space-y-1 text-right">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {item.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatArabicDate(item.time)}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.details}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 block pt-1">
                          بواسطة: {item.actor}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد سجلات مسجلة بعد.</p>
                  )}
                </div>

                {/* Add Reply Form for Client */}
                {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                  <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={clientCommentInput}
                      onChange={(e) => setClientCommentInput(e.target.value)}
                      placeholder="أضف تعليقاً أو استفساراً لفريق الدعم الفني..."
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!clientCommentInput.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>إرسال</span>
                      <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
