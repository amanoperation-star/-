import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  FileText,
  X,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  List,
  LayoutGrid,
  Check,
  Eye,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  History,
  Bell,
  FileSpreadsheet,
  CheckCircle,
  Clock3,
  Filter
} from 'lucide-react';
import { CabBusinessActivity, AppUser, CabAuditLog } from '../types';

interface CollisionResult {
  hasCollision: boolean;
  collidingActivityIds: Set<string>;
  collisionDetails: Record<string, string[]>;
}

/**
 * Maintenance Collision & Conflict Detector
 */
const detectCollisions = (acts: CabBusinessActivity[]): CollisionResult => {
  const collidingIds = new Set<string>();
  const details: Record<string, string[]> = {};

  for (let i = 0; i < acts.length; i++) {
    for (let j = i + 1; j < acts.length; j++) {
      const a = acts[i];
      const b = acts[j];

      if (a.status === 'Rejected' || b.status === 'Rejected') continue;

      let reason = '';
      const sameDate = a.date && b.date && a.date.trim().toLowerCase() === b.date.trim().toLowerCase();

      const servicesA = (a.impactedServices || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const servicesB = (b.impactedServices || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const sharedServices = servicesA.filter((s) => servicesB.some((sb) => sb.includes(s) || s.includes(sb)));

      if (sameDate) {
        reason = `تداخل زمني بنفس اليوم (${a.date})`;
        if (sharedServices.length > 0) {
          reason += ` والخدمات الحيوية (${sharedServices.join(', ')})`;
        }
      } else if (sharedServices.length > 0) {
        reason = `تأثير مشترك على الخدمات الحيوية (${sharedServices.join(', ')})`;
      }

      if (reason) {
        collidingIds.add(a.id);
        collidingIds.add(b.id);
        if (!details[a.id]) details[a.id] = [];
        if (!details[b.id]) details[b.id] = [];
        details[a.id].push(`تضارب مع ${b.id}: ${reason}`);
        details[b.id].push(`تضارب مع ${a.id}: ${reason}`);
      }
    }
  }

  return {
    hasCollision: collidingIds.size > 0,
    collidingActivityIds: collidingIds,
    collisionDetails: details,
  };
};

/**
 * Helper to calculate SLA & Window Countdown
 */
const calculateWindowCountdown = (dateStr: string, startTimeStr: string, endTimeStr: string) => {
  try {
    const now = new Date();
    // Simple date parser logic
    const todayStr = now.toISOString().split('T')[0];
    
    // Parse start and end hours/minutes from format like "02:00 AM" or "14:00"
    const parseTime = (tStr: string) => {
      if (!tStr) return { h: 2, m: 0 };
      const isPM = tStr.toLowerCase().includes('pm');
      const clean = tStr.replace(/(am|pm)/gi, '').trim();
      const parts = clean.split(':').map(Number);
      let h = parts[0] || 0;
      const m = parts[1] || 0;
      if (isPM && h < 12) h += 12;
      if (!isPM && tStr.toLowerCase().includes('am') && h === 12) h = 0;
      return { h, m };
    };

    const startT = parseTime(startTimeStr);
    const endT = parseTime(endTimeStr);

    const startObj = new Date(now);
    startObj.setHours(startT.h, startT.m, 0, 0);

    const endObj = new Date(now);
    endObj.setHours(endT.h, endT.m, 0, 0);

    if (endObj < startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }

    if (now < startObj) {
      const diffMs = startObj.getTime() - now.getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return {
        phase: 'UPCOMING' as const,
        label: `تبقي ${hours} س و ${remMins} د على البدء`,
        color: 'text-sky-400 bg-sky-950/60 border-sky-800',
        minsUntilStart: mins,
      };
    } else if (now >= startObj && now <= endObj) {
      const diffMs = endObj.getTime() - now.getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return {
        phase: 'ACTIVE' as const,
        label: `جارية الآن! متبقي ${hours} س و ${remMins} د`,
        color: 'text-amber-400 bg-amber-950/80 border-amber-700 animate-pulse',
        minsUntilStart: 0,
      };
    } else {
      return {
        phase: 'PASSED' as const,
        label: 'انتهت نافذة الصيانة',
        color: 'text-slate-400 bg-slate-900 border-slate-800',
        minsUntilStart: 9999,
      };
    }
  } catch {
    return {
      phase: 'UNKNOWN' as const,
      label: 'جدول غير محدد',
      color: 'text-slate-400 bg-slate-900 border-slate-800',
      minsUntilStart: 9999,
    };
  }
};

/**
 * Very Simple, Minimalist Status Badge ("الشكل بسيط جداً")
 */
const ApprovalStatusToggleBadge: React.FC<{
  activity: CabBusinessActivity;
  onUpdate: (updated: CabBusinessActivity, logDetails?: string) => void;
  onTriggerRollback?: (activity: CabBusinessActivity) => void;
  size?: 'sm' | 'md';
}> = ({ activity, onUpdate, onTriggerRollback, size = 'sm' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const status = activity.status || 'Pending Approval';

  const handleSelectStatus = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    if (newStatus === 'Rolled Back' && onTriggerRollback) {
      setShowDropdown(false);
      onTriggerRollback(activity);
      return;
    }
    
    onUpdate(
      { ...activity, status: newStatus as any },
      `تغيير حالة الاعتماد من (${status}) إلى (${newStatus})`
    );
    setShowDropdown(false);
  };

  const statusConfigs: Record<string, { label: string; badgeClass: string; dotColor: string }> = {
    Approved: {
      label: 'معتمد (Approved)',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
      dotColor: 'bg-emerald-400',
    },
    'Pending Approval': {
      label: 'قيد الاعتماد (Pending)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
      dotColor: 'bg-amber-400',
    },
    Completed: {
      label: 'مكتمل (Completed)',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
      dotColor: 'bg-blue-400',
    },
    'Rolled Back': {
      label: 'تراجع (Rolled Back)',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
      dotColor: 'bg-purple-400',
    },
    Rejected: {
      label: 'مرفوض (Rejected)',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
      dotColor: 'bg-rose-400',
    },
    Draft: {
      label: 'مسودة (Draft)',
      badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30 hover:bg-slate-500/25',
      dotColor: 'bg-slate-400',
    },
  };

  const currentConfig = statusConfigs[status] || statusConfigs['Pending Approval'];

  return (
    <div className="relative inline-flex items-center select-none" dir="rtl">
      {/* Simple Clean Pill Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border transition-all cursor-pointer font-bold ${
          size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${currentConfig.badgeClass}`}
        title="انقر لتغيير حالة الاعتماد"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${currentConfig.dotColor}`}></span>
        <span>{currentConfig.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {/* Clean Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 w-48 text-right text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(statusConfigs).map(([key, cfg]) => {
            const isSel = status === key;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => handleSelectStatus(e, key)}
                className={`w-full text-right px-3 py-1.5 font-semibold flex items-center justify-between hover:bg-slate-800 transition cursor-pointer text-slate-200 ${
                  isSel ? 'bg-slate-800/80 font-bold text-white' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`}></span>
                  <span>{cfg.label}</span>
                </div>
                {isSel && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CabBusinessActivityViewProps {
  activities: CabBusinessActivity[];
  onAddActivity: (activity: CabBusinessActivity) => void;
  onUpdateActivity: (activity: CabBusinessActivity) => void;
  onDeleteActivity: (id: string) => void;
  currentUser: AppUser;
  appSkin?: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean';
}

export const CabBusinessActivityView: React.FC<CabBusinessActivityViewProps> = ({
  activities,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  currentUser,
  appSkin = 'standard',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grouped' | 'cards'>('table');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  // Ticking time state for live countdowns
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CabBusinessActivity | null>(null);
  const [viewingCardActivity, setViewingCardActivity] = useState<CabBusinessActivity | null>(null);

  // Rollback Modal State
  const [rollbackModalActivity, setRollbackModalActivity] = useState<CabBusinessActivity | null>(null);
  const [rollbackReasonInput, setRollbackReasonInput] = useState('');

  // Audit Trail Modal State
  const [auditLogActivity, setAuditLogActivity] = useState<CabBusinessActivity | null>(null);

  // Print & Report Export Modal
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [exportFilterScope, setExportFilterScope] = useState<'APPROVED' | 'ALL' | 'DOWNTIME'>('APPROVED');

  // Comment input per activity
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});

  // Collision Detection
  const collisionInfo = detectCollisions(activities);

  // Helper to add audit log to activity
  const addAuditLogToActivity = (act: CabBusinessActivity, actionStr: string, detailsStr: string): CabBusinessActivity => {
    const newLog: CabAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG'),
      actor: currentUser.name || 'مدير النظام',
      action: actionStr,
      details: detailsStr,
    };

    return {
      ...act,
      auditTrail: [newLog, ...(act.auditTrail || [])],
    };
  };

  const handleUpdateActivityWithAudit = (updatedAct: CabBusinessActivity, actionDetails?: string) => {
    if (actionDetails) {
      const logged = addAuditLogToActivity(updatedAct, 'تحديث بيانات النشاط', actionDetails);
      onUpdateActivity(logged);
    } else {
      onUpdateActivity(updatedAct);
    }
  };

  // KPIs
  const totalCabs = activities.length;
  const downtimeCabs = activities.filter((a) => a.downtimeRequired === 'Yes').length;
  const highRiskCabs = activities.filter((a) => a.riskLevel === 'High' || a.riskLevel === 'Critical').length;
  const approvedCabs = activities.filter((a) => a.status === 'Approved' || a.status === 'Completed').length;

  // Active / Upcoming windows count
  const activeOrUpcomingCabs = activities.filter((a) => {
    const cd = calculateWindowCountdown(a.date, a.startTime, a.endTime);
    return cd.phase === 'ACTIVE' || (cd.phase === 'UPCOMING' && cd.minsUntilStart <= 60);
  });

  // Rollback Handlers
  const handleTriggerRollbackModal = (act: CabBusinessActivity) => {
    setRollbackModalActivity(act);
    setRollbackReasonInput(act.rollbackReason || '');
  };

  const handleConfirmRollback = () => {
    if (!rollbackModalActivity) return;
    if (!rollbackReasonInput.trim()) {
      alert('الرجاء كتابة سبب التراجع الفني.');
      return;
    }

    const updatedComments = [
      ...(rollbackModalActivity.comments || []),
      {
        id: `cb-comm-${Date.now()}`,
        author: currentUser.name || 'مدير النظام',
        content: `🛑 تم تنفيذ التراجع (Rollback). السبب: ${rollbackReasonInput}`,
        createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG'),
        type: 'rollback_reason' as const,
      },
    ];

    const actWithRollback = {
      ...rollbackModalActivity,
      status: 'Rolled Back' as const,
      rollbackReason: rollbackReasonInput,
      comments: updatedComments,
    };

    const logged = addAuditLogToActivity(actWithRollback, 'تنفيذ تراجع (Rollback)', `السبب الفني: ${rollbackReasonInput}`);
    onUpdateActivity(logged);

    setRollbackModalActivity(null);
    setRollbackReasonInput('');
  };

  const handleAddCommentToActivity = (actId: string) => {
    const text = newCommentTexts[actId];
    if (!text || !text.trim()) return;

    const targetAct = activities.find((a) => a.id === actId);
    if (!targetAct) return;

    const newComment = {
      id: `cb-comm-${Date.now()}`,
      author: currentUser.name || 'المستخدم',
      content: text.trim(),
      createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG'),
      type: 'general' as const,
    };

    const updatedAct = {
      ...targetAct,
      comments: [...(targetAct.comments || []), newComment],
    };

    const logged = addAuditLogToActivity(updatedAct, 'إضافة تعليق فني', text.trim());
    onUpdateActivity(logged);

    setNewCommentTexts((prev) => ({ ...prev, [actId]: '' }));
  };

  // Form states
  const [formData, setFormData] = useState<Partial<CabBusinessActivity>>({
    activityName: '',
    scope: '',
    impactedServices: '',
    serviceImpact: '',
    stopServiceTargetSystem: '',
    stoppedSystemName: '',
    downtimeRequired: 'No',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '11:00 AM',
    maintenanceWindow: '09:00 AM - 11:00 AM',
    requestor: currentUser.name || '',
    tpm: '',
    changeManagement: 'IT Change Management',
    status: 'Pending Approval',
    riskLevel: 'Low',
    rollbackPlan: '',
  });

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setFormData({
      activityName: '',
      scope: '',
      impactedServices: '',
      serviceImpact: '',
      stopServiceTargetSystem: '',
      stoppedSystemName: '',
      downtimeRequired: 'No',
      date: new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }),
      startTime: '01:00 AM',
      endTime: '03:00 AM',
      maintenanceWindow: '01:00 AM - 03:00 AM',
      requestor: currentUser.name || '',
      tpm: '',
      changeManagement: 'IT Change Management Team',
      status: 'Pending Approval',
      riskLevel: 'Low',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (act: CabBusinessActivity) => {
    setEditingActivity(act);
    setFormData({ ...act });
    setShowModal(true);
  };

  const handleDuplicate = (act: CabBusinessActivity) => {
    const newAct: CabBusinessActivity = {
      ...act,
      id: `CAB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      activityName: `${act.activityName} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      auditTrail: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG'),
          actor: currentUser.name,
          action: 'إنشاء نسخة من النشاط',
          details: `تم إنشاء نسخة من النشاط الاصلي ${act.id}`,
        },
      ],
    };
    onAddActivity(newAct);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityName?.trim()) {
      alert('الرجاء إدخال اسم النشاط (Business Activity)');
      return;
    }

    if (editingActivity) {
      const updated = { ...editingActivity, ...formData } as CabBusinessActivity;
      const logged = addAuditLogToActivity(updated, 'تعديل بيانات النشاط', 'تم تحديث التفاصيل والجداول بطلب من المستخدم');
      onUpdateActivity(logged);
    } else {
      const newAct: CabBusinessActivity = {
        id: `CAB-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
        activityName: formData.activityName || '',
        scope: formData.scope || '',
        impactedServices: formData.impactedServices || '',
        serviceImpact: formData.serviceImpact || '',
        stopServiceTargetSystem: formData.stopServiceTargetSystem || '',
        stoppedSystemName: formData.stoppedSystemName || '',
        downtimeRequired: (formData.downtimeRequired as 'Yes' | 'No') || 'No',
        date: formData.date || '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        maintenanceWindow: formData.maintenanceWindow || `${formData.startTime} - ${formData.endTime}`,
        requestor: formData.requestor || currentUser.name,
        tpm: formData.tpm || '',
        changeManagement: formData.changeManagement || 'IT Change Management',
        status: (formData.status as any) || 'Pending Approval',
        riskLevel: formData.riskLevel || 'Low',
        rollbackPlan: formData.rollbackPlan || '',
        createdAt: new Date().toISOString(),
        auditTrail: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG'),
            actor: currentUser.name || 'المستخدم',
            action: 'إنشاء نشاط CAB جديد',
            details: 'تم تسجيل طلب التغيير في النظام',
          },
        ],
      };
      onAddActivity(newAct);
    }

    setShowModal(false);
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (filterStatus !== 'ALL' && act.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        act.id.toLowerCase().includes(q) ||
        act.activityName.toLowerCase().includes(q) ||
        act.scope.toLowerCase().includes(q) ||
        act.requestor.toLowerCase().includes(q) ||
        (act.stopServiceTargetSystem || '').toLowerCase().includes(q) ||
        (act.stoppedSystemName || '').toLowerCase().includes(q) ||
        act.impactedServices.toLowerCase().includes(q) ||
        act.date.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export CSV Functionality (Feature 4)
  const handleExportCSV = () => {
    const listToExport = activities.filter((a) => {
      if (exportFilterScope === 'APPROVED') return a.status === 'Approved' || a.status === 'Completed';
      if (exportFilterScope === 'DOWNTIME') return a.downtimeRequired === 'Yes';
      return true;
    });

    if (listToExport.length === 0) {
      alert('لا توجد بيانات مطابقة للتصدير.');
      return;
    }

    const headers = [
      'كود النشاط (CAB ID)',
      'اسم النشاط (Business Activity)',
      'النطاق (Scope)',
      'السيستم المراد إيقاف الخدمة عليه (Target System)',
      'السيستم المتأثر بالإنقطاع (Stopped System)',
      'الخدمات المتأثرة (Impacted Services)',
      'توقف الخدمة (Downtime Required)',
      'التاريخ (Date)',
      'نافذة الصيانة (Maintenance Window)',
      'طالب التغيير (Requestor)',
      'المسؤول التقني (TPM)',
      'مستوى الخطورة (Risk Level)',
      'الحالة (Status)',
      'خطة التراجع (Rollback Plan)',
    ];

    const rows = listToExport.map((a) => [
      `"${a.id}"`,
      `"${(a.activityName || '').replace(/"/g, '""')}"`,
      `"${(a.scope || '').replace(/"/g, '""')}"`,
      `"${(a.stopServiceTargetSystem || '').replace(/"/g, '""')}"`,
      `"${(a.stoppedSystemName || '').replace(/"/g, '""')}"`,
      `"${(a.impactedServices || '').replace(/"/g, '""')}"`,
      `"${a.downtimeRequired}"`,
      `"${a.date}"`,
      `"${a.maintenanceWindow}"`,
      `"${a.requestor}"`,
      `"${a.tpm}"`,
      `"${a.riskLevel || 'Low'}"`,
      `"${a.status || 'Pending Approval'}"`,
      `"${(a.rollbackPlan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CAB_Approved_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group activities by Date
  const groupedByDate = filteredActivities.reduce((acc, act) => {
    const key = act.date || 'غير محدد التاريخ';
    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {} as Record<string, CabBusinessActivity[]>);

  const toggleDateCollapse = (dateStr: string) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  return (
    <div className="space-y-5 font-['Cairo',sans-serif]">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                📋 لوحة اعتماد التغييرات الفنية (CAB)
              </h2>
              <span className="bg-blue-950 text-cyan-300 border border-cyan-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                ITIL Standard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة طلبات التغيير البرمجي ونوافذ الصيانة وتقييم المخاطر وخطط التراجع.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Export Report Trigger (Feature 4) */}
          <button
            onClick={() => setShowPrintReportModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="تصدير تقرير الـ CAB المعتمد (PDF / Excel / Print)"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>تصدير والطباعة (Export)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نشاط (+CAB)</span>
          </button>
        </div>
      </div>

      {/* KPI & Risk Metrics Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 font-bold border border-blue-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">إجمالي الأنشطة</div>
            <div className="text-base font-black text-white mt-0.5">{totalCabs} أنشطة</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">تتطلب توقف (Downtime)</div>
            <div className="text-base font-black text-rose-400 mt-0.5">{downtimeCabs}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">مخاطر عالية / حرجة</div>
            <div className="text-base font-black text-amber-400 mt-0.5">{highRiskCabs}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">المعتمدة والمكتملة</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">{approvedCabs}</div>
          </div>
        </div>
      </div>

      {/* Live SLA & Active Window Alert Banner (Feature 5) */}
      {activeOrUpcomingCabs.length > 0 && (
        <div className="bg-amber-950/80 border border-amber-600 rounded-xl p-3 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-lg text-white font-bold shrink-0 animate-pulse">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-200 flex items-center gap-2">
                <span>⏱️ تنبيه العداد التنازلي ونوافذ الصيانة (SLA Window Alert)</span>
                <span className="bg-amber-900 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-700">
                  {activeOrUpcomingCabs.length} نشاط نشط / قريب
                </span>
              </h4>
              <p className="text-[11px] text-amber-300 mt-0.5">
                تأكد من إخطار قطاع العمليات والعملاء قبل البدء الفعلي لإيقاف الخدمة.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeOrUpcomingCabs.map((act) => {
              const cd = calculateWindowCountdown(act.date, act.startTime, act.endTime);
              return (
                <span key={act.id} className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border ${cd.color}`}>
                  {act.id}: {cd.label}
                </span>
              );
            })}
          </div>
        </div>
      )}



      {/* Filter, Search and View Modes Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم النشاط، السيستم المستهدف، التوقف، أو المسئول..."
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {['ALL', 'Pending Approval', 'Approved', 'Completed', 'Draft', 'Rejected', 'Rolled Back'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'الكل' : st === 'Pending Approval' ? 'قيد الاعتماد' : st === 'Approved' ? 'معتمد' : st === 'Completed' ? 'مكتمل' : st === 'Rolled Back' ? 'تراجع' : st}
              </button>
            ))}
          </div>

          {/* View Modes Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 select-none shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>جدول</span>
            </button>

            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>حسب اليوم</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>بطاقات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grouped / Cards View */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-3 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center mx-auto text-blue-500 text-xl">
            📋
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            لا توجد أنشطة CAB تطابق شروط البحث والفلترة
          </h3>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إضافة نشاط الآن (+CAB)
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* MODE 1: COMPACT FAST DATA TABLE */
        <div className="cab-activity-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B192C] text-white font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">كود النشاط</th>
                  <th className="p-3">اسم النشاط والأنظمة المستهدفة</th>
                  <th className="p-3">الجدول وعداد الـ SLA</th>
                  <th className="p-3 text-center">توقف الخدمة</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3 text-center">الإجراءات السريعة وحالة الاعتماد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900 text-white">
                {filteredActivities.map((act) => {
                  const countdown = calculateWindowCountdown(act.date, act.startTime, act.endTime);
                  return (
                    <tr key={act.id} className="hover:bg-slate-800/70 transition">
                      {/* ID */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 block text-center">
                          {act.id}
                        </span>
                      </td>

                      {/* Name & Target / Stopped Systems */}
                      <td className="p-3 max-w-sm">
                        <h4 className="font-black text-white text-xs leading-snug">
                          {act.activityName}
                        </h4>
                        <div className="mt-1 space-y-0.5 text-[10px] bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                          {act.stopServiceTargetSystem && (
                            <div className="text-amber-300 font-semibold truncate">
                              🎯 السيستم المراد إيقاف الخدمة عليه: <span className="text-white font-bold">{act.stopServiceTargetSystem}</span>
                            </div>
                          )}
                          {act.stoppedSystemName && (
                            <div className="text-rose-300 font-semibold truncate">
                              🛑 السيستم المتأثر بالإنقطاع: <span className="text-white font-bold">{act.stoppedSystemName}</span>
                            </div>
                          )}
                          {!act.stopServiceTargetSystem && act.impactedServices && (
                            <div className="text-cyan-400 font-semibold truncate">
                              🎯 الخدمات المتأثرة: {act.impactedServices}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Schedule & SLA Countdown Timer (Feature 5) */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-bold text-emerald-400 font-mono text-[11px]">
                            📅 {act.date}
                          </div>
                          <div className="font-mono text-[10px] text-sky-300 font-bold">
                            ⏰ {act.maintenanceWindow || `${act.startTime} - ${act.endTime}`}
                          </div>
                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${countdown.color}`}>
                            <Clock3 className="w-3 h-3 shrink-0" />
                            <span>{countdown.label}</span>
                          </div>
                        </div>
                      </td>

                      {/* Downtime */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          act.downtimeRequired === 'Yes'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {act.downtimeRequired === 'Yes' ? 'توقف (Yes)' : 'بدون توقف (No)'}
                        </span>
                      </td>

                      {/* Requestor */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-[11px]">
                          <span className="font-bold text-amber-300 block">👤 {act.requestor}</span>
                          {act.tpm && <span className="text-slate-400 text-[10px] block">TPM: {act.tpm}</span>}
                        </div>
                      </td>

                      {/* Actions & Simple Status Toggle Badge */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewingCardActivity(act)}
                              className="p-1 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="عرض القالب الموثق الكامل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setAuditLogActivity(act)}
                              className="p-1 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="سجل التدقيق والتغييرات (Audit Trail)"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleTriggerRollbackModal(act)}
                              className="p-1 text-purple-400 hover:bg-purple-950/60 rounded transition cursor-pointer"
                              title="زر التراجع السريع (Rollback)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(act)}
                              className="p-1 text-amber-400 hover:bg-amber-950/60 rounded transition cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDuplicate(act)}
                              className="p-1 text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="نسخ"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف النشاط ${act.id}؟`)) {
                                  onDeleteActivity(act.id);
                                }
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/60 rounded transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="w-px h-4 bg-slate-700"></div>

                          {/* SIMPLE STATUS BADGE PLACED AFTER QUICK ACTIONS */}
                          <ApprovalStatusToggleBadge activity={act} onUpdate={handleUpdateActivityWithAudit} onTriggerRollback={handleTriggerRollbackModal} size="sm" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        /* MODE 2: GROUPED BY DATE ACCORDIONS */
        <div className="space-y-3">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            const isCollapsed = Boolean(collapsedDates[dateStr]);
            return (
              <div key={dateStr} className="cab-activity-card overflow-hidden text-white">
                <div
                  onClick={() => toggleDateCollapse(dateStr)}
                  className="bg-[#0B192C] p-3 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-xs text-white flex items-center gap-2">
                      <span>📅 {dateStr}</span>
                      <span className="bg-blue-950 text-cyan-300 border border-cyan-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {items.length} أنشطة صيانة
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{isCollapsed ? 'عرض' : 'إخفاء'}</span>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-3 space-y-2 bg-slate-900">
                    {items.map((act) => {
                      const countdown = calculateWindowCountdown(act.date, act.startTime, act.endTime);
                      return (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl border border-slate-800 bg-[#1E293B] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-white"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                                {act.id}
                              </span>
                              <span className="text-xs font-bold text-sky-300">
                                ⏰ {act.maintenanceWindow || `${act.startTime} - ${act.endTime}`}
                              </span>
                              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${countdown.color}`}>
                                {countdown.label}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-white">
                              {act.activityName}
                            </h4>
                            {(act.stopServiceTargetSystem || act.stoppedSystemName) && (
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {act.stopServiceTargetSystem && (
                                  <span className="bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                                    🎯 المستهدف بالإيقاف: {act.stopServiceTargetSystem}
                                  </span>
                                )}
                                {act.stoppedSystemName && (
                                  <span className="bg-rose-950/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">
                                    🛑 سيتوقف: {act.stoppedSystemName}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingCardActivity(act)}
                                className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="عرض القالب المصور"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setAuditLogActivity(act)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="سجل التدقيق"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleTriggerRollbackModal(act)}
                                className="p-1.5 bg-purple-950 hover:bg-purple-800 text-purple-300 border border-purple-800/60 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Rollback</span>
                              </button>
                            </div>

                            <div className="w-px h-4 bg-slate-700"></div>

                            <ApprovalStatusToggleBadge activity={act} onUpdate={handleUpdateActivityWithAudit} onTriggerRollback={handleTriggerRollbackModal} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 3: FULL ITIL CARDS VIEW */
        <div className="space-y-6">
          {filteredActivities.map((act) => {
            const countdown = calculateWindowCountdown(act.date, act.startTime, act.endTime);
            return (
              <div
                key={act.id}
                className="cab-activity-card text-white overflow-hidden"
              >
                {/* Control Header */}
                <div className="bg-[#0B192C] px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {act.id}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${countdown.color}`}>
                      ⏱️ {countdown.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAuditLogActivity(act)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="text-[11px]">سجل التدقيق</span>
                      </button>

                      <button
                        onClick={() => handleTriggerRollbackModal(act)}
                        className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Rollback</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">تعديل</span>
                      </button>
                    </div>

                    <div className="w-px h-4 bg-slate-700"></div>

                    <ApprovalStatusToggleBadge activity={act} onUpdate={handleUpdateActivityWithAudit} onTriggerRollback={handleTriggerRollbackModal} size="md" />
                  </div>
                </div>

                {/* Card Content Template */}
                <div className="p-4 space-y-4 bg-slate-900 text-left" dir="ltr">
                  <div className="border border-slate-750 rounded-lg overflow-hidden">
                    <div className="bg-[#1B365D] text-white px-3 py-1.5 font-bold text-xs uppercase tracking-wider">
                      1 | ACTIVITY DETAILS
                    </div>
                    <div className="divide-y divide-slate-800 bg-[#1E293B] text-xs text-white">
                      <div className="grid grid-cols-1 md:grid-cols-4 p-2.5">
                        <div className="font-bold text-slate-300">Business Activity</div>
                        <div className="md:col-span-3 font-semibold text-white">{act.activityName}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 p-2.5">
                        <div className="font-bold text-slate-300">Target System (إيقاف الخدمة)</div>
                        <div className="md:col-span-3 font-bold text-amber-300">{act.stopServiceTargetSystem || 'غير محدد'}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 p-2.5">
                        <div className="font-bold text-slate-300">Stopped System (السيستم المتأثر)</div>
                        <div className="md:col-span-3 font-bold text-rose-300">{act.stoppedSystemName || 'غير محدد'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-2" dir="rtl">
                    <h5 className="font-bold text-xs text-slate-300 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>التعليقات والملاحظات الفنية ({act.comments?.length || 0}):</span>
                    </h5>

                    {act.comments && act.comments.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mb-2">
                        {act.comments.map((c) => (
                          <div key={c.id} className="p-2 rounded-lg bg-slate-800/80 text-xs border border-slate-700">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span className="font-bold text-amber-300">{c.author}</span>
                              <span>{c.createdAt}</span>
                            </div>
                            <p className="text-slate-200">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCommentTexts[act.id] || ''}
                        onChange={(e) => setNewCommentTexts({ ...newCommentTexts, [act.id]: e.target.value })}
                        placeholder="أضف تعليقاً فنياً على التذكرة/النشاط..."
                        className="flex-1 px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <button
                        onClick={() => handleAddCommentToActivity(act.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold transition hover:bg-blue-500 cursor-pointer"
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Log Modal (Feature 6) */}
      {auditLogActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-right text-white" dir="rtl">
            <div className="bg-[#0B192C] px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                <History className="w-5 h-5 text-amber-400" />
                <span>📜 سجل التدقيق والتغييرات التفصيلي للنشاط ({auditLogActivity.id})</span>
              </div>
              <button onClick={() => setAuditLogActivity(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="font-bold text-amber-300 mb-0.5">{auditLogActivity.activityName}</div>
                <div className="text-slate-400 text-[11px]">Requestor: {auditLogActivity.requestor} • Status: {auditLogActivity.status}</div>
              </div>

              {!auditLogActivity.auditTrail || auditLogActivity.auditTrail.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  لا توجد سجلات تغييرات مسجلة سابقاً لهذا النشاط.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogActivity.auditTrail.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-bold text-cyan-300">👤 {log.actor}</span>
                        <span className="font-mono">⏰ {log.timestamp}</span>
                      </div>
                      <div className="font-bold text-white text-xs">{log.action}</div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-[#0B192C] border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAuditLogActivity(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition hover:bg-slate-700 cursor-pointer"
              >
                إغلاق السجل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print & Export Report Modal (Feature 4) */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-right text-white" dir="rtl">
            <div className="bg-[#0B192C] px-5 py-4 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                <Printer className="w-5 h-5 text-cyan-400" />
                <span>📄 4. تصدير تقارير الـ CAB المعتمدة (PDF / Excel / Print View)</span>
              </div>
              <button onClick={() => setShowPrintReportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-800 text-xs text-blue-200">
                يمكنك تصدير تقارير أنشطة التغيير الفنية بصيغة Excel أو تجهيز نموذج الطباعة المعتمد لاجتماعات لجنة الـ CAB.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تحديد نطاق التقرير (Report Scope Filter):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setExportFilterScope('APPROVED')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      exportFilterScope === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>المعتمدة فقط (Approved)</span>
                  </button>

                  <button
                    onClick={() => setExportFilterScope('DOWNTIME')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      exportFilterScope === 'DOWNTIME' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>التي تتطلب توقف (Downtime)</span>
                  </button>

                  <button
                    onClick={() => setExportFilterScope('ALL')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      exportFilterScope === 'ALL' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>جميع الأنشطة (All CABS)</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير ملف Excel (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setShowPrintReportModal(false);
                    window.print();
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة للطباعة / PDF (Print View)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-right text-white max-h-[90vh] flex flex-col" dir="rtl">
            <div className="bg-[#0B192C] px-5 py-3.5 flex justify-between items-center border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm text-white">
                {editingActivity ? `تعديل نشاط (${editingActivity.id})` : 'إضافة نشاط تغيير جديد (+CAB Activity)'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم النشاط (Business Activity):</label>
                <input
                  type="text"
                  required
                  value={formData.activityName || ''}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  placeholder="مثال: Core Database Migration"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Scope (وصف ونطاق التغيير):</label>
                <textarea
                  rows={2}
                  value={formData.scope || ''}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم السيستم المراد إيقاف الخدمة عليه:</label>
                  <input
                    type="text"
                    value={formData.stopServiceTargetSystem || ''}
                    onChange={(e) => setFormData({ ...formData, stopServiceTargetSystem: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    placeholder="مثل: خادم قاعدة البيانات الرئيسية"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم السيستم الذي سيتوقف:</label>
                  <input
                    type="text"
                    value={formData.stoppedSystemName || ''}
                    onChange={(e) => setFormData({ ...formData, stoppedSystemName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    placeholder="مثل: بوابة المعاملات المالية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">التاريخ:</label>
                  <input
                    type="text"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">وقت البدء:</label>
                  <input
                    type="text"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">وقت الانتهاء:</label>
                  <input
                    type="text"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">درجة الخطورة:</label>
                  <select
                    value={formData.riskLevel || 'Low'}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Low">🟢 منخفض (Low Risk)</option>
                    <option value="Medium">🟡 متوسط (Medium Risk)</option>
                    <option value="High">🔴 مرتفع (High Risk)</option>
                    <option value="Critical">🟣 حرج (Critical Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تطلب توقف الخدمة:</label>
                  <select
                    value={formData.downtimeRequired || 'No'}
                    onChange={(e) => setFormData({ ...formData, downtimeRequired: e.target.value as any })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="No">No (بدون توقف)</option>
                    <option value="Yes">Yes (يتطلب توقف)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  حفظ النشاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rollback Trigger Modal */}
      {rollbackModalActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-600 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-right text-white" dir="rtl">
            <div className="bg-rose-950 px-5 py-3.5 flex justify-between items-center border-b border-rose-800">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-200">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>تسجيل وتوثيق التراجع الفني (Rollback)</span>
              </div>
              <button onClick={() => setRollbackModalActivity(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-800 text-xs text-rose-200">
                تسجيل التراجع الفني للنشاط <span className="font-mono font-bold text-white">{rollbackModalActivity.id}</span>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">السبب الفني للتراجع:</label>
                <textarea
                  rows={3}
                  required
                  value={rollbackReasonInput}
                  onChange={(e) => setRollbackReasonInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  placeholder="أدخل السبب الفني للعودة للنسخة السابقة..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRollbackModalActivity(null)}
                  className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRollback}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  تأكيد التراجع وتوثيق السبب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
