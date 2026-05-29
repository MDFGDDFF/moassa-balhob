import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { RegionId, Volunteer, Activity, ContactMessage, ExcelLog, AppStats } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_FILE = path.join(process.cwd(), 'db.json');

/* ---------------- INITIAL DATA ---------------- */

const initialVolunteers: Volunteer[] = [
  {
    id: '900213456',
    fullName: 'يوسف أحمد محمد الكرد',
    nationalId: '900213456',
    birthYear: 1998,
    phone: '+970599123456',
    address: 'وسط المخيم، بجوار المسجد الكبير',
    gender: 'male',
    joinDate: '2024-01-15',
    image: '',
    status: 'active',
    story: '',
    regionId: 'maghazi'
  }
];

const initialActivities: Activity[] = [];
const initialMessages: ContactMessage[] = [];
const initialLogs: ExcelLog[] = [];

interface DbSchema {
  volunteers: Volunteer[];
  activities: Activity[];
  messages: ContactMessage[];
  excelLogs: ExcelLog[];
  settings?: any;
}

let dbCache: DbSchema = {
  volunteers: [],
  activities: [],
  messages: [],
  excelLogs: []
};

/* ---------------- PASSWORD ---------------- */

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const adminUsers = [
  { username: 'majed222', passwordHash: hashPassword('24682468'), role: 'Admin' },
];

/* ---------------- DB LOAD / SAVE ---------------- */

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } else {
      dbCache = {
        volunteers: initialVolunteers,
        activities: initialActivities,
        messages: initialMessages,
        excelLogs: initialLogs
      };
      saveDb();
    }
  } catch (e) {
    console.log('DB load error fallback');
  }
}

/* ✅ FIXED saveDb (IMPORTANT) */
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    console.log('DB saved successfully');
  } catch (error) {
    console.error('DB save error', error);
  }
}

loadDb();

/* ---------------- AUTH ---------------- */

function generateToken(username: string, role: string): string {
  const data = `${username}:${role}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', 'secret').update(data).digest('hex');
  return Buffer.from(`${username}:${role}:${hmac}`).toString('base64');
}

function verifyAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = Buffer.from(auth.replace('Bearer ', ''), 'base64').toString();
    const [username, role] = decoded.split(':');
    req.user = { username, role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ---------------- VOLUNTEERS ---------------- */

app.get('/api/volunteers', (req, res) => {
  res.json(dbCache.volunteers);
});

/* ✅ FIX: normalize ID */
app.post('/api/volunteers', verifyAuth, (req, res) => {
  const { fullName, nationalId } = req.body;

  if (!fullName || !nationalId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const cleanId = String(nationalId).trim();

  const exists = dbCache.volunteers.some(
    v => String(v.nationalId).trim() === cleanId
  );

  if (exists) {
    return res.status(400).json({ error: 'ID already exists' });
  }

  const newVolunteer: Volunteer = {
    id: cleanId,
    fullName,
    nationalId: cleanId,
    birthYear: 2000,
    phone: '',
    address: '',
    gender: 'male',
    joinDate: new Date().toISOString().split('T')[0],
    image: '',
    status: 'active',
    story: '',
    regionId: 'maghazi'
  };

  dbCache.volunteers.push(newVolunteer);
  saveDb();

  res.status(201).json(newVolunteer);
});

/* ✅ FIX DELETE */
app.delete('/api/volunteers/:id', verifyAuth, (req, res) => {
  const id = String(req.params.id).trim();

  dbCache.volunteers = dbCache.volunteers.filter(
    v => String(v.id).trim() !== id
  );

  saveDb();

  res.json({ message: 'Deleted successfully' });
});

/* ---------------- UPDATE ---------------- */

app.put('/api/volunteers/:id', verifyAuth, (req, res) => {
  const id = String(req.params.id).trim();

  const index = dbCache.volunteers.findIndex(
    v => String(v.id).trim() === id
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  const updated = {
    ...dbCache.volunteers[index],
    ...req.body
  };

  dbCache.volunteers[index] = updated;
  saveDb();

  res.json(updated);
});

/* ---------------- ACTIVITIES ---------------- */

app.get('/api/activities', (req, res) => {
  res.json(dbCache.activities);
});

app.post('/api/activities', verifyAuth, (req, res) => {
  const act: Activity = {
    id: `act_${Date.now()}`,
    ...req.body
  };

  dbCache.activities.push(act);
  saveDb();

  res.json(act);
});

/* ---------------- START SERVER ---------------- */

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();