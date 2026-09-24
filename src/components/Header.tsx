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
  LogOut
} from 'lucide-react';
import { AppUser, NotificationItem, SoundSettings, GeneralSettings } from '../types';
import { ActiveUserPresence, SyncConnectionStatus } from '../utils/realtimeSync';

interface HeaderProps {
  currentTab: 'dashboard' | 'issues' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'issues' | 'admin') => void;
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
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onSelectTicket?: (ticketId: string) => void;
  onOpenNewTicketModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  generalSettings?: GeneralSettings;
  realtimeStatus?: SyncConnectionStatus;
  onlineUsers?: ActiveUserPresence[];
  totalConnections?: number;
  onRefreshRealtime?: () => void;
}

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
  notifications,
  onClearNotifications,
  onSelectTicket,
  onOpenNewTicketModal,
  theme,
  onToggleTheme,
  generalSettings,
  realtimeStatus = 'connected',
  onlineUsers = [],
  totalConnections = 1,
  onRefreshRealtime,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 gap-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة التحكم</span>
          </button>
          <button
            onClick={() => setCurrentTab('issues')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              currentTab === 'issues'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>سجل المشاكل</span>
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>لوحة الإدمن</span>
          </button>
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
                  setCurrentTab('issues');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              title={bannerDismissed ? 'انقر لعرض تفاصيل تنبيه المتأخرات' : 'انقر للانتقال للتذاكر المتأخرة'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>{breachedCount} متأخرة</span>
            </button>
          )}

          {/* Day / Night Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm text-xs font-bold"
            title={theme === 'dark' ? 'التحويل إلى الوضع النهاري (Light Mode)' : 'التحويل إلى الوضع الليلي (Dark Mode)'}
            aria-label="تبديل مظهر العرض"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>الوضع الليلي</span>
              </>
            )}
          </button>

          {/* Cloud Connection Light Indicator (منورة في حالة الاتصال بالسحابة / مطفية في حالة عدم الاتصال) */}
          {realtimeStatus === 'connected' || supabaseConnected ? (
            <button
              onClick={onNavigateToSupabaseSettings}
              className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300 bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55)] ring-1 ring-emerald-400/50 cursor-pointer"
              title="متصل بالسحابة اللحظية (العلامة منورة 🟢) - انقر لعرض تفاصيل المزامنة في الإعدادات"
              aria-label="حالة الاتصال السحابي: متصل (منورة)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-4 h-4 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse" />
              <span className="hidden xl:inline font-black text-[11px] text-emerald-600 dark:text-emerald-300">متصل</span>
            </button>
          ) : realtimeStatus === 'connecting' ? (
            <button
              onClick={onNavigateToSupabaseSettings}
              className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300 bg-amber-500/15 border border-amber-500 text-amber-600 dark:text-amber-400 cursor-pointer"
              title="جارِ الاتصال بالسحابة..."
              aria-label="حالة الاتصال السحابي: جارِ الاتصال"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="hidden xl:inline text-[11px]">جارِ الاتصال</span>
            </button>
          ) : (
            <button
              onClick={onNavigateToSupabaseSettings}
              className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 opacity-50 hover:opacity-80 shadow-none cursor-pointer"
              title="غير متصل بالسحابة (العلامة مطفية) - انقر لعرض تفاصيل المزامنة في الإعدادات"
              aria-label="حالة الاتصال السحابي: غير متصل (مطفية)"
            >
              <span className="inline-flex rounded-full h-2 w-2 bg-slate-400 dark:bg-slate-600"></span>
              <WifiOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="hidden xl:inline text-[11px]">مطفية</span>
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
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="text-rose-500 hover:underline text-[10px] font-bold"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">لا توجد إشعارات جديدة</p>
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
                          className={`p-2.5 rounded-xl border space-y-1 transition duration-150 ${
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
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-bold flex items-center gap-1.5 ${
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
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block"></span>
                              )}
                              <span>{n.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
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
                onClick={() => setCurrentTab('issues')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 active:scale-95 ${style.button}`}
              >
                <span>عرض المتأخرات</span>
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
    </header>
  );
};
