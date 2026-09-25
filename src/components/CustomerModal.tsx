import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Plus, 
  ExternalLink,
  Save,
  Tag as TagIcon,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Issue, AppUser } from '../types';
import { formatSecondsToHMS } from '../utils/sla';
import { PriorityBadge, StatusBadge } from './Badges';
import { WhatsAppChatModal } from './WhatsAppChatModal';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string | null;
  issues: Issue[];
  currentUser?: AppUser;
  onOpenTicketDetails: (issue: Issue) => void;
  onOpenNewTicketForClient?: (clientName: string, clientPhone?: string, clientEmail?: string) => void;
  onUpdatePhone?: (issueId: string, phone: string) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  clientName,
  issues,
  currentUser,
  onOpenTicketDetails,
  onOpenNewTicketForClient,
  onUpdatePhone,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [clientNotes, setClientNotes] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Load client-specific saved notes
  useEffect(() => {
    if (clientName) {
      try {
        const saved = localStorage.getItem(`CLIENT_NOTES_${clientName.trim().toLowerCase()}`);
        setClientNotes(saved || '');
      } catch {
        setClientNotes('');
      }
    }
  }, [clientName]);

  if (!isOpen || !clientName) return null;

  // Filter issues for this specific client (case-insensitive)
  const clientIssues = issues.filter(
    (i) => i.client.trim().toLowerCase() === clientName.trim().toLowerCase()
  );

  // Find latest contact details from recent tickets
  const latestIssueWithPhone = clientIssues.find((i) => i.clientPhone);
  const latestIssueWithEmail = clientIssues.find((i) => i.clientEmail);
  const clientPhone = latestIssueWithPhone?.clientPhone || '';
  const clientEmail = latestIssueWithEmail?.clientEmail || '';
  const clientTag = clientIssues[0]?.tag || 'عميل معتمد';

  // Stats calculation
  const totalTickets = clientIssues.length;
  const activeTickets = clientIssues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed');
  const resolvedTickets = clientIssues.filter((i) => i.status === 'Resolved' || i.status === 'Closed');

  // CSAT Calculation
  const ratedIssues = clientIssues.filter((i) => i.csat && i.csat > 0);
  const avgCsat = ratedIssues.length > 0 
    ? (ratedIssues.reduce((acc, curr) => acc + curr.csat, 0) / ratedIssues.length).toFixed(1)
    : '5.0';

  // Total logged work time for this customer
  const totalWorkSeconds = clientIssues.reduce((acc, curr) => acc + (curr.workTime || 0), 0);

  // Filtered tickets list for display
  const displayedIssues = clientIssues.filter((i) => {
    if (filterStatus === 'active') return i.status !== 'Resolved' && i.status !== 'Closed';
    if (filterStatus === 'resolved') return i.status === 'Resolved' || i.status === 'Closed';
    return true;
  });

  const handleSaveNotes = () => {
    try {
      localStorage.setItem(`CLIENT_NOTES_${clientName.trim().toLowerCase()}`, clientNotes);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2500);
    } catch {
      // storage quota or disabled
    }
  };

  // Clean phone number for WhatsApp web
  const cleanPhoneForWhatsApp = clientPhone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Header Profile Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/60 flex flex-wrap justify-between items-start gap-4 overflow-hidden">
          {/* Subtle Ambient Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/30 shrink-0">
              {clientName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {clientName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  <span>{clientTag}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  بطاقة العميل الشاملة 360°
                </span>
              </div>

              {/* Contact info row */}
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-600 dark:text-slate-300">
                {clientPhone ? (
                  <div className="flex items-center gap-2 font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{clientPhone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                      title="مراسلة العميل مباشرة عبر واتساب"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
                      <span>مراسلة واتساب 💬</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">الهاتف: غير مسجل</span>
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      <span>إدخال رقم ومراسلة واتساب</span>
                    </button>
                  </div>
                )}

                {clientEmail ? (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <a
                      href={`mailto:${clientEmail}`}
                      className="hover:underline text-indigo-600 dark:text-indigo-400 font-bold"
                    >
                      {clientEmail}
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">البريد: غير مسجل</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNewTicketForClient && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNewTicketForClient(clientName, clientPhone, clientEmail);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>فتح تذكرة لهذا العميل</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                إجمالي التذاكر
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalTickets}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">بلاغ مسجل</span>
              </div>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                تذاكر قيد المعالجة
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {activeTickets.length}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">نشطة حالياً</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                التذاكر المغلقة بنجاح
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {resolvedTickets.length}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">تم حلها</span>
              </div>
            </div>

            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60">
              <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 block mb-1 flex items-center justify-between">
                <span>متوسط الرضا</span>
                <span className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {avgCsat}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">من 5 نجوم</span>
              </div>
            </div>
          </div>

          {/* Special Customer Notes & Logged Support Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Logged Support Hours */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    إجمالي ساعات الدعم للعميل
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  مجموع الأوقات الفعلية المستغرقة بواسطة فريق العمل في معالجة طلبات هذا العميل.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">الوقت المسجل:</span>
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatSecondsToHMS(totalWorkSeconds)}
                </span>
              </div>
            </div>

            {/* Customer Internal Notes Area */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    ملاحظات وتعليمات خاصة بالعميل (سجل سري للموظفين)
                  </h4>
                </div>
                {isSavedNotice && (
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم الحفظ!</span>
                  </span>
                )}
              </div>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="أدخل هنا أي تعليمات دائمة تخص هذا العميل (مثلاً: أوقات الاتصال المفضلة، مسؤول الشبكة البديل، اتفاقيات خاصة)..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
                >
                  <Save className="w-3 h-3" />
                  <span>حفظ الملاحظات</span>
                </button>
              </div>
            </div>
          </div>

          {/* Client Ticket History */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  سجل التذاكر والبلاغات السابقة ({clientIssues.length})
                </h3>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  الكل ({totalTickets})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === 'active'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  قيد العمل ({activeTickets.length})
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterStatus === 'resolved'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  المغلقة ({resolvedTickets.length})
                </button>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {displayedIssues.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد تذاكر تطابق هذا الفلتر
                </div>
              ) : (
                displayedIssues.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      onClose();
                      onOpenTicketDetails(ticket);
                    }}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/60 transition cursor-pointer flex flex-wrap items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                        {ticket.id}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {ticket.desc}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>القسم: {ticket.type}</span>
                          <span>•</span>
                          <span>المسؤول: {ticket.owner}</span>
                          {ticket.workTime > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatSecondsToHMS(ticket.workTime)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={ticket.priority} size="sm" />
                      <StatusBadge status={ticket.status} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* 1-Click WhatsApp Direct Chat Modal */}
      <WhatsAppChatModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        issue={clientIssues[0] || ({ id: 'CUST', client: clientName || '', clientPhone, type: 'خدمة عملاء' } as any)}
        currentUser={currentUser || ({ id: 'agent', name: 'خدمة العملاء', role: 'Agent' } as any)}
        onUpdatePhone={onUpdatePhone}
      />
    </div>
  );
};
