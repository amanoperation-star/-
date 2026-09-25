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
  Priority,
  GeneralSettings,
  SystemBackupData
} from './types';
import { realtimeSync, ActiveUserPresence, SyncConnectionStatus } from './utils/realtimeSync';
import { 
  INITIAL_ISSUES, 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_TAGS, 
  INITIAL_CANNED_RESPONSES, 
  INITIAL_SOUND_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_GENERAL_SETTINGS
} from './utils/mockData';
import { isTicketSlaBreached, calculateDueDate } from './utils/sla';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LoginScreen } from './components/LoginScreen';
import { BadgeStyleProvider } from './components/Badges';

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY + '_IS_AUTHENTICATED');
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEY + '_CURRENT_USER_ID');
      if (savedUserId) {
        const savedUsers = localStorage.getItem(STORAGE_KEY + '_USERS');
        const list: AppUser[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
        const found = list.find((u) => u.id === savedUserId);
        if (found) return found;
      }
    } catch {}
    return INITIAL_USERS[0];
  });

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

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_GENERAL');
      return saved ? JSON.parse(saved) : INITIAL_GENERAL_SETTINGS;
    } catch {
      return INITIAL_GENERAL_SETTINGS;
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
  const [adminSubTab, setAdminSubTab] = useState<'general' | 'backup' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit'>('general');
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

  // Real-time synchronization state across regions
  const [realtimeStatus, setRealtimeStatus] = useState<SyncConnectionStatus>('connecting');
  const [onlineUsers, setOnlineUsers] = useState<ActiveUserPresence[]>([]);
  const [totalConnections, setTotalConnections] = useState<number>(1);
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    desc: string;
    ticketId: string;
    author: string;
    location?: string;
  } | null>(null);

  // Auto-dismiss live toast after 7 seconds
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => setLiveToast(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

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
      localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(generalSettings));
    } catch (e) {
      console.warn('LocalStorage Quota Warning (Settings)', e);
    }
  }, [users, categories, tags, cannedResponses, soundSettings, supabaseConfig, auditLogs, generalSettings]);

  // Initialize Supabase if config is valid
  useEffect(() => {
    const url = (supabaseConfig.url || '').trim();
    const key = (supabaseConfig.key || '').trim();
    if (
      url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('your-project')
    ) {
      try {
        const client = createClient(url, key);
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

  // Notification helper
  const addNotification = (
    title: string,
    desc: string,
    ticketId?: string,
    type: 'danger' | 'warning' | 'info' = 'info'
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      desc,
      time: 'الآن',
      type,
      ticketId,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
  };

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
    realtimeSync.updateCurrentUser(currentUser);
  }, [currentUser]);

  const soundSettingsRef = useRef(soundSettings);
  useEffect(() => {
    soundSettingsRef.current = soundSettings;
  }, [soundSettings]);

  const detailIssueRef = useRef(detailIssue);
  useEffect(() => {
    detailIssueRef.current = detailIssue;
  }, [detailIssue]);

  // Real-Time Multi-Region Sync WebSocket Initialization
  useEffect(() => {
    realtimeSync.init(
      {
        onTicketCreated: (newIssue: Issue, author: string, location?: string) => {
          setIssues((prev) => {
            if (prev.some((i) => i.id === newIssue.id)) return prev;
            return [newIssue, ...prev];
          });

          // Trigger live visual alert and audio chime when created by any other team member!
          if (author !== currentUserRef.current.name) {
            setLiveToast({
              id: `toast-${Date.now()}`,
              title: `تذكرة جديدة واردة الآن [${newIssue.id}] 🚀`,
              desc: `للعميل: ${newIssue.client || 'عميل'} • الأولوية: ${newIssue.priority}`,
              ticketId: newIssue.id,
              author,
              location,
            });

            addNotification(
              `تذكرة جديدة [${newIssue.id}] 📢`,
              `تم تسجيل بلاغ جديد بواسطة ${author} (${location || 'فرع آخر'}) للعميل ${newIssue.client}`,
              newIssue.id,
              'info'
            );

            if (!soundSettingsRef.current.muted) {
              try {
                const soundUrl = soundSettingsRef.current.customNotificationUrl || soundSettingsRef.current.alarmUrl;
                if (soundUrl) {
                  const sound = new Audio(soundUrl);
                  sound.volume = soundSettingsRef.current.volume || 0.8;
                  sound.play().catch(() => {});
                }
              } catch {}
            }
          }
        },

        onTicketUpdated: (updatedIssue: Issue, actor: string, _changeType?: string, details?: string) => {
          setIssues((prev) =>
            prev.map((i) => (i.id === updatedIssue.id ? { ...i, ...updatedIssue } : i))
          );

          if (detailIssueRef.current && detailIssueRef.current.id === updatedIssue.id) {
            setDetailIssue((prev) => (prev ? { ...prev, ...updatedIssue } : prev));
          }

          if (actor !== currentUserRef.current.name) {
            addNotification(
              `تحديث في التذكرة [${updatedIssue.id}] 🔄`,
              `قام ${actor} بالتحديث: ${details || updatedIssue.status}`,
              updatedIssue.id,
              'info'
            );
          }
        },

        onTicketCommentAdded: (issueId: string, comment: any, actor: string) => {
          setIssues((prev) =>
            prev.map((i) => {
              if (i.id === issueId) {
                const exists = (i.comments || []).some((c: any) => c.id === comment.id);
                if (exists) return i;
                return {
                  ...i,
                  comments: [...(i.comments || []), comment],
                };
              }
              return i;
            })
          );

          if (detailIssueRef.current && detailIssueRef.current.id === issueId) {
            setDetailIssue((prev) =>
              prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev
            );
          }

          if (actor !== currentUserRef.current.name) {
            addNotification(
              `رد جديد في [${issueId}] 💬`,
              `أضاف ${actor}: ${comment.text ? comment.text.substring(0, 50) : 'ملاحظة'}`,
              issueId,
              'info'
            );
          }
        },

        onTicketDeleted: (issueId: string, actor: string) => {
          setIssues((prev) => prev.filter((i) => i.id !== issueId));
          if (detailIssueRef.current?.id === issueId) {
            setShowDetailsModal(false);
            setDetailIssue(null);
          }
          if (actor !== currentUserRef.current.name) {
            addNotification('حذف تذكرة 🗑️', `قام ${actor} بحذف التذكرة ${issueId}`, undefined, 'warning');
          }
        },

        onStateSynced: (serverState: any) => {
          if (Array.isArray(serverState.issues) && serverState.issues.length > 0) {
            setIssues((prev) => {
              const map = new Map(prev.map((i) => [i.id, i]));
              for (const serverIssue of serverState.issues) {
                map.set(serverIssue.id, serverIssue);
              }
              return Array.from(map.values());
            });
          }
        },

        onPresenceUpdated: (usersList: ActiveUserPresence[], total: number) => {
          setOnlineUsers(usersList);
          setTotalConnections(total);
        },

        onStatusChanged: (status: SyncConnectionStatus) => {
          setRealtimeStatus(status);
        },
      },
      currentUser
    );

    // Initial seed if server starts empty
    realtimeSync.seedInitialServerData({
      issues,
      categories,
      users,
      tags,
      cannedResponses,
      generalSettings,
      soundSettings,
      auditLogs,
    });

    return () => {
      realtimeSync.destroy();
    };
  }, []);

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

      const updatedIssue = {
        ...editingIssue,
        ...data,
        timeline: updatedTimeline,
      } as Issue;

      setIssues((prev) =>
        prev.map((i) => (i.id === editingIssue.id ? updatedIssue : i))
      );

      // Broadcast update across team
      realtimeSync.broadcastTicketUpdate(
        updatedIssue,
        currentUser.name,
        'تعديل تذكرة',
        `تم تحديث بيانات التذكرة ${editingIssue.id}`
      );

      addAuditLog('تعديل تذكرة', `تم تحديث بيانات التذكرة ${editingIssue.id}`);
      setEditingIssue(null);
    } else {
      // Create new ticket and automatically start stopwatch and open details!
      const uniqueSuffix = Math.floor(Math.random() * 900 + 100);
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

      // Broadcast new ticket immediately to entire team in all regions!
      realtimeSync.broadcastTicketCreate(newIssue, currentUser.name, currentUser.department);

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
    let updatedIssueToBroadcast: Issue | null = null;
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
          const updated: Issue = {
            ...i,
            status: newStatus,
            isWorkingNow: newStatus === 'Resolved' || newStatus === 'Closed' ? false : i.isWorkingNow,
            timeline: updatedTimeline,
          };
          updatedIssueToBroadcast = updated;
          return updated;
        }
        return i;
      })
    );

    if (updatedIssueToBroadcast) {
      realtimeSync.broadcastTicketUpdate(
        updatedIssueToBroadcast,
        currentUser.name,
        'تغيير الحالة',
        `تم تحويل الحالة إلى (${newStatus})`
      );
    }

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
          const updated: Issue = {
            ...item,
            status: newStatus,
            isWorkingNow: newStatus === 'Resolved' || newStatus === 'Closed' ? false : item.isWorkingNow,
            timeline: updatedTimeline,
          };
          realtimeSync.broadcastTicketUpdate(
            updated,
            currentUser.name,
            'تحديث جماعي للحالة',
            `تحويل إلى (${newStatus})`
          );
          return updated;
        }
        return item;
      })
    );
    addAuditLog('تحديث جماعي', `تم تعديل حالة ${issueIds.length} تذكرة إلى ${newStatus}`);
  };

  // Bulk Delete
  const handleBulkDelete = (issueIds: string[]) => {
    setIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
    issueIds.forEach((id) => realtimeSync.broadcastTicketDelete(id, currentUser.name));
    addAuditLog('حذف جماعي', `تم حذف ${issueIds.length} تذكرة نهائياً.`);
  };

  // Delete Single Issue
  const handleDeleteIssue = (issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    realtimeSync.broadcastTicketDelete(issueId, currentUser.name);
    addAuditLog('حذف تذكرة', `تم حذف التذكرة ${issueId} نهائياً.`);
  };

  // Resolve Ticket with Reason
  const handleConfirmResolve = (issueId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    let resolvedIssueToBroadcast: Issue | null = null;

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

          const resolved: Issue = {
            ...item,
            status: 'Resolved' as IssueStatus,
            resolutionReason: reason,
            resolvedAt: nowIso,
            isWorkingNow: false,
            activeWorker: null,
            comments: updatedComments,
            timeline: updatedTimeline,
          };
          resolvedIssueToBroadcast = resolved;
          return resolved;
        }
        return item;
      })
    );

    if (resolvedIssueToBroadcast) {
      realtimeSync.broadcastTicketUpdate(
        resolvedIssueToBroadcast,
        currentUser.name,
        'حل التذكرة',
        `تم حل التذكرة: ${reason}`
      );
    }

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
          const updated: Issue = {
            ...item,
            csat: rating,
            timeline: updatedTimeline,
          };
          realtimeSync.broadcastTicketUpdate(
            updated,
            currentUser.name,
            'تقييم رضا العميل',
            `${rating} من 5`
          );
          return updated;
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
    const newComment = {
      id: `c-${Date.now()}`,
      user: currentUser.name,
      text: commentText,
      time: 'الآن',
      attachment,
    };

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedComments = [...item.comments, newComment];
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

    // Broadcast new comment to all team members
    realtimeSync.broadcastComment(issueId, newComment, currentUser.name);
  };

  // User Management
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY + '_IS_AUTHENTICATED', 'true');
      localStorage.setItem(STORAGE_KEY + '_CURRENT_USER_ID', user.id);
    } catch (e) {
      console.error(e);
    }
    addAuditLog('تسجيل دخول', `قام الموظف ${user.name} (${user.role}) بتسجيل الدخول إلى المنظومة.`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY + '_IS_AUTHENTICATED');
    } catch (e) {
      console.error(e);
    }
    addAuditLog('تسجيل خروج', `قام الموظف ${currentUser.name} بتسجيل الخروج من المنظومة.`);
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY + '_CURRENT_USER_ID', user.id);
    } catch {}
    addAuditLog('تبديل مستخدم', `تم تبديل جلسة العمل إلى ${user.name} (${user.role})`);
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, password: newPassword } : item))
    );
    const u = users.find((item) => item.id === userId);
    addAuditLog('تغيير كلمة المرور', `تم تحديث كلمة المرور للموظف (${u?.name || userId}) بنجاح.`);
  };

  const handleAddUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      ...userData,
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('إضافة موظف', `تم إنشاء حساب ${userData.name} بالدور ${userData.role} وتحديد كلمة المرور والصلاحيات`);
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
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    setSupabaseConfig({
      url: cleanUrl,
      key: cleanKey,
      connected: !!(cleanUrl && cleanKey),
      lastSync: new Date().toLocaleTimeString('ar-EG'),
    });
    if (cleanUrl && cleanKey && cleanUrl.startsWith('https://')) {
      try {
        const client = createClient(cleanUrl, cleanKey);
        supabaseRef.current = client;
      } catch (err) {
        console.warn('Error creating supabase client:', err);
      }
    }
    addAuditLog('إعداد السحابة', 'تم حفظ وتحديث مفتاح الربط Publishable API Key مع Supabase');
    alert('تم حفظ إعدادات الاتصال السحابي عبر Publishable API Key بنجاح!');
  };

  // Test Supabase Connection with Publishable API Key
  const handleTestSupabaseConnection = async (
    url: string,
    key: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      return {
        success: false,
        message: 'يرجى إدخال رابط المشروع Project URL ومفتاح Publishable API Key أولاً.',
      };
    }

    if (!cleanUrl.startsWith('https://')) {
      return {
        success: false,
        message: 'رابط Project URL يجب أن يبدأ بـ https://',
      };
    }

    try {
      const client = createClient(cleanUrl, cleanKey);
      const { error: issuesErr } = await client.from('issues').select('id').limit(1);

      if (issuesErr) {
        if (
          issuesErr.code === '42P01' ||
          issuesErr.code === 'PGRST116' ||
          issuesErr.code === 'PGRST204' ||
          issuesErr.message?.toLowerCase().includes('does not exist') ||
          issuesErr.message?.includes('relation "issues" does not exist')
        ) {
          supabaseRef.current = client;
          setSupabaseConfig((prev) => ({ ...prev, url: cleanUrl, key: cleanKey, connected: true }));
          return {
            success: true,
            message: 'تم التحقق من الـ Publishable API Key بنجاح! 🟢 (ملاحظة: الجداول السحابية لم تُنشأ بعد، يرجى نسخ كود SQL الشامل من الزر بالأسفل وتشغيله في Supabase SQL Editor لحفظ التذاكر واليوزرات والإعدادات).',
          };
        }

        return {
          success: false,
          message: `فشل التحقق من المفتاح: ${issuesErr.message} (رمز الخطأ: ${issuesErr.code || 'عام'})`,
        };
      }

      supabaseRef.current = client;
      setSupabaseConfig((prev) => ({ ...prev, url: cleanUrl, key: cleanKey, connected: true }));
      return {
        success: true,
        message: 'الاتصال سليم 100%! تم التحقق من مشروع Supabase وجاهز لحفظ واسترجاع التذاكر واليوزرات والإعدادات سحابياً 🟢',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `تعذر الاتصال بـ Supabase: ${err?.message || 'تأكد من صحة الرابط ومفتاح الـ API'}`
      };
    }
  };

  // Full Push to Supabase (Issues, Users, Settings)
  const handleSyncSupabaseNow = async (silent = false) => {
    if (!supabaseRef.current) {
      if (!silent) alert('يرجى التأكد من إدخال Project URL و Publishable API Key صالحين أولاً!');
      return;
    }
    try {
      const client = supabaseRef.current;

      // 1. Upsert issues
      const issuesPayload = issues.map((i) => ({
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

      const { error: issuesError } = await client.from('issues').upsert(issuesPayload, { onConflict: 'id' });
      if (issuesError && !issuesError.message?.includes('does not exist')) {
        console.warn('Issues sync note:', issuesError);
      }

      // 2. Upsert app_users
      const usersPayload = users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
        permissions: u.permissions || [],
        password: u.password || '123456',
      }));

      const { error: usersError } = await client.from('app_users').upsert(usersPayload, { onConflict: 'id' });
      if (usersError && !usersError.message?.includes('does not exist')) {
        console.warn('Users sync note:', usersError);
      }

      // 3. Upsert system_cloud_store (categories, tags, canned responses, settings)
      const systemStorePayload = [
        { key: 'categories', data: categories, updated_at: new Date().toISOString() },
        { key: 'tags', data: tags, updated_at: new Date().toISOString() },
        { key: 'canned_responses', data: cannedResponses, updated_at: new Date().toISOString() },
        { key: 'general_settings', data: generalSettings, updated_at: new Date().toISOString() },
        { key: 'sound_settings', data: soundSettings, updated_at: new Date().toISOString() },
        { key: 'audit_logs', data: auditLogs.slice(0, 100), updated_at: new Date().toISOString() },
      ];

      const { error: storeError } = await client.from('system_cloud_store').upsert(systemStorePayload, { onConflict: 'key' });
      if (storeError && !storeError.message?.includes('does not exist')) {
        console.warn('Store sync note:', storeError);
      }

      setSupabaseConfig((prev) => ({
        ...prev,
        connected: true,
        lastSync: new Date().toLocaleTimeString('ar-EG'),
      }));

      if (!silent) {
        alert(
          `✅ تمت المزامنة الشاملة وحفظ كل البيانات في السحابة بنجاح!\n\n` +
          `• تذاكر وبلاغات: ${issues.length} تذكرة محفوظة\n` +
          `• مستخدمين وصلاحيات: ${users.length} مستخدم مع كلمات المرور\n` +
          `• أقسام وقواعد توجيه: ${categories.length} قسم\n` +
          `• الوسوم والردود الجاهزة والإعدادات العامة محفوظة بالكامل.`
        );
      }
      addAuditLog('مزامنة سحابية شاملة', `تم حفظ وتحديث ${issues.length} تذكرة و ${users.length} مستخدم في Supabase`);
    } catch (e: any) {
      if (!silent) {
        alert(`تنبيه المزامنة: ${e.message || 'تأكد من إنشاء الجداول عبر كود SQL المتاح في المنظومة'}`);
      }
    }
  };

  // Full Pull from Supabase (Issues, Users, Settings)
  const handlePullSupabaseNow = async (silent = false) => {
    if (!supabaseRef.current) {
      if (!silent) alert('يرجى التأكد من الاتصال بـ Supabase أولاً!');
      return;
    }
    try {
      const client = supabaseRef.current;
      let pulledIssues = 0;
      let pulledUsers = 0;
      let pulledCats = 0;

      // 1. Pull issues
      const { data: issuesData, error: issuesErr } = await client.from('issues').select('*');
      if (!issuesErr && issuesData && issuesData.length > 0) {
        const mappedIssues: Issue[] = issuesData.map((row: any) => ({
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
        setIssues(mappedIssues);
        pulledIssues = mappedIssues.length;
      }

      // 2. Pull app_users
      const { data: usersData, error: usersErr } = await client.from('app_users').select('*');
      if (!usersErr && usersData && usersData.length > 0) {
        const mappedUsers: AppUser[] = usersData.map((row: any) => ({
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
        setUsers(mappedUsers);
        pulledUsers = mappedUsers.length;
      }

      // 3. Pull system_cloud_store
      const { data: storeData, error: storeErr } = await client.from('system_cloud_store').select('*');
      if (!storeErr && storeData) {
        for (const row of storeData) {
          if (row.key === 'categories' && Array.isArray(row.data)) {
            setCategories(row.data);
            pulledCats = row.data.length;
          } else if (row.key === 'tags' && Array.isArray(row.data)) {
            setTags(row.data);
          } else if (row.key === 'canned_responses' && Array.isArray(row.data)) {
            setCannedResponses(row.data);
          } else if (row.key === 'general_settings' && row.data && typeof row.data === 'object') {
            setGeneralSettings(row.data);
          } else if (row.key === 'sound_settings' && row.data && typeof row.data === 'object') {
            setSoundSettings(row.data);
          }
        }
      }

      setSupabaseConfig((prev) => ({
        ...prev,
        connected: true,
        lastSync: new Date().toLocaleTimeString('ar-EG'),
      }));

      if (!silent) {
        alert(
          `📥 تم استيراد واسترجاع جميع البيانات السحابية بنجاح!\n\n` +
          `• استيراد ${pulledIssues} تذكرة من السحابة\n` +
          `• استيراد ${pulledUsers} مستخدم مع كلمات المرور والصلاحيات\n` +
          `• استيراد ${pulledCats} قسم وقواعد التوجيه والإعدادات والوسوم.`
        );
      }
      addAuditLog('استيراد سحابي شامل', `تم استيراد ${pulledIssues} تذكرة و ${pulledUsers} مستخدم من Supabase`);
    } catch (e: any) {
      if (!silent) {
        alert(`تنبيه أثناء الاستيراد: ${e.message || 'تأكد من وجود البيانات والجداول في السحابة'}`);
      }
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

  // Full System Restore handler (Overwrite or Merge)
  const handleRestoreBackup = (backup: SystemBackupData, mode: 'overwrite' | 'merge') => {
    if (mode === 'overwrite') {
      if (Array.isArray(backup.issues)) setIssues(backup.issues);
      if (Array.isArray(backup.users) && backup.users.length > 0) setUsers(backup.users);
      if (Array.isArray(backup.categories) && backup.categories.length > 0) setCategories(backup.categories);
      if (Array.isArray(backup.tags) && backup.tags.length > 0) setTags(backup.tags);
      if (Array.isArray(backup.cannedResponses) && backup.cannedResponses.length > 0) setCannedResponses(backup.cannedResponses);
      if (backup.soundSettings) setSoundSettings(backup.soundSettings);
      if (backup.generalSettings) setGeneralSettings(backup.generalSettings);
      if (Array.isArray(backup.auditLogs)) setAuditLogs(backup.auditLogs);
      addAuditLog('استعادة نسخة احتياطية', `استبدال شامل لكافة بيانات المنظومة من نسخة احتياطية (${backup.issues?.length || 0} تذكرة)`);
    } else {
      // Merge mode: Add missing items without overwriting existing IDs
      if (Array.isArray(backup.issues)) {
        setIssues((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newIssues = backup.issues.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newIssues];
        });
      }
      if (Array.isArray(backup.categories)) {
        setCategories((prev) => {
          const existingCatNames = new Set(prev.map((c) => c.name.toLowerCase()));
          const newCats = backup.categories.filter((c) => !existingCatNames.has(c.name.toLowerCase()));
          return [...prev, ...newCats];
        });
      }
      if (Array.isArray(backup.users)) {
        setUsers((prev) => {
          const existingUsernames = new Set(prev.map((u) => u.username.toLowerCase()));
          const newUsers = backup.users.filter((u) => !existingUsernames.has(u.username.toLowerCase()));
          return [...prev, ...newUsers];
        });
      }
      if (Array.isArray(backup.tags)) {
        setTags((prev) => Array.from(new Set([...prev, ...backup.tags])));
      }
      if (Array.isArray(backup.cannedResponses)) {
        setCannedResponses((prev) => Array.from(new Set([...prev, ...backup.cannedResponses])));
      }
      addAuditLog('دمج نسخة احتياطية', `تم دمج بيانات جديدة من نسخة احتياطية ذكياً`);
    }
  };

  // Reset system to factory default
  const handleResetSystemToDefault = () => {
    if (confirm('⚠️ تحذير شديد: هل أنت متأكد تماماً من رغبتك في مسح كافة التعديلات واستعادة بيانات المصنع الافتراضية للمنظومة؟ لا يمكن التراجع عن هذا الإجراء إلا إذا كنت قد حمّلت نسخة احتياطية مسبقاً.')) {
      setIssues(INITIAL_ISSUES);
      setUsers(INITIAL_USERS);
      setCategories(INITIAL_CATEGORIES);
      setTags(INITIAL_TAGS);
      setCannedResponses(INITIAL_CANNED_RESPONSES);
      setSoundSettings(INITIAL_SOUND_SETTINGS);
      setGeneralSettings(INITIAL_GENERAL_SETTINGS);
      setAuditLogs(INITIAL_AUDIT_LOGS);

      try {
        localStorage.removeItem(STORAGE_KEY + '_ISSUES');
        localStorage.removeItem(STORAGE_KEY + '_USERS');
        localStorage.removeItem(STORAGE_KEY + '_CATEGORIES');
        localStorage.removeItem(STORAGE_KEY + '_TAGS');
        localStorage.removeItem(STORAGE_KEY + '_CANNED');
        localStorage.removeItem(STORAGE_KEY + '_SOUND');
        localStorage.removeItem(STORAGE_KEY + '_GENERAL');
        localStorage.removeItem(STORAGE_KEY + '_AUDIT');
      } catch (e) {
        console.error('Error clearing localStorage', e);
      }
      alert('تمت استعادة المنظومة بنجاح إلى الإعدادات الأولية!');
    }
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

  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        generalSettings={generalSettings}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <BadgeStyleProvider style={generalSettings.badgeStyle || 'clean-arabic'}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Cairo',sans-serif] transition-colors duration-150">
      {/* Audio element for SLA alert */}
      <audio ref={alarmAudioRef} src={soundSettings.alarmUrl} preload="auto" loop />

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
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
        generalSettings={generalSettings}
        realtimeStatus={realtimeStatus}
        onlineUsers={onlineUsers}
        totalConnections={totalConnections}
        onRefreshRealtime={() => realtimeSync.fetchServerState()}
      />

      {/* Floating Multi-Region Live Notification Toast */}
      {liveToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.35)] p-4 animate-scaleUp">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>تنبيه سحابي فوري 🌐</span>
              </h4>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                {liveToast.title}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {liveToast.desc}
              </p>
              <div className="text-[10px] text-slate-400 mt-1">
                بواسطة: {liveToast.author} {liveToast.location ? `• ${liveToast.location}` : ''}
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                handleSelectTicketById(liveToast.ticketId);
                setLiveToast(null);
              }}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow shadow-emerald-600/20 active:scale-95"
            >
              فتح وعرض التذكرة الآن 👁️
            </button>
            <button
              onClick={() => setLiveToast(null)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              تجاهل
            </button>
          </div>
        </div>
      )}

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
            onUpdateUserPassword={handleUpdateUserPassword}
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
            onPullSupabaseNow={handlePullSupabaseNow}
            onTestSupabaseConnection={handleTestSupabaseConnection}
            auditLogs={auditLogs}
            onClearAuditLogs={() => setAuditLogs([])}
            issues={issues}
            generalSettings={generalSettings}
            onUpdateGeneralSettings={setGeneralSettings}
            onRestoreBackup={handleRestoreBackup}
            onResetSystemToDefault={handleResetSystemToDefault}
            realtimeStatus={realtimeStatus}
            onlineUsers={onlineUsers}
            totalConnections={totalConnections}
            onRefreshRealtime={() => realtimeSync.fetchServerState()}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer with Dynamic Copyright & Custom Note */}
      {generalSettings.showFooterCopyright !== false && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-150">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 text-right">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {generalSettings.copyrightText || 'جميع الحقوق محفوظة'}
              </span>
              {generalSettings.companyName && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{generalSettings.companyName}</span>
                </>
              )}
              {generalSettings.customFooterNote && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">{generalSettings.customFooterNote}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>حالة المهام: {breachedCount > 0 ? `⚠️ ${breachedCount} متأخرة عن SLA` : '🟢 كل التذاكر ملتزمة باتفاقية الخدمة'}</span>
              <span>•</span>
              <span className="text-slate-400 dark:text-slate-600">v8.4 Production</span>
            </div>
          </div>
        </footer>
      )}

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
          setEditingIssue({
            client: name,
            clientPhone: phone,
            clientEmail: email,
          } as any);
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
    </BadgeStyleProvider>
  );
}
