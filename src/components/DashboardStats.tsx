import React from 'react';
import { useLanguage } from './LanguageContext';
import { Users, Heart, MessageSquare, TrendingUp, Compass, Award } from 'lucide-react';
import { RegionId, AppStats } from '../types';

interface DashboardStatsProps {
  stats: AppStats;
  onRegionSelect: (id: RegionId | 'all') => void;
  selectedRegion: RegionId | 'all';
}

export function DashboardStats({ stats, onRegionSelect, selectedRegion }: DashboardStatsProps) {
  const { t, isRtl } = useLanguage();

  const regionsList: Array<{ id: RegionId; name: string; color: string; bg: string; shadow: string }> = [
    { id: 'maghazi', name: t.maghazi, color: 'bg-emerald-500', bg: 'bg-emerald-500/10', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
    { id: 'bureij', name: t.bureij, color: 'bg-purple-500', bg: 'bg-purple-500/10', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
    { id: 'deir_balah', name: t.deir_balah, color: 'bg-blue-500', bg: 'bg-blue-500/10', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
    { id: 'zawayda', name: t.zawayda, color: 'bg-amber-500', bg: 'bg-amber-500/10', shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
    { id: 'nuseirat', name: t.nuseirat, color: 'bg-pink-500', bg: 'bg-pink-500/10', shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.5)]' },
  ];

  // Calculate percentage helper
  const maxVolunteers = Math.max(...Object.values(stats.byRegion || {}), 1);

  return (
    <div className="space-y-8">
      {/* 4 Cards Grid Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-sm mb-1">{t.statsVolunteers}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{stats.volunteersCount}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'كادر ميداني' : 'active staff'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400">
            <span className="bg-emerald-400/10 px-2 py-0.5 rounded-full">+12%</span>
            <span className="text-slate-500">{isRtl ? 'منذ الشهر الماضي' : 'from last month'}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-sm mb-1">{t.activityCount}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-400">{stats.activitiesCount}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'فعالية' : 'activities'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-purple-400 font-medium">
            <span className="bg-purple-400/10 px-2 py-0.5 rounded-full">+5</span>
            <span className="text-slate-500">{isRtl ? 'أنشطة جديدة هذا الأسبوع' : 'new this week'}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-sm mb-1">{t.statsChildren}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">{(stats.childrenCount || 0).toLocaleString()}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'طفل مستفيد' : 'beneficiary children'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-blue-400">
            <span className="bg-blue-400/10 px-2 py-0.5 rounded-full">92%</span>
            <span className="text-slate-500">{isRtl ? 'تغطية مراكز الإيواء' : 'shelter camps covered'}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-sm mb-1">{t.messagesInbox}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-500">{(14)}</span>
            <span className="text-xs text-slate-500">{isRtl ? 'رسائل جديدة' : 'new notifications'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-500 font-bold">
            <span className="bg-amber-400/10 px-2 py-0.5 rounded-full">{isRtl ? 'عاجل' : 'Urgent'}</span>
            <span className="text-slate-500">{isRtl ? 'تحتاج للرد تفصيلياً' : 'requires reply'}</span>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Region Stats Progress Bars Widget */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="font-bold text-base mb-6 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>{t.regionsRegisters}</span>
          </h3>

          <div className="space-y-5">
            {regionsList.map((reg) => {
              const count = stats.byRegion[reg.id] || 0;
              const pct = (count / maxVolunteers) * 100;

              return (
                <div 
                  key={reg.id} 
                  onClick={() => onRegionSelect(reg.id)}
                  className={`space-y-2 cursor-pointer p-2 rounded-xl transition ${selectedRegion === reg.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">{reg.name}</span>
                    <span className="text-slate-400">{count} {isRtl ? 'متطوع مسجل' : 'volunteers'}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${reg.color} rounded-full ${reg.shadow} transition-all duration-500`} 
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">{isRtl ? 'جاهزية سجلات المتطوعين' : 'Registry Readiness'}</p>
                <p className="text-xs text-white">{isRtl ? 'جميع سجلات المحافظة الوسطى كاملة بنسبة 98%' : 'All registers updated & verified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual interactive graph / chart displaying kid support trends */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col backdrop-blur-xl justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>{isRtl ? 'إحصائية الفعاليات المنفذة أسبوعياً للأطفال' : 'Weekly support trends for children'}</span>
              </h3>
              <span className="text-emerald-400 text-xs font-semibold">{isRtl ? 'مستمر تصاعدي' : 'Highly trending'}</span>
            </div>

            {/* Custom SVG stylized chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 border-b border-white/10 pb-1">
              {[
                { label: isRtl ? 'الأسبوع 1' : 'Week 1', kids: 340, acts: 3 },
                { label: isRtl ? 'الأسبوع 2' : 'Week 2', kids: 450, acts: 4 },
                { label: isRtl ? 'الأسبوع 3' : 'Week 3', kids: 620, acts: 5 },
                { label: isRtl ? 'الأسبوع 4' : 'Week 4', kids: 890, acts: 8 },
                { label: isRtl ? 'الأسبوع 5' : 'Week 5', kids: 950, acts: 6 },
                { label: isRtl ? 'الأسبوع 6' : 'Week 6', kids: 1200, acts: 9 }
              ].map((item, idx) => {
                const heightPct = (item.kids / 1200) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Tooltip bar */}
                    <div className="opacity-0 group-hover:opacity-100 bg-[#1e293b] text-white text-[10px] p-1.5 rounded border border-white/10 shadow-lg absolute mb-24 transition duration-200 text-center z-10">
                      <p className="font-bold text-emerald-400">{item.kids} {isRtl ? 'طفل' : 'kids'}</p>
                      <p className="text-slate-400 text-[8px]">{item.acts} {isRtl ? 'أنشطة منفذة' : 'activities'}</p>
                    </div>

                    {/* Color Accent Multi-bar */}
                    <div className="w-full relative flex items-end justify-center rounded-t-md overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 via-purple-600/60 to-purple-500 w-full rounded-t-md transition duration-300 group-hover:from-emerald-500/30 group-hover:to-emerald-400"></div>
                      <div className="w-1 bg-[#38bdf8] h-1/2 rounded-full mb-1"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate w-full text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-4 border-t border-white/5">
            <div>
              <p className="text-slate-500 text-[10px] uppercase leading-none">{isRtl ? 'الأكثر تفاعلاً' : 'Most Active'}</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">{isRtl ? 'دير البلح' : 'Deir al-Balah'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase leading-none">{isRtl ? 'نوع النشاط الأعلى' : 'Top Category'}</p>
              <p className="text-sm font-bold text-purple-400 mt-1">{isRtl ? 'دعم نفسي وتفريغ' : 'Psycho social'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase leading-none">{isRtl ? 'الكفاءة الميدانية' : 'Field Efficiency'}</p>
              <p className="text-sm font-bold text-blue-400 mt-1">98.5%</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
