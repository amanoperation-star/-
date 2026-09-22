import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { IssuesView } from './components/IssuesView';
import { AdminView } from './components/AdminView';
import { IssueModal } from './components/IssueModal';
import { DetailsModal } from './components/DetailsModal';
import { ResolveModal } from './components/ResolveModal';
import { CustomerModal } from './components/CustomerModal';
import { MergeTicketsModal } from './components/MergeTicketsModal';
import { 
  Issue, 
  AppUser, 
  CategoryRule, 
  SoundSettings, 
  SupabaseConfig, 
  AuditLog, 
  NotificationItem, 
  IssueStatus,
  Priority
} from './types';
import { 
  INITIAL_ISSUES, 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_TAGS, 
  INITIAL_CANNED_RESPONSES, 
  INITIAL_SOUND_SETTINGS,
  INITIAL_AUDIT_LOGS 
} from './utils/mockData';
import { isTicketSlaBreached, calculateDueDate } from './utils/sla';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'ENTERPRISE_ISSUE_TRACKER_PRO_V8';

export default function App() {
  // Core states
  const [issues, setIssues] = useState<Issue[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_ISSUES');
      return saved ? JSON.parse(saved) : INITIAL_ISSUES;
    } catch {
      return INITIAL_ISSUES;
    }
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_USERS');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => users[0] || INITIAL_USERS[0]);

  const [categories, setCategories] = useState<CategoryRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_CATEGORIES');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_TAGS');
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  const [cannedResponses, setCannedResponses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_CANNED');
      return saved ? JSON.parse(saved) : INITIAL_CANNED_RESPONSES;
    } catch {
      return INITIAL_CANNED_RESPONSES;
    }
  });

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_SOUND');
      return saved ? JSON.parse(saved) : INITIAL_SOUND_SETTINGS;
    } catch {
      return INITIAL_SOUND_SETTINGS;
    }
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_SUPABASE');
      return saved ? JSON.parse(saved) : { url: '', key: '', connected: false };
    } catch {
      return { url: '', key: '', connected: false };
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_AUDIT');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-sla-1',
      title: '🚨 تنبيه تجاوز SLA: INC-1001',
      desc: 'تجاوزت التذكرة INC-1001 الحد الزمني لاتفاقية مستوى الخدمة، اضغط هنا لفتح التذكرة ومتابعتها فوراً',
      time: 'الآن',
      type: 'danger',
      ticketId: 'INC-1001',
    },
    {
      id: 'notif-sla-2',
      title: 'تذكرة قيد المتابعة: INC-1002',
      desc: 'تحديث حالة تذكرة العميل شركة الأمل للتجارة وتعيين المهندس المختص، انقر للتفاصيل',
      time: 'منذ 15 د',
      type: 'warning',
      ticketId: 'INC-1002',
    },
    {
      id: 'notif-1',
      title: 'تم تشغيل النسخة الاحترافية',
      desc: 'تم تفعيل التوجيه الذكي، عداد الوقت اللحظي، وإدارة السحابة والمشرفين.',
      time: 'اليوم',
      type: 'info',
    },
  ]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ENTERPRISE_THEME');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Tab & Navigation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'issues' | 'admin'>('dashboard');
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit'>('categories');
  const [initialFilterStatus, setInitialFilterStatus] = useState<string>('ALL');

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<Issue | null>(null);

  // Customer 360 Profile Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  // Merge Tickets Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTicketIds, setMergeTicketIds] = useState<string[]>([]);

  // Sync theme with document element and storage
  useEffect(() => {
    try {
      localStorage.setItem('ENTERPRISE_THEME', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Supabase Client Reference
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // SLA breached count
  const breachedCount = issues.filter((i) =>
    isTicketSlaBreached(i.createdAt, i.dueDate, i.status)
  ).length;

  // Save to LocalStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(issues));
    } catch (e) {
      console.warn('LocalStorage Quota Warning (Issues)', e);
    }
  }, [issues]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY + '_TAGS', JSON.stringify(tags));
      localStorage.setItem(STORAGE_KEY + '_CANNED', JSON.stringify(cannedResponses));
      localStorage.setItem(STORAGE_KEY + '_SOUND', JSON.stringify(soundSettings));
      localStorage.setItem(STORAGE_KEY + '_SUPABASE', JSON.stringify(supabaseConfig));
      localStorage.setItem(STORAGE_KEY + '_AUDIT', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('LocalStorage Quota Warning (Settings)', e);
    }
  }, [users, categories, tags, cannedResponses, soundSettings, supabaseConfig, auditLogs]);

  // Initialize Supabase if config is valid
  useEffect(() => {
    if (
      supabaseConfig.url &&
      supabaseConfig.key &&
      supabaseConfig.url.startsWith('https://') &&
      !supabaseConfig.url.includes('your-project')
    ) {
      try {
        const client = createClient(supabaseConfig.url, supabaseConfig.key);
        supabaseRef.current = client;
        setSupabaseConfig((prev) => ({ ...prev, connected: true }));
      } catch {
        setSupabaseConfig((prev) => ({ ...prev, connected: false }));
      }
    }
  }, [supabaseConfig.url, supabaseConfig.key]);

  // FIX: Accurate stopwatch ticker!
  // ONLY increments for the single ticket currently marked as isWorkingNow!
  useEffect(() => {
    const timer = setInterval(() => {
      setIssues((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          if (item.isWorkingNow && item.status !== 'Resolved' && item.status !== 'Closed') {
            changed = true;
            return {
              ...item,
              workTime: (item.workTime || 0) + 1,
            };
          }
          return item;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync details modal with active issue
  useEffect(() => {
    if (detailIssue) {
      const updated = issues.find((i) => i.id === detailIssue.id);
      if (updated) setDetailIssue(updated);
    }
  }, [issues]);

  // SLA Alarm Watcher
  useEffect(() => {
    if (breachedCount > 0 && !soundSettings.muted) {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.volume = soundSettings.volume || 0.8;
        alarmAudioRef.current.play().catch(() => {
          // Autoplay policy prevented audio before user gesture
        });
      }
    } else {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
    }
  }, [breachedCount, soundSettings.muted, soundSettings.alarmUrl, soundSettings.volume]);

  // Audit Log helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `a-${Date.now()}`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      user: currentUser.name,
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Add or Update Ticket
  const handleSaveIssue = (data: Partial<Issue>) => {
    const nowIso = new Date().toISOString();
    const currentCat = categories.find((c) => c.name === data.type);
    const slaH = currentCat?.slaHours[data.priority || 'Medium'] || 24;

    if (editingIssue) {
      // Update
      const oldStatus = editingIssue.status;
      const oldOwner = editingIssue.owner;

      const updatedTimeline = [...editingIssue.timeline];
      if (oldStatus !== data.status) {
        updatedTimeline.unshift({
          id: `t-${Date.now()}`,
          time: 'الآن',
          actor: currentUser.name,
          title: 'تغيير حالة التذكرة',
          details: `تم تعديل الحالة من (${oldStatus}) إلى (${data.status}).`,
          type: 'status',
        });
      }
      if (oldOwner !== data.owner) {
        updatedTimeline.unshift({
          id: `t-${Date.now() + 1}`,
          time: 'الآن',
          actor: currentUser.name,
          title: 'إعادة تعيين المسؤول',
          details: `تحويل المسؤولية من (${oldOwner}) إلى (${data.owner}).`,
          type: 'assign',
        });
      }

      setIssues((prev) =>
        prev.map((i) =>
          i.id === editingIssue.id
            ? ({
                ...i,
                ...data,
                timeline: updatedTimeline,
              } as Issue)
            : i
        )
      );

      addAuditLog('تعديل تذكرة', `تم تحديث بيانات التذكرة ${editingIssue.id}`);
      setEditingIssue(null);
    } else {
      // Create new ticket and automatically start stopwatch and open details!
      const newId = `INC-${1000 + issues.length + 1}`;
      const initialStatus = (data.status === 'Open' || !data.status) ? ('In Progress' as IssueStatus) : data.status;
      const newIssue: Issue = {
        id: newId,
        client: data.client || 'عميل جديد',
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        tag: data.tag || tags[0] || 'VIP Client',
        type: data.type || categories[0]?.name || 'تقني / Technical',
        desc: data.desc || '',
        assigned: data.assigned || categories[0]?.assignedTeam || 'فريق الدعم',
        owner: data.owner || currentUser.name,
        priority: data.priority || 'Medium',
        status: initialStatus,
        createdAt: nowIso,
        dueDate: calculateDueDate(nowIso, data.priority || 'Medium', slaH),
        workTime: 0,
        isWorkingNow: true,
        activeWorker: currentUser.name,
        csat: 5,
        attachment: data.attachment,
        comments: [],
        timeline: [
          {
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'إنشاء التذكرة وبدء العداد تلقائياً ⏱️',
            details: `تم تسجيل البلاغ وبدء احتساب وقت العمل فوراً بواسطة ${currentUser.name}.`,
            type: 'create',
          },
        ],
      };

      // Pause any other ticket so only this new active ticket is ticking
      setIssues((prev) => [
        newIssue,
        ...prev.map((i) => (i.isWorkingNow ? { ...i, isWorkingNow: false, activeWorker: null } : i)),
      ]);

      addAuditLog('إنشاء تذكرة', `تم تسجيل بلاغ جديد برقم ${newId} للعميل ${data.client} وبدء عداد العمل فوراً`);
      setNotifications((prev) => [
        {
          id: `n-${Date.now()}`,
          title: `تذكرة جديدة [${newId}]`,
          desc: `تم استلام بلاغ ${newId} للعميل ${data.client || 'عميل جديد'} وبدء العداد فوراً. انقر لفتح التذكرة`,
          time: 'الآن',
          type: 'info',
          ticketId: newId,
        },
        ...prev,
      ]);

      // Automatically open the details modal for the newly created ticket so user sees live ticking stopwatch!
      setDetailIssue(newIssue);
      setShowDetailsModal(true);
    }
  };

  // Explicitly Start Work Timer on a ticket (guarantees NO accidental toggle back)
  const handleStartTimer = (issue: Issue) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issue.id) {
          if (item.isWorkingNow) return item;
          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'بدء جلسة العمل تلقائياً ⏱️',
            details: `بدأ الموظف ${currentUser.name} العمل على التذكرة وتشغيل المؤقت.`,
            type: 'timer',
          });

          return {
            ...item,
            isWorkingNow: true,
            activeWorker: currentUser.name,
            status: item.status === 'Open' ? ('In Progress' as IssueStatus) : item.status,
            timeline: updatedTimeline,
          };
        } else {
          // Pause timer on any other ticket to avoid multi-ticket time duplication!
          if (item.isWorkingNow) {
            return {
              ...item,
              isWorkingNow: false,
              activeWorker: null,
            };
          }
          return item;
        }
      })
    );

    setDetailIssue((prev) =>
      prev && prev.id === issue.id
        ? {
            ...prev,
            isWorkingNow: true,
            activeWorker: currentUser.name,
            status: prev.status === 'Open' ? 'In Progress' : prev.status,
          }
        : prev
    );

    addAuditLog('بدء عداد تذكرة', `تشغيل مؤقت العمل للتذكرة ${issue.id}`);
  };

  // Explicitly Pause Work Timer on a ticket
  const handlePauseTimer = (issue: Issue) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issue.id) {
          if (!item.isWorkingNow) return item;
          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'إيقاف مؤقت للعداد ⏸️',
            details: `تم إيقاف مؤقت العمل عند ${item.workTime} ثانية.`,
            type: 'timer',
          });

          return {
            ...item,
            isWorkingNow: false,
            activeWorker: null,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );

    setDetailIssue((prev) =>
      prev && prev.id === issue.id
        ? {
            ...prev,
            isWorkingNow: false,
            activeWorker: null,
          }
        : prev
    );

    addAuditLog('إيقاف عداد تذكرة', `إيقاف مؤقت العمل للتذكرة ${issue.id}`);
  };

  // Toggle Work Timer on a ticket
  const handleToggleTimer = (issue: Issue) => {
    if (issue.isWorkingNow) {
      handlePauseTimer(issue);
    } else {
      handleStartTimer(issue);
    }
  };

  // Open ticket details modal and automatically start the stopwatch timer if not closed/resolved
  const handleOpenTicketDetails = (ticket: Issue) => {
    const isUnresolved = ticket.status !== 'Resolved' && ticket.status !== 'Closed';

    if (isUnresolved) {
      handleStartTimer(ticket);
      setDetailIssue({
        ...ticket,
        isWorkingNow: true,
        activeWorker: currentUser.name,
        status: ticket.status === 'Open' ? 'In Progress' : ticket.status,
      });
    } else {
      setDetailIssue(ticket);
    }

    setShowDetailsModal(true);
  };

  // Quick Status Change
  const handleQuickStatusChange = (issue: Issue, newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === issue.id) {
          const updatedTimeline = [...i.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'تغيير الحالة السريع',
            details: `تم تحويل الحالة من (${i.status}) إلى (${newStatus}).`,
            type: 'status',
          });
          return {
            ...i,
            status: newStatus,
            isWorkingNow: newStatus === 'Resolved' || newStatus === 'Closed' ? false : i.isWorkingNow,
            timeline: updatedTimeline,
          };
        }
        return i;
      })
    );
    addAuditLog('تحديث حالة', `تحويل حالة التذكرة ${issue.id} إلى ${newStatus}`);
  };

  // Bulk Status Change
  const handleBulkChangeStatus = (issueIds: string[], newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (issueIds.includes(item.id)) {
          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'تحديث جماعي للحالة',
            details: `تم تحويل الحالة جماعياً إلى (${newStatus}).`,
            type: 'status',
          });
          return {
            ...item,
            status: newStatus,
            isWorkingNow: newStatus === 'Resolved' || newStatus === 'Closed' ? false : item.isWorkingNow,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );
    addAuditLog('تحديث جماعي', `تم تعديل حالة ${issueIds.length} تذكرة إلى ${newStatus}`);
  };

  // Bulk Delete
  const handleBulkDelete = (issueIds: string[]) => {
    setIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
    addAuditLog('حذف جماعي', `تم حذف ${issueIds.length} تذكرة نهائياً.`);
  };

  // Delete Single Issue
  const handleDeleteIssue = (issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    addAuditLog('حذف تذكرة', `تم حذف التذكرة ${issueId} نهائياً.`);
  };

  // Resolve Ticket with Reason
  const handleConfirmResolve = (issueId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'حل وإغلاق البلاغ 🟢',
            details: `تم حل المشكلة واعتماد الإجراء: ${reason}`,
            type: 'resolve',
          });

          const updatedComments = [...(item.comments || [])];
          updatedComments.push({
            id: `c-${Date.now()}`,
            user: currentUser.name,
            text: `🔒 تم حل وإغلاق التذكرة. الإجراء المعتمد: ${reason}`,
            time: 'الآن',
          });

          return {
            ...item,
            status: 'Resolved' as IssueStatus,
            resolutionReason: reason,
            resolvedAt: nowIso,
            isWorkingNow: false,
            activeWorker: null,
            comments: updatedComments,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );

    addAuditLog('حل تذكرة', `إغلاق التذكرة ${issueId} وسبب الحل: ${reason}`);
    setResolvingIssue(null);
  };

  // CSAT Rating Update
  const handleUpdateCsat = (issueId: string, rating: number) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'تقييم رضا العميل (CSAT)',
            details: `تم تسجيل تقييم الخدمة (${rating} من 5).`,
            type: 'comment',
          });
          return {
            ...item,
            csat: rating,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );
  };

  // Add Comment to Issue
  const handleAddComment = (
    issueId: string,
    commentText: string,
    attachment?: { name: string; url: string }
  ) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedComments = [...item.comments];
          updatedComments.push({
            id: `c-${Date.now()}`,
            user: currentUser.name,
            text: commentText,
            time: 'الآن',
            attachment,
          });

          const updatedTimeline = [...item.timeline];
          updatedTimeline.unshift({
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: 'إضافة ملاحظة/تعليق',
            details: commentText ? commentText.substring(0, 60) : 'إرفاق ملف توضيحي',
            type: 'comment',
          });

          return {
            ...item,
            comments: updatedComments,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );
  };

  // User Management
  const handleAddUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      ...userData,
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('إضافة موظف', `تم إنشاء حساب ${userData.name} بالدور ${userData.role} وتعيين الصلاحيات`);
  };

  const handleUpdateUserPermissions = (userId: string, newPermissions: string[]) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, permissions: newPermissions } : item))
    );
    const u = users.find((item) => item.id === userId);
    addAuditLog('تعديل صلاحيات موظف', `تم تحديث صلاحيات الموظف (${u?.name || userId}) بنجاح.`);
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find((item) => item.id === userId);
    setUsers((prev) => prev.filter((item) => item.id !== userId));
    if (u) addAuditLog('حذف مستخدم', `تم حذف الحساب ${u.name}`);
  };

  // Tag Management
  const handleAddTag = (newTag: string) => {
    if (tags.includes(newTag)) {
      alert('هذا الوسم مضاف مسبقاً!');
      return;
    }
    setTags((prev) => [...prev, newTag]);
    addAuditLog('إضافة وسم', `تمت إضافة الوسم ${newTag}`);
  };

  const handleDeleteTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    addAuditLog('حذف وسم', `تم حذف الوسم ${tagToRemove}`);
  };

  // Category Management
  const handleAddCategory = (catData: Omit<CategoryRule, 'id'>) => {
    const newCat: CategoryRule = {
      id: `cat-${Date.now()}`,
      active: true,
      ...catData,
    };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog('إضافة قسم جديد', `تمت إضافة قسم "${catData.name}" وتعيين فريق التوجيه "${catData.assignedTeam}"`);
  };

  const handleUpdateCategory = (updatedCat: CategoryRule) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    addAuditLog('تعديل قسم', `تم تحديث بيانات وقواعد توجيه القسم "${updatedCat.name}"`);
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find((c) => c.id === catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (target) {
      addAuditLog('حذف قسم', `تم حذف قسم "${target.name}" وقواعد توجيهه.`);
    }
  };

  const handleBulkDeleteCategories = (catIds: string[]) => {
    setCategories((prev) => prev.filter((c) => !catIds.includes(c.id)));
    addAuditLog('حذف جماعي للأقسام', `تم حذف ${catIds.length} من الأقسام وقواعد التوجيه.`);
  };

  const handleToggleCategoryActive = (catId: string, active: boolean) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, active } : c))
    );
    const target = categories.find((c) => c.id === catId);
    addAuditLog('تغيير حالة قسم', `${active ? 'تفعيل' : 'تعطيل'} قسم ${target?.name || catId}`);
  };

  const handleBulkToggleCategoriesActive = (catIds: string[], active: boolean) => {
    setCategories((prev) =>
      prev.map((c) => (catIds.includes(c.id) ? { ...c, active } : c))
    );
    addAuditLog('تعديل حالة جماعي', `${active ? 'تفعيل' : 'تعطيل'} ${catIds.length} من الأقسام.`);
  };

  const handleUpdateSlaRules = (catId: string, rules: Record<Priority, number>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, slaHours: rules } : c))
    );
    const target = categories.find((c) => c.id === catId);
    addAuditLog('تعديل قواعد SLA', `تم تعديل ساعات اتفاقية مستوى الخدمة للقسم "${target?.name || catId}"`);
  };

  // Canned Responses
  const handleAddCanned = (text: string) => {
    setCannedResponses((prev) => [...prev, text]);
    addAuditLog('إضافة رد سريع', text.substring(0, 30));
  };

  const handleDeleteCanned = (index: number) => {
    setCannedResponses((prev) => prev.filter((_, i) => i !== index));
  };

  // Supabase save
  const handleSaveSupabase = (url: string, key: string) => {
    setSupabaseConfig({
      url,
      key,
      connected: true,
      lastSync: new Date().toLocaleTimeString('ar-EG'),
    });
    addAuditLog('إعداد السحابة', 'تم تحديث مفاتيح الاتصال مع Supabase');
    alert('تم حفظ إعدادات الاتصال السحابي!');
  };

  const handleSyncSupabaseNow = async () => {
    if (!supabaseRef.current) {
      alert('يرجى التأكد من إدخال Project URL و Key صالحين أولاً!');
      return;
    }
    try {
      // Upsert issues to Supabase
      const payload = issues.map((i) => ({
        id: i.id,
        client: i.client,
        tag: i.tag,
        type: i.type,
        desc_text: i.desc,
        assigned: i.assigned,
        owner: i.owner,
        priority: i.priority,
        status: i.status,
        worktime: i.workTime,
        csat: i.csat,
        created_at: i.createdAt,
        due_date: i.dueDate,
      }));

      const { error } = await supabaseRef.current.from('issues').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      setSupabaseConfig((prev) => ({
        ...prev,
        connected: true,
        lastSync: new Date().toLocaleTimeString('ar-EG'),
      }));
      alert('تمت مزامنة جميع التذاكر والسجلات الحية مع قاعدة Supabase بنجاح!');
      addAuditLog('مزامنة سحابية', 'نجاح المزامنة الحية مع Supabase');
    } catch (e: any) {
      alert(`تنبيه المزامنة: ${e.message || 'تأكد من إنشاء جدول issues في مشروع Supabase'}`);
    }
  };

  // Open ticket directly by ID from notifications or direct click
  const handleSelectTicketById = (ticketId: string) => {
    const cleanId = ticketId.trim();
    const foundIssue = issues.find((i) => i.id.toLowerCase() === cleanId.toLowerCase());
    if (foundIssue) {
      setCurrentTab('issues');
      handleOpenTicketDetails(foundIssue);
    } else {
      setCurrentTab('issues');
    }
  };

  // Toggle cloud live state (simulates or activates/deactivates connection)
  const handleToggleSupabaseConnected = () => {
    setSupabaseConfig((prev) => {
      const nextConnected = !prev.connected;
      return {
        ...prev,
        connected: nextConnected,
        lastSync: nextConnected ? new Date().toLocaleTimeString('ar-EG') : prev.lastSync,
      };
    });
    addAuditLog('تبديل حالة السحابة', !supabaseConfig.connected ? 'تشغيل السحابة وتوهج الزر بالأخضر 🟢' : 'إيقاف السحابة ⚪');
  };

  // Quick jump directly to Supabase settings in Admin view
  const handleNavigateToSupabaseSettings = () => {
    setAdminSubTab('supabase');
    setCurrentTab('admin');
  };

  // Open Customer 360 profile
  const handleOpenCustomerProfile = (clientName: string) => {
    setSelectedCustomerName(clientName);
    setShowCustomerModal(true);
  };

  // Open Merge Tickets Modal
  const handleOpenMergeModal = (ticketIds: string[] | string) => {
    const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
    setMergeTicketIds(ids);
    setShowMergeModal(true);
  };

  // Confirm and execute tickets merge
  const handleConfirmMerge = (
    primaryTicketId: string,
    secondaryTicketIds: string[],
    options: {
      combineWorkTime: boolean;
      copyComments: boolean;
      mergeNote: string;
    }
  ) => {
    const primaryTicket = issues.find((i) => i.id === primaryTicketId);
    if (!primaryTicket) return;

    const secondaryTickets = issues.filter((i) => secondaryTicketIds.includes(i.id));
    const nowIso = new Date().toISOString();

    let addedWorkTime = 0;
    if (options.combineWorkTime) {
      addedWorkTime = secondaryTickets.reduce((sum, s) => sum + (s.workTime || 0), 0);
    }

    let extraComments: any[] = [];
    if (options.copyComments) {
      secondaryTickets.forEach((sec) => {
        if (sec.comments && sec.comments.length > 0) {
          extraComments.push(
            ...sec.comments.map((c) => ({
              ...c,
              id: `c-m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: `[منقول من التذكرة ${sec.id}]: ${c.text}`,
            }))
          );
        }
      });
    }

    const updatedPrimaryTimeline = [...primaryTicket.timeline];
    updatedPrimaryTimeline.unshift({
      id: `t-m-${Date.now()}`,
      time: 'الآن',
      actor: currentUser.name,
      title: 'دمج تذاكر مكررة 🔗',
      details: `تم دمج التذاكر (${secondaryTicketIds.join(', ')}) في هذه التذكرة. ${options.mergeNote}`,
      type: 'merge',
    });

    const updatedMergedTicketIds = Array.from(
      new Set([...(primaryTicket.mergedTicketIds || []), ...secondaryTicketIds])
    );

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === primaryTicketId) {
          return {
            ...item,
            workTime: (item.workTime || 0) + addedWorkTime,
            comments: [...item.comments, ...extraComments],
            timeline: updatedPrimaryTimeline,
            mergedTicketIds: updatedMergedTicketIds,
          };
        }
        if (secondaryTicketIds.includes(item.id)) {
          const secTimeline = [...item.timeline];
          secTimeline.unshift({
            id: `t-ms-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: `تم دمج التذكرة مع ${primaryTicketId} 🔗`,
            details: `أغلقت كنسخة مدمجة مع التذكرة الرئيسية ${primaryTicketId}. ${options.mergeNote}`,
            type: 'merge',
          });

          return {
            ...item,
            status: 'Resolved' as IssueStatus,
            mergedIntoTicketId: primaryTicketId,
            resolutionReason: `تم الدمج مع التذكرة الرئيسية ${primaryTicketId}`,
            resolvedAt: nowIso,
            isWorkingNow: false,
            timeline: secTimeline,
          };
        }
        return item;
      })
    );

    if (detailIssue) {
      if (detailIssue.id === primaryTicketId) {
        setDetailIssue((prev) =>
          prev
            ? {
                ...prev,
                workTime: (prev.workTime || 0) + addedWorkTime,
                comments: [...prev.comments, ...extraComments],
                timeline: updatedPrimaryTimeline,
                mergedTicketIds: updatedMergedTicketIds,
              }
            : null
        );
      } else if (secondaryTicketIds.includes(detailIssue.id)) {
        setDetailIssue((prev) =>
          prev
            ? {
                ...prev,
                status: 'Resolved',
                mergedIntoTicketId: primaryTicketId,
                resolutionReason: `تم الدمج مع التذكرة الرئيسية ${primaryTicketId}`,
              }
            : null
        );
      }
    }

    addAuditLog(
      'دمج تذاكر',
      `تم دمج التذاكر (${secondaryTicketIds.join(', ')}) في التذكرة ${primaryTicketId}`
    );

    addNotification(
      'تحديث تذكرة',
      `تم دمج ${secondaryTicketIds.length} تذكرة في البلاغ الرئيسي ${primaryTicketId}`,
      primaryTicketId
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Cairo',sans-serif] transition-colors duration-150">
      {/* Audio element for SLA alert */}
      <audio ref={alarmAudioRef} src={soundSettings.alarmUrl} preload="auto" loop />

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        onSwitchUser={setCurrentUser}
        breachedCount={breachedCount}
        soundSettings={soundSettings}
        onToggleMute={() =>
          setSoundSettings((prev) => ({ ...prev, muted: !prev.muted }))
        }
        supabaseConnected={supabaseConfig.connected}
        onToggleSupabaseConnected={handleToggleSupabaseConnected}
        onSyncSupabaseNow={handleSyncSupabaseNow}
        onNavigateToSupabaseSettings={handleNavigateToSupabaseSettings}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onSelectTicket={handleSelectTicketById}
        onOpenNewTicketModal={() => {
          setEditingIssue(null);
          setShowIssueModal(true);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            issues={issues}
            users={users}
            categories={categories}
            onSelectTicket={handleOpenTicketDetails}
            onFilterByStatus={(status) => {
              setInitialFilterStatus(status);
              setCurrentTab('issues');
            }}
            onOpenCustomerProfile={handleOpenCustomerProfile}
          />
        )}

        {currentTab === 'issues' && (
          <IssuesView
            issues={issues}
            tags={tags}
            users={users}
            currentUser={currentUser}
            initialFilterStatus={initialFilterStatus}
            onOpenDetails={handleOpenTicketDetails}
            onOpenEdit={(issue) => {
              setEditingIssue(issue);
              setShowIssueModal(true);
            }}
            onOpenResolve={(issue) => {
              setResolvingIssue(issue);
              setShowResolveModal(true);
            }}
            onDeleteIssue={handleDeleteIssue}
            onToggleTimer={handleToggleTimer}
            onQuickStatusChange={handleQuickStatusChange}
            onBulkChangeStatus={handleBulkChangeStatus}
            onBulkDelete={handleBulkDelete}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onOpenMergeModal={handleOpenMergeModal}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            initialTab={adminSubTab}
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUserPermissions={handleUpdateUserPermissions}
            tags={tags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onBulkDeleteCategories={handleBulkDeleteCategories}
            onToggleCategoryActive={handleToggleCategoryActive}
            onBulkToggleCategoryActive={handleBulkToggleCategoriesActive}
            onUpdateSlaRules={handleUpdateSlaRules}
            cannedResponses={cannedResponses}
            onAddCannedResponse={handleAddCanned}
            onDeleteCannedResponse={handleDeleteCanned}
            soundSettings={soundSettings}
            onUpdateSoundSettings={setSoundSettings}
            supabaseConfig={supabaseConfig}
            onSaveSupabaseConfig={handleSaveSupabase}
            onSyncSupabaseNow={handleSyncSupabaseNow}
            auditLogs={auditLogs}
            onClearAuditLogs={() => setAuditLogs([])}
            issues={issues}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <span className="font-medium">منظومة إدارة وتتبع المشاكل والطلبات المؤسسية (Enterprise Issue Tracker Pro)</span>
          <div className="flex items-center gap-3">
            <span>حالة المهام: {breachedCount > 0 ? `⚠️ ${breachedCount} متأخرة عن SLA` : '🟢 كل التذاكر ملتزمة باتفاقية الخدمة'}</span>
            <span>•</span>
            <span className="text-slate-400 dark:text-slate-600">v8.4 Production</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <IssueModal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setEditingIssue(null);
        }}
        onSave={handleSaveIssue}
        initialData={editingIssue}
        categories={categories}
        tags={tags}
        users={users}
      />

      <DetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailIssue(null);
        }}
        issue={detailIssue}
        currentUser={currentUser}
        cannedResponses={cannedResponses}
        onToggleTimer={handleToggleTimer}
        onStartTimer={handleStartTimer}
        onPauseTimer={handlePauseTimer}
        onUpdateCsat={handleUpdateCsat}
        onAddComment={handleAddComment}
        onOpenCustomerProfile={handleOpenCustomerProfile}
        onOpenMergeModal={handleOpenMergeModal}
        onNavigateToTicket={handleSelectTicketById}
      />

      <ResolveModal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setResolvingIssue(null);
        }}
        issue={resolvingIssue}
        cannedResponses={cannedResponses}
        onConfirmResolve={handleConfirmResolve}
      />

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomerName(null);
        }}
        clientName={selectedCustomerName}
        issues={issues}
        onOpenTicketDetails={handleOpenTicketDetails}
        onOpenNewTicketForClient={(name, phone, email) => {
          setEditingIssue(null);
          setShowIssueModal(true);
        }}
      />

      <MergeTicketsModal
        isOpen={showMergeModal}
        onClose={() => {
          setShowMergeModal(false);
          setMergeTicketIds([]);
        }}
        availableIssues={issues}
        initialTicketIds={mergeTicketIds}
        currentUser={currentUser}
        onConfirmMerge={handleConfirmMerge}
      />
    </div>
  );
}
