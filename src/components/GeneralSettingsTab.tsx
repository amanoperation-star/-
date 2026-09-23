import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Headset, 
  ShieldCheck, 
  Briefcase, 
  Cpu, 
  LifeBuoy, 
  Layers, 
  Palette, 
  Building2, 
  FileText, 
  Eye
} from 'lucide-react';
import { GeneralSettings } from '../types';
import { INITIAL_GENERAL_SETTINGS } from '../utils/mockData';

interface GeneralSettingsTabProps {
  generalSettings: GeneralSettings;
  onUpdateGeneralSettings: (settings: GeneralSettings) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Headset', label: 'دعم فني (سماعة)', icon: Headset },
  { id: 'ShieldCheck', label: 'أمان وتدقيق', icon: ShieldCheck },
  { id: 'Briefcase', label: 'أعمال ومؤسسي', icon: Briefcase },
  { id: 'Cpu', label: 'تقني ومعالجة', icon: Cpu },
  { id: 'LifeBuoy', label: 'إنقاذ وطوارئ', icon: LifeBuoy },
  { id: 'Layers', label: 'منظومات وطبقات', icon: Layers },
];

const COLOR_PRESETS = [
  { id: 'indigo-emerald', label: 'نيلي مع زمردي (افتراضي)', preview: 'from-indigo-600 via-indigo-500 to-emerald-500' },
  { id: 'blue-cyan', label: 'أزرق محيطي مع سماوي', preview: 'from-blue-600 via-sky-500 to-cyan-400' },
  { id: 'violet-fuchsia', label: 'بنفسجي مع فوشيا ملكي', preview: 'from-purple-600 via-violet-500 to-fuchsia-400' },
  { id: 'emerald-teal', label: 'أخضر زمردي مع تركواز', preview: 'from-emerald-600 via-teal-500 to-cyan-500' },
  { id: 'rose-orange', label: 'وردي مع برتقالي دافئ', preview: 'from-rose-600 via-pink-500 to-amber-500' },
  { id: 'amber-yellow', label: 'ذهبي مع كهرماني', preview: 'from-amber-600 via-amber-500 to-yellow-400' },
];

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  generalSettings,
  onUpdateGeneralSettings,
}) => {
  const [formData, setFormData] = useState<GeneralSettings>(generalSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if prop updates externally
  React.useEffect(() => {
    setFormData(generalSettings);
  }, [generalSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGeneralSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    if (confirm('هل أنت متأكد من استعادة الإعدادات العامة الافتراضية للنظام؟')) {
      setFormData(INITIAL_GENERAL_SETTINGS);
      onUpdateGeneralSettings(INITIAL_GENERAL_SETTINGS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find(i => i.id === formData.appLogoIcon)?.icon || Headset;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-indigo-500/20 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
            <Sliders className="w-4 h-4" />
            <span>تخصيص الهوية البصرية والنصوص العامة</span>
          </div>
          <h3 className="text-lg font-black">الإعدادات العامة وهوية المنظومة (General & Branding)</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            يمكنك من هنا تعديل اسم المنظومة في الشريط العلوي، شعار المنظومة، نصوص الترويسة، جملة الحقوق المحفوظة بالأسفل، واسم المؤسسة. يتم الحفظ فورياً وتطبيق التغييرات في كامل التطبيق.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>تم حفظ الإعدادات وتحديث هوية المنظومة وحقوق النشر بنجاح! 🎉</span>
          </div>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>معاينة حية فورية (Live Preview):</span>
          </div>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
            شكل الشريط العلوي المباشر
          </span>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${COLOR_PRESETS.find(c => c.id === formData.headerColorPreset)?.preview || 'from-indigo-600 to-emerald-500'} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formData.appName || 'منظومة تتبع وإدارة المشاكل'}
                </span>
                {formData.showBadge && formData.appBadge && (
                  <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {formData.appBadge}
                  </span>
                )}
              </div>
              {formData.showSubtitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {formData.appSubtitle || 'SLA Watcher • CSAT Metrics • Accurate Work Timer & Activity Trail'}
                </p>
              )}
            </div>
          </div>

          <div className="text-left text-[11px] text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300">{formData.companyName || 'اسم المنشأة / الشركة'}</div>
            <div className="text-[10px] text-slate-500">{formData.copyrightText || 'جميع الحقوق محفوظة'}</div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: App Titles & Branding */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">اسم المنظومة وعناوين الترويسة</h4>
                <p className="text-[11px] text-slate-400">النصوص البارزة في أعلى الصفحة والشريط الرئيسي</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المنظومة الرئيسي (Header Title)
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="مثال: منظومة تتبع وإدارة المشاكل أو نظام خدمة العملاء"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1">يظهر كعنوان رئيسي عريض في شريط الترويسة.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                شارة الإصدار أو النسخة (Badge Tag)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.appBadge}
                  onChange={(e) => setFormData({ ...formData, appBadge: e.target.value })}
                  placeholder="مثال: Enterprise Pro أو V2.0 أو رسمي"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, showBadge: !formData.showBadge })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    formData.showBadge
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {formData.showBadge ? 'ظاهر' : 'مخفي'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الوصف التعريفي المصغر (Subtitle)
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={formData.appSubtitle}
                  onChange={(e) => setFormData({ ...formData, appSubtitle: e.target.value })}
                  placeholder="مثال: SLA Watcher • CSAT Metrics • Accurate Work Timer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>يظهر بخط رمادي ناعم تحت اسم المنظومة.</span>
                  <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.showSubtitle}
                      onChange={(e) => setFormData({ ...formData, showSubtitle: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>إظهار الوصف</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Logo Icon & Color Themes */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">أيقونة الشعار والتدرج اللوني</h4>
                <p className="text-[11px] text-slate-400">تخصيص شكل ولون الشعار البصري للمنظومة</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اختر أيقونة الشعار:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.appLogoIcon === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormData({ ...formData, appLogoIcon: item.id })}
                      className={`p-2.5 rounded-2xl border text-right transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-white ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                التدرج اللوني لخلفية الشعار (Gradient):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = formData.headerColorPreset === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setFormData({ ...formData, headerColorPreset: preset.id })}
                      className={`p-2 rounded-2xl border transition text-right flex items-center gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${preset.preview} shrink-0 shadow-xs`}></span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Copyright & Footer Customization */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">حقوق النشر، اسم الشركة، والتذييل السفلي (Footer)</h4>
                <p className="text-[11px] text-slate-400">تخصيص نص "جميع الحقوق محفوظة" وتفاصيل أسفل الصفحة والتقارير</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نص جميع الحقوق محفوظة (Copyright Text)
                </label>
                <input
                  type="text"
                  value={formData.copyrightText}
                  onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                  placeholder="مثال: جميع الحقوق محفوظة © 2026 أو خاص بشركة كذا"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">يظهر في أسفل الصفحة كحقوق ملكية رسمية.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الشركة / المنشأة الرسمية (Company Name)
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="مثال: شركة الحلول المتقدمة لتقنية المعلومات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                />
                <span className="text-[10px] text-slate-400 block mt-1">يُعتمد في ملفات التصدير وتقارير التدقيق.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظة إضافية في الفوتر السفلي (Footer Note)
                </label>
                <input
                  type="text"
                  value={formData.customFooterNote}
                  onChange={(e) => setFormData({ ...formData, customFooterNote: e.target.value })}
                  placeholder="مثال: نظام إدارة البلاغات والتذاكر المؤسسي الموحد"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
                />
                <span className="text-[10px] text-slate-400 block mt-1">عبارة ترويجية أو إرشادية للمستخدمين.</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.showFooterCopyright}
                  onChange={(e) => setFormData({ ...formData, showFooterCopyright: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                />
                <span>تفعيل وإظهار شريط الفوتر مع حقوق النشر في أسفل الشاشة</span>
              </label>

              <span className="text-[10px] text-slate-400">
                التعديلات تُحفظ في الذاكرة التخزينية للمتصفح وتُطبّق فورياً
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition"
          >
            إلغاء التغييرات
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق الإعدادات العامة</span>
          </button>
        </div>
      </form>
    </div>
  );
};
