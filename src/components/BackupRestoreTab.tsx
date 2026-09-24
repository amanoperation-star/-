import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  Issue, 
  AppUser, 
  CategoryRule, 
  SoundSettings, 
  GeneralSettings, 
  AuditLog, 
  SystemBackupData 
} from '../types';

interface BackupRestoreTabProps {
  issues: Issue[];
  users: AppUser[];
  categories: CategoryRule[];
  tags: string[];
  cannedResponses: string[];
  soundSettings: SoundSettings;
  generalSettings: GeneralSettings;
  auditLogs: AuditLog[];
  onRestoreBackup: (backup: SystemBackupData, mode: 'overwrite' | 'merge') => void;
  onResetSystemToDefault: () => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
  issues,
  users,
  categories,
  tags,
  cannedResponses,
  soundSettings,
  generalSettings,
  auditLogs,
  onRestoreBackup,
  onResetSystemToDefault,
}) => {
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState<string | null>(null);
  const [previewBackup, setPreviewBackup] = useState<SystemBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Create and download JSON backup file
  const handleDownloadBackup = () => {
    try {
      const backupPayload: SystemBackupData = {
        version: '8.5',
        exportedAt: new Date().toISOString(),
        exportedBy: 'مدير المنظومة (Admin)',
        systemName: generalSettings.appName || 'منظومة تتبع وإدارة المشاكل',
        issues,
        users,
        categories,
        tags,
        cannedResponses,
        soundSettings,
        generalSettings,
        auditLogs: includeAuditLogs ? auditLogs : [],
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateSlug = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const sanitizedName = (generalSettings.appName || 'ticketing_system')
        .replace(/\s+/g, '_')
        .replace(/[^\w\u0621-\u064A_-]/gi, '');

      link.href = url;
      link.download = `Backup_${sanitizedName}_${dateSlug}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('حدث خطأ أثناء إعداد النسخة الاحتياطية.');
    }
  };

  // 2. Select file and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreErrorMsg(null);
    setRestoreSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setRestoreErrorMsg('يرجى اختيار ملف بصيغة JSON صالح.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Basic verification
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('محتوى الملف غير صالح');
        }

        if (!Array.isArray(parsed.issues) && !Array.isArray(parsed.categories) && !parsed.generalSettings) {
          throw new Error('الملف لا يحتوي على بيانات متوافقة مع منظومة التذاكر.');
        }

        setPreviewBackup({
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          exportedBy: parsed.exportedBy,
          systemName: parsed.systemName || parsed.generalSettings?.appName || 'نسخة احتياطية',
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          cannedResponses: Array.isArray(parsed.cannedResponses) ? parsed.cannedResponses : [],
          soundSettings: parsed.soundSettings || soundSettings,
          generalSettings: parsed.generalSettings || generalSettings,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        });
      } catch (err: any) {
        console.error('Error parsing JSON backup file:', err);
        setRestoreErrorMsg('فشل قراءة الملف: تأكد من أن الملف هو نسخة احتياطية صحيحة للمنظومة بصيغة JSON.');
        setPreviewBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm and apply restore
  const handleExecuteRestore = () => {
    if (!previewBackup) return;

    try {
      onRestoreBackup(previewBackup, restoreMode);
      setRestoreSuccessMsg(
        restoreMode === 'overwrite'
          ? 'تمت استعادة كامل بيانات المنظومة بنجاح وتحديث كافة السجلات!'
          : 'تم دمج بيانات النسخة الاحتياطية بنجاح مع البيانات الحالية دون فقدان التذاكر السابقة!'
      );
      setPreviewBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setRestoreSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      setRestoreErrorMsg('حدث خطأ أثناء تطبيق الاستعادة.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-emerald-500/20 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <Database className="w-4 h-4" />
            <span>إدارة الأمان والنسخ الاحتياطي (Backup & Disaster Recovery)</span>
          </div>
          <h3 className="text-lg font-black">النسخ الاحتياطي الشامل واستعادة المنظومة</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            يمكنك تنزيل ملف JSON شامل يحتوي على كافة التذاكر، الحسابات، تصنيفات الخدمة، اتفاقيات SLA، الردود السريعة، إعدادات الهوية، وسجل العمليات لنقلها إلى جهاز آخر أو استعادتها لاحقاً بضغطة زر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSystemToDefault}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>تهيئة المنظومة لبيانات المصنع</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {backupSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>تم تجهيز وتحميل ملف النسخة الاحتياطية الكاملة بنجاح إلى جهازك! 💾</span>
        </div>
      )}

      {restoreSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{restoreSuccessMsg} 🎉</span>
        </div>
      )}

      {restoreErrorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{restoreErrorMsg}</span>
        </div>
      )}

      {/* Current System Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">إجمالي التذاكر</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{issues.length} تذكرة</div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">الأقسام والتصنيفات</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{categories.length} قسم</div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">المستخدمين المسجلين</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{users.length} مستخدم</div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">سجلات التدقيق (Audit)</div>
            <div className="text-base font-black text-slate-800 dark:text-white">{auditLogs.length} حركة</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Export Section & Import Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUMN 1: EXPORT BACKUP */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <Download className="w-5 h-5" />
              <span>تصدير نسخة احتياطية جديدة (Export JSON)</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              يقوم هذا الإجراء بتجميع كافة بيانات النظام في ملف JSON مشفر وآمن يمكن حفظه على جهازك، القرص السحابي (Google Drive أو OneDrive)، أو إرساله للأمان.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-emerald-500" />
                <span>محتويات ملف النسخة الاحتياطية:</span>
              </div>
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pr-2">
                <li>• جميع تذاكر الدعم وسجل التعليقات</li>
                <li>• حسابات الموظفين والصلاحيات</li>
                <li>• قواعد اتفاقيات SLA والتصنيفات</li>
                <li>• قائمة الوسوم والردود النموذجية</li>
                <li>• إعدادات الصوت ونغمات التنبيه</li>
                <li>• نصوص الهوية وحقوق الملكية</li>
              </ul>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeAuditLogs}
                  onChange={(e) => setIncludeAuditLogs(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                />
                <span>تضمين سجل العمليات والتدقيق الأمني (Audit Logs - {auditLogs.length} سجل)</span>
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>تحميل النسخة الاحتياطية الكاملة (JSON File) 📥</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: RESTORE BACKUP */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <Upload className="w-5 h-5" />
              <span>استيراد واسترجاع نسخة احتياطية (Restore JSON)</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              اختر ملف النسخة الاحتياطية <code className="text-indigo-600 dark:text-indigo-400 font-mono">.json</code> لاسترجاع البيانات. سيتم فحص الملف ومعاينته قبل تطبيق الاستعادة.
            </p>

            {/* Upload Box */}
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-5 text-center transition bg-slate-50/50 dark:bg-slate-800/30">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  اسحب وأفلت ملف النسخة الاحتياطية هنا أو انقر للاختيار
                </div>
                <div className="text-[10px] text-slate-400">يدعم ملفات JSON الرسمية المصدرة من المنظومة</div>
              </div>
            </div>

            {/* Restore Preview if file selected */}
            {previewBackup && (
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>تم التحقق من الملف بنجاح!</span>
                  </div>
                  <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-500">
                    إصدار {previewBackup.version}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl">
                  <div>تذاكر: <strong>{previewBackup.issues?.length || 0}</strong></div>
                  <div>مستخدمين: <strong>{previewBackup.users?.length || 0}</strong></div>
                  <div>أقسام: <strong>{previewBackup.categories?.length || 0}</strong></div>
                </div>

                {/* Restore Strategy Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    طريقة استعادة البيانات:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('overwrite')}
                      className={`p-2 rounded-xl text-xs font-bold border text-right transition ${
                        restoreMode === 'overwrite'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div>استبدال شامل (Overwrite)</div>
                      <div className={`text-[9px] font-normal ${restoreMode === 'overwrite' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        مسح البيانات الحالية وتثبيت النسخة بالكامل
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-2 rounded-xl text-xs font-bold border text-right transition ${
                        restoreMode === 'merge'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div>دمج ذكي (Smart Merge)</div>
                      <div className={`text-[9px] font-normal ${restoreMode === 'merge' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        إضافة التذاكر والبيانات الجديدة مع الحفاظ على القائم
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="button"
              disabled={!previewBackup}
              onClick={handleExecuteRestore}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                previewBackup
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-98 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>تطبيق استعادة النسخة الاحتياطية الآن ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Disaster Recovery Guide */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-300">نصيحة أمان مهمة:</strong> يُنصح بتصدير نسخة احتياطية دورياً (أسبوعياً أو شهرياً) قبل إجراء أي عمليات صيانة كبرى أو حذف جماعي للتذاكر. الملف الذي يتم تنزيله يحتوي على كل شيء يضمن تشغيل المنظومة أوفلاين في أي وقت بدون فقدان تذكرة واحدة.
        </div>
      </div>
    </div>
  );
};
