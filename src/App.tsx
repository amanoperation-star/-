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
import { SlaManagementView } from './components/SlaManagementView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { AgentScratchpad } from './components/AgentScratchpad';
import { CabBusinessActivityView } from './components/CabBusinessActivityView';
import { AdminAnalyticsDashboard } from './components/AdminAnalyticsDashboard';
import { CloudSyncImportModal } from './components/CloudSyncImportModal';
import { ProductionResetModal, ResetOptions } from './components/ProductionResetModal';
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
  SystemBackupData,
  ExternalVendor,
  SlaSettings,
  CabBusinessActivity
} from './types';
import { realtimeSync, ActiveUserPresence, SyncConnectionStatus } from './utils/realtimeSync';
import { realtimeHub } from './utils/realtimeHub';
import { playNotificationChime } from './utils/audioChime';
import { 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_TAGS, 
  INITIAL_CANNED_RESPONSES, 
  INITIAL_SOUND_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_GENERAL_SETTINGS,
  INITIAL_CAB_ACTIVITIES
} from './utils/mockData';
import { isTicketSlaBreached, calculateDueDate, DEFAULT_SLA_SETTINGS } from './utils/sla';
import { supabase, testSupabaseConnection, DEFAULT_SUPABASE_PROJECT_URL, DEFAULT_SUPABASE_PUBLISHABLE_KEY } from './utils/supabaseClient';
import { hasPermission } from './utils/permissions';
import { LoginScreen } from './components/LoginScreen';
import { BadgeStyleProvider } from './components/Badges';
import { collisionManager } from './utils/collisionDetector';

const STORAGE_KEY = 'ENTERPRISE_ISSUE_TRACKER_PRO_V9';

