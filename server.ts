import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Volunteer, Activity, ContactMessage, ExcelLog } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

const JWT_SECRET = 'change-this-secret';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const DB_FILE = path.join(process.cwd(), 'db.json');

/* ---------------- TYPES ---------------- */

type User = {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
};

interface DbSchema {
  volunteers: Volunteer[];
  activities: Activity[];
  messages: ContactMessage[];
  excelLogs: ExcelLog[];
  users: User[];
}

let dbCache: DbSchema = {
  volunteers: [],
  activities: [],
  messages: [],
  excelLogs: [],
  users: []
};

/* ---------------- HASH ---------------- */

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/* ---------------- DB ---------------- */

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }

    // ✅ ضمان وجود users دائماً
    if (!dbCache.users || dbCache.users.length === 0) {
      dbCache.users = [
        {
          id: '1',
          username: 'majed222',
          password: hashPassword('24682468'),
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      saveDb();
    }

  } catch (e) {
    console.log('DB load error');
  }
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2));
}

loadDb();

/* ---------------- JWT ---------------- */

function createToken(user: User) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/* ---------------- AUTH MIDDLEWARE ---------------- */

function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ---------------- AUTH APIs ---------------- */

/* REGISTER */
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const exists = dbCache.users.find(u => u.username === username);

  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser: User = {
    id: Date.now().toString(),
    username,
    password: hashPassword(password),
    role: 'user',
    createdAt: new Date().toISOString()
  };

  dbCache.users.push(newUser);
  saveDb();

  res.json({ message: 'User created' });
});

/* LOGIN */
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = dbCache.users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = createToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

/* LOGOUT (frontend deletes token) */
app.post('/auth/logout', auth, (req, res) => {
  res.json({ message: 'Logged out' });
});

/* ---------------- USERS ADMIN ---------------- */

app.get('/users', auth, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(dbCache.users);
});

app.delete('/users/:id', auth, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  dbCache.users = dbCache.users.filter(u => u.id !== req.params.id);
  saveDb();

  res.json({ message: 'User deleted' });
});

/* ---------------- VOLUNTEERS ---------------- */

app.get('/api/volunteers', (req, res) => {
  res.json(dbCache.volunteers);
});

app.post('/api/volunteers', auth, (req, res) => {
  const { fullName, nationalId } = req.body;

  const id = String(nationalId).trim();

  const exists = dbCache.volunteers.find(v => v.nationalId === id);

  if (exists) {
    return res.status(400).json({ error: 'ID exists' });
  }

  const v = {
    id,
    fullName,
    nationalId: id,
    birthYear: 2000,
    phone: '',
    address: '',
    gender: 'male',
    joinDate: new Date().toISOString(),
    image: '',
    status: 'active',
    story: '',
    regionId: 'maghazi'
  };

  dbCache.volunteers.push(v);
  saveDb();

  res.json(v);
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();