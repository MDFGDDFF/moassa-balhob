import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Region, RegionId, Volunteer, Activity, ContactMessage, ExcelLog, AppStats } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Maximum payload size for base64 images upload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial seeded data
const initialRegions: Region[] = [
  { id: 'maghazi', nameAr: 'المغازي', nameEn: 'Al-Maghazi' },
  { id: 'bureij', nameAr: 'البريج', nameEn: 'Al-Bureij' },
  { id: 'deir_balah', nameAr: 'دير البلح', nameEn: 'Deir al-Balah' },
  { id: 'zawayda', nameAr: 'الزوايدة', nameEn: 'Al-Zawayda' },
  { id: 'nuseirat', nameAr: 'النصيرات', nameEn: 'Al-Nuseirat' },
];

let dbCache: {
  volunteers: Volunteer[];
  activities: Activity[];
  messages: ContactMessage[];
  excelLogs: ExcelLog[];
  settings: any;
} = {
  volunteers: [],
  activities: [],
  messages: [],
  excelLogs: [],
  settings: null
};

// Database persistence functions
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2));
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

loadDb();

// Authentication middleware
const verifyAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    next();
  } else {
    res.status(401).json({ error: 'غير مصرح لك بالوصول، يرجى تسجيل الدخول أولاً' });
  }
};

// --- API ENDPOINTS ---

app.get('/api/regions', (req, res) => {
  res.json(initialRegions);
});

app.get('/api/stats', (req, res) => {
  const volunteers = dbCache.volunteers || [];
  const activities = dbCache.activities || [];

  const volunteersCount = volunteers.length;
  const activitiesCount = activities.length;
  const childrenCount = activities.reduce((sum, act) => sum + (act.childrenCount || 0), 0);

  const byRegion: Record<RegionId, number> = {
    maghazi: 0,
    bureij: 0,
    deir_balah: 0,
    zawayda: 0,
    nuseirat: 0
  };

  volunteers.forEach(vol => {
    if (byRegion[vol.regionId] !== undefined) {
      byRegion[vol.regionId]++;
    }
  });

  const stats: AppStats = {
    volunteersCount,
    activitiesCount,
    childrenCount,
    byRegion
  };

  res.json(stats);
});

// 2. Volunteers CRUD
app.get('/api/volunteers', (req, res) => {
  res.json(dbCache.volunteers);
});

app.post('/api/volunteers', verifyAuth, (req, res) => {
  const { fullName, nationalId, birthYear, phone, address, gender, joinDate, image, status, story, regionId } = req.body;

  if (!fullName || !nationalId || !regionId) {
    return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية: الاسم بالكامل، رقم الهوية والمنطقة' });
  }

  // تم تعطيل فحص تكرار الهوية هنا بشكل صحيح للسماح لك بالإدخال
  /*
  const exists = dbCache.volunteers.some(v => v.nationalId === nationalId);
  if (exists) {
    return res.status(400).json({ error: 'رقم الهوية هذا مسجل بالفعل لمتطوع آخر' });
  }
  */

  const newVolunteer: Volunteer = {
    id: nationalId,
    fullName,
    nationalId,
    birthYear: Number(birthYear) || 2000,
    phone: phone || '',
    address: address || '',
    gender: gender || 'male',
    joinDate: joinDate || new Date().toISOString().split('T')[0],
    image: image || '',
    status: status || 'active',
    story: story || '',
    regionId
  };

  dbCache.volunteers.push(newVolunteer);
  saveDb();
  res.status(201).json(newVolunteer);
});

app.put('/api/volunteers/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const index = dbCache.volunteers.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'المتطوع غير موجود' });
  }

  const updatedData = req.body;
  // Ensure we don't duplicate nationalId if changed
  if (updatedData.nationalId && updatedData.nationalId !== dbCache.volunteers[index].nationalId) {
    const exists = dbCache.volunteers.some(v => v.nationalId === updatedData.nationalId);
    if (exists) {
      return res.status(400).json({ error: 'رقم الهوية الجديد مسجل بالفعل لمتطوع آخر' });
    }
  }

  dbCache.volunteers[index] = {
    ...dbCache.volunteers[index],
    ...updatedData,
    id: updatedData.nationalId || dbCache.volunteers[index].id, // Keep ID synchronized
    birthYear: Number(updatedData.birthYear) || dbCache.volunteers[index].birthYear
  };

  saveDb();
  res.json(dbCache.volunteers[index]);
});

app.delete('/api/volunteers/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const index = dbCache.volunteers.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'المتطوع غير موجود' });
  }

  const deleted = dbCache.volunteers.splice(index, 1);
  saveDb();
  res.json({ message: 'تم حذف المتطوع بنجاح', deleted: deleted[0] });
});

