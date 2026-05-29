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
    story: 'بدأ يوسف العمل التطوعي كدعم نفسي في مراكز الإيواء، حيث ينظم ألعاباً ترفيهية للأطفال للتقليل من آثار الصدمات والحروب.',
    regionId: 'maghazi'
  },
  {
    id: '801234789',
    fullName: 'آية محمود حسن رضوان',
    nationalId: '801234789',
    birthYear: 2000,
    phone: '+970592987654',
    address: 'شارع صلاح الدين، بالقرب من دوار البريج',
    gender: 'female',
    joinDate: '2024-02-10',
    image: '',
    status: 'active',
    story: 'مدرسة لغة عربية تطوعت لتعليم الأطفال القراءة والكتابة في خيم التعليم ومحو الأمية بالمخيمات.',
    regionId: 'bureij'
  },
  {
    id: '402345123',
    fullName: 'أنس جلال ابراهيم البحيصي',
    nationalId: '402345123',
    birthYear: 1996,
    phone: '+970595333222',
    address: 'منطقة الميناء، بجوار مستشفى شهداء الأقصى',
    gender: 'male',
    joinDate: '2023-11-01',
    image: '',
    status: 'active',
    story: 'متطوع صحي متميز، يدير مبادرات توزيع المياه الصالحة للشرب والإسعافات الأولية وتأهيل الخيام في دير البلح.',
    regionId: 'deir_balah'
  },
  {
    id: '905667112',
    fullName: 'هبة سليم كمال صيدم',
    nationalId: '905667112',
    birthYear: 2001,
    phone: '+970597111000',
    address: 'غرب الزوايدة، قرب شاطئ البحر',
    gender: 'female',
    joinDate: '2024-03-20',
    image: '',
    status: 'active',
    story: 'تخصصت هبة في المساعدات المجتمعية والدعم الغذائي للأسر المنكوبة والنازحة وعقد حلقات تفريغ نفسي للأمهات.',
    regionId: 'zawayda'
  },
  {
    id: '911554115',
    fullName: 'مروان خالد صالح صالحة',
    nationalId: '911554115',
    birthYear: 1997,
    phone: '+970598654321',
    address: 'مخيم النصيرات، بلوك C',
    gender: 'male',
    joinDate: '2024-04-05',
    image: '',
    status: 'inactive',
    story: 'مهرج ومعد أنشطة مسرحية، يدخل البسمة على شفاه الأطفال المرضى والجرحى بتمثيل مسرح دمى مجاني.',
    regionId: 'nuseirat'
  }
];

const initialActivities: Activity[] = [
  {
    id: 'act_1',
    title: 'مهرجان بسمة طفل الترفيهي لإدخال الفرحة لقلوب الأطفال والنازحين',
    description: 'يوم تفريغي مفتوح للأطفال النازحين تضمن عروض مهرجين، رسم على الوجوه، ألعاب تلي ماتش هادفة وتوزيع هدايا بسيطة لرفع معنوياتهم.',
    type: 'recreational',
    location: 'ساحة مدرسة المغازي الإعدادية للبنين',
    date: '2026-05-12',
    childrenCount: 150,
    volunteersCount: 8,
    images: []
  },
  {
    id: 'act_2',
    title: 'مبادرة خيم التعليم والإرشاد المدرسي والتعليم البديل لمحو الأمية',
    description: 'تأسيس حلقات تعليمية بديلة لمتابعة أساسيات القراءة، الرياضيات والعلوم للأطفال الذين انقطعوا عن مدارسهم بسبب الظروف الراهنة.',
    type: 'educational',
    location: 'مخيم البريج، خيمة بالحب نعطي ونداوي التعليمية',
    date: '2026-05-18',
    childrenCount: 85,
    volunteersCount: 6,
    images: []
  },
  {
    id: 'act_3',
    title: 'حلقات التفريغ والدعم النفسي للأطفال عبر فن الرسم والصلصال',
    description: 'نشاط دعم نفسي تخصصي بمساعدة أخصائيين لتوجيه طاقات الأطفال، وتعبيراتهم الفنية للتعبير عن مخاوفهم ورسم مستقبلهم بالأمل.',
    type: 'psycho_social',
    location: 'مركز الزوايدة المجتمعي',
    date: '2026-05-24',
    childrenCount: 110,
    volunteersCount: 5,
    images: []
  },
  {
    id: 'act_4',
    title: 'حملة فحص وقائي وتوعية صحية للأطفال ضد الأمراض الجلدية والمعوية',
    description: 'مبادرة طبية تضمنت الكشف والتشخيص السريع للأطفال وتوعيتهم وتوزيع حقائب نظافة صحية ووقائية شخصية.',
    type: 'health',
    location: 'نقطة دير البلح الطبية المتنقلة',
    date: '2026-05-25',
    childrenCount: 220,
    volunteersCount: 12,
    images: []
  }
];

