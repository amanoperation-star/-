import React, { useState, useEffect } from 'react';
import {
  X,
  Paperclip,
  Clock,
  Check,
  PlusCircle,
  Sparkles,
  Send,
  User,
  Phone,
  Mail,
  Tag,
  AlertTriangle,
  Flame,
  Zap,
  Layers,
  LayoutGrid,
  Columns3,
  ListOrdered,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  UploadCloud,
  Trash2,
  Building,
  ShieldAlert,
  ArrowDown,
  Info,
} from 'lucide-react';
import { Issue, CategoryRule, Priority, IssueStatus, AppUser } from '../types';
import { calculateDueDate, formatArabicDate } from '../utils/sla';
import { collisionManager, useTicketCollision } from '../utils/collisionDetector';
import { CollisionAlertBanner } from './CollisionAlertBanner';

export type ModalDesignType = 'cards' | 'executive' | 'wizard' | 'compact';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issueData: Partial<Issue>) => void;
  initialData?: Issue | null;
  categories: CategoryRule[];
  tags: string[];
  users: AppUser[];
  currentUser?: AppUser;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  tags,
  users,
  currentUser,
}) => {
  // Design Layout Selection (Saved in LocalStorage)
  const [modalDesign, setModalDesign] = useState<ModalDesignType>(() => {
    try {
      const saved = localStorage.getItem('TICKET_MODAL_DESIGN');
      if (saved === 'cards' || saved === 'executive' || saved === 'wizard' || saved === 'compact') {
        return saved;
      }
    } catch {}
    return 'cards'; // Default to Cards layout as requested!
  });

  // Step state for Wizard mode
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [client, setClient] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [tag, setTag] = useState(tags[0] || 'VIP Client');
  const [type, setType] = useState(categories[0]?.name || 'تقني / Technical');
  const [desc, setDesc] = useState('');
  const [assigned, setAssigned] = useState(categories[0]?.assignedTeam || 'فريق الدعم البرمجي');
  const [owner, setOwner] = useState(categories[0]?.defaultOwner || 'محمد علي');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<IssueStatus>('Open');
  const [attachment, setAttachment] = useState<{ name: string; url: string; size?: string } | undefined>(undefined);

  const isEditMode = Boolean(initialData && initialData.id);

  // Collision detection hook for edit mode
  const { otherViewers, hasCollision } = useTicketCollision(
    initialData?.id,
    currentUser || ({ id: 'guest', name: 'مستخدم', role: 'Agent' } as any)
  );

  // Notify team presence when editing an existing ticket
  useEffect(() => {
    if (isOpen && initialData?.id && currentUser) {
      collisionManager.notifyFocus(initialData.id, 'editing', currentUser);
      return () => {
        collisionManager.notifyBlur(initialData.id, currentUser);
      };
    }
  }, [isOpen, initialData?.id, currentUser]);

  // Synchronize on modal open or data change
  useEffect(() => {
    if (initialData) {
      setClient(initialData.client || '');
      setClientEmail(initialData.clientEmail || '');
      setClientPhone(initialData.clientPhone || '');
      setTag(initialData.tag || tags[0] || 'VIP Client');
      setType(initialData.type || categories[0]?.name || 'تقني / Technical');
      setDesc(initialData.desc || '');
      setAssigned(initialData.assigned || categories[0]?.assignedTeam || 'فريق الدعم البرمجي');
      setOwner(initialData.owner || categories[0]?.defaultOwner || 'محمد علي');
      setPriority(initialData.priority || 'Medium');
      setStatus(initialData.status || 'Open');
      setAttachment(initialData.attachment);
    } else {
      setClient('');
      setClientEmail('');
      setClientPhone('');
      setTag(tags[0] || 'VIP Client');
      const firstCat = categories[0];
      setType(firstCat?.name || 'تقني / Technical');
      setAssigned(firstCat?.assignedTeam || 'فريق الدعم البرمجي');
      setOwner(firstCat?.defaultOwner || 'محمد علي');
      setDesc('');
      setPriority('Medium');
      setStatus('Open');
      setAttachment(undefined);
    }
    setWizardStep(1);
  }, [initialData, categories, tags, isOpen]);

  // Handle design change and persist
  const handleSelectDesign = (design: ModalDesignType) => {
    setModalDesign(design);
    try {
      localStorage.setItem('TICKET_MODAL_DESIGN', design);
    } catch {}
  };

  if (!isOpen) return null;

  // Auto-route on category change
  const handleCategoryChange = (catName: string) => {
    setType(catName);
    const selectedCat = categories.find((c) => c.name === catName);
    if (selectedCat) {
      setAssigned(selectedCat.assignedTeam);
      setOwner(selectedCat.defaultOwner);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الملف المرفق يتجاوز الحد المسموح به (2 ميجابايت)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        name: file.name,
        url: event.target?.result as string,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!client.trim() || !desc.trim()) {
      alert('يرجى كتابة اسم العميل وتفاصيل وصف المشكلة قبل الحفظ!');
      return;
    }

    onSave({
      client,
      clientEmail,
      clientPhone,
      tag,
      type,
      desc,
      assigned,
      owner,
      priority,
      status,
      attachment,
    });

    onClose();
  };

  // Keyboard shortcut Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  // Projected SLA deadline preview
  const currentCat = categories.find((c) => c.name === type);
  const slaHours = currentCat?.slaHours?.[priority] || (priority === 'Critical' ? 4 : priority === 'High' ? 12 : priority === 'Medium' ? 24 : 48);
  const projectedDue = calculateDueDate(new Date().toISOString(), priority, slaHours);

  // Smart Keyword Recommendation
  const detectedCategory = (() => {
    if (!desc.trim()) return null;
    return categories.find(
      (c) =>
        c.name !== type &&
        c.active !== false &&
        c.keywords &&
        c.keywords.some((k) => desc.toLowerCase().includes(k.toLowerCase()))
    );
  })();

  const detectedKeyword = detectedCategory?.keywords?.find((k) =>
    desc.toLowerCase().includes(k.toLowerCase())
  );

  // Available Priorities configuration
  const priorityOptions: {
    key: Priority;
    label: string;
    sublabel: string;
    color: string;
    activeBorder: string;
    activeBg: string;
    icon: typeof Flame;
  }[] = [
    {
      key: 'Critical',
      label: 'حرج جداً (Critical)',
      sublabel: 'استجابة فورية وحل عاجل',
      color: 'text-rose-600 dark:text-rose-400',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      activeBg: 'bg-rose-50/80 dark:bg-rose-950/40',
      icon: Flame,
    },
    {
      key: 'High',
      label: 'أولوية عالية (High)',
      sublabel: 'عطل مؤثر على سير العمل',
      color: 'text-amber-600 dark:text-amber-400',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      activeBg: 'bg-amber-50/80 dark:bg-amber-950/40',
      icon: AlertTriangle,
    },
    {
      key: 'Medium',
      label: 'متوسطة (Medium)',
      sublabel: 'المسار التشغيلي المعتاد',
      color: 'text-blue-600 dark:text-blue-400',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
      activeBg: 'bg-blue-50/80 dark:bg-blue-950/40',
      icon: Clock,
    },
    {
      key: 'Low',
      label: 'منخفضة (Low)',
      sublabel: 'استفسار أو طلب تحسين',
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      icon: ArrowDown,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden my-auto transition-all duration-200 flex flex-col max-h-[92vh] ${
          modalDesign === 'executive'
            ? 'max-w-5xl'
            : modalDesign === 'wizard'
            ? 'max-w-2xl'
            : modalDesign === 'compact'
            ? 'max-w-xl'
            : 'max-w-3xl' // cards layout width
        }`}
      >
        {/* ======================================================== */}
        {/* Top Header with Visual Design Selector & Close Button */}
        {/* ======================================================== */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 shrink-0">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-6 left-12 w-32 h-16 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
                {isEditMode ? <Sparkles className="w-5 h-5 text-indigo-300" /> : <PlusCircle className="w-5 h-5 text-indigo-300" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-tight">
                    {isEditMode ? `تعديل بيانات التذكرة: ${initialData?.id}` : 'فتح تذكرة وبلاغ جديد'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>توجيه ذكي</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/80 mt-0.5">
                  حدد بيانات العميل والتصنيف وسيقوم النظام باحتساب المهلة وتعيين الفريق
                </p>
              </div>
            </div>

            {/* Design Selector Switcher Toolbar */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/70 shadow-inner">
                <span className="text-[10px] text-slate-400 px-2 font-medium hidden sm:inline">الديزاين:</span>
                
                {/* 1. Cards Layout (User's Primary Request) */}
                <button
                  type="button"
                  onClick={() => handleSelectDesign('cards')}
                  title="تصميم البطاقات التفاعلية (Modern Cards)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    modalDesign === 'cards'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>بطاقات</span>
                </button>

                {/* 2. Executive Split */}
                <button
                  type="button"
                  onClick={() => handleSelectDesign('executive')}
                  title="تصميم الاستوديو التنفيذي (Executive Studio)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    modalDesign === 'executive'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span>تنفيذي</span>
                </button>

                {/* 3. Wizard Step-by-Step */}
                <button
                  type="button"
                  onClick={() => handleSelectDesign('wizard')}
                  title="معالج الخطوات المرحلي (Step Wizard)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    modalDesign === 'wizard'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>خطوات</span>
                </button>

                {/* 4. Compact Fast Deck */}
                <button
                  type="button"
                  onClick={() => handleSelectDesign('compact')}
                  title="التصميم السريع المدمج (Compact Rapid)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    modalDesign === 'compact'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>سريع</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition border border-white/10 shrink-0"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Main Body - Conditionally Rendered by Selected Design */}
        {/* ======================================================== */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 custom-scrollbar text-xs">
          
          {/* Ticket Collision Detection Alert Banner */}
          {hasCollision && (
            <div className="mb-4">
              <CollisionAlertBanner viewers={otherViewers} />
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* DESIGN 1: CARDS LAYOUT (بطاقات منظمة وعصرية)         */}
          {/* ---------------------------------------------------- */}
          {modalDesign === 'cards' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CARD 1: بيانات العميل والجهة */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400/40 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">بطاقة العميل والجهة الطالبة</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">معلومات الاتصال والوسم المخصص للعميل</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    بطاقة #1
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        اسم العميل أو المؤسسة الطالبة <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={client}
                          onChange={(e) => setClient(e.target.value)}
                          placeholder="مثال: شركة النخبة الدولية للتقنية"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الوسم والتصنيف (Tag)
                      </label>
                      <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      >
                        {tags.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>البريد الإلكتروني للعميل</span>
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@domain.com"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>رقم هاتف الاتصال</span>
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+966 5x xxx xxxx"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: تفاصيل المشكلة والبلاغ */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400/40 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">بطاقة بلاغ المشكلة والتفاصيل</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">وصف دقيق للأثر والخطوات المرافقة</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    بطاقة #2
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      تفاصيل ووصف البلاغ <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {desc.length} حرف
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="اشرح المشكلة التقنية، الخطأ الظاهر، وأثرها على العمل بدقة..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                  />

                  {/* Smart Keyword Suggestion Banner */}
                  {detectedCategory && (
                    <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-2 text-[11px] animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-indigo-950 dark:text-indigo-200">
                          تم رصد الكلمة المفتاحية <strong className="text-indigo-600 dark:text-indigo-400">"{detectedKeyword}"</strong> — هل تود تحويل التذكرة آلياً إلى قسم <strong>"{detectedCategory.name}"</strong>؟
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange(detectedCategory.name)}
                        className="shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition shadow-xs"
                      >
                        تحويل للقسم الآن 🚀
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: تصنيف المشكلة والتوجيه الآلي */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400/40 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">بطاقة التصنيف والتوجيه الذكي</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">تعيين القسم المعني والمسؤول المباشر تلقائياً</p>
                    </div>
                  </div>
                  {currentCat?.routingStrategy && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {currentCat.routingStrategy === 'round_robin'
                        ? '⚡ توزيع دوري'
                        : currentCat.routingStrategy === 'least_busy'
                        ? '⚡ الأقل انشغالاً'
                        : '⚡ تكليف مباشر'}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      القسم والتصنيف الرئيسي
                    </label>
                    <select
                      value={type}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      {categories
                        .filter((c) => c.active !== false || c.name === type)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} — [{c.assignedTeam} • {c.defaultOwner}]
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        الفريق المستلم للبلاغ
                      </label>
                      <input
                        type="text"
                        value={assigned}
                        onChange={(e) => setAssigned(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        الفني / المسؤول المعين
                      </label>
                      <select
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: بطاقات الأولوية التفاعلية ومستوى الخدمة SLA */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400/40 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">بطاقة الأولوية ومستوى الخدمة SLA</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">انقر على بطاقة الأولوية لتحديد درجة الأهمية فوراً</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    مهلة: {slaHours} ساعة
                  </span>
                </div>

                {/* Priority Selection Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {priorityOptions.map((opt) => {
                    const isSelected = priority === opt.key;
                    const IconComponent = opt.icon;
                    const optSla = currentCat?.slaHours?.[opt.key] || (opt.key === 'Critical' ? 4 : opt.key === 'High' ? 12 : opt.key === 'Medium' ? 24 : 48);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPriority(opt.key)}
                        className={`text-right p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? `${opt.activeBorder} ${opt.activeBg} shadow-sm`
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <IconComponent className={`w-4 h-4 ${opt.color}`} />
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-bold text-[11px] ${isSelected ? opt.color : 'text-slate-800 dark:text-slate-200'}`}>
                            {opt.label.split(' ')[0]}
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                            المهلة: {optSla} ساعة
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SLA Live Preview Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Clock className="w-4 h-4 animate-spin-slow" />
                    <span>المهلة المحددة لحل البلاغ:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      الموعد الأقصى: {formatArabicDate(projectedDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 5: المرفقات وحالة البداية */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400/40 transition">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">بطاقة المرفقات والحالة</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">إرفاق لقطات الشاشة أو المستندات وحالة فتح البلاغ</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    بطاقة #5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      المرفقات (صور، PDF - حد أقصى 2MB)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-600 dark:text-slate-400 file:ml-2 file:py-0.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 text-xs"
                    />
                    {attachment && (
                      <div className="mt-1.5 flex items-center justify-between p-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 truncate">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{attachment.name} ({attachment.size})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachment(undefined)}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                          title="حذف المرفق"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      حالة التذكرة المبدئية
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as IssueStatus)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      <option value="Open">🔴 مفتوحة (Open) - بدء العمل</option>
                      <option value="In Progress">🔵 قيد المعالجة (In Progress)</option>
                      <option value="Pending">🟠 معلقة بانتظار العميل (Pending)</option>
                      <option value="Resolved">🟢 تم الحل (Resolved)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons Bar */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>يبدأ عداد الإنجاز تلقائياً فور الحفظ</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'حفظ التعديلات' : 'تسجيل التذكرة والبدء'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------- */}
          {/* DESIGN 2: EXECUTIVE PRO (استوديو تنفيذي مقسم)         */}
          {/* ---------------------------------------------------- */}
          {modalDesign === 'executive' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Primary Incident Data (7 cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>بيانات العميل والجهة الطالبة</span>
                    </h4>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم العميل / المؤسسة *
                        </label>
                        <input
                          type="text"
                          required
                          value={client}
                          onChange={(e) => setClient(e.target.value)}
                          placeholder="مثال: البنك العربي المتحد"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                            البريد الإلكتروني
                          </label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="mail@client.com"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                            الهاتف للتواصل
                          </label>
                          <input
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="+966 5..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>تفاصيل البلاغ والملاحظات *</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{desc.length} حرف</span>
                    </div>

                    <textarea
                      rows={4}
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="اكتب التقرير الكامل عن البلاغ وأعراض العطل التقني وخطوات إعادة إنتاجه..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
                    />

                    {detectedCategory && (
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-[11px]">
                        <span>
                          💡 مقترح التوجيه لـ <strong>{detectedCategory.name}</strong> بناءً على كلمة <i>"{detectedKeyword}"</i>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(detectedCategory.name)}
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                        >
                          تطبيق
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <UploadCloud className="w-6 h-6 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                        className="w-full text-xs text-slate-500 file:ml-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white"
                      />
                      {attachment && (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                          ✓ تم إرفاق: {attachment.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Routing & Governance (5 cols) */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-500" />
                      <span>الحوكمة والتوجيه الآلي</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        القسم والتصنيف
                      </label>
                      <select
                        value={type}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-semibold text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">الفريق</label>
                        <input
                          type="text"
                          value={assigned}
                          onChange={(e) => setAssigned(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">المسؤول</label>
                        <select
                          value={owner}
                          onChange={(e) => setOwner(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-[11px]"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الوسم (Tag)
                      </label>
                      <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white text-xs"
                      >
                        {tags.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Priority & SLA Pro Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span>الأولوية واتفاقية SLA</span>
                      </span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-md">
                        {slaHours} ساعة مهلة
                      </span>
                    </h4>

                    <div className="grid grid-cols-2 gap-1.5">
                      {priorityOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setPriority(opt.key)}
                          className={`px-2.5 py-1.5 rounded-xl border text-right transition flex items-center justify-between ${
                            priority === opt.key
                              ? `${opt.activeBorder} ${opt.activeBg} font-bold`
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[11px]">{opt.label.split(' ')[0]}</span>
                          <span className={`text-[10px] ${opt.color}`}>●</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-2 bg-indigo-900/10 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-[10px] flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">تاريخ الإغلاق المستهدف:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{formatArabicDate(projectedDue)}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">حالة البداية</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as IssueStatus)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-xs font-bold"
                      >
                        <option value="Open">مفتوحة (Open)</option>
                        <option value="In Progress">قيد المعالجة (In Progress)</option>
                        <option value="Pending">معلقة (Pending)</option>
                        <option value="Resolved">تم الحل (Resolved)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">اختصار الحفظ السريع: Ctrl + Enter</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30"
                  >
                    {isEditMode ? 'حفظ التغييرات' : 'تأكيد وحفظ التذكرة'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ---------------------------------------------------- */}
          {/* DESIGN 3: STEP-BY-STEP WIZARD (معالج الخطوات)        */}
          {/* ---------------------------------------------------- */}
          {modalDesign === 'wizard' && (
            <div className="space-y-4">
              {/* Stepper Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                {[
                  { step: 1, title: 'العميل والاتصال', icon: User },
                  { step: 2, title: 'وصف وتصنيف البلاغ', icon: FileText },
                  { step: 3, title: 'الأولوية والمراجعة', icon: CheckCircle2 },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = wizardStep === s.step;
                  const isDone = wizardStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setWizardStep(s.step as 1 | 2 | 3)}
                      className={`flex items-center gap-2 transition ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : isDone
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isDone ? '✓' : s.step}
                      </div>
                      <span className="hidden sm:inline text-xs">{s.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Step 1: Client & Contact */}
              {wizardStep === 1 && (
                <div className="space-y-3.5 py-2 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم العميل أو المؤسسة الطالبة *
                    </label>
                    <input
                      type="text"
                      required
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="اكتب اسم العميل أو الشركة..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        البريد الإلكتروني للعميل
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        رقم هاتف الاتصال
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+966 5x xxx xxxx"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الوسم المخصص (Tag)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTag(t)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                            tag === t
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Category & Description */}
              {wizardStep === 2 && (
                <div className="space-y-3.5 py-2 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نوع المشكلة والقسم المعني
                    </label>
                    <select
                      value={type}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} — [{c.assignedTeam}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تفاصيل ووصف البلاغ *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="اشرح المشكلة التقنية وأعراضها..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
                    />

                    {detectedCategory && (
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-[11px]">
                        <span>💡 تحويل مقترح إلى <strong>{detectedCategory.name}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(detectedCategory.name)}
                          className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                        >
                          تطبيق التوجيه
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      مرفق اختياري (صورة أو وثيقة)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs file:ml-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-indigo-600 file:text-white"
                    />
                    {attachment && (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                        ✓ تم اختيار المرفق: {attachment.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Priority, Assignee & Review */}
              {wizardStep === 3 && (
                <div className="space-y-3.5 py-2 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      حدد الأولوية ومستوى الخدمة SLA
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {priorityOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setPriority(opt.key)}
                          className={`p-2.5 rounded-xl border text-right transition ${
                            priority === opt.key
                              ? `${opt.activeBorder} ${opt.activeBg} font-bold`
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className={`text-xs ${opt.color}`}>{opt.label.split(' ')[0]}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">حد المهلة: {currentCat?.slaHours?.[opt.key] || 24} س</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        الفريق والفني المعين
                      </label>
                      <select
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs font-semibold"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        حالة البداية
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as IssueStatus)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs font-semibold"
                      >
                        <option value="Open">مفتوحة (Open)</option>
                        <option value="In Progress">قيد المعالجة (In Progress)</option>
                        <option value="Pending">معلقة (Pending)</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Card before confirmation */}
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3 text-[11px] space-y-1">
                    <div className="font-bold text-indigo-900 dark:text-indigo-200">
                      ملخص التذكرة قبل الحفظ:
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      العميل: <strong className="text-slate-900 dark:text-white">{client || 'لم يحدد'}</strong> • التصنيف: <strong>{type}</strong>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      المهلة القصوى: <strong>{formatArabicDate(projectedDue)}</strong> ({slaHours} ساعة)
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-1.5 text-xs transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>السابق</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </button>

                  {wizardStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 1 && !client.trim()) {
                          alert('يرجى إدخال اسم العميل قبل المتابعة!');
                          return;
                        }
                        if (wizardStep === 2 && !desc.trim()) {
                          alert('يرجى إدخال تفاصيل المشكلة قبل المتابعة!');
                          return;
                        }
                        setWizardStep((s) => (s + 1) as 1 | 2 | 3);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition shadow-md shadow-indigo-600/30"
                    >
                      <span>التالي</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition shadow-md shadow-emerald-600/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تأكيد وتسجيل التذكرة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* DESIGN 4: COMPACT RAPID DECK (سريع ومكثف)            */}
          {/* ---------------------------------------------------- */}
          {modalDesign === 'compact' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    العميل *
                  </label>
                  <input
                    type="text"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    الوسم
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white text-xs"
                  >
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  التصنيف والقسم
                </label>
                <select
                  value={type}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.assignedTeam})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  تفاصيل المشكلة *
                </label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="اكتب وصف العطل..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    الأولوية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white font-bold text-xs"
                  >
                    <option value="Critical">🔴 Critical (حرج)</option>
                    <option value="High">🟠 High (عالي)</option>
                    <option value="Medium">🟡 Medium (متوسط)</option>
                    <option value="Low">🟢 Low (منخفض)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    المسؤول
                  </label>
                  <select
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[10px] flex items-center justify-between">
                <span>حد المهلة: <strong>{slaHours} ساعة</strong></span>
                <span className="font-mono text-slate-500">{formatArabicDate(projectedDue)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-sm"
                >
                  حفظ سريع
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
