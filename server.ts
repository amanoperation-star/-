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
} = {
  issues: [],
  categories: [],
  users: [],
  tags: [],
  cannedResponses: [],
  soundSettings: null,
  generalSettings: null,
  auditLogs: [],
};

// Load initial database from file if exists
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      console.log(`[Database] Loaded ${state.issues?.length || 0} tickets from disk.`);
    }
  } catch (err) {
    console.error('[Database] Failed to read database file:', err);
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

// Active team members presence tracking
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
app.get('/api/state', (_req, res) => {
  res.json({
    status: 'ok',
    state,
    activeUsers: getActiveUsersList(),
    totalConnections: connectedClients.size,
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
    saveDatabase();
    console.log(`[Database] Seeded with ${state.issues.length} tickets from client.`);
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

  saveDatabase();

  broadcast({
    type: 'state:synced',
    state,
    actor: payload.actor || 'مدير النظام',
  });

  res.json({ status: 'ok', message: 'All data synchronized across all devices' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server on /ws
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
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

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
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
    broadcastPresence();
  });

  ws.on('error', (err) => {
    console.error('[WS] Connection error:', err);
    connectedClients.delete(ws);
    broadcastPresence();
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
