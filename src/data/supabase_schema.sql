-- =========================================================================
-- كود إنشاء وتحديث جداول المنظومة في Supabase Table Editor / SQL Editor
-- (Enterprise Issue Tracker & Management System Schema v9.0)
-- =========================================================================

-- 1. جدول التذاكر والبلاغات (issues)
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL DEFAULT 'عميل',
  client_email TEXT,
  client_phone TEXT,
  tag TEXT DEFAULT 'General',
  type TEXT DEFAULT 'تقني / Technical',
  desc_text TEXT DEFAULT '',
  assigned TEXT DEFAULT 'فريق الدعم',
  owner TEXT DEFAULT 'النظام',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  worktime INTEGER DEFAULT 0,
  csat INTEGER DEFAULT 5,
  created_at TEXT DEFAULT NOW()::TEXT,
  due_date TEXT DEFAULT (NOW() + INTERVAL '2 days')::TEXT,
  attachment TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb
);

-- 2. جدول المستخدمين والحسابات والصلاحيات (app_users)
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Agent',
  department TEXT DEFAULT 'الدعم الفني والعمليات',
  avatar TEXT,
  password TEXT DEFAULT '123456',
  permissions JSONB DEFAULT '[]'::jsonb
);

-- 3. جدول أنشطة اعتماد التغيير ونوافذ الصيانة (cab_activities)
CREATE TABLE IF NOT EXISTS public.cab_activities (
  id TEXT PRIMARY KEY,
  activity_name TEXT NOT NULL,
  scope TEXT,
  impacted_services TEXT,
  service_impact TEXT,
  stop_service_target_system TEXT,
  stopped_system_name TEXT,
  downtime_required TEXT DEFAULT 'No',
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  maintenance_window TEXT,
  requestor TEXT,
  tpm TEXT,
  change_management TEXT DEFAULT 'IT Change Management',
  status TEXT DEFAULT 'Pending Approval',
  risk_level TEXT DEFAULT 'Low',
  rollback_plan TEXT,
  rollback_reason TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TEXT DEFAULT NOW()::TEXT
);

-- 4. جدول متجر النظام السحابي الشامل (system_cloud_store: الأقسام، الإعدادات، الوسوم)
CREATE TABLE IF NOT EXISTS public.system_cloud_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول سجلات التدقيق والمراجعة (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT DEFAULT NOW()::TEXT,
  user_name TEXT,
  action TEXT,
  details TEXT,
  category TEXT DEFAULT 'System'
);

-- =========================================================================
-- إعدادات الأمان وسياسات RLS (Row Level Security) لضمان القراءة والكتابة
-- =========================================================================

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cab_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_cloud_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- إلغاء السياسات القديمة إن وجدت لمنع التضارب
DROP POLICY IF EXISTS "Allow public full access on issues" ON public.issues;
DROP POLICY IF EXISTS "Allow public full access on app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow public full access on cab_activities" ON public.cab_activities;
DROP POLICY IF EXISTS "Allow public full access on system_cloud_store" ON public.system_cloud_store;
DROP POLICY IF EXISTS "Allow public full access on audit_logs" ON public.audit_logs;

-- إنشاء سياسات الوصول الشامل (Full Access)
CREATE POLICY "Allow public full access on issues" ON public.issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on cab_activities" ON public.cab_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on system_cloud_store" ON public.system_cloud_store FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- الفهارس القواعدية لتسريع البحث والاستعلامات (Indexes)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assigned ON public.issues(assigned);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);
CREATE INDEX IF NOT EXISTS idx_cab_status ON public.cab_activities(status);
