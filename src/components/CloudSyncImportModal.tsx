import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  Layers,
  FileText,
  X,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowDownCircle,
  Eye,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Issue, AppUser, CabBusinessActivity, CategoryRule, GeneralSettings, Priority, IssueStatus } from '../types';

interface CloudSyncImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: { url: string; key: string; connected?: boolean; lastSync?: string };
  currentStats: {
    issuesCount: number;
    usersCount: number;
    cabCount: number;
    categoriesCount: number;
  };
  onImportComplete: (importedData: {
    issues?: Issue[];
    users?: AppUser[];
    cabActivities?: CabBusinessActivity[];
    categories?: CategoryRule[];
    generalSettings?: GeneralSettings;
  }) => void;
}

export const CloudSyncImportModal: React.FC<CloudSyncImportModalProps> = ({
  isOpen,
  onClose,
  supabaseConfig,
  currentStats,
  onImportComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cloudIssues, setCloudIssues] = useState<Issue[]>([]);
  const [cloudUsers, setCloudUsers] = useState<AppUser[]>([]);
  const [cloudCab, setCloudCab] = useState<CabBusinessActivity[]>([]);
  const [cloudCategories, setCloudCategories] = useState<CategoryRule[]>([]);
  const [cloudSettings, setCloudSettings] = useState<GeneralSettings | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'tickets' | 'users' | 'cab'>('summary');

  // Fetch Cloud data on Modal Open
  const fetchCloudData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setHasFetched(false);

    const url = (supabaseConfig.url || '').trim();
    const key = (supabaseConfig.key || '').trim();

    if (!url || !key) {
      setErrorMessage('بيانات الربط بـ Supabase غير مكتملة. يرجى التأكد من إدخال رابط المشروع والمفتاح.');
      setIsLoading(false);
      return;
    }

    try {
      const client = createClient(url, key);

      // 1. Fetch Issues from Supabase
      const { data: issuesData, error: issuesErr } = await client.from('issues').select('*').limit(500);
      if (issuesErr && !issuesErr.message?.includes('does not exist')) {
        console.warn('Issues query warning:', issuesErr);
      }

      const parsedIssues: Issue[] = (issuesData || []).map((row: any) => ({
        id: row.id,
        client: row.client || 'عميل',
        clientEmail: row.client_email || undefined,
        clientPhone: row.client_phone || undefined,
        tag: row.tag || 'VIP Client',
        type: row.type || 'تقني / Technical',
        desc: row.desc_text || '',
        assigned: row.assigned || 'فريق الدعم',
        owner: row.owner || 'محمد علي',
        priority: (row.priority as Priority) || 'Medium',
        status: (row.status as IssueStatus) || 'Open',
        workTime: row.worktime || 0,
        csat: row.csat || 5,
        createdAt: row.created_at || new Date().toISOString(),
        dueDate: row.due_date || new Date().toISOString(),
        timeline: Array.isArray(row.timeline) ? row.timeline : [],
        comments: Array.isArray(row.comments) ? row.comments : [],
        attachment: row.attachment || undefined,
      }));

      // 2. Fetch Users from Supabase
      const { data: usersData, error: usersErr } = await client.from('app_users').select('*').limit(100);
      const parsedUsers: AppUser[] = (usersData || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role,
        department: row.department,
        avatar: row.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        password: row.password || '123456',
      }));

      // 3. Fetch CAB Activities
      const { data: cabData } = await client.from('cab_activities').select('*').limit(100);
      const parsedCab: CabBusinessActivity[] = (cabData || []).map((row: any) => ({
        id: row.id,
        activityName: row.activity_name || row.activityName || 'نشاط صيانة',
        scope: row.scope,
        impactedServices: row.impacted_services || row.impactedServices,
        serviceImpact: row.service_impact || row.serviceImpact,
        stopServiceTargetSystem: row.stop_service_target_system || row.stopServiceTargetSystem,
        stoppedSystemName: row.stopped_system_name || row.stoppedSystemName,
        downtimeRequired: row.downtime_required || row.downtimeRequired || 'No',
        date: row.date,
        startTime: row.start_time || row.startTime,
        endTime: row.end_time || row.endTime,
        maintenanceWindow: row.maintenance_window || row.maintenanceWindow,
        requestor: row.requestor,
        tpm: row.tpm,
        changeManagement: row.change_management || row.changeManagement,
        status: row.status || 'Pending Approval',
        riskLevel: row.risk_level || row.riskLevel || 'Low',
        rollbackPlan: row.rollback_plan || row.rollbackPlan,
        rollbackReason: row.rollback_reason || row.rollbackReason,
        comments: row.comments || [],
        auditTrail: row.audit_trail || row.auditTrail || [],
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      }));

      // 4. Fetch Store Settings
      const { data: storeData } = await client.from('system_cloud_store').select('*');
      let parsedCategories: CategoryRule[] = [];
      let parsedSettings: GeneralSettings | null = null;

      if (storeData) {
        for (const item of storeData) {
          if (item.key === 'categories' && Array.isArray(item.data)) {
            parsedCategories = item.data;
          } else if (item.key === 'general_settings' && item.data) {
            parsedSettings = item.data;
          }
        }
      }

      setCloudIssues(parsedIssues);
      setCloudUsers(parsedUsers);
      setCloudCab(parsedCab);
      setCloudCategories(parsedCategories);
      setCloudSettings(parsedSettings);
      setHasFetched(true);
    } catch (err: any) {
      setErrorMessage(`تعذر فحص واسترجاع البيانات من Supabase: ${err?.message || 'تأكد من الاتصال بالإنترنت وصلاحية المفاتيح'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCloudData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyAll = () => {
    onImportComplete({
      issues: cloudIssues.length > 0 ? cloudIssues : undefined,
      users: cloudUsers.length > 0 ? cloudUsers : undefined,
      cabActivities: cloudCab.length > 0 ? cloudCab : undefined,
      categories: cloudCategories.length > 0 ? cloudCategories : undefined,
      generalSettings: cloudSettings || undefined,
    });
    setSuccessNotice(`✅ تم بنجاح استيراد وتطبيق كافة البيانات السحابية في النظام! (${cloudIssues.length} تذكرة، ${cloudUsers.length} مستخدم، ${cloudCab.length} نشاط CAB).`);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn font-['Cairo',sans-serif]">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-md">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">
                  مركز استيراد واسترجاع بيانات السحابة (Cloud Sync Explorer)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Supabase Live 🟢
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                فحص محتويات قاعدة البيانات السحابية واستعادتها وتطبيقها بالكامل على جهازك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold">تنبيه أثناء قراءة السحابة:</strong>
                <p>{errorMessage}</p>
                <p className="text-[11px] opacity-80">
                  إذا لم تكن قد أنشأت الجداول بعد، يمكنك نسخ كود SQL من قسم Supabase وتشغيله في SQL Editor.
                </p>
              </div>
            </div>
          )}

          {successNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-bold text-sm">{successNotice}</div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                جارِ فحص السحابة واسترجاع كافة التذاكر والمستخدمين...
              </p>
              <p className="text-xs text-slate-500">
                الربط مع: <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{supabaseConfig.url}</code>
              </p>
            </div>
          ) : (
            <>
              {/* Cloud vs Local Comparison Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* 1. Issues */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">التذاكر في السحابة</span>
                  <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200 font-mono">
                    {cloudIssues.length}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    (المحلي حالياً: {currentStats.issuesCount})
                  </span>
                </div>

                {/* 2. Users */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">المستخدمين والصلاحيات</span>
                  <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 font-mono">
                    {cloudUsers.length}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    (المحلي حالياً: {currentStats.usersCount})
                  </span>
                </div>

                {/* 3. CAB Activities */}
                <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 space-y-1">
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 block">أنشطة CAB المعتمدة</span>
                  <div className="text-2xl font-black text-cyan-950 dark:text-cyan-200 font-mono">
                    {cloudCab.length}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    (المحلي حالياً: {currentStats.cabCount})
                  </span>
                </div>

                {/* 4. Categories & Rules */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">الأقسام وقواعد الـ SLA</span>
                  <div className="text-2xl font-black text-amber-950 dark:text-amber-200 font-mono">
                    {cloudCategories.length || (currentStats.categoriesCount ? 'متوفر' : '—')}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    (المحلي حالياً: {currentStats.categoriesCount})
                  </span>
                </div>
              </div>

              {/* Sub-tabs for exploring items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeTab === 'summary'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      نظرة عامة
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tickets')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeTab === 'tickets'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      معاينة التذاكر السحابية ({cloudIssues.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeTab === 'users'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      معاينة المستخدمين ({cloudUsers.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={fetchCloudData}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة فحص السحابة</span>
                  </button>
                </div>

                {/* Tab: Tickets Preview */}
                {activeTab === 'tickets' && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {cloudIssues.length > 0 ? (
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold">
                          <tr>
                            <th className="p-2.5">رقم التذكرة</th>
                            <th className="p-2.5">العميل</th>
                            <th className="p-2.5">القسم</th>
                            <th className="p-2.5">الحالة</th>
                            <th className="p-2.5">الأولوية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {cloudIssues.slice(0, 30).map((issue) => (
                            <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{issue.id}</td>
                              <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{issue.client}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{issue.assigned}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  issue.status === 'Resolved' || issue.status === 'Closed'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : issue.status === 'In Progress'
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}>
                                  {issue.status}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-[11px]">{issue.priority}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        لا توجد تذاكر مسجلة حالياً في جدول <code>issues</code> في السحابة.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Users Preview */}
                {activeTab === 'users' && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {cloudUsers.length > 0 ? (
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold">
                          <tr>
                            <th className="p-2.5">الاسم</th>
                            <th className="p-2.5">اسم المستخدم</th>
                            <th className="p-2.5">الدور</th>
                            <th className="p-2.5">القسم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {cloudUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">{user.name}</td>
                              <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400">{user.username}</td>
                              <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{user.role}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">{user.department}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        لا توجد مستخدمين مسجلين حالياً في جدول <code>app_users</code> في السحابة.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Summary */}
                {activeTab === 'summary' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>جاهزية المزامنة والاسترجاع:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      عند الضغط على <strong>«تطبيق واسترجاع الكل من السحابة الآن»</strong>، سيتم تحديث قاعدة بيانات التطبيق المحلية وسيرفر العمل مباشرة بالبيانات المسجلة في السحابة، وستظهر فوراً في شاشات التذاكر والمستخدمين.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={isLoading || (cloudIssues.length === 0 && cloudUsers.length === 0)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تطبيق واسترجاع الكل من السحابة الآن ⬇️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
