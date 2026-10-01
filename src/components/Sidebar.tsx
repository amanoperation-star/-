import React, { useState } from 'react';
import { 
  Home,
  ListTodo, 
  LayoutDashboard, 
  Clock, 
  Globe, 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Compass, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Lock, 
  User, 
  Radio, 
  Headset, 
  Briefcase, 
  Cpu, 
  LifeBuoy, 
  Sparkles, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { AppUser, Issue, CabBusinessActivity, GeneralSettings } from '../types';
import { ActiveUserPresence, SyncConnectionStatus } from '../utils/realtimeSync';
import { hasPermission } from '../utils/permissions';

export interface SidebarProps {
  currentTab: 'home' | 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics';
  setCurrentTab: (tab: 'home' | 'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics') => void;
  currentUser: AppUser;
  users: AppUser[];
  onSwitchUser: (user: AppUser) => void;
  onLogout?: () => void;
  issues: Issue[];
  cabActivities?: CabBusinessActivity[];
  breachedCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isVisible?: boolean;
  onCloseSidebar?: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewTicketModal: () => void;
  onOpenSectionsHub?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  realtimeStatus?: SyncConnectionStatus;
  onlineUsers?: ActiveUserPresence[];
  totalConnections?: number;
  generalSettings?: GeneralSettings;
  appSkin?: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean';
}

interface NavItemDef {
  id: 'home' | 'issues' | 'dashboard' | 'sla' | 'customer' | 'cab' | 'analytics' | 'admin';
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  activeColorClass: string;
  badge?: string | number | null;
  badgeType?: 'danger' | 'info' | 'default';
  adminOnly?: boolean;
  permission?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSwitchUser,
  onLogout,
  issues = [],
  cabActivities = [],
  breachedCount = 0,
  isCollapsed,
  onToggleCollapse,
  isVisible = true,
  onCloseSidebar,
  isMobileOpen,
  onCloseMobile,
  onOpenNewTicketModal,
  onOpenSectionsHub,
  theme,
  onToggleTheme,
  realtimeStatus = 'connected',
  onlineUsers = [],
  totalConnections = 1,
  generalSettings,
  appSkin = 'standard',
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState('');

  const activeTicketsCount = issues.filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Closed'
  ).length;

  const pendingCabCount = cabActivities.filter(
    (a) => a.status === 'Pending Approval' || a.status === 'Draft'
  ).length;

  const navGroups: {
    groupTitle: string;
    items: NavItemDef[];
  }[] = [
    {
      groupTitle: 'الرئيسية والاستكشاف',
      items: [
        {
          id: 'home',
          title: 'الصفحة الرئيسية',
          subtitle: 'شاشة الترحيب ومؤشرات المنظومة',
          icon: Home,
          color: 'blue',
          activeColorClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 border border-blue-400/30',
        },
      ],
    },
    {
      groupTitle: 'العمليات والتشغيل',
      items: [
        {
          id: 'issues',
          title: 'سجل المشاكل والبلاغات',
          subtitle: 'إدارة وتتبع دورة حياة التذاكر الفنية',
          icon: ListTodo,
          color: 'blue',
          activeColorClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
          badge: activeTicketsCount > 0 ? activeTicketsCount : null,
          badgeType: 'info',
        },
        {
          id: 'customer',
          title: 'بوابة متابعة العميل',
          subtitle: 'الخدمة الذاتية وتواصل العملاء المباشر',
          icon: Globe,
          color: 'purple',
          activeColorClass: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
        },
        {
          id: 'cab',
          title: 'اعتماد التغييرات (CAB)',
          subtitle: 'جدولة أعمال الصيانة ومجلس التغيير',
          icon: Layers,
          color: 'cyan',
          activeColorClass: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30',
          badge: pendingCabCount > 0 ? pendingCabCount : null,
          badgeType: 'default',
          permission: 'page.cab_board',
        },
      ],
    },
    {
      groupTitle: 'المتابعة والحوكمة',
      items: [
        {
          id: 'dashboard',
          title: 'لوحة المؤشرات العامة',
          subtitle: 'ملخص رقمي لكفاءة الفريق والـ KPI',
          icon: LayoutDashboard,
          color: 'indigo',
          activeColorClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
          permission: 'page.dashboard',
        },
        {
          id: 'sla',
          title: 'إدارة اتفاقيات SLA',
          subtitle: 'رصد المواعيد والتنبيهات الاستباقية',
          icon: Clock,
          color: 'amber',
          activeColorClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
          badge: breachedCount > 0 ? `${breachedCount} متأخرة` : null,
          badgeType: 'danger',
        },
        {
          id: 'analytics',
          title: 'التحليلات والرسوم البيانية',
          subtitle: 'تقارير إحصائية وتوزيع أحمال العمل',
          icon: BarChart3,
          color: 'sky',
          activeColorClass: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
          adminOnly: true,
        },
      ],
    },
    {
      groupTitle: 'الإدارة والتحكم',
      items: [
        {
          id: 'admin',
          title: 'لوحة الإدارة والضبط الشامل',
          subtitle: 'المستخدمين، الصلاحيات، والربط السحابي',
          icon: ShieldCheck,
          color: 'emerald',
          activeColorClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
          adminOnly: true,
        },
      ],
    },
  ];

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

  const handleItemClick = (id: any) => {
    setCurrentTab(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const handleConfirmSwitch = () => {
    if (!targetUser) return;
    const requiredPassword = targetUser.password || '123456';
    if (switchPasswordInput === requiredPassword) {
      onSwitchUser(targetUser);
      setShowSwitchModal(false);
      setTargetUser(null);
      setSwitchPasswordInput('');
      setSwitchPasswordError('');
    } else {
      setSwitchPasswordError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell (Right-aligned for RTL) */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 flex flex-col bg-white dark:bg-[#090f1d] border-l border-slate-200 dark:border-slate-800/90 shadow-2xl lg:shadow-xs transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : isVisible
            ? 'translate-x-full lg:translate-x-0'
            : 'translate-x-full lg:translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Sidebar Header: Brand & Collapse Toggle */}
        <div className="h-16 px-4 border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getGradientClass()} flex items-center justify-center text-white shadow-md shrink-0`}
            >
              {getLogoIcon()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {generalSettings?.appName || 'منظومة إدارة البلاغات'}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                    {generalSettings?.appBadge || 'Enterprise Pro'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v9.4</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center transition cursor-pointer border border-slate-200 dark:border-slate-700/60 active:scale-95 shadow-2xs shrink-0"
              title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-4 h-4 rtl:rotate-0" />
              ) : (
                <ChevronRight className="w-4 h-4 rtl:rotate-0" />
              )}
            </button>

            {/* Desktop Close/Hide Sidebar Button */}
            {onCloseSidebar && !isCollapsed && (
              <button
                type="button"
                onClick={onCloseSidebar}
                className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 items-center justify-center transition cursor-pointer border border-slate-200 dark:border-slate-700/60 active:scale-95 shadow-2xs shrink-0"
                title="إخفاء القائمة الجانبية وعرض الشاشة بالكامل"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex lg:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 items-center justify-center transition cursor-pointer"
            title="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch CTA Button */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <button
            type="button"
            onClick={onOpenNewTicketModal}
            className={`w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              isCollapsed ? 'h-11 px-0' : 'py-2.5 px-3'
            }`}
            title="تسجيل تذكرة وبلاغ فني جديد"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            {!isCollapsed && <span className="truncate">تسجيل تذكرة جديدة</span>}
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5 text-xs">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly && currentUser.role !== 'Admin') return false;
              if (item.permission && !hasPermission(currentUser, item.permission)) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {/* Group Label */}
                {!isCollapsed ? (
                  <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>{group.groupTitle}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  </div>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/80 my-2 mx-2" />
                )}

                {/* Items */}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = currentTab === item.id;
                    const IconComponent = item.icon;

                    return (
                      <div key={item.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full rounded-2xl transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                            isCollapsed
                              ? 'justify-center p-2.5 h-12'
                              : 'px-3 py-2.5'
                          } ${
                            isActive
                              ? `${item.activeColorClass} font-black`
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white font-bold'
                          }`}
                        >
                          <div
                            className={`shrink-0 flex items-center justify-center ${
                              isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          {!isCollapsed && (
                            <div className="flex-1 text-right min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate text-xs leading-tight">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                                      item.badgeType === 'danger'
                                        ? 'bg-rose-500 text-white animate-pulse'
                                        : item.badgeType === 'info'
                                        ? isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  isActive
                                    ? 'text-white/80'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            </div>
                          )}

                          {/* Collapsed Active Indicator Dot */}
                          {isCollapsed && isActive && (
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-white"></span>
                          )}

                          {/* Collapsed Badge Indicator */}
                          {isCollapsed && item.badge && (
                            <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                        </button>

                        {/* Floating Tooltip in Collapsed Mode */}
                        {isCollapsed && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-[calc(100%+10px)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 w-52 bg-slate-900 text-white p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 text-right">
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="font-bold text-xs text-white">{item.title}</span>
                              {item.badge && (
                                <span className="bg-rose-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-300 leading-tight">
                              {item.subtitle}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quick System Directory Shortcut */}
          {hasPermission(currentUser, 'page.sections_hub') && onOpenSectionsHub && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  onOpenSectionsHub();
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full rounded-2xl transition flex items-center gap-3 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 font-bold ${
                  isCollapsed ? 'justify-center p-2.5 h-12' : 'px-3 py-2.5'
                }`}
                title="عرض خريطة ودليل الأقسام الشامل"
              >
                <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">دليل وخريطة الأقسام</span>
                      <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                        {currentUser.role === 'Admin' ? '7' : '4'}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-500/80 block truncate">
                      استعراض كافة خدمات المنظومة
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Realtime Status Indicator Card */}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {realtimeStatus === 'connected' ? 'السحابة متصلة لحظياً' : 'جاري الاتصال...'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {totalConnections} متصل
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={`حالة المزامنة السحابية: ${realtimeStatus === 'connected' ? 'متصل' : 'جاري الاتصال'}`}
              ></span>
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Card & Quick Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate-950/60 shrink-0 relative">
          <div className="flex items-center justify-between gap-2">
            {/* User Info Capsule */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0 cursor-pointer hover:opacity-90 transition active:scale-95"
                title="تبديل المستخدم"
              >
                {currentUser.avatar}
              </button>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role} • {currentUser.department}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions (Theme & Logout) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                title={theme === 'dark' ? 'التحويل للوضع النهاري ☀️' : 'التحويل للوضع الليلي 🌙'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {onLogout && !isCollapsed && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* User Switcher Dropdown Popover */}
          {showUserDropdown && (
            <div className="absolute bottom-full right-2 left-2 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>تبديل حساب المستخدم:</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
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
                    className={`w-full text-right px-3 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                      currentUser.id === u.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {u.avatar}
                      </span>
                      <span className="font-bold">{u.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Switch User Password Modal */}
      {showSwitchModal && targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-right animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                <span>التحقق الأمني للتبديل</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-2">
              <span className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xl mx-auto shadow-lg">
                {targetUser.avatar}
              </span>
              <div>
                <p className="font-black text-sm text-slate-900 dark:text-white">{targetUser.name}</p>
                <p className="text-xs text-slate-500">{targetUser.role} • {targetUser.department}</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أدخل كلمة مرور الحساب للمتابعة:
                </label>
                <input
                  type="password"
                  value={switchPasswordInput}
                  onChange={(e) => {
                    setSwitchPasswordInput(e.target.value);
                    setSwitchPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmSwitch();
                  }}
                  placeholder="كلمة المرور (الافتراضية: 123456)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  autoFocus
                />
                {switchPasswordError && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1">{switchPasswordError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSwitch}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  تأكيد الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
