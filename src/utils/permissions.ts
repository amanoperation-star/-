import { UserRole, AppUser } from '../types';

export interface PermissionItem {
  id: string;
  name: string;
  category: 'تذاكر وعمليات' | 'وقت ومتابعة' | 'إدارة وتقارير' | 'عناصر الصفحة والواجهة';
  desc: string;
  iconName: 'plus' | 'edit' | 'assign' | 'resolve' | 'delete' | 'clock' | 'comment' | 'report' | 'users' | 'settings' | 'layout' | 'eye' | 'grid' | 'file';
}

export const ALL_PERMISSIONS: PermissionItem[] = [
  // 1. تذاكر وعمليات
  {
    id: 'tickets.create',
    name: 'تسجيل وبلاغات جديدة',
    category: 'تذاكر وعمليات',
    desc: 'إنشاء تذاكر وبلاغات جديدة وتحديد الأولوية والجهة الطالبة',
    iconName: 'plus',
  },
  {
    id: 'tickets.edit',
    name: 'تعديل بيانات التذاكر',
    category: 'تذاكر وعمليات',
    desc: 'تعديل تفاصيل البلاغ، المرفقات، ونوع المشكلة والتصنيف',
    iconName: 'edit',
  },
  {
    id: 'tickets.assign',
    name: 'إعادة التعيين والتوجيه',
    category: 'تذاكر وعمليات',
    desc: 'تحويل التذكرة لموظف آخر أو إعادة توجيهها لفريق فني',
    iconName: 'assign',
  },
  {
    id: 'tickets.resolve',
    name: 'حل وإغلاق التذاكر',
    category: 'تذاكر وعمليات',
    desc: 'إغلاق التذكرة وتوثيق سبب الحل المعتمد والإجراء المتخذ',
    iconName: 'resolve',
  },
  {
    id: 'tickets.delete',
    name: 'حذف التذاكر',
    category: 'تذاكر وعمليات',
    desc: 'حذف التذاكر نهائياً أو الحذف الجماعي من قاعدة البيانات',
    iconName: 'delete',
  },

  // 2. وقت ومتابعة
  {
    id: 'timer.manage',
    name: 'التحكم بعداد العمل (Stopwatch)',
    category: 'وقت ومتابعة',
    desc: 'بدء وإيقاف مؤقت العمل الفعلي وحساب زمن الإنجاز',
    iconName: 'clock',
  },
  {
    id: 'tickets.comment',
    name: 'إضافة تعليقات ومرفقات',
    category: 'وقت ومتابعة',
    desc: 'المشاركة في النقاش الداخلي واستخدام الردود السريعة وإرفاق الملفات',
    iconName: 'comment',
  },

  // 3. إدارة وتقارير
  {
    id: 'reports.export',
    name: 'استخراج وتصدير التقارير',
    category: 'إدارة وتقارير',
    desc: 'تصدير بيانات التذاكر إلى ملفات Excel/CSV ونسخ احتياطية JSON',
    iconName: 'report',
  },
  {
    id: 'admin.users',
    name: 'إدارة حسابات الموظفين',
    category: 'إدارة وتقارير',
    desc: 'إنشاء حسابات جديدة للموظفين وتعديل صلاحياتهم وأدوارهم',
    iconName: 'users',
  },
  {
    id: 'admin.sla_settings',
    name: 'إعدادات SLA والربط السحابي',
    category: 'إدارة وتقارير',
    desc: 'تعديل ساعات اتفاقية الخدمة، الأقسام، والاتصال السحابي Supabase',
    iconName: 'settings',
  },

  // 4. عناصر الصفحة والواجهة (Page Display & UI Permissions)
  {
    id: 'page.dashboard',
    name: 'لوحة المؤشرات والتحليلات (Dashboard)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'عرض تبويب لوحة المؤشرات الإحصائية العامة ورسومات الأداء البيانية',
    iconName: 'layout',
  },
  {
    id: 'page.sections_hub',
    name: 'دليل وخريطة الأقسام (Sections Hub)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار زِر ودليل الأقسام التفاعلي في أعلى الهيدر للتنقل السريع',
    iconName: 'grid',
  },
  {
    id: 'page.cab_board',
    name: 'لوحة التغييرات الفنية (CAB Board)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار تبويب وشاشة إدارة طلبات واجتماعات اعتماد التغييرات',
    iconName: 'file',
  },
  {
    id: 'page.knowledge_base',
    name: 'قاعدة المعرفة والحلول (Knowledge Base)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'عرض مقالات قاعدة المعرفة والحلول الفنية الجاهزة للموظف',
    iconName: 'eye',
  },
  {
    id: 'page.audit_logs',
    name: 'سجلات التدقيق والمراقبة (Audit Logs)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'عرض تبويب وسجل التدقيق والعمليات المباشرة بالنظام',
    iconName: 'eye',
  },
  {
    id: 'ui.stats_cards',
    name: 'بطاقات الأرقام والإحصائيات بالصفحة',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار ملخص كروت الإحصائيات والأرقام أعلى الصفحة الرئيسية',
    iconName: 'grid',
  },
  {
    id: 'ui.timer_widget',
    name: 'أداة عداد الوقت الحي (Live Stopwatch)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار مؤقت وعداد الإنتاجية بالهيدر والواجهة الرئيسية',
    iconName: 'clock',
  },
  {
    id: 'ui.quick_actions',
    name: 'شريط الإجراءات والعمليات السريعة',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار شريط الفلترة وأزرار التحكم السريعة أعلى جدول البلاغات',
    iconName: 'layout',
  },
  {
    id: 'ui.category_filter',
    name: 'شريط الأقسام والتصنيفات التفاعلي',
    category: 'عناصر الصفحة والواجهة',
    desc: 'عرض أزرار الفلترة حسب الأقسام والتصنيفات الفنية بالصفحة',
    iconName: 'grid',
  },
  {
    id: 'ui.bulk_actions',
    name: 'خيارات التحديد والحذف الجماعي',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار مربعات تحديد التذاكر المتعدد وتفعيل التحديد الجماعي',
    iconName: 'edit',
  },
  {
    id: 'ui.export_tools',
    name: 'أدوات تصدير وتنزيل البيانات (Excel/PDF)',
    category: 'عناصر الصفحة والواجهة',
    desc: 'إظهار أزرار وأدوات تصدير الجداول والتقارير إلى ملفات خارجية',
    iconName: 'report',
  },
];