// CSV Bulk Import API Custom Importer with Auto-Mapping columns
app.post('/api/volunteers/import', verifyAuth, (req, res) => {
  const { csvContent, fileName } = req.body;
  const operator = (req as any).user?.username || 'admin';

  if (!csvContent) {
    return res.status(400).json({ error: 'محتوى الملف فارغ أو غير متوفر' });
  }

  try {
    const lines: string[] = csvContent.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'الملف لا يحتوي على سجلات كافية للاستيراد' });
    }

    const headers = parseCSVLine(lines[0]);
    const mapping: Record<string, number> = {};
    headers.forEach((h: string, idx: number) => {
      const cleaned = h.trim().toLowerCase();
      if (cleaned.includes('الاسم') || cleaned.includes('اسم')) mapping['fullName'] = idx;
      else if (cleaned.includes('هوية') || cleaned.includes('nationalid')) mapping['nationalId'] = idx;
      else if (cleaned.includes('ميلاد') || cleaned.includes('year')) mapping['birthYear'] = idx;
      else if (cleaned.includes('جوال') || cleaned.includes('phone')) mapping['phone'] = idx;
      else if (cleaned.includes('سكن') || cleaned.includes('address')) mapping['address'] = idx;
      else if (cleaned.includes('جنس') || cleaned.includes('gender')) mapping['gender'] = idx;
      else if (cleaned.includes('حالة') || cleaned.includes('status')) mapping['status'] = idx;
      else if (cleaned.includes('قصة') || cleaned.includes('story')) mapping['story'] = idx;
      else if (cleaned.includes('منطقة') || cleaned.includes('region')) mapping['regionId'] = idx;
      else if (cleaned.includes('انضمام') || cleaned.includes('join')) mapping['joinDate'] = idx;
    });

    if (mapping['fullName'] === undefined || mapping['nationalId'] === undefined) {
      return res.status(400).json({ error: 'فشل اكتشاف الأعمدة الأساسية (الاسم، رقم الهوية)' });
    }

    let successCount = 0;
    let existUpdateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;
      const rawId = cols[mapping['nationalId']]?.trim() || '';
      if (!rawId) continue;

      const existingIdx = dbCache.volunteers.findIndex(v => v.nationalId === rawId);
      const volunteerData: any = {
        id: rawId,
        nationalId: rawId,
        fullName: cols[mapping['fullName']]?.trim() || 'بدون اسم',
        birthYear: parseInt(cols[mapping['birthYear']]) || 2000,
        phone: cols[mapping['phone']]?.trim() || '',
        address: cols[mapping['address']]?.trim() || '',
        gender: cols[mapping['gender']]?.includes('أنثى') ? 'female' : 'male',
        joinDate: cols[mapping['joinDate']]?.trim() || new Date().toISOString().split('T')[0],
        status: cols[mapping['status']]?.includes('غير') ? 'inactive' : 'active',
        story: cols[mapping['story']]?.trim() || '',
        regionId: cols[mapping['regionId']]?.includes('مغازي') ? 'maghazi' : 'deir_balah',
        image: ''
      };

      if (existingIdx !== -1) {
        dbCache.volunteers[existingIdx] = volunteerData;
        existUpdateCount++;
      } else {
        dbCache.volunteers.push(volunteerData);
        successCount++;
      }
    }

    saveDb();
    res.json({ success: true, successCount, existUpdateCount });

  } catch (err: any) {
    res.status(500).json({ error: 'خطأ في استيراد البيانات: ' + err.message });
  }
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else current += char;
  }
  result.push(current);
  return result;
}

// 3. Activities CRUD
app.get('/api/activities', (req, res) => res.json(dbCache.activities));

app.post('/api/activities', verifyAuth, (req, res) => {
  const { title, description, type, location, date, childrenCount, volunteersCount, images } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'بيانات ناقصة' });

  const newActivity: Activity = {
    id: `act_${Date.now()}`,
    title, description, type, location, date,
    childrenCount: Number(childrenCount) || 0,
    volunteersCount: Number(volunteersCount) || 0,
    images: images || []
  };
  dbCache.activities.unshift(newActivity);
  saveDb();
  res.status(201).json(newActivity);
});

// 4. Contact Us Messages
app.post('/api/messages', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'الاسم والرسالة مطلوبان' });
  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}`, name, email: email || '', phone: phone || '', message, status: 'new', createdAt: new Date().toISOString()
  };
  dbCache.messages.unshift(newMessage);
  saveDb();
  res.status(201).json(newMessage);
});

app.get('/api/messages', verifyAuth, (req, res) => res.json(dbCache.messages));

// 5. System Settings
app.get('/api/settings', (req, res) => {
  res.json(dbCache.settings || { addressAr: "غزة، فلسطين", phone: "+970", email: "withlove@gmail.com" });
});

app.put('/api/settings', verifyAuth, (req, res) => {
  dbCache.settings = { ...dbCache.settings, ...req.body };
  saveDb();
  res.json({ message: 'تم التحديث بنجاح', settings: dbCache.settings });
});

// --- Server Startup ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

startServer();