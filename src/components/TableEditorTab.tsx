import React, { useState, useEffect } from 'react';
import {
  Database,
  Table as TableIcon,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Download,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Globe,
  Zap,
  Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface TableEditorTabProps {
  supabaseConfig: { url: string; key: string };
  onSyncNow?: () => void;
}

type TableName = 'issues' | 'app_users' | 'cab_activities' | 'system_cloud_store' | 'audit_logs';

export const TableEditorTab: React.FC<TableEditorTabProps> = ({ supabaseConfig, onSyncNow }) => {
  const [selectedTable, setSelectedTable] = useState<TableName>('issues');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSqlCode, setShowSqlCode] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editRowData, setEditRowData] = useState<string>('');

  const sqlDDLCode = `-- =========================================================================
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

-- 4. جدول متجر النظام السحابي الشامل (system_cloud_store)
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

DROP POLICY IF EXISTS "Allow public full access on issues" ON public.issues;
DROP POLICY IF EXISTS "Allow public full access on app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow public full access on cab_activities" ON public.cab_activities;
DROP POLICY IF EXISTS "Allow public full access on system_cloud_store" ON public.system_cloud_store;
DROP POLICY IF EXISTS "Allow public full access on audit_logs" ON public.audit_logs;

CREATE POLICY "Allow public full access on issues" ON public.issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on cab_activities" ON public.cab_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on system_cloud_store" ON public.system_cloud_store FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
`;

  // Fetch table data from Supabase
  const loadTableData = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const url = (supabaseConfig.url || '').trim();
    const key = (supabaseConfig.key || '').trim();

    if (!url || !key) {
      setErrorMessage('بيانات الاتصال بـ Supabase غير متوفرة. يرجى إدخال Project URL و API Key في تبويب الإعدادات.');
      setLoading(false);
      return;
    }

    try {
      const client = createClient(url, key);
      const { data, error } = await client.from(selectedTable).select('*').limit(200);

      if (error) {
        if (error.message?.includes('does not exist')) {
          setErrorMessage(`الجدول "${selectedTable}" غير موجود في قاعدة بيانات Supabase. يمكنك إنشاؤه باستخدام كود SQL أدناه.`);
          setTableData([]);
        } else {
          setErrorMessage(`خطأ أثناء استعلام الجدول: ${error.message}`);
        }
      } else {
        setTableData(data || []);
      }
    } catch (err: any) {
      setErrorMessage(`تعذر الاتصال بـ Supabase: ${err?.message || 'تأكد من صحة المفاتيح والشبكة'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableData();
  }, [selectedTable, supabaseConfig]);

  // Handle Delete Row
  const handleDeleteRow = async (idOrKey: string) => {
    if (!window.confirm(`هل أنت تأكد من حذف السجل [${idOrKey}] نهائياً من جدول ${selectedTable}؟`)) {
      return;
    }

    const url = (supabaseConfig.url || '').trim();
    const key = (supabaseConfig.key || '').trim();
    if (!url || !key) return;

    try {
      const client = createClient(url, key);
      const primaryKeyCol = selectedTable === 'system_cloud_store' ? 'key' : 'id';
      
      const { error } = await client.from(selectedTable).delete().eq(primaryKeyCol, idOrKey);

      if (error) {
        alert(`فشل الحذف من Supabase: ${error.message}`);
      } else {
        setSuccessMessage(`تم حذف السجل ${idOrKey} بنجاح من جدول ${selectedTable}`);
        setTableData((prev) => prev.filter((item) => (item.id || item.key) !== idOrKey));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      alert(`حدث خطأ أثناء الحذف: ${err?.message}`);
    }
  };

  // Filter Table Data
  const filteredData = tableData.filter((row) => {
    if (!searchTerm.trim()) return true;
    const jsonStr = JSON.stringify(row).toLowerCase();
    return jsonStr.includes(searchTerm.toLowerCase().trim());
  });

  // Copy SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDDLCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Get Column Headers
  const getColumns = () => {
    if (tableData.length === 0) {
      if (selectedTable === 'issues') return ['id', 'client', 'type', 'status', 'priority', 'assigned', 'created_at'];
      if (selectedTable === 'app_users') return ['id', 'name', 'username', 'email', 'role', 'department'];
      if (selectedTable === 'cab_activities') return ['id', 'activity_name', 'status', 'requestor', 'risk_level'];
      if (selectedTable === 'system_cloud_store') return ['key', 'data', 'updated_at'];
      if (selectedTable === 'audit_logs') return ['id', 'timestamp', 'user_name', 'action', 'details'];
      return ['id'];
    }
    const allKeys = new Set<string>();
    tableData.slice(0, 10).forEach((row) => {
      Object.keys(row).forEach((k) => allKeys.add(k));
    });
    return Array.from(allKeys);
  };

  const columns = getColumns();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
              <TableIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">محرر ومستعرض الجداول المحدث (Supabase Table Editor)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  إصدار 9.0 المحدث ⚡
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                استعراض، تعديل، حذف، وإدارة جداول السحابة مباشرة، مع الحصول على كود الـ SQL المحدث لإنشاء الجداول وسياسات RLS بنقرة واحدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'تم نسخ كود SQL!' : 'نسخ كود SQL المحدث'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSqlCode(!showSqlCode)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>{showSqlCode ? 'إخفاء كود SQL' : 'عرض كود SQL'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible SQL Script Box */}
        {showSqlCode && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 text-emerald-400">
                <FileCode className="w-4 h-4" />
                <span>كود SQL الكامل والمحدث لجداول Supabase (نفذه في SQL Editor):</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">PostgreSQL / Supabase Schema</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900/90 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-60 leading-relaxed border border-slate-800" dir="ltr">
              {sqlDDLCode}
            </pre>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Table Editor Section */}
      <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5">
        {/* Controls: Table Selector & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          {/* Tabs for Tables */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['issues', 'app_users', 'cab_activities', 'system_cloud_store', 'audit_logs'] as TableName[]).map((tab) => {
              const labels: Record<TableName, string> = {
                issues: 'تذاكر البلاغات (issues)',
                app_users: 'المستخدمين (app_users)',
                cab_activities: 'اعتماد التغيير (cab)',
                system_cloud_store: 'متجر النظام (store)',
                audit_logs: 'سجل التدقيق (audit)',
              };
              const isSelected = selectedTable === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTable(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{labels[tab]}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في عناصر الجدول..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={loadTableData}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                {columns.map((col) => (
                  <th key={col} className="p-3 whitespace-nowrap font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                    {col}
                  </th>
                ))}
                <th className="p-3 text-center w-20">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>جارِ تحميل سجلات جدول {selectedTable}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                    لا توجد بيانات مسجلة في هذا الجدول حالياً
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const primaryKey = row.id || row.key || idx;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      {columns.map((col) => {
                        const val = row[col];
                        let renderedVal = '';
                        if (typeof val === 'object' && val !== null) {
                          renderedVal = JSON.stringify(val);
                        } else {
                          renderedVal = String(val ?? '');
                        }
                        return (
                          <td key={col} className="p-3 max-w-xs truncate font-mono text-[11px] dir-ltr text-right">
                            {renderedVal.length > 50 ? `${renderedVal.slice(0, 50)}...` : renderedVal}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(primaryKey)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pt-2">
          <span>
            إجمالي السجلات المعروضة: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredData.length}</strong> من أصل{' '}
            {tableData.length} سجل
          </span>
          <span className="text-[11px]">جدول Supabase: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-indigo-500 font-bold">{selectedTable}</code></span>
        </div>
      </div>
    </div>
  );
};
