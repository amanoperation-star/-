import { UserRole } from '../types';

export interface PermissionItem {
  id: string;
  name: string;
  category: 'تذاكر وعمليات' | 'وقت ومتابعة' | 'إدارة وتقارير';
  desc: string;
  iconName: 'plus' | 'edit' | 'assign' | 'resolve' | 'delete' | 'clock' | 'comment' | 'report' | 'users' | 'settings';
}

export const ALL_PERMISSIONS: PermissionItem[] = [
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
      ];
    case 'Agent':
    default:
      return [
        'tickets.create',
        'tickets.edit',
        'tickets.resolve',
        'timer.manage',
        'tickets.comment',
      ];
  }
};
