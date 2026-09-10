import React, { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, CopyPlus, Moon, PenLine, Plus, School, Sparkles, Sun, X } from 'lucide-react';
import { SubjectItem, TaskItem } from '../types/konkur';
import { addDaysToJalaliKey, todayJalaliKey, toPersianDigits, normalizeTime } from '../utils/jalali';

type ScheduleCategory = 'holiday' | 'school' | 'night' | 'custom';
type ActivitySeed = { title: string; minutes: number; kind?: 'study' | 'break' };
export interface StudySchedulePreset { id: string; title: string; subtitle: string; hours: number; category: ScheduleCategory; tone: 'indigo' | 'coral' | 'mint'; activities: ActivitySeed[]; custom?: boolean; }
interface Props { subjects: SubjectItem[]; selectedDate?: string; onAddTasks: (tasks: Omit<TaskItem,'id'>[]) => void; onOpenCalendar: () => void; onClose?: () => void; }

const fa=(v:number|string)=>String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const fmt=(m:number)=>`${fa(Math.floor(m/60))} ساعت${m%60?` و ${fa(m%60)} دقیقه`:''}`;
const schedule=(title:string,subtitle:string,hours:number,category:ScheduleCategory,tone:StudySchedulePreset['tone'],blocks:number[]):StudySchedulePreset=>({id:`${category}-${hours}-${title}`,title,subtitle,hours,category,tone,activities:blocks.map((minutes,i)=>({title:i%3===0?'مطالعه عمیق':i%3===1?'مرور و تست':'تحلیل و جمع‌بندی',minutes}))});
const PRESETS:StudySchedulePreset[]=[
 schedule('روز تعطیل، شش ساعته','برای شروع آرام و پیوسته',6,'holiday','indigo',[90,15,90,45,90,15,90]),
 schedule('روز تعطیل، هشت ساعته','تعادل بین عمق و استراحت',8,'holiday','coral',[120,30,120,60,120,30,90,30,90]),
 schedule('روز تعطیل، نه ساعته','برای روزهای پرانرژی',9,'holiday','indigo',[120,30,120,60,120,30,120,30,90,30,60]),
 schedule('روز مدرسه، پنج ساعته','قابل اجرا بعد از برگشتن از مدرسه',5,'school','mint',[75,15,75,45,75,15,75,45,30]),
 schedule('روز مدرسه، شش ساعته','ترکیب درس سبک و عمیق',6,'school','indigo',[90,20,90,45,90,20,75,30,45]),
 schedule('روز مدرسه، هشت ساعته','برای روزهای بدون کلاس فوق‌برنامه',8,'school','coral',[105,20,105,45,105,20,90,45,75,20,60]),
 schedule('شب‌خوان، شش ساعته','شروع از عصر، بدون فشار صبح',6,'night','indigo',[90,20,90,45,90,20,90,45,45]),
 schedule('شب‌خوان، هفت ساعته','برای تمرکز بیشتر در سکوت شب',7,'night','coral',[105,20,105,45,105,20,105,45,75]),
 schedule('شب‌خوان، هشت ساعته','ریتم کامل شبانه تا نیمه‌شب',8,'night','indigo',[120,30,120,45,120,30,105,45,90,30,30]),
];
const categoryMeta:{id:ScheduleCategory;label:string;description:string;icon:React.ComponentType<{className?:string}>}[]=[
 {id:'holiday',label:'روزهای تعطیل',description:'زمان‌های طولانی‌تر برای پیشروی جدی',icon:Sun},
 {id:'school',label:'روزهای مدرسه',description:'واقع‌بینانه و قابل اجرا بعد از کلاس',icon:School},
 {id:'night',label:'ویژه شب‌خوان‌ها',description:'شروع دیرتر، تمرکز عمیق‌تر',icon:Moon},
 {id:'custom',label:'زمان‌بندی‌های من',description:'الگوهایی که خودت ساخته‌ای',icon:PenLine},
];
const STORAGE='konkur_study_schedules_v1';
const loadCustom=():StudySchedulePreset[]=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'[]') as StudySchedulePreset[]}catch{return[]}};
const saveCustom=(items:StudySchedulePreset[])=>{try{localStorage.setItem(STORAGE,JSON.stringify(items))}catch{}}

