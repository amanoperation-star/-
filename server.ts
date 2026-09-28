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
  supabaseConfig: null,
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
      if (!Array.isArray(state.externalVendors) || state.externalVendors.length === 0) {
        state.externalVendors = DEFAULT_EXTERNAL_VENDORS;
      }
      if (!state.slaSettings) {
        state.slaSettings = DEFAULT_SLA_SETTINGS;
      }
      if (parsed.supabaseConfig) {
        state.supabaseConfig = parsed.supabaseConfig;
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
app.get('/api/state', (req, res) => {
  if (req.query.fresh === '1' || !state.issues || state.issues.length === 0) {
    loadDatabase();
  }
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
  if (!state.issues || state.issues.length === 0) {
    if (initialData.issues && initialData.issues.length > 0) {
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

// API: Delete a ticket
app.delete('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const { actor } = req.query;

  state.issues = (state.issues || []).filter((i) => i.id !== id);

  const newLog = {
    id: `a-${Date.now()}`,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    user: (actor as string) || 'مدير النظام',
    action: 'حذف تذكرة',
    details: `تم حذف التذكرة ${id} من الخادم المركزي`,
  };
  state.auditLogs = [newLog, ...(state.auditLogs || []).slice(0, 99)];

  saveDatabase();

  broadcast({
    type: 'ticket:deleted',
    issueId: id,
    actor: actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'Ticket deleted' });
});

// API: Bulk sync / full replace
app.post('/api/sync-all', (req, res) => {
  const payload = req.body;
  if (Array.isArray(payload.issues)) state.issues = payload.issues;
  if (Array.isArray(payload.categories)) state.categories = payload.categories;
  if (Array.isArray(payload.users)) state.users = payload.users;
  if (Array.isArray(payload.tags)) state.tags = payload.tags;
  if (Array.isArray(payload.cannedResponses)) state.cannedResponses = payload.cannedResponses;
  if (payload.generalSettings) state.generalSettings = payload.generalSettings;
  if (payload.soundSettings) state.soundSettings = payload.soundSettings;
  if (Array.isArray(payload.auditLogs)) state.auditLogs = payload.auditLogs;
  if (Array.isArray(payload.externalVendors)) state.externalVendors = payload.externalVendors;
  if (payload.slaSettings) state.slaSettings = payload.slaSettings;
  if (Array.isArray(payload.cabActivities)) state.cabActivities = payload.cabActivities;
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
