import React from 'react';
import { 
  BarChart3, 
  Sparkles, 
  ArrowLeft, 
  ListTodo
} from 'lucide-react';
import { AppUser, GeneralSettings } from '../types';

interface WelcomeHeroBannerProps {
  currentUser: AppUser;
  onOpenIssues: () => void;
  onOpenDashboard?: () => void;
  onOpenCustomerPortal?: () => void;
  generalSettings?: GeneralSettings;
  activeTicketsCount?: number;
  breachedCount?: number;
}

export const WelcomeHeroBanner: React.FC<WelcomeHeroBannerProps> = ({
  currentUser,
  onOpenIssues,
  generalSettings,
  activeTicketsCount = 0,
}) => {
  // Customizable settings with elegant fallbacks matching user's screenshot
  const badgeText = generalSettings?.welcomeBannerBadge || 'لوحة التحكم الاحترافية الممتازة';
  const greetingPrefix = generalSettings?.welcomeBannerTitlePrefix || 'مرحباً بك مجدداً، أ.';
  const descText = generalSettings?.welcomeBannerDesc || 
    'هذا نموذج المعاينة الخاص بالتصميم الجديد لمنظومة مستر أشرف السقا 2025. تم تصميم الهيدر خصيصاً ليتوافق مع أحدث معايير تجربة المستخدم (UI/UX) مع تحسين المظهر البصري لبيانات الحالة ومؤشرات الأداء.';
  const primaryBtnText = generalSettings?.welcomeBannerPrimaryBtnText || 'تقارير وسجل المشاكل';
  const secondaryBtnText = generalSettings?.welcomeBannerSecondaryBtnText || 'فتح سجل البلاغات فوراً';
  const showSecondary = generalSettings?.welcomeBannerShowSecondaryBtn !== false;

  const userName = currentUser?.name || 'أحمد العتيبي';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#060c1d] border border-cyan-950/70 p-6 sm:p-8 shadow-[0_15px_45px_rgba(2,6,23,0.8)] text-white backdrop-blur-xl mb-6 select-none" dir="rtl">
      {/* Ambient background glows matching Image 1 & latest Screenshot */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="relative z-10 space-y-4 max-w-5xl">
        {/* Top Capsule Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#08152e] border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{badgeText}</span>
          </span>
        </div>

        {/* Headline with Greeting and Waving Hand Emoji */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-2.5 tracking-tight">
          <span>{greetingPrefix} {userName}</span>
          <span className="inline-block animate-wave origin-bottom-right">👋</span>
        </h2>

        {/* Description Paragraph from Screenshot */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-4xl text-justify">
          {descText}
        </p>

        {/* Quick Action CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {/* Executive Royal Blue & Indigo Button with luminous elevation and crisp white contrast */}
          <button
            type="button"
            onClick={onOpenIssues}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 border border-blue-400/40 shadow-[0_4px_20px_rgba(37,99,235,0.45)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.65)] transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-cyan-300 stroke-[2.5]" />
            <span className="tracking-wide">{primaryBtnText}</span>
            <span className="bg-white/20 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/20 mr-1">
              {activeTicketsCount} نشطة
            </span>
          </button>

          {/* Secondary Sleek Obsidian Capsule Button */}
          {showSecondary && (
            <button
              type="button"
              onClick={onOpenIssues}
              className="px-5 py-2.5 rounded-2xl bg-[#091124] hover:bg-[#101c38] text-slate-200 hover:text-white border border-slate-700/80 hover:border-blue-500/50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
            >
              <ListTodo className="w-4 h-4 text-blue-400" />
              <span>{secondaryBtnText}</span>
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white rtl:rotate-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