export default function App() {
  // Core states
  const [issues, setIssues] = useState<Issue[]>(() => {
    try {
      const legacyKeys = [
        'ENTERPRISE_ISSUE_TRACKER_PRO_V8_ISSUES',
        'ENTERPRISE_ISSUE_TRACKER_PRO_V7_ISSUES',
        'ENTERPRISE_HELPDESK_ISSUES',
      ];
      legacyKeys.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      let deletedSet = new Set<string>();
      try {
        const deletedSaved = localStorage.getItem(STORAGE_KEY + '_DELETED_ISSUE_IDS');
        if (deletedSaved) {
          const parsedDel = JSON.parse(deletedSaved);
          if (Array.isArray(parsedDel)) deletedSet = new Set(parsedDel);
        }
      } catch {}

      const saved = localStorage.getItem(STORAGE_KEY + '_ISSUES');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((i: any) => !deletedSet.has(i.id));
          return valid;
        }
      }
      return [];
    } catch {
      return [];
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
      if (savedAuth !== null) return savedAuth === 'true';
    } catch {}
    // Default to true so ANY team member opening the shared link enters directly without login!
    return true;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.url.includes('supabase.co')) {
          return { ...parsed, connected: true };
        }
      }
    } catch {}
    return {
      url: DEFAULT_SUPABASE_PROJECT_URL,
      key: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
      connected: true,
      lastSync: 'الآن',
    };
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

  const [externalVendors, setExternalVendors] = useState<ExternalVendor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_EXTERNAL_VENDORS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [slaSettings, setSlaSettings] = useState<SlaSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_SLA_SETTINGS');
      return saved ? { ...DEFAULT_SLA_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SLA_SETTINGS;
    } catch {
      return DEFAULT_SLA_SETTINGS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_NOTIFICATIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Cross-tab localStorage listener to sync notifications immediately when cleared in another tab/window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY + '_NOTIFICATIONS') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          setNotifications(Array.isArray(updated) ? updated : []);
        } catch {
          setNotifications([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleClearAllNotifications = (broadcast = true) => {
    setNotifications([]);
    try {
      localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', '[]');
    } catch {}
    if (broadcast) {
      realtimeHub.broadcast('notifications:clear_all', {}, currentUser.name);
      realtimeSync.broadcastClearNotifications(currentUser.name);
    }
  };

  const handleClearSingleNotification = (id: string, broadcast = true) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (broadcast) {
      realtimeHub.broadcast('notification:clear_single', { id }, currentUser.name);
      realtimeSync.broadcastClearSingleNotification(id, currentUser.name);
    }
  };

  // Comprehensive Notification Helper - Bound to all live system and team actions
  const addNotification = (
    title: string,
    desc: string,
    ticketId?: string,
    type: 'danger' | 'warning' | 'info' | 'success' = 'info',
    broadcast = true
  ) => {
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      desc,
      time: timeStr || 'الآن',
      type,
      ticketId,
    };
    setNotifications((prev) => {
      const next = [newNotif, ...prev.filter((n) => n.id !== newNotif.id).slice(0, 49)];
      try {
        localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (broadcast) {
      realtimeSync.broadcastAddNotification(newNotif, currentUser.name);
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ENTERPRISE_THEME');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [appSkin, setAppSkin] = useState<'standard' | 'amethyst' | 'cyberpunk' | 'ocean'>(() => {
    try {
      const saved = localStorage.getItem('ENTERPRISE_SKIN');
      return (saved === 'amethyst' || saved === 'cyberpunk' || saved === 'ocean') ? saved : 'standard';
    } catch {
      return 'standard';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ENTERPRISE_SKIN', appSkin);
    } catch {}
  }, [appSkin]);

  // Tab & Navigation: Default to 'issues' so ANY team member opening the link sees tickets immediately!
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'issues' | 'sla' | 'customer' | 'admin' | 'cab' | 'analytics'>('issues');
  const [adminSubTab, setAdminSubTab] = useState<'general' | 'backup' | 'users' | 'tags' | 'audio' | 'reports' | 'categories' | 'canned' | 'supabase' | 'csat' | 'audit'>('general');
  const [initialFilterStatus, setInitialFilterStatus] = useState<string>('Open');
  const [isGlobalCloudImportModalOpen, setIsGlobalCloudImportModalOpen] = useState(false);

  // CAB Business Activities State
  const [cabActivities, setCabActivities] = useState<CabBusinessActivity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_CAB_ACTIVITIES');
      return saved ? JSON.parse(saved) : INITIAL_CAB_ACTIVITIES;
    } catch {
      return INITIAL_CAB_ACTIVITIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', JSON.stringify(cabActivities));
    } catch {}
  }, [cabActivities]);

  const handleAddCabActivity = (act: CabBusinessActivity) => {
    setCabActivities((prev) => [act, ...prev]);
    realtimeHub.broadcast('cab:created', { activity: act }, currentUser.name);
    upsertSingleCabActivityToSupabase(act);
    addAuditLog('إضافة نشاط CAB', `تم تسجيل نشاط التغيير ${act.id} (${act.activityName}) ومزامنته سحابياً`);
    addNotification('نشاط تغيير CAB جديد 📋', `تم تسجيل نشاط التغيير ${act.id} (${act.activityName})`, undefined, 'success');
  };

  const handleUpdateCabActivity = (act: CabBusinessActivity) => {
    setCabActivities((prev) => prev.map((a) => (a.id === act.id ? act : a)));
    realtimeHub.broadcast('cab:updated', { activity: act, details: `تحديث نشاط ${act.id}` }, currentUser.name);
    upsertSingleCabActivityToSupabase(act);
    addAuditLog('تعديل نشاط CAB', `تم تحديث نشاط التغيير ${act.id}`);
    addNotification('تحديث نشاط CAB 🔄', `تم تحديث بيانات نشاط التغيير ${act.id}`, undefined, 'info');
  };

  const handleDeleteCabActivity = (id: string) => {
    setCabActivities((prev) => prev.filter((a) => a.id !== id));
    realtimeHub.broadcast('cab:deleted', { activityId: id }, currentUser.name);
    deleteSingleCabActivityFromSupabase(id);
    addAuditLog('حذف نشاط CAB', `تم حذف نشاط التغيير ${id}`);
    addNotification('حذف نشاط CAB 🗑️', `تم حذف نشاط التغيير ${id}`, undefined, 'warning');
  };

  // Enforce access control based on granular permissions
  useEffect(() => {
    if (currentTab === 'dashboard' && !hasPermission(currentUser, 'page.dashboard')) {
      setCurrentTab('issues');
    } else if (currentTab === 'cab' && !hasPermission(currentUser, 'page.cab_board')) {
      setCurrentTab('issues');
    } else if (currentTab === 'admin' && currentUser.role !== 'Admin') {
      setCurrentTab('issues');
    }
  }, [currentUser, currentTab]);

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isClientSubmission, setIsClientSubmission] = useState(false);
  const [showPublicCustomerPortalModal, setShowPublicCustomerPortalModal] = useState(false);

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

  // Production Factory Reset Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingSystem, setIsResettingSystem] = useState(false);
  const [resetStepText, setResetStepText] = useState('');

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
  const [isToastPaused, setIsToastPaused] = useState(false);

  // Auto-dismiss live toast after 25 seconds, paused when hovered so user has ample time to interact
  useEffect(() => {
    if (liveToast && !isToastPaused) {
      const timer = setTimeout(() => setLiveToast(null), 25000);
      return () => clearTimeout(timer);
    }
  }, [liveToast, isToastPaused]);

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

  // Supabase Client Reference (Using singleton global instance)
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // SLA breached count
  const breachedCount = issues.filter((i) =>
    isTicketSlaBreached(i.createdAt, i.dueDate, i.status)
  ).length;

  const isHydratedRef = useRef(false);
  const deletedIssueIdsRef = useRef<Set<string>>((() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_DELETED_ISSUE_IDS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set<string>(parsed);
      }
    } catch {}
    return new Set<string>();
  })());

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const cannedResponsesRef = useRef(cannedResponses);
  cannedResponsesRef.current = cannedResponses;
  const generalSettingsRef = useRef(generalSettings);
  generalSettingsRef.current = generalSettings;
  const soundSettingsRef = useRef(soundSettings);
  soundSettingsRef.current = soundSettings;
  const auditLogsRef = useRef(auditLogs);
  auditLogsRef.current = auditLogs;
  const externalVendorsRef = useRef(externalVendors);
  externalVendorsRef.current = externalVendors;
  const slaSettingsRef = useRef(slaSettings);
  slaSettingsRef.current = slaSettings;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const detailIssueRef = useRef(detailIssue);
  detailIssueRef.current = detailIssue;

  const saveDeletedIssueIds = (idsSet: Set<string>) => {
    try {
      const arr = Array.from(idsSet);
      localStorage.setItem(STORAGE_KEY + '_DELETED_ISSUE_IDS', JSON.stringify(arr));
      if (supabaseRef.current) {
        Promise.resolve(
          supabaseRef.current.from('system_cloud_store').upsert(
            [{ key: 'deleted_issue_ids', data: arr, updated_at: new Date().toISOString() }],
            { onConflict: 'key' }
          )
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('Error persisting deleted issue IDs:', e);
    }
  };

  // Save to LocalStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(issues));
    } catch (e) {
      console.warn('LocalStorage Quota Warning (Issues)', e);
    }
  }, [issues]);

  // Continuous Supabase Auto-Save
  // Automatically persists ANY update to Supabase tables without manual intervention
  useEffect(() => {
    if (!isHydratedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        if (supabaseRef.current) {
          handleSyncSupabaseNow(true);
        }
      } catch (err) {
        console.warn('[Auto-Cloud-Sync] Background persist error:', err);
      }
    }, 1500); // 1500ms debounce to batch rapid changes smoothly and avoid churn

    return () => clearTimeout(timer);
  }, [
    issues,
    users,
    categories,
    tags,
    cannedResponses,
    generalSettings,
    soundSettings,
    auditLogs,
    externalVendors,
    slaSettings,
    cabActivities,
  ]);

  // Initialize Supabase and pull data on load
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePullSupabaseNow(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [supabaseConfig.url, supabaseConfig.key]);

  const mapSingleRowToUser = (row: any): AppUser => {
    return {
      id: row.id,
      name: row.name || 'مستخدم جديد',
      username: row.username || row.email?.split('@')[0] || 'user',
      email: row.email || '',
      role: row.role || 'Agent',
      department: row.department || 'الدعم الفني',
      avatar: row.avatar || row.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      password: row.password || '123456',
    };
  };

  const mapSingleRowToCab = (row: any): CabBusinessActivity => {
    return {
      id: row.id,
      activityName: row.activity_name || row.activityName || 'نشاط صيانة',
      scope: row.scope || '',
      impactedServices: row.impacted_services || row.impactedServices || '',
      serviceImpact: row.service_impact || row.serviceImpact || '',
      stopServiceTargetSystem: row.stop_service_target_system || row.stopServiceTargetSystem || 'No',
      stoppedSystemName: row.stopped_system_name || row.stoppedSystemName || '',
      downtimeRequired: row.downtime_required || row.downtimeRequired || 'No',
      date: row.date || '',
      startTime: row.start_time || row.startTime || '',
      endTime: row.end_time || row.endTime || '',
      maintenanceWindow: row.maintenance_window || row.maintenanceWindow || '',
      requestor: row.requestor || '',
      tpm: row.tpm || '',
      changeManagement: row.change_management || row.changeManagement || 'IT Change Management',
      status: row.status || 'Pending Approval',
      riskLevel: row.risk_level || row.riskLevel || 'Low',
      rollbackPlan: row.rollback_plan || row.rollbackPlan || '',
      rollbackReason: row.rollback_reason || row.rollbackReason || '',
      comments: row.comments || [],
      auditTrail: row.audit_trail || row.auditTrail || [],
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    };
  };

  const handleIssueRealtime = (payload: any) => {
    console.log('[Realtime Event Received - issues]:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      const incoming = mapSingleRowToIssue(payload.new);
      if (deletedIssueIdsRef.current.has(incoming.id)) return;
      setIssues((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });

      // Play sound and show toast
      setLiveToast({
        id: `toast-${Date.now()}`,
        title: `تذكرة جديدة واردة الآن [${incoming.id}] 🚀`,
        desc: `للعميل: ${incoming.client || 'عميل'} • الأولوية: ${incoming.priority}`,
        ticketId: incoming.id,
        author: incoming.owner || 'زميل في الفريق',
      });
      
      addNotification(
        `تذكرة جديدة [${incoming.id}] 📢`,
        `تم تسجيل بلاغ جديد للعميل ${incoming.client}`,
        incoming.id,
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
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updated = mapSingleRowToIssue(payload.new);
      setIssues((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (detailIssueRef.current && detailIssueRef.current.id === updated.id) {
        setDetailIssue(updated);
      }
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const oldRow = payload.old;
      if (oldRow && oldRow.id) {
        deletedIssueIdsRef.current.add(oldRow.id);
        saveDeletedIssueIds(deletedIssueIdsRef.current);
        setIssues((prev) => prev.filter((item) => item.id !== oldRow.id));
        if (detailIssueRef.current?.id === oldRow.id) {
          setShowDetailsModal(false);
          setDetailIssue(null);
        }
      }
    }
  };

  const handleUserRealtime = (payload: any) => {
    console.log('[Realtime Event Received - app_users]:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      const incoming = mapSingleRowToUser(payload.new);
      setUsers((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updated = mapSingleRowToUser(payload.new);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const oldRow = payload.old;
      if (oldRow && oldRow.id) {
        setUsers((prev) => prev.filter((item) => item.id !== oldRow.id));
      }
    }
  };

  const handleCabRealtime = (payload: any) => {
    console.log('[Realtime Event Received - cab_activities]:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      const incoming = mapSingleRowToCab(payload.new);
      setCabActivities((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updated = mapSingleRowToCab(payload.new);
      setCabActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const oldRow = payload.old;
      if (oldRow && oldRow.id) {
        setCabActivities((prev) => prev.filter((item) => item.id !== oldRow.id));
      }
    }
  };

  const handleAuditRealtime = (payload: any) => {
    console.log('[Realtime Event Received - audit_logs]:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      const newLog = payload.new;
      setAuditLogs((prev) => {
        if (prev.some((l) => l.id === newLog.id)) return prev;
        return [newLog, ...prev.slice(0, 99)];
      });
    }
  };

  const handleStoreRealtime = (payload: any) => {
    console.log('[Realtime Event Received - system_cloud_store]:', payload);
    if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
      const { key, data } = payload.new;
      if (key === 'categories' && Array.isArray(data)) {
        if (JSON.stringify(categoriesRef.current) !== JSON.stringify(data)) {
          setCategories(data);
        }
      } else if (key === 'tags' && Array.isArray(data)) {
        if (JSON.stringify(tagsRef.current) !== JSON.stringify(data)) {
          setTags(data);
        }
      } else if (key === 'canned_responses' && Array.isArray(data)) {
        if (JSON.stringify(cannedResponsesRef.current) !== JSON.stringify(data)) {
          setCannedResponses(data);
        }
      } else if (key === 'general_settings' && data && typeof data === 'object') {
        if (JSON.stringify(generalSettingsRef.current) !== JSON.stringify(data)) {
          setGeneralSettings(data);
        }
      } else if (key === 'sound_settings' && data && typeof data === 'object') {
        if (JSON.stringify(soundSettingsRef.current) !== JSON.stringify(data)) {
          setSoundSettings(data);
        }
      } else if (key === 'audit_logs' && Array.isArray(data)) {
        if (JSON.stringify(auditLogsRef.current) !== JSON.stringify(data)) {
          setAuditLogs(data);
        }
      } else if (key === 'external_vendors' && Array.isArray(data)) {
        if (JSON.stringify(externalVendorsRef.current) !== JSON.stringify(data)) {
          setExternalVendors(data);
        }
      } else if (key === 'sla_settings' && data && typeof data === 'object') {
        if (JSON.stringify(slaSettingsRef.current) !== JSON.stringify(data)) {
          setSlaSettings(data);
        }
      }
    }
  };

  // Supabase Realtime DB Changes Subscription for all tables
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('system:global_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => handleIssueRealtime(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_users' },
        (payload) => handleUserRealtime(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cab_activities' },
        (payload) => handleCabRealtime(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        (payload) => handleAuditRealtime(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_cloud_store' },
        (payload) => handleStoreRealtime(payload)
      )
      .subscribe((status) => {
        console.log('[System Global Realtime Status]:', status);
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [supabaseConfig.url, supabaseConfig.key]);

  // Accurate stopwatch ticker that triggers synchronized second updates across all running tickets
  const [, setGlobalTimerTick] = useState(0);
  useEffect(() => {
    const hasRunning = issues.some((i) => i.isWorkingNow && i.status !== 'Resolved' && i.status !== 'Closed');
    if (!hasRunning) return;
    const timer = setInterval(() => {
      setGlobalTimerTick((t) => (t + 1) % 1000000);
    }, 1000);

    return () => clearInterval(timer);
  }, [issues]);

  const mapSingleRowToIssue = (row: any): Issue => {
    const desc = row.desc_text || row.desc || row.description || row.title || '';
    return {
      id: row.id,
      client: row.client || 'عميل',
      clientEmail: row.client_email || row.clientEmail || undefined,
      clientPhone: row.client_phone || row.clientPhone || undefined,
      tag: row.tag || 'VIP Client',
      type: row.type || 'تقني / Technical',
      desc: desc,
      assigned: row.assigned || 'فريق الدعم',
      owner: row.owner || 'محمد علي',
      priority: (row.priority as Priority) || 'Medium',
      status: (row.status as IssueStatus) || 'Open',
      workTime: row.worktime ?? row.workTime ?? 0,
      isWorkingNow: row.is_working_now ?? row.isWorkingNow ?? false,
      activeWorker: row.active_worker || row.activeWorker || undefined,
      timerStartedAt: row.timer_started_at || row.timerStartedAt || undefined,
      csat: row.csat ?? 5,
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      dueDate: row.due_date || row.dueDate || new Date().toISOString(),
      timeline: Array.isArray(row.timeline) ? row.timeline : [],
      comments: Array.isArray(row.comments) ? row.comments : [],
      resolutionReason: row.resolution_reason || row.resolutionReason || undefined,
      resolvedAt: row.resolved_at || row.resolvedAt || undefined,
      attachment: row.attachment || undefined,
      isExternalOwner: row.is_external_owner ?? row.isExternalOwner ?? false,
      externalOwnerDetails: row.external_owner_details || row.externalOwnerDetails || undefined,
      mergedIntoTicketId: row.merged_into_ticket_id || row.mergedIntoTicketId || undefined,
      mergedTicketIds: Array.isArray(row.merged_ticket_ids) ? row.merged_ticket_ids : (Array.isArray(row.mergedTicketIds) ? row.mergedTicketIds : []),
      clientNotes: row.client_notes || row.clientNotes || undefined,
      slaPaused: row.sla_paused ?? row.slaPaused ?? false,
      slaPausedReason: row.sla_paused_reason || row.slaPausedReason || undefined,
      slaPausedAt: row.sla_paused_at || row.slaPausedAt || undefined,
      slaExtendedHours: row.sla_extended_hours ?? row.slaExtendedHours ?? 0,
      slaExtensionReason: row.sla_extension_reason || row.slaExtensionReason || undefined,
      submittedByClient: row.submitted_by_client ?? row.submittedByClient ?? false,
    };
  };

  // Instant Central Cloud Hydration: fetch direct Supabase data immediately on page load
  useEffect(() => {
    let isMounted = true;
    const hydrateCloudData = async () => {
      try {
        const client = supabase;

        // Fetch direct Supabase tables in parallel
        const [sbIssuesRes, sbUsersRes, sbCabRes, sbStoreRes] = await Promise.all([
          Promise.resolve(client.from('issues').select('*').order('created_at', { ascending: false })).catch(() => null),
          Promise.resolve(client.from('app_users').select('*')).catch(() => null),
          Promise.resolve(client.from('cab_activities').select('*')).catch(() => null),
          Promise.resolve(client.from('system_cloud_store').select('*')).catch(() => null),
        ]);

        if (!isMounted) return;

        // 0. Extract deleted tombstones from system_cloud_store if present
        if (sbStoreRes && !sbStoreRes.error && Array.isArray(sbStoreRes.data)) {
          const tombstonesRow = sbStoreRes.data.find((r: any) => r.key === 'deleted_issue_ids');
          if (tombstonesRow && Array.isArray(tombstonesRow.data)) {
            tombstonesRow.data.forEach((id: string) => deletedIssueIdsRef.current.add(id));
            try {
              localStorage.setItem(
                STORAGE_KEY + '_DELETED_ISSUE_IDS',
                JSON.stringify(Array.from(deletedIssueIdsRef.current))
              );
            } catch {}
          }
        }

        // 1. Issues: fetch records and map explicitly
        if (sbIssuesRes) {
          if (sbIssuesRes.error) {
            console.error('Supabase Fetch Error:', sbIssuesRes.error);
          } else if (Array.isArray(sbIssuesRes.data)) {
            const validRows = sbIssuesRes.data.filter((row: any) => !deletedIssueIdsRef.current.has(row.id));
            if (validRows.length === 0) {
              setIssues([]);
              try {
                localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
              } catch {}
            } else {
              const mappedIssues: Issue[] = validRows.map(mapSingleRowToIssue);

              setIssues(mappedIssues);
              try {
                localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(mappedIssues));
              } catch {}
            }
          }
        }

        // 2. Users: prefer live Supabase if available
        if (sbUsersRes && Array.isArray(sbUsersRes.data) && sbUsersRes.data.length > 0) {
          const mappedUsers: AppUser[] = sbUsersRes.data.map((row: any) => ({
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
          try {
            localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(mappedUsers));
          } catch {}
        }

        // 3. CAB Activities: prefer live Supabase if available
        if (sbCabRes && Array.isArray(sbCabRes.data) && sbCabRes.data.length > 0) {
          const mappedCab: CabBusinessActivity[] = sbCabRes.data.map((row: any) => ({
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
          setCabActivities(mappedCab);
          try {
            localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', JSON.stringify(mappedCab));
          } catch {}
        }

        // 4. system_cloud_store integration for settings, categories, tags, canned responses, etc.
        if (sbStoreRes && !sbStoreRes.error && Array.isArray(sbStoreRes.data)) {
          for (const row of sbStoreRes.data) {
            if (row.key === 'categories' && Array.isArray(row.data)) {
              setCategories(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'tags' && Array.isArray(row.data)) {
              setTags(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_TAGS', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'canned_responses' && Array.isArray(row.data)) {
              setCannedResponses(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_CANNED', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'general_settings' && row.data && typeof row.data === 'object') {
              setGeneralSettings(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'sound_settings' && row.data && typeof row.data === 'object') {
              setSoundSettings(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_SOUND', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'audit_logs' && Array.isArray(row.data)) {
              setAuditLogs(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_AUDIT', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'external_vendors' && Array.isArray(row.data)) {
              setExternalVendors(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(row.data)); } catch {}
            } else if (row.key === 'sla_settings' && row.data && typeof row.data === 'object') {
              setSlaSettings(row.data);
              try { localStorage.setItem(STORAGE_KEY + '_SLA_SETTINGS', JSON.stringify(row.data)); } catch {}
            }
          }
        }
        isHydratedRef.current = true;
      } catch (err) {
        console.warn('[Cloud] Immediate state fetch error:', err);
        isHydratedRef.current = true;
      }
    };
    hydrateCloudData();
    return () => {
      isMounted = false;
    };
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

  // Manual trigger for the live toast notification from the user's attached image
  const handleTriggerDemoToast = () => {
    const targetIssue = issues[0] || {
      id: 'INC-1008',
      client: 'مستشفى السلام الدولي',
      priority: 'High',
    };
    setLiveToast({
      id: `toast-${Date.now()}`,
      title: `تذكرة جديدة واردة الآن [${targetIssue.id}] 🚀`,
      desc: `للعميل: ${targetIssue.client || 'مستشفى السلام الدولي'} • الأولوية: ${targetIssue.priority || 'عالية'}`,
      ticketId: targetIssue.id,
      author: 'م/ سارة إبراهيم',
      location: 'الفرع الإقليمي',
    });
    addNotification(
      `تذكرة جديدة [${targetIssue.id}] 📢`,
      `تم استلام تنبيه سحابي فوري تجريبي للتحقق من المزامنة اللحظية مع جميع الأجهزة`,
      targetIssue.id,
      'info'
    );
    if (!soundSettings.muted) {
      try {
        const soundUrl = soundSettings.customNotificationUrl || soundSettings.alarmUrl;
        if (soundUrl) {
          const sound = new Audio(soundUrl);
          sound.volume = soundSettings.volume || 0.8;
          sound.play().catch(() => {});
        }
      } catch {}
    }
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
    realtimeSync.updateCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    soundSettingsRef.current = soundSettings;
  }, [soundSettings]);

  useEffect(() => {
    detailIssueRef.current = detailIssue;
  }, [detailIssue]);

  // Real-Time Multi-Region Sync WebSocket Initialization
  useEffect(() => {
    // 1. Subscribe to Universal Realtime Hub (Supabase Broadcast + Cross-Tab + WebSockets)
    const unsubscribeHub = realtimeHub.subscribe((payload) => {
      console.log('[RealtimeHub Received in App]:', payload.event, payload);
      switch (payload.event) {
        case 'ticket:created': {
          const { issue, location } = payload.data || {};
          if (issue && issue.id && !deletedIssueIdsRef.current.has(issue.id)) {
            setIssues((prev) => {
              if (prev.some((i) => i.id === issue.id)) return prev;
              return [issue, ...prev];
            });

            // Trigger floating live visual alert and audio chime
            setLiveToast({
              id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `تذكرة جديدة واردة الآن [${issue.id}] 🚀`,
              desc: `للعميل: ${issue.client || 'عميل'} • الأولوية: ${issue.priority}`,
              ticketId: issue.id,
              author: payload.senderName || 'عضو في الفريق',
              location: location || 'الفرع المتصل',
            });

            addNotification(
              `تذكرة جديدة [${issue.id}] 📢`,
              `تم استلام بلاغ جديد بواسطة ${payload.senderName} (${location || 'فرع متصل'}) للعميل ${issue.client}`,
              issue.id,
              'info'
            );

            if (!soundSettingsRef.current.muted) {
              playNotificationChime(soundSettingsRef.current.volume || 0.8, soundSettingsRef.current.customNotificationUrl);
            }
          }
          break;
        }

        case 'ticket:updated': {
          const { issue, changeType, details } = payload.data || {};
          if (issue && issue.id) {
            setIssues((prev) =>
              prev.map((i) => (i.id === issue.id ? { ...i, ...issue } : i))
            );
            if (detailIssueRef.current?.id === issue.id) {
              setDetailIssue((prev) => (prev ? { ...prev, ...issue } : prev));
            }
            addNotification(
              `تحديث في التذكرة [${issue.id}] 🔄`,
              `قام ${payload.senderName} بالتحديث: ${details || changeType || issue.status}`,
              issue.id,
              'info'
            );
          }
          break;
        }

        case 'ticket:deleted': {
          const { issueId } = payload.data || {};
          if (issueId) {
            deletedIssueIdsRef.current.add(issueId);
            saveDeletedIssueIds(deletedIssueIdsRef.current);
            setIssues((prev) => prev.filter((i) => i.id !== issueId));
            if (detailIssueRef.current?.id === issueId) {
              setShowDetailsModal(false);
              setDetailIssue(null);
            }
            addNotification('حذف تذكرة 🗑️', `قام ${payload.senderName} بحذف التذكرة ${issueId}`, undefined, 'warning');
          }
          break;
        }

        case 'ticket:bulk_deleted': {
          const { issueIds } = payload.data || {};
          if (Array.isArray(issueIds)) {
            issueIds.forEach((id: string) => deletedIssueIdsRef.current.add(id));
            saveDeletedIssueIds(deletedIssueIdsRef.current);
            setIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
            if (detailIssueRef.current && issueIds.includes(detailIssueRef.current.id)) {
              setShowDetailsModal(false);
              setDetailIssue(null);
            }
            addNotification('حذف جماعي 🗑️', `قام ${payload.senderName} بحذف ${issueIds.length} تذكرة`, undefined, 'warning');
          }
          break;
        }

        case 'ticket:comment': {
          const { issueId, comment } = payload.data || {};
          if (issueId && comment) {
            setIssues((prev) =>
              prev.map((i) => {
                if (i.id === issueId) {
                  const exists = (i.comments || []).some((c: any) => c.id === comment.id);
                  if (exists) return i;
                  return { ...i, comments: [...(i.comments || []), comment] };
                }
                return i;
              })
            );
            if (detailIssueRef.current?.id === issueId) {
              setDetailIssue((prev) =>
                prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev
              );
            }
            addNotification(
              `رد جديد في [${issueId}] 💬`,
              `أضاف ${payload.senderName}: ${comment.text ? comment.text.substring(0, 50) : 'ملاحظة'}`,
              issueId,
              'info'
            );
          }
          break;
        }

        case 'cab:created': {
          const { activity } = payload.data || {};
          if (activity && activity.id) {
            setCabActivities((prev) => {
              if (prev.some((a) => a.id === activity.id)) return prev;
              return [activity, ...prev];
            });
            addNotification('نشاط CAB جديد 📋', `قام ${payload.senderName} بإضافة نشاط التغيير ${activity.id} (${activity.activityName})`, undefined, 'info');
          }
          break;
        }

        case 'cab:updated': {
          const { activity, details } = payload.data || {};
          if (activity && activity.id) {
            setCabActivities((prev) =>
              prev.map((a) => (a.id === activity.id ? { ...a, ...activity } : a))
            );
            addNotification('تحديث نشاط CAB 🔄', `قام ${payload.senderName} بتحديث نشاط ${activity.id}: ${details || activity.status}`, undefined, 'info');
          }
          break;
        }

        case 'cab:deleted': {
          const { activityId } = payload.data || {};
          if (activityId) {
            setCabActivities((prev) => prev.filter((a) => a.id !== activityId));
            addNotification('حذف نشاط CAB 🗑️', `قام ${payload.senderName} بحذف نشاط التغيير ${activityId}`, undefined, 'warning');
          }
          break;
        }

        case 'notifications:clear_all': {
          setNotifications([]);
          try {
            localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', '[]');
          } catch {}
          break;
        }

        case 'notification:clear_single': {
          const targetId = payload.data?.id;
          if (targetId) {
            setNotifications((prev) => {
              const updated = prev.filter((n) => n.id !== targetId);
              try {
                localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
          break;
        }

        case 'system:reset_production': {
          deletedIssueIdsRef.current.clear();
          saveDeletedIssueIds(deletedIssueIdsRef.current);
          setIssues([]);
          setNotifications([]);
          setCabActivities([]);
          setLiveToast(null);
          setShowDetailsModal(false);
          setDetailIssue(null);
          try {
            localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
            localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', '[]');
            localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', '[]');
            localStorage.setItem(STORAGE_KEY + '_DELETED_ISSUE_IDS', '[]');
          } catch {}
          if (payload.senderName !== currentUserRef.current.name) {
            addNotification('تهيئة الإنتاج الفعلي 🚀', `قام ${payload.senderName} بتهيئة المنظومة للإنتاج ومسح بيانات الاختبار`, undefined, 'info');
          }
          break;
        }

        default:
          break;
      }
    });

    // 2. Initialize local WebSocket connection
    realtimeSync.init(
      {
        onTicketCreated: (newIssue: Issue, author: string, location?: string) => {
          setIssues((prev) => {
            if (prev.some((i) => i.id === newIssue.id)) return prev;
            return [newIssue, ...prev];
          });

          // Trigger live visual alert and audio chime
          setLiveToast({
            id: `toast-${Date.now()}`,
            title: `تذكرة جديدة واردة الآن [${newIssue.id}] 🚀`,
            desc: `للعميل: ${newIssue.client || 'عميل'} • الأولوية: ${newIssue.priority}`,
            ticketId: newIssue.id,
            author,
            location: location || 'الفرع الإقليمي',
          });

          addNotification(
            `تذكرة جديدة [${newIssue.id}] 📢`,
            `تم تسجيل بلاغ جديد بواسطة ${author} (${location || 'فرع متصل'}) للعميل ${newIssue.client}`,
            newIssue.id,
            'info'
          );

          if (!soundSettingsRef.current.muted) {
            playNotificationChime(soundSettingsRef.current.volume || 0.8, soundSettingsRef.current.customNotificationUrl);
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
          deletedIssueIdsRef.current.add(issueId);
          saveDeletedIssueIds(deletedIssueIdsRef.current);
          setIssues((prev) => {
            const next = prev.filter((i) => i.id !== issueId);
            try {
              localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(next));
            } catch {}
            return next;
          });
          if (detailIssueRef.current?.id === issueId) {
            setShowDetailsModal(false);
            setDetailIssue(null);
          }
          if (actor !== currentUserRef.current.name) {
            addNotification('حذف تذكرة 🗑️', `قام ${actor} بحذف التذكرة ${issueId}`, undefined, 'warning');
          }
        },

        onTicketBulkDeleted: (issueIds: string[], actor: string) => {
          issueIds.forEach((id) => deletedIssueIdsRef.current.add(id));
          saveDeletedIssueIds(deletedIssueIdsRef.current);
          setIssues((prev) => {
            const next = prev.filter((i) => !issueIds.includes(i.id));
            try {
              localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(next));
            } catch {}
            return next;
          });
          if (detailIssueRef.current && issueIds.includes(detailIssueRef.current.id)) {
            setShowDetailsModal(false);
            setDetailIssue(null);
          }
          if (actor !== currentUserRef.current.name) {
            addNotification('حذف جماعي 🗑️', `قام ${actor} بحذف ${issueIds.length} تذكرة`, undefined, 'warning');
          }
        },

        onTicketsCleared: (actor: string) => {
          setIssues((prev) => {
            prev.forEach((i) => deletedIssueIdsRef.current.add(i.id));
            saveDeletedIssueIds(deletedIssueIdsRef.current);
            return [];
          });
          try {
            localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
          } catch {}
          setShowDetailsModal(false);
          setDetailIssue(null);
          if (actor !== currentUserRef.current.name) {
            addNotification('تفريغ التذاكر 🗑️', `قام ${actor} بتفريغ كافة التذاكر من المنظومة`, undefined, 'warning');
          }
        },

        onNotificationsCleared: () => {
          handleClearAllNotifications(false);
        },

        onNotificationClearedSingle: (id: string) => {
          handleClearSingleNotification(id, false);
        },

        onNotificationAdded: (newNotif: NotificationItem) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            const next = [newNotif, ...prev].slice(0, 50);
            try {
              localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(next));
            } catch {}
            return next;
          });
          if (!soundSettingsRef.current.muted) {
            playNotificationChime(soundSettingsRef.current.volume || 0.8, soundSettingsRef.current.customNotificationUrl);
          }
        },

        onSystemResetProduction: (actor: string) => {
          deletedIssueIdsRef.current.clear();
          saveDeletedIssueIds(deletedIssueIdsRef.current);
          setIssues([]);
          setNotifications([]);
          setCabActivities([]);
          setLiveToast(null);
          setShowDetailsModal(false);
          setDetailIssue(null);
          try {
            localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
            localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', '[]');
            localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', '[]');
            localStorage.setItem(STORAGE_KEY + '_DELETED_ISSUE_IDS', '[]');
          } catch {}
          if (actor !== currentUserRef.current.name) {
            addNotification('تهيئة الإنتاج الفعلي 🚀', `قام ${actor} بتهيئة المنظومة لبيانات المصنع ومسح تذاكر الاختبار`, undefined, 'info');
          }
        },

        onCabCreated: (activity: CabBusinessActivity, author: string) => {
          setCabActivities((prev) => {
            if (prev.some((a) => a.id === activity.id)) return prev;
            return [activity, ...prev];
          });
          if (author !== currentUserRef.current.name) {
            addNotification('نشاط CAB جديد 📋', `قام ${author} بإضافة نشاط التغيير ${activity.id} (${activity.activityName})`, undefined, 'info');
          }
        },

        onCabUpdated: (activity: CabBusinessActivity, author: string, details?: string) => {
          setCabActivities((prev) =>
            prev.map((a) => (a.id === activity.id ? { ...a, ...activity } : a))
          );
          if (author !== currentUserRef.current.name) {
            addNotification('تحديث نشاط CAB 🔄', `قام ${author} بتحديث نشاط ${activity.id}: ${details || activity.status}`, undefined, 'info');
          }
        },

        onCabDeleted: (activityId: string, author: string) => {
          setCabActivities((prev) => prev.filter((a) => a.id !== activityId));
          if (author !== currentUserRef.current.name) {
            addNotification('حذف نشاط CAB 🗑️', `قام ${author} بحذف نشاط التغيير ${activityId}`, undefined, 'warning');
          }
        },

        onStateSynced: (serverState: any) => {
          if (!serverState) return;
          // Synchronize notifications list with authoritative server state
          if (Array.isArray(serverState.notifications)) {
            setNotifications(serverState.notifications);
            try {
              localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', JSON.stringify(serverState.notifications));
            } catch {}
          }
          // When Supabase is configured or active, Supabase is the sole authoritative database for tickets.
          // Do not allow local dev server state cache to overwrite Supabase issues.
          if (!supabaseConfig.connected && Array.isArray(serverState.issues)) {
            const valid = serverState.issues.filter((i: any) => !deletedIssueIdsRef.current.has(i.id));
            setIssues(valid);
            try {
              localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(valid));
            } catch {}
          }
          if (Array.isArray(serverState.categories) && serverState.categories.length > 0) {
            setCategories(serverState.categories);
            try {
              localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(serverState.categories));
            } catch {}
          }
          if (Array.isArray(serverState.users) && serverState.users.length > 0) {
            setUsers(serverState.users);
            try {
              localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(serverState.users));
            } catch {}
          }
          if (Array.isArray(serverState.tags) && serverState.tags.length > 0) {
            setTags(serverState.tags);
            try {
              localStorage.setItem(STORAGE_KEY + '_TAGS', JSON.stringify(serverState.tags));
            } catch {}
          }
          if (Array.isArray(serverState.cannedResponses) && serverState.cannedResponses.length > 0) {
            setCannedResponses(serverState.cannedResponses);
            try {
              localStorage.setItem(STORAGE_KEY + '_CANNED', JSON.stringify(serverState.cannedResponses));
            } catch {}
          }
          if (serverState.generalSettings) {
            setGeneralSettings(serverState.generalSettings);
            try {
              localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(serverState.generalSettings));
            } catch {}
          }
          if (serverState.soundSettings) {
            setSoundSettings(serverState.soundSettings);
            try {
              localStorage.setItem(STORAGE_KEY + '_SOUND', JSON.stringify(serverState.soundSettings));
            } catch {}
          }
          if (Array.isArray(serverState.auditLogs) && serverState.auditLogs.length > 0) {
            setAuditLogs(serverState.auditLogs);
            try {
              localStorage.setItem(STORAGE_KEY + '_AUDIT', JSON.stringify(serverState.auditLogs));
            } catch {}
          }
          if (Array.isArray(serverState.cabActivities)) {
            setCabActivities(serverState.cabActivities);
            try {
              localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', JSON.stringify(serverState.cabActivities));
            } catch {}
          }
          if (Array.isArray(serverState.externalVendors)) {
            setExternalVendors(serverState.externalVendors);
            try {
              localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(serverState.externalVendors));
            } catch {}
          }
          if (serverState.slaSettings) {
            setSlaSettings(serverState.slaSettings);
            try {
              localStorage.setItem(STORAGE_KEY + '_SLA_SETTINGS', JSON.stringify(serverState.slaSettings));
            } catch {}
          }
          if (serverState.supabaseConfig && serverState.supabaseConfig.url) {
            const oldUrl = supabaseConfig.url;
            const oldKey = supabaseConfig.key;
            setSupabaseConfig(serverState.supabaseConfig);
            try {
              localStorage.setItem(STORAGE_KEY + '_SUPABASE', JSON.stringify(serverState.supabaseConfig));
            } catch {}
            if (serverState.supabaseConfig.url !== oldUrl || serverState.supabaseConfig.key !== oldKey) {
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
          isHydratedRef.current = true;
        },

        onExternalVendorsUpdated: (vendors: ExternalVendor[]) => {
          setExternalVendors(vendors);
          try {
            localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(vendors));
          } catch {}
        },

        onSlaSettingsUpdated: (newSla: SlaSettings) => {
          if (newSla) {
            setSlaSettings(newSla);
            try {
              localStorage.setItem(STORAGE_KEY + '_SLA_SETTINGS', JSON.stringify(newSla));
            } catch {}
          }
        },

        onPresenceUpdated: (usersList: ActiveUserPresence[], total: number) => {
          setOnlineUsers(usersList);
          setTotalConnections(total);
        },

        onStatusChanged: (status: SyncConnectionStatus) => {
          setRealtimeStatus(status);
        },

        onCollisionsUpdated: (collisions: any) => {
          collisionManager.updateServerCollisions(collisions);
        },

        onSupabaseConfigUpdated: (newConfig: any) => {
          if (newConfig && newConfig.url) {
            const oldUrl = supabaseConfig.url;
            const oldKey = supabaseConfig.key;
            setSupabaseConfig(newConfig);
            try {
              localStorage.setItem(STORAGE_KEY + '_SUPABASE', JSON.stringify(newConfig));
            } catch {}
            if (newConfig.url !== oldUrl || newConfig.key !== oldKey) {
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
        },
      },
      currentUser
    );

    return () => {
      realtimeSync.destroy();
      unsubscribeHub();
    };
  }, []);

  // Real-Time Intelligent Poller Fallback (every 4 seconds)
  // Guarantees all team members receive new tickets and updates without needing page refresh
  useEffect(() => {
    const poller = setInterval(async () => {
      try {
        const client = supabase;
        if (!client) return;
        const { data: latestRows, error } = await client
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && Array.isArray(latestRows)) {
          const freshIssues = latestRows
            .map(mapSingleRowToIssue)
            .filter((i) => !deletedIssueIdsRef.current.has(i.id));

          setIssues((prev) => {
            const prevIds = new Set(prev.map((i) => i.id));
            const newIncoming: Issue[] = [];
            const now = Date.now();

            freshIssues.forEach((fi) => {
              if (!prevIds.has(fi.id)) {
                newIncoming.push(fi);
                // If created in the last 45 seconds and not created by this user in this millisecond, trigger live toast!
                const createdTime = new Date(fi.createdAt).getTime();
                if (now - createdTime < 45000) {
                  setLiveToast({
                    id: `toast-${fi.id}`,
                    title: `تذكرة جديدة واردة الآن [${fi.id}] 🚀`,
                    desc: `للعميل: ${fi.client || 'عميل'} • الأولوية: ${fi.priority}`,
                    ticketId: fi.id,
                    author: fi.owner || 'زميل في الفريق',
                    location: 'الفرع المتصل',
                  });
                  if (!soundSettingsRef.current.muted) {
                    playNotificationChime(soundSettingsRef.current.volume || 0.8, soundSettingsRef.current.customNotificationUrl);
                  }
                }
              }
            });

            if (newIncoming.length > 0) {
              return [...newIncoming, ...prev];
            }
            return prev;
          });
        }
      } catch {}
    }, 4000);

    return () => clearInterval(poller);
  }, []);

  // Update client phone on issue
  const handleUpdateIssuePhone = (issueId: string, newPhone: string) => {
    const trimmed = newPhone.trim();
    let updatedIssueToPersist: Issue | null = null;
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === issueId) {
          const updated = { ...i, clientPhone: trimmed };
          updatedIssueToPersist = updated;
          return updated;
        }
        return i;
      })
    );
    if (detailIssue && detailIssue.id === issueId) {
      setDetailIssue((prev) => (prev ? { ...prev, clientPhone: trimmed } : null));
    }
    if (updatedIssueToPersist) {
      upsertSingleIssueToSupabase(updatedIssueToPersist);
    }
    realtimeHub.broadcast(
      'ticket:updated',
      { issue: { id: issueId, clientPhone: trimmed }, details: `تم تحديث رقم هاتف التذكرة إلى ${trimmed}` },
      currentUser.name
    );
    addAuditLog('تحديث هاتف العميل', `تم تحديث هاتف العميل للتذكرة ${issueId} إلى ${trimmed}`);
    addNotification(`تحديث هاتف العميل [${issueId}] 📞`, `تم تحديث رقم الهاتف إلى: ${trimmed}`, issueId, 'info');
  };

  // General Ticket Updates (SLA extension, external ticket ID, pause, etc.)
  const handleUpdateIssue = (issueId: string, updates: Partial<Issue>) => {
    let updatedIssueToPersist: Issue | null = null;
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === issueId) {
          const updated = { ...i, ...updates };
          updatedIssueToPersist = updated;
          return updated;
        }
        return i;
      })
    );
    if (detailIssue && detailIssue.id === issueId) {
      setDetailIssue((prev) => (prev ? { ...prev, ...updates } : null));
    }
    if (updatedIssueToPersist) {
      upsertSingleIssueToSupabase(updatedIssueToPersist);
    }
    realtimeSync.broadcastTicketUpdate(
      { id: issueId, ...updates } as any,
      currentUser.name,
      'تحديث التذكرة',
      `تم تحديث بيانات التذكرة #${issueId}`
    );
    addAuditLog('تحديث تذكرة', `تم تحديث بيانات التذكرة #${issueId}`);
    addNotification(`تحديث التذكرة [${issueId}] 🔄`, 'تم حفظ تعديلات التذكرة ومزامنتها سحابياً', issueId, 'info');
  };

  // Update SLA Settings
  const handleUpdateSlaSettings = async (newSettings: SlaSettings) => {
    setSlaSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY + '_SLA_SETTINGS', JSON.stringify(newSettings));
    } catch {}

    if (supabaseRef.current) {
      try {
        await supabaseRef.current
          .from('system_cloud_store')
          .upsert([{ key: 'sla_settings', data: newSettings, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      } catch (err) {
        console.warn('Failed to save SLA settings to Supabase:', err);
      }
    }
    addAuditLog('تحديث قواعد SLA', 'تم تحديث سياسات وقواعد اتفاقيات مستوى الخدمة (SLA)');
    addNotification('إعدادات اتفاقية الخدمة SLA ⏱️', 'تم تحديث وحفظ سياسات اتفاقية مستوى الخدمة', undefined, 'info');
  };

  // External Vendors Directory Handlers
  const handleAddExternalVendor = async (vendor: Omit<ExternalVendor, 'id'>) => {
    const newVendor: ExternalVendor = { id: `ext-${Date.now()}`, ...vendor };
    const nextList = [...externalVendors, newVendor];
    setExternalVendors(nextList);
    try {
      localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(nextList));
    } catch {}

    if (supabaseRef.current) {
      try {
        await supabaseRef.current
          .from('system_cloud_store')
          .upsert([{ key: 'external_vendors', data: nextList, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      } catch (err) {
        console.warn('Failed to add external vendor to Supabase:', err);
      }
    }
    addAuditLog('إضافة شريك خارجي', `تمت إضافة (${vendor.name} - ${vendor.company}) إلى دليل الشركاء الخارجيين`);
    addNotification('إضافة شريك خارجي 🏢', `تمت إضافة (${vendor.name} - ${vendor.company}) لدليل الشركاء`, undefined, 'success');
  };

  const handleUpdateExternalVendor = async (id: string, updates: Partial<ExternalVendor>) => {
    const nextList = externalVendors.map((v) => (v.id === id ? { ...v, ...updates } : v));
    setExternalVendors(nextList);
    try {
      localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(nextList));
    } catch {}

    if (supabaseRef.current) {
      try {
        await supabaseRef.current
          .from('system_cloud_store')
          .upsert([{ key: 'external_vendors', data: nextList, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      } catch (err) {
        console.warn('Failed to update external vendor in Supabase:', err);
      }
    }
    addAuditLog('تعديل شريك خارجي', `تم تحديث بيانات الشريك الخارجي في الدليل`);
    addNotification('تحديث شريك خارجي 🏢', 'تم تحديث بيانات الشريك الخارجي في الدليل بنجاح', undefined, 'info');
  };

  const handleDeleteExternalVendor = async (id: string) => {
    const nextList = externalVendors.filter((v) => v.id !== id);
    setExternalVendors(nextList);
    try {
      localStorage.setItem(STORAGE_KEY + '_EXTERNAL_VENDORS', JSON.stringify(nextList));
    } catch {}

    if (supabaseRef.current) {
      try {
        await supabaseRef.current
          .from('system_cloud_store')
          .upsert([{ key: 'external_vendors', data: nextList, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      } catch (err) {
        console.warn('Failed to delete external vendor from Supabase:', err);
      }
    }
    addAuditLog('حذف شريك خارجي', `تم حذف الشريك الخارجي من الدليل`);
    addNotification('حذف شريك خارجي 🗑️', 'تم حذف الشريك الخارجي من الدليل', undefined, 'warning');
  };

  // Helper to immediately save/upsert a single ticket into Supabase Table Editor
  const upsertSingleIssueToSupabase = async (issue: Issue) => {
    if (!supabaseRef.current) return;
    try {
      const client = supabaseRef.current;
      
      // Try 1: Full payload with all columns
      const fullPayload = {
        id: issue.id,
        client: issue.client || '',
        client_email: issue.clientEmail || null,
        client_phone: issue.clientPhone || null,
        tag: issue.tag || '',
        type: issue.type || '',
        desc_text: issue.desc || '',
        assigned: issue.assigned || '',
        owner: issue.owner || '',
        priority: issue.priority || 'Medium',
        status: issue.status || 'Open',
        worktime: issue.workTime || 0,
        csat: issue.csat || 5,
        created_at: issue.createdAt,
        due_date: issue.dueDate,
        comments: issue.comments || [],
        timeline: issue.timeline || [],
        is_external_owner: issue.isExternalOwner || false,
        external_owner_details: issue.externalOwnerDetails || null,
        merged_into_ticket_id: issue.mergedIntoTicketId || null,
        merged_ticket_ids: issue.mergedTicketIds || [],
        client_notes: issue.clientNotes || null,
        sla_paused: issue.slaPaused || false,
        sla_paused_reason: issue.slaPausedReason || null,
        sla_paused_at: issue.slaPausedAt || null,
        sla_extended_hours: issue.slaExtendedHours || 0,
        sla_extension_reason: issue.slaExtensionReason || null,
        submitted_by_client: issue.submittedByClient || false,
      };
      
      const { error: error1 } = await client.from('issues').upsert(fullPayload, { onConflict: 'id' });
      if (!error1) {
        console.log('[Supabase] Upsert Success (Full Payload):', issue.id);
        return;
      }
      
      console.warn('[Supabase] Full payload upsert failed, trying Standard SQL payload. Error:', error1);

      // Try 2: Standard SQL payload (matching AdminView.tsx SQL exactly)
      const standardPayload = {
        id: issue.id,
        client: issue.client || '',
        client_email: issue.clientEmail || null,
        client_phone: issue.clientPhone || null,
        tag: issue.tag || '',
        type: issue.type || '',
        desc_text: issue.desc || '',
        assigned: issue.assigned || '',
        owner: issue.owner || '',
        priority: issue.priority || 'Medium',
        status: issue.status || 'Open',
        worktime: issue.workTime || 0,
        csat: issue.csat || 5,
        created_at: issue.createdAt,
        due_date: issue.dueDate,
        comments: issue.comments || [],
        timeline: issue.timeline || [],
      };
      
      const { error: error2 } = await client.from('issues').upsert(standardPayload, { onConflict: 'id' });
      if (!error2) {
        console.log('[Supabase] Upsert Success (Standard Payload):', issue.id);
        return;
      }
      
      console.warn('[Supabase] Standard payload upsert failed, trying CamelCase payload. Error:', error2);

      // Try 3: CamelCase fallback payload
      const camelCasePayload = {
        id: issue.id,
        client: issue.client || '',
        clientEmail: issue.clientEmail || null,
        clientPhone: issue.clientPhone || null,
        tag: issue.tag || '',
        type: issue.type || '',
        desc: issue.desc || '',
        description: issue.desc || '',
        title: issue.desc || '',
        assigned: issue.assigned || '',
        owner: issue.owner || '',
        priority: issue.priority || 'Medium',
        status: issue.status || 'Open',
        workTime: issue.workTime || 0,
        csat: issue.csat || 5,
        createdAt: issue.createdAt,
        dueDate: issue.dueDate,
        comments: issue.comments || [],
        timeline: issue.timeline || [],
      };
      
      const { error: error3 } = await client.from('issues').upsert(camelCasePayload, { onConflict: 'id' });
      if (!error3) {
        console.log('[Supabase] Upsert Success (CamelCase Payload):', issue.id);
        return;
      }

      console.warn('[Supabase] CamelCase payload upsert failed, trying Minimal payload. Error:', error3);

      // Try 4: Minimal barebones payload
      const minimalPayload = {
        id: issue.id,
        client: issue.client || '',
        status: issue.status || 'Open',
        priority: issue.priority || 'Medium',
      };
      const { error: error4 } = await client.from('issues').upsert(minimalPayload, { onConflict: 'id' });
      if (!error4) {
        console.log('[Supabase] Upsert Success (Minimal Payload):', issue.id);
        return;
      }
      
      console.error('[Supabase] ALL upsert fallbacks failed! Final error:', error4);
    } catch (err) {
      console.error('[Supabase] Exception in single issue upsert:', err);
    }
  };

  const getSupabaseClient = () => {
    return supabase;
  };

  const deleteSingleIssueFromSupabase = async (issueId: string) => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('issues').delete().eq('id', issueId);
      if (error) {
        console.error('[Supabase Delete Single Error]:', error);
      }
    } catch (err) {
      console.error('[Supabase Delete Single Exception]:', err);
    }
  };

  const deleteBulkIssuesFromSupabase = async (issueIds: string[]) => {
    if (!issueIds.length) return;
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('issues').delete().in('id', issueIds);
      if (error) {
        console.error('[Supabase Delete Bulk Error]:', error);
      }
    } catch (err) {
      console.error('[Supabase Delete Bulk Exception]:', err);
    }
  };

  const upsertSingleUserToSupabase = async (user: AppUser) => {
    if (!supabaseRef.current) return;
    try {
      const payload = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        permissions: user.permissions || [],
        password: user.password || '123456',
      };
      await supabaseRef.current.from('app_users').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase] User auto-upsert note:', err);
    }
  };

  const deleteSingleUserFromSupabase = async (userId: string) => {
    if (!supabaseRef.current) return;
    try {
      await supabaseRef.current.from('app_users').delete().eq('id', userId);
    } catch (err) {
      console.warn('[Supabase] User delete note:', err);
    }
  };

  const upsertSingleCabActivityToSupabase = async (cab: CabBusinessActivity) => {
    if (!supabaseRef.current) return;
    try {
      const payload = {
        id: cab.id,
        activity_name: cab.activityName,
        scope: cab.scope,
        impacted_services: cab.impactedServices,
        service_impact: cab.serviceImpact,
        stop_service_target_system: cab.stopServiceTargetSystem,
        stopped_system_name: cab.stoppedSystemName,
        downtime_required: cab.downtimeRequired,
        date: cab.date,
        start_time: cab.startTime,
        end_time: cab.endTime,
        maintenance_window: cab.maintenanceWindow,
        requestor: cab.requestor,
        tpm: cab.tpm,
        change_management: cab.changeManagement,
        status: cab.status,
        risk_level: cab.riskLevel,
        rollback_plan: cab.rollbackPlan,
        rollback_reason: cab.rollbackReason,
        comments: cab.comments || [],
        audit_trail: cab.auditTrail || [],
        created_at: cab.createdAt || new Date().toISOString(),
      };
      await supabaseRef.current.from('cab_activities').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase] CAB auto-upsert note:', err);
    }
  };

  const deleteSingleCabActivityFromSupabase = async (cabId: string) => {
    if (!supabaseRef.current) return;
    try {
      await supabaseRef.current.from('cab_activities').delete().eq('id', cabId);
    } catch (err) {
      console.warn('[Supabase] CAB delete note:', err);
    }
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

      const updatedIssue = {
        ...editingIssue,
        ...data,
        timeline: updatedTimeline,
      } as Issue;

      setIssues((prev) =>
        prev.map((i) => (i.id === editingIssue.id ? updatedIssue : i))
      );

      // Broadcast update across team
      realtimeHub.broadcast(
        'ticket:updated',
        {
          issue: updatedIssue,
          changeType: 'تعديل تذكرة',
          details: `تم تحديث بيانات التذكرة ${editingIssue.id}`,
        },
        currentUser.name
      );

      // Immediately save/upsert to Supabase Table Editor!
      upsertSingleIssueToSupabase(updatedIssue);
      setTimeout(() => handleSyncSupabaseNow(true), 200);

      addAuditLog('تعديل تذكرة', `تم تحديث بيانات التذكرة ${editingIssue.id}`);
      addNotification(
        `تحديث التذكرة [${editingIssue.id}] 🔄`,
        `تم تعديل بيانات التذكرة للعميل (${updatedIssue.client}) وحفظ التغييرات`,
        editingIssue.id,
        'info'
      );
      setEditingIssue(null);
    } else {
      // Create new ticket and automatically broadcast to all team members!
      let nextNum = 1001;
      const existingIds = new Set(issues.map((i) => i.id.toUpperCase()));
      const deletedIds = deletedIssueIdsRef.current;
      while (existingIds.has(`INC-${nextNum}`) || deletedIds.has(`INC-${nextNum}`)) {
        nextNum++;
      }
      const newId = `INC-${nextNum}`;
      const initialStatus = data.status || 'Open';
      const isWorking = initialStatus === 'In Progress';
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
        isExternalOwner: data.isExternalOwner,
        externalOwnerDetails: data.externalOwnerDetails,
        priority: data.priority || 'Medium',
        status: initialStatus,
        createdAt: nowIso,
        dueDate: calculateDueDate(nowIso, data.priority || 'Medium', slaH),
        workTime: 0,
        isWorkingNow: isWorking,
        activeWorker: isWorking ? currentUser.name : null,
        csat: 5,
        submittedByClient: isClientSubmission,
        attachment: data.attachment,
        comments: [],
        timeline: [
          {
            id: `t-${Date.now()}`,
            time: 'الآن',
            actor: currentUser.name,
            title: data.isExternalOwner ? 'تكليف طرف خارجي بالبلاغ 🌐' : 'إنشاء التذكرة سحابياً 🌐',
            details: data.isExternalOwner
              ? `تم تسجيل البلاغ وإسناده للطرف الخارجي (${data.owner}) مع تفاصيل المتابعة.`
              : `تم تسجيل البلاغ بحالة (${initialStatus}) ومزامنته سحابياً لجميع أعضاء الفريق بواسطة ${currentUser.name}.`,
            type: 'create',
          },
        ],
      };

      const newTicketPayload = {
        id: newIssue.id,
        client: newIssue.client || '',
        client_email: newIssue.clientEmail || null,
        client_phone: newIssue.clientPhone || null,
        tag: newIssue.tag || '',
        type: newIssue.type || '',
        desc_text: newIssue.desc || '',
        assigned: newIssue.assigned || '',
        owner: newIssue.owner || '',
        priority: newIssue.priority || 'Medium',
        status: newIssue.status || 'Open',
        worktime: newIssue.workTime || 0,
        csat: newIssue.csat || 5,
        created_at: newIssue.createdAt,
        due_date: newIssue.dueDate,
        comments: newIssue.comments || [],
        timeline: newIssue.timeline || [],
        is_external_owner: newIssue.isExternalOwner || false,
        external_owner_details: newIssue.externalOwnerDetails || null,
        merged_into_ticket_id: newIssue.mergedIntoTicketId || null,
        merged_ticket_ids: newIssue.mergedTicketIds || [],
        client_notes: newIssue.clientNotes || null,
        sla_paused: newIssue.slaPaused || false,
        sla_paused_reason: newIssue.slaPausedReason || null,
        sla_paused_at: newIssue.slaPausedAt || null,
        sla_extended_hours: newIssue.slaExtendedHours || 0,
        sla_extension_reason: newIssue.slaExtensionReason || null,
        submitted_by_client: newIssue.submittedByClient || false,
      };

      // Perform a direct insert with strict error handling!
      const performInsert = async () => {
        try {
          const { data: insertedData, error } = await supabase.from('issues').insert([newTicketPayload]).select();
          
          let finalData = insertedData;
          let finalError = error;

          if (finalError) {
            console.warn('[Supabase] Primary direct insert failed, trying Standard SQL payload...');
            const standardPayload = {
              id: newId,
              client: newIssue.client || '',
              client_email: newIssue.clientEmail || null,
              client_phone: newIssue.clientPhone || null,
              tag: newIssue.tag || '',
              type: newIssue.type || '',
              desc_text: newIssue.desc || '',
              assigned: newIssue.assigned || '',
              owner: newIssue.owner || '',
              priority: newIssue.priority || 'Medium',
              status: newIssue.status || 'Open',
              worktime: newIssue.workTime || 0,
              csat: newIssue.csat || 5,
              created_at: newIssue.createdAt,
              due_date: newIssue.dueDate,
              comments: newIssue.comments || [],
              timeline: newIssue.timeline || [],
            };
            const { data: standardData, error: standardError } = await supabase.from('issues').insert([standardPayload]).select();
            if (!standardError) {
              finalData = standardData;
              finalError = null;
            } else {
              finalError = standardError;
            }
          }

          if (finalError) {
            console.warn('[Supabase DB Insert Warning]:', finalError);
            addNotification('تنبيه المزامنة السحابية', `تم حفظ التذكرة محلياً وجاري المزامنة في الخلفية (${finalError.message})`, newId, 'warning');
          }

          // Map the confirmed returned row or fallback to local
          const savedIssue = finalData && finalData[0] ? mapSingleRowToIssue(finalData[0]) : newIssue;

          // Pause any other ticket so only this new active ticket is ticking
          setIssues((prev) => [
            savedIssue,
            ...prev.map((i) => (i.isWorkingNow ? { ...i, isWorkingNow: false, activeWorker: null } : i)),
          ]);

          // Broadcast across team via realtimeHub (Supabase Broadcast + Cross-Tab + WebSockets)
          realtimeHub.broadcast(
            'ticket:created',
            { issue: savedIssue, location: currentUser.department || 'الفرع الرئيسي' },
            currentUser.name
          );

          // Trigger live toast notification from the attached image!
          setLiveToast({
            id: `toast-${Date.now()}`,
            title: `تذكرة جديدة واردة الآن [${savedIssue.id}] 🚀`,
            desc: `للعميل: ${savedIssue.client || 'عميل'} • الأولوية: ${savedIssue.priority}`,
            ticketId: savedIssue.id,
            author: currentUser.name,
            location: currentUser.department || 'الفرع الرئيسي',
          });

          addAuditLog('إنشاء تذكرة', `تم تسجيل بلاغ جديد برقم ${savedIssue.id} للعميل ${savedIssue.client} وبدء عداد العمل فوراً`);
          addNotification(
            `تذكرة جديدة [${savedIssue.id}] 🚀`,
            `تم استلام بلاغ ${savedIssue.id} للعميل ${savedIssue.client || 'عميل جديد'} وبدء العداد فوراً. انقر لفتح التذكرة`,
            savedIssue.id,
            'success'
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

          // Automatically open the details modal for the newly created ticket so user sees live ticking stopwatch!
          setDetailIssue(savedIssue);
          setShowDetailsModal(true);
        } catch (err: any) {
          console.error('Supabase DB Insert Exception:', err);
          // Fallback: Ensure ticket is never lost even if network drops
          setIssues((prev) => [newIssue, ...prev]);
          realtimeHub.broadcast('ticket:created', { issue: newIssue, location: currentUser.department || 'الفرع الرئيسي' }, currentUser.name);
          setLiveToast({
            id: `toast-${Date.now()}`,
            title: `تذكرة جديدة واردة الآن [${newIssue.id}] 🚀`,
            desc: `للعميل: ${newIssue.client || 'عميل'} • الأولوية: ${newIssue.priority}`,
            ticketId: newIssue.id,
            author: currentUser.name,
            location: currentUser.department || 'الفرع الرئيسي',
          });
          addNotification(
            `تذكرة جديدة [${newIssue.id}] 🚀`,
            `تم تسجيل التذكرة محلياً ${newIssue.id} للعميل (${newIssue.client})`,
            newIssue.id,
            'success'
          );
          setDetailIssue(newIssue);
          setShowDetailsModal(true);
        }
      };

      performInsert();
    }
  };

  // Explicitly Start Work Timer on a ticket (guarantees synchronous real-time precision)
  const handleStartTimer = (issue: Issue) => {
    if (issue.isWorkingNow) return;
    const nowIso = new Date().toISOString();
    const updatedTimeline = [...issue.timeline];
    updatedTimeline.unshift({
      id: `t-${Date.now()}`,
      time: 'الآن',
      actor: currentUser.name,
      title: 'بدء جلسة العمل تلقائياً ⏱️',
      details: `بدأ الموظف ${currentUser.name} العمل على التذكرة وتشغيل المؤقت.`,
      type: 'timer',
    });

    const targetUpdated: Issue = {
      ...issue,
      isWorkingNow: true,
      timerStartedAt: nowIso,
      activeWorker: currentUser.name,
      status: issue.status === 'Open' ? ('In Progress' as IssueStatus) : issue.status,
      timeline: updatedTimeline,
    };

    const pausedOthers: Issue[] = [];
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issue.id) {
          return targetUpdated;
        } else if (item.isWorkingNow) {
          const elapsed = item.timerStartedAt
            ? Math.max(0, Math.floor((Date.now() - new Date(item.timerStartedAt).getTime()) / 1000))
            : 0;
          const paused: Issue = {
            ...item,
            workTime: (item.workTime || 0) + elapsed,
            isWorkingNow: false,
            timerStartedAt: null,
            activeWorker: null,
          };
          pausedOthers.push(paused);
          return paused;
        }
        return item;
      })
    );

    setDetailIssue((prev) => (prev && prev.id === issue.id ? { ...prev, ...targetUpdated } : prev));
    realtimeSync.broadcastTicketUpdate(
      targetUpdated,
      currentUser.name,
      'بدء عداد العمل ⏱️',
      `بدأ العمل الفعلي للتذكرة ${issue.id}`
    );
    upsertSingleIssueToSupabase(targetUpdated);

    pausedOthers.forEach((paused) => {
      realtimeSync.broadcastTicketUpdate(
        paused,
        currentUser.name,
        'إيقاف مؤقت للعداد ⏸️',
        `تم إيقاف مؤقت التذكرة ${paused.id}`
      );
      upsertSingleIssueToSupabase(paused);
    });

    addAuditLog('بدء عداد تذكرة', `تشغيل مؤقت العمل للتذكرة ${issue.id}`);
    addNotification(
      `بدء مؤقت العمل [${issue.id}] ⏱️`,
      `بدأ العمل الفعلي وحساب الوقت المستغرق للتذكرة ${issue.id}`,
      issue.id,
      'info'
    );
  };

  // Explicitly Pause Work Timer on a ticket
  const handlePauseTimer = (issue: Issue) => {
    if (!issue.isWorkingNow) return;
    const elapsed = issue.timerStartedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(issue.timerStartedAt).getTime()) / 1000))
      : 0;
    const newWorkTime = (issue.workTime || 0) + elapsed;
    const updatedTimeline = [...issue.timeline];
    updatedTimeline.unshift({
      id: `t-${Date.now()}`,
      time: 'الآن',
      actor: currentUser.name,
      title: 'إيقاف مؤقت للعداد ⏸️',
      details: `تم إيقاف مؤقت العمل عند ${newWorkTime} ثانية.`,
      type: 'timer',
    });

    const targetUpdated: Issue = {
      ...issue,
      workTime: newWorkTime,
      isWorkingNow: false,
      timerStartedAt: null,
      activeWorker: null,
      timeline: updatedTimeline,
    };

    setIssues((prev) => prev.map((item) => (item.id === issue.id ? targetUpdated : item)));
    setDetailIssue((prev) => (prev && prev.id === issue.id ? { ...prev, ...targetUpdated } : prev));
    realtimeSync.broadcastTicketUpdate(
      targetUpdated,
      currentUser.name,
      'إيقاف مؤقت للعداد ⏸️',
      `تم إيقاف مؤقت العمل عند ${targetUpdated.workTime} ثانية`
    );
    upsertSingleIssueToSupabase(targetUpdated);

    addAuditLog('إيقاف عداد تذكرة', `إيقاف مؤقت العمل للتذكرة ${issue.id}`);
    addNotification(
      `إيقاف مؤقت العمل [${issue.id}] ⏸️`,
      `تم إيقاف مؤقت العمل مؤقتاً للتذكرة ${issue.id}`,
      issue.id,
      'warning'
    );
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
    const isClosing = newStatus === 'Resolved' || newStatus === 'Closed';

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

          const elapsed = (i.isWorkingNow && i.timerStartedAt)
            ? Math.max(0, Math.floor((Date.now() - new Date(i.timerStartedAt).getTime()) / 1000))
            : 0;

          const updated: Issue = {
            ...i,
            status: newStatus,
            workTime: isClosing ? (i.workTime || 0) + elapsed : i.workTime,
            isWorkingNow: isClosing ? false : i.isWorkingNow,
            timerStartedAt: isClosing ? null : i.timerStartedAt,
            activeWorker: isClosing ? null : i.activeWorker,
            resolvedAt: isClosing ? new Date().toISOString() : i.resolvedAt,
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
      upsertSingleIssueToSupabase(updatedIssueToBroadcast);
    }

    addAuditLog('تحديث حالة', `تحويل حالة التذكرة ${issue.id} إلى ${newStatus}`);
    addNotification(
      `تغيير حالة التذكرة [${issue.id}] 🔄`,
      `تم تغيير الحالة إلى (${newStatus}) بنجاح`,
      issue.id,
      'warning'
    );
  };

  // Bulk Status Change
  const handleBulkChangeStatus = (issueIds: string[], newStatus: IssueStatus) => {
    let updatedIssuesToPersist: Issue[] = [];
    const isClosing = newStatus === 'Resolved' || newStatus === 'Closed';

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

          const elapsed = (item.isWorkingNow && item.timerStartedAt)
            ? Math.max(0, Math.floor((Date.now() - new Date(item.timerStartedAt).getTime()) / 1000))
            : 0;

          const updated: Issue = {
            ...item,
            status: newStatus,
            workTime: isClosing ? (item.workTime || 0) + elapsed : item.workTime,
            isWorkingNow: isClosing ? false : item.isWorkingNow,
            timerStartedAt: isClosing ? null : item.timerStartedAt,
            activeWorker: isClosing ? null : item.activeWorker,
            resolvedAt: isClosing ? new Date().toISOString() : item.resolvedAt,
            timeline: updatedTimeline,
          };
          updatedIssuesToPersist.push(updated);
          realtimeSync.broadcastTicketUpdate(
            updated,
            currentUser.name,
            'تحديث جماعي للحالة',
            `تحويل الحالة إلى ${newStatus}`
          );
          return updated;
        }
        return item;
      })
    );
    updatedIssuesToPersist.forEach((iss) => upsertSingleIssueToSupabase(iss));
    addAuditLog('تحديث جماعي', `تم تعديل حالة ${issueIds.length} تذكرة إلى ${newStatus}`);
    addNotification(
      `تحديث جماعي للحالة 🔄`,
      `تم تحويل حالة ${issueIds.length} تذكرة إلى (${newStatus})`,
      undefined,
      'info'
    );
  };

  // Bulk Delete Selected Tickets
  const handleBulkDelete = async (issueIds: string[]) => {
    issueIds.forEach((id) => deletedIssueIdsRef.current.add(id));
    saveDeletedIssueIds(deletedIssueIdsRef.current);
    setIssues((prev) => {
      const next = prev.filter((i) => !issueIds.includes(i.id));
      try {
        localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(next));
      } catch {}
      return next;
    });

    await deleteBulkIssuesFromSupabase(issueIds);
    realtimeHub.broadcast('ticket:bulk_deleted', { issueIds }, currentUser.name);
    addAuditLog('حذف جماعي', `تم حذف ${issueIds.length} تذكرة نهائياً.`);
    addNotification(
      `حذف جماعي للتذاكر 🗑️`,
      `تم حذف ${issueIds.length} تذكرة نهائياً من المنظومة`,
      undefined,
      'danger'
    );
  };

  // Delete Single Issue
  const handleDeleteIssue = async (issueId: string) => {
    deletedIssueIdsRef.current.add(issueId);
    saveDeletedIssueIds(deletedIssueIdsRef.current);
    setIssues((prev) => {
      const next = prev.filter((i) => i.id !== issueId);
      try {
        localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(next));
      } catch {}
      return next;
    });

    await deleteSingleIssueFromSupabase(issueId);
    realtimeHub.broadcast('ticket:deleted', { issueId }, currentUser.name);
    addAuditLog('حذف تذكرة', `تم حذف التذكرة ${issueId} نهائياً.`);
    addNotification(
      `حذف تذكرة [${issueId}] 🗑️`,
      `تم حذف التذكرة ${issueId} نهائياً من المنظومة`,
      undefined,
      'danger'
    );
  };

  // Delete ALL Tickets (Wipe All)
  const handleClearAllTickets = async () => {
    deletedIssueIdsRef.current.clear();
    saveDeletedIssueIds(deletedIssueIdsRef.current);
    setIssues([]);
    try {
      localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
    } catch {}

    try {
      const client = getSupabaseClient();
      const { error } = await client.from('issues').delete().neq('id', '0');
      if (error) {
        console.error('Supabase Clear All Error:', error);
      }
    } catch (err) {
      console.error('Supabase Clear All Exception:', err);
    }

    realtimeSync.broadcastClearAllTickets(currentUser.name);
    addAuditLog('تفريغ كافة التذاكر', 'تم مسح وتفريغ كافة التذاكر من المنظومة والسحابة نهائياً.');
    addNotification(
      `تفريغ كافة التذاكر 🗑️`,
      'تم مسح وتفريغ كافة التذاكر من المنظومة وقاعدة البيانات',
      undefined,
      'danger'
    );
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
      upsertSingleIssueToSupabase(resolvedIssueToBroadcast);
    }

    addAuditLog('حل تذكرة', `إغلاق التذكرة ${issueId} وسبب الحل: ${reason}`);
    addNotification(
      `حل وإغلاق التذكرة [${issueId}] 🟢`,
      `تم اعتماد حل التذكرة: ${reason}`,
      issueId,
      'success'
    );
    setResolvingIssue(null);
  };

  // CSAT Rating Update
  const handleUpdateCsat = (issueId: string, rating: number) => {
    let updatedIssueToPersist: Issue | null = null;
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
          updatedIssueToPersist = updated;
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
    if (updatedIssueToPersist) {
      upsertSingleIssueToSupabase(updatedIssueToPersist);
    }
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

    let updatedIssueToPersist: Issue | null = null;
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

          const updated = {
            ...item,
            comments: updatedComments,
            timeline: updatedTimeline,
          };
          updatedIssueToPersist = updated;
          return updated;
        }
        return item;
      })
    );

    if (updatedIssueToPersist) {
      upsertSingleIssueToSupabase(updatedIssueToPersist);
    }

    // Broadcast new comment to all team members
    realtimeHub.broadcast('ticket:comment', { issueId, comment: newComment }, currentUser.name);
    addNotification(
      `إضافة ملاحظة [${issueId}] 💬`,
      commentText ? (commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText) : 'تم إرفاق ملف توضيحي',
      issueId,
      'info'
    );
  };

  // User Management
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role !== 'Admin') {
      setCurrentTab('issues');
    } else {
      setCurrentTab('dashboard');
    }
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
    if (user.role !== 'Admin' && (currentTab === 'dashboard' || currentTab === 'admin')) {
      setCurrentTab('issues');
    }
    try {
      localStorage.setItem(STORAGE_KEY + '_CURRENT_USER_ID', user.id);
    } catch {}
    addAuditLog('تبديل مستخدم', `تم تبديل جلسة العمل إلى ${user.name} (${user.role})`);
    addNotification(
      `تبديل المستخدم 👤`,
      `تم تبديل المستخدم الحالي إلى ${user.name} (${user.role})`,
      undefined,
      'info'
    );
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    let updatedUserToPersist: AppUser | null = null;
    setUsers((prev) =>
      prev.map((item) => {
        if (item.id === userId) {
          const updated = { ...item, password: newPassword };
          updatedUserToPersist = updated;
          return updated;
        }
        return item;
      })
    );
    if (updatedUserToPersist) {
      upsertSingleUserToSupabase(updatedUserToPersist);
    }
    const u = users.find((item) => item.id === userId);
    addAuditLog('تغيير كلمة المرور', `تم تحديث كلمة المرور للموظف (${u?.name || userId}) بنجاح.`);
  };

  const handleAddUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      ...userData,
    };
    setUsers((prev) => [...prev, newUser]);
    upsertSingleUserToSupabase(newUser);
    addAuditLog('إضافة موظف', `تم إنشاء حساب ${userData.name} بالدور ${userData.role} وتحديد كلمة المرور والصلاحيات`);
    addNotification(
      `إضافة موظف جديد 👤`,
      `تم إنشاء حساب ${userData.name} بالدور (${userData.role})`,
      undefined,
      'success'
    );
  };

  const handleUpdateUserPermissions = (userId: string, newPermissions: string[]) => {
    let updatedUserToPersist: AppUser | null = null;
    setUsers((prev) =>
      prev.map((item) => {
        if (item.id === userId) {
          const updated = { ...item, permissions: newPermissions };
          updatedUserToPersist = updated;
          return updated;
        }
        return item;
      })
    );
    if (updatedUserToPersist) {
      upsertSingleUserToSupabase(updatedUserToPersist);
    }
    const u = users.find((item) => item.id === userId);
    addAuditLog('تعديل صلاحيات موظف', `تم تحديث صلاحيات الموظف (${u?.name || userId}) بنجاح.`);
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find((item) => item.id === userId);
    setUsers((prev) => prev.filter((item) => item.id !== userId));
    deleteSingleUserFromSupabase(userId);
    if (u) {
      addAuditLog('حذف مستخدم', `تم حذف الحساب ${u.name}`);
      addNotification(`حذف مستخدم 🗑️`, `تم حذف حساب المستخدم (${u.name})`, undefined, 'warning');
    }
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
    addNotification(`إضافة قسم جديد 🏷️`, `تمت إضافة قسم "${catData.name}" بنجاح`, undefined, 'info');
  };

  const handleUpdateCategory = (updatedCat: CategoryRule) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    addAuditLog('تعديل قسم', `تم تحديث بيانات وقواعد توجيه القسم "${updatedCat.name}"`);
    addNotification(`تعديل قسم 🏷️`, `تم تحديث بيانات وقواعد توجيه القسم "${updatedCat.name}"`, undefined, 'info');
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find((c) => c.id === catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (target) {
      addAuditLog('حذف قسم', `تم حذف قسم "${target.name}" وقواعد توجيهه.`);
      addNotification(`حذف قسم 🗑️`, `تم حذف قسم "${target.name}"`, undefined, 'warning');
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
  const handleSaveSupabase = async (url: string, key: string) => {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    const newConfig: SupabaseConfig = {
      url: cleanUrl,
      key: cleanKey,
      connected: !!(cleanUrl && cleanKey),
      lastSync: new Date().toLocaleTimeString('ar-EG'),
    };
    setSupabaseConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY + '_SUPABASE', JSON.stringify(newConfig));
    } catch {}

    addAuditLog('إعداد السحابة', 'تم حفظ وتحديث بيانات السحابة (Project URL & API Key) مركزياً لكافة الأجهزة');
    alert('✅ تم حفظ وتسجيل بيانات السحابة مركزياً بنجاح!\nالمنظومة ستقوم بإعادة التحميل الآن لتطبيق الإعدادات الجديدة.');
    setTimeout(() => {
      window.location.reload();
    }, 500);
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

    const res = await testSupabaseConnection(cleanUrl, cleanKey);
    if (res.success) {
      const updatedConfig = { url: cleanUrl, key: cleanKey, connected: true, lastSync: new Date().toLocaleTimeString('ar-EG') };
      setSupabaseConfig((prev) => ({ ...prev, ...updatedConfig }));
    }
    return res;
  };

  // Full Push to Supabase (Issues, Users, CAB, Settings)
  const handleSyncSupabaseNow = async (silent = false) => {
    if (!supabaseRef.current) {
      if (!silent) alert('يرجى التأكد من إدخال Project URL و Publishable API Key صالحين أولاً!');
      return;
    }
    try {
      const client = supabaseRef.current;

      // 1. Upsert issues (only active non-deleted tickets)
      const activeIssuesToSync = (issues || []).filter((i) => !deletedIssueIdsRef.current.has(i.id));
      if (activeIssuesToSync.length > 0) {
        const payload1 = activeIssuesToSync.map((i) => ({
          id: i.id,
          client: i.client || '',
          client_email: i.clientEmail || null,
          client_phone: i.clientPhone || null,
          tag: i.tag || '',
          type: i.type || '',
          desc_text: i.desc || '',
          assigned: i.assigned || '',
          owner: i.owner || '',
          priority: i.priority || 'Medium',
          status: i.status || 'Open',
          worktime: i.workTime || 0,
          csat: i.csat || 5,
          created_at: i.createdAt,
          due_date: i.dueDate,
          comments: i.comments || [],
          timeline: i.timeline || [],
          is_external_owner: i.isExternalOwner || false,
          external_owner_details: i.externalOwnerDetails || null,
          merged_into_ticket_id: i.mergedIntoTicketId || null,
          merged_ticket_ids: i.mergedTicketIds || [],
          client_notes: i.clientNotes || null,
          sla_paused: i.slaPaused || false,
          sla_paused_reason: i.slaPausedReason || null,
          sla_paused_at: i.slaPausedAt || null,
          sla_extended_hours: i.slaExtendedHours || 0,
          sla_extension_reason: i.slaExtensionReason || null,
          submitted_by_client: i.submittedByClient || false,
        }));

        const { error: issuesError1 } = await client.from('issues').upsert(payload1, { onConflict: 'id' });
        if (issuesError1) {
          console.warn('[Supabase] Bulk issues sync primary failed, trying standard SQL snake_case payload...', issuesError1);
          
          const payload2 = activeIssuesToSync.map((i) => ({
            id: i.id,
            client: i.client || '',
            client_email: i.clientEmail || null,
            client_phone: i.clientPhone || null,
            tag: i.tag || '',
            type: i.type || '',
            desc_text: i.desc || '',
            assigned: i.assigned || '',
            owner: i.owner || '',
            priority: i.priority || 'Medium',
            status: i.status || 'Open',
            worktime: i.workTime || 0,
            csat: i.csat || 5,
            created_at: i.createdAt,
            due_date: i.dueDate,
            comments: i.comments || [],
            timeline: i.timeline || [],
          }));
          const { error: issuesError2 } = await client.from('issues').upsert(payload2, { onConflict: 'id' });
          if (issuesError2) {
            console.warn('[Supabase] Bulk issues sync standard SQL payload also failed, trying minimal fallback. Error:', issuesError2);
            const payload3 = activeIssuesToSync.map((i) => ({
              id: i.id,
              client: i.client || '',
              priority: i.priority || 'Medium',
              status: i.status || 'Open',
            }));
            const { error: issuesError3 } = await client.from('issues').upsert(payload3, { onConflict: 'id' });
            if (issuesError3) {
              console.error('[Supabase] Bulk issues sync minimal fallback also failed! Error:', issuesError3);
            }
          }
        }
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

      // 3. Upsert cab_activities if available
      if (cabActivities && cabActivities.length > 0) {
        const cabPayload = cabActivities.map((c) => ({
          id: c.id,
          activity_name: c.activityName,
          scope: c.scope,
          impacted_services: c.impactedServices,
          service_impact: c.serviceImpact,
          stop_service_target_system: c.stopServiceTargetSystem,
          stopped_system_name: c.stoppedSystemName,
          downtime_required: c.downtimeRequired,
          date: c.date,
          start_time: c.startTime,
          end_time: c.endTime,
          maintenance_window: c.maintenanceWindow,
          requestor: c.requestor,
          tpm: c.tpm,
          change_management: c.changeManagement,
          status: c.status,
          risk_level: c.riskLevel,
          rollback_plan: c.rollbackPlan,
          rollback_reason: c.rollbackReason,
          comments: c.comments || [],
          audit_trail: c.auditTrail || [],
          created_at: c.createdAt,
        }));
        const { error: cabError } = await client.from('cab_activities').upsert(cabPayload, { onConflict: 'id' });
        if (cabError && !cabError.message?.includes('does not exist')) {
          console.warn('CAB sync note:', cabError);
        }
      }

      // 4. Upsert system_cloud_store (categories, tags, canned responses, settings, vendors, sla)
      const systemStorePayload = [
        { key: 'categories', data: categories, updated_at: new Date().toISOString() },
        { key: 'tags', data: tags, updated_at: new Date().toISOString() },
        { key: 'canned_responses', data: cannedResponses, updated_at: new Date().toISOString() },
        { key: 'general_settings', data: generalSettings, updated_at: new Date().toISOString() },
        { key: 'sound_settings', data: soundSettings, updated_at: new Date().toISOString() },
        { key: 'audit_logs', data: auditLogs.slice(0, 100), updated_at: new Date().toISOString() },
        { key: 'external_vendors', data: externalVendors, updated_at: new Date().toISOString() },
        { key: 'sla_settings', data: slaSettings, updated_at: new Date().toISOString() },
      ];

      const { error: storeError } = await client.from('system_cloud_store').upsert(systemStorePayload, { onConflict: 'key' });
      if (storeError && !storeError.message?.includes('does not exist')) {
        console.warn('Store sync note:', storeError);
      }

      if (!silent) {
        setSupabaseConfig((prev) => ({
          ...prev,
          connected: true,
          lastSync: new Date().toLocaleTimeString('ar-EG'),
        }));
      }

      if (!silent) {
        alert(
          `✅ تمت المزامنة الشاملة وحفظ كل البيانات في السحابة بنجاح!\n\n` +
          `• تذاكر وبلاغات: ${issues.length} تذكرة محفوظة\n` +
          `• مستخدمين وصلاحيات: ${users.length} مستخدم مع كلمات المرور\n` +
          `• أنشطة CAB لاعتماد التغيير: ${cabActivities.length} نشاط\n` +
          `• أقسام وقواعد توجيه: ${categories.length} قسم\n` +
          `• الوسوم والردود الجاهزة والإعدادات العامة محفوظة بالكامل.`
        );
      }
      addAuditLog('مزامنة سحابية شاملة', `تم حفظ وتحديث ${issues.length} تذكرة و ${users.length} مستخدم و ${cabActivities.length} نشاط CAB في Supabase`);
    } catch (e: any) {
      if (!silent) {
        alert(`تنبيه المزامنة: ${e.message || 'تأكد من إنشاء الجداول عبر كود SQL المتاح في المنظومة'}`);
      }
    }
  };

  // Full Pull from Supabase (Issues, Users, CAB, Settings)
  const handlePullSupabaseNow = async (silent = false) => {
    const client = supabase;
    try {
      let pulledIssues = 0;
      let pulledUsers = 0;
      let pulledCats = 0;
      let pulledCab = 0;

      // 1. Pull issues
      const { data: issuesData, error: issuesErr } = await client.from('issues').select('*');
      if (issuesErr) {
        console.error('Supabase Fetch Error in handlePullSupabaseNow:', issuesErr);
      }
      if (!issuesErr && Array.isArray(issuesData)) {
        const validRows = issuesData.filter((row: any) => !deletedIssueIdsRef.current.has(row.id));
        if (validRows.length === 0) {
          setIssues([]);
          try {
            localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
          } catch {}
          pulledIssues = 0;
        } else {
          const mappedIssues: Issue[] = validRows.map(mapSingleRowToIssue);
          setIssues(mappedIssues);
          try {
            localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(mappedIssues));
          } catch {}
          pulledIssues = mappedIssues.length;
        }
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
        try {
          localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(mappedUsers));
        } catch {}
        pulledUsers = mappedUsers.length;
      }

      // 3. Pull cab_activities
      const { data: cabData, error: cabErr } = await client.from('cab_activities').select('*');
      if (!cabErr && cabData && cabData.length > 0) {
        const mappedCab: CabBusinessActivity[] = cabData.map((row: any) => ({
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
        setCabActivities(mappedCab);
        try {
          localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', JSON.stringify(mappedCab));
        } catch {}
        pulledCab = mappedCab.length;
      }

      // 4. Pull system_cloud_store
      const { data: storeData, error: storeErr } = await client.from('system_cloud_store').select('*');
      if (!storeErr && storeData) {
        for (const row of storeData) {
          if (row.key === 'categories' && Array.isArray(row.data)) {
            setCategories(row.data);
            try {
              localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(row.data));
            } catch {}
            pulledCats = row.data.length;
          } else if (row.key === 'tags' && Array.isArray(row.data)) {
            setTags(row.data);
            try {
              localStorage.setItem(STORAGE_KEY + '_TAGS', JSON.stringify(row.data));
            } catch {}
          } else if (row.key === 'canned_responses' && Array.isArray(row.data)) {
            setCannedResponses(row.data);
            try {
              localStorage.setItem(STORAGE_KEY + '_CANNED', JSON.stringify(row.data));
            } catch {}
          } else if (row.key === 'general_settings' && row.data && typeof row.data === 'object') {
            setGeneralSettings(row.data);
            try {
              localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(row.data));
            } catch {}
          } else if (row.key === 'sound_settings' && row.data && typeof row.data === 'object') {
            setSoundSettings(row.data);
            try {
              localStorage.setItem(STORAGE_KEY + '_SOUND', JSON.stringify(row.data));
            } catch {}
          }
        }
      }

      setSupabaseConfig((prev) => ({
        ...prev,
        connected: true,
        lastSync: new Date().toLocaleTimeString('ar-EG'),
      }));

      addAuditLog('استيراد سحابي شامل', `تم استيراد ${pulledIssues} تذكرة و ${pulledUsers} مستخدم و ${pulledCab} نشاط CAB من Supabase`);
    } catch (e: any) {
      console.warn('Pull cloud error:', e);
    }
  };

  // Dedicated Handler for CloudSyncImportModal
  const handleImportCloudData = (importedData: {
    issues?: Issue[];
    users?: AppUser[];
    cabActivities?: CabBusinessActivity[];
    categories?: CategoryRule[];
    generalSettings?: GeneralSettings;
  }) => {
    if (Array.isArray(importedData.issues)) {
      setIssues(importedData.issues);
      try {
        localStorage.setItem(STORAGE_KEY + '_ISSUES', JSON.stringify(importedData.issues));
      } catch {}
    }
    if (Array.isArray(importedData.users) && importedData.users.length > 0) {
      setUsers(importedData.users);
      try {
        localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(importedData.users));
      } catch {}
    }
    if (Array.isArray(importedData.cabActivities)) {
      setCabActivities(importedData.cabActivities);
      try {
        localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', JSON.stringify(importedData.cabActivities));
      } catch {}
    }
    if (Array.isArray(importedData.categories) && importedData.categories.length > 0) {
      setCategories(importedData.categories);
      try {
        localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(importedData.categories));
      } catch {}
    }
    if (importedData.generalSettings) {
      setGeneralSettings(importedData.generalSettings);
      try {
        localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(importedData.generalSettings));
      } catch {}
    }
    addAuditLog('استيراد بيانات السحابة', `تم استيراد وتطبيق ${importedData.issues?.length || 0} تذكرة و ${importedData.users?.length || 0} مستخدم من Supabase`);
    addNotification(
      'استيراد بيانات السحابة ☁️',
      `تم استيراد وتطبيق ${importedData.issues?.length || 0} تذكرة و ${importedData.users?.length || 0} مستخدم من Supabase`,
      undefined,
      'success'
    );
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

  // Quick jump directly to Supabase settings in Admin view (Admin only)
  const handleNavigateToSupabaseSettings = () => {
    if (currentUser.role === 'Admin') {
      setAdminSubTab('supabase');
      setCurrentTab('admin');
    }
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
      addNotification(
        'استعادة نسخة احتياطية 💾',
        `تم استبدال واستعادة كافة بيانات المنظومة بنجاح (${backup.issues?.length || 0} تذكرة)`,
        undefined,
        'success'
      );
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
      addNotification('دمج نسخة احتياطية 💾', 'تم دمج البيانات الجديدة من النسخة الاحتياطية بنجاح', undefined, 'success');
    }
  };

  // Open Production Reset Confirmation Modal
  const handleResetSystemToDefault = () => {
    setShowResetConfirmModal(true);
  };

  // Execute Customizable Production / Factory Reset
  const handleConfirmResetProduction = async (options: ResetOptions) => {
    setIsResettingSystem(true);
    setResetStepText('1/4: مسح وتصفير العناصر المحددة والتخزين المحلي...');

    try {
      // 1. Reset local state according to selected options
      if (options.clearTickets) {
        deletedIssueIdsRef.current.clear();
        saveDeletedIssueIds(deletedIssueIdsRef.current);
        setIssues([]);
        setCabActivities([]);
        setLiveToast(null);
        setDetailIssue(null);
        setShowDetailsModal(false);
        setEditingIssue(null);
        try {
          localStorage.setItem(STORAGE_KEY + '_ISSUES', '[]');
          localStorage.setItem(STORAGE_KEY + '_CAB_ACTIVITIES', '[]');
          localStorage.setItem(STORAGE_KEY + '_DELETED_ISSUE_IDS', '[]');
        } catch (e) {}
      }

      if (options.clearNotifications) {
        setNotifications([]);
        try { localStorage.setItem(STORAGE_KEY + '_NOTIFICATIONS', '[]'); } catch (e) {}
      }

      if (options.clearUsers) {
        const adminUsers = INITIAL_USERS.filter((u) => u.role === 'Admin');
        const resetUsers = adminUsers.length > 0 ? adminUsers : INITIAL_USERS;
        setUsers(resetUsers);
        try { localStorage.setItem(STORAGE_KEY + '_USERS', JSON.stringify(resetUsers)); } catch (e) {}
      }

      if (options.clearCategories) {
        setCategories(INITIAL_CATEGORIES);
        try { localStorage.setItem(STORAGE_KEY + '_CATEGORIES', JSON.stringify(INITIAL_CATEGORIES)); } catch (e) {}
      }

      if (options.clearTagsAndCanned) {
        setTags(INITIAL_TAGS);
        setCannedResponses(INITIAL_CANNED_RESPONSES);
        try {
          localStorage.setItem(STORAGE_KEY + '_TAGS', JSON.stringify(INITIAL_TAGS));
          localStorage.setItem(STORAGE_KEY + '_CANNED', JSON.stringify(INITIAL_CANNED_RESPONSES));
        } catch (e) {}
      }

      if (options.resetGeneralSettings) {
        setSoundSettings(INITIAL_SOUND_SETTINGS);
        setGeneralSettings(INITIAL_GENERAL_SETTINGS);
        try {
          localStorage.setItem(STORAGE_KEY + '_SOUND', JSON.stringify(INITIAL_SOUND_SETTINGS));
          localStorage.setItem(STORAGE_KEY + '_GENERAL', JSON.stringify(INITIAL_GENERAL_SETTINGS));
        } catch (e) {}
      }

      const resetDetailsText = [
        options.clearTickets ? 'مسح التذاكر' : '',
        options.clearAuditLogs ? 'مسح سجل التدقيق' : '',
        options.clearUsers ? 'تصفير المستخدمين' : '',
        options.clearCategories ? 'تصفير الأقسام' : '',
        options.clearNotifications ? 'تصفير التنبيهات' : '',
        options.clearTagsAndCanned ? 'مسح الوسوم' : '',
        options.resetGeneralSettings ? 'تصفير المظهر' : '',
      ].filter(Boolean).join(' • ');

      const initialProdLog: AuditLog = {
        id: `a-${Date.now()}`,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        user: currentUser.name || 'مدير النظام',
        action: 'تهيئة مخصصة للنظام 🚀',
        details: `تم تنفيذ تهيئة مخصصة للإنتاج: (${resetDetailsText})`,
      };

      if (options.clearAuditLogs) {
        setAuditLogs([initialProdLog]);
        try { localStorage.setItem(STORAGE_KEY + '_AUDIT', JSON.stringify([initialProdLog])); } catch (e) {}
      } else {
        addAuditLog('تهيئة مخصصة للنظام 🚀', `تم مسح العناصر المحددة: ${resetDetailsText}`);
      }

      setResetStepText('2/4: تفريغ ومسح البيانات المحددة في Supabase Cloud...');
      // 2. Direct Supabase Cloud Wipe
      try {
        const client = getSupabaseClient();
        if (client) {
          if (options.clearTickets) {
            await client.from('issues').delete().neq('id', 'dummy_clean_id_zero');
            try { await client.from('cab_activities').delete().neq('id', 'dummy_clean_id_zero'); } catch {}
            try { await client.from('system_store').upsert({ key: 'deleted_issue_ids', value: [] }); } catch {}
          }
          if (options.clearUsers) {
            try { await client.from('system_cloud_store').upsert({ key: 'users', data: INITIAL_USERS }); } catch {}
          }
          if (options.clearCategories) {
            try { await client.from('system_cloud_store').upsert({ key: 'categories', data: INITIAL_CATEGORIES }); } catch {}
          }
        }
      } catch (err) {
        console.warn('[Supabase-Wipe-Client] Error:', err);
      }

      setResetStepText('3/4: تصفير ذاكرة الخادم وقاعدة البيانات السحابية (db.json)...');
      // 3. Backend API Reset
      try {
        await fetch('/api/system/reset-production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor: currentUser.name, options }),
        });
      } catch (err) {
        console.warn('[Server-Reset] Error:', err);
      }

      setResetStepText('4/4: بث تحديث التهيئة المخصصة لكافة الشاشات والأعضاء...');
      // 4. Realtime Broadcast
      realtimeSync.broadcastResetProduction(currentUser.name);
      realtimeHub.broadcast('system:reset_production', { actor: currentUser.name, options }, currentUser.name);

      addNotification(
        'تهيئة المنظومة بنجاح 🚀',
        `تم مسح العناصر المحددة (${resetDetailsText}) وتهيئة المنظومة كلياً للعمل الفعلي`,
        undefined,
        'success'
      );

      setTimeout(() => {
        setIsResettingSystem(false);
        setShowResetConfirmModal(false);
        setCurrentTab('issues');
      }, 700);
    } catch (error) {
      console.error('Reset system error:', error);
      setIsResettingSystem(false);
      setShowResetConfirmModal(false);
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
    if (showPublicCustomerPortalModal) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm">
              <span>🌐 بوابة العملاء ومتابعة التذاكر</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPublicCustomerPortalModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>العودة لصفحة تسجيل الدخول</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CustomerPortalView
              issues={issues}
              onSelectTicket={handleSelectTicketById}
              onUpdateIssue={handleUpdateIssue}
              onAddComment={handleAddComment}
              currentUser={currentUser}
              onOpenNewTicketModal={() => {
                setIsClientSubmission(true);
                setEditingIssue(null);
                setShowIssueModal(true);
              }}
            />
          </div>

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
            currentUser={currentUser}
            externalVendors={externalVendors}
            onSaveVendor={handleAddExternalVendor}
            issues={issues}
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
            onUpdatePhone={handleUpdateIssuePhone}
            onUpdateIssue={handleUpdateIssue}
            issues={issues}
          />
        </div>
      );
    }

    return (
      <LoginScreen
        users={users}
        generalSettings={generalSettings}
        onLogin={handleLogin}
        onOpenCustomerPortal={() => setShowPublicCustomerPortalModal(true)}
      />
    );
  }

  const getDynamicStyles = () => {
    if (theme === 'dark') return '';
    
    let pageBg = '';
    if (generalSettings.lightThemeBgColor === 'pure_white') pageBg = '#ffffff';
    else if (generalSettings.lightThemeBgColor === 'soft_gray') pageBg = '#f1f5f9';
    else if (generalSettings.lightThemeBgColor === 'warm_beige') pageBg = '#fafaf9';
    else if (generalSettings.lightThemeBgColor === 'ice_blue') pageBg = '#f0f9ff';
    else if (generalSettings.lightThemeBgColor === 'soft_mint') pageBg = '#f0fdf4';
    else if (generalSettings.lightThemeBgColor === 'custom' && generalSettings.customLightBgHex) {
      pageBg = generalSettings.customLightBgHex;
    }

    let cardBg = '';
    if (generalSettings.lightCardBgColor === 'custom' && generalSettings.customCardBgHex) {
      cardBg = generalSettings.customCardBgHex;
    }

    let headerBg = '';
    if (generalSettings.lightHeaderBgColor === 'custom' && generalSettings.customHeaderBgHex) {
      headerBg = generalSettings.customHeaderBgHex;
    }

    let styles = '';
    if (pageBg) {
      styles += `
        :root:not(.dark) .min-h-screen,
        :root:not(.dark) body,
        :root:not(.dark) .skin-standard {
          background-color: ${pageBg} !important;
          background-image: none !important;
        }
      `;
    }
    if (cardBg) {
      styles += `
        :root:not(.dark) .bg-white,
        :root:not(.dark) .cab-activity-card {
          background-color: ${cardBg} !important;
        }
      `;
    }
    if (headerBg) {
      styles += `
        :root:not(.dark) header,
        :root:not(.dark) .sticky {
          background-color: ${headerBg} !important;
        }
      `;
    }
    return styles;
  };

  return (
    <BadgeStyleProvider style={generalSettings.badgeStyle || 'clean-arabic'}>
      <style dangerouslySetInnerHTML={{ __html: getDynamicStyles() }} />
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Cairo',sans-serif] transition-all duration-300 skin-${appSkin} relative overflow-x-hidden`}>
      {/* Premium Glassmorphic Dynamic Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[10%] left-[10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full filter blur-[80px] sm:blur-[120px] opacity-25 dark:opacity-30 animate-blob transition-all duration-1000 ${
          appSkin === 'amethyst' ? 'bg-purple-600 dark:bg-purple-800' :
          appSkin === 'cyberpunk' ? 'bg-pink-600 dark:bg-pink-800' :
          appSkin === 'ocean' ? 'bg-sky-500 dark:bg-cyan-700' : 'bg-indigo-300/40 dark:bg-indigo-950/20'
        }`} />
        <div className={`absolute bottom-[20%] right-[10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full filter blur-[100px] sm:blur-[140px] opacity-20 dark:opacity-25 animate-blob animation-delay-2000 transition-all duration-1000 ${
          appSkin === 'amethyst' ? 'bg-fuchsia-500 dark:bg-fuchsia-900' :
          appSkin === 'cyberpunk' ? 'bg-rose-500 dark:bg-rose-950' :
          appSkin === 'ocean' ? 'bg-blue-600 dark:bg-blue-900' : 'bg-emerald-300/40 dark:bg-emerald-950/20'
        }`} />
        <div className={`absolute top-[50%] left-[40%] w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] rounded-full filter blur-[70px] sm:blur-[110px] opacity-15 dark:opacity-20 animate-blob animation-delay-4000 transition-all duration-1000 ${
          appSkin === 'amethyst' ? 'bg-indigo-400 dark:bg-violet-900' :
          appSkin === 'cyberpunk' ? 'bg-violet-500 dark:bg-purple-900' :
          appSkin === 'ocean' ? 'bg-cyan-400 dark:bg-indigo-900' : 'bg-purple-200/40 dark:bg-purple-950/20'
        }`} />
      </div>

      {/* Audio element for SLA alert */}
      <audio ref={alarmAudioRef} src={soundSettings.alarmUrl} preload="auto" loop />

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        issues={issues}
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
        onOpenCloudImportModal={() => setIsGlobalCloudImportModalOpen(true)}
        notifications={notifications}
        onClearNotifications={() => handleClearAllNotifications(true)}
        onClearSingleNotification={(id) => handleClearSingleNotification(id, true)}
        onSelectTicket={handleSelectTicketById}
        onOpenNewTicketModal={() => {
          setEditingIssue(null);
          setShowIssueModal(true);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        appSkin={appSkin}
        onToggleSkin={setAppSkin}
        generalSettings={generalSettings}
        realtimeStatus={realtimeStatus}
        onlineUsers={onlineUsers}
        totalConnections={totalConnections}
        onRefreshRealtime={() => realtimeSync.fetchServerState()}
        onTriggerDemoToast={handleTriggerDemoToast}
      />

      {/* Floating Multi-Region Live Notification Toast */}
      {liveToast && (
        <div
          onMouseEnter={() => setIsToastPaused(true)}
          onMouseLeave={() => setIsToastPaused(false)}
          className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.35)] p-4 animate-scaleUp transition-all duration-300 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>تنبيه سحابي فوري 🌐</span>
                </h4>
                {isToastPaused && (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    مثبّت للقراءة 📌
                  </span>
                )}
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                {liveToast.title}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {liveToast.desc}
              </p>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>بواسطة: {liveToast.author} {liveToast.location ? `• ${liveToast.location}` : ''}</span>
                <span className="font-mono text-emerald-500 font-bold">الآن ⚡</span>
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold cursor-pointer"
              title="إغلاق التنبيه"
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
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              فتح وعرض التذكرة الآن 👁️
            </button>
            <button
              onClick={() => setLiveToast(null)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              تجاهل
            </button>
          </div>
          {/* Active Status Pulse Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
            <div className={`h-full bg-emerald-500 rounded-full transition-all duration-300 ${isToastPaused ? 'w-full' : 'animate-pulse w-full'}`} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-grow w-full space-y-6 relative z-10">
        {hasPermission(currentUser, 'page.dashboard') && currentTab === 'dashboard' && (
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
            onClearAllTickets={handleClearAllTickets}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onOpenMergeModal={handleOpenMergeModal}
            onUpdatePhone={handleUpdateIssuePhone}
            appSkin={appSkin}
          />
        )}

        {/* Dedicated SLA Management View */}
        {currentTab === 'sla' && (
          <SlaManagementView
            issues={issues}
            categories={categories}
            slaSettings={slaSettings}
            onUpdateSlaSettings={handleUpdateSlaSettings}
            onUpdateCategorySla={handleUpdateSlaRules}
            onUpdateIssue={handleUpdateIssue}
            onSelectTicket={handleSelectTicketById}
            currentUser={currentUser}
            externalVendors={externalVendors}
          />
        )}

        {/* Dedicated Customer Portal View */}
        {currentTab === 'customer' && (
          <CustomerPortalView
            issues={issues}
            onSelectTicket={handleSelectTicketById}
            onUpdateIssue={handleUpdateIssue}
            onAddComment={handleAddComment}
            currentUser={currentUser}
            onOpenNewTicketModal={() => setShowIssueModal(true)}
          />
        )}

        {/* Dedicated CAB Business Activity View */}
        {currentTab === 'cab' && (
          <CabBusinessActivityView
            activities={cabActivities}
            onAddActivity={handleAddCabActivity}
            onUpdateActivity={handleUpdateCabActivity}
            onDeleteActivity={handleDeleteCabActivity}
            currentUser={currentUser}
            appSkin={appSkin}
            cabDesignStyle={generalSettings.cabDesignStyle || 'dynamic_table'}
          />
        )}

        {/* Dedicated Analytics & Recharts Distribution View */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <AdminAnalyticsDashboard
              issues={issues}
              categories={categories}
            />
          </div>
        )}

        {currentUser.role === 'Admin' && currentTab === 'admin' && (
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
            onImportCloudData={handleImportCloudData}
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
            externalVendors={externalVendors}
            onAddExternalVendor={handleAddExternalVendor}
            onUpdateExternalVendor={handleUpdateExternalVendor}
            onDeleteExternalVendor={handleDeleteExternalVendor}
            onNavigateToSla={() => setCurrentTab('sla')}
            cabActivities={cabActivities}
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
        currentUser={currentUser}
        externalVendors={externalVendors}
        onSaveVendor={handleAddExternalVendor}
        issues={issues}
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
        onUpdatePhone={handleUpdateIssuePhone}
        onUpdateIssue={handleUpdateIssue}
        issues={issues}
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
        currentUser={currentUser}
        onUpdatePhone={handleUpdateIssuePhone}
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

      {isAuthenticated && currentUser && (
        <AgentScratchpad
          currentUser={currentUser}
          appSkin={appSkin}
        />
      )}

      {/* Global Cloud Import & Explorer Modal */}
      <CloudSyncImportModal
        isOpen={isGlobalCloudImportModalOpen}
        onClose={() => setIsGlobalCloudImportModalOpen(false)}
        supabaseConfig={supabaseConfig}
        currentStats={{
          issuesCount: issues.length,
          usersCount: users.length,
          cabCount: cabActivities?.length || 0,
          categoriesCount: categories.length,
        }}
        onImportComplete={handleImportCloudData}
      />

      {/* Production Factory Reset Confirmation Modal */}
      <ProductionResetModal
        isOpen={showResetConfirmModal}
        onClose={() => {
          if (!isResettingSystem) setShowResetConfirmModal(false);
        }}
        onConfirm={handleConfirmResetProduction}
        isLoading={isResettingSystem}
        stepText={resetStepText}
        counts={{
          issuesCount: issues.length,
          auditLogsCount: auditLogs.length,
          usersCount: users.length,
          categoriesCount: categories.length,
          notificationsCount: notifications.length,
        }}
      />
    </div>
    </BadgeStyleProvider>
  );
}
