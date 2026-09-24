import React, { useState, useEffect } from 'react';
import { X, Paperclip, Clock, Check, PlusCircle, Sparkles, Send } from 'lucide-react';
import { Issue, CategoryRule, Priority, IssueStatus, AppUser } from '../types';
import { calculateDueDate, formatArabicDate } from '../utils/sla';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issueData: Partial<Issue>) => void;
  initialData?: Issue | null;
  categories: CategoryRule[];
  tags: string[];
  users: AppUser[];
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  tags,
  users,
}) => {
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
  }, [initialData, categories, tags, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !desc.trim()) {
      alert('يرجى كتابة اسم العميل ووصف المشكلة!');
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

  // Projected SLA deadline preview
  const currentCat = categories.find((c) => c.name === type);
  const slaHours = currentCat?.slaHours[priority] || 24;
  const projectedDue = calculateDueDate(new Date().toISOString(), priority, slaHours);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto transition-all">
        {/* Modern Executive Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/60 flex items-center justify-between overflow-hidden">
          {/* Subtle Ambient Decorative Lights */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-8 left-10 w-32 h-20 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Left / Title area in RTL */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              {isEditMode ? <Sparkles className="w-5 h-5 text-indigo-300" /> : <PlusCircle className="w-5 h-5 text-indigo-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  {isEditMode ? `تعديل بيانات التذكرة: ${initialData?.id}` : 'إضافة مشكلة أو بلاغ جديد'}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isEditMode ? 'تحديث فوري' : 'توجيه ذكي'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300/90 mt-0.5">
                التوجيه التلقائي لفريق الدعم وقواعد اتفاقية مستوى الخدمة SLA مفعلة
              </p>
            </div>
          </div>

          {/* Modern Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-150 border border-white/10 shadow-sm"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Client & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم العميل / الجهة الطالبة *</label>
              <input
                type="text"
                required
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="مثال: شركة الأمل الدولية للتقنية"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الوسم (Tag)</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Info (Email & Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني للعميل</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">رقم الهاتف للتواصل</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+966 5x xxx xxxx"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                نوع المشكلة / القسم (يقوم بالتوجيه الآلي للفريق والمسؤول)
              </label>
              {currentCat?.routingStrategy && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  {currentCat.routingStrategy === 'round_robin'
                    ? '⚡ توزيع دوري'
                    : currentCat.routingStrategy === 'least_busy'
                    ? '⚡ الأقل انشغالاً'
                    : '⚡ تكليف مباشر'}
                </span>
              )}
            </div>
            <select
              value={type}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">وصف وتفاصيل المشكلة *</label>
            <textarea
              rows={3}
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="اكتب تفاصيل البلاغ أو المشكلة التقنية وأثرها على العمل..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            ></textarea>

            {/* Smart Keyword Suggestion Prompt */}
            {(() => {
              if (!desc.trim()) return null;
              const matchingCat = categories.find(
                (c) =>
                  c.name !== type &&
                  c.active !== false &&
                  c.keywords &&
                  c.keywords.some((k) => desc.toLowerCase().includes(k.toLowerCase()))
              );
              if (!matchingCat) return null;
              const matchedWord = matchingCat.keywords?.find((k) =>
                desc.toLowerCase().includes(k.toLowerCase())
              );
              return (
                <div className="mt-1.5 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-2 text-[11px] animate-fadeIn">
                  <span className="text-indigo-900 dark:text-indigo-200">
                    💡 تم رصد كلمة <strong className="text-indigo-600 dark:text-indigo-400">"{matchedWord}"</strong> — هل ترغب في توجيه التذكرة لقسم <strong>"{matchingCat.name}"</strong> تلقائياً؟
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(matchingCat.name)}
                    className="shrink-0 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition shadow-xs"
                  >
                    نعم، وجّه للقسم 🚀
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Attachment */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
              <span>مرفق أو لقطة شاشة للمشكلة (اختياري - حد أقصى 2MB)</span>
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-600 dark:text-slate-400 file:ml-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
            {attachment && (
              <div className="mt-1.5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>تم إرفاق: {attachment.name} ({attachment.size})</span>
              </div>
            )}
          </div>

          {/* Auto-routed Team and Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">الفريق المستلم (توجيه تلقائي)</label>
              <input
                type="text"
                value={assigned}
                onChange={(e) => setAssigned(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">المسؤول المباشر الحالي</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الأولوية (Priority)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Critical">🔴 Critical (حرج - زمن استجابة سريع)</option>
                <option value="High">🟠 High (عالي)</option>
                <option value="Medium">🟡 Medium (متوسط)</option>
                <option value="Low">🟢 Low (منخفض)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الحالة (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Open">🔴 مفتوحة (Open)</option>
                <option value="In Progress">🔵 قيد العمل (In Progress)</option>
                <option value="Pending">🟠 معلقة (Pending)</option>
                <option value="Resolved">🟢 تم الحل (Resolved)</option>
                <option value="Closed">⚪ مغلقة (Closed)</option>
              </select>
            </div>
          </div>

          {/* SLA Calculation Preview */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <Clock className="w-4 h-4" />
              <span>اتفاقية مستوى الخدمة المتوقعة:</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 dark:text-white block">حد المهلة: {slaHours} ساعة</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                الموعد الأقصى: {formatArabicDate(projectedDue)}
              </span>
            </div>
          </div>

          {/* Auto Timer Notice */}
          {!initialData && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
              <span>⏱️ سيبدأ عداد وقت العمل (Stopwatch) تلقائياً فور حفظ التذكرة وفتحها مباشرة.</span>
            </div>
          )}

          {/* Submit & Cancel */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30"
            >
              {isEditMode ? 'حفظ التعديلات' : 'تسجيل التذكرة وبدء العداد فوراً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