export const getDefaultPermissionsForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'Admin':
      return ALL_PERMISSIONS.map((p) => p.id);
    case 'Supervisor':
      return [
        'tickets.create',
        'tickets.edit',
        'tickets.assign',
        'tickets.resolve',
        'timer.manage',
        'tickets.comment',
        'reports.export',
        'admin.sla_settings',
        'page.dashboard',
        'page.sections_hub',
        'page.cab_board',
        'page.knowledge_base',
        'ui.stats_cards',
        'ui.timer_widget',
        'ui.quick_actions',
        'ui.category_filter',
        'ui.bulk_actions',
        'ui.export_tools',
      ];
    case 'Agent':
    default:
      return [
        'tickets.create',
        'tickets.edit',
        'tickets.resolve',
        'timer.manage',
        'tickets.comment',
        'page.sections_hub',
        'page.knowledge_base',
        'ui.stats_cards',
        'ui.timer_widget',
        'ui.quick_actions',
        'ui.category_filter',
      ];
  }
};

export const hasPermission = (user: AppUser | null | undefined, permissionId: string): boolean => {
  if (!user) return false;
  // Admin role always bypasses permission checks
  if (user.role === 'Admin') return true;

  // Check if permissions array exists and is populated
  const userPerms = user.permissions && user.permissions.length > 0
    ? user.permissions
    : getDefaultPermissionsForRole(user.role);

  return userPerms.includes(permissionId);
};