const initialMessages: ContactMessage[] = [
  {
    id: 'msg_1',
    name: 'أحمد علي جابر',
    email: 'ahmad@example.com',
    phone: '+970599111333',
    message: 'السلام عليكم ورحمة الله وبركاته، نود تقديم تبرعات عينية من ملابس وألعاب للأطفال، كيف يمكننا التنسيق معكم؟ وجزاكم الله خيراً.',
    status: 'new',
    createdAt: '2026-05-25T14:30:00Z'
  },
  {
    id: 'msg_2',
    name: 'أم محمد الأسطل',
    email: 'momsgaza@example.com',
    phone: '+970592555555',
    message: 'ابني لديه صدمة خوف ويتبول لا إرادي بسبب القصف، هل لديكم جلسات فردية متخصصة في دير البلح لمساعدته؟ بارك الله فيكم.',
    status: 'replied',
    replyContent: 'أهلاً بك يا أم محمد، نعم متواجدون بنقطة دير البلح يومي الاثنين والخميس ولديك الأخصائي أنس البحيصي متاح للمساعدة الفردية، تواصلنا معك عبر الهاتف وسنقوم بتسجيل زيارتك معنا لتقديم الدعم التام للطفل.',
    createdAt: '2026-05-24T09:15:00Z'
  }
];

const initialLogs: ExcelLog[] = [
  {
    id: 'log_1',
    fileName: 'volunteers_seed_import.csv',
    type: 'import',
    regionId: 'all',
    recordsCount: 5,
    createdAt: '2026-05-26T07:00:00Z',
    operator: 'admin'
  }
];

// In-memory application database state
interface DbSchema {
  volunteers: Volunteer[];
  activities: Activity[];
  messages: ContactMessage[];
  excelLogs: ExcelLog[];
  settings?: {
    addressAr: string;
    addressEn: string;
    phone: string;
    email: string;
    welcomeTitleAr?: string;
    welcomeTitleEn?: string;
    welcomeDescAr?: string;
    welcomeDescEn?: string;
    visionAr?: string;
    visionEn?: string;
    missionAr?: string;
    missionEn?: string;
    valuesAr?: string;
    valuesEn?: string;
    partners?: Array<{
      nameAr: string;
      nameEn: string;
      typeAr: string;
      typeEn: string;
    }>;
  };
}

let dbCache: DbSchema = {
  volunteers: [],
  activities: [],
  messages: [],
  excelLogs: []
};

// Cryptography helpers
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Pre-configured admin passwords (for login verification)
const adminUsers = [
  { username: 'majed222', passwordHash: hashPassword('24682468'), role: 'Admin' },
 
];

