import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Database, 
  BellOff, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  X, 
  Sparkles,
  Rocket
} from 'lucide-react';

interface ProductionResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  stepText: string;
}

export const ProductionResetModal: React.FC<ProductionResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  stepText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-l from-rose-600 via-rose-700 to-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg">
                <Rocket className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
                  إعدادات المصنع والإنتاج • Production Mode
                </span>
                <h3 className="text-lg font-black text-white">
                  تهيئة المنظومة للإنتاج الفعلي
                </h3>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {!isLoading ? (
            <>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-200 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-0.5">تحذير مهم قبل المتابعة</span>
                  سيقوم هذا الإجراء بمسح كافة تذاكر وتجارب الاختبار نهائياً من المنظومة ومن قاعدة بيانات السحابة (Supabase Table Editor)، لتبدأ المنظومة نظيفة وجاهزة للعمل الفعلي.
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>الإجراءات التي سيتم تنفيذها فوراً:</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">مسح كافة تذاكر الاختبار (0 تذاكر)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">تفريغ المنظومة بالكامل وتصفير ترقيم التذاكر لتبدأ من INC-1001.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">تفريغ جدول Supabase Table Editor</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">مسح السجلات السحابية بالكامل حتى لا تعود عند المزامنة أو الريفرش.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <BellOff className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">تصفير التنبيهات وسجلات التدقيق</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">إعادة زر التنبيهات للحالة الأولية (لا توجد إشعارات حالياً).</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">الحفاظ على الحسابات الإدارية والتصنيفات</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">تظل حسابات المشرفين والفريق وتصنيفات الخدمة جاهزة للعمل فوراً.</span>
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
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">جاري تهيئة المنظومة للإنتاج الفعلي...</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold animate-pulse">
                  {stepText || 'جاري مسح البيانات السحابية والمحلية وتطبيق وضع الإنتاج...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        {!isLoading && (
          <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition text-xs cursor-pointer"
            >
              إلغاء التراجع
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center gap-2 text-xs cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>تأكيد التحويل إلى الإنتاج ومسح الاختبارات 🚀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
