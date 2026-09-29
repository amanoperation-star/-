import React, { useState, useRef, useEffect } from 'react';
import { 
  Headset, 
  LayoutDashboard, 
  ListTodo, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  Cloud, 
  CloudOff, 
  Bell, 
  Plus, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  X, 
  ArrowLeft,
  ChevronDown,
  Sun,
  Moon,
  RefreshCw,
  Settings,
  Power,
  ExternalLink,
  Briefcase,
  Cpu,
  LifeBuoy,
  Sparkles,
  HelpCircle,
  Layers,
  Sliders,
  Globe,
  Radio,
  Wifi,
  WifiOff,
  Users,
  Lock,
  LogOut,
  BarChart3,
  Download,
  BellOff,
  Grid,
  Compass,
  Workflow,
  FolderKanban,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { AppUser, NotificationItem, SoundSettings, GeneralSettings } from '../types';
import { ActiveUserPresence, SyncConnectionStatus } from '../utils/realtimeSync';

interface HeaderProps {
  currentTab: 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics';
  setCurrentTab: (tab: 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics') => void;
  currentUser: AppUser;
  users: AppUser[];
  onSwitchUser: (user: AppUser) => void;
  onLogout?: () => void;
  breachedCount: number;
  soundSettings: SoundSettings;
  onToggleMute: () => void;
  supabaseConnected: boolean;
  onToggleSupabaseConnected?: () => void;
  onSyncSupabaseNow?: () => void;
  onNavigateToSupabaseSettings?: () => void;
  onOpenCloudImportModal?: () => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onSelectTicket?: (ticketId: string) => void;
  onOpenNewTicketModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  appSkin?: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean';
  onToggleSkin?: (skin: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean') => void;
  generalSettings?: GeneralSettings;
  realtimeStatus?: SyncConnectionStatus;
  onlineUsers?: ActiveUserPresence[];
  totalConnections?: number;
  onRefreshRealtime?: () => void;
  onTriggerDemoToast?: () => void;
}

interface SectionDefinition {
  id: 'issues' | 'dashboard' | 'sla' | 'customer' | 'cab' | 'analytics' | 'admin';
  title: string;
  shortTitle: string;
  subtitle: string;
  category: 'operations' | 'monitoring' | 'management';
  categoryLabel: string;
  icon: any;
  color: string;
  activeBg: string;
  iconColor: string;
  adminOnly?: boolean;
  description: string;
  features: string[];
}

const SYSTEM_SECTIONS: SectionDefinition[] = [
  {
    id: 'issues',
    title: 'سجل المشاكل والبلاغات',
    shortTitle: 'سجل البلاغات',
    subtitle: 'إدارة وتتبع دورة حياة التذاكر الفنية والعمليات',
    category: 'operations',
    categoryLabel: 'العمليات والتشغيل الميداني',
    icon: ListTodo,
    color: 'blue',
    activeBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30',
    iconColor: 'text-blue-500 dark:text-blue-400',
    description: 'تسجيل البلاغات الجديدة، عدادات العمل المباشرة، متابعة الحالات، وتعيين المهندسين والحلول الفنية.',
    features: ['إدارة ومتابعة البلاغات', 'عدادات أزمنة العمل', 'إغلاق وحل المشاكل', 'فرز وتصدير البيانات']
  },
  {
    id: 'dashboard',
    title: 'لوحة المؤشرات العامة',
    shortTitle: 'المؤشرات والـ KPI',
    subtitle: 'نظرة شمولية عليا لكفاءة الفريق ونسب الإنجاز',
    category: 'monitoring',
    categoryLabel: 'المتابعة والحوكمة والـ SLA',
    icon: LayoutDashboard,
    color: 'indigo',
    activeBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    adminOnly: true,
    description: 'ملخص رقمي تنفيذي لنسب الإنجاز، مؤشرات الامتثال الزمني، وتحليلات سرعة المعالجة والجاهزية.',
    features: ['معدلات حل التذاكر', 'إحصاءات زمن الاستجابة', 'توزيع الأولويات والأقسام']
  },
  {
    id: 'sla',
    title: 'إدارة اتفاقيات SLA',
    shortTitle: 'مراقبة SLA',
    subtitle: 'رصد المواعيد والتنبيهات الاستباقية للمتأخرات',
    category: 'monitoring',
    categoryLabel: 'المتابعة والحوكمة والـ SLA',
    icon: Clock,
    color: 'amber',
    activeBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/30',
    iconColor: 'text-amber-500 dark:text-amber-400',
    description: 'مراقبة التزام الأقسام بمواقيت اتفاقيات مستوى الخدمة مع إنذار صوتي ومرئي للتذاكر المتأخرة.',
    features: ['إنذارات فورية للمتأخرات', 'تخصيص مدد الاستجابة', 'سجل وإحصاء المتأخرات']
  },
  {
    id: 'customer',
    title: 'بوابة متابعة العميل',
    shortTitle: 'بوابة العملاء',
    subtitle: 'الخدمة الذاتية وتواصل العملاء المباشر',
    category: 'operations',
    categoryLabel: 'العمليات والتشغيل الميداني',
    icon: Globe,
    color: 'purple',
    activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/30',
    iconColor: 'text-purple-500 dark:text-purple-400',
    description: 'منصة تفاعلية للعملاء لمتابعة حالة بلاغاتهم، تقييم مستوى الرضا CSAT، والتواصل عبر واتساب.',
    features: ['تتبع ذاتي لحالة البلاغ', 'محادثات الدعم واتساب', 'تقييمات الرضا CSAT']
  },
  {
    id: 'cab',
    title: 'اعتماد التغييرات (CAB)',
    shortTitle: 'مجلس التغيير CAB',
    subtitle: 'إدارة وجدولة أعمال الصيانة والتحديثات التقنية',
    category: 'operations',
    categoryLabel: 'العمليات والتشغيل الميداني',
    icon: Layers,
    color: 'cyan',
    activeBg: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-2 ring-cyan-400/30',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
    description: 'جدولة فترات التوقف المخططة، دراسة أثر التعديلات التقنية، وتنسيق أنشطة الفرق الهندسية.',
    features: ['جدولة فترات التوقف', 'تقييم المخاطر التقنية', 'سجل الموافقات والأنشطة']
  },
  {
    id: 'analytics',
    title: 'التحليلات والرسوم البيانية',
    shortTitle: 'التحليلات والتقارير',
    subtitle: 'الرسوم البيانية وتوزيع أحمال العمل',
    category: 'monitoring',
    categoryLabel: 'المتابعة والحوكمة والـ SLA',
    icon: BarChart3,
    color: 'sky',
    activeBg: 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/30',
    iconColor: 'text-sky-500 dark:text-sky-400',
    adminOnly: true,
    description: 'تقارير إحصائية معمقة ورسوم بيانية لتوزيع المشاكل حسب الأقسام، الفنيين، والمدد الزمنية.',
    features: ['مخططات بيانية ديناميكية', 'مقارنة إنتاجية الفنيين', 'تحليل فئات وتوزيع الأعطال']
  },
  {
    id: 'admin',
    title: 'لوحة الإدارة والضبط الشامل',
    shortTitle: 'الإدارة والتحكم',
    subtitle: 'إدارة المستخدمين والصلاحيات والربط السحابي',
    category: 'management',
    categoryLabel: 'الإدارة والتحكم المركزي',
    icon: ShieldCheck,
    color: 'emerald',
    activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    adminOnly: true,
    description: 'التحكم بكافة إعدادات المنظومة، صلاحيات الفريق، هيكلة الفئات، النسخ الاحتياطي والإنتاج الفعلي.',
    features: ['إدارة صلاحيات المستخدمين', 'هيكلة الفئات والأقسام', 'النسخ الاحتياطي والإنتاج']
  }
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSwitchUser,
  onLogout,
  breachedCount,
  soundSettings,
  onToggleMute,
  supabaseConnected,
  onToggleSupabaseConnected,
  onSyncSupabaseNow,
  onNavigateToSupabaseSettings,
  onOpenCloudImportModal,
  notifications,
  onClearNotifications,
  onSelectTicket,
  onOpenNewTicketModal,
  theme,
  onToggleTheme,
  appSkin = 'standard',
  onToggleSkin,
  generalSettings,
  realtimeStatus = 'connected',
  onlineUsers = [],
  totalConnections = 1,
  onRefreshRealtime,
  onTriggerDemoToast,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showSectionsHub, setShowSectionsHub] = useState(false);

  // Switch User Password Modal state
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState('');

  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close notifications menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCardStyle = () => {
    if (soundSettings.alarmStyle === 'amber-warning') {
      return {
        card: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-100/50 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-slate-900/95 border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-100',
        badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
        ping: 'bg-amber-500',
        button: 'bg-amber-600 hover:bg-amber-500 text-white',
      };
    } else if (soundSettings.alarmStyle === 'dark-rose') {
      return {
        card: 'bg-gradient-to-r from-purple-950/20 via-slate-900/80 to-rose-950/20 dark:from-purple-950/40 dark:via-slate-900/90 dark:to-rose-950/40 border-purple-300 dark:border-purple-800/60 text-purple-950 dark:text-purple-100',
        badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
        ping: 'bg-purple-500',
        button: 'bg-purple-600 hover:bg-purple-500 text-white',
      };
    } else {
      return {
        card: 'bg-gradient-to-r from-rose-500/10 via-red-500/5 to-slate-100/50 dark:from-rose-950/40 dark:via-slate-900/90 dark:to-slate-900/95 border-rose-300/80 dark:border-rose-500/40 text-rose-950 dark:text-rose-100',
        badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
        ping: 'bg-rose-500',
        button: 'bg-rose-600 hover:bg-rose-500 text-white',
      };
    }
  };

  const style = getCardStyle();

  const getLogoIcon = () => {
    const iconName = generalSettings?.appLogoIcon || 'Headset';
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'LifeBuoy': return <LifeBuoy className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Headset':
      default:
        return <Headset className="w-5 h-5" />;
    }
  };

  const getGradientClass = () => {
    const preset = generalSettings?.headerColorPreset || 'indigo-emerald';
    switch (preset) {
      case 'blue-cyan':
        return 'from-blue-600 via-sky-500 to-cyan-400 shadow-blue-500/30';
      case 'violet-fuchsia':
        return 'from-purple-600 via-violet-500 to-fuchsia-400 shadow-purple-500/30';
      case 'rose-orange':
        return 'from-rose-600 via-pink-500 to-amber-500 shadow-rose-500/30';
      case 'emerald-teal':
        return 'from-emerald-600 via-teal-500 to-cyan-500 shadow-emerald-500/30';
      case 'amber-yellow':
        return 'from-amber-600 via-amber-500 to-yellow-400 shadow-amber-500/30';
      case 'indigo-emerald':
      default:
        return 'from-indigo-600 via-indigo-500 to-emerald-500 shadow-indigo-600/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-xs dark:shadow-xl transition-colors duration-150">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getGradientClass()} flex items-center justify-center text-white shadow-lg shrink-0`}>
            {getLogoIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                {generalSettings?.appName || 'منظومة تتبع وإدارة المشاكل'}
              </h1>
              {generalSettings?.showBadge !== false && (generalSettings?.appBadge || 'Enterprise Pro') && (
                <span className="hidden md:inline-block bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {generalSettings?.appBadge || 'Enterprise Pro'}
                </span>
              )}
            </div>
            {generalSettings?.showSubtitle !== false && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {generalSettings?.appSubtitle || 'SLA Watcher • CSAT Metrics • Accurate Work Timer & Activity Trail'}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* SLA Compact Badge Button (Quick Access) */}
          {breachedCount > 0 && (
            <button
              onClick={() => {
                setBannerDismissed(!bannerDismissed);
                if (bannerDismissed) {
                  // User opened banner
                } else {
                  setCurrentTab('sla');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
              title={bannerDismissed ? 'انقر لعرض تفاصيل تنبيه المتأخرات' : 'انقر للانتقال للتذاكر المتأخرة'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>{breachedCount} متأخرة</span>
            </button>
          )}

          {/* Skin Selector */}
          {onToggleSkin && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 hidden md:inline">🎭 المظهر:</span>
              <select
                value={appSkin}
                onChange={(e) => onToggleSkin(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none cursor-pointer border-none"
              >
                <option value="standard" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">الكلاسيكي 🏢</option>
                <option value="amethyst" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">الياقوت النيون 💎</option>
                <option value="cyberpunk" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">السايبربانك 💖</option>
                <option value="ocean" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">المحيط الهادئ 🌊</option>
              </select>
            </div>
          )}

          {/* Day / Night Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-xs text-xs font-bold cursor-pointer"
            title={theme === 'dark' ? 'التحويل إلى الوضع النهاري (Light Mode)' : 'التحويل إلى الوضع الليلي (Dark Mode)'}
            aria-label="تبديل مظهر العرض"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">الليلي</span>
              </>
            )}
          </button>

          {/* Cloud Connection Light Indicator */}
          <div
            onClick={onTriggerDemoToast}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300 bg-emerald-500/15 dark:bg-emerald-950/70 border border-emerald-500/50 dark:border-emerald-400/50 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/30 select-none cursor-pointer hover:bg-emerald-500/25 active:scale-95"
            title="السحابة المركزية مسجلة ومزامنة تلقائياً 🟢 - المزامنة اللحظية مفعلة (انقر لتجربة التنبيه السحابي الفوري)"
            aria-label="حالة الاتصال السحابي: السحابة مسجلة ومتصلة تلقائياً"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            <span className="font-extrabold text-[11px] text-emerald-700 dark:text-emerald-300">السحابة متصلة 🟢</span>
          </div>

          {/* Quick Cloud Fetch Button in Header */}
          {onOpenCloudImportModal && (
            <button
              type="button"
              onClick={onOpenCloudImportModal}
              className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/30 cursor-pointer"
              title="جلب واستعراض كل ما هو مسجل في السحابة (تذاكر، مستخدمين، CAB)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-bold">جلب بيانات السحابة</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 relative transition border border-slate-200 dark:border-slate-700"
              title="الإشعارات والتنبيهات"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-84 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-indigo-500" />
                    <span>التنبيهات المباشرة ({notifications.length})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {onTriggerDemoToast && (
                      <button
                        onClick={onTriggerDemoToast}
                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="تجربة ظهور التنبيه السحابي الفوري من الصورة المرفقة"
                      >
                        <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                        <span>تجربة التنبيه 🌐</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-rose-500 hover:underline text-[10px] font-bold"
                      >
                        مسح الكل
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-3 text-center space-y-2.5">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
                        <BellOff className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">لا توجد إشعارات حالياً</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                          ستظهر هنا التنبيهات الفورية تلقائياً لأي نشاط أو تعديل تجريه في المنظومة وبلاغات التيم المباشرة.
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const ticketMatch = n.ticketId || n.title.match(/(INC-\d+)/i)?.[1] || n.desc.match(/(INC-\d+)/i)?.[1];
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (ticketMatch && onSelectTicket) {
                              onSelectTicket(ticketMatch);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border space-y-1.5 transition-all duration-150 relative ${
                            ticketMatch
                              ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:shadow-xs group'
                              : ''
                          } ${
                            n.type === 'danger'
                              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                              : n.type === 'warning'
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                              : n.type === 'success'
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={`font-bold flex items-center gap-1.5 text-xs leading-snug ${
                                n.type === 'danger'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : n.type === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : n.type === 'success'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              {ticketMatch && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block shrink-0"></span>
                              )}
                              <span>{n.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">{n.time}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {n.desc}
                          </p>

                          {/* Ticket Quick Link Badge */}
                          {ticketMatch && (
                            <div className="pt-1.5 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                              <span className="font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                {ticketMatch}
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-1">
                                <span>انقر لفتح التذكرة مباشرة</span>
                                <ArrowLeft className="w-3 h-3 rtl:rotate-0" />
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Ticket CTA */}
          <button
            onClick={onOpenNewTicketModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">تذكرة جديدة</span>
          </button>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow">
                {currentUser.avatar}
              </span>
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>تبديل حساب المستخدم:</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (currentUser.id === u.id) {
                        setShowUserDropdown(false);
                        return;
                      }
                      setTargetUser(u);
                      setSwitchPasswordInput('');
                      setSwitchPasswordError('');
                      setShowSwitchModal(true);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl flex items-center justify-between transition ${
                      currentUser.id === u.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {u.avatar}
                      </span>
                      <span>{u.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {u.role}
                    </span>
                  </button>
                ))}

                {onLogout && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-right px-3 py-2 rounded-xl flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-bold cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج / قفل المنظومة</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Dedicated Navigation Bar (شريط التبويبات المطور - تصميم منطقي ومرتب وسهل الوصول لجميع الأقسام) */}
      <div className="bg-slate-50/95 dark:bg-slate-950/90 border-t border-slate-200/90 dark:border-slate-800/90 px-4 py-2 shadow-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Main Navigation Tabs */}
          <nav className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {/* 1. Issues / Tickets List (Always Primary) */}
            <button
              type="button"
              onClick={() => setCurrentTab('issues')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                currentTab === 'issues'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <ListTodo className={`w-4 h-4 transition-transform ${currentTab === 'issues' ? 'scale-110 text-white' : 'text-blue-500 dark:text-blue-400'}`} />
              <span>سجل المشاكل والبلاغات</span>
            </button>

            {/* 2. Dashboard (Admin only) */}
            {currentUser.role === 'Admin' && (
              <button
                type="button"
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 transition-transform ${currentTab === 'dashboard' ? 'scale-110 text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span>لوحة المؤشرات العامة</span>
              </button>
            )}

            {/* 3. SLA Management */}
            <button
              type="button"
              onClick={() => setCurrentTab('sla')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 relative ${
                currentTab === 'sla'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <Clock className={`w-4 h-4 transition-transform ${currentTab === 'sla' ? 'scale-110 text-white' : 'text-amber-500 dark:text-amber-400'}`} />
              <span>إدارة اتفاقيات SLA</span>
              {breachedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-black animate-pulse shadow-xs">
                  {breachedCount}
                </span>
              )}
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block shrink-0" />

            {/* 4. Customer Portal */}
            <button
              type="button"
              onClick={() => setCurrentTab('customer')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                currentTab === 'customer'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <Globe className={`w-4 h-4 transition-transform ${currentTab === 'customer' ? 'scale-110 text-white' : 'text-purple-500 dark:text-purple-400'}`} />
              <span>بوابة متابعة العميل</span>
            </button>

            {/* 5. CAB Board */}
            <button
              type="button"
              onClick={() => setCurrentTab('cab')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                currentTab === 'cab'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-2 ring-cyan-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <Layers className={`w-4 h-4 transition-transform ${currentTab === 'cab' ? 'scale-110 text-white' : 'text-cyan-500 dark:text-cyan-400'}`} />
              <span>اعتماد التغييرات (CAB)</span>
            </button>

            {/* 6. Analytics (Admin only) */}
            {currentUser.role === 'Admin' && (
              <button
                type="button"
                onClick={() => setCurrentTab('analytics')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  currentTab === 'analytics'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <BarChart3 className={`w-4 h-4 transition-transform ${currentTab === 'analytics' ? 'scale-110 text-white' : 'text-sky-500 dark:text-sky-400'}`} />
                <span>التحليلات والرسوم البيانية</span>
              </button>
            )}

            {/* Separator */}
            {currentUser.role === 'Admin' && (
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block shrink-0" />
            )}

            {/* 7. Admin View (Admin only) */}
            {currentUser.role === 'Admin' && (
              <button
                type="button"
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  currentTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 transition-transform ${currentTab === 'admin' ? 'scale-110 text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />
                <span>لوحة الإدارة الشاملة</span>
              </button>
            )}
          </nav>

          {/* All Sections & Workspaces Hub Button */}
          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={() => setShowSectionsHub(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-700 dark:text-slate-200 dark:hover:text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
              title="عرض خريطة ودليل الأقسام الشامل لكافة خدمات المنظومة"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
              <span>دليل وخريطة الأقسام</span>
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                {currentUser.role === 'Admin' ? '7 أقسام' : '4 أقسام'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SLA Breach Alert - Modern Floating Banner */}
      {breachedCount > 0 && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 pb-3 pt-0">
          <div
            className={`rounded-2xl border px-3.5 py-2.5 transition-all shadow-xs backdrop-blur-md flex flex-wrap items-center justify-between gap-3 ${style.card}`}
          >
            {/* Left side: Beacon, Icon and Detailed Text */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.ping}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${style.ping}`}></span>
                </span>
              </div>

              <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <span>تنبيه اتفاقية مستوى الخدمة:</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">
                    توجد <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded-md">{breachedCount} تذاكر</span> تجاوزت الوقت المخصص للحل (SLA).
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Modern Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 mr-auto sm:mr-0">
              {/* Sound Toggle Button */}
              <button
                onClick={onToggleMute}
                className="px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={soundSettings.muted ? 'تشغيل صوت الإنذار' : 'كتم صوت الإنذار'}
              >
                {soundSettings.muted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>مكتوم</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>صوت مفعّل</span>
                  </>
                )}
              </button>

              {/* View Issues Button */}
              <button
                onClick={() => setCurrentTab('sla')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 active:scale-95 ${style.button}`}
              >
                <span>عرض المتأخرات في SLA</span>
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>

              {/* Dismiss Button */}
              <button
                onClick={() => setBannerDismissed(true)}
                className="w-7 h-7 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center transition text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                title="تصغير شريط التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch User Password Verification Modal */}
      {showSwitchModal && targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 text-xs text-right animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">تأكيد كلمة المرور للموظف</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">لتبديل الحساب إلى: {targetUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {switchPasswordError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {switchPasswordError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPass = targetUser.password || (targetUser.role === 'Admin' ? 'admin' : '123');
                if (switchPasswordInput.trim() !== expectedPass) {
                  setSwitchPasswordError('كلمة المرور غير صحيحة، يرجى المحاولة ثانية.');
                  return;
                }
                onSwitchUser(targetUser);
                setShowSwitchModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  أدخل كلمة مرور ({targetUser.name}):
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={switchPasswordInput}
                  onChange={(e) => {
                    setSwitchPasswordInput(e.target.value);
                    setSwitchPasswordError('');
                  }}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  تأكيد والتبديل
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Sections Directory & Workspaces Hub Modal (خريطة ودليل كافة الأقسام والخدمات بالمنظومة) */}
      {showSectionsHub && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                  <Compass className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      دليل وخريطة أقسام المنظومة (Workspaces & Departments)
                    </h3>
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      نظام حديث ومتكامل
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    استعراض وتوجيه سريع لكافة أقسام وخدمات المنظومة مع توضيح مهام كل قسم وصلاحيات الوصول
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSectionsHub(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                title="إغلاق الدليل"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hub Sections Grid Grouped Logically */}
            <div className="space-y-6">
              {/* Group 1: Operations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                  <span>1. أقسام العمليات والتشغيل الميداني</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mr-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SYSTEM_SECTIONS.filter((s) => s.category === 'operations').map((sec) => {
                    const isCurrent = currentTab === sec.id;
                    const IconComponent = sec.icon;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setCurrentTab(sec.id);
                          setShowSectionsHub(false);
                        }}
                        className={`group p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                          isCurrent
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-400/20'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                            أنت هنا الآن 📍
                          </div>
                        )}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200/80 dark:bg-slate-700/80 group-hover:bg-blue-500 group-hover:text-white transition'}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {sec.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{sec.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {sec.description}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>متاح للتشغيل الفوري</span>
                          </span>
                          <span className={`flex items-center gap-1 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'} transition`}>
                            <span>فتح القسم</span>
                            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Monitoring & SLA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>2. أقسام المتابعة والحوكمة ومستوى الخدمة (SLA & KPI)</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mr-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SYSTEM_SECTIONS.filter((s) => s.category === 'monitoring').map((sec) => {
                    const isCurrent = currentTab === sec.id;
                    const IconComponent = sec.icon;
                    const isRestricted = sec.adminOnly && currentUser.role !== 'Admin';

                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          if (isRestricted) return;
                          setCurrentTab(sec.id);
                          setShowSectionsHub(false);
                        }}
                        className={`group p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                          isRestricted
                            ? 'opacity-60 bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/20 cursor-pointer'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white shadow-xs">
                            أنت هنا الآن 📍
                          </div>
                        )}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-200/80 dark:bg-slate-700/80 group-hover:bg-amber-500 group-hover:text-white transition'}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                                  {sec.title}
                                </h4>
                                {sec.adminOnly && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{sec.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {sec.description}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold">
                          {isRestricted ? (
                            <span className="text-rose-500 text-[10px] flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>يتطلب صلاحيات المشرف Admin</span>
                            </span>
                          ) : (
                            <>
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>مراقبة وتحليل لحظي</span>
                              </span>
                              <span className={`flex items-center gap-1 ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'} transition`}>
                                <span>عرض القسم</span>
                                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Central Administration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>3. أقسام الإدارة والتحكم المركزي</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mr-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_SECTIONS.filter((s) => s.category === 'management').map((sec) => {
                    const isCurrent = currentTab === sec.id;
                    const IconComponent = sec.icon;
                    const isRestricted = sec.adminOnly && currentUser.role !== 'Admin';

                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          if (isRestricted) return;
                          setCurrentTab(sec.id);
                          setShowSectionsHub(false);
                        }}
                        className={`group p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                          isRestricted
                            ? 'opacity-60 bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-400/20 cursor-pointer'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                            أنت هنا الآن 📍
                          </div>
                        )}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200/80 dark:bg-slate-700/80 group-hover:bg-emerald-500 group-hover:text-white transition'}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                                  {sec.title}
                                </h4>
                                {sec.adminOnly && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{sec.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {sec.description}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold">
                          {isRestricted ? (
                            <span className="text-rose-500 text-[10px] flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>يتطلب صلاحيات المشرف Admin</span>
                            </span>
                          ) : (
                            <>
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>تحكم أمني وإعدادات شاملة</span>
                              </span>
                              <span className={`flex items-center gap-1 ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'} transition`}>
                                <span>لوحة الإدارة</span>
                                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                💡 يمكنك في أي وقت النقر على أي قسم للانتقال الفوري إليه دون فقدان بياناتك المدخلة.
              </span>
              <button
                type="button"
                onClick={() => setShowSectionsHub(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