// Synchronous JSON file persistence
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
    } else {
      dbCache = {
        volunteers: initialVolunteers,
        activities: initialActivities,
        messages: initialMessages,
        excelLogs: initialLogs
      };
      saveDb();
    }

    // Ensure settings are present in the JSON database
    if (!dbCache.settings) {
      dbCache.settings = {
        addressAr: "فلسطين، قطاع غزة، المحافظة الوسطى، دير البلح، شارع شهداء الأقصى",
        addressEn: "Palestine, Gaza Strip, Central Governorate, Deir al-Balah, Shuhada al-Aqsa Street",
        phone: "+970 599 123 456",
        email: "gaza.withlove@gmail.com"
      };
    }
    
    // Ensure all dynamic fields are present
    if (!dbCache.settings.welcomeTitleAr) dbCache.settings.welcomeTitleAr = "مرحباً بكم في فريق بالحب نعطي ونداوِي";
    if (!dbCache.settings.welcomeTitleEn) dbCache.settings.welcomeTitleEn = "Welcome to 'With Love, We Give & Heal'";
    if (!dbCache.settings.welcomeDescAr) dbCache.settings.welcomeDescAr = "مجموعة تطوعية إنسانية مستقلة، تأسست من قلب قطاع غزة لتقديم الدعم النفسي والتعليمي والصحي والترفيهي للأطفال المتأثرين بالحروب والأزمات. نحن نؤمن أن طفولة غزة تستحق مستقبلاً خالياً من الخوف وممتلئاً بالأمل.";
    if (!dbCache.settings.welcomeDescEn) dbCache.settings.welcomeDescEn = "An independent humanitarian voluntary group, founded in the heart of the Gaza Strip, to provide psycho-social, educational, healthcare, and recreational relief to children impacted by conflict and crises. We firmly believe that the children of Gaza deserve a future free of fear, filled with hope.";
    if (!dbCache.settings.visionAr) dbCache.settings.visionAr = "أن نكون الشمعة المضيئة والبلسم المداوي لكل طفل نازح أو جريح في غزة، وبناء منظومة مساندة مجتمعية رائدة تقود غد الأطفال نحو الأمان والابتكار والنجاح.";
    if (!dbCache.settings.visionEn) dbCache.settings.visionEn = "To be the guiding light and the healing balm for every displaced or injured child in Gaza, building an leading community support ecosystem that points their future toward safety, innovation, and achievements.";
    if (!dbCache.settings.missionAr) dbCache.settings.missionAr = "تقديم برامج مميزة وشاملة في الدعم النفسي الفردي والجماعي، والتعليم البديل، والرعاية الطبية الوقائية والمهرجانات الترفيهية للأطفال، عن طريق تأهيل كادر متميز من المتطوعين الشجعان في كافة مناطق القطاع.";
    if (!dbCache.settings.missionEn) dbCache.settings.missionEn = "To deliver distinct, holistic programs in individual and group psycho-social support, non-formal alternative education, preventive medical care, and entertainment events for kids, by training an elite team of motivated local volunteers in all refugee camps.";
    if (!dbCache.settings.valuesAr) dbCache.settings.valuesAr = "الحب الصادق، العطاء بلا شروط، الشفافية المطلقة، الأمان النفسي، والعمل بروح الفريق الواحد الصامد.";
    if (!dbCache.settings.valuesEn) dbCache.settings.valuesEn = "Sincere love, unconditional giving, absolute transparency, psychological safety, and a unified, historical teamwork spirit.";
    if (!dbCache.settings.partners || dbCache.settings.partners.length === 0) {
      dbCache.settings.partners = [
        { nameAr: "الأونروا - غزة", nameEn: "UNRWA Gaza", typeAr: "رعاية إيوائية", typeEn: "Shelter Support" },
        { nameAr: "الهلال الأحمر الفلسطيني", nameEn: "PRCS Palestine", typeAr: "إسناد مسعف وطبي", typeEn: "Emergency & Medical" },
        { nameAr: "اليونيسف للطفولة", nameEn: "UNICEF Kids", typeAr: "برامج دعم متكاملة", typeEn: "Childhood programs" },
        { nameAr: "مجموعة أوتشا الإنسانية", nameEn: "OCHA Humanitarian", typeAr: "تنسيق ميداني لوجستي", typeEn: "Field coordination" }
      ];
    }
    
    saveDb();
  } catch (error) {
    console.error('Error loading db file, falling back to initial data', error);
    dbCache = {
      volunteers: initialVolunteers,
      activities: initialActivities,
      messages: initialMessages,
      excelLogs: initialLogs,
      settings: {
        addressAr: "فلسطين، قطاع غزة، المحافظة الوسطى، دير البلح، شارع شهداء الأقصى",
        addressEn: "Palestine, Gaza Strip, Central Governorate, Deir al-Balah, Shuhada al-Aqsa Street",
        phone: "+970 599 123 456",
        email: "gaza.withlove@gmail.com",
        welcomeTitleAr: "مرحباً بكم في فريق بالحب نعطي ونداوِي",
        welcomeTitleEn: "Welcome to 'With Love, We Give & Heal'",
        welcomeDescAr: "مجموعة تطوعية إنسانية مستقلة، تأسست من قلب قطاع غزة لتقديم الدعم النفسي والتعليمي والصحي والترفيهي للأطفال المتأثرين بالحروب والأزمات. نحن نؤمن أن طفولة غزة تستحق مستقبلاً خالياً من الخوف وممتلئاً بالأمل.",
        welcomeDescEn: "An independent humanitarian voluntary group, founded in the heart of the Gaza Strip, to provide psycho-social, educational, healthcare, and recreational relief to children impacted by conflict and crises. We firmly believe that the children of Gaza deserve a future free of fear, filled with hope.",
        visionAr: "أن نكون الشمعة المضيئة والبلسم المداوي لكل طفل نازح أو جريح في غزة، وبناء منظومة مساندة مجتمعية رائدة تقود غد الأطفال نحو الأمان والابتكار والنجاح.",
        visionEn: "To be the guiding light and the healing balm for every displaced or injured child in Gaza, building an leading community support ecosystem that points their future toward safety, innovation, and achievements.",
        missionAr: "تقديم برامج مميزة وشاملة في الدعم النفسي الفردي والجماعي، والتعليم البديل، والرعاية الطبية الوقائية والمهرجانات الترفيهية للأطفال، عن طريق تأهيل كادر متميز من المتطوعين الشجعان في كافة مناطق القطاع.",
        missionEn: "To deliver distinct, holistic programs in individual and group psycho-social support, non-formal alternative education, preventive medical care, and entertainment events for kids, by training an elite team of motivated local volunteers in all refugee camps.",
        valuesAr: "الحب الصادق، العطاء بلا شروط، الشفافية المطلقة، الأمان النفسي، والعمل بروح الفريق الواحد الصامد.",
        valuesEn: "Sincere love, unconditional giving, absolute transparency, psychological safety, and a unified, historical teamwork spirit.",
        partners: [
          { nameAr: "الأونروا - غزة", nameEn: "UNRWA Gaza", typeAr: "رعاية إيوائية", typeEn: "Shelter Support" },
          { nameAr: "الهلال الأحمر الفلسطيني", nameEn: "PRCS Palestine", typeAr: "إسناد مسعف وطبي", typeEn: "Emergency & Medical" },
          { nameAr: "اليونيسف للطفولة", nameEn: "UNICEF Kids", typeAr: "برامج دعم متكاملة", typeEn: "Childhood programs" },
          { nameAr: "مجموعة أوتشا الإنسانية", nameEn: "OCHA Humanitarian", typeAr: "تنسيق ميداني لوجستي", typeEn: "Field coordination" }
        ]
      }
    };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    loadDb ();
    console.log('Database updated and reloaded successfully');
  } catch (error) {
    console.error('Error saving db to disk', error);
  }
}

