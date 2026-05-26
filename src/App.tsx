import React, { useState, useEffect } from 'react';
import { useLanguage } from './components/LanguageContext';
import { CSVProcessor } from './components/CSVProcessor';
import { DashboardStats } from './components/DashboardStats';
import { 
  Users, Heart, Compass, ClipboardList, MessageSquare, 
  FileSpreadsheet, LogIn, LogOut, Search, Plus, Trash2, 
  Edit3, Sliders, Menu, X, Check, MapPin, Phone, Mail, 
  UserPlus, HelpCircle, ArrowLeft, ArrowRight, Sun, Moon,
  FileCheck, Shield, ChevronLeft, ChevronRight, UserCheck, AlertCircle
} from 'lucide-react';
import { RegionId, ActivityType, Volunteer, Activity, ContactMessage, ExcelLog, AppStats, AppSettings } from './types';

export default function App() {
  const { 
    language, setLanguage, t, isRtl, theme, toggleTheme, 
    token, login, logout, user 
  } = useLanguage();

  // Active Main views: 'public' | 'admin' | 'login'
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'login'>('public');
  // Logged-in admin tabs: 'stats' | 'volunteers' | 'activities' | 'messages' | 'logs' | 'settings'
  const [adminTab, setAdminTab] = useState<'stats' | 'volunteers' | 'activities' | 'messages' | 'logs' | 'settings'>('stats');
  
  // Public tabs: 'home' | 'about' | 'activities' | 'contact'
  const [publicTab, setPublicTab] = useState<'home' | 'about' | 'activities' | 'contact'>('home');

  // Backend States
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [excelLogs, setExcelLogs] = useState<ExcelLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    addressAr: 'فلسطين، قطاع غزة، المحافظة الوسطى، دير البلح، شارع شهداء الأقصى',
    addressEn: 'Palestine, Gaza Strip, Central Governorate, Deir al-Balah, Shuhada al-Aqsa Street',
    phone: '+970 599 123 456',
    email: 'gaza.withlove@gmail.com',
    welcomeTitleAr: 'مرحباً بكم في فريق بالحب نعطي ونداوِي',
    welcomeTitleEn: "Welcome to 'With Love, We Give & Heal'",
    welcomeDescAr: 'مجموعة تطوعية إنسانية مستقلة، تأسست من قلب قطاع غزة لتقديم الدعم النفسي والتعليمي والصحي والترفيهي للأطفال المتأثرين بالحروب والأزمات. نحن نؤمن أن طفولة غزة تستحق مستقبلاً خالياً من الخوف وممتلئاً بالأمل.',
    welcomeDescEn: "An independent humanitarian voluntary group, founded in the heart of the Gaza Strip, to provide psycho-social, educational, healthcare, and recreational relief to children impacted by conflict and crises.",
    visionAr: 'أن نكون الشمعة المضيئة والبلسم المداوي لكل طفل نازح أو جريح في غزة، وبناء منظومة مساندة مجتمعية رائدة تقود غد الأطفال نحو الأمان والابتكار والنجاح.',
    visionEn: 'To be the guiding light and the healing balm for every displaced or injured child in Gaza, building an leading community support ecosystem that points their future toward safety, innovation, and achievements.',
    missionAr: 'تقديم برامج مميزة وشاملة في الدعم النفسي الفردي الجماعي، والتعليم البديل، والرعاية الطبية الوقائية والمهرجانات الترفيهية للأطفال، عن طريق تأهيل كادر متميز من المتطوعين الشجعان في كافة مناطق القطاع.',
    missionEn: 'To deliver distinct, holistic programs in individual and group psycho-social support, non-formal alternative education, preventive medical care, and entertainment events for kids, by training an elite team of motivated local volunteers in all refugee camps.',
    valuesAr: 'الحب الصادق، العطاء بلا شروط، الشفافية المطلقة، الأمان النفسي، والعمل بروح الفريق الواحد الصامد.',
    valuesEn: 'Sincere love, unconditional giving, absolute transparency, psychological safety, and a unified, historical teamwork spirit.',
    partners: [
      { nameAr: 'الأونروا - غزة', nameEn: 'UNRWA Gaza', typeAr: 'رعاية إيوائية', typeEn: 'Shelter Support' },
      { nameAr: 'الهلال الأحمر الفلسطيني', nameEn: 'PRCS Palestine', typeAr: 'إسناد مسعف وطبي', typeEn: 'Emergency & Medical' },
      { nameAr: 'اليونيسف للطفولة', nameEn: 'UNICEF Kids', typeAr: 'برامج دعم متكاملة', typeEn: 'Childhood programs' },
      { nameAr: 'مجموعة أوتشا الإنسانية', nameEn: 'OCHA Humanitarian', typeAr: 'تنسيق ميداني لوجستي', typeEn: 'Field coordination' }
    ]
  });
  const [stats, setStats] = useState<AppStats>({
    volunteersCount: 0,
    activitiesCount: 0,
    childrenCount: 0,
    byRegion: { maghazi: 0, bureij: 0, deir_balah: 0, zawayda: 0, nuseirat: 0 }
  });

  // UI States & Forms
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState<'all' | 'male' | 'female'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [regionFilter, setRegionFilter] = useState<RegionId | 'all'>('all');
  
  // Create / Edit Volunteer modal states
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [volForm, setVolForm] = useState<Partial<Volunteer>>({
    fullName: '', nationalId: '', birthYear: 1999, phone: '',
    address: 'دير البلح، وسط المخيم', gender: 'male', status: 'active',
    story: '', regionId: 'deir_balah', image: ''
  });

  // Create / Edit Activity Modal states
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [actForm, setActForm] = useState<Partial<Activity>>({
    title: '', description: '', type: 'psycho_social',
    location: '', date: new Date().toISOString().split('T')[0],
    childrenCount: 100, volunteersCount: 8, images: []
  });

  // Message reply states
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Contact Us Public form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSuccessMsg, setContactSuccessMsg] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Activity photo temporary upload state
  const [tempPhoto, setTempPhoto] = useState('');

  // Mobile navigation trigger
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Slider indices for client activities
  const [activeSliderIdx, setActiveSliderIdx] = useState(0);

  // Status limits notifications
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Trigger load of stats, volunteers, activities, logs, messages
  const loadAllData = async () => {
    try {
      // 1. App Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Volunteers
      const volRes = await fetch('/api/volunteers');
      if (volRes.ok) {
        const volData = await volRes.json();
        setVolunteers(volData);
      }

      // 3. Activities
      const actRes = await fetch('/api/activities');
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData);
      }

      // 4. Contact settings
      try {
        const setRes = await fetch('/api/settings');
        if (setRes.ok) {
          const setData = await setRes.json();
          setSettings(setData);
        }
      } catch (errSettings) {
        console.error('Error fetching settings:', errSettings);
      }

      // Private data only if authenticated
      if (token) {
        // 4. Messages
        const msgRes = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }

        // 5. Audit logs
        const logRes = await fetch('/api/logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logRes.ok) {
          const logData = await logRes.json();
          setExcelLogs(logData);
        }
      }
    } catch (e) {
      console.error('Error loading API tables', e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Periodic slider rotation
  useEffect(() => {
    if (activities.length > 0) {
      const interval = setInterval(() => {
        setActiveSliderIdx((prev) => (prev + 1) % Math.min(activities.length, 3));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activities]);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmittingLogin(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      // Authenticate Context
      login(data.token, data.user);
      setCurrentView('admin');
      setAdminTab('stats');
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred');
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Submit Contact Us from public visitors
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) return;
    setContactLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (response.ok) {
        setContactSuccessMsg(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        loadAllData();
        setTimeout(() => setContactSuccessMsg(false), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };

  // Create or Update volunteer record
  const handleSaveVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volForm.fullName || !volForm.nationalId) return;

    const url = editingVolunteer ? `/api/volunteers/${editingVolunteer.id}` : '/api/volunteers';
    const method = editingVolunteer ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(volForm)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'حدث خطأ في المدخلات');
      }

      setVolunteerModalOpen(false);
      setEditingVolunteer(null);
      loadAllData();
    } catch (err: any) {
      setErrorNotification(err.message);
      setTimeout(() => setErrorNotification(null), 5000);
    }
  };

  // Delete volunteer API
  const handleDeleteVolunteer = async (id: string) => {
    if (user?.role === 'Editor') {
      alert(t.roleEditorLimit);
      return;
    }
    if (!confirm(t.confirmDelete)) return;

    try {
      const resp = await fetch(`/api/volunteers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create or edit Activity
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actForm.title || !actForm.description || !actForm.location) return;

    const url = editingActivity ? `/api/activities/${editingActivity.id}` : '/api/activities';
    const method = editingActivity ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(actForm)
      });

      if (response.ok) {
        setActivityModalOpen(false);
        setEditingActivity(null);
        setTempPhoto('');
        loadAllData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error saving activity');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (id: string) => {
    if (user?.role === 'Editor') {
      alert(t.roleEditorLimit);
      return;
    }
    if (!confirm(t.confirmDelete)) return;

    try {
      const resp = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Message Replies
  const handleSendReply = async (id: string) => {
    if (!replyText) return;

    try {
      const resp = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'replied', replyContent: replyText })
      });
      if (resp.ok) {
        setReplyText('');
        setReplyingMessageId(null);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveMessage = async (id: string) => {
    try {
      const resp = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'archived' })
      });
      if (resp.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const resp = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Base64 helper image converter
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'vol' | 'act') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'vol') {
          setVolForm(prev => ({ ...prev, image: base64 }));
        } else {
          setActForm(prev => ({ ...prev, images: [base64] }));
          setTempPhoto(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter logic for volunteers list
  const filteredVolunteers = volunteers.filter(vol => {
    const matchesSearch = 
      vol.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vol.nationalId.includes(searchTerm);
    const matchesSex = sexFilter === 'all' ? true : vol.gender === sexFilter;
    const matchesStatus = statusFilter === 'all' ? true : vol.status === statusFilter;
    const matchesRegion = regionFilter === 'all' ? true : vol.regionId === regionFilter;
    
    return matchesSearch && matchesSex && matchesStatus && matchesRegion;
  });

  // Dynamic partners computed from custom settings
  const partners = (settings.partners || [
    { nameAr: 'الأونروا - غزة', nameEn: 'UNRWA Gaza', typeAr: 'رعاية إيوائية', typeEn: 'Shelter Support' },
    { nameAr: 'الهلال الأحمر الفلسطيني', nameEn: 'PRCS Palestine', typeAr: 'إسناد مسعف وطبي', typeEn: 'Emergency & Medical' },
    { nameAr: 'اليونيسف للطفولة', nameEn: 'UNICEF Kids', typeAr: 'برامج دعم متكاملة', typeEn: 'Childhood programs' },
    { nameAr: 'مجموعة أوتشا الإنسانية', nameEn: 'OCHA Humanitarian', typeAr: 'تنسيق ميداني لوجستي', typeEn: 'Field coordination' }
  ]).map(p => ({
    name: isRtl ? p.nameAr : p.nameEn,
    type: isRtl ? p.typeAr : p.typeEn
  }));

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' || currentView === 'admin' ? 'bg-slate-950 text-white dark:bg-slate-950 dark:text-white' : 'bg-slate-50 text-slate-900'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ERROR GLOBAL TOAST */}
      {errorNotification && (
        <div className="fixed top-6 left-6 right-6 sm:left-auto sm:w-96 p-4 bg-red-600 text-white rounded-2xl shadow-xl z-50 flex items-start gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{isRtl ? 'تنبيه التحقق' : 'Validation Alert'}</p>
            <p className="text-xs text-red-100 mt-1">{errorNotification}</p>
          </div>
        </div>
      )}

      {/* ==================== NAVBAR FOR PUBLIC VISITORS ==================== */}
      {currentView !== 'admin' && (
        <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-75 transition-all bg-slate-900 border-b border-white/10 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              
              {/* Logo icon + site title */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPublicTab('home')}>
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/20">🤍</div>
                <div>
                  <h1 className="text-md sm:text-lg font-bold tracking-tight leading-none text-white">{t.appName}</h1>
                  <span className="text-[10px] text-emerald-400 mt-1 block uppercase tracking-wider">{t.appSubtitle}</span>
                </div>
              </div>

              {/* Desktop links */}
              <nav className="hidden md:flex space-x-1 space-x-reverse items-center">
                <button 
                  onClick={() => setPublicTab('home')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${publicTab === 'home' ? 'bg-white/10 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {t.home}
                </button>
                <button 
                  onClick={() => setPublicTab('about')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${publicTab === 'about' ? 'bg-white/10 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {t.about}
                </button>
                <button 
                  onClick={() => setPublicTab('activities')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${publicTab === 'activities' ? 'bg-white/10 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {t.activities}
                </button>
                <button 
                  onClick={() => setPublicTab('contact')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${publicTab === 'contact' ? 'bg-white/10 text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {t.contact}
                </button>
              </nav>

              {/* Utility switches and admin portal buttons */}
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={toggleTheme} 
                  className="p-2.5 rounded-xl hover:bg-white/10 transition text-slate-300 hover:text-white cursor-pointer"
                  title={theme === 'dark' ? t.lightMode : t.darkMode}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                
                <button 
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} 
                  className="px-3.5 py-1.5 rounded-xl border border-white/15 hover:bg-white/10 transition text-xs font-semibold uppercase tracking-wider text-slate-200 cursor-pointer"
                >
                  {t.language}
                </button>

                {token ? (
                  <button 
                    onClick={() => setCurrentView('admin')} 
                    className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-white" />
                    <span>{t.dashboard}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentView('login')} 
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-white" />
                    <span>{t.toggleToAdmin}</span>
                  </button>
                )}
              </div>

              {/* Mobile hamburger menu toggle */}
              <div className="flex md:hidden items-center gap-2">
                <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-300">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white bg-slate-800 rounded-lg">
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

            </div>
          </div>

          {/* Mobile responsive drawer links */}
          {mobileMenuOpen && (
            <div className="md:hidden px-4 pt-2 pb-6 bg-slate-900 border-t border-white/5 space-y-2">
              <button 
                onClick={() => { setPublicTab('home'); setMobileMenuOpen(false); }}
                className="block w-full text-right py-2 text-sm text-slate-300"
              >
                {t.home}
              </button>
              <button 
                onClick={() => { setPublicTab('about'); setMobileMenuOpen(false); }}
                className="block w-full text-right py-2 text-sm text-slate-300"
              >
                {t.about}
              </button>
              <button 
                onClick={() => { setPublicTab('activities'); setMobileMenuOpen(false); }}
                className="block w-full text-right py-2 text-sm text-slate-300"
              >
                {t.activities}
              </button>
              <button 
                onClick={() => { setPublicTab('contact'); setMobileMenuOpen(false); }}
                className="block w-full text-right py-2 text-sm text-slate-300"
              >
                {t.contact}
              </button>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <button 
                  onClick={() => { setLanguage(language === 'ar' ? 'en' : 'ar'); setMobileMenuOpen(false); }}
                  className="px-3 py-1 bg-slate-800 rounded text-xs"
                >
                  {t.language}
                </button>
                
                {token ? (
                  <button onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }} className="px-4 py-2 bg-emerald-600 rounded text-xs font-bold text-white">
                    {t.dashboard}
                  </button>
                ) : (
                  <button onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }} className="px-4 py-2 bg-purple-600 rounded text-xs font-bold text-white">
                    {t.toggleToAdmin}
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}


      {/* ==================== 1. PUBLIC WEBSITE VIEW ==================== */}
      {currentView === 'public' && (
        <main className="pb-16 animate-fade-in">
          
          {/* A. GENERAL PUBLIC HOME TAB */}
          {publicTab === 'home' && (
            <div className="space-y-16">
              
              {/* HERO HEADER SLIDER */}
              <section className="relative h-[480px] bg-slate-900 overflow-hidden flex items-center text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-purple-950/70 z-10"></div>
                
                {/* Visual Slide show representation */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80"></div>
                  {activities.length > 0 && activities[activeSliderIdx]?.images?.[0] ? (
                    <img 
                      src={activities[activeSliderIdx].images[activities[activeSliderIdx].images.length - 1]} 
                      alt="activity" 
                      className="w-full h-full object-cover opacity-40 transition-all duration-1000 transform scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1e1b4b] via-[#111827] to-[#047857] opacity-50 flex items-center justify-center">
                      <Heart className="w-32 h-32 text-purple-500/15 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
                  <div className="max-w-3xl">
                    <span className="bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4 inline-block">
                      {isRtl ? 'حملة العطاء الصامد بغزة' : 'Solidarity Campaign in Gaza'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                      {t.appName}
                    </h2>
                    <p className="text-sm sm:text-lg text-slate-300 mt-4 leading-relaxed font-normal">
                      {t.tagline}
                    </p>
                    
                    <div className="mt-8 flex flex-wrap gap-4">
                      <button 
                        onClick={() => setPublicTab('activities')}
                        className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition shadow-xl shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                      >
                        <span>{isRtl ? 'استكشف أنشطتنا الميدانية' : 'Explore Field Projects'}</span>
                      </button>
                      <button 
                        onClick={() => setPublicTab('contact')}
                        className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                      >
                        <span>{t.contact}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* LIVE STATS METRICS ROW */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  <div className="flex items-center gap-5 p-4 border-l border-white/5 last:border-0">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">{t.statsVolunteers}</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.volunteersCount || 5} {isRtl ? 'بطل متطوع' : 'Volunteers'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 p-4 border-l border-white/5 last:border-0">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">{t.statsActivities}</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.activitiesCount || 4} {isRtl ? 'نشاط تفاعلي' : 'Activities'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 p-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <Heart className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">{t.statsChildren}</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">{(stats.childrenCount || 565).toLocaleString()} {isRtl ? 'طفل مستفيد' : 'Children supported'}</p>
                    </div>
                  </div>

                </div>
              </section>

              {/* WELCOME / INTRO STORY SECTION */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                    {isRtl ? (settings.welcomeTitleAr || t.welcomeTitle) : (settings.welcomeTitleEn || t.welcomeTitle)}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
                    {isRtl ? (settings.welcomeDescAr || t.welcomeDesc) : (settings.welcomeDescEn || t.welcomeDesc)}
                  </p>
                  <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
                    {isRtl 
                      ? 'نسعى جاهدين للتنقل بين مخيمات المغازي والبريج والنصيرات ودير البلح لتوفير الدعم الوقائي والرعاية والتعليم. كادرنا الميداني يتألف من شبان وشابات ضحوا ببيوتهم ووقتهم لرسم بسمة على وجه كل مريض وجريح.'
                      : 'We struggle day and night within all central governorate shelters to provide vital alternative schooling, hygiene and creative psych activities. Our field operators are heroic local youth.'}
                  </p>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider">{isRtl ? 'الموقع الجغرافي للعمليات' : 'Operation Hub Area'}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">{isRtl ? 'كافة مخيمات اللاجئين والمحافظة الوسطى، دير البلح، قطاع غزة.' : 'All refugee locations and shelters across Deir al-Balah & Middle Area Gaza.'}</p>
                  </div>
                </div>

                {/* Handcrafted Visual Widget representing children support map */}
                <div className="bg-slate-900 text-white rounded-3xl p-8 border border-white/10 space-y-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl"></div>
                  
                  <h4 className="font-bold text-lg text-white border-b border-white/10 pb-3">{t.regionsDesc}</h4>
                  
                  <div className="space-y-4">
                    {[
                      { name: t.deir_balah, count: stats.byRegion.deir_balah || 1, status: isRtl ? 'نشط ميدانياً' : 'highly active' },
                      { name: t.maghazi, count: stats.byRegion.maghazi || 1, status: isRtl ? 'نشط ميدانياً' : 'active' },
                      { name: t.bureij, count: stats.byRegion.bureij || 1, status: isRtl ? 'نشط ميدانياً' : 'active' },
                      { name: t.nuseirat, count: stats.byRegion.nuseirat || 1, status: isRtl ? 'تعزيز الأنشطة' : 'active' }
                    ].map((reg, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-sm">{reg.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{reg.count} {isRtl ? 'متطوع مسجل' : 'Staff'}</span>
                          <span className="bg-purple-500/20 text-purple-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">{reg.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </section>

              {/* RECENT FIELD VISUAL GALLERY */}
              <section className="bg-slate-900 py-16 text-white border-y border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black">{isRtl ? 'آخر مبادراتنا المسجلة ميدانياً' : 'Recent Registered Activities'}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {isRtl ? 'قصص حية من فعاليات كادر "بالحب نعطي ونداوي" مع أطفال محافظة الوسطى' : 'Real-time updates directly from our volunteer field logs.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activities.slice(0, 4).map((act) => (
                      <div key={act.id} className="bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between hover:border-white/10 transition shadow-lg">
                        <div className="p-5 space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-1 rounded shadow">
                            {isRtl ? (act.type === 'educational' ? 'تعليمي' : act.type === 'recreational' ? 'ترفيهي' : act.type === 'health' ? 'صحي' : act.type === 'psycho_social' ? 'دعم نفسي' : 'مجتمعي') : act.type}
                          </span>
                          <h4 className="font-bold text-sm leading-snug line-clamp-2 text-white">{act.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-3">{act.description}</p>
                        </div>
                        <div className="p-5 border-t border-white/5 bg-white/5 text-[11px] text-slate-400 space-y-1">
                          <p>📍 {act.location}</p>
                          <p>📅 {act.date} | 👥 {act.childrenCount} {isRtl ? 'طفل' : 'kids'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* MISSION & GOALS GRID */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold text-lg">🎯</div>
                  <h4 className="font-bold text-lg text-pink-400">{t.ourVision}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRtl ? (settings.visionAr || t.ourVisionText) : (settings.visionEn || t.ourVisionText)}
                  </p>
                </div>

                <div className="p-6 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg">💡</div>
                  <h4 className="font-bold text-lg text-emerald-400">{t.ourMission}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRtl ? (settings.missionAr || t.ourMissionText) : (settings.missionEn || t.ourMissionText)}
                  </p>
                </div>

                <div className="p-6 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-lg">🤍</div>
                  <h4 className="font-bold text-lg text-purple-400">{t.ourValues}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRtl ? (settings.valuesAr || t.ourValuesText) : (settings.valuesEn || t.ourValuesText)}
                  </p>
                </div>
              </section>

              {/* SUCCESS PARTNERS CARDS */}
              <section className="bg-slate-900/20 py-12 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  <h3 className="font-bold text-sm tracking-widest text-emerald-400 uppercase">{t.partners}</h3>
                  <p className="text-xs text-slate-500 max-w-xl mx-auto">{t.partnersSubtitle}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {partners.map((partner, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/55 rounded-xl border border-white/5 text-center shadow-sm">
                        <p className="font-bold text-xs text-white">{partner.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{partner.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FAQ CONTACT FORM */}
              <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{t.contactFormTitle}</h3>
                    <p className="text-xs text-slate-400">{isRtl ? 'رسالتك ستصل مباشرة إلى قيادة الفريق المتواجدة في دير البلح للتنسيق الفوري' : 'Your message will go directly to our admin staff in Deir al-Balah.'}</p>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">{t.contactName} *</label>
                        <input 
                          type="text" 
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">{t.contactPhone}</label>
                        <input 
                          type="text" 
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">{t.contactEmail}</label>
                        <input 
                          type="email" 
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">{t.contactMsg} *</label>
                      <textarea 
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {contactSuccessMsg && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
                        {t.contactSuccess}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={contactLoading}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl text-xs sm:text-sm text-white transition disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
                    >
                      {contactLoading ? t.sending : t.sendBtn}
                    </button>
                  </form>
                </div>
              </section>

            </div>
          )}


          {/* B. DETAILED ABOUT US TAB */}
          {publicTab === 'about' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
              <div className="text-center space-y-3">
                <span className="text-emerald-400 text-xs uppercase tracking-widest font-extrabold">{isRtl ? 'رسالة الأمل في قطاع غزة' : 'The Message of Hope in Gaza'}</span>
                <h2 className="text-3xl font-black">{isRtl ? 'من نحن وتاريخ التأسيس' : 'Who We Are & History'}</h2>
              </div>

              <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8 text-slate-300">
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-lg">💡 {isRtl ? (settings.welcomeTitleAr || t.welcomeTitle) : (settings.welcomeTitleEn || t.welcomeTitle)}</h4>
                  <p className="text-sm leading-relaxed">{isRtl ? (settings.welcomeDescAr || t.welcomeDesc) : (settings.welcomeDescEn || t.welcomeDesc)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                  <div className="space-y-3">
                    <h5 className="text-emerald-400 font-bold text-sm">📍 {t.ourVision}</h5>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {isRtl ? (settings.visionAr || t.ourVisionText) : (settings.visionEn || t.ourVisionText)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-purple-400 font-bold text-sm">📍 {t.ourMission}</h5>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {isRtl ? (settings.missionAr || t.ourMissionText) : (settings.missionEn || t.ourMissionText)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-white font-bold text-sm">{t.ourGoals}</h4>
                  <ul className="space-y-2.5 text-xs text-slate-400 list-disc list-inside">
                    {t.ourGoalsList.map((goal: string, idx: number) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}


          {/* C. ALL ENTIRE ACTIVITIES LIST VIEW */}
          {publicTab === 'activities' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-purple-400 text-xs uppercase tracking-widest font-extrabold">{isRtl ? 'بوابة الأثر والتوثيق' : 'Impact Portals'}</span>
                <h2 className="text-3xl font-black">{t.activitiesTitle}</h2>
              </div>

              {/* Filtering criteria */}
              <div className="flex flex-wrap gap-2 justify-center bg-slate-900/50 p-2 rounded-2xl border border-white/5 max-w-2xl mx-auto">
                {['all', 'psycho_social', 'educational', 'health', 'recreational', 'community'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      // Custom local classification filter state variable
                      // For simplicity, we can do inline checks
                      (window as any).__selectedActCat = cat;
                      loadAllData();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      ((window as any).__selectedActCat || 'all') === cat 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? (isRtl ? 'الكل' : 'All') : t[cat as ActivityType]}
                  </button>
                ))}
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities
                  .filter(act => {
                    const cat = (window as any).__selectedActCat || 'all';
                    return cat === 'all' ? true : act.type === cat;
                  })
                  .map((act) => (
                    <div key={act.id} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition flex flex-col justify-between">
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase">
                            {t[act.type]}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{act.date}</span>
                        </div>
                        <h3 className="font-bold text-base leading-snug text-white">{act.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
                      </div>

                      <div className="p-6 bg-white/5 border-t border-white/5 text-xs text-slate-300 space-y-2.5">
                        <div className="flex justify-between">
                          <span>📍 {act.location}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px] text-slate-400">
                          <div>👥 {act.childrenCount} {isRtl ? 'طفل مستفيد' : 'Children'}</div>
                          <div>🎖️ {act.volunteersCount} {isRtl ? 'متطوع ميداني' : 'Volunteers'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}


          {/* D. CONTACT US PUBLIC TAB */}
          {publicTab === 'contact' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-12">
              <div className="text-center space-y-2">
                <span className="text-emerald-400 text-xs font-extrabold tracking-widest uppercase">{t.contact}</span>
                <h2 className="text-3xl font-black">{t.contactInfo}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Physical Camp and Phone info block */}
                <div className="lg:col-span-1 bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 text-slate-300">
                  <p className="text-xs text-slate-400">{t.contactIntro}</p>

                  <div className="space-y-4 pt-4 border-t border-white/5 text-xs">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white text-xs">{t.addressLabel}</p>
                        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                          {language === 'ar' ? settings.addressAr : settings.addressEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white text-xs">{t.phone}</p>
                        <p className="mt-1 text-[11px] text-slate-400" dir="ltr">{settings.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white text-xs">{t.contactEmail}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{settings.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.socialMedia}</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs cursor-pointer">Telegram</span>
                      <span className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs cursor-pointer">Instagram</span>
                      <span className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs cursor-pointer">Facebook</span>
                    </div>
                  </div>
                </div>

                {/* Form column */}
                <div className="lg:col-span-2 bg-slate-900/30 border border-white/10 rounded-3xl p-6 sm:p-8">
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">{t.contactName} *</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">{t.contactPhone}</label>
                        <input 
                          type="text" 
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">{t.contactEmail}</label>
                        <input 
                          type="email" 
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">{t.contactMsg} *</label>
                      <textarea 
                        rows={5}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                      />
                    </div>

                    {contactSuccessMsg && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
                        {t.contactSuccess}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={contactLoading}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm text-center disabled:opacity-50 transition cursor-pointer"
                    >
                      {contactLoading ? t.sending : t.sendBtn}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-12 mt-16 text-center text-xs text-slate-500 space-y-3">
            <p className="font-bold text-slate-400">© 2026 {t.appName} | {t.appSubtitle}</p>
            <p className="text-[11px] leading-relaxed max-w-xl mx-auto">{t.statsDesc}</p>
          </footer>

        </main>
      )}


      {/* ==================== 2. ADMINISTRATIVE LOGIN VIEW ==================== */}
      {currentView === 'login' && (
        <main className="max-w-lg mx-auto px-4 py-20 animate-fade-in text-slate-200">
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div 
                onClick={() => setCurrentView('public')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 cursor-pointer bg-white/5 px-3 py-1 rounded-full border border-white/5"
              >
                {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{t.backToPublic}</span>
              </div>
              <h3 className="text-xl font-black text-white">{t.toggleToAdmin}</h3>
              <p className="text-xs text-slate-500">{isRtl ? 'أدخل اسم المستخدم والرقم السري لكادر الفريق المسؤول' : 'Enter registered admin and editor credentials'}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">{t.username}</label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  placeholder="admin / editor"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">{t.password}</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold text-center">
                  {t.loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={submittingLogin}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm text-center transition disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {submittingLogin ? t.signingIn : t.login}
              </button>
            </form>

            <div className="border-t border-white/5 pt-4 text-[10px] text-slate-500 leading-relaxed text-center space-y-1">
              <p>Admin Login: <span className="text-purple-400 font-bold">admin</span> | pass: <span className="text-purple-400 font-bold">admin</span></p>
              <p>Editor Login: <span className="text-emerald-400 font-bold">editor</span> | pass: <span className="text-emerald-400 font-bold">editor</span></p>
            </div>

          </div>
        </main>
      )}


      {/* ==================== 3. ADMINDASHBOARD "SLEEK INTERFACE" VIEW ==================== */}
      {currentView === 'admin' && (
        <div className="flex min-h-screen bg-slate-950 font-sans text-white" dir={isRtl ? 'rtl' : 'ltr'}>
          
          {/* SIDEBAR NAVIGATION PANEL */}
          <aside className="hidden lg:flex w-64 bg-slate-900/50 border-white/10 flex-col p-6 backdrop-blur-xl shrink-0 border-l border-white/10">
            
            {/* Sidebar logo */}
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setCurrentView('public')}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold">🤍</div>
              <h1 className="text-sm font-bold tracking-tight leading-tight">
                {t.appName}<br/>
                <span className="text-emerald-400 text-xs">{isRtl ? 'بوابة الكادر المركزية' : 'Staff Center'}</span>
              </h1>
            </div>

            {/* Sidebar links */}
            <nav className="flex-1 space-y-2 text-xs">
              <button 
                onClick={() => setAdminTab('stats')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'stats' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>{t.dashboard}</span>
              </button>

              <button 
                onClick={() => setAdminTab('volunteers')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'volunteers' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>{t.volunteersTitle}</span>
              </button>

              <button 
                onClick={() => setAdminTab('activities')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'activities' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <ClipboardList className="w-4 h-4 text-blue-400" />
                <span>{t.activitiesTitle}</span>
              </button>

              <button 
                onClick={() => setAdminTab('messages')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'messages' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>{t.messagesInbox}</span>
              </button>

              <button 
                onClick={() => setAdminTab('logs')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'logs' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                <span>{t.excelImportExport}</span>
              </button>

              <button 
                onClick={() => setAdminTab('settings')}
                className={`w-full text-right flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition cursor-pointer ${adminTab === 'settings' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Sliders className="w-4 h-4 text-rose-400" />
                <span>{isRtl ? 'بيانات التواصل والمكان' : 'Contact & Location Settings'}</span>
              </button>
            </nav>

            {/* Operator status at bottom */}
            <div className="mt-auto border-t border-white/10 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-400 p-0.5 overflow-hidden flex items-center justify-center">
                  <span className="text-white font-black text-sm uppercase">{user?.username.slice(0, 2) || 'AD'}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white capitalize">{user?.username || 'أحمد الغزاوي'}</p>
                  <p className="text-[9px] text-emerald-400 uppercase tracking-widest">{user?.role === 'Admin' ? 'المشرف العام' : 'محرر ميداني'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={logout}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-[10px] text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>
                <button 
                  onClick={() => setCurrentView('public')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 font-bold text-[10px] text-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{t.backToPublic}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN ADMINISTRATIVE CONTENT AREA */}
          <main className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto min-w-0">
            
            {/* Top Bar Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <span>{t.adminTitle}</span>
                  <span className="bg-purple-600/20 text-purple-400 text-xs font-bold px-2 py-1 rounded">
                    {user?.role === 'Admin' ? 'التحكم الإداري' : 'المساهمة والتحرير'}
                  </span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">{t.statsDesc}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setCurrentView('public')}
                  className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-white/5 font-black text-xs px-4 py-1.5 sm:py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/25"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'بوابة الزوّار (الموقع العام)' : 'Visitors Portal (Public)'}</span>
                </button>

                {/* Mobile-only logout button */}
                <button 
                  onClick={logout}
                  className="lg:hidden bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/10 font-black text-xs px-4 py-1.5 sm:py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>

                <button 
                  onClick={() => {
                    setVolForm({
                      fullName: '', nationalId: '', birthYear: 1999, phone: '',
                      address: 'دير البلح، وسط المخيم', gender: 'male', status: 'active',
                      story: '', regionId: 'deir_balah', image: ''
                    });
                    setEditingVolunteer(null);
                    setVolunteerModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.addVolunteer}</span>
                </button>

                <button 
                  onClick={() => {
                    setActForm({
                      title: '', description: '', type: 'psycho_social',
                      location: '', date: new Date().toISOString().split('T')[0],
                      childrenCount: 150, volunteersCount: 8, images: []
                    });
                    setEditingActivity(null);
                    setActivityModalOpen(true);
                  }}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addActivity}</span>
                </button>
              </div>
            </header>

            {/* Mobile Tab triggers for Admin on small devices */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-white/5">
              {[
                { id: 'stats', label: t.dashboard, icon: Sliders },
                { id: 'volunteers', label: t.volunteersTitle, icon: Users },
                { id: 'activities', label: t.activitiesTitle, icon: ClipboardList },
                { id: 'messages', label: t.messagesInbox, icon: MessageSquare },
                { id: 'logs', label: t.excelImportExport, icon: FileSpreadsheet },
                { id: 'settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: Sliders }
              ].map((tb) => {
                const Icon = tb.icon;
                return (
                  <button
                    key={tb.id}
                    onClick={() => setAdminTab(tb.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer ${adminTab === tb.id ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tb.label}</span>
                  </button>
                );
              })}
            </div>


            {/* TA. STATISTICS DASHBOARD TAB */}
            {adminTab === 'stats' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Stats Boxes with charts */}
                <DashboardStats 
                  stats={stats} 
                  selectedRegion={regionFilter}
                  onRegionSelect={(id) => {
                    setRegionFilter(id);
                    setAdminTab('volunteers');
                  }} 
                />

                {/* Main Admin Overview split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Recent Activity Table Card */}
                  <div className="col-span-1 lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-sm tracking-wide">{isRtl ? 'أهم الأنشطة والفعاليات المسجلة' : 'Featured activities logs'}</h3>
                      <button onClick={() => setAdminTab('activities')} className="text-emerald-400 text-xs hover:underline cursor-pointer">
                        {isRtl ? 'إدارة الكل' : 'Manage All'}
                      </button>
                    </div>

                    <div className="overflow-x-auto text-xs min-w-full">
                      <table className="w-full text-right bg-transparent">
                        <thead className="text-slate-500 uppercase font-semibold border-b border-white/5">
                          <tr>
                            <th className="pb-3 pr-2">{isRtl ? 'النشاط' : 'Activity'}</th>
                            <th className="pb-3">{isRtl ? 'النوع' : 'Category'}</th>
                            <th className="pb-3">{isRtl ? 'المنطقة (المكان)' : 'Location'}</th>
                            <th className="pb-3">{isRtl ? 'المستفيدين' : 'Beneficiaries'}</th>
                            <th className="pb-3">{isRtl ? 'تعديل' : 'Modify'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {activities.slice(0, 5).map((act) => (
                            <tr key={act.id} className="hover:bg-white/5">
                              <td className="py-3.5 pr-2 font-bold max-w-[200px] truncate">{act.title}</td>
                              <td className="py-3.5">
                                <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                  {t[act.type]}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-400 truncate max-w-[150px]">{act.location}</td>
                              <td className="py-3.5 text-emerald-400 font-bold">{act.childrenCount} طفل</td>
                              <td className="py-3.5">
                                <button 
                                  onClick={() => {
                                    setActForm(act);
                                    setEditingActivity(act);
                                    setTempPhoto(act.images?.[0] || '');
                                    setActivityModalOpen(true);
                                  }}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Operations log audit cards */}
                  <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="font-bold text-sm mb-6 uppercase tracking-wider">{isRtl ? 'سجل العمليات والتدقيق' : 'Excel Operational Logs'}</h3>
                    
                    <div className="space-y-4">
                      {excelLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-extrabold text-slate-300 truncate max-w-[160px]">{log.fileName}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.type === 'import' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {log.type === 'import' ? 'استيراد' : 'تصدير'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{log.recordsCount} سجل</span>
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}


            {/* TB. VOLUNTEERS SYSTEM TAB */}
            {adminTab === 'volunteers' && (
              <div className="space-y-6 animate-fade-in text-xs sm:text-sm">
                
                {/* Search query input and filtering controls card */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 space-y-4 backdrop-blur-md">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    {/* Search name field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.search}
                        className="w-full pr-9 pl-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Regional filters */}
                    <div>
                      <select 
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      >
                        <option value="all">{t.allRegions}</option>
                        <option value="maghazi">{t.maghazi}</option>
                        <option value="bureij">{t.bureij}</option>
                        <option value="deir_balah">{t.deir_balah}</option>
                        <option value="zawayda">{t.zawayda}</option>
                        <option value="nuseirat">{t.nuseirat}</option>
                      </select>
                    </div>

                    {/* Sex criteria */}
                    <div>
                      <select 
                        value={sexFilter}
                        onChange={(e) => setSexFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      >
                        <option value="all">{isRtl ? 'جميع الأجناس' : 'All Genders'}</option>
                        <option value="male">{t.male}</option>
                        <option value="female">{t.female}</option>
                      </select>
                    </div>

                    {/* Status criteria */}
                    <div>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      >
                        <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                        <option value="active">{t.active}</option>
                        <option value="inactive">{t.inactive}</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Volunteers data output table */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <p className="font-bold text-xs text-slate-300">{isRtl ? 'قائمة الكوادر الفعالة والأعضاء' : 'Staff Members Directory'} ({filteredVolunteers.length})</p>
                    <button 
                      onClick={() => setAdminTab('logs')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'استيراد bulk / تصدير' : 'Excel control Panel'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-right bg-transparent text-xs">
                      <thead className="text-slate-500 uppercase font-semibold border-b border-white/10 bg-[#1e293b]/45">
                        <tr>
                          <th className="p-3.5 pr-4">{isRtl ? 'الاسم' : 'Name'}</th>
                          <th className="p-3.5">{isRtl ? 'رقم الهوية' : 'National ID'}</th>
                          <th className="p-3.5">{isRtl ? 'المنطقة' : 'Region'}</th>
                          <th className="p-3.5">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                          <th className="p-3.5">{isRtl ? 'الجنس' : 'Gender'}</th>
                          <th className="p-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="p-3.5">{isRtl ? 'انضمام' : 'Joined'}</th>
                          <th className="p-3.5 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {filteredVolunteers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">{isRtl ? 'لا توجد نتائج تطابق خيارات الفلترة المدرجة' : 'No records match parameters.'}</td>
                          </tr>
                        ) : (
                          filteredVolunteers.map((vol) => (
                            <tr key={vol.id} className="hover:bg-white/5">
                              <td className="p-3.5 pr-4 flex items-center gap-2">
                                {vol.image ? (
                                  <img src={vol.image} alt={vol.fullName} className="w-8 h-8 rounded-full object-cover border border-emerald-400" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center uppercase border border-purple-500/30">
                                    {vol.fullName.slice(0, 1)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-white">{vol.fullName}</p>
                                  <p className="text-[10px] text-slate-500 max-w-[200px] truncate" title={vol.story}>{vol.story || vol.address}</p>
                                </div>
                              </td>
                              <td className="p-3.5 font-semibold text-slate-200">{vol.nationalId}</td>
                              <td className="p-3.5 text-slate-200">
                                <span className="bg-slate-800 border border-white/5 text-slate-300 px-2 py-1 rounded">
                                  {t[vol.regionId]}
                                </span>
                              </td>
                              <td className="p-3.5" dir="ltr">{vol.phone}</td>
                              <td className="p-3.5">{t[vol.gender]}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${vol.status === 'active' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-red-500/25 text-red-400'}`}>
                                  {vol.status === 'active' ? t.active : t.inactive}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500">{vol.joinDate}</td>
                              <td className="p-3.5 text-center">
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setVolForm(vol);
                                      setEditingVolunteer(vol);
                                      setVolunteerModalOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                                    title={t.editVolunteer}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteVolunteer(vol.id)}
                                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                    title={t.delete}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            )}


            {/* TC. ACTIVITIES DESK SYSTEM */}
            {adminTab === 'activities' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.length === 0 ? (
                    <div className="col-span-1 lg:col-span-3 p-12 text-center bg-slate-900/40 rounded-3xl border border-white/5 text-slate-500 font-bold">
                      {t.noActivities}
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col justify-between backdrop-blur-md overflow-hidden relative group">
                        
                        {/* Control actions */}
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition z-20 bg-slate-950/80 p-1.5 rounded-lg border border-white/10">
                          <button 
                            onClick={() => {
                              setActForm(act);
                              setEditingActivity(act);
                              setTempPhoto(act.images?.[0] || '');
                              setActivityModalOpen(true);
                            }}
                            className="p-1 px-2.5 text-slate-300 hover:text-white text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1 px-2.5 text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="p-6 space-y-3.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="bg-purple-500/20 text-purple-400 font-bold px-2.5 py-1 rounded">
                              {t[act.type]}
                            </span>
                            <span className="text-slate-500 font-bold">{act.date}</span>
                          </div>
                          
                          <h4 className="font-extrabold text-white text-sm leading-tight">{act.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{act.description}</p>
                        </div>

                        {/* Image preview space */}
                        {act.images && act.images.length > 0 && (
                          <div className="h-32 overflow-hidden border-y border-white/5">
                            <img src={act.images[act.images.length - 1]} alt={act.title} className="w-full h-full object-cover opacity-80" />
                          </div>
                        )}

                        <div className="p-6 bg-white/5 text-xs text-slate-300 space-y-2">
                          <p className="text-slate-400 truncate">📍 {act.location}</p>
                          <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px] text-slate-500">
                            <div>👥 {act.childrenCount} طفل</div>
                            <div>🎖️ {act.volunteersCount} متطوعين</div>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}


            {/* TD. MESSAGES DESK INBOX */}
            {adminTab === 'messages' && (
              <div className="space-y-6 animate-fade-in text-xs sm:text-sm">
                
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5">
                    <p className="font-bold text-xs text-slate-300">{t.messagesInbox}</p>
                  </div>

                  <div className="divide-y divide-white/5">
                    {messages.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 font-bold">{t.noMessages}</div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="p-6 hover:bg-white/5 transition space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <p className="font-black text-sm text-white">{msg.name}</p>
                              <p className="text-slate-500 text-[10px] mt-1 space-x-2 space-x-reverse">
                                {msg.email && <span className="underline">{msg.email}</span>}
                                {msg.phone && <span> جاهد الجوال: {msg.phone}</span>}
                                <span>| {new Date(msg.createdAt).toLocaleString()}</span>
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${msg.status === 'new' ? 'bg-red-500/15 text-red-400' : msg.status === 'replied' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                {msg.status === 'new' ? t.newMsg : msg.status === 'replied' ? t.repliedMsg : t.archivedMsg}
                              </span>
                              
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-red-400 hover:text-red-300 p-1 cursor-pointer bg-white/5 rounded"
                                title={t.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-slate-300 leading-relaxed text-xs">
                            {msg.message}
                          </div>

                          {/* Existing responses rendered */}
                          {msg.replyContent && (
                            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-emerald-400 text-xs">
                              <p className="font-bold text-[10px] uppercase mb-1">{isRtl ? 'الرد المرسل للتواصل:' : 'Sent Reply Outline:'}</p>
                              <p>{msg.replyContent}</p>
                            </div>
                          )}

                          {/* Response form toggles */}
                          {replyingMessageId === msg.id ? (
                            <div className="space-y-3 pt-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400">{t.replyLabel}</label>
                              <textarea 
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                                placeholder={isRtl ? 'اكتب الرسالة المخططة للإرسال الهاتفي أو البريدي...' : 'Draft a response...'}
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setReplyingMessageId(null)} className="px-3 py-1.5 text-xs text-slate-400">{t.cancel}</button>
                                <button onClick={() => handleSendReply(msg.id)} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white">{isRtl ? 'إرسال وأرشفة' : 'Send & Archive'}</button>
                              </div>
                            </div>
                          ) : (
                            msg.status !== 'archived' && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => { setReplyingMessageId(msg.id); setReplyText(''); }} className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-500 text-xs rounded-lg font-bold">{t.replyBtn}</button>
                                <button onClick={() => handleArchiveMessage(msg.id)} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs rounded-lg font-bold">{t.archiveBtn}</button>
                              </div>
                            )
                          )}

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}


            {/* TE. EXCEL CSV CENTRAL SYSTEM */}
            {adminTab === 'logs' && (
              <div className="space-y-8 animate-fade-in text-xs sm:text-sm">
                
                {/* Embedded Central csv engine */}
                <CSVProcessor 
                  volunteers={volunteers}
                  activities={activities}
                  currentRegion={regionFilter}
                  onLogAdded={loadAllData}
                  onImportSuccess={(res) => {
                    const alertMsg = t.importSuccess
                      .replace('{new}', String(res.successCount))
                      .replace('{upd}', String(res.existUpdateCount))
                      .replace('{skip}', String(res.skippedCount));
                    
                    alert(alertMsg);
                    loadAllData();
                    
                    if (res.skippedRecords && res.skippedRecords.length > 0) {
                      console.log('Skipped records issues:', res.skippedRecords);
                    }
                  }}
                />

                {/* Log lists details panel */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-md font-bold mb-4">{t.operationLogs}</h3>

                  <div className="overflow-x-auto text-xs min-w-full">
                    <table className="w-full text-right bg-transparent">
                      <thead className="text-slate-500 font-bold border-b border-white/5">
                        <tr>
                          <th className="pb-3 pr-2">{t.fileName}</th>
                          <th className="pb-3">{isRtl ? 'نوع العملية' : 'Type'}</th>
                          <th className="pb-3">{t.operator}</th>
                          <th className="pb-3">{t.recordsCount}</th>
                          <th className="pb-3">{t.date}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {excelLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5">
                            <td className="py-3 pr-2 font-bold max-w-[200px] truncate">{log.fileName}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.type === 'import' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {log.type === 'import' ? 'استيراد' : 'تصدير'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400 truncate max-w-[120px]">{log.operator}</td>
                            <td className="py-3 text-slate-200">{log.recordsCount} سجل</td>
                            <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}


            {/* TF. CONTACT & COORDINATES SETTINGS TAB */}
            {adminTab === 'settings' && (
              <div className="max-w-2xl bg-slate-900/40 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg font-black text-white">{isRtl ? 'إعدادات ومعلومات التواصل' : 'Contact & Coordinates Settings'}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRtl 
                      ? 'يمكنك تعديل بيانات وفروع الاتصال والمقر العام المعروضة في الصفحة العامة للمستخدمين.' 
                      : 'Modify the team presence, main headquarters, email, and coordinate phone numbers.'}
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch('/api/settings', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(settings)
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setSettings(data.settings);
                      alert(isRtl ? 'تم تحديث معلومات التواصل بنجاح!' : 'Contact settings saved successfully!');
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Failed to update settings');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error saving settings');
                  }
                }} className="space-y-6 text-xs sm:text-sm">
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isRtl ? 'مكان المقر العام والمركز (بالعربية)' : 'Headquarters Location (Arabic)'}
                    </label>
                    <textarea 
                      rows={2}
                      value={settings.addressAr}
                      onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isRtl ? 'مكان المقر العام والمركز (بالإنجليزية)' : 'Headquarters Location (English)'}
                    </label>
                    <textarea 
                      rows={2}
                      value={settings.addressEn}
                      onChange={(e) => setSettings({ ...settings, addressEn: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {isRtl ? 'رقم هاتف الاتصال والتنسيق' : 'Coordinate Phone'}
                      </label>
                      <input 
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {isRtl ? 'البريد الإلكتروني الرسمي' : 'Official Contact Email'}
                      </label>
                      <input 
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* WELCOME AREA CONFIG */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                      <span>✨</span>
                      <span>{isRtl ? 'عنوان ونص الترحيب الرئيسي' : 'Main Welcome Intro Text'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'عنوان الترحيب (بالعربية)' : 'Welcome Title (Arabic)'}
                        </label>
                        <input 
                          type="text"
                          value={settings.welcomeTitleAr || ''}
                          onChange={(e) => setSettings({ ...settings, welcomeTitleAr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'عنوان الترحيب (بالإنجليزية)' : 'Welcome Title (English)'}
                        </label>
                        <input 
                          type="text"
                          value={settings.welcomeTitleEn || ''}
                          onChange={(e) => setSettings({ ...settings, welcomeTitleEn: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'وصف الترحيب (بالعربية)' : 'Welcome Description (Arabic)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.welcomeDescAr || ''}
                          onChange={(e) => setSettings({ ...settings, welcomeDescAr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'وصف الترحيب (بالإنجليزية)' : 'Welcome Description (English)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.welcomeDescEn || ''}
                          onChange={(e) => setSettings({ ...settings, welcomeDescEn: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* VISION MISSION VALUES CONFIG */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                      <span>🎯</span>
                      <span>{isRtl ? 'رؤيتنا ورسالتنا وقيمنا الإنسانية' : 'Vision, Mission & Ethical Values'}</span>
                    </h4>

                    {/* Vision */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'رؤيتنا (بالعربية)' : 'Our Vision (Arabic)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.visionAr || ''}
                          onChange={(e) => setSettings({ ...settings, visionAr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'رؤيتنا (بالإنجليزية)' : 'Our Vision (English)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.visionEn || ''}
                          onChange={(e) => setSettings({ ...settings, visionEn: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                    </div>

                    {/* Mission */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'رسالتنا (بالعربية)' : 'Our Mission (Arabic)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.missionAr || ''}
                          onChange={(e) => setSettings({ ...settings, missionAr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'رسالتنا (بالإنجليزية)' : 'Our Mission (English)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.missionEn || ''}
                          onChange={(e) => setSettings({ ...settings, missionEn: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'قيمنا (بالعربية)' : 'Our Values (Arabic)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.valuesAr || ''}
                          onChange={(e) => setSettings({ ...settings, valuesAr: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isRtl ? 'قيمنا (بالإنجليزية)' : 'Our Values (English)'}
                        </label>
                        <textarea 
                          rows={3}
                          value={settings.valuesEn || ''}
                          onChange={(e) => setSettings({ ...settings, valuesEn: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-rose-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUCCESS PARTNERS LIST CONFIG */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-rose-400 flex items-center gap-2">
                        <span>🤝</span>
                        <span>{isRtl ? 'شركاء النجاح والدعم الإنساني' : 'Partners & Humanitarian Support'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const currentPartners = settings.partners || [];
                          setSettings({
                            ...settings,
                            partners: [...currentPartners, { nameAr: '', nameEn: '', typeAr: '', typeEn: '' }]
                          });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {isRtl ? '+ إضافة شريك نجاح' : '+ Add Sponsor/Partner'}
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {(!settings.partners || settings.partners.length === 0) ? (
                        <p className="text-xs text-slate-500 py-2 text-center bg-slate-950/20 rounded-xl border border-dashed border-white/5">
                          {isRtl ? 'لم يتم إضافة أي شركاء بعد' : 'No partners added yet.'}
                        </p>
                      ) : (
                        settings.partners.map((partner, pIdx) => (
                          <div key={pIdx} className="p-4 bg-slate-950/50 rounded-xl border border-white/10 relative space-y-3">
                            <button
                              type="button"
                              onClick={() => {
                                const currentPartners = (settings.partners || []).filter((_, i) => i !== pIdx);
                                setSettings({ ...settings, partners: currentPartners });
                              }}
                              className="absolute top-3 left-3 px-2 py-1 bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white rounded-md transition cursor-pointer"
                            >
                              {isRtl ? 'حذف' : 'Remove'}
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-12">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">{isRtl ? 'اسم الشريك (بالعربية)' : 'Partner Name (Arabic)'}</label>
                                <input
                                  type="text"
                                  value={partner.nameAr || ''}
                                  onChange={(e) => {
                                    const currentPartners = [...(settings.partners || [])];
                                    currentPartners[pIdx] = { ...currentPartners[pIdx], nameAr: e.target.value };
                                    setSettings({ ...settings, partners: currentPartners });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                                  placeholder={isRtl ? 'الهلال الأحمر الفلسطيني' : 'PRCS Gaza'}
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">{isRtl ? 'اسم الشريك (بالإنجليزية)' : 'Partner Name (English)'}</label>
                                <input
                                  type="text"
                                  value={partner.nameEn || ''}
                                  onChange={(e) => {
                                    const currentPartners = [...(settings.partners || [])];
                                    currentPartners[pIdx] = { ...currentPartners[pIdx], nameEn: e.target.value };
                                    setSettings({ ...settings, partners: currentPartners });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                                  placeholder="Palestine Red Crescent"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-12">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">{isRtl ? 'نوع المساعدة / المساهمة (بالعربية)' : 'Contribution (Arabic)'}</label>
                                <input
                                  type="text"
                                  value={partner.typeAr || ''}
                                  onChange={(e) => {
                                    const currentPartners = [...(settings.partners || [])];
                                    currentPartners[pIdx] = { ...currentPartners[pIdx], typeAr: e.target.value };
                                    setSettings({ ...settings, partners: currentPartners });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                                  placeholder={isRtl ? 'إسناد مسعف وطبي' : 'Emergency Assistance'}
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">{isRtl ? 'نوع المساعدة / المساهمة (بالإنجليزية)' : 'Contribution (English)'}</label>
                                <input
                                  type="text"
                                  value={partner.typeEn || ''}
                                  onChange={(e) => {
                                    const currentPartners = [...(settings.partners || [])];
                                    currentPartners[pIdx] = { ...currentPartners[pIdx], typeEn: e.target.value };
                                    setSettings({ ...settings, partners: currentPartners });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                                  placeholder="Emergency Team"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/10"
                    >
                      {isRtl ? 'حفظ التحديثات' : 'Save Modifications'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </main>
        </div>
      )}


      {/* ========================================================================= */}
      {/* ==================== MODALS (CREATE/EDIT) FOR SYSTEM DATA ==================== */}
      {/* ========================================================================= */}

      {/* 1. CREATE / EDIT VOLUNTEER DIALOG */}
      {volunteerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full text-xs sm:text-sm text-white p-6 sm:p-8 space-y-6 animate-fade-in shadow-2xl relative my-8">
            
            <button 
              onClick={() => setVolunteerModalOpen(false)} 
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white bg-slate-850 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingVolunteer ? t.editVolunteer : t.addVolunteer}
              </h3>
              <p className="text-slate-500 text-[11px]">{t.bulkUpdateAlert}</p>
            </div>

            <form onSubmit={handleSaveVolunteer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{isRtl ? 'الاسم رباعي' : 'Full Name'} *</label>
                <input 
                  type="text" 
                  required
                  value={volForm.fullName || ''}
                  onChange={(e) => setVolForm({ ...volForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.nationalId} *</label>
                <input 
                  type="text" 
                  required
                  placeholder={isRtl ? '9 أرقام فريدة' : '9 digits unique'}
                  disabled={!!editingVolunteer}
                  value={volForm.nationalId || ''}
                  onChange={(e) => setVolForm({ ...volForm, nationalId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.birthYear}</label>
                <input 
                  type="number" 
                  value={volForm.birthYear || 1999}
                  onChange={(e) => setVolForm({ ...volForm, birthYear: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.phone}</label>
                <input 
                  type="text" 
                  value={volForm.phone || ''}
                  onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.regionFilter} *</label>
                <select 
                  value={volForm.regionId || 'deir_balah'}
                  onChange={(e) => setVolForm({ ...volForm, regionId: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                >
                  <option value="maghazi">{t.maghazi}</option>
                  <option value="bureij">{t.bureij}</option>
                  <option value="deir_balah">{t.deir_balah}</option>
                  <option value="zawayda">{t.zawayda}</option>
                  <option value="nuseirat">{t.nuseirat}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.joinDate}</label>
                <input 
                  type="date" 
                  value={volForm.joinDate || ''}
                  onChange={(e) => setVolForm({ ...volForm, joinDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.gender}</label>
                <select 
                  value={volForm.gender || 'male'}
                  onChange={(e) => setVolForm({ ...volForm, gender: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                >
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{t.status}</label>
                <select 
                  value={volForm.status || 'active'}
                  onChange={(e) => setVolForm({ ...volForm, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                >
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-300 font-semibold">{t.address}</label>
                <input 
                  type="text" 
                  value={volForm.address || ''}
                  onChange={(e) => setVolForm({ ...volForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-300 font-semibold">{t.volunteerStory}</label>
                <textarea 
                  rows={2}
                  value={volForm.story || ''}
                  placeholder={t.storyPlaceholder}
                  onChange={(e) => setVolForm({ ...volForm, story: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              {/* Dynamic image file uploader with base64 visualization */}
              <div className="sm:col-span-2 space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                <label className="block text-slate-300 font-semibold">{t.image}</label>
                <div className="flex items-center gap-4">
                  {volForm.image ? (
                    <img src={volForm.image} alt="preview" className="w-12 h-12 rounded-full object-cover border border-emerald-400" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center uppercase">P</div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'vol')}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/15"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">{isRtl ? 'اختر ملف صورة لتمثيل بطاقة الكادر الميداني للتعريف' : 'Select a photo file to represent the card of volunteer.'}</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setVolunteerModalOpen(false)} 
                  className="px-4 py-2 bg-slate-800 text-xs text-white rounded-lg cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-purple-600 text-xs text-white rounded-lg font-bold cursor-pointer hover:bg-purple-500"
                >
                  {t.save}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT ACTIVITY CARD DIALOG */}
      {activityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full text-xs sm:text-sm text-white p-6 sm:p-8 space-y-6 animate-fade-in shadow-2xl relative my-8">
            
            <button 
              onClick={() => setActivityModalOpen(false)} 
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white bg-slate-850 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-white">
              {editingActivity ? t.editActivity : t.addActivity}
            </h3>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'عنوان النشاط' : 'Activity Title'} *</label>
                  <input 
                    type="text" 
                    required
                    value={actForm.title || ''}
                    onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t.activityType} *</label>
                  <select 
                    value={actForm.type || 'psycho_social'}
                    onChange={(e) => setActForm({ ...actForm, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="educational">{t.educational}</option>
                    <option value="recreational">{t.recreational}</option>
                    <option value="health">{t.health}</option>
                    <option value="psycho_social">{t.psycho_social}</option>
                    <option value="community">{t.community}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t.childrenCount}</label>
                  <input 
                    type="number" 
                    value={actForm.childrenCount || 0}
                    onChange={(e) => setActForm({ ...actForm, childrenCount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t.volunteersCountShort}</label>
                  <input 
                    type="number" 
                    value={actForm.volunteersCount || 0}
                    onChange={(e) => setActForm({ ...actForm, volunteersCount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t.activityDate} *</label>
                  <input 
                    type="date" 
                    required
                    value={actForm.date || ''}
                    onChange={(e) => setActForm({ ...actForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{t.activityLocation} *</label>
                  <input 
                    type="text" 
                    required
                    value={actForm.location || ''}
                    onChange={(e) => setActForm({ ...actForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{isRtl ? 'وصف وتفاصيل النشاط' : 'Activity Description'} *</label>
                <textarea 
                  rows={3}
                  required
                  value={actForm.description || ''}
                  onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              {/* Multiple Upload representation */}
              <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                <label className="block text-slate-300 font-semibold">{t.uploadImages}</label>
                <div className="flex items-center gap-4">
                  {tempPhoto ? (
                    <img src={tempPhoto} alt="preview" className="w-12 h-12 rounded object-cover border border-purple-400" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-950 text-slate-500 font-bold flex items-center justify-center">📷</div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'act')}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/15"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setActivityModalOpen(false)} 
                  className="px-4 py-2 bg-slate-800 text-xs text-white rounded-lg cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-xs text-white rounded-lg font-bold cursor-pointer"
                >
                  {t.save}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
