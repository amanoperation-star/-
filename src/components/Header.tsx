import React, { useState, useRef, useEffect } from 'react';
import { 
  Headset, 
  Home,
  LayoutDashboard, 
  ListTodo, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
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
  HelpCircle as QuestionIcon,
  Menu,
  PanelRightClose
} from 'lucide-react';
import { AppUser, NotificationItem, SoundSettings, GeneralSettings, Issue } from '../types';
import { ActiveUserPresence, SyncConnectionStatus } from '../utils/realtimeSync';
import { hasPermission } from '../utils/permissions';

interface HeaderProps {
  currentTab: 'home' | 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics';
  setCurrentTab: (tab: 'home' | 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics') => void;
  currentUser: AppUser;
  users: AppUser[];
  issues?: Issue[];
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
  onClearSingleNotification?: (notificationId: string) => void;
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
  onOpenMobileSidebar?: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  hideSecondaryNav?: boolean;
  onOpenSectionsHubModal?: () => void;
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
    title: 'تقارير الأداء',
    shortTitle: 'تقارير الأداء',
    subtitle: 'لوحة تحكم تحليلية للمشاكل المسجلة باستخدام مكتبة Recharts',
    category: 'monitoring',
    categoryLabel: 'المتابعة والحوكمة والـ SLA',
    icon: BarChart3,
    color: 'sky',
    activeBg: 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/30',
    iconColor: 'text-sky-500 dark:text-sky-400',
    description: 'تقارير إحصائية معمقة ورسوم بيانية لتوزيع المشاكل حسب الأقسام، الفنيين، والمدد الزمنية باستخدام Recharts.',
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
  issues = [],
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
  onClearSingleNotification,
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
  onOpenMobileSidebar,
  onToggleSidebarCollapse,
  isSidebarCollapsed = false,
  hideSecondaryNav = false,
  onOpenSectionsHubModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showSectionsHub, setShowSectionsHub] = useState(false);
  const [selectedDensity, setSelectedDensity] = useState<'compact' | 'micro' | 'standard' | 'horizontal_bar'>(
    () => generalSettings?.navCardDensity || 'compact'
  );

  useEffect(() => {
    if (generalSettings?.navCardDensity) {
      setSelectedDensity(generalSettings.navCardDensity);
    }
  }, [generalSettings?.navCardDensity]);

  const activeTicketsCount = issues?.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').length ?? 0;

  // Switch User Password Modal state
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState('');

  const [showSkinDropdown, setShowSkinDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const skinMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: CTRL + K to open search/command
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncClick = () => {
    setIsSyncing(true);
    if (onSyncSupabaseNow) {
      onSyncSupabaseNow();
    } else if (onOpenCloudImportModal) {
      onOpenCloudImportModal();
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (skinMenuRef.current && !skinMenuRef.current.contains(e.target as Node)) {
        setShowSkinDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
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

  const filteredSearchTickets = (issues || []).filter((t) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q) ||
      (t.client && t.client.toLowerCase().includes(q)) ||
      (t.owner && t.owner.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  return (
    <>
      {/* ==================== NEXT-GEN FLOATING DOCK HEADER ==================== */}
      <header className="w-full max-w-[1700px] mx-auto p-1.5 sm:p-2.5 sticky top-0 z-40 select-none">
        <div className="floating-nav rounded-2xl px-3 py-2 flex items-center justify-between gap-2 flex-nowrap overflow-x-auto custom-scrollbar">

          {/* RIGHT SIDE: BRAND & PRIMARY ACTIONS */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Sidebar Hamburger Trigger */}
            {onOpenMobileSidebar && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="lg:hidden p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition cursor-pointer"
                title="فتح القائمة الجانبية"
              >
                <i className="fa-solid fa-bars text-xs"></i>
              </button>
            )}

            {/* Desktop Sidebar Collapse Toggle */}
            {onToggleSidebarCollapse && (
              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                className="hidden lg:flex p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition cursor-pointer"
                title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              >
                <i className={`fa-solid fa-angles-right text-xs transition-transform ${isSidebarCollapsed ? 'rotate-180 text-indigo-400' : 'text-slate-400'}`}></i>
              </button>
            )}

            {/* New Ticket Button */}
            <button
              type="button"
              onClick={onOpenNewTicketModal}
              className="action-btn-glow flex items-center gap-1.5 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>تذكرة جديدة</span>
            </button>

            {/* Cloud Data Sync Button */}
            <button
              type="button"
              onClick={handleSyncClick}
              className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 whitespace-nowrap"
              title="جلب ومزامنة بيانات السحابة"
            >
              <i className={`fa-solid fa-arrows-rotate text-cyan-400 text-xs ${isSyncing ? 'fa-spin' : ''}`}></i>
              <span className="hidden sm:inline">جلب البيانات</span>
            </button>

            {/* Top Navigation Tabs: الرئيسية & سجل المشاكل & تقارير الأداء (Recharts) */}
            <div className="flex items-center gap-0.5 bg-slate-900/80 border border-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  currentTab === 'home'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="الصفحة الرئيسية وشاشة الترحيب"
              >
                <i className="fa-solid fa-house text-[11px] text-indigo-400"></i>
                <span className="hidden sm:inline">الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('issues')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  currentTab === 'issues'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="الانتقال إلى سجل المشاكل والبلاغات"
              >
                <i className="fa-solid fa-list-check text-[11px] text-cyan-400"></i>
                <span className="hidden sm:inline">سجل المشاكل</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('analytics')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer relative active:scale-95 whitespace-nowrap ${
                  currentTab === 'analytics'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.4)] border border-sky-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="لوحة تحكم تحليلية للمشاكل المسجلة باستخدام مكتبة Recharts"
              >
                <i className={`fa-solid fa-chart-pie text-[11px] ${currentTab === 'analytics' ? 'text-white' : 'text-cyan-400'}`}></i>
                <span className="font-bold">تقارير الأداء</span>
                {currentTab === 'analytics' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]"></span>
                )}
              </button>
            </div>

            {/* Live Cloud Status Pill */}
            <div
              onClick={onTriggerDemoToast}
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer select-none whitespace-nowrap"
              title="السحابة متصلة ومزامنة تلقائياً (انقر لتجربة التنبيه)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>السحابة متصلة</span>
            </div>

            {/* SLA Alert Badge if breached */}
            {breachedCount > 0 && (
              <button
                type="button"
                onClick={() => setCurrentTab('sla')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer whitespace-nowrap"
                title="تذاكر متأخرة عن موعد الـ SLA"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                <span>{breachedCount} متأخرة</span>
              </button>
            )}
          </div>

          {/* CENTER: SMART COMMAND / SEARCH BAR */}
          <div className="flex-1 min-w-[200px] max-w-xl mx-1">
            <div
              onClick={() => setIsSearchOpen(true)}
              className="command-search rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-slate-400 text-xs cursor-pointer w-full whitespace-nowrap"
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <i className="fa-solid fa-magnifying-glass text-indigo-400 text-xs shrink-0"></i>
                <span className="truncate text-slate-300 text-xs">ابحث عن تذكرة، عميل، أو أمر سريع...</span>
              </div>
              <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0">CTRL + K</kbd>
            </div>
          </div>

          {/* LEFT SIDE: CONTROLS & USER PROFILE */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme & Mode Selector Group */}
            <div className="relative" ref={skinMenuRef}>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-0.5 flex items-center gap-0.5">
                {/* Theme Dropdown */}
                <button
                  type="button"
                  onClick={() => setShowSkinDropdown(!showSkinDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-solid fa-gem text-cyan-400 text-[11px]"></i>
                  <span className="hidden sm:inline">
                    {appSkin === 'amethyst' && 'الياقوت'}
                    {appSkin === 'standard' && 'الكلاسيكي'}
                    {appSkin === 'cyberpunk' && 'السايبربانك'}
                    {appSkin === 'ocean' && 'المحيط'}
                  </span>
                  <i className="fa-solid fa-chevron-down text-[8px] text-slate-500"></i>
                </button>

                <div className="h-3.5 w-[1px] bg-slate-800"></div>

                {/* Day Mode Toggle */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    theme === 'dark' ? 'text-amber-400 hover:bg-amber-400/10' : 'text-indigo-400 hover:bg-indigo-400/10'
                  }`}
                  title={theme === 'dark' ? 'التحويل إلى الوضع النهاري' : 'التحويل إلى الوضع الليلي'}
                >
                  <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-[11px]' : 'fa-moon text-[11px]'}`}></i>
                  <span className="hidden md:inline">{theme === 'dark' ? 'النهاري' : 'الليلي'}</span>
                </button>
              </div>

              {/* Skin Dropdown Popover */}
              {showSkinDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800">اختر مظهر المنظومة:</div>
                  {[
                    { id: 'amethyst', label: 'الياقوت النيون 💎', color: 'text-cyan-400' },
                    { id: 'standard', label: 'الكلاسيكي 🏢', color: 'text-slate-200' },
                    { id: 'cyberpunk', label: 'السايبربانك 💖', color: 'text-pink-400' },
                    { id: 'ocean', label: 'المحيط الهادئ 🌊', color: 'text-sky-400' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onToggleSkin && onToggleSkin(s.id as any);
                        setShowSkinDropdown(false);
                      }}
                      className={`w-full text-right px-3 py-1.5 rounded-lg font-bold flex items-center justify-between transition cursor-pointer ${
                        appSkin === s.id
                          ? 'bg-indigo-500/20 text-cyan-300 border border-indigo-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className={s.color}>{s.label}</span>
                      {appSkin === s.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Badge */}
            <div className="relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition relative cursor-pointer active:scale-95"
                title="الإشعارات والتنبيهات"
              >
                <i className="fa-regular fa-bell text-xs"></i>
                <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-84 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 backdrop-blur-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <i className="fa-regular fa-bell text-indigo-400"></i>
                      <span>التنبيهات المباشرة ({notifications.length})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {onTriggerDemoToast && (
                        <button
                          type="button"
                          onClick={onTriggerDemoToast}
                          className="text-emerald-400 hover:bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="تجربة ظهور التنبيه السحابي الفوري"
                        >
                          <i className="fa-solid fa-signal animate-pulse text-emerald-400"></i>
                          <span>تجربة التنبيه 🌐</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearNotifications}
                          className="text-rose-400 hover:underline text-[10px] font-bold cursor-pointer"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-3 text-center space-y-2.5">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 shadow-inner">
                          <i className="fa-regular fa-bell-slash text-lg"></i>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200 text-xs">لا توجد إشعارات حالياً</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px] mx-auto">
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
                                ? 'cursor-pointer hover:border-indigo-400 hover:bg-slate-800/80 hover:shadow-xs group'
                                : ''
                            } ${
                              n.type === 'danger'
                                ? 'bg-rose-950/30 border-rose-900/60'
                                : n.type === 'warning'
                                ? 'bg-amber-950/30 border-amber-900/60'
                                : n.type === 'success'
                                ? 'bg-emerald-950/30 border-emerald-900/60'
                                : 'bg-slate-800/50 border-slate-700/60'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span
                                className={`font-bold flex items-center gap-1.5 text-xs leading-snug ${
                                  n.type === 'danger'
                                    ? 'text-rose-400'
                                    : n.type === 'warning'
                                    ? 'text-amber-400'
                                    : n.type === 'success'
                                    ? 'text-emerald-400'
                                    : 'text-indigo-400'
                                }`}
                              >
                                {ticketMatch && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block shrink-0"></span>
                                )}
                                <span>{n.title}</span>
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">{n.time}</span>
                                {onClearSingleNotification && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClearSingleNotification(n.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-md transition cursor-pointer"
                                    title="مسح هذا التنبيه"
                                  >
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {n.desc}
                            </p>

                            {/* Ticket Quick Link Badge */}
                            {ticketMatch && (
                              <div className="pt-1.5 mt-1 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                                <span className="font-mono font-bold bg-indigo-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">
                                  {ticketMatch}
                                </span>
                                <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-1">
                                  <span>انقر لفتح التذكرة مباشرة</span>
                                  <i className="fa-solid fa-arrow-left text-[10px]"></i>
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

            {/* Profile Card */}
            <div className="relative" ref={userMenuRef}>
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-1 px-1.5 rounded-xl cursor-pointer transition select-none"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  {currentUser.avatar || currentUser.name.charAt(0) || 'أ'}
                </div>
                <div className="hidden sm:flex flex-col text-right pl-0.5">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[85px]">{currentUser.name || 'أحمد العتيبي'}</span>
                  <span className="text-[8px] text-indigo-400 font-bold leading-tight uppercase">{currentUser.role || 'Admin'}</span>
                </div>
                <i className="fa-solid fa-chevron-down text-[8px] text-slate-500 px-0.5"></i>
              </div>

              {showUserDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                    <span>تبديل حساب المستخدم:</span>
                    <i className="fa-solid fa-lock text-slate-400 text-xs"></i>
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
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
                      className={`w-full text-right px-3 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                        currentUser.id === u.id
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {u.avatar || u.name.charAt(0)}
                        </span>
                        <span>{u.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {u.role}
                      </span>
                    </button>
                  ))}

                  {onLogout && (
                    <div className="pt-1.5 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl flex items-center justify-between text-rose-400 hover:bg-rose-950/40 transition font-bold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
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
      </header>

      {/* Smart Command & Search Modal (CTRL + K) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-magnifying-glass text-indigo-400 text-lg"></i>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن رقم التذكرة (INC-...)، اسم العميل، المشكلة..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto space-y-2">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  اكتب للبحث السريع في التذاكر والعملاء، أو اضغط <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">ESC</kbd> للإغلاق
                </div>
              ) : filteredSearchTickets.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  لم يتم العثور على أي نتائج مطابقة لـ "{searchQuery}"
                </div>
              ) : (
                filteredSearchTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      if (onSelectTicket) onSelectTicket(ticket.id);
                      setIsSearchOpen(false);
                    }}
                    className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-400">{ticket.id}</span>
                        <span className="text-white text-xs font-bold">{ticket.tag || ticket.desc}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{ticket.client || 'عميل'} • {ticket.status}</p>
                    </div>
                    <i className="fa-solid fa-arrow-left text-xs text-slate-500"></i>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Dedicated Navigation Bar (شريط التبويبات الفاخر - يتم إخفاؤه تلقائياً عند تفعيل القائمة الجانبية الفاخرة) */}
      {!hideSecondaryNav && (
        <div className="bg-[#090f1d]/95 dark:bg-[#070c18]/95 border-t border-b border-slate-800/80 px-4 py-2 select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Main Navigation Tabs - Single Line Overflow Scroll Without Wrapping */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* 1. Issues / Tickets List */}
              <button
                type="button"
                onClick={() => setCurrentTab('issues')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  currentTab === 'issues'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <ListTodo className={`w-3.5 h-3.5 ${currentTab === 'issues' ? 'text-white' : 'text-blue-400'}`} />
                <span className="whitespace-nowrap">سجل المشاكل والبلاغات</span>
              </button>

              {/* 2. Dashboard (Controlled by page.dashboard permission) */}
              {hasPermission(currentUser, 'page.dashboard') && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                    currentTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${currentTab === 'dashboard' ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="whitespace-nowrap">لوحة المؤشرات العامة</span>
                </button>
              )}

              {/* 3. SLA Management */}
              <button
                type="button"
                onClick={() => setCurrentTab('sla')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 relative ${
                  currentTab === 'sla'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${currentTab === 'sla' ? 'text-white' : 'text-amber-400'}`} />
                <span className="whitespace-nowrap">إدارة اتفاقيات SLA</span>
                {breachedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono font-black animate-pulse">
                    {breachedCount}
                  </span>
                )}
              </button>

              {/* Vertical Separator Divider */}
              <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

              {/* 4. Customer Portal */}
              <button
                type="button"
                onClick={() => setCurrentTab('customer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  currentTab === 'customer'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Globe className={`w-3.5 h-3.5 ${currentTab === 'customer' ? 'text-white' : 'text-purple-400'}`} />
                <span className="whitespace-nowrap">بوابة متابعة العميل</span>
              </button>

              {/* 5. CAB Board (Controlled by page.cab_board permission) */}
              {hasPermission(currentUser, 'page.cab_board') && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('cab')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                    currentTab === 'cab'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${currentTab === 'cab' ? 'text-white' : 'text-cyan-400'}`} />
                  <span className="whitespace-nowrap">اعتماد التغييرات (CAB)</span>
                </button>
              )}

              {/* Vertical Separator Divider */}
              {currentUser.role === 'Admin' && <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />}

              {/* 6. Analytics (Admin only) */}
              {currentUser.role === 'Admin' && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('analytics')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                    currentTab === 'analytics'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <BarChart3 className={`w-3.5 h-3.5 ${currentTab === 'analytics' ? 'text-white' : 'text-sky-400'}`} />
                  <span className="whitespace-nowrap">التحليلات والرسوم البيانية</span>
                </button>
              )}

              {/* 7. Admin View (Admin only) */}
              {currentUser.role === 'Admin' && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                    currentTab === 'admin'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${currentTab === 'admin' ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="whitespace-nowrap">لوحة الإدارة الشاملة</span>
                </button>
              )}
            </div>

            {/* Fixed "دليل وخريطة الأقسام" Button on the side - Controlled by page.sections_hub permission */}
            {hasPermission(currentUser, 'page.sections_hub') && (
              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSectionsHubModal) onOpenSectionsHubModal();
                    else setShowSectionsHub(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 text-xs font-bold transition flex items-center gap-2 border border-indigo-700/60 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                  title="عرض خريطة ودليل الأقسام الشامل لكافة خدمات المنظومة"
                >
                  <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                  <span>دليل وخريطة الأقسام</span>
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono font-black">
                    {currentUser.role === 'Admin' ? '7 أقسام' : '4 أقسام'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
      {/* Sections Directory & Workspaces Hub Modal (نافذة مدمجة مصغرة جداً تناسب الشاشة تماماً بدون شريط علوي) */}
      {showSectionsHub && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 animate-fadeIn">
          <div className="bg-[#080e1a] border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-2.5 space-y-2 text-right my-auto">
            {/* Modal Simple Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Compass className="w-3 h-3 animate-spin-slow" />
                </div>
                <h3 className="font-extrabold text-[11px] sm:text-xs text-white flex items-center gap-1.5">
                  <span>بطاقات التنقل وخريطة الأقسام ({SYSTEM_SECTIONS.length} أقسام)</span>
                  <span className="text-[8.5px] bg-blue-950 text-blue-300 border border-blue-800/80 px-1.5 py-0.2 rounded-full font-mono font-bold">
                    مصغر ذكي ⚡
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowSectionsHub(false)}
                className="w-5 h-5 rounded-md bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60 text-xs font-bold shrink-0"
                title="إغلاق"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Navigation Cards Container: Ultra Compact Nano Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                {
                  id: 'issues' as const,
                  title: 'سجل المشاكل والبلاغات',
                  badgeText: `${activeTicketsCount} تذكرة`,
                  badgeStyle: 'bg-[#13284f] border-[#1e40af]/60 text-blue-300',
                  iconBoxStyle: 'bg-[#132c54] border-[#1d4ed8]/50 text-blue-400',
                  icon: ListTodo,
                  adminOnly: false,
                },
                {
                  id: 'analytics' as const,
                  title: 'التحليلات والرسوم',
                  badgeText: 'محدث اليوم',
                  badgeStyle: 'bg-[#182235] border-slate-700/70 text-slate-300',
                  iconBoxStyle: 'bg-[#241738] border-purple-800/50 text-purple-400',
                  icon: BarChart3,
                  adminOnly: true,
                },
                {
                  id: 'dashboard' as const,
                  title: 'لوحة المؤشرات العامة',
                  badgeText: '98.5% أداء',
                  badgeStyle: 'bg-[#14292e] border-teal-800/50 text-teal-300',
                  iconBoxStyle: 'bg-[#112d28] border-emerald-700/50 text-emerald-400',
                  icon: LayoutDashboard,
                  adminOnly: true,
                },
                {
                  id: 'sla' as const,
                  title: 'إدارة اتفاقيات SLA',
                  badgeText: breachedCount > 0 ? `${breachedCount} متأخرة` : '100% التزام',
                  badgeStyle: breachedCount > 0 ? 'bg-[#3b1515] border-rose-800/60 text-rose-300' : 'bg-[#2c1d10] border-amber-800/50 text-amber-300',
                  iconBoxStyle: breachedCount > 0 ? 'bg-[#3b1515] border-rose-700/50 text-rose-400' : 'bg-[#33200d] border-amber-700/50 text-amber-400',
                  icon: Clock,
                  adminOnly: false,
                },
                {
                  id: 'customer' as const,
                  title: 'بوابة العميل',
                  badgeText: 'خدمة ذاتية',
                  badgeStyle: 'bg-[#26153b] border-purple-800/50 text-purple-300',
                  iconBoxStyle: 'bg-[#2b1338] border-pink-700/50 text-pink-400',
                  icon: Globe,
                  adminOnly: false,
                },
                {
                  id: 'cab' as const,
                  title: 'اعتماد التغييرات (CAB)',
                  badgeText: 'إدارة مخاطر',
                  badgeStyle: 'bg-[#12283a] border-cyan-800/50 text-cyan-300',
                  iconBoxStyle: 'bg-[#0f2938] border-cyan-700/50 text-cyan-400',
                  icon: Layers,
                  adminOnly: false,
                },
                {
                  id: 'admin' as const,
                  title: 'لوحة الإدارة والضبط',
                  badgeText: 'تحكم كامل',
                  badgeStyle: 'bg-[#162a22] border-emerald-800/50 text-emerald-300',
                  iconBoxStyle: 'bg-[#132e22] border-emerald-700/50 text-emerald-400',
                  icon: ShieldCheck,
                  adminOnly: true,
                },
              ].map((card) => {
                const isCurrent = currentTab === card.id;
                const IconComponent = card.icon;
                const isRestricted = card.adminOnly && currentUser.role !== 'Admin';

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (isRestricted) return;
                      setCurrentTab(card.id);
                      setShowSectionsHub(false);
                    }}
                    className={`p-1.5 rounded-lg transition-all duration-150 flex flex-col justify-between select-none relative ${
                      isRestricted
                        ? 'opacity-50 bg-[#080d19] border border-slate-800/80 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-[#0e1b33] border-2 border-blue-500 shadow-xs ring-1 ring-blue-500/50 cursor-pointer'
                        : 'bg-[#0c1322] border border-slate-800/90 hover:border-slate-700 hover:bg-[#0e1628] cursor-pointer'
                    }`}
                  >
                    {/* Header Row: Badge on Left, Icon Box on Right */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`px-1 py-0.2 rounded text-[8px] font-bold border shrink-0 ${card.badgeStyle}`}>
                        {card.badgeText}
                      </span>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${card.iconBoxStyle}`}>
                        <IconComponent className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    {/* Body: Title */}
                    <div className="mb-1 text-right">
                      <h4 className="text-[10px] font-extrabold text-white group-hover:text-blue-400 transition-colors truncate">
                        {card.title}
                      </h4>
                    </div>

                    {/* Footer Row: Action Text on Right, Arrow on Left */}
                    <div className="flex items-center justify-between text-[8px] font-bold pt-1 border-t border-slate-800/70">
                      {isRestricted ? (
                        <span className="text-rose-400 text-[8px] flex items-center gap-1">
                          <Lock className="w-2 h-2" />
                          <span>يتطلب Admin</span>
                        </span>
                      ) : (
                        <>
                          <ArrowLeft className={`w-2 h-2 rtl:rotate-0 transition-transform ${isCurrent ? 'text-blue-400 -translate-x-0.5' : 'text-slate-400 group-hover:text-white'}`} />
                          <span className={isCurrent ? 'text-blue-400 font-bold' : 'text-slate-400 group-hover:text-white'}>
                            {isCurrent ? 'القسم الحالي' : 'انتقال'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
              <span>💡 انقر على أي قسم للانتقال المباشر.</span>
              <button
                type="button"
                onClick={() => setShowSectionsHub(false)}
                className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer border border-slate-700/60 text-[10px]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