// Initialize database
loadDb();

// --- API Router Endpoints ---

// 1. JWT / Simple Cookie-based Hashed Authorization Session Mock
// Since we want standard auth but highly reliable in our browser preview:
// We will generate an Authorization bearer token which is username:role:timestamp hashed
function generateToken(username: string, role: string): string {
  const data = `${username}:${role}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', 'love-gaza-secret-key').update(data).digest('hex');
  return Buffer.from(`${username}:${role}:${hmac}`).toString('base64');
}

function verifyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح لك بالوصول، الرجاء تسجيل الدخول أولاً' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, role, hmac] = decoded.split(':');
    if (!username || !role || !hmac) {
      return res.status(401).json({ error: 'رمز الدخول غير صالح' });
    }
    // Set user on req
    (req as any).user = { username, role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'فشل التحقق من الهوية' });
  }
}

// Authentication api
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const user = adminUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const token = generateToken(user.username, user.role);
  res.json({
    token,
    user: {
      username: user.username,
      role: user.role
    }
  });
});

// App Stats Endpoint
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

  // Validate unique national ID
  

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

    // Parse header and look for column mapping
    const headers = parseCSVLine(lines[0]);
    const records: Array<any> = [];

    // Map headers dynamically
    const mapHeaderToIndex = (headerList: string[]) => {
      const mapping: Record<string, number> = {};
      headerList.forEach((h, idx) => {
        const cleaned = h.trim().toLowerCase();
        
        // fullName mapping
        if (cleaned.includes('الاسم') || cleaned.includes('اسم') || cleaned.includes('name') || cleaned.includes('fullname')) {
          mapping['fullName'] = idx;
        }
        // nationalId mapping
        else if (cleaned.includes('هوية') || cleaned.includes('هويه') || cleaned.includes('national') || cleaned.includes('nationalid') || cleaned === 'id' || cleaned.includes('رقم الهوية')) {
          mapping['nationalId'] = idx;
        }
        // birthYear mapping
        else if (cleaned.includes('ميلاد') || cleaned.includes('سنة') || cleaned.includes('birth') || cleaned.includes('year') || cleaned.includes('العمر')) {
          mapping['birthYear'] = idx;
        }
        // phone mapping
        else if (cleaned.includes('تواصل') || cleaned.includes('هاتف') || cleaned.includes('جوال') || cleaned.includes('phone') || cleaned.includes('mobile') || cleaned.includes('رقم')) {
          mapping['phone'] = idx;
        }
        // address mapping
        else if (cleaned.includes('سكن') || cleaned.includes('عنوان') || cleaned.includes('address') || cleaned.includes('مكان')) {
          mapping['address'] = idx;
        }
        // gender mapping
        else if (cleaned.includes('جنس') || cleaned.includes('gender') || cleaned.includes('نوع')) {
          mapping['gender'] = idx;
        }
        // status mapping
        else if (cleaned.includes('حالة') || cleaned.includes('حاله') || cleaned.includes('status')) {
          mapping['status'] = idx;
        }
        // story mapping
        else if (cleaned.includes('قصة') || cleaned.includes('قصة المتطوع') || cleaned.includes('story')) {
          mapping['story'] = idx;
        }
        // regionId mapping
        else if (cleaned.includes('منطقة') || cleaned.includes('المنطقة') || cleaned.includes('region') || cleaned.includes('بلدة')) {
          mapping['regionId'] = idx;
        }
        // joinDate mapping
        else if (cleaned.includes('انضمام') || cleaned.includes('تاريخ') || cleaned.includes('join')) {
          mapping['joinDate'] = idx;
        }
      });
      return mapping;
    };

    const mapping = mapHeaderToIndex(headers);

    // Essential fields mapping validation
    if (mapping['fullName'] === undefined || mapping['nationalId'] === undefined) {
      return res.status(400).json({
        error: 'فشل اكتشاف رأس الأعمدة تلقائياً. تأكد من وجود عمودي "الاسم" و "رقم الهوية" في ملف البيانات على الأقل'
      });
    }

    let successCount = 0;
    let existUpdateCount = 0;
    const skippedRecords: string[] = [];

    // Map list of regions to match inputs
    const mapRegionNameToId = (val: string): RegionId => {
      const cleanVal = val.trim();
      if (cleanVal.includes('مغازي') || cleanVal.includes('maghazi')) return 'maghazi';
      if (cleanVal.includes('بريج') || cleanVal.includes('bureij')) return 'bureij';
      if (cleanVal.includes('دير') || cleanVal.includes('بلح') || cleanVal.includes('deir')) return 'deir_balah';
      if (cleanVal.includes('زوايدة') || cleanVal.includes('zawayda')) return 'zawayda';
      if (cleanVal.includes('نصيرات') || cleanVal.includes('nuseirat')) return 'nuseirat';
      return 'deir_balah'; // default safe default
    };

    const mapGender = (val: string): 'male' | 'female' => {
      const v = val.trim().toLowerCase();
      if (v.includes('أنثى') || v.includes('انثى') || v.includes('female') || v.includes('بنت')) return 'female';
      return 'male';
    };

    const mapStatus = (val: string): 'active' | 'inactive' => {
      const v = val.trim().toLowerCase();
      if (v.includes('غير نشط') || v.includes('inactive') || v.includes('متوقف') || v.includes('مستبعد')) return 'inactive';
      return 'active';
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      const rawNationalId = cols[mapping['nationalId']]?.trim() || '';
      const fullName = cols[mapping['fullName']]?.trim() || '';

      if (!rawNationalId || !fullName) {
        skippedRecords.push(`السطر ${i + 1}: اسم فارغ أو رقم هوية مفقود`);
        continue;
      }

      // Basic length check for ID
      if (rawNationalId.length < 8 || rawNationalId.length > 10) {
        skippedRecords.push(`السطر ${i + 1}: رقم الهوية "${rawNationalId}" غير صالح (يجب أن يكون من 8-10 أرقام)`);
        continue;
      }

      const birthYearVal = mapping['birthYear'] !== undefined ? parseInt(cols[mapping['birthYear']]) : 2000;
      const phoneVal = mapping['phone'] !== undefined ? cols[mapping['phone']]?.trim() : '';
      const addressVal = mapping['address'] !== undefined ? cols[mapping['address']]?.trim() : '';
      
      const genderRaw = mapping['gender'] !== undefined ? cols[mapping['gender']] : 'male';
      const genderVal = mapGender(genderRaw);

      const statusRaw = mapping['status'] !== undefined ? cols[mapping['status']] : 'active';
      const statusVal = mapStatus(statusRaw);

      const storyVal = mapping['story'] !== undefined ? cols[mapping['story']]?.trim() : 'متطوع متميز لخدمة طفولة غزة';
      
      const regionRaw = mapping['regionId'] !== undefined ? cols[mapping['regionId']] : 'deir_balah';
      const regionIdVal = mapRegionNameToId(regionRaw);

      const joinDateVal = mapping['joinDate'] !== undefined && cols[mapping['joinDate']]
        ? cols[mapping['joinDate']].trim()
        : new Date().toISOString().split('T')[0];

      // Insert or Update Check
      const existingIdx = dbCache.volunteers.findIndex(v => v.nationalId === rawNationalId);
      if (existingIdx !== -1) {
        // Update existing record (preventing deduplication issues)
        dbCache.volunteers[existingIdx] = {
          ...dbCache.volunteers[existingIdx],
          fullName,
          birthYear: isNaN(birthYearVal) ? 2000 : birthYearVal,
          phone: phoneVal || dbCache.volunteers[existingIdx].phone,
          address: addressVal || dbCache.volunteers[existingIdx].address,
          gender: genderVal,
          status: statusVal,
          story: storyVal || dbCache.volunteers[existingIdx].story,
          regionId: regionIdVal,
          joinDate: joinDateVal
        };
        existUpdateCount++;
      } else {
        // Create new record
        const newVol: Volunteer = {
          id: rawNationalId,
          fullName,
          nationalId: rawNationalId,
          birthYear: isNaN(birthYearVal) ? 2000 : birthYearVal,
          phone: phoneVal,
          address: addressVal,
          gender: genderVal,
          joinDate: joinDateVal,
          image: '',
          status: statusVal,
          story: storyVal,
          regionId: regionIdVal
        };
        dbCache.volunteers.push(newVol);
        successCount++;
      }
    }

    saveDb();

    // Log the action
    const totalRecordsImported = successCount + existUpdateCount;
    const newLog: ExcelLog = {
      id: `log_${Date.now()}`,
      fileName,
      type: 'import',
      regionId: 'all',
      recordsCount: totalRecordsImported,
      createdAt: new Date().toISOString(),
      operator
    };
    dbCache.excelLogs.unshift(newLog);
    saveDb();

    res.json({
      success: true,
      successCount,
      existUpdateCount,
      skippedCount: skippedRecords.length,
      skippedRecords
    });

  } catch (err: any) {
    console.error('Error importing CSV bulk data:', err);
    res.status(500).json({ error: 'عذراً، حدث خطأ أثناء تحليل واستيراد ملف البيانات: ' + err.message });
  }
});

// Helper functions for custom CSV parsing to support quotation marks correctly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === '\"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// 3. Activities CRUD
app.get('/api/activities', (req, res) => {
  res.json(dbCache.activities);
});

app.post('/api/activities', verifyAuth, (req, res) => {
  const { title, description, type, location, date, childrenCount, volunteersCount, images } = req.body;

  if (!title || !description || !type || !location || !date) {
    return res.status(400).json({ error: 'من فضلك قم بإدخال جميع بيانات الفعالية المطلوبة وبشكل كامل' });
  }

  const newActivity: Activity = {
    id: `act_${Date.now()}`,
    title,
    description,
    type,
    location,
    date,
    childrenCount: Number(childrenCount) || 0,
    volunteersCount: Number(volunteersCount) || 0,
    images: images || []
  };

  dbCache.activities.unshift(newActivity);
  saveDb();
  res.status(201).json(newActivity);
});

app.put('/api/activities/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const index = dbCache.activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'النشاط غير موجود' });
  }

  const childrenVal = req.body.childrenCount !== undefined ? Number(req.body.childrenCount) : NaN;
  const volunteersVal = req.body.volunteersCount !== undefined ? Number(req.body.volunteersCount) : NaN;

  const updated = {
    ...dbCache.activities[index],
    ...req.body,
    childrenCount: !isNaN(childrenVal) ? childrenVal : dbCache.activities[index].childrenCount,
    volunteersCount: !isNaN(volunteersVal) ? volunteersVal : dbCache.activities[index].volunteersCount,
  };

  dbCache.activities[index] = updated;
  saveDb();
  res.json(updated);
});

app.delete('/api/activities/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const index = dbCache.activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'النشاط غير موجود' });
  }

  const deleted = dbCache.activities.splice(index, 1);
  saveDb();
  res.json({ message: 'تم حذف النشاط بنجاح', deleted: deleted[0] });
});

// 4. Contact Us Messages API
// Public endpoint - no authorization required to submit
app.post('/api/messages', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'عذراً، يرجى ملء الاسم والرسالة أولاً لإرسال الرسالة بنجاح' });
  }

  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}`,
    name,
    email: email || '',
    phone: phone || '',
    message,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  dbCache.messages.unshift(newMessage);
  saveDb();
  res.status(201).json(newMessage);
});

// Admin message APIs
app.get('/api/messages', verifyAuth, (req, res) => {
  res.json(dbCache.messages);
});

app.put('/api/messages/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const { status, replyContent } = req.body;

  const index = dbCache.messages.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  dbCache.messages[index] = {
    ...dbCache.messages[index],
    status: status || dbCache.messages[index].status,
    replyContent: replyContent ?? dbCache.messages[index].replyContent
  };

  saveDb();
  res.json(dbCache.messages[index]);
});

app.delete('/api/messages/:id', verifyAuth, (req, res) => {
  const { id } = req.params;
  const index = dbCache.messages.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الرسالة غير موجودة' });
  }

  dbCache.messages.splice(index, 1);
  saveDb();
  res.json({ message: 'تم إزالة الرسالة بنجاح' });
});

// Excel logs list
app.get('/api/logs', verifyAuth, (req, res) => {
  res.json(dbCache.excelLogs || []);
});

app.post('/api/logs', verifyAuth, (req, res) => {
  const operator = (req as any).user?.username || 'admin';
  const { fileName, type, regionId, recordsCount } = req.body;

  const newLog: ExcelLog = {
    id: `log_${Date.now()}`,
    fileName,
    type,
    regionId,
    recordsCount: Number(recordsCount) || 0,
    createdAt: new Date().toISOString(),
    operator
  };

  dbCache.excelLogs.unshift(newLog);
  saveDb();
  res.status(201).json(newLog);
});

