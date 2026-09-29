import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Database, 
  BellOff, 
  ShieldCheck, 
  Users,
  FolderKanban,
  CheckSquare,
  Square,
  Loader2, 
  X, 
  Sparkles,
  Rocket,
  RotateCcw,
  Tag,
  Palette
} from 'lucide-react';

export interface ResetOptions {
  clearTickets: boolean;
  clearAuditLogs: boolean;
  clearUsers: boolean;
  clearCategories: boolean;
  clearNotifications: boolean;
  clearTagsAndCanned: boolean;
  resetGeneralSettings: boolean;
}

interface ProductionResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ResetOptions) => Promise<void>;
  isLoading: boolean;
  stepText: string;
  counts?: {
    issuesCount: number;
    auditLogsCount: number;
    usersCount: number;
    categoriesCount: number;
    notificationsCount: number;
  };
}

export const ProductionResetModal: React.FC<ProductionResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  stepText,
  counts = {
    issuesCount: 0,
    auditLogsCount: 0,
    usersCount: 0,
    categoriesCount: 0,
    notificationsCount: 0,
  },
}) => {
  const [options, setOptions] = useState<ResetOptions>({
    clearTickets: true,
    clearAuditLogs: true,
    clearUsers: false,
    clearCategories: false,
    clearNotifications: true,
    clearTagsAndCanned: false,
    resetGeneralSettings: false,
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof ResetOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset: 'production' | 'full' | 'tickets_only') => {
    if (preset === 'production') {
      setOptions({
        clearTickets: true,
        clearAuditLogs: true,
        clearUsers: false,
        clearCategories: false,
        clearNotifications: true,
        clearTagsAndCanned: false,
        resetGeneralSettings: false,
      });
    } else if (preset === 'full') {
      setOptions({
        clearTickets: true,
        clearAuditLogs: true,
        clearUsers: true,
        clearCategories: true,
        clearNotifications: true,
        clearTagsAndCanned: true,
        resetGeneralSettings: true,
      });
    } else if (preset === 'tickets_only') {
      setOptions({
        clearTickets: true,
        clearAuditLogs: false,
        clearUsers: false,
        clearCategories: false,
        clearNotifications: true,
        clearTagsAndCanned: false,
        resetGeneralSettings: false,
      });
    }
  };

  const selectedCount = Object.values(options).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-right max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-l from-rose-600 via-rose-700 to-slate-900 p-5 sm:p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
                <Rocket className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
                  خيارات التهيئة المخصصة • Custom Reset Options
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  تهيئـة ومسـح بيانات المنظومة
                </h3>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {!isLoading ? (
            <>
              {/* Alert Note */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-200 flex items-start gap-2.5 leading-relaxed text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">حدد العناصر المراد مسحها وتصفيرها بحرية:</span>
                  حدد بوضع علامة الصح <span className="font-bold text-rose-600 dark:text-rose-400">✓</span> على البيانات التي تريد مسحها وتفريغها، واترك غير المحدد للحفاظ عليه.
                </div>
              </div>

              {/* Quick Presets Selection */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
                  أنماط التصفير السريعة:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('production')}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-[10.5px] transition text-center"
                  >
                    🚀 تهيئة للإنتاج
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('full')}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 font-bold text-[10.5px] transition text-center"
                  >
                    💥 مسح شامل المصنع
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('tickets_only')}
                    className="p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-[10.5px] transition text-center"
                  >
                    🧹 مسح التذاكر فقط
                  </button>
                </div>
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>قائمة البيانات القابلة للتحديد والمسح:</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    محدد ({selectedCount} من 7)
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Option 1: Tickets */}
                  <div
                    onClick={() => handleToggle('clearTickets')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearTickets
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearTickets ? (
                        <CheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>تذاكر البلاغات والأنشطة (Tickets & CAB Activities)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                          {counts.issuesCount} تذكرة
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        تفريغ سجل التذاكر بالكامل من الذاكرة والسحابة وتصفير ترقيم التذاكر ليبدأ من INC-1001.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Audit Logs */}
                  <div
                    onClick={() => handleToggle('clearAuditLogs')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearAuditLogs
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearAuditLogs ? (
                        <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-amber-500" />
                          <span>سجلات التدقيق وأرشيف الأحداث (Audit Logs & Action Trail)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          {counts.auditLogsCount} سجل
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        مسح كافة سجلات الأنشطة والتدقيق السابقة وتوثيق عملية التهيئة الجديدة.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Users */}
                  <div
                    onClick={() => handleToggle('clearUsers')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearUsers
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearUsers ? (
                        <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          <span>المستخدمين وحسابات الفريق (Users & Staff Accounts)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                          {counts.usersCount} مستخدم
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        إعادة ضبط الحسابات وإبقاء حساب المشرف الرئيس لتبدأ المنظومة بحسابات إنتاجية ناصعة.
                      </p>
                    </div>
                  </div>

                  {/* Option 4: Categories */}
                  <div
                    onClick={() => handleToggle('clearCategories')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearCategories
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearCategories ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                          <span>الأقسام وفئات الخدمة وقواعد الـ SLA (Departments & Rules)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                          {counts.categoriesCount} قسم
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        إعادة ضبط هيكلية الأقسام وقواعد التوجيه الفني والمهل الزمنية للحالة الافتراضية.
                      </p>
                    </div>
                  </div>

                  {/* Option 5: Notifications */}
                  <div
                    onClick={() => handleToggle('clearNotifications')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearNotifications
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearNotifications ? (
                        <CheckSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <BellOff className="w-3.5 h-3.5 text-sky-500" />
                          <span>شريط الإشعارات والتنبيهات (Notifications)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                          {counts.notificationsCount} إشعار
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        مسح كافة التنبيهات وإشعار التأخير والتصعيد السابقة بالكامل.
                      </p>
                    </div>
                  </div>

                  {/* Option 6: Tags & Canned */}
                  <div
                    onClick={() => handleToggle('clearTagsAndCanned')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.clearTagsAndCanned
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.clearTagsAndCanned ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-500" />
                          <span>الوسوم والردود الجاهزة المخصصة (Tags & Canned Responses)</span>
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        مسح نماذج الردود الجاهزة والوسوم المخصصة التي أضيفت يدوياً.
                      </p>
                    </div>
                  </div>

                  {/* Option 7: General Settings */}
                  <div
                    onClick={() => handleToggle('resetGeneralSettings')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      options.resetGeneralSettings
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {options.resetGeneralSettings ? (
                        <CheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-rose-500" />
                          <span>إعدادات المظهر والشعار والاسم العام (General Settings)</span>
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        استعادة ألوان الشعار والتصميم واسم المنظومة الافتراضي.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
                <Rocket className="w-6 h-6 text-rose-600 dark:text-rose-400 absolute" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">جاري تنفيذ خيارات التهيئة المحددة...</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold animate-pulse">
                  {stepText || 'جاري مسح البيانات السحابية والمحلية وتطبيق وضع التهيئة...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        {!isLoading && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition text-xs cursor-pointer"
            >
              إلغاء التراجع
            </button>

            <button
              type="button"
              onClick={() => onConfirm(options)}
              disabled={selectedCount === 0}
              className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition active:scale-95 flex items-center gap-2 text-xs cursor-pointer ${
                selectedCount > 0
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>تأكيد التهيئة لمسح العناصر المحددة ({selectedCount}) 🚀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
