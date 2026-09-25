import React, { useState } from 'react';
import { 
  Users, 
  Tag as TagIcon, 
  Volume2, 
  FileSpreadsheet, 
  FolderTree, 
  Zap, 
  Cloud, 
  Star, 
  History, 
  Plus, 
  Trash2, 
  Play, 
  Download, 
  Check, 
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Sliders,
  Database,
  Radio,
  Globe,
  RefreshCw,
  Wifi,
  WifiOff,
  Lock,
  Eye,
  EyeOff,
  X,
  Copy,
  CheckCircle2,
  ExternalLink,
  Info,
  Key,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Layers,
  Activity,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { AppUser, CategoryRule, SoundSettings, SupabaseConfig, AuditLog, Issue, Priority, GeneralSettings, SystemBackupData } from '../types';
import { SyncConnectionStatus, ActiveUserPresence } from '../utils/realtimeSync';
import { exportTicketsToCSV, exportTicketsToJSON } from '../utils/export';
import { ALL_PERMISSIONS, getDefaultPermissionsForRole } from '../utils/permissions';
import { CategoriesManagementView } from './CategoriesManagementView';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { BackupRestoreTab } from './BackupRestoreTab';
import { ScheduledReportsView } from './ScheduledReportsView';

interface AdminViewProps {
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPermissions: (userId: string, permissions: string[]) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  tags: string[];
  onAddTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  categories: CategoryRule[];
  onAddCategory: (category: Omit<CategoryRule, 'id'>) => void;
  onUpdateCategory: (category: CategoryRule) => void;
  onDeleteCategory: (categoryId: string) => void;
  onBulkDeleteCategories: (categoryIds: string[]) => void;
  onToggleCategoryActive?: (categoryId: string, active: boolean) => void;
  onBulkToggleCategoryActive?: (categoryIds: string[], active: boolean) => void;
  onUpdateSlaRules: (categoryId: string, rules: Record<Priority, number>) => void;
  cannedResponses: string[];
  onAddCannedResponse: (text: string) => void;
  onDeleteCannedResponse: (index: number) => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  supabaseConfig: SupabaseConfig;
  onSaveSupabaseConfig: (url: string, key: string) => void;
  onSyncSupabaseNow: () => void;
  onPullSupabaseNow?: () => void;
  onTestSupabaseConnection?: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  auditLogs: AuditLog[];
  onClearAuditLogs: () => void;
  issues: Issue[];
  generalSettings?: GeneralSettings;
  onUpdateGeneralSettings?: (settings: GeneralSettings) => void;
  onRestoreBackup?: (backup: SystemBackupData, mode: 'overwrite' | 'merge') => void;
  onResetSystemToDefault?: () => void;
  initialTab?: 'general' | 'backup' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit';
  realtimeStatus?: SyncConnectionStatus;
  onlineUsers?: ActiveUserPresence[];
  totalConnections?: number;
  onRefreshRealtime?: () => void;
  currentUser?: AppUser;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  onAddUser,
  onDeleteUser,
  onUpdateUserPermissions,
  onUpdateUserPassword,
  tags,
  onAddTag,
  onDeleteTag,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBulkDeleteCategories,
  onToggleCategoryActive,
  onBulkToggleCategoryActive,
  onUpdateSlaRules,
  cannedResponses,
  onAddCannedResponse,
  onDeleteCannedResponse,
  soundSettings,
  onUpdateSoundSettings,
  supabaseConfig,
  onSaveSupabaseConfig,
  onSyncSupabaseNow,
  onPullSupabaseNow,
  onTestSupabaseConnection,
  auditLogs,
  onClearAuditLogs,
  issues,
  generalSettings,
  onUpdateGeneralSettings,
  onRestoreBackup,
  onResetSystemToDefault,
  initialTab,
  realtimeStatus = 'connected',
  onlineUsers = [],
  totalConnections = 1,
  onRefreshRealtime,
  currentUser,
}) => {
  const [adminTab, setAdminTab] = useState<'general' | 'backup' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit'>(
    initialTab || 'general'
  );

  React.useEffect(() => {
    if (initialTab) {
      setAdminTab(initialTab);
    }
  }, [initialTab]);

  // New Tag State
  const [newTagInput, setNewTagInput] = useState('');

  // New User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Supervisor' | 'Agent'>('Agent');
  const [newUserDept, setNewUserDept] = useState('الدعم الفني والعمليات');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    getDefaultPermissionsForRole('Agent')
  );

  // Edit Existing User Permissions Modal
  const [permissionModalUser, setPermissionModalUser] = useState<AppUser | null>(null);
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([]);

  // Edit Existing User Password Modal
  const [passwordModalUser, setPasswordModalUser] = useState<AppUser | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // New Canned Response State
  const [newCannedInput, setNewCannedInput] = useState('');

  // Supabase Inputs
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig.key || '');
  const [showSbKey, setShowSbKey] = useState(false);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Sound URL state
  const [soundUrlInput, setSoundUrlInput] = useState(soundSettings.alarmUrl);

  const handleRoleChange = (role: 'Admin' | 'Supervisor' | 'Agent') => {
    setNewUserRole(role);
    setSelectedPermissions(getDefaultPermissionsForRole(role));
  };

  const handleTestSound = () => {
    try {
      const audio = new Audio(soundSettings.alarmUrl);
      audio.volume = soundSettings.volume || 0.8;
      audio.play();
    } catch {
      alert('تعذر تشغيل الصوت، تأكد من صحة الرابط وسماح المتصفح بالصوت.');
    }
  };

  const handleSaveSound = () => {
    onUpdateSoundSettings({
      ...soundSettings,
      alarmUrl: soundUrlInput,
    });
    alert('تم حفظ إعدادات الصوت والشكل بنجاح!');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserEmail.trim()) {
      alert('يرجى ملء جميع بيانات المستخدم!');
      return;
    }
    onAddUser({
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: newUserDept,
      avatar: newUserName.trim().charAt(0),
      permissions: selectedPermissions,
      password: newUserPassword.trim() || '123456',
    });
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('123456');
    setSelectedPermissions(getDefaultPermissionsForRole('Agent'));
    setShowAddUserModal(false);
  };

  const handleSaveUserPermissions = () => {
    if (!permissionModalUser) return;
    if (onUpdateUserPermissions) {
      onUpdateUserPermissions(permissionModalUser.id, editUserPermissions);
    }
    setPermissionModalUser(null);
  };

  const handleSaveUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!editPasswordInput.trim()) {
      alert('يرجى إدخال كلمة المرور الجديدة!');
      return;
    }
    if (onUpdateUserPassword) {
      onUpdateUserPassword(passwordModalUser.id, editPasswordInput.trim());
    }
    setPasswordModalUser(null);
  };

  // Layout mode: 'sidebar' (default enterprise split) vs 'ribbon' (top cards deck)
  const [navLayout, setNavLayout] = useState<'sidebar' | 'ribbon'>(() => {
    try {
      const saved = localStorage.getItem('ADMIN_VIEW_LAYOUT');
      if (saved === 'sidebar' || saved === 'ribbon') return saved;
    } catch {}
    return 'sidebar';
  });

  const handleSelectNavLayout = (layout: 'sidebar' | 'ribbon') => {
    setNavLayout(layout);
    try {
      localStorage.setItem('ADMIN_VIEW_LAYOUT', layout);
    } catch {}
  };

  // Search input within Admin Settings
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Performance & Key Metrics
  const ratedIssues = issues.filter((i) => i.csat && i.csat > 0);
  const avgCsat =
    ratedIssues.length > 0
      ? (ratedIssues.reduce((acc, curr) => acc + curr.csat, 0) / ratedIssues.length).toFixed(1)
      : '4.8';

  // Grouped Navigation Data for Professional Organization
  const adminNavGroups = [
    {
      groupTitle: 'إعدادات النظام والبيانات',
      groupKey: 'system',
      icon: Database,
      items: [
        {
          id: 'general',
          label: 'الإعدادات العامة والهوية',
          desc: 'اسم المنظومة، الشعار، والخيارات الأساسية',
          icon: Sliders,
          badge: 'عام',
          badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
        },
        {
          id: 'backup',
          label: 'النسخ الاحتياطي والاستعادة',
          desc: 'تصدير واستيراد قاعدة البيانات JSON',
          icon: Database,
          badge: 'JSON',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
        },
        {
          id: 'supabase',
          label: 'المزامنة السحابية (Supabase)',
          desc: 'ربط السحابة، المفاتيح، والنسخ الحي',
          icon: Cloud,
          badge: supabaseConfig.connected ? 'متصل 🟢' : 'غير متصل ⚪',
          badgeColor: supabaseConfig.connected
            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
        },
      ],
    },
    {
      groupTitle: 'فريق العمل والأمان',
      groupKey: 'access',
      icon: Users,
      items: [
        {
          id: 'users',
          label: 'إدارة الحسابات والموظفين',
          desc: 'إضافة وتعديل المستخدمين والصلاحيات',
          icon: Users,
          badge: `${users.length} موظف`,
          badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
        },
        {
          id: 'audit',
          label: 'سجل التدقيق الأمني (Audit)',
          desc: 'تتبع كافة الحركات والعمليات بالوقت',
          icon: History,
          badge: `${auditLogs.length} سجل`,
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        },
      ],
    },
    {
      groupTitle: 'قواعد التشغيل و SLA',
      groupKey: 'rules',
      icon: FolderTree,
      items: [
        {
          id: 'categories',
          label: 'الأقسام وقواعد SLA',
          desc: 'توجيه البلاغات وفرق الدعم والمهل',
          icon: FolderTree,
          badge: `${categories.length} قسم`,
          badgeColor: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
        },
        {
          id: 'canned',
          label: 'الردود السريعة الذكية',
          desc: 'قوالب الردود الجاهزة على التذاكر',
          icon: Zap,
          badge: `${cannedResponses.length} قالب`,
          badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
        },
        {
          id: 'tags',
          label: 'الوسوم المخصصة (Tags)',
          desc: 'تصنيفات العملاء والأولويات المخصصة',
          icon: TagIcon,
          badge: `${tags.length} وسم`,
          badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
        },
        {
          id: 'audio',
          label: 'التنبيهات الصوتية والإنذار',
          desc: 'نغمات انتهاء SLA وتخصيص الصوت',
          icon: Volume2,
          badge: soundSettings.muted ? 'صامت 🔕' : 'مفعل 🔔',
          badgeColor: soundSettings.muted
            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
        },
      ],
    },
    {
      groupTitle: 'التقارير ومؤشرات الجودة',
      groupKey: 'insights',
      icon: FileSpreadsheet,
      items: [
        {
          id: 'reports',
          label: 'التقارير المتقدمة والتصدير',
          desc: 'تصدير التذاكر إلى ملفات CSV وإحصائيات',
          icon: FileSpreadsheet,
          badge: 'CSV',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
        },
        {
          id: 'csat',
          label: 'تقييمات رضا العملاء (CSAT)',
          desc: 'سجل آراء وتقييمات العملاء والنجوم',
          icon: Star,
          badge: `${avgCsat} ★`,
          badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
        },
      ],
    },
  ];

  // Active item info
  const allNavItems = adminNavGroups.flatMap((g) => g.items);
  const activeNavItem = allNavItems.find((item) => item.id === adminTab) || allNavItems[0];
  const activeGroup = adminNavGroups.find((g) => g.items.some((item) => item.id === adminTab));

  // Filtered Navigation based on search
  const filteredNavGroups = adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
          group.groupTitle.toLowerCase().includes(adminSearchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* Modern Executive Top Banner with Live KPI Health Badges  */}
      {/* ======================================================== */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-500/15 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-8 left-16 w-48 h-24 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>مركز الإدارة والحوكمة الشاملة (Admin Enterprise Hub)</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                v8.5 Pro
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              إدارة المنظومة، المستخدمين، اتفاقيات SLA، والتكامل السحابي
            </h2>
            <p className="text-xs text-slate-300/80 max-w-2xl leading-relaxed">
              تحكم كامل في قواعد التوجيه الآلي، فرق العمل، الصلاحيات المخصصة، التنبيهات الصوتية، والنسخ الاحتياطي والمزامنة السحابية.
            </p>

            {/* Quick Live KPI Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-xl flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>المستخدمين: <strong className="text-white font-mono">{users.length}</strong></span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-xl flex items-center gap-1.5 text-slate-300">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                <span>الأقسام: <strong className="text-white font-mono">{categories.length}</strong></span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-xl flex items-center gap-1.5 text-slate-300">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>السحابة: <strong className={supabaseConfig.connected ? 'text-emerald-400' : 'text-slate-400'}>{supabaseConfig.connected ? 'متصلة 🟢' : 'غير متصلة ⚪'}</strong></span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-xl flex items-center gap-1.5 text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>مؤشر CSAT: <strong className="text-amber-300 font-mono">{avgCsat} ★</strong></span>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Layout Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectNavLayout('sidebar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  navLayout === 'sidebar'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض القائمة الجانبية المصنفة"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>قائمة جانبية</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNavLayout('ribbon')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  navLayout === 'ribbon'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض الشريط العلوي المجمع"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>شريط علوي</span>
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportTicketsToJSON(issues)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                title="تصدير نسخة احتياطية بصيغة JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>نسخة JSON</span>
              </button>
              <button
                type="button"
                onClick={() => exportTicketsToCSV(issues)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                title="تصدير التقرير الشامل بصيغة CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تقرير CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Navigation & Tab Content Layout (Sidebar vs Ribbon)     */}
      {/* ======================================================== */}
      <div className={navLayout === 'sidebar' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-5'}>
        
        {/* ---------------------------------------------------- */}
        {/* OPTION A: SIDEBAR NAVIGATION (Modern Enterprise 280px) */}
        {/* ---------------------------------------------------- */}
        {navLayout === 'sidebar' ? (
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Search Box in Settings */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="بحث في الإعدادات والأقسام..."
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl pr-9 pl-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
              {adminSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categorized Navigation Accordion/List */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-3 shadow-xs space-y-4">
              {filteredNavGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.groupKey} className="space-y-1.5">
                    {/* Category Title */}
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      <GroupIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{group.groupTitle}</span>
                    </div>

                    {/* Group Items */}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = adminTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAdminTab(item.id as any)}
                            className={`w-full text-right p-2.5 rounded-2xl transition-all flex items-center justify-between group cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                }`}
                              >
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs block truncate">{item.label}</span>
                                <span
                                  className={`text-[10px] block truncate ${
                                    isActive ? 'text-indigo-100' : 'text-slate-400'
                                  }`}
                                >
                                  {item.desc}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 mr-1.5">
                              {item.badge && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : item.badgeColor
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronLeft
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isActive ? 'text-white translate-x-0.5' : 'text-slate-400 opacity-40'
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Tip Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-800/40 border border-indigo-200/80 dark:border-indigo-800/50 p-4 rounded-3xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>إدارة فورية متزامنة</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                أي تعديلات تجريها على الصلاحيات أو الأقسام تطبق فوراً لجميع أعضاء الفريق عبر البث المباشر.
              </p>
            </div>
          </aside>
        ) : (
          /* ---------------------------------------------------- */
          /* OPTION B: RIBBON DOCK (Top Segmented Navigation)     */
          /* ---------------------------------------------------- */
          <div className="space-y-3">
            {/* Group Tabs Dock */}
            <div className="bg-white dark:bg-slate-800/90 p-2 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {adminNavGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isGroupActive = group.items.some((i) => i.id === adminTab);
                  return (
                    <div
                      key={group.groupKey}
                      className={`p-3 rounded-2xl border transition-all ${
                        isGroupActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700/80 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-2 text-slate-800 dark:text-slate-200">
                        <GroupIcon className={`w-4 h-4 ${isGroupActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <span>{group.groupTitle}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.items.map((item) => {
                          const isActive = adminTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAdminTab(item.id as any)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span>{item.label.split(' ')[0]} {item.label.split(' ')[1] || ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Main Content Area for the Active Tab                */}
        {/* ---------------------------------------------------- */}
        <div className={navLayout === 'sidebar' ? 'lg:col-span-8 xl:col-span-9 min-w-0 space-y-4' : 'w-full space-y-4'}>
          {/* Breadcrumb & Section Header Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
                {React.createElement(activeNavItem.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span>لوحة الإدارة</span>
                  <span>/</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{activeGroup?.groupTitle}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  {activeNavItem.label}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {activeNavItem.desc}
              </span>
              {activeNavItem.badge && (
                <span className={`text-xs font-bold px-3 py-1 rounded-xl shadow-2xs ${activeNavItem.badgeColor}`}>
                  {activeNavItem.badge}
                </span>
              )}
            </div>
          </div>

          {/* Active Tab View Body */}
          <div className="space-y-4">

      {/* 0. GENERAL SETTINGS TAB */}
      {adminTab === 'general' && generalSettings && onUpdateGeneralSettings && (
        <GeneralSettingsTab
          generalSettings={generalSettings}
          onUpdateGeneralSettings={onUpdateGeneralSettings}
        />
      )}

      {/* 0.1 BACKUP & RESTORE TAB */}
      {adminTab === 'backup' && onRestoreBackup && onResetSystemToDefault && generalSettings && (
        <BackupRestoreTab
          issues={issues}
          users={users}
          categories={categories}
          tags={tags}
          cannedResponses={cannedResponses}
          soundSettings={soundSettings}
          generalSettings={generalSettings}
          auditLogs={auditLogs}
          onRestoreBackup={onRestoreBackup}
          onResetSystemToDefault={onResetSystemToDefault}
        />
      )}

      {/* 1. USERS TAB */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">حسابات الموظفين والمشرفين المسجلة</h3>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إنشاء حساب موظف جديد</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3.5">الاسم الكامل</th>
                  <th className="p-3.5">اسم المستخدم</th>
                  <th className="p-3.5">كلمة المرور للدخول 🔐</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">الدور والصلاحيات</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.avatar}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{u.username}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {u.password ? '••••••' : '123'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordModalUser(u);
                            setEditPasswordInput(u.password || (u.role === 'Admin' ? 'admin' : '123'));
                            setShowEditPassword(false);
                          }}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                          title="تعديل أو إعادة ضبط كلمة المرور"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>تعديل 🔑</span>
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{u.department}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'Admin'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : u.role === 'Supervisor'
                              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPermissionModalUser(u);
                            setEditUserPermissions(
                              u.permissions && u.permissions.length > 0
                                ? u.permissions
                                : getDefaultPermissionsForRole(u.role)
                            );
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-full text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                          title="عرض وتعديل الصلاحيات المخصصة"
                        >
                          <KeyRound className="w-2.5 h-2.5 text-indigo-500" />
                          <span>
                            {(u.permissions && u.permissions.length > 0
                              ? u.permissions.length
                              : getDefaultPermissionsForRole(u.role).length)}{' '}
                            صلاحية
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {users.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الحساب (${u.name})؟`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAGS TAB */}
      {adminTab === 'tags' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-amber-500" />
            <span>إدارة وتخصيص الوسوم (Tags)</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تُستخدم الوسوم لتمييز التذاكر (مثل VIP Client, Cloud Server, Software Bug) وتسهيل الفلترة السريعة.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="اسم الوسم الجديد (مثال: Payment Gateway, VIP Client...)"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                if (!newTagInput.trim()) return;
                onAddTag(newTagInput.trim());
                setNewTagInput('');
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              إضافة الوسم
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {tags.map((t) => (
              <div
                key={t}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs"
              >
                <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>{t}</span>
                </span>
                <button
                  onClick={() => onDeleteTag(t)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
                  title="حذف الوسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUDIO & ALERT STYLE TAB */}
      {adminTab === 'audio' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-rose-500" />
            <span>التحكم في صوت وشكل التنبيهات والبلاغات الحرجة (SLA Alarm)</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            يمكنك تخصيص نغمة التحذير ومظهر الشريط العلوي الذي يظهر لفرق الدعم عند وجود تذاكر متأخرة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">إعدادات ملف الصوت:</h5>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">رابط ملف الصوت (Audio URL):</label>
                <input
                  type="text"
                  value={soundUrlInput}
                  onChange={(e) => setSoundUrlInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTestSound}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>تجربة الصوت الآن</span>
                </button>
                <button
                  onClick={() =>
                    onUpdateSoundSettings({
                      ...soundSettings,
                      muted: !soundSettings.muted,
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    soundSettings.muted
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {soundSettings.muted ? 'الصوت حالياً: مكتوم 🔇' : 'الصوت حالياً: مفعّل 🔊'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">طابع بطاقة تنبيه SLA العلوية:</h5>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pulse-red', label: 'وردي حديث (Rose Glow)', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700' },
                  { id: 'dark-rose', label: 'بنفسجي زجاجي (Berry Glass)', cls: 'bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800' },
                  { id: 'amber-warning', label: 'ذهبي تحذيري (Warm Amber)', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() =>
                      onUpdateSoundSettings({
                        ...soundSettings,
                        alarmStyle: st.id as any,
                      })
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold transition ${st.cls} ${
                      soundSettings.alarmStyle === st.id ? 'ring-2 ring-indigo-500 scale-102 shadow-xs' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSaveSound}
                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow"
              >
                حفظ إعدادات الصوت والشكل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES & SLA RULES */}
      {adminTab === 'categories' && (
        <CategoriesManagementView
          categories={categories}
          users={users}
          issues={issues}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          onBulkDeleteCategories={onBulkDeleteCategories}
          onToggleCategoryActive={onToggleCategoryActive}
          onBulkToggleActive={onBulkToggleCategoryActive}
          onUpdateSlaRules={onUpdateSlaRules}
          onAddUser={onAddUser}
          onNavigateToUsersTab={() => setAdminTab('users')}
        />
      )}

      {/* 5. CANNED RESPONSES */}
      {adminTab === 'canned' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>الردود والأنماط الجاهزة (Canned Responses)</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تساعد موظفي الدعم على الرد بضغطة زر واحدة أثناء التعليق أو إغلاق التذاكر لحفظ الوقت.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCannedInput}
              onChange={(e) => setNewCannedInput(e.target.value)}
              placeholder="اكتب نص الرد السريع الجديد..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                if (!newCannedInput.trim()) return;
                onAddCannedResponse(newCannedInput.trim());
                setNewCannedInput('');
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              إضافة الرد
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {cannedResponses.map((res, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium shadow-2xs"
              >
                <span className="text-slate-700 dark:text-slate-200">{res}</span>
                <button
                  onClick={() => onDeleteCannedResponse(i)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
                  title="حذف الرد"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. REPORTS TAB: PERIODIC SCHEDULES & MTTR/CSAT ANALYTICS */}
      {adminTab === 'reports' && (
        <div className="space-y-6">
          <ScheduledReportsView
            issues={issues}
            categories={categories}
            generalSettings={generalSettings}
            onExportCSV={() => exportTicketsToCSV(issues)}
          />

          {/* Quick Instant Export Tools Box */}
          <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>أدوات التصدير الفوري وسحب الملفات المباشر</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يمكنك سحب تقارير تفصيلية جاهزة للفتح مباشرة في Microsoft Excel مع ترميز UTF-8 سليم للغة العربية.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-2xs">
                <div>
                  <h5 className="font-bold text-xs text-indigo-600 dark:text-indigo-400">📊 التقرير الشامل لكافة التذاكر</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    سجل كامل بجميع الحالات، أوقات العمل الفعلية، مواعيد الـ SLA، وتقييمات العملاء.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportTicketsToCSV(issues)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>سحب التقرير الكامل (CSV)</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-2xs">
                <div>
                  <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400">⚠️ تقرير المتأخرات فقط (SLA Breached)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    تصفية وتصدير فوري للتذاكر التي تجاوزت وقت المعالجة المسموح به لتقييم الالتزام.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const breached = issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed');
                    exportTicketsToCSV(breached, `SLA_Breached_Report_${new Date().toISOString().slice(0, 10)}.csv`);
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>سحب تقرير المتأخرات</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-2xs">
                <div>
                  <h5 className="font-bold text-xs text-amber-600 dark:text-amber-400">💾 نسخة احتياطية برمجية (JSON)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    نسخة رقمية كاملة تحتوي على السجلات والتايم لاين والتعليقات لاستعادتها أو نقلها لأي نظام آخر.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportTicketsToJSON(issues)}
                  className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير نسخة JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MULTI-REGION REAL-TIME & CLOUD SYNC */}
      {adminTab === 'supabase' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Real-Time Branch Sync Card (منقولة من الترويسة للإعدادات) */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm p-6 space-y-5">
            {/* Header & Status Indicator */}
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>المزامنة اللحظية بين الفروع 🌐</span>
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {realtimeStatus === 'connected' ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                        نشطة لحظياً (Real-Time Live) • متصل بالسحابة
                      </span>
                    ) : realtimeStatus === 'connecting' ? (
                      <span className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جارِ الاتصال بالسحابة...
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <WifiOff className="w-3.5 h-3.5" />
                        غير متصل بالسحابة (مطفية)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Instant Sync Action */}
              <button
                type="button"
                onClick={() => {
                  if (onRefreshRealtime) onRefreshRealtime();
                  onSyncSupabaseNow();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-2 transition shadow-md shadow-emerald-600/25 text-xs active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>مزامنة فورية للكل ⚡</span>
              </button>
            </div>

            {/* Explanation Card */}
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-black text-xs">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تزامن مباشر متعدد المناطق (Multi-Region)</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed font-medium">
                أي تذكرة تنشأ أو تعدل أو تُعلّق عليها تظهر فوراً لدى جميع أفراد الفريق في مختلف المدن والمناطق دون الحاجة لتحديث الصفحة! ⚡
              </p>
            </div>

            {/* Online Team Members Roster Across Branches */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>المتصلون الآن من الفريق ({onlineUsers.length || 1})</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">متصلون عبر الفروع والمناطق</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {u.name.charAt(0)}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {u.name} {currentUser && u.name === currentUser.name && <span className="text-[10px] text-indigo-500 font-bold">(أنت)</span>}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.department || u.role} {u.location ? `• ${u.location}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                        نشط الآن 🟢
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-center text-xs col-span-full">
                    أنت متصل بالمنظومة السحابية حالياً
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary: External Supabase Configuration via Publishable API Key */}
          <div className="bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      الربط بواسطة Publishable API Key
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      أحدث معيار موصى به من Supabase ⚡
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    الربط المباشر مع Supabase عبر مفتاح الـ API القابل للنشر (Publishable Key) كبديل متطور لمفتاح Anon Key القديم
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{showGuide ? 'إخفاء الشرح' : 'طريقة الحصول على المفتاح'}</span>
                </button>
              </div>
            </div>

            {/* Quick Guide on where to find Publishable API Key in Supabase */}
            {showGuide && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-2 text-indigo-950 dark:text-indigo-200">
                <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                  <ExternalLink className="w-4 h-4" />
                  <span>خطوات استخراج Publishable API Key من لوحة تحكم Supabase:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pr-1 font-medium text-slate-700 dark:text-slate-300">
                  <li>
                    سجل دخول إلى <strong className="text-indigo-600 dark:text-indigo-400">Supabase Dashboard</strong> وافتح مشروعك.
                  </li>
                  <li>
                    من القائمة الجانبية اليسرى، اضغط على <strong>Project Settings</strong> (أيقونة الترس ⚙️).
                  </li>
                  <li>
                    اختر قسم <strong>API Keys</strong> أو <strong>API</strong>.
                  </li>
                  <li>
                    ستجد <strong>Project URL</strong> انسخه إلى الحقل الأول أدناه.
                  </li>
                  <li>
                    في خانة المفاتيح ستجد <strong>Publishable API Key</strong> (غالباً يبدأ بـ <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] text-emerald-600 font-bold">sbp_...</code>) أو مفتاح <strong>Anon Key</strong> القديم (يبدأ بـ <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] text-sky-600 font-bold">eyJ...</code>) — وكلاهما مدعوم ومقبول تماماً!
                  </li>
                </ol>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Project URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط المشروع (Project URL)
                </label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => {
                    setSbUrl(e.target.value);
                    setSbTestResult(null);
                  }}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  dir="ltr"
                />
              </div>

              {/* Publishable API Key Input with Eye Toggle & Key Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Publishable API Key (مفتاح الـ API القابل للنشر)
                  </label>
                  {sbKey.trim().length > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      sbKey.trim().startsWith('sbp_')
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800'
                        : sbKey.trim().startsWith('eyJ')
                        ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}>
                      <Key className="w-3 h-3" />
                      {sbKey.trim().startsWith('sbp_') 
                        ? 'Publishable API Key حديث (sbp_)' 
                        : sbKey.trim().startsWith('eyJ') 
                        ? 'مفتاح عام صالح (JWT / Anon Key)' 
                        : 'مفتاح API'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showSbKey ? 'text' : 'password'}
                    value={sbKey}
                    onChange={(e) => {
                      setSbKey(e.target.value);
                      setSbTestResult(null);
                    }}
                    placeholder="sbp_xxxxxxxxxxxxxxxxx أو eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSbKey(!showSbKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 cursor-pointer"
                    title={showSbKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                  >
                    {showSbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>المفتاح الآمن للواجهة الأمامية في Supabase. يمكنك لصق مفتاح Publishable الجديد أو مفتاح Anon القديم مباشرةً.</span>
                </p>
              </div>

              {/* Live Test Result Banner */}
              {sbTestResult && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition animate-in fade-in duration-200 ${
                  sbTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  {sbTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="font-medium leading-relaxed">
                    {sbTestResult.message}
                  </div>
                </div>
              )}

              {/* Comprehensive Cloud Entities Status Cards */}
              <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span>البيانات المشمولة في المزامنة السحابية الكاملة:</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                    مزامنة ثنائية (رفع واسترجاع)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">التذاكر والبلاغات</span>
                    <strong className="text-sm text-indigo-600 dark:text-indigo-400 block font-mono mt-0.5">{issues.length} تذكرة</strong>
                    <span className="text-[9px] text-slate-400">جدول issues</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">المستخدمين والصلاحيات</span>
                    <strong className="text-sm text-emerald-600 dark:text-emerald-400 block font-mono mt-0.5">{users.length} مستخدم</strong>
                    <span className="text-[9px] text-slate-400">جدول app_users</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">الأقسام وقواعد SLA</span>
                    <strong className="text-sm text-amber-600 dark:text-amber-400 block font-mono mt-0.5">{categories.length} قسم</strong>
                    <span className="text-[9px] text-slate-400">متجر السحابة</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">الوسوم والردود والإعدادات</span>
                    <strong className="text-sm text-purple-600 dark:text-purple-400 block font-mono mt-0.5">{tags.length} وسم</strong>
                    <span className="text-[9px] text-slate-400">متجر السحابة</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!sbUrl.trim() || !sbKey.trim()) {
                      setSbTestResult({
                        success: false,
                        message: 'يرجى إدخال كل من Project URL و Publishable API Key أولاً لإجراء الفحص.'
                      });
                      return;
                    }
                    setIsTestingSb(true);
                    setSbTestResult(null);
                    try {
                      if (onTestSupabaseConnection) {
                        const res = await onTestSupabaseConnection(sbUrl, sbKey);
                        setSbTestResult(res);
                      } else {
                        // Fallback check
                        const cleanUrl = sbUrl.trim().replace(/\/+$/, '');
                        const res = await fetch(`${cleanUrl}/rest/v1/`, {
                          headers: {
                            apikey: sbKey.trim(),
                            Authorization: `Bearer ${sbKey.trim()}`
                          }
                        });
                        if (res.ok || res.status === 404 || res.status === 200) {
                          setSbTestResult({
                            success: true,
                            message: 'تم التحقق من Publishable API Key بنجاح! الاتصال يعمل بصورة ممتازة 🟢'
                          });
                        } else {
                          setSbTestResult({
                            success: false,
                            message: `فشل التحقق: رمز الاستجابة ${res.status}`
                          });
                        }
                      }
                    } catch (err: any) {
                      setSbTestResult({
                        success: false,
                        message: `تعذر الاتصال بـ Supabase: ${err?.message || 'تأكد من صحة الرابط ومفتاح الـ API'}`
                      });
                    } finally {
                      setIsTestingSb(false);
                    }
                  }}
                  disabled={isTestingSb}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {isTestingSb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جارِ فحص الاتصال...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>فحص واختبار الاتصال بالمفتاح ⚡</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSaveSupabaseConfig(sbUrl, sbKey)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ بيانات الاتصال</span>
                </button>

                <button
                  type="button"
                  onClick={onSyncSupabaseNow}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                  title="رفع وحفظ جميع التذاكر والمستخدمين والإعدادات في السحابة"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>رفع ومزامنة الكل سحابياً ⬆️</span>
                </button>

                {onPullSupabaseNow && (
                  <button
                    type="button"
                    onClick={onPullSupabaseNow}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer text-xs"
                    title="استيراد وسحب جميع التذاكر والمستخدمين والإعدادات من السحابة"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>استيراد واسترجاع الكل من السحابة ⬇️</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowSqlHelper(!showSqlHelper)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer text-xs ml-auto"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{showSqlHelper ? 'إخفاء كود الجداول' : 'مخطط SQL الشامل للجداول'}</span>
                </button>
              </div>

              {/* Collapsible SQL Schema Helper */}
              {showSqlHelper && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>كود SQL الشامل لإنشاء جداول التذاكر، المستخدمين، والمتجر السحابي:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sqlCode = `-- كود إنشاء جداول المنظومة المتكاملة في Supabase SQL Editor

-- 1. جدول التذاكر والبلاغات (issues)
create table if not exists issues (
  id text primary key,
  client text,
  client_email text,
  client_phone text,
  tag text,
  type text,
  desc_text text,
  assigned text,
  owner text,
  priority text,
  status text,
  worktime integer default 0,
  csat integer default 5,
  created_at text,
  due_date text
);

-- 2. جدول المستخدمين والحسابات والصلاحيات (app_users)
create table if not exists app_users (
  id text primary key,
  name text,
  username text,
  email text,
  role text,
  department text,
  avatar text,
  permissions jsonb default '[]'::jsonb,
  password text
);

-- 3. جدول متجر النظام السحابي الشامل (system_cloud_store: الأقسام، الإعدادات، الوسوم)
create table if not exists system_cloud_store (
  key text primary key,
  data jsonb,
  updated_at timestamp with time zone default now()
);

-- 4. تفعيل سياسات الأمان RLS والسماح بالقراءة والكتابة عبر المفتاح الآمن
alter table issues enable row level security;
alter table app_users enable row level security;
alter table system_cloud_store enable row level security;

create policy "Allow all on issues" on issues for all using (true) with check (true);
create policy "Allow all on app_users" on app_users for all using (true) with check (true);
create policy "Allow all on system_cloud_store" on system_cloud_store for all using (true) with check (true);`;
                        navigator.clipboard.writeText(sqlCode);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2500);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ بنجاح!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الكود الكامل</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800" dir="ltr">
{`-- 1. جدول التذاكر والبلاغات
create table if not exists issues (
  id text primary key,
  client text,
  client_email text,
  client_phone text,
  tag text,
  type text,
  desc_text text,
  assigned text,
  owner text,
  priority text,
  status text,
  worktime integer default 0,
  csat integer default 5,
  created_at text,
  due_date text
);

-- 2. جدول المستخدمين والحسابات وكلمات المرور والصلاحيات
create table if not exists app_users (
  id text primary key,
  name text,
  username text,
  email text,
  role text,
  department text,
  avatar text,
  permissions jsonb default '[]'::jsonb,
  password text
);

-- 3. جدول متجر النظام السحابي (الأقسام وقواعد SLA والإعدادات)
create table if not exists system_cloud_store (
  key text primary key,
  data jsonb,
  updated_at timestamp with time zone default now()
);

-- 4. تفعيل سياسات الوصول
alter table issues enable row level security;
alter table app_users enable row level security;
alter table system_cloud_store enable row level security;

create policy "Allow all on issues" on issues for all using (true) with check (true);
create policy "Allow all on app_users" on app_users for all using (true) with check (true);
create policy "Allow all on system_cloud_store" on system_cloud_store for all using (true) with check (true);`}
                  </pre>
                  <p className="text-[11px] text-slate-400 font-normal">
                    انسخ هذا الكود والصقه في <strong>SQL Editor</strong> داخل مشروعك على Supabase ثم اضغط <strong>Run</strong> لإنشاء الجداول وحفظ كل شيء (التذاكر، المستخدمين، الأقسام، والإعدادات).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. CSAT RATINGS */}
      {adminTab === 'csat' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>سجل تقييمات رضا العملاء (CSAT Feedback)</span>
          </h4>

          <div className="space-y-2">
            {issues
              .filter((i) => i.status === 'Resolved' || i.status === 'Closed')
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {item.id} • {item.client}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      المسؤول: {item.owner} • سبب الحل: {item.resolutionReason || 'تم الحل بكفاءة'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-black">
                    {'★★★★★'.split('').map((s, idx) => (
                      <span key={idx} className={idx < (item.csat || 5) ? 'text-amber-500 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
                        {s}
                      </span>
                    ))}
                    <span className="mr-1 text-slate-900 dark:text-white">({item.csat || 5}/5)</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 9. AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>سجل العمليات والتدقيق الأمني (Audit Trail)</span>
            </h4>
            <button
              onClick={onClearAuditLogs}
              className="text-rose-600 dark:text-rose-400 hover:underline text-xs font-bold"
            >
              مسح السجل
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-2.5">الوقت</th>
                  <th className="p-2.5">المستخدم</th>
                  <th className="p-2.5">نوع العملية</th>
                  <th className="p-2.5">تفاصيل الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{log.time}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{log.user}</td>
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">{log.action}</td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-xs text-slate-900 dark:text-white my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">إضافة موظف جديد وتحديد الصلاحيات</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">سجل بيانات الموظف وحدد الصلاحيات التشغيلية عبر المربعات أدناه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto pr-1 flex-grow">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="مثال: خالد محمود"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">اسم المستخدم للدخول (Username)</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="مثال: khaled"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="khaled@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">القسم أو الفريق الفني</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="الدعم الفني والعمليات"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employee Password Field */}
                <div className="sm:col-span-2 bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-indigo-900 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>كلمة المرور الخاصة بالموظف (Password للدخول للمنظومة)</span>
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      مطلوبة لفتح وتسجيل دخول الموظف للنظام
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور الموظف (مثال: pass@1234)"
                      className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-2 pl-24 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                        title={showNewUserPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = 'Emp@' + Math.floor(1000 + Math.random() * 9000);
                          setNewUserPassword(rand);
                          setShowNewUserPassword(true);
                        }}
                        className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold transition cursor-pointer"
                        title="توليد كلمة سر عشوائية"
                      >
                        توليد 🎲
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  الدور الوظيفي الأساسي (Role):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'Agent' as const, label: 'موظف دعم (Agent)', desc: 'صلاحيات تشغيلية للتذاكر' },
                    { role: 'Supervisor' as const, label: 'مشرف (Supervisor)', desc: 'متابعة وإشراف وتقارير' },
                    { role: 'Admin' as const, label: 'مدير نظام (Admin)', desc: 'كامل الصلاحيات والإدارة' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleChange(item.role)}
                      className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                        newUserRole === item.role
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Boxes Grid Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-slate-900 dark:text-white font-black text-xs flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>تحديد الصلاحيات الممنوحة في شكل مربعات (Permissions Grid):</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      تم تحديد ({selectedPermissions.length} من أصل {ALL_PERMISSIONS.length}) صلاحية للموظف
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg font-bold border border-indigo-200 dark:border-indigo-800 transition text-[11px]"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition text-[11px]"
                    >
                      إلغاء الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(getDefaultPermissionsForRole(newUserRole))}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg font-bold border border-amber-200 dark:border-amber-800 transition text-[11px]"
                    >
                      استعادة الافتراضي
                    </button>
                  </div>
                </div>

                {/* Grid of Permission Squares */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => {
                          setSelectedPermissions((prev) =>
                            isChecked ? prev.filter((id) => id !== perm.id) : [...prev, perm.id]
                          );
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-1.5 shadow-2xs ${
                          isChecked
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500/70 text-slate-900 dark:text-white ring-1 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center transition border ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span
                              className={`font-bold text-xs ${
                                isChecked ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {perm.name}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pr-7 leading-relaxed">
                          {perm.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الحساب والصلاحيات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Existing User Permissions Modal */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-xs text-slate-900 dark:text-white my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  {permissionModalUser.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    تعديل صلاحيات الموظف: {permissionModalUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    الدور: {permissionModalUser.role} • القسم: {permissionModalUser.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    مربعات الصلاحيات ({editUserPermissions.length} من {ALL_PERMISSIONS.length})
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    انقر على أي مربع لتفعيل أو سحب الصلاحية فوراً
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditUserPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold border border-indigo-200 dark:border-indigo-800 text-[11px]"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUserPermissions([])}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-bold border border-slate-200 dark:border-slate-700 text-[11px]"
                  >
                    إلغاء الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUserPermissions(getDefaultPermissionsForRole(permissionModalUser.role))}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg font-bold border border-amber-200 dark:border-amber-800 text-[11px]"
                  >
                    الافتراضي للدور
                  </button>
                </div>
              </div>

              {/* Grid of Permission Squares */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = editUserPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => {
                        setEditUserPermissions((prev) =>
                          isChecked ? prev.filter((id) => id !== perm.id) : [...prev, perm.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-1.5 shadow-2xs ${
                        isChecked
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500/70 text-slate-900 dark:text-white ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition border ${
                              isChecked
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span
                            className={`font-bold text-xs ${
                              isChecked ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {perm.name}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                          {perm.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pr-7 leading-relaxed">
                        {perm.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveUserPermissions}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات على الصلاحيات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-xs text-slate-900 dark:text-white animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">تعديل كلمة المرور للموظف</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    الحساب: {passwordModalUser.name} ({passwordModalUser.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserPassword} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={editPasswordInput}
                    onChange={(e) => setEditPasswordInput(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 pl-24 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      title={showEditPassword ? 'إخفاء' : 'إظهار'}
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rand = 'Emp@' + Math.floor(1000 + Math.random() * 9000);
                        setEditPasswordInput(rand);
                        setShowEditPassword(true);
                      }}
                      className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold transition cursor-pointer"
                      title="توليد كلمة سر عشوائية"
                    >
                      توليد 🎲
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  سيحتاج الموظف لاستخدام هذه الكلمة لفتح المنظومة وتسجيل الدخول.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تحديث كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
