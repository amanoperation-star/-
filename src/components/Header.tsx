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
  ExternalLink
} from 'lucide-react';
import { AppUser, NotificationItem, SoundSettings } from '../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'issues' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'issues' | 'admin') => void;
  currentUser: AppUser;
  users: AppUser[];
  onSwitchUser: (user: AppUser) => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSwitchUser,
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
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCloudMenu, setShowCloudMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const cloudMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cloudMenuRef.current && !cloudMenuRef.current.contains(e.target as Node)) {
        setShowCloudMenu(false);
      }
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-xs dark:shadow-xl transition-colors duration-150">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                منظومة تتبع وإدارة المشاكل
              </h1>
              <span className="hidden md:inline-block bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Enterprise Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              SLA Watcher • CSAT Metrics • Accurate Work Timer & Activity Trail
            </p>
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

          {/* Cloud Badge & Quick Control Button */}
          <div className="relative" ref={cloudMenuRef}>
            <button
              onClick={() => setShowCloudMenu(!showCloudMenu)}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold border transition-all duration-200 ${
                supabaseConnected
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/50'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 opacity-70 hover:opacity-100'
              }`}
              title={
                supabaseConnected
                  ? 'السحابة مفعلة ومتصلة 🟢 (ينور أخضر - انقر لعرض الخيارات أو المزامنة)'
                  : 'السحابة مطفية وغير مفعلة ⚪ (انقر للتفعيل والربط)'
              }
              aria-label="حالة الاتصال السحابي"
            >
              {supabaseConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Cloud className="w-4 h-4 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  <span className="hidden xl:inline font-black text-[11px]">سحابة نشطة</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="hidden xl:inline text-[11px]">مطفية</span>
                </>
              )}
            </button>

            {/* Cloud Quick Control Popover */}
            {showCloudMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 text-xs space-y-3 animate-scaleUp">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${supabaseConnected ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                      {supabaseConnected ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {supabaseConnected ? 'السحابة: متصلة 🟢 (منوّرة)' : 'السحابة: مطفية ⚪ (غير مفعلة)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {supabaseConnected ? 'Supabase Live Sync' : 'البيانات مخزنة محلياً في المتصفح'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCloudMenu(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {supabaseConnected ? (
                  <div className="space-y-2.5">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-emerald-800 dark:text-emerald-200 font-bold">حالة المزامنة:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          نشطة وتعمل
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                        يتم حفظ ومزامنة التذاكر والسجلات الحية مع قاعدة Supabase.
                      </p>
                    </div>

                    {onSyncSupabaseNow && (
                      <button
                        onClick={() => {
                          onSyncSupabaseNow();
                          setShowCloudMenu(false);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow shadow-emerald-600/20 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>مزامنة التذاكر السحابية الآن</span>
                      </button>
                    )}

                    <div className="flex gap-2 pt-1">
                      {onNavigateToSupabaseSettings && (
                        <button
                          onClick={() => {
                            onNavigateToSupabaseSettings();
                            setShowCloudMenu(false);
                          }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          <span>إعدادات السحابة</span>
                        </button>
                      )}
                      {onToggleSupabaseConnected && (
                        <button
                          onClick={() => {
                            onToggleSupabaseConnected();
                            setShowCloudMenu(false);
                          }}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1"
                          title="إيقاف المزامنة وإطفاء الزر"
                        >
                          <Power className="w-3 h-3" />
                          <span>إطفاء الزر</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      الزر مطفأ حالياً والبيانات تعمل بأمان تام محلياً. لتشغيل المزامنة وإضاءة الزر بالأخضر 🟢:
                    </p>
                    
                    {onToggleSupabaseConnected && (
                      <button
                        onClick={() => {
                          onToggleSupabaseConnected();
                          setShowCloudMenu(false);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow shadow-emerald-600/20 active:scale-95 text-xs"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>تشغيل السحابة (ينور أخضر 🟢)</span>
                      </button>
                    )}

                    {onNavigateToSupabaseSettings && (
                      <button
                        onClick={() => {
                          onNavigateToSupabaseSettings();
                          setShowCloudMenu(false);
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        <span>فتح إعدادات ومفاتيح Supabase في لوحة الإدمن</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
                <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  تبديل حساب المستخدم (Simulate Roles):
                </p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl flex items-center justify-between transition ${
                      currentUser.id === u.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
    </header>
  );
};
