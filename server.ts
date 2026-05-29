import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_FILE = path.join(process.cwd(), 'db.json');

// المناطق الجديدة بدون أخطاء حمراء
const initialRegions: any[] = [
  { id: 'maghazi', nameAr: 'المغازي', nameEn: 'Al-Maghazi' },
  { id: 'bureij', nameAr: 'البريج', nameEn: 'Al-Bureij' },
  { id: 'deir_balah', nameAr: 'دير البلح', nameEn: 'Deir al-Balah' },
  { id: 'zawayda', nameAr: 'الزوايدة', nameEn: 'Al-Zawayda' },
  { id: 'nuseirat', nameAr: 'النصيرات', nameEn: 'Al-Nuseirat' },
  { id: 'gaza', nameAr: 'غزة', nameEn: 'Gaza' },
  { id: 'khanyounis', nameAr: 'خانيونس', nameEn: 'Khan Younis' },
];

let dbCache: any = { volunteers: [], activities: [], messages: [], excelLogs: [], settings: null };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } else { saveDb(); }
  } catch (err) { console.error('Error loading database:', err); }
}

function saveDb() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2)); }
  catch (err) { console.error('Error saving database:', err); }
}

loadDb();

// نظام تسجيل الدخول المضمون
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = crypto.randomBytes(20).toString('hex');
    res.json({ token, user: { username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
});

const verifyAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) { next(); } 
  else { res.status(401).json({ error: 'يرجى تسجيل الدخول' }); }
};

// الروابط الأساسية
app.get('/api/regions', (req, res) => res.json(initialRegions));

app.get('/api/stats', (req, res) => {
  const v = dbCache.volunteers || [];
  const a = dbCache.activities || [];
  const byReg: any = { maghazi:0, bureij:0, deir_balah:0, zawayda:0, nuseirat:0, gaza:0, khanyounis:0 };
  v.forEach((vol: any) => { if(byReg[vol.regionId] !== undefined) byReg[vol.regionId]++; });
  res.json({ volunteersCount: v.length, activitiesCount: a.length, childrenCount: a.reduce((s:any, act:any) => s+(act.childrenCount||0), 0), byRegion: byReg });
});

app.get('/api/volunteers', (req, res) => res.json(dbCache.volunteers));

app.post('/api/volunteers', verifyAuth, (req, res) => {
  const data = req.body;
  const newVol = { id: data.nationalId, ...data, joinDate: data.joinDate || new Date().toISOString().split('T')[0] };
  dbCache.volunteers.push(newVol);
  saveDb();
  res.status(201).json(newVol);
});

app.put('/api/volunteers/:id', verifyAuth, (req, res) => {
  const index = dbCache.volunteers.findIndex((v:any) => v.id === req.params.id);
  if (index !== -1) { dbCache.volunteers[index] = { ...dbCache.volunteers[index], ...req.body }; saveDb(); res.json(dbCache.volunteers[index]); }
  else { res.status(404).send(); }
});

app.delete('/api/volunteers/:id', verifyAuth, (req, res) => {
  dbCache.volunteers = dbCache.volunteers.filter((v:any) => v.id !== req.params.id);
  saveDb();
  res.json({ message: 'OK' });
});

app.get('/api/activities', (req, res) => res.json(dbCache.activities));
app.post('/api/activities', verifyAuth, (req, res) => {
  const act = { id: `act_${Date.now()}`, ...req.body };
  dbCache.activities.unshift(act);
  saveDb();
  res.status(201).json(act);
});

app.get('/api/settings', (req, res) => res.json(dbCache.settings || { addressAr: "غزة" }));
app.put('/api/settings', verifyAuth, (req, res) => {
  dbCache.settings = { ...dbCache.settings, ...req.body };
  saveDb();
  res.json(dbCache.settings);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));
}
startServer();