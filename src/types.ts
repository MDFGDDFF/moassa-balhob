// --- تحديث الـ RegionId ليشمل المناطق الجديدة ---
export type RegionId = 'gaza' | 'khanyounis' | 'maghazi' | 'bureij' | 'deir_balah' | 'zawayda' | 'nuseirat';

export interface Region {
  id: RegionId;
  nameAr: string;
  nameEn: string;
}

export type ActivityType = 'educational' | 'recreational' | 'health' | 'psycho_social' | 'community';

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  location: string;
  date: string;
  childrenCount: number;
  volunteersCount: number;
  images: string[]; // urls or dataUrls
}

export interface Volunteer {
  id: string; // usually nationalId or generated
  fullName: string;
  nationalId: string; // unique 9 digit
  birthYear: number;
  phone: string;
  address: string;
  gender: 'male' | 'female';
  joinDate: string;
  image: string; // base64 representation or default avatar string
  status: 'active' | 'inactive';
  story: string;
  regionId: RegionId;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'replied' | 'archived';
  replyContent?: string;
  createdAt: string;
}

export interface ExcelLog {
  id: string;
  fileName: string;
  type: 'import' | 'export';
  regionId?: RegionId | 'all';
  recordsCount: number;
  createdAt: string;
  operator: string;
}

export interface AppStats {
  volunteersCount: number;
  activitiesCount: number;
  childrenCount: number;
  // استخدام Record هنا سيجبرك على تغطية جميع المناطق السبعة في الإحصائيات
  byRegion: Record<RegionId, number>;
}

export interface Partner {
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
}

export interface AppSettings {
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
  partners?: Partner[];
}