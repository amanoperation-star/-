import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state cache
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://jdwgkaxhmuywetnpdhqt.supabase.co',
  key: 'sb_publishable_5WAZhnB_h-tAZrzT56rhgQ_WeANxqJD',
  connected: true,
};

let state: {
  issues: any[];
  categories: any[];
  users: any[];
  tags: string[];
  cannedResponses: string[];
  soundSettings: any;
  generalSettings: any;
  auditLogs: any[];
  externalVendors: any[];
  slaSettings: any;
  cabActivities: any[];
  supabaseConfig: any;
  deletedIssueIds?: string[];
  isSeeded?: boolean;
} = {
  issues: [],
  categories: [],
  users: [],
  tags: [],
  cannedResponses: [],
  soundSettings: null,
  generalSettings: null,
  auditLogs: [],
  externalVendors: [],
  slaSettings: null,
  cabActivities: [],
  supabaseConfig: DEFAULT_SUPABASE_CONFIG,
  deletedIssueIds: [],
  isSeeded: false,
};

const DEFAULT_SLA_SETTINGS = {
  businessHoursOnly: false,
  workStartHour: 9,
  workEndHour: 17,
  workDays: [0, 1, 2, 3, 4],
  pauseOnExternalPending: true,
  pauseOnCustomerPending: true,
  warningThresholdMinutes: 120,
  autoEscalateOnBreach: true,
  soundAlertOnRisk: true,
  activePreset: 'standard',
};

const DEFAULT_EXTERNAL_VENDORS = [
  {
    id: 'ext-1',
    name: 'م/ أحمد مصطفى',
    company: 'فودافون مصر / الاتصالات والبنية التحتية',
    role: 'مزود خدمة اتصالات وإنترنت',
    phone: '+20 10 1234 5678',
    email: 'noc-support@vodafone.com',
    notes: 'الدعم الفني للخطوط الساخنة والألياف الضوئية والإنترنت المركزي',
  },
  {
    id: 'ext-2',
    name: 'فريق الدعم الفني',
    company: 'AWS / Cloud Infrastructure',
    role: 'مزود خدمة سحابية / تقنية (Service Provider)',
    phone: '+1 206 555 0100',
    email: 'aws-enterprise-support@amazon.com',
    notes: 'بلاغات خوادم EC2 وقواعد بيانات RDS السحابية. اذكر رقم الحساب المؤسسي',
  },
  {
    id: 'ext-3',
    name: 'م/ كريم الشريف',
    company: 'الرواد لصيانة الشبكات والسيرفرات',
    role: 'مقاول صيانة / دعم خارجي (Contractor)',
    phone: '+966 54 888 9911',
    email: 'support@alrowad-networks.com',
    notes: 'صيانة كبائن السيرفرات والراوترات وتمديدات الكابلات الميدانية',
  },
  {
    id: 'ext-4',
    name: 'دعم المعاملات والتسويات',
    company: 'Paymob / بوابة الدفع الإلكتروني',
    role: 'شريك تقني متكامل (Tech Partner)',
    phone: '+20 2 2588 0000',
    email: 'merchants-support@paymob.com',
    notes: 'الاستعلام عن تعليق العمليات المالية والربط مع بوابات الدفع',
  },
];

// Load initial database from file if exists
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      if (parsed.isSeeded !== undefined) {
        state.isSeeded = parsed.isSeeded;
      } else if (Array.isArray(state.issues) && state.issues.length > 0) {
        state.isSeeded = true;
      }
      if (!Array.isArray(state.externalVendors) || state.externalVendors.length === 0) {
        state.externalVendors = DEFAULT_EXTERNAL_VENDORS;
      }
      if (!state.slaSettings) {
        state.slaSettings = DEFAULT_SLA_SETTINGS;
      }
      if (parsed.supabaseConfig && parsed.supabaseConfig.url && parsed.supabaseConfig.url.includes('supabase.co')) {
        state.supabaseConfig = parsed.supabaseConfig;
      } else {
        state.supabaseConfig = DEFAULT_SUPABASE_CONFIG;
      }
      console.log(`[Database] Loaded ${state.issues?.length || 0} tickets, ${state.externalVendors?.length || 0} external vendors, Supabase: ${state.supabaseConfig ? 'configured' : 'none'} from disk.`);
    } else {
      state.externalVendors = DEFAULT_EXTERNAL_VENDORS;
      state.slaSettings = DEFAULT_SLA_SETTINGS;
    }
  } catch (err) {
    console.error('[Database] Failed to read database file:', err);
    if (!Array.isArray(state.externalVendors) || state.externalVendors.length === 0) {
      state.externalVendors = DEFAULT_EXTERNAL_VENDORS;
    }
    if (!state.slaSettings) {
      state.slaSettings = DEFAULT_SLA_SETTINGS;
    }
  }
};

// Debounced save to disk to avoid disk thrashing
let saveTimeout: NodeJS.Timeout | null = null;
const saveDatabase = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to save database file:', err);
    }
  }, 300);
};

loadDatabase();

async function deleteIssuesFromSupabase(issueIds: string[]) {
  if (!issueIds || issueIds.length === 0) return;
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const filter = `id=in.(${issueIds.map((id) => encodeURIComponent(id)).join(',')})`;
  try {
    await fetch(`${url}/rest/v1/issues?${filter}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    console.warn('[Supabase-Delete] Failed to delete issues:', err);
  }
}

async function deleteUserFromSupabase(userId: string) {
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  try {
    await fetch(`${url}/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    console.warn('[Supabase-Delete] Failed to delete user:', err);
  }
}

async function pushUsersToSupabase(usersList: any[]) {
  if (!usersList || usersList.length === 0) return;
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  const payload = usersList.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    department: u.department,
    avatar: u.avatar || '',
    permissions: u.permissions || [],
    password: u.password || '123456',
  }));

  try {
    await fetch(`${url}/rest/v1/app_users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[Supabase-Push] Failed to push users to Supabase:', err);
  }
}

async function deleteCabActivityFromSupabase(cabId: string) {
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  try {
    await fetch(`${url}/rest/v1/cab_activities?id=eq.${encodeURIComponent(cabId)}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
  } catch (err) {
    console.warn('[Supabase-Delete] Failed to delete CAB activity:', err);
  }
}

async function pushCabActivitiesToSupabase(cabList: any[]) {
  if (!cabList || cabList.length === 0) return;
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  const payload = cabList.map((c) => ({
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
    created_at: c.createdAt || new Date().toISOString(),
  }));

  try {
    await fetch(`${url}/rest/v1/cab_activities`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[Supabase-Push] Failed to push CAB activities to Supabase:', err);
  }
}

async function pushSystemStoreToSupabase(keyName: string, data: any) {
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  try {
    await fetch(`${url}/rest/v1/system_cloud_store`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ key: keyName, data, updated_at: new Date().toISOString() }]),
    });
  } catch (err) {
    console.warn(`[Supabase-Push] Failed to push ${keyName} to system_cloud_store:`, err);
  }
}

