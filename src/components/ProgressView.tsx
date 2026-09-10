import React, { useMemo, useState } from 'react';
import { Activity, BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, Flame, Gauge, Sparkles, Target, TrendingUp } from 'lucide-react';
import { StudySession, TestDrill, UserProfile } from '../types/konkur';
import { DrillStats, StudyStats } from '../utils/stats';
import { formatMinutesShort, formatMinutesToPersian, toPersianDigits } from '../utils/jalali';
import { EmptyState } from './EmptyState';

interface Props { stats: StudyStats; drillStats: DrillStats; drills: TestDrill[]; sessions: StudySession[]; profile: UserProfile; onStartFocus: () => void; }
type Range = '7' | '30' | '90';
const fa=(v:number|string)=>String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export const ProgressView: React.FC<Props> = ({ stats, drillStats, sessions, profile, onStartFocus }) => {
  const [range,setRange]=useState<Range>('7');
  const [metric,setMetric]=useState<'study'|'average'|'tests'>('study');
  const [subjectOpen,setSubjectOpen]=useState(true);
  if (!stats.hasAnyData && !drillStats.hasAnyData) return <div className="px-4 py-4 max-w-lg mx-auto w-full"><EmptyState icon={BarChart3} title="هنوز آماری نداری" description="به محض اینکه اولین جلسه‌ی تمرکز یا تست‌زنی‌ات ثبت شود، گزارش واقعی‌ات همین‌جا ساخته می‌شود." actionLabel="شروع اولین جلسه تمرکز" onAction={onStartFocus}/></div>;
  const chartDays = useMemo(() => {
    if (range === '7') return stats.week.map(d => ({ label: d.weekdayName.slice(0, 3), minutes: d.minutes, isToday: d.isToday }));
    const count = range === '30' ? 30 : 90;
    const today = new Date();
    return Array.from({ length: range === '30' ? 10 : 12 }, (_, i) => {
      const end = new Date(today); end.setDate(today.getDate() - (range === '30' ? (9 - i) * 3 : (11 - i) * 7));
      const start = new Date(end); start.setDate(end.getDate() - (range === '30' ? 2 : 6));
      const minutes = sessions.filter(s => { const d = new Date(`${s.isoDate}T12:00:00`); return d >= start && d <= end; }).reduce((n, s) => n + s.durationMinutes, 0);
      return { label: `${end.getMonth()+1}/${end.getDate()}`, minutes, isToday: i === (range === '30' ? 9 : 11) };
    });
  }, [range, stats.week, sessions]);
  const max=Math.max(...chartDays.map(d=>d.minutes),profile.dailyGoalMinutes,60);
  const bestSubject=stats.subjects.find(s=>s.minutes>0);
  const progressPct=Math.min(100,Math.round(stats.todayMinutes/Math.max(1,profile.dailyGoalMinutes)*100));
  const periodLabel=range==='7'?'۷ روز اخیر':range==='30'?'۳۰ روز اخیر':'۹۰ روز اخیر';
  return <section className="progress-page" dir="rtl">
    <header className="progress-heading"><div><span><Sparkles/> گزارش واقعی عملکردت</span><h1>پیشرفت</h1><p>کمتر حدس بزن، بیشتر از روند خودت تصمیم بگیر.</p></div><div className="progress-heading-mark"><TrendingUp/></div></header>
    <div className="progress-range"><span>بازه گزارش</span><div>{(['7','30','90'] as Range[]).map(r=><button key={r} className={range===r?'active':''} onClick={()=>setRange(r)}>{r==='7'?'۷ روز':r==='30'?'۳۰ روز':'۹۰ روز'}</button>)}</div></div>
    <div className="progress-hero"><div className="progress-hero-top"><div><span>امروز</span><strong>{formatMinutesShort(stats.todayMinutes)}</strong><small>{fa(progressPct)}٪ از هدف روزانه</small></div><div className="progress-ring" style={{'--p':`${progressPct*3.6}deg`} as React.CSSProperties}><b>{fa(progressPct)}<small>٪</small></b></div></div><div className="progress-hero-track"><i style={{width:`${progressPct}%`}}/></div><div className="progress-hero-bottom"><span><Target/> هدف: {formatMinutesShort(profile.dailyGoalMinutes)}</span><span><Flame/> {fa(stats.streak)} روز پیوسته</span></div></div>
    <div className="progress-metrics"><Metric icon={Clock3} label="این هفته" value={formatMinutesShort(stats.weekMinutes)} note={`میانگین ${formatMinutesShort(stats.weeklyDailyAverage)} در روز`} tone="indigo"/><Metric icon={CalendarDays} label="این ماه" value={formatMinutesShort(stats.monthMinutes)} note={`${fa(stats.sessionsCount)} جلسه ثبت‌شده`} tone="coral"/><Metric icon={Activity} label="بهترین جلسه" value={formatMinutesToPersian(stats.longestSessionMinutes)} note={`رکورد ${fa(stats.longestStreak)} روزه`} tone="mint"/></div>
    <div className="progress-section-head"><div><span>نمودار عملکرد</span><small>{periodLabel}، بر پایه جلسات ثبت‌شده</small></div><div className="progress-metric-switch">{(['study','average','tests'] as const).map(m=><button key={m} className={metric===m?'active':''} onClick={()=>setMetric(m)}>{m==='study'?'مطالعه':m==='average'?'میانگین':'تست'}</button>)}</div></div>
    <div className="progress-chart"><div className="progress-chart-top"><span>{metric==='study'?'مجموع ساعات مطالعه':metric==='average'?'میانگین روزانه':'تعداد تست‌ها'}</span><b>{metric==='tests'?fa(drillStats.totalQuestions):metric==='average'?formatMinutesShort(stats.weeklyDailyAverage):formatMinutesShort(stats.weekMinutes)}</b></div><div className="progress-bars">{chartDays.map((day,i)=>{const v=metric==='study'?day.minutes:metric==='average'?Math.round(day.minutes/1):drillStats.totalQuestions&&i===chartDays.length-1?drillStats.totalQuestions:0;const h=v?Math.max(10,v/(metric==='tests'?Math.max(1,drillStats.totalQuestions):max)*100):3;return <div className="progress-bar-day" key={`${day.label}-${i}`}><span>{v?fa(metric==='tests'?v:Math.round(v/60*10)/10):''}</span><i className={day.isToday?'today':''} style={{height:`${h}%`}}/><small className={day.isToday?'today-label':''}>{day.label.slice(0,3)}</small></div>})}</div><div className="progress-chart-foot"><span>کمتر</span><i/><i/><i/><i/><span>بیشتر</span></div></div>
    <div className="progress-insight"><span><Sparkles/></span><p>{bestSubject?<>این هفته بیشترین زمانت برای <b>{bestSubject.name}</b> بوده. همین درس را با یک بازه‌ی عمیق‌تر ادامه بده.</>:<>هنوز داده‌ای برای تفکیک درس‌ها نداریم. یک جلسه شروع کن.</>}</p></div>
    <div className="progress-section-head subject-head"><div><span>ترکیب مطالعه</span><small>سهم هر درس از مجموع {formatMinutesShort(stats.totalMinutes)}</small></div><button onClick={()=>setSubjectOpen(v=>!v)}><ChevronDown className={subjectOpen?'up':''}/></button></div>
    {subjectOpen&&<div className="progress-subjects">{stats.subjects.filter(s=>s.minutes>0).slice(0,6).map(s=><div className="progress-subject" key={s.id}><div className="progress-subject-row"><span><i style={{backgroundColor:s.color}}/>{s.name}</span><b>{formatMinutesShort(s.minutes)} <small>{fa(s.sharePct)}٪</small></b></div><div className="progress-subject-track"><i style={{width:`${Math.max(4,s.sharePct)}%`,backgroundColor:s.color}}/></div><small className="progress-subject-goal">هدف هفتگی: {fa(s.weeklyGoalPct)}٪ تکمیل</small></div>)}</div>}
    {drillStats.hasAnyData&&<div className="progress-drills"><div className="progress-section-head"><div><span>تست‌زنی سرعتی</span><small>از گزارش‌های ثبت‌شده</small></div><Gauge/></div><div className="progress-drill-grid"><div><b>{fa(drillStats.averagePercent)}٪</b><span>میانگین درصد</span></div><div><b>{fa(drillStats.bestPercent)}٪</b><span>بهترین درصد</span></div><div><b>{fa(drillStats.averageSecondsPerQuestion)} ث</b><span>سرعت پاسخ</span></div></div><p><CheckCircle2/> {fa(drillStats.totalDrills)} جلسه، {fa(drillStats.totalQuestions)} سؤال</p></div>}
    <button className="progress-focus-cta" onClick={onStartFocus}><BookOpen/><span><b>جلسه بعدی را شروع کن</b><small>گزارش بعدی تو همین‌جا دیده می‌شود</small></span><TrendingUp/></button>
  </section>;
};

const Metric:React.FC<{icon:React.ComponentType<{className?:string}>;label:string;value:string;note:string;tone:'indigo'|'coral'|'mint'}>=({icon:Icon,label,value,note,tone})=><div className={`progress-metric tone-${tone}`}><span><Icon/></span><small>{label}</small><b>{value}</b><em>{note}</em></div>;