export const StudyScheduleView:React.FC<Props>=({subjects,onAddTasks,onOpenCalendar,onClose})=>{
 const [tab,setTab]=useState<ScheduleCategory>('holiday'); const [customs,setCustoms]=useState(loadCustom); const [selected,setSelected]=useState<StudySchedulePreset|null>(null); const [date,setDate]=useState(todayJalaliKey()); const [composer,setComposer]=useState(false);
 const [customTitle,setCustomTitle]=useState('زمان‌بندی شخصی من'); const [customHours,setCustomHours]=useState(6); const [customStart,setCustomStart]=useState('08:00');
 const items=useMemo(()=>tab==='custom'?customs:PRESETS.filter(p=>p.category===tab),[tab,customs]);
 const createTasks=(preset:StudySchedulePreset)=>{const firstSubject=subjects[0]; if(!firstSubject)return; let cursor=Number(customStart.slice(0,2))*60+Number(customStart.slice(3)); const tasks:Omit<TaskItem,'id'>[]=[]; preset.activities.forEach((a,i)=>{const isBreak=a.kind==='break'||a.title==='استراحت'; if(!isBreak){const subject=subjects[i%Math.max(1,subjects.length)]??firstSubject; tasks.push({subjectId:subject.id,subjectName:subject.name,activityType:'study',chapter:a.title,dateStr:date,startTime:normalizeTime(`${String(Math.floor(cursor/60)%24).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`),durationMinutes:a.minutes,isCompleted:false,color:subject.color,loggedMinutes:0});} cursor+=a.minutes; if(i<preset.activities.length-1){tasks.push({subjectId:firstSubject.id,subjectName:firstSubject.name,activityType:'other',chapter:'استراحت و بازیابی',dateStr:date,startTime:normalizeTime(`${String(Math.floor(cursor/60)%24).padStart(2,'0')}:${String(cursor%60).padStart(2,'0')}`),durationMinutes:10,isCompleted:false,color:'#12B76A',loggedMinutes:0}); cursor+=10;}}); onAddTasks(tasks); setSelected(null); onOpenCalendar(); };
 const saveNew=()=>{const blocks=Array.from({length:Math.max(3,Math.round(customHours*60/60))},(_,i)=>({title:i%2?'مرور و تست':'مطالعه عمیق',minutes:i===0?90:60}));const item:StudySchedulePreset={id:`custom-${Date.now()}`,title:customTitle.trim()||'زمان‌بندی شخصی من',subtitle:'ساخته‌شده برای ریتم خودت',hours:customHours,category:'custom',tone:'mint',activities:blocks,custom:true};const next=[...customs,item];setCustoms(next);saveCustom(next);setComposer(false);setTab('custom')};
 return <section className="schedule-page" dir="rtl">
  <header className="schedule-heading"><div><span className="schedule-eyebrow"><Sparkles/> الگوهای آماده و قابل ویرایش</span><h1>زمان‌بندی مطالعه</h1><p>یک ریتم مناسب انتخاب کن، بعد همان را مستقیم وارد تقویمت کن.</p></div><button className="schedule-close" onClick={onClose??onOpenCalendar}><X/></button></header>
  <div className="schedule-tabs">{categoryMeta.map(({id,label,icon:Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/><span>{label}</span></button>)}</div>
  <div className="schedule-date"><div><CalendarDays/><div><b>برای کدام روز؟</b><small>فعالیت‌ها در همین تاریخ ساخته می‌شوند</small></div></div><div className="schedule-date-actions"><button onClick={()=>setDate(addDaysToJalaliKey(date,-1))}><ChevronRight/></button><strong>{fa(date)}</strong><button onClick={()=>setDate(addDaysToJalaliKey(date,1))}><ChevronLeft/></button></div></div>
  <div className="schedule-section-title"><div><span>{categoryMeta.find(x=>x.id===tab)?.label}</span><small>{categoryMeta.find(x=>x.id===tab)?.description}</small></div>{tab==='custom'&&<button onClick={()=>setComposer(true)}><Plus/> ساخت جدید</button>}</div>
  {!items.length?<div className="schedule-empty"><PenLine/><b>هنوز زمان‌بندی شخصی نساختی</b><span>یک الگوی ساده بساز و برای هر روز دوباره استفاده‌اش کن.</span><button onClick={()=>setComposer(true)}>ساخت اولین الگو</button></div>:<div className="schedule-grid">{items.map((item,i)=><button key={item.id} className={`schedule-card tone-${item.tone}`} style={{'--i':i} as React.CSSProperties} onClick={()=>setSelected(item)}><span className="schedule-card-top"><i><Clock3/></i><b>{fa(item.hours)} ساعت</b></span><strong>{item.title}</strong><small>{item.subtitle}</small><span className="schedule-card-bottom"><em>{fa(item.activities.filter(a=>a.kind!=='break').length)} بازه مطالعه</em><ChevronLeft/></span></button>)}</div>}
  <button className="schedule-calendar-link" onClick={onOpenCalendar}><CalendarDays/><span><b>از تقویم هم به الگوها دسترسی داری</b><small>برنامه‌های ذخیره‌شده را برای هر روز اضافه کن</small></span><ChevronLeft/></button>
  {selected&&<SchedulePreview preset={selected} date={date} onClose={()=>setSelected(null)} onAdd={()=>createTasks(selected)}/>} {composer&&<CustomComposer title={customTitle} setTitle={setCustomTitle} hours={customHours} setHours={setCustomHours} start={customStart} setStart={setCustomStart} onClose={()=>setComposer(false)} onSave={saveNew}/>} 
 </section>
};

const SchedulePreview:React.FC<{preset:StudySchedulePreset;date:string;onClose:()=>void;onAdd:()=>void}>=({preset,date,onClose,onAdd})=><div className="schedule-sheet-shell"><div className="schedule-sheet"><header><div><span>پیش‌نمایش برنامه</span><small>{preset.title}، {fa(date)}</small></div><button onClick={onClose}><X/></button></header><div className="schedule-sheet-hero"><span><Clock3/></span><div><b>{fa(preset.hours)} ساعت مطالعه</b><small>{preset.subtitle}</small></div></div><div className="schedule-timeline">{preset.activities.map((a,i)=><div key={i} className={a.kind==='break'?'break':''}><i>{a.kind==='break'?<Moon/>:<BookOpen/>}</i><span><b>{a.kind==='break'?'استراحت':a.title}</b><small>{fa(a.minutes)} دقیقه</small></span><em>{fa(i+1)}</em></div>)}</div><p className="schedule-sheet-note">هر بازه به‌عنوان یک فعالیت مستقل وارد تقویم می‌شود تا بتوانی درس، زمان و انجام‌شدنش را جدا ببینی.</p><button className="schedule-primary" onClick={onAdd}><CopyPlus/> افزودن به تقویم</button></div></div>;

const CustomComposer:React.FC<{title:string;setTitle:(v:string)=>void;hours:number;setHours:(v:number)=>void;start:string;setStart:(v:string)=>void;onClose:()=>void;onSave:()=>void}>=({title,setTitle,hours,setHours,start,setStart,onClose,onSave})=><div className="schedule-sheet-shell"><div className="schedule-sheet composer"><header><div><span>ساخت زمان‌بندی</span><small>یک الگوی تکرارشونده برای خودت بساز</small></div><button onClick={onClose}><X/></button></header><label>نام برنامه<input value={title} onChange={e=>setTitle(e.target.value)} /></label><label>هدف مطالعه<select value={hours} onChange={e=>setHours(Number(e.target.value))}>{[4,5,6,7,8,9].map(h=><option key={h} value={h}>{fa(h)} ساعت</option>)}</select></label><label>شروع روز<input type="time" value={start} onChange={e=>setStart(e.target.value)} /></label><div className="composer-hint"><Sparkles/><span>برنامه با بازه‌های ۶۰ تا ۹۰ دقیقه‌ای و استراحت‌های کوتاه ساخته می‌شود.</span></div><button className="schedule-primary" onClick={onSave}><Check/> ذخیره الگو</button></div></div>;
