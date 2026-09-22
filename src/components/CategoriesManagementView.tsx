import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Clock,
  Shield,
  Zap,
  Users,
  UserCheck,
  Tag,
  Mail,
  Check,
  X,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Power,
  RotateCcw,
  Download,
  Info,
  ChevronRight,
  Briefcase,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { CategoryRule, AppUser, Issue, Priority } from '../types';

interface CategoriesManagementViewProps {
  categories: CategoryRule[];
  users: AppUser[];
  issues: Issue[];
  onAddCategory: (category: Omit<CategoryRule, 'id'>) => void;
  onUpdateCategory: (category: CategoryRule) => void;
  onDeleteCategory: (categoryId: string) => void;
  onBulkDeleteCategories: (categoryIds: string[]) => void;
  onToggleCategoryActive?: (categoryId: string, active: boolean) => void;
  onBulkToggleActive?: (categoryIds: string[], active: boolean) => void;
  onUpdateSlaRules: (categoryId: string, rules: Record<Priority, number>) => void;
  onAddUser?: (user: Omit<AppUser, 'id'>) => void;
  onNavigateToUsersTab?: () => void;
}

const COLOR_OPTIONS = [
  { id: 'indigo', label: 'نيلي (Indigo)', bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { id: 'cyan', label: 'سماوي (Cyan)', bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  { id: 'emerald', label: 'زمردي (Emerald)', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { id: 'amber', label: 'كهرماني (Amber)', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { id: 'rose', label: 'وردي قرمزي (Rose)', bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  { id: 'purple', label: 'أرجواني (Purple)', bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  { id: 'blue', label: 'أزرق كلاسيكي (Blue)', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
];

export const CategoriesManagementView: React.FC<CategoriesManagementViewProps> = ({
  categories,
  users,
  issues,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBulkDeleteCategories,
  onToggleCategoryActive,
  onBulkToggleActive,
  onUpdateSlaRules,
  onAddUser,
  onNavigateToUsersTab,
}) => {
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRule | null>(null);

  // Quick SLA Edit Modal State
  const [quickSlaCat, setQuickSlaCat] = useState<CategoryRule | null>(null);
  const [quickSlaValues, setQuickSlaValues] = useState<Record<Priority, number>>({
    Critical: 4,
    High: 12,
    Medium: 24,
    Low: 48,
  });

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [isCustomOwner, setIsCustomOwner] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('indigo');
  const [formActive, setFormActive] = useState(true);
  const [formRoutingStrategy, setFormRoutingStrategy] = useState<'direct' | 'round_robin' | 'least_busy'>('direct');
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [formEscalationEmail, setFormEscalationEmail] = useState('');
  const [formBusinessHoursOnly, setFormBusinessHoursOnly] = useState(false);
  const [formSla, setFormSla] = useState<Record<Priority, number>>({
    Critical: 4,
    High: 12,
    Medium: 24,
    Low: 48,
  });

  // Quick Add Supervisor Modal State
  const [showQuickAddUserModal, setShowQuickAddUserModal] = useState(false);
  const [quickUserName, setQuickUserName] = useState('');
  const [quickUserEmail, setQuickUserEmail] = useState('');
  const [quickUserRole, setQuickUserRole] = useState<'Supervisor' | 'Agent' | 'Admin'>('Supervisor');
  const [quickUserDept, setQuickUserDept] = useState('');

  // Bulk Delete Confirmation Modal State
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CategoryRule | null>(null);

  // Active teams list from users and categories
  const existingTeams = useMemo(() => {
    const teams = new Set<string>();
    categories.forEach((c) => teams.add(c.assignedTeam));
    users.forEach((u) => teams.add(u.department));
    return Array.from(teams).filter(Boolean);
  }, [categories, users]);

  // Statistics per Category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; open: number; breached: number }> = {};
    categories.forEach((cat) => {
      const catIssues = issues.filter((i) => i.type === cat.name);
      const openCount = catIssues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').length;
      const breachedCount = catIssues.filter((i) => {
        if (i.status === 'Resolved' || i.status === 'Closed') return false;
        return new Date() > new Date(i.dueDate);
      }).length;
      stats[cat.id] = {
        total: catIssues.length,
        open: openCount,
        breached: breachedCount,
      };
    });
    return stats;
  }, [categories, issues]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.assignedTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.defaultOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cat.keywords && cat.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())));

      const isActive = cat.active !== false;
      const matchesStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
          ? isActive
          : !isActive;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, filterStatus]);

  // Checkbox Handlers
  const isAllSelected =
    filteredCategories.length > 0 &&
    filteredCategories.every((cat) => selectedIds.includes(cat.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect filtered
      setSelectedIds((prev) => prev.filter((id) => !filteredCategories.some((c) => c.id === id)));
    } else {
      // Select all filtered
      const newIds = new Set(selectedIds);
      filteredCategories.forEach((cat) => newIds.add(cat.id));
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (catId: string) => {
    setSelectedIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCat(null);
    setFormName('');
    setFormTeam(existingTeams[0] || 'فريق الدعم الفني');
    setFormOwner(users[0]?.name || 'محمد علي');
    setIsCustomOwner(false);
    setFormDesc('');
    setFormColor('indigo');
    setFormActive(true);
    setFormRoutingStrategy('direct');
    setFormKeywords([]);
    setKeywordInput('');
    setFormEscalationEmail('');
    setFormBusinessHoursOnly(false);
    setFormSla({
      Critical: 4,
      High: 12,
      Medium: 24,
      Low: 48,
    });
    setShowModal(true);
  };

  // Open Edit Modal for Single Category
  const handleOpenEditModal = (cat: CategoryRule) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormTeam(cat.assignedTeam);
    setFormOwner(cat.defaultOwner);
    const userExists = users.some((u) => u.name === cat.defaultOwner);
    setIsCustomOwner(!userExists && !!cat.defaultOwner);
    setFormDesc(cat.description || '');
    setFormColor(cat.color || 'indigo');
    setFormActive(cat.active !== false);
    setFormRoutingStrategy(cat.routingStrategy || 'direct');
    setFormKeywords(cat.keywords || []);
    setKeywordInput('');
    setFormEscalationEmail(cat.escalationEmail || '');
    setFormBusinessHoursOnly(!!cat.businessHoursOnly);
    setFormSla({
      Critical: cat.slaHours.Critical || 4,
      High: cat.slaHours.High || 12,
      Medium: cat.slaHours.Medium || 24,
      Low: cat.slaHours.Low || 48,
    });
    setShowModal(true);
  };

  // Quick Add Supervisor to System
  const handleSaveQuickUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserName.trim()) {
      alert('يرجى كتابة اسم المشرف أو الموظف!');
      return;
    }
    const cleanName = quickUserName.trim();
    const newUser: Omit<AppUser, 'id'> = {
      name: cleanName,
      username: cleanName.toLowerCase().replace(/\s+/g, '.'),
      email: quickUserEmail.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@support.internal`,
      role: quickUserRole,
      department: quickUserDept.trim() || formTeam || 'الدعم والعمليات',
      avatar: cleanName.charAt(0).toUpperCase(),
      permissions: ['view_tickets', 'create_tickets', 'edit_tickets', 'close_tickets'],
    };
    if (onAddUser) {
      onAddUser(newUser);
    }
    setFormOwner(cleanName);
    setIsCustomOwner(false);
    setShowQuickAddUserModal(false);
    setQuickUserName('');
    setQuickUserEmail('');
    setQuickUserDept('');
  };

  // Keyword Management in Modal
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    if (!formKeywords.includes(trimmed)) {
      setFormKeywords([...formKeywords, trimmed]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (tagToRemove: string) => {
    setFormKeywords(formKeywords.filter((k) => k !== tagToRemove));
  };

  // Save Modal (Add or Update)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTeam.trim() || !formOwner.trim()) {
      alert('يرجى ملء الحقول الأساسية: اسم القسم، فريق التوجيه، والمشرف الافتراضي');
      return;
    }

    const payload = {
      name: formName.trim(),
      assignedTeam: formTeam.trim(),
      defaultOwner: formOwner.trim(),
      description: formDesc.trim(),
      color: formColor,
      active: formActive,
      routingStrategy: formRoutingStrategy,
      keywords: formKeywords,
      escalationEmail: formEscalationEmail.trim(),
      businessHoursOnly: formBusinessHoursOnly,
      slaHours: formSla,
    };

    if (editingCat) {
      onUpdateCategory({
        ...payload,
        id: editingCat.id,
      });
    } else {
      onAddCategory(payload);
    }

    setShowModal(false);
  };

  // Single Category Delete
  const handleConfirmSingleDelete = () => {
    if (!itemToDelete) return;
    onDeleteCategory(itemToDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
    setItemToDelete(null);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    onBulkDeleteCategories(selectedIds);
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  // Bulk Status Toggle
  const handleBulkStatusChange = (active: boolean) => {
    if (selectedIds.length === 0) return;
    if (onBulkToggleActive) {
      onBulkToggleActive(selectedIds, active);
    } else {
      selectedIds.forEach((id) => {
        const cat = categories.find((c) => c.id === id);
        if (cat) {
          onUpdateCategory({ ...cat, active });
        }
      });
    }
  };

  // Quick SLA Tweak
  const handleOpenQuickSla = (cat: CategoryRule) => {
    setQuickSlaCat(cat);
    setQuickSlaValues({ ...cat.slaHours });
  };

  const handleSaveQuickSla = () => {
    if (!quickSlaCat) return;
    onUpdateSlaRules(quickSlaCat.id, quickSlaValues);
    setQuickSlaCat(null);
  };

  // Export Categories JSON
  const handleExportJson = () => {
    const exportData = categories.filter((c) =>
      selectedIds.length > 0 ? selectedIds.includes(c.id) : true
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments-routing-sla-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColorMeta = (colorName?: string) => {
    return COLOR_OPTIONS.find((c) => c.id === colorName) || COLOR_OPTIONS[0];
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي الأقسام</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{categories.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">الأقسام المفعلة للتوجيه</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {categories.filter((c) => c.active !== false).length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">فرق العمل المرتبطة</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{existingTeams.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">متوسط مهلة الحرج SLA</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {categories.length > 0
                ? (
                    categories.reduce((acc, c) => acc + (c.slaHours.Critical || 0), 0) /
                    categories.length
                  ).toFixed(1)
                : 0}{' '}
              <span className="text-xs font-normal">ساعة</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Control Panel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالقسم، الفريق، المشرف، أو الكلمة المفتاحية..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الكل ({categories.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                النشطة ({categories.filter((c) => c.active !== false).length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === 'inactive'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                المعطلة ({categories.filter((c) => c.active === false).length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              title="تصدير بيانات الأقسام والتوجيه"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير JSON</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-black transition shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة قسم جديد مع التوجيه الذكي</span>
            </button>
          </div>
        </div>

        {/* Dynamic Bulk Action Bar (Shows when items are checked) */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                {selectedIds.length} محدد
              </span>
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                يمكنك تطبيق إجراء جماعي على الأقسام المحددة:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>تفعيل المحدد</span>
              </button>

              <button
                onClick={() => handleBulkStatusChange(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5 opacity-60" />
                <span>تعطيل المحدد</span>
              </button>

              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:underline font-semibold"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center mx-auto"
                    title={isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">القسم والوصف</th>
                <th className="py-3 px-3">فريق التوجيه والمشرف الافتراضي</th>
                <th className="py-3 px-3">قواعد التوزيع والكلمات الذكية</th>
                <th className="py-3 px-3">اتفاقية الخدمة SLA (ساعات)</th>
                <th className="py-3 px-3 text-center">التذاكر المرتبطة</th>
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <FolderTree className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="font-bold text-sm">لا توجد أقسام مطابقة للبحث أو التصفية</p>
                    <p className="text-xs text-slate-400 mt-1">جرّب تغيير كلمات البحث أو أضف قسماً جديداً</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedIds.includes(cat.id);
                  const colorMeta = getColorMeta(cat.color);
                  const isActive = cat.active !== false;
                  const stats = categoryStats[cat.id] || { total: 0, open: 0, breached: 0 };

                  return (
                    <tr
                      key={cat.id}
                      className={`transition-colors duration-150 ${
                        isSelected
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                          : !isActive
                          ? 'bg-slate-50/40 dark:bg-slate-900/30 opacity-75 hover:opacity-100'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelect(cat.id)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs text-white shadow-xs ${colorMeta.bg}`}
                          >
                            {cat.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white text-xs">
                                {cat.name}
                              </span>
                              {!isActive && (
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  معطل
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {cat.description || 'لا يوجد وصف تفصيلي مضاف لهذا القسم.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Team & Lead */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{cat.assignedTeam}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>المشرف: {cat.defaultOwner}</span>
                          </div>
                        </div>
                      </td>

                      {/* Smart Routing & Keywords */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>
                              {cat.routingStrategy === 'round_robin'
                                ? 'توزيع دوري (Round-Robin)'
                                : cat.routingStrategy === 'least_busy'
                                ? 'الأقل انشغالاً (Least Busy)'
                                : 'تكليف مباشر للمشرف'}
                            </span>
                          </div>

                          {/* Keywords badges */}
                          {cat.keywords && cat.keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {cat.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={i}
                                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-medium border border-slate-200 dark:border-slate-700"
                                >
                                  #{kw}
                                </span>
                              ))}
                              {cat.keywords.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  +{cat.keywords.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">بدون كلمات مفتاحية</span>
                          )}
                        </div>
                      </td>

                      {/* SLA Badges */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <div
                            className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-1.5 py-1 rounded-lg text-center"
                            title="أولوية حرجة"
                          >
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 block">حرج</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                              {cat.slaHours.Critical}س
                            </span>
                          </div>

                          <div
                            className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-1.5 py-1 rounded-lg text-center"
                            title="أولوية عالية"
                          >
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block">عالي</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                              {cat.slaHours.High}س
                            </span>
                          </div>

                          <div
                            className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 px-1.5 py-1 rounded-lg text-center"
                            title="أولوية متوسطة"
                          >
                            <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 block">متوسط</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                              {cat.slaHours.Medium}س
                            </span>
                          </div>

                          <div
                            className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-1.5 py-1 rounded-lg text-center"
                            title="أولوية منخفضة"
                          >
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">منخفض</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                              {cat.slaHours.Low}س
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenQuickSla(cat)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ml-1 rounded"
                            title="تعديل سريع لساعات SLA"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Linked Tickets */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            {stats.open} <span className="text-[10px] text-slate-400 font-normal">/ {stats.total}</span>
                          </span>
                          {stats.breached > 0 && (
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5 mt-0.5 animate-pulse">
                              <span>{stats.breached} متأخرة</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (onToggleCategoryActive) {
                              onToggleCategoryActive(cat.id, !isActive);
                            } else {
                              onUpdateCategory({ ...cat, active: !isActive });
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          title={isActive ? 'القسم نشط (انقر للتعطيل)' : 'القسم معطل (انقر للتفعيل)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isActive ? '-translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg transition"
                            title="تعديل بيانات القسم والتوجيه"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setItemToDelete(cat)}
                            disabled={categories.length <= 1}
                            className={`p-1.5 rounded-lg transition ${
                              categories.length <= 1
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400'
                            }`}
                            title={
                              categories.length <= 1
                                ? 'لا يمكن حذف القسم الوحيد المتبقي'
                                : 'حذف هذا القسم'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL: ADD OR EDIT DEPARTMENT WITH SMART ROUTING
      ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-scaleUp">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm">
                    {editingCat ? `تعديل إعدادات القسم: ${editingCat.name}` : 'إضافة قسم جديد مع محرك التوجيه الذكي'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    تحديد فريق العمل، المشرف الافتراضي، اتفاقيات الـ SLA، واستراتيجية التوزيع الآلي
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-5 text-xs">
              {/* SECTION 1: Department Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs">
                  <Briefcase className="w-4 h-4" />
                  <span>1. هوية وبيانات القسم الأساسية</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      اسم القسم / التصنيف <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="مثال: أمن سيبراني / Cybersecurity"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      اللون المميز للأيقونة والشارة
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormColor(c.id)}
                          className={`w-6 h-6 rounded-full transition-transform ${c.bg} ${
                            formColor === c.id ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    الوصف التشغيلي للقسم
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="اكتب نبذة مختصرة عن نطاق المشاكل والمهام التي يعالجها هذا القسم..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* SECTION 2: Smart Routing Engine */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>2. محرك التوجيه الذكي والتكليف التلقائي (Smart Dispatch)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      فريق التوجيه المسند إليه <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      list="existingTeamsList"
                      placeholder="مثال: فريق الدعم البرمجي"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <datalist id="existingTeamsList">
                      {existingTeams.map((team, i) => (
                        <option key={i} value={team} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold">
                        المشرف / المسؤول الافتراضي <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCustomOwner(!isCustomOwner)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                        >
                          {isCustomOwner ? '📋 اختيار من المسجلين' : '✏️ إدخال يدوي مخصص'}
                        </button>
                        {onAddUser && (
                          <button
                            type="button"
                            onClick={() => setShowQuickAddUserModal(true)}
                            className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1"
                            title="إضافة مشرف جديد للنظام فوراً"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>مشرف جديد</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isCustomOwner ? (
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formOwner}
                          onChange={(e) => setFormOwner(e.target.value)}
                          placeholder="اكتب اسم المشرف أو المسؤول مباشرة..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                          إدخال مخصص
                        </span>
                      </div>
                    ) : (
                      <select
                        value={formOwner}
                        onChange={(e) => {
                          if (e.target.value === '__add_new_user__') {
                            setShowQuickAddUserModal(true);
                          } else {
                            setFormOwner(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {formOwner && !users.some((u) => u.name === formOwner) && (
                          <option value={formOwner}>
                            {formOwner} (مشرف مسجل حالياً)
                          </option>
                        )}
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role} - {u.department})
                          </option>
                        ))}
                        {onAddUser && (
                          <option value="__add_new_user__">➕ إضافة مشرف/موظف جديد إلى النظام...</option>
                        )}
                      </select>
                    )}

                    {onNavigateToUsersTab && (
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>يتم إسناد التذاكر الافتراضية له</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            onNavigateToUsersTab();
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <span>إدارة المستخدمين والصلاحيات</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      استراتيجية توزيع التذاكر الآلية
                    </label>
                    <select
                      value={formRoutingStrategy}
                      onChange={(e) => setFormRoutingStrategy(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="direct">تكليف مباشر للمشرف الافتراضي (Direct to Lead)</option>
                      <option value="round_robin">توزيع دوري عادل (Round Robin)</option>
                      <option value="least_busy">إسناد للموظف الأقل انشغالاً بالتذاكر (Least Busy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      بريد إشعار التصعيد الفوري (Escalation Email)
                    </label>
                    <input
                      type="email"
                      value={formEscalationEmail}
                      onChange={(e) => setFormEscalationEmail(e.target.value)}
                      placeholder="department-lead@company.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto-route keywords */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    الكلمات المفتاحية للتوجيه التلقائي (Smart Keywords Trigger)
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
                    إذا احتوى وصف المشكلة على أي من هذه الكلمات، يقترح النظام تلقائياً هذا القسم لتوفير الوقت.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder="أدخل كلمة ثم اضغط Enter (مثال: اختراق، سيرفر، فاتورة)..."
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition"
                    >
                      إضافة كلمة
                    </button>
                  </div>

                  {formKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      {formKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <span>#{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="text-indigo-400 hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* SECTION 3: SLA Thresholds */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>3. مهل اتفاقية مستوى الخدمة SLA (بالساعات لكل أولوية)</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBusinessHoursOnly}
                      onChange={(e) => setFormBusinessHoursOnly(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                      احتساب ساعات الدوام فقط
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
                    <span className="text-rose-600 dark:text-rose-400 font-black text-xs block mb-1">
                      🔴 أولوية حرجة
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        required
                        value={formSla.Critical}
                        onChange={(e) =>
                          setFormSla({ ...formSla, Critical: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500">ساعة</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl">
                    <span className="text-amber-600 dark:text-amber-400 font-black text-xs block mb-1">
                      🟠 أولوية عالية
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        required
                        value={formSla.High}
                        onChange={(e) =>
                          setFormSla({ ...formSla, High: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500">ساعة</span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-2xl">
                    <span className="text-yellow-600 dark:text-yellow-400 font-black text-xs block mb-1">
                      🟡 أولوية متوسطة
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        required
                        value={formSla.Medium}
                        onChange={(e) =>
                          setFormSla({ ...formSla, Medium: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-yellow-300 dark:border-yellow-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500">ساعة</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs block mb-1">
                      🟢 أولوية منخفضة
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        required
                        value={formSla.Low}
                        onChange={(e) =>
                          setFormSla({ ...formSla, Low: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500">ساعة</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingCat ? 'حفظ التعديلات' : 'اعتماد وإنشاء القسم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QUICK ADD SUPERVISOR TO SYSTEM
      ========================================================= */}
      {showQuickAddUserModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl">
                  <UserPlus className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="font-black text-sm">إضافة مشرف أو موظف جديد للنظام</h4>
                  <p className="text-[11px] text-indigo-200">سيتم تسجيل الحساب وتعيينه كمشرف للقسم فوراً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddUserModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  الاسم الكامل للمشرف / الموظف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickUserName}
                  onChange={(e) => setQuickUserName(e.target.value)}
                  placeholder="مثال: د. عبدالرحمن الشهري"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    الدور الوظيفي والصلاحية
                  </label>
                  <select
                    value={quickUserRole}
                    onChange={(e) => setQuickUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Supervisor">Supervisor (مشرف)</option>
                    <option value="Admin">Admin (مدير نظام)</option>
                    <option value="Agent">Agent (موظف دعم)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    القسم / الإدارة
                  </label>
                  <input
                    type="text"
                    value={quickUserDept}
                    onChange={(e) => setQuickUserDept(e.target.value)}
                    placeholder={formTeam || 'إدارة الدعم والتشغيل'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={quickUserEmail}
                  onChange={(e) => setQuickUserEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddUserModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ وتعيين كمشرف فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QUICK SLA TWEAK (INLINE POPUP)
      ========================================================= */}
      {quickSlaCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  تعديل مهل الـ SLA للقسم: {quickSlaCat.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  تطبيق فوري على التذاكر الجديدة
                </p>
              </div>
              <button
                onClick={() => setQuickSlaCat(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
                <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">حرج (Critical)</span>
                <input
                  type="number"
                  min="1"
                  value={quickSlaValues.Critical}
                  onChange={(e) =>
                    setQuickSlaValues({ ...quickSlaValues, Critical: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-rose-300 rounded px-2 py-1 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">عالي (High)</span>
                <input
                  type="number"
                  min="1"
                  value={quickSlaValues.High}
                  onChange={(e) =>
                    setQuickSlaValues({ ...quickSlaValues, High: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-amber-300 rounded px-2 py-1 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-xl">
                <span className="font-bold text-yellow-600 dark:text-yellow-400 block mb-1">متوسط (Medium)</span>
                <input
                  type="number"
                  min="1"
                  value={quickSlaValues.Medium}
                  onChange={(e) =>
                    setQuickSlaValues({ ...quickSlaValues, Medium: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-yellow-300 rounded px-2 py-1 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">منخفض (Low)</span>
                <input
                  type="number"
                  min="1"
                  value={quickSlaValues.Low}
                  onChange={(e) =>
                    setQuickSlaValues({ ...quickSlaValues, Low: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 rounded px-2 py-1 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickSlaCat(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveQuickSla}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow"
              >
                حفظ ساعات SLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRMATION MODAL: SINGLE DELETE
      ========================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                تأكيد حذف القسم: {itemToDelete.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف هذا القسم وقواعد التوجيه الخاصة به؟ لن يؤدي هذا إلى حذف التذاكر القديمة ولكن سيتوقف التوجيه الجديد إليه.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRMATION MODAL: BULK DELETE
      ========================================================= */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                تأكيد الحذف الجماعي ({selectedIds.length} أقسام)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أنت على وشك حذف {selectedIds.length} من أقسام العمل وقواعد توجيهها دفعة واحدة. هل تريد الاستمرار؟
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                حذف المحدد نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