// 5. System settings API
// Public endpoint to get contact and location settings
app.get('/api/settings', (req, res) => {
  res.json(dbCache.settings || {
    addressAr: "فلسطين، قطاع غزة، المحافظة الوسطى، دير البلح، شارع شهداء الأقصى",
    addressEn: "Palestine, Gaza Strip, Central Governorate, Deir al-Balah, Shuhada al-Aqsa Street",
    phone: "+970 599 123 456",
    email: "gaza.withlove@gmail.com"
  });
});

// Auth required to update settings (Admins/Editors)
app.put('/api/settings', verifyAuth, (req, res) => {
  const { 
    addressAr, addressEn, phone, email, 
    welcomeTitleAr, welcomeTitleEn, welcomeDescAr, welcomeDescEn,
    visionAr, visionEn, missionAr, missionEn, valuesAr, valuesEn,
    partners
  } = req.body;

  if (!addressAr || !addressEn || !phone || !email) {
    return res.status(400).json({ error: 'يرجى إدخال جميع الحقول المطلوبة: العنوان بالعربي والإنجليزي، رقم الهاتف، والبريد الإلكتروني' });
  }

  dbCache.settings = {
    addressAr: addressAr.trim(),
    addressEn: addressEn.trim(),
    phone: phone.trim(),
    email: email.trim(),
    welcomeTitleAr: welcomeTitleAr ? welcomeTitleAr.trim() : dbCache.settings?.welcomeTitleAr,
    welcomeTitleEn: welcomeTitleEn ? welcomeTitleEn.trim() : dbCache.settings?.welcomeTitleEn,
    welcomeDescAr: welcomeDescAr ? welcomeDescAr.trim() : dbCache.settings?.welcomeDescAr,
    welcomeDescEn: welcomeDescEn ? welcomeDescEn.trim() : dbCache.settings?.welcomeDescEn,
    visionAr: visionAr ? visionAr.trim() : dbCache.settings?.visionAr,
    visionEn: visionEn ? visionEn.trim() : dbCache.settings?.visionEn,
    missionAr: missionAr ? missionAr.trim() : dbCache.settings?.missionAr,
    missionEn: missionEn ? missionEn.trim() : dbCache.settings?.missionEn,
    valuesAr: valuesAr ? valuesAr.trim() : dbCache.settings?.valuesAr,
    valuesEn: valuesEn ? valuesEn.trim() : dbCache.settings?.valuesEn,
    partners: Array.isArray(partners) ? partners : dbCache.settings?.partners
  };

  saveDb();
  res.json({ message: 'تم تحديث معلومات التواصل بنجاح', settings: dbCache.settings });
});


// Vite middleware configuration for serving frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
  } else {
    // Production serves static client files directly from the build output 'dist' folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`With Love We Give Handlers running on http://0.0.0.0:${PORT}`);
  });
}

startServer(); 
