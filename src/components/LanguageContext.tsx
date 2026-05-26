import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any; // Translation function
  isRtl: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  token: string | null;
  login: (token: string, user: { username: string; role: string }) => void;
  logout: () => void;
  user: { username: string; role: string } | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [token, setToken] = useState<string | null>(localStorage.getItem('withlove_token'));
  const [user, setUser] = useState<{ username: string; role: string } | null>(() => {
    const cached = localStorage.getItem('withlove_user');
    return cached ? JSON.parse(cached) : null;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Force RTL by default for Arabic on program load
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Check local storage for preference
    const savedTheme = localStorage.getItem('withlove_theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, [language]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('withlove_theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('withlove_theme', 'light');
    }
  };

  const login = (newToken: string, newUser: { username: string; role: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('withlove_token', newToken);
    localStorage.setItem('withlove_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('withlove_token');
    localStorage.removeItem('withlove_user');
  };

  const t = translations[language];
  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRtl,
        theme,
        toggleTheme,
        token,
        login,
        logout,
        user,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