let lastSupabaseSync = 0;
async function syncWithSupabase(force = false) {
  const now = Date.now();
  if (!force && now - lastSupabaseSync < 3000) {
    return;
  }
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  try {
    const [issuesRes, usersRes, cabRes, storeRes] = await Promise.all([
      fetch(`${url}/rest/v1/issues?select=*`, { headers }).catch(() => null),
      fetch(`${url}/rest/v1/app_users?select=*`, { headers }).catch(() => null),
      fetch(`${url}/rest/v1/cab_activities?select=*`, { headers }).catch(() => null),
      fetch(`${url}/rest/v1/system_cloud_store?select=*`, { headers }).catch(() => null),
    ]);

    let changed = false;

    if (issuesRes && issuesRes.ok) {
      const issuesData = await issuesRes.json();
      if (Array.isArray(issuesData)) {
        const deletedSet = new Set(state.deletedIssueIds || []);
        const validRows = issuesData.filter((row: any) => !deletedSet.has(row.id));

        if (validRows.length === 0) {
          if (state.isSeeded || (state.issues && state.issues.length > 0)) {
            state.issues = [];
            state.isSeeded = true;
            changed = true;
          }
        } else {
          state.issues = validRows.map((row: any) => {
            const existing = (state.issues || []).find((i: any) => i.id === row.id);
            return {
              id: row.id,
              client: row.client || existing?.client || 'عميل',
              clientEmail: row.client_email || existing?.clientEmail || undefined,
              clientPhone: row.client_phone || existing?.clientPhone || undefined,
              tag: row.tag || existing?.tag || 'VIP Client',
              type: row.type || existing?.type || 'تقني / Technical',
              desc: row.desc_text || existing?.desc || '',
              assigned: row.assigned || existing?.assigned || 'فريق الدعم',
              owner: row.owner || existing?.owner || 'محمد علي',
              priority: row.priority || existing?.priority || 'Medium',
              status: row.status || existing?.status || 'Open',
              workTime: row.worktime ?? existing?.workTime ?? 0,
              csat: row.csat ?? existing?.csat ?? 5,
              createdAt: row.created_at || existing?.createdAt || new Date().toISOString(),
              dueDate: row.due_date || existing?.dueDate || new Date().toISOString(),
              timeline: Array.isArray(row.timeline) && row.timeline.length > 0 ? row.timeline : (existing?.timeline || []),
              comments: Array.isArray(row.comments) && row.comments.length > 0 ? row.comments : (existing?.comments || []),
              resolutionReason: existing?.resolutionReason || undefined,
              resolvedAt: existing?.resolvedAt || undefined,
              attachment: row.attachment || existing?.attachment || undefined,
            };
          });
          state.isSeeded = true;
          changed = true;
        }
      }
    }

    if (usersRes && usersRes.ok) {
      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) {
        if (state.isSeeded && Array.isArray(state.users) && state.users.length > 0) {
          // Server state is authoritative: clean up orphaned users deleted locally
          const localUserIds = new Set(state.users.map((u: any) => u.id));
          const orphans = usersData.filter((row: any) => !localUserIds.has(row.id));
          for (const orphan of orphans) {
            deleteUserFromSupabase(orphan.id).catch(() => {});
          }
        } else if (usersData.length > 0) {
          state.users = usersData.map((row: any) => ({
            id: row.id,
            name: row.name,
            username: row.username,
            email: row.email,
            role: row.role,
            department: row.department,
            avatar: row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            permissions: Array.isArray(row.permissions) ? row.permissions : [],
            password: row.password || '123456',
          }));
          changed = true;
        }
      }
    }

    if (cabRes && cabRes.ok) {
      const cabData = await cabRes.json();
      if (Array.isArray(cabData)) {
        if (state.isSeeded && Array.isArray(state.cabActivities) && state.cabActivities.length === 0) {
          if (cabData.length > 0) {
            for (const orphan of cabData) {
              deleteCabActivityFromSupabase(orphan.id).catch(() => {});
            }
          }
        } else if (cabData.length > 0) {
          state.cabActivities = cabData.map((row: any) => ({
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
          changed = true;
        }
      }
    }

    if (storeRes && storeRes.ok) {
      const storeData = await storeRes.json();
      if (Array.isArray(storeData)) {
        for (const item of storeData) {
          if (item.key === 'categories' && Array.isArray(item.data)) {
            if (!state.isSeeded || !state.categories || state.categories.length === 0) {
              state.categories = item.data;
              changed = true;
            }
          } else if (item.key === 'tags' && Array.isArray(item.data)) {
            if (!state.isSeeded || !state.tags || state.tags.length === 0) {
              state.tags = item.data;
              changed = true;
            }
          } else if (item.key === 'canned_responses' && Array.isArray(item.data)) {
            if (!state.isSeeded || !state.cannedResponses || state.cannedResponses.length === 0) {
              state.cannedResponses = item.data;
              changed = true;
            }
          } else if (item.key === 'general_settings' && item.data) {
            if (!state.generalSettings) {
              state.generalSettings = item.data;
              changed = true;
            }
          } else if (item.key === 'sound_settings' && item.data) {
            if (!state.soundSettings) {
              state.soundSettings = item.data;
              changed = true;
            }
          } else if (item.key === 'external_vendors' && Array.isArray(item.data)) {
            if (!state.externalVendors || state.externalVendors.length === 0) {
              state.externalVendors = item.data;
              changed = true;
            }
          } else if (item.key === 'sla_settings' && item.data) {
            if (!state.slaSettings) {
              state.slaSettings = item.data;
              changed = true;
            }
          } else if (item.key === 'audit_logs' && Array.isArray(item.data)) {
            if (!state.auditLogs || state.auditLogs.length === 0) {
              state.auditLogs = item.data;
              changed = true;
            }
          }
        }
      }
    }

    lastSupabaseSync = Date.now();
    if (changed) {
      saveDatabase();
      console.log(`[Supabase-Sync] Synced with Supabase: ${state.issues.length} issues, ${state.users.length} users, ${state.cabActivities.length} CAB`);
    }
  } catch (e) {
    console.warn('[Supabase-Sync] Could not sync with Supabase:', e);
  }
}

async function pushIssueToSupabase(issue: any) {
  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (!url || !key || !url.startsWith('https://')) return;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  const payload = {
    id: issue.id,
    client: issue.client || 'عميل',
    client_email: issue.clientEmail || null,
    client_phone: issue.clientPhone || null,
    tag: issue.tag || 'General',
    type: issue.type || 'تقني / Technical',
    desc_text: issue.desc || '',
    assigned: issue.assigned || 'فريق الدعم',
    owner: issue.owner || 'محمد علي',
    priority: issue.priority || 'Medium',
    status: issue.status || 'Open',
    worktime: issue.workTime || 0,
    csat: issue.csat || 5,
    created_at: issue.createdAt || new Date().toISOString(),
    due_date: issue.dueDate || new Date().toISOString(),
    timeline: issue.timeline || [],
    comments: issue.comments || [],
    attachment: issue.attachment || null,
  };

  try {
    await fetch(`${url}/rest/v1/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify([payload]),
    });
  } catch (err) {
    console.warn('[Supabase-Push] Failed to push issue to Supabase:', err);
  }
}

// Initial sync with Supabase
syncWithSupabase(true).catch(() => {});

// Express app setup
const app = express();
app.use(express.json({ limit: '20mb' }));
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Active team members presence & ticket collision tracking
interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name?: string;
  role?: string;
  department?: string;
  location?: string;
  joinedAt: string;
  lastPing: number;
}
const connectedClients = new Map<WebSocket, ConnectedClient>();

// Ticket Collision Detection State: Map of WebSocket to active ticket view
interface ActiveTicketView {
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string;
  action: 'viewing' | 'editing' | 'working';
  timestamp: number;
}
const activeTicketViews = new Map<WebSocket, ActiveTicketView>();

const getCollisionsMap = (): Record<string, ActiveTicketView[]> => {
  const map: Record<string, ActiveTicketView[]> = {};
  const now = Date.now();
  for (const [ws, view] of activeTicketViews.entries()) {
    if (ws.readyState === WebSocket.OPEN && now - view.timestamp < 60000) {
      if (!map[view.ticketId]) map[view.ticketId] = [];
      map[view.ticketId].push(view);
    } else {
      activeTicketViews.delete(ws);
    }
  }
  return map;
};

const broadcastCollisions = () => {
  broadcast({
    type: 'ticket:collisions_update',
    collisions: getCollisionsMap(),
  });
};

const getActiveUsersList = () => {
  const users: any[] = [];
  const seen = new Set<string>();
  for (const client of connectedClients.values()) {
    if (client.name && !seen.has(client.name)) {
      seen.add(client.name);
      users.push({
        name: client.name,
        role: client.role || 'Member',
        department: client.department || 'الدعم الفني',
        location: client.location || 'فرع رئيسي',
        joinedAt: client.joinedAt,
      });
    }
  }
  return users;
};

// Broadcast to all connected WebSockets
const broadcast = (data: any, excludeWs?: WebSocket) => {
  const message = JSON.stringify(data);
  for (const [ws] of connectedClients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error('[WS] Broadcast send error:', err);
      }
    }
  }
};

const broadcastPresence = () => {
  const activeUsers = getActiveUsersList();
  broadcast({
    type: 'presence:update',
    activeUsers,
    totalConnections: connectedClients.size,
  });
};

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: connectedClients.size,
  });
});

// API: Get complete state
app.get('/api/state', async (req, res) => {
  try {
    await syncWithSupabase(req.query.fresh === '1' || !state.issues || state.issues.length === 0);
  } catch {}
  res.json({
    status: 'ok',
    state,
    activeUsers: getActiveUsersList(),
    totalConnections: connectedClients.size,
    collisions: getCollisionsMap(),
  });
});

app.get('/api/reload-db', (_req, res) => {
  loadDatabase();
  res.json({ status: 'ok', count: state.issues?.length || 0, state });
});

// API: Get active ticket collisions
app.get('/api/collisions', (_req, res) => {
  res.json({
    status: 'ok',
    collisions: getCollisionsMap(),
  });
});

// API: Initialize or seed server state if empty
app.post('/api/init-seed', (req, res) => {
  const initialData = req.body;
  if (!state.isSeeded) {
    if (initialData.issues && Array.isArray(initialData.issues)) {
      state.issues = initialData.issues;
    }
    if (initialData.categories && initialData.categories.length > 0) {
      state.categories = initialData.categories;
    }
    if (initialData.users && initialData.users.length > 0) {
      state.users = initialData.users;
    }
    if (initialData.tags) state.tags = initialData.tags;
    if (initialData.cannedResponses) state.cannedResponses = initialData.cannedResponses;
    if (initialData.generalSettings) state.generalSettings = initialData.generalSettings;
    if (initialData.soundSettings) state.soundSettings = initialData.soundSettings;
    if (initialData.auditLogs) state.auditLogs = initialData.auditLogs;
    if (Array.isArray(initialData.externalVendors) && initialData.externalVendors.length > 0) {
      state.externalVendors = initialData.externalVendors;
    }
    if (initialData.slaSettings) state.slaSettings = initialData.slaSettings;
    if (Array.isArray(initialData.cabActivities) && initialData.cabActivities.length > 0) {
      state.cabActivities = initialData.cabActivities;
    }
    if (initialData.supabaseConfig && !state.supabaseConfig) {
      state.supabaseConfig = initialData.supabaseConfig;
    }
    state.isSeeded = true;
    saveDatabase();
    console.log(`[Database] Seeded with ${state.issues.length} tickets, ${state.cabActivities?.length || 0} CAB activities from client.`);
  } else {
    let changed = false;
    if ((!state.cabActivities || state.cabActivities.length === 0) && Array.isArray(initialData.cabActivities) && initialData.cabActivities.length > 0) {
      state.cabActivities = initialData.cabActivities;
      changed = true;
    }
    if (!state.supabaseConfig && initialData.supabaseConfig) {
      state.supabaseConfig = initialData.supabaseConfig;
      changed = true;
    }
    if (changed) saveDatabase();
  }
  res.json({ status: 'ok', state });
});

// API: Create new ticket
app.post('/api/issues', (req, res) => {
  const { issue, author, location } = req.body;
  if (!issue || !issue.id) {
    res.status(400).json({ error: 'Missing issue payload' });
    return;
  }

  // Ensure unique ID or replace if duplicate
  state.issues = [issue, ...(state.issues || []).filter((i) => i.id !== issue.id)];

  // Add audit log
  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: author || 'فريق العمل',
    action: 'إنشاء تذكرة سحابية',
    details: `تم إنشاء التذكرة ${issue.id} للعميل ${issue.client || ''} عبر السحابة الموحدة`,
  };
  state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];

  saveDatabase();
  pushIssueToSupabase(issue).catch(() => {});

  // Instant Realtime Broadcast to ALL team members across all regions!
  broadcast({
    type: 'ticket:created',
    issue,
    author: author || 'عضو في الفريق',
    location: location || 'فرع آخر',
    auditLog: newLog,
    timestamp: new Date().toISOString(),
  });

  res.json({ status: 'ok', issue, message: 'Ticket created and broadcasted to team' });
});

// API: Update an existing ticket
app.put('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const { issue, actor, changeType, details } = req.body;
  if (!issue) {
    res.status(400).json({ error: 'Missing issue payload' });
    return;
  }

  let found = false;
  state.issues = (state.issues || []).map((i) => {
    if (i.id === id) {
      found = true;
      return { ...i, ...issue };
    }
    return i;
  });

  if (!found) {
    // If not found, add it
    state.issues.unshift(issue);
  }

  let newLog: any = null;
  if (details) {
    newLog = {
      id: `a-${Date.now()}`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      user: actor || 'عضو في الفريق',
      action: changeType || 'تحديث تذكرة سحابياً',
      details: details,
    };
    state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];
  }

  saveDatabase();
  pushIssueToSupabase(issue).catch(() => {});

  // Broadcast to all connected clients
  broadcast({
    type: 'ticket:updated',
    issue,
    actor: actor || 'عضو في الفريق',
    changeType,
    details,
    auditLog: newLog,
    timestamp: new Date().toISOString(),
  });

  res.json({ status: 'ok', issue });
});

// API: Add comment to a ticket
app.post('/api/issues/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comment, actor } = req.body;
  if (!comment) {
    res.status(400).json({ error: 'Missing comment payload' });
    return;
  }

  let updatedIssue: any = null;
  state.issues = (state.issues || []).map((i) => {
    if (i.id === id) {
      const comments = [...(i.comments || []), comment];
      const timeline = [
        {
          id: `t-${Date.now()}`,
          time: 'الآن',
          actor: actor || 'الدعم الفني',
          title: 'رد / تعليق سحابي جديد 💬',
          details: comment.text ? comment.text.substring(0, 60) : '',
          type: 'comment',
        },
        ...(i.timeline || []),
      ];
      updatedIssue = { ...i, comments, timeline };
      return updatedIssue;
    }
    return i;
  });

  if (updatedIssue) {
    saveDatabase();
    broadcast({
      type: 'ticket:comment_added',
      issueId: id,
      issue: updatedIssue,
      comment,
      actor: actor || 'الدعم الفني',
    });
    res.json({ status: 'ok', issue: updatedIssue });
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

// API: Delete a single ticket
app.delete('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const { actor } = req.query;

  if (!state.deletedIssueIds) state.deletedIssueIds = [];
  if (!state.deletedIssueIds.includes(id)) state.deletedIssueIds.push(id);

  state.issues = (state.issues || []).filter((i) => i.id !== id);
  state.isSeeded = true;

  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: (actor as string) || 'مدير النظام',
    action: 'حذف تذكرة',
    details: `تم حذف التذكرة ${id} من الخادم المركزي`,
  };
  state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];

  saveDatabase();
  deleteIssuesFromSupabase([id]).catch(() => {});
  pushSystemStoreToSupabase('deleted_issue_ids', state.deletedIssueIds).catch(() => {});

  broadcast({
    type: 'ticket:deleted',
    issueId: id,
    actor: actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'Ticket deleted' });
});

// API: Bulk Delete Tickets
app.delete('/api/issues/bulk', async (req, res) => {
  const { issueIds, actor } = req.body || {};
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    res.status(400).json({ error: 'issueIds must be a non-empty array' });
    return;
  }

  if (!state.deletedIssueIds) state.deletedIssueIds = [];
  issueIds.forEach((id: string) => {
    if (!state.deletedIssueIds!.includes(id)) state.deletedIssueIds!.push(id);
  });

  const idsSet = new Set(issueIds);
  state.issues = (state.issues || []).filter((i) => !idsSet.has(i.id));
  state.isSeeded = true;

  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: (actor as string) || 'مدير النظام',
    action: 'حذف جماعي للتذاكر',
    details: `تم حذف ${issueIds.length} تذكرة نهائياً من الخادم والشبكة`,
  };
  state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];

  saveDatabase();
  deleteIssuesFromSupabase(issueIds).catch(() => {});
  pushSystemStoreToSupabase('deleted_issue_ids', state.deletedIssueIds).catch(() => {});

  broadcast({
    type: 'state:synced',
    state,
    actor: actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: `${issueIds.length} tickets deleted successfully` });
});

// API: Delete ALL Tickets (Complete Reset / Clear)
app.delete('/api/issues/all', async (req, res) => {
  const { actor } = req.body || {};
  const previousCount = state.issues?.length || 0;

  if (!state.deletedIssueIds) state.deletedIssueIds = [];
  (state.issues || []).forEach((i: any) => {
    if (i.id && !state.deletedIssueIds!.includes(i.id)) state.deletedIssueIds!.push(i.id);
  });

  state.issues = [];
  state.isSeeded = true;

  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: (actor as string) || 'مدير النظام',
    action: 'تفريغ كافة التذاكر',
    details: `تم مسح ووايب جميع التذاكر (${previousCount} تذكرة) نهائياً`,
  };
  state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];

  saveDatabase();
  pushSystemStoreToSupabase('deleted_issue_ids', state.deletedIssueIds).catch(() => {});

  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (url && key && url.startsWith('https://')) {
    try {
      await fetch(`${url}/rest/v1/issues?id=neq.dummy_clean_id`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
    } catch (err) {
      console.warn('[Supabase-Wipe] Delete all error:', err);
    }
  }

  broadcast({
    type: 'state:synced',
    state,
    actor: actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'All tickets wiped successfully' });
});

// API: Complete Production / Factory Reset (Wipes all test data from memory, disk and Supabase)
app.post('/api/system/reset-production', async (req, res) => {
  const { actor } = req.body || {};
  console.log(`[Production-Reset] Initiated by ${actor || 'مدير النظام'}`);

  state.issues = [];
  state.deletedIssueIds = [];
  state.cabActivities = [];
  state.isSeeded = true;

  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: (actor as string) || 'مدير النظام',
    action: 'تهيئة الإنتاج الفعلي 🚀',
    details: 'تم تفريغ كافة تذاكر وبيانات الاختبار وتهيئة المنظومة كلياً للإنتاج الفعلي (0 تذاكر - Production Ready)',
  };
  state.auditLogs = [newLog];

  saveDatabase();

  const url = (state.supabaseConfig?.url || DEFAULT_SUPABASE_CONFIG.url || '').replace(/\/+$/, '');
  const key = state.supabaseConfig?.key || DEFAULT_SUPABASE_CONFIG.key;
  if (url && key && url.startsWith('https://')) {
    try {
      // Wipe all issues from Supabase table
      await fetch(`${url}/rest/v1/issues?id=neq.dummy_clean_id_zero`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      console.log('[Supabase-Wipe] Successfully cleared issues table');
    } catch (err) {
      console.warn('[Supabase-Wipe] Delete issues error:', err);
    }

    try {
      // Wipe CAB activities from Supabase table if exists
      await fetch(`${url}/rest/v1/cab_activities?id=neq.dummy_clean_id_zero`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
    } catch {}

    pushSystemStoreToSupabase('deleted_issue_ids', []).catch(() => {});
  }

  broadcast({
    type: 'system:reset_production',
    actor: actor || 'مدير النظام',
  });

  broadcast({
    type: 'state:synced',
    state,
    actor: actor || 'مدير النظام',
  });

  res.json({
    status: 'ok',
    message: 'System successfully reset to production mode with 0 test tickets.',
  });
});

// API: Bulk sync / full replace
app.post('/api/sync-all', (req, res) => {
  const payload = req.body;
  state.isSeeded = true;

  if (Array.isArray(payload.issues)) {
    const oldIds = (state.issues || []).map((i) => i.id);
    const newIds = new Set(payload.issues.map((i: any) => i.id));
    const removedIds = oldIds.filter((id) => !newIds.has(id));

    state.issues = payload.issues;

    if (removedIds.length > 0) {
      deleteIssuesFromSupabase(removedIds).catch(() => {});
    }
  }

  if (Array.isArray(payload.users)) {
    const oldUserIds = (state.users || []).map((u) => u.id);
    const newUserIds = new Set(payload.users.map((u: any) => u.id));
    const removedUserIds = oldUserIds.filter((id) => !newUserIds.has(id));

    state.users = payload.users;
    for (const uid of removedUserIds) {
      deleteUserFromSupabase(uid).catch(() => {});
    }
    if (payload.users.length > 0) {
      pushUsersToSupabase(payload.users).catch(() => {});
    }
  }

  if (Array.isArray(payload.categories)) {
    state.categories = payload.categories;
    pushSystemStoreToSupabase('categories', payload.categories).catch(() => {});
  }

  if (Array.isArray(payload.tags)) {
    state.tags = payload.tags;
    pushSystemStoreToSupabase('tags', payload.tags).catch(() => {});
  }

  if (Array.isArray(payload.cannedResponses)) {
    state.cannedResponses = payload.cannedResponses;
    pushSystemStoreToSupabase('canned_responses', payload.cannedResponses).catch(() => {});
  }

  if (payload.generalSettings) {
    state.generalSettings = payload.generalSettings;
    pushSystemStoreToSupabase('general_settings', payload.generalSettings).catch(() => {});
  }

  if (payload.soundSettings) {
    state.soundSettings = payload.soundSettings;
    pushSystemStoreToSupabase('sound_settings', payload.soundSettings).catch(() => {});
  }

  if (Array.isArray(payload.auditLogs)) {
    state.auditLogs = payload.auditLogs;
    pushSystemStoreToSupabase('audit_logs', payload.auditLogs.slice(0, 100)).catch(() => {});
  }

  if (Array.isArray(payload.externalVendors)) {
    state.externalVendors = payload.externalVendors;
    pushSystemStoreToSupabase('external_vendors', payload.externalVendors).catch(() => {});
  }

  if (payload.slaSettings) {
    state.slaSettings = payload.slaSettings;
    pushSystemStoreToSupabase('sla_settings', payload.slaSettings).catch(() => {});
  }

  if (Array.isArray(payload.cabActivities)) {
    const oldCabIds = (state.cabActivities || []).map((c) => c.id);
    const newCabIds = new Set(payload.cabActivities.map((c: any) => c.id));
    const removedCabIds = oldCabIds.filter((id) => !newCabIds.has(id));

    state.cabActivities = payload.cabActivities;
    for (const cid of removedCabIds) {
      deleteCabActivityFromSupabase(cid).catch(() => {});
    }
    if (payload.cabActivities.length > 0) {
      pushCabActivitiesToSupabase(payload.cabActivities).catch(() => {});
    }
  }

  if (payload.supabaseConfig) state.supabaseConfig = payload.supabaseConfig;

  saveDatabase();

  broadcast({
    type: 'state:synced',
    state,
    actor: payload.actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'All data synchronized across all devices' });
});

// API: External Vendors CRUD
app.get('/api/external-vendors', (_req, res) => {
  res.json({ status: 'ok', externalVendors: state.externalVendors || [] });
});

app.post('/api/external-vendors', (req, res) => {
  const vendor = req.body;
  if (!vendor || !vendor.name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const newVendor = {
    id: vendor.id || `ext-${Date.now()}`,
    name: vendor.name.trim(),
    company: (vendor.company || '').trim(),
    role: vendor.role || 'مورد معتمد (Vendor)',
    phone: (vendor.phone || '').trim(),
    email: (vendor.email || '').trim(),
    notes: (vendor.notes || '').trim(),
  };

  state.externalVendors = [...(state.externalVendors || []), newVendor];
  saveDatabase();

  broadcast({
    type: 'external_vendors:updated',
    externalVendors: state.externalVendors,
    vendor: newVendor,
    action: 'add',
  });

  res.json({ status: 'ok', vendor: newVendor, externalVendors: state.externalVendors });
});

app.put('/api/external-vendors/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  state.externalVendors = (state.externalVendors || []).map((v) => (v.id === id ? { ...v, ...updates } : v));
  saveDatabase();

  broadcast({
    type: 'external_vendors:updated',
    externalVendors: state.externalVendors,
    action: 'update',
  });

  res.json({ status: 'ok', externalVendors: state.externalVendors });
});

app.delete('/api/external-vendors/:id', (req, res) => {
  const { id } = req.params;
  state.externalVendors = (state.externalVendors || []).filter((v) => v.id !== id);
  saveDatabase();

  broadcast({
    type: 'external_vendors:updated',
    externalVendors: state.externalVendors,
    action: 'delete',
  });

  res.json({ status: 'ok', externalVendors: state.externalVendors });
});

// API: SLA Settings
app.get('/api/sla-settings', (_req, res) => {
  res.json({ status: 'ok', slaSettings: state.slaSettings || DEFAULT_SLA_SETTINGS });
});

app.post('/api/sla-settings', (req, res) => {
  const newSettings = req.body;
  state.slaSettings = { ...DEFAULT_SLA_SETTINGS, ...newSettings };
  saveDatabase();

  broadcast({
    type: 'sla_settings:updated',
    slaSettings: state.slaSettings,
  });

  res.json({ status: 'ok', slaSettings: state.slaSettings });
});

// API: CAB Activities CRUD
app.get('/api/cab-activities', (_req, res) => {
  res.json({ status: 'ok', cabActivities: state.cabActivities || [] });
});

app.post('/api/cab-activities', (req, res) => {
  const { activity, author } = req.body;
  if (!activity || !activity.id) {
    res.status(400).json({ error: 'Missing CAB activity payload' });
    return;
  }

  state.cabActivities = [activity, ...(state.cabActivities || []).filter((a) => a.id !== activity.id)];
  saveDatabase();

  broadcast({
    type: 'cab:created',
    activity,
    author: author || 'فريق العمل',
    timestamp: new Date().toISOString(),
  });

  res.json({ status: 'ok', activity, cabActivities: state.cabActivities });
});

app.put('/api/cab-activities/:id', (req, res) => {
  const { id } = req.params;
  const { activity, author, details } = req.body;
  if (!activity) {
    res.status(400).json({ error: 'Missing CAB activity payload' });
    return;
  }

  let found = false;
  state.cabActivities = (state.cabActivities || []).map((a) => {
    if (a.id === id) {
      found = true;
      return { ...a, ...activity };
    }
    return a;
  });

  if (!found) {
    state.cabActivities.unshift(activity);
  }

  saveDatabase();

  broadcast({
    type: 'cab:updated',
    activity,
    author: author || 'فريق العمل',
    details,
    timestamp: new Date().toISOString(),
  });

  res.json({ status: 'ok', activity, cabActivities: state.cabActivities });
});

app.delete('/api/cab-activities/:id', (req, res) => {
  const { id } = req.params;
  const { author } = req.query;

  state.cabActivities = (state.cabActivities || []).filter((a) => a.id !== id);
  saveDatabase();

  broadcast({
    type: 'cab:deleted',
    activityId: id,
    author: author || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'CAB activity deleted', cabActivities: state.cabActivities });
});

// API: Supabase Configuration CRUD & Multi-browser Persistence
app.get('/api/supabase-config', (_req, res) => {
  res.json({ status: 'ok', supabaseConfig: state.supabaseConfig || null });
});

app.post('/api/supabase-config', (req, res) => {
  const config = req.body;
  if (config) {
    state.supabaseConfig = config;
    saveDatabase();
    broadcast({
      type: 'supabase:config_updated',
      supabaseConfig: state.supabaseConfig,
    });
    console.log(`[Database] Supabase configuration updated & persisted for all browsers/devices (${config.url}).`);
  }
  res.json({ status: 'ok', supabaseConfig: state.supabaseConfig });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server on /ws
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const parsedUrl = new URL(request.url || '', `http://${host}`);
    if (parsedUrl.pathname === '/ws' || parsedUrl.pathname === '/ws/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (err) {
    console.error('[WS Upgrade Error]', err);
  }
});

wss.on('connection', (ws, request) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const clientInfo: ConnectedClient = {
    ws,
    id: clientId,
    joinedAt: new Date().toLocaleTimeString('ar-EG'),
    lastPing: Date.now(),
  };
  connectedClients.set(ws, clientInfo);

  // Send initial full state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'init',
      state,
      activeUsers: getActiveUsersList(),
      totalConnections: connectedClients.size,
      collisions: getCollisionsMap(),
    })
  );

  broadcastPresence();

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      clientInfo.lastPing = Date.now();

      switch (data.type) {
        case 'presence:join': {
          clientInfo.name = data.user?.name;
          clientInfo.role = data.user?.role;
          clientInfo.department = data.user?.department;
          clientInfo.location = data.user?.location || 'فرع متصل';
          broadcastPresence();
          break;
        }

        case 'ticket:create': {
          const { issue, author, location } = data;
          if (issue && issue.id) {
            state.issues = [issue, ...(state.issues || []).filter((i) => i.id !== issue.id)];
            saveDatabase();
            // Broadcast to all other clients immediately!
            broadcast(
              {
                type: 'ticket:created',
                issue,
                author: author || clientInfo.name || 'عضو في الفريق',
                location: location || clientInfo.location || 'فرع آخر',
                timestamp: new Date().toISOString(),
              },
              ws
            );
          }
          break;
        }

        case 'ticket:update': {
          const { issue, actor, changeType, details } = data;
          if (issue && issue.id) {
            state.issues = (state.issues || []).map((i) => (i.id === issue.id ? { ...i, ...issue } : i));
            saveDatabase();
            broadcast(
              {
                type: 'ticket:updated',
                issue,
                actor: actor || clientInfo.name || 'عضو في الفريق',
                changeType,
                details,
                timestamp: new Date().toISOString(),
              },
              ws
            );
          }
          break;
        }

        case 'ticket:comment': {
          const { issueId, comment, actor } = data;
          state.issues = (state.issues || []).map((i) => {
            if (i.id === issueId) {
              const updated = {
                ...i,
                comments: [...(i.comments || []), comment],
              };
              return updated;
            }
            return i;
          });
          saveDatabase();
          broadcast(
            {
              type: 'ticket:comment_added',
              issueId,
              comment,
              actor: actor || clientInfo.name || 'عضو في الفريق',
            },
            ws
          );
          break;
        }

        case 'cab:create': {
          const { activity, author } = data;
          if (activity && activity.id) {
            state.cabActivities = [activity, ...(state.cabActivities || []).filter((a) => a.id !== activity.id)];
            saveDatabase();
            broadcast(
              {
                type: 'cab:created',
                activity,
                author: author || clientInfo.name || 'عضو في الفريق',
                timestamp: new Date().toISOString(),
              },
              ws
            );
          }
          break;
        }

        case 'cab:update': {
          const { activity, author, details } = data;
          if (activity && activity.id) {
            state.cabActivities = (state.cabActivities || []).map((a) => (a.id === activity.id ? { ...a, ...activity } : a));
            saveDatabase();
            broadcast(
              {
                type: 'cab:updated',
                activity,
                author: author || clientInfo.name || 'عضو في الفريق',
                details,
                timestamp: new Date().toISOString(),
              },
              ws
            );
          }
          break;
        }

        case 'cab:delete': {
          const { activityId, author } = data;
          if (activityId) {
            state.cabActivities = (state.cabActivities || []).filter((a) => a.id !== activityId);
            saveDatabase();
            broadcast(
              {
                type: 'cab:deleted',
                activityId,
                author: author || clientInfo.name || 'مدير النظام',
              },
              ws
            );
          }
          break;
        }

        case 'ticket:delete': {
          const { issueId, actor } = data;
          if (issueId) {
            state.issues = (state.issues || []).filter((i) => i.id !== issueId);
            if (!state.deletedIssueIds) state.deletedIssueIds = [];
            if (!state.deletedIssueIds.includes(issueId)) state.deletedIssueIds.push(issueId);
            saveDatabase();
            deleteIssuesFromSupabase([issueId]).catch(() => {});
            broadcast(
              {
                type: 'ticket:deleted',
                issueId,
                actor: actor || clientInfo.name || 'مدير النظام',
              },
              ws
            );
          }
          break;
        }

        case 'ticket:bulk_delete': {
          const { issueIds, actor } = data;
          if (Array.isArray(issueIds) && issueIds.length > 0) {
            const idsSet = new Set(issueIds);
            state.issues = (state.issues || []).filter((i) => !idsSet.has(i.id));
            if (!state.deletedIssueIds) state.deletedIssueIds = [];
            issueIds.forEach((id: string) => {
              if (!state.deletedIssueIds!.includes(id)) state.deletedIssueIds!.push(id);
            });
            saveDatabase();
            deleteIssuesFromSupabase(issueIds).catch(() => {});
            broadcast(
              {
                type: 'ticket:bulk_deleted',
                issueIds,
                actor: actor || clientInfo.name || 'مدير النظام',
              },
              ws
            );
          }
          break;
        }

        case 'tickets:clear': {
          const { actor } = data;
          state.issues = [];
          saveDatabase();
          broadcast(
            {
              type: 'tickets:cleared',
              actor: actor || clientInfo.name || 'مدير النظام',
            },
            ws
          );
          break;
        }

        case 'system:reset_production': {
          const { actor } = data;
          state.issues = [];
          state.deletedIssueIds = [];
          state.cabActivities = [];
          state.isSeeded = true;
          saveDatabase();
          broadcast(
            {
              type: 'system:reset_production',
              actor: actor || clientInfo.name || 'مدير النظام',
            },
            ws
          );
          broadcast({
            type: 'state:synced',
            state,
            actor: actor || clientInfo.name || 'مدير النظام',
          });
          break;
        }

        case 'supabase:config_update': {
          const { config } = data;
          if (config) {
            state.supabaseConfig = config;
            saveDatabase();
            broadcast(
              {
                type: 'supabase:config_updated',
                supabaseConfig: state.supabaseConfig,
              },
              ws
            );
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        }

        case 'ticket:focus': {
          const { ticketId, action, user } = data;
          if (ticketId) {
            activeTicketViews.set(ws, {
              ticketId,
              userId: user?.id || clientInfo.id,
              userName: user?.name || clientInfo.name || 'موظف في الفريق',
              userRole: user?.role || clientInfo.role || 'Agent',
              userAvatar: user?.avatar || 'م',
              action: action || 'viewing',
              timestamp: Date.now(),
            });
            broadcastCollisions();
          }
          break;
        }

        case 'ticket:blur': {
          activeTicketViews.delete(ws);
          broadcastCollisions();
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[WS] Message processing error:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    activeTicketViews.delete(ws);
    broadcastPresence();
    broadcastCollisions();
  });

  ws.on('error', (err) => {
    console.error('[WS] Connection error:', err);
    connectedClients.delete(ws);
    activeTicketViews.delete(ws);
    broadcastPresence();
    broadcastCollisions();
  });
});

// Heartbeat interval to clean up stale connections
setInterval(() => {
  const now = Date.now();
  for (const [ws, info] of connectedClients) {
    if (now - info.lastPing > 60000) {
      ws.terminate();
      connectedClients.delete(ws);
    }
  }
}, 30000);

// Setup frontend serving (Vite in development, static in production)
async function startServer() {
  try {
    await syncWithSupabase(true);
  } catch (err) {
    console.warn('[Startup] Supabase initial sync warning:', err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 [Full-Stack Server] Real-Time Cloud Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 [Real-Time] Multi-region WebSockets active at ws://localhost:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});
