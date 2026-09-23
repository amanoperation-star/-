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
  X
} from 'lucide-react';
import { AppUser, CategoryRule, SoundSettings, SupabaseConfig, AuditLog, Issue, Priority, GeneralSettings } from '../types';
import { exportTicketsToCSV, exportTicketsToJSON } from '../utils/export';
import { ALL_PERMISSIONS, getDefaultPermissionsForRole } from '../utils/permissions';
import { CategoriesManagementView } from './CategoriesManagementView';
import { GeneralSettingsTab } from './GeneralSettingsTab';

interface AdminViewProps {
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPermissions?: (userId: string, permissions: string[]) => void;
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
  auditLogs: AuditLog[];
  onClearAuditLogs: () => void;
  issues: Issue[];
  generalSettings?: GeneralSettings;
  onUpdateGeneralSettings?: (settings: GeneralSettings) => void;
  initialTab?: 'general' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit';
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  onAddUser,
  onDeleteUser,
  onUpdateUserPermissions,
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
  auditLogs,
  onClearAuditLogs,
  issues,
  generalSettings,
  onUpdateGeneralSettings,
  initialTab,
}) => {
  const [adminTab, setAdminTab] = useState<'general' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit'>(
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
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Supervisor' | 'Agent'>('Agent');
  const [newUserDept, setNewUserDept] = useState('الدعم الفني والعمليات');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() =>
    getDefaultPermissionsForRole('Agent')
  );

  // Edit Existing User Permissions Modal
  const [permissionModalUser, setPermissionModalUser] = useState<AppUser | null>(null);
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([]);

  // New Canned Response State
  const [newCannedInput, setNewCannedInput] = useState('');

  // Supabase Inputs
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig.key || '');

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
    });
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/50 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider mb-2 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>لوحة الإدارة والتحكم الشاملة (Admin Hub)</span>
          </span>
          <h2 className="text-xl font-black mt-1">مركز التحكم بالحسابات، اتفاقيات SLA، والتكامل السحابي</h2>
          <p className="text-xs text-slate-300 mt-1">
            إدارة كاملة لقواعد التوجيه الآلي، التنبيهات الصوتية، الردود السريعة، وسجل التدقيق الأمني.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTicketsToJSON(issues)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نسخة احتياطية (JSON)</span>
          </button>
          <button
            onClick={() => exportTicketsToCSV(issues)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>سحب التقرير الشامل (CSV)</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700/80 gap-2 overflow-x-auto text-xs font-bold pb-1">
        {[
          { id: 'general', label: 'الإعدادات العامة والهوية ⚙️', icon: Sliders, color: 'text-indigo-600 dark:text-indigo-400' },
          { id: 'users', label: 'إدارة الحسابات', icon: Users, color: 'text-indigo-600 dark:text-indigo-400' },
          { id: 'tags', label: 'الوسوم (Tags)', icon: TagIcon, color: 'text-amber-600 dark:text-amber-400' },
          { id: 'audio', label: 'الصوت والإنذار 🔔', icon: Volume2, color: 'text-rose-600 dark:text-rose-400' },
          { id: 'categories', label: 'الأقسام و SLA', icon: FolderTree, color: 'text-cyan-600 dark:text-cyan-400' },
          { id: 'canned', label: 'الردود السريعة', icon: Zap, color: 'text-yellow-600 dark:text-yellow-400' },
          { id: 'reports', label: 'التقارير المتقدمة', icon: FileSpreadsheet, color: 'text-emerald-600 dark:text-emerald-400' },
          { id: 'supabase', label: 'Supabase Cloud', icon: Cloud, color: 'text-emerald-600 dark:text-emerald-400' },
          { id: 'csat', label: 'تقييمات CSAT', icon: Star, color: 'text-amber-600 dark:text-amber-400' },
          { id: 'audit', label: 'سجل العمليات (Audit)', icon: History, color: 'text-slate-500 dark:text-slate-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 0. GENERAL SETTINGS TAB */}
      {adminTab === 'general' && generalSettings && onUpdateGeneralSettings && (
        <GeneralSettingsTab
          generalSettings={generalSettings}
          onUpdateGeneralSettings={onUpdateGeneralSettings}
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

      {/* 6. REPORTS TAB */}
      {adminTab === 'reports' && (
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>مركز استخراج وتوليد التقارير الإدارية المتقدمة</span>
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
                onClick={() => exportTicketsToCSV(issues)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-2"
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
                onClick={() => {
                  const breached = issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed');
                  exportTicketsToCSV(breached, `SLA_Breached_Report_${new Date().toISOString().slice(0, 10)}.csv`);
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-2"
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
                onClick={() => exportTicketsToJSON(issues)}
                className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUPABASE CLOUD SYNC */}
      {adminTab === 'supabase' && (
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">إعدادات الاتصال السحابي بقاعدة بيانات Supabase</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أدخل مفاتيح مشروعك لتمكين المزامنة الحية للتذاكر والمستخدمين والإعدادات عبر السحابة.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project URL</label>
              <input
                type="text"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Anon Public Key</label>
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onSaveSupabaseConfig(sbUrl, sbKey)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>حفظ بيانات الاتصال</span>
              </button>
              <button
                onClick={onSyncSupabaseNow}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>مزامنة البيانات الآن</span>
              </button>
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
    </div>
  );
};
