import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, FileText, Flame, GraduationCap, Layers3, MoreHorizontal, Palette, Play, Plus, Search, ShieldCheck, Sparkles, TimerReset, Trash2, X } from 'lucide-react';
import { MajorType, SubjectItem, TaskItem } from '../types/konkur';
import { AcademicGrade, CURRENT_ACADEMIC_YEAR, getCurriculumBooks } from '../data/curriculum';
import { addDays, addDaysToJalaliKey, dateToJalaliKey, formatJalaliKey, formatJalaliKeyWithWeekday, jalaliKeyToDate, minutesToTime, normalizeTime, parseJalaliKey, PERSIAN_MONTHS, PERSIAN_WEEKDAYS, timeToMinutes, todayJalaliKey, toPersianDigits } from '../utils/jalali';
import { tasksForDay } from '../utils/stats';

interface Props { tasks:TaskItem[]; subjects:SubjectItem[]; major:MajorType; onToggleTask:(id:string)=>void; onAddTask:(task:Omit<TaskItem,'id'>)=>void; onDeleteTask:(id:string)=>void; onStartFocus:(name:string)=>void; onOpenSchedules?:()=>void; autoOpenAdd?:boolean; onAutoOpenAddHandled?:()=>void }
type ActivityType='study'|'class'|'other'; type TimeMode='range'|'duration';
const COLORS=['#6D5DFB','#FF6B3D','#1D9BF0','#12B76A','#F2B705','#EA3B8B'];
const GENERIC=['فصل اول','فصل دوم','فصل سوم','فصل چهارم','فصل پنجم','جمع‌بندی و مرور'];
const durationLabel=(m:number)=>{const h=Math.floor(m/60),r=m%60;return h?(r?`${toPersianDigits(h)} ساعت و ${toPersianDigits(r)} دقیقه`:`${toPersianDigits(h)} ساعت`):`${toPersianDigits(r)} دقیقه`};
const dayName=(key:string)=>{const d=jalaliKeyToDate(key);return d?PERSIAN_WEEKDAYS[d.getDay()]:''};

export const CalendarView:React.FC<Props>=({tasks,subjects,major,onToggleTask,onAddTask,onDeleteTask,onStartFocus,onOpenSchedules,autoOpenAdd=false,onAutoOpenAddHandled})=>{
 const today=todayJalaliKey(); const [selectedDate,setSelectedDate]=useState(today); const [weekAnchor,setWeekAnchor]=useState(today); const [monthOpen,setMonthOpen]=useState(false); const [formOpen,setFormOpen]=useState(false); const [menu,setMenu]=useState<string|null>(null);
 const dayTasks=useMemo(()=>tasksForDay(tasks,selectedDate),[tasks,selectedDate]);
 const week=useMemo(()=>{const anchor=jalaliKeyToDate(weekAnchor)??new Date();const saturday=addDays(anchor,-((anchor.getDay()+1)%7));return Array.from({length:7},(_,i)=>dateToJalaliKey(addDays(saturday,i)))},[weekAnchor]);
 const meta=parseJalaliKey(selectedDate), done=dayTasks.filter(t=>t.isCompleted).length, total=dayTasks.reduce((n,t)=>n+t.durationMinutes,0);
 useEffect(()=>{if(autoOpenAdd){setSelectedDate(today);setWeekAnchor(today);setFormOpen(true);onAutoOpenAddHandled?.()}},[autoOpenAdd,onAutoOpenAddHandled,today]);
 if(!subjects.length)return <div className="calendar-empty" dir="rtl"><GraduationCap/><strong>اول درس‌هایت را بساز</strong><span>از تنظیمات رشته را انتخاب کن، بعد تقویمت آماده است.</span></div>;
 return <section className="calendar-page" dir="rtl">
  <div className="calendar-heading"><div><span className="calendar-eyebrow"><Sparkles/> برنامه‌ی روزانه</span><h1>زمان‌بندی مطالعه</h1></div><button className="calendar-today-btn" onClick={()=>{setSelectedDate(today);setWeekAnchor(today)}}>امروز</button></div>
  <div className="calendar-month-row"><button onClick={()=>setWeekAnchor(addDaysToJalaliKey(weekAnchor,7))}><ChevronRight/></button><button className="calendar-month-title" onClick={()=>setMonthOpen(v=>!v)}>{meta?`${PERSIAN_MONTHS[meta.jm-1]} ${toPersianDigits(meta.jy)}`:''}<ChevronDown className={monthOpen?'rotated':''}/></button><button onClick={()=>setWeekAnchor(addDaysToJalaliKey(weekAnchor,-7))}><ChevronLeft/></button></div>
  {monthOpen&&meta?<MonthPicker year={meta.jy} month={meta.jm} selected={selectedDate} tasks={tasks} onSelect={k=>{setSelectedDate(k);setWeekAnchor(k);setMonthOpen(false)}} onMove={k=>{setSelectedDate(k);setWeekAnchor(k)}}/>:<div className="calendar-week no-scrollbar">{week.map(key=>{const d=parseJalaliKey(key),active=key===selectedDate,count=tasksForDay(tasks,key).length;return <button key={key} className={active?'selected':''} onClick={()=>setSelectedDate(key)}><span>{dayName(key).replace('‌',' ')}</span><strong>{toPersianDigits(d?.jd??'')}</strong><i>{count?toPersianDigits(count):''}</i></button>})}</div>}
  <div className="calendar-summary"><div><BookOpen/><span>زمان مطالعه</span><strong>{durationLabel(total)}</strong></div><div><CheckCircle2/><span>انجام‌شده</span><strong>{toPersianDigits(done)} از {toPersianDigits(dayTasks.length)}</strong></div><div><Flame/><span>تمرکز روز</span><strong>{dayTasks[0]?.subjectName??'آزاد'}</strong></div></div>
  <div className="calendar-section-title"><div><span>فعالیت‌ها</span><small>{formatJalaliKeyWithWeekday(selectedDate)}</small></div><div className="calendar-section-actions"><button className="schedule-open-btn" onClick={()=>onOpenSchedules?.()}><Sparkles/> الگوها</button><button onClick={()=>setFormOpen(true)}><Plus/> ثبت فعالیت جدید</button></div></div>
  {!dayTasks.length?<div className="calendar-zero"><CalendarDays/><strong>این روز هنوز خالیه</strong><span>اولین فعالیت را بچین، بقیه‌اش راه می‌افتد.</span><button onClick={()=>setFormOpen(true)}>ساخت اولین فعالیت</button></div>:<div className="calendar-activities">{dayTasks.map(task=>{const end=minutesToTime(timeToMinutes(task.startTime)+task.durationMinutes);return <article key={task.id} style={{'--task-color':task.color??'#6D5DFB'} as React.CSSProperties}><button className="calendar-check" onClick={()=>onToggleTask(task.id)}>{task.isCompleted?<CheckCircle2/>:<Circle/>}</button><div className="calendar-activity-main"><div className="calendar-activity-top"><span>{task.activityType==='class'?'کلاس درسی':task.activityType==='other'?'فعالیت':'گزارش مطالعه'}</span><button onClick={()=>setMenu(menu===task.id?null:task.id)}><MoreHorizontal/></button></div><h3 className={task.isCompleted?'done':''}>{task.chapter||task.subjectName}</h3>{task.chapter&&<p>{task.subjectName}</p>}<div className="calendar-activity-meta"><span><Clock3/> {toPersianDigits(task.startTime)} تا {toPersianDigits(end)}</span>{task.questionCount?<span><FileText/> {toPersianDigits(task.questionCount)} سوال</span>:null}</div>{menu===task.id&&<div className="calendar-item-menu"><button onClick={()=>onStartFocus(task.subjectName)}><Play/> شروع تمرکز</button><button className="danger" onClick={()=>onDeleteTask(task.id)}><Trash2/> حذف فعالیت</button></div>}</div></article>})}</div>}
  {formOpen&&<ActivityForm subjects={subjects} major={major} dateStr={selectedDate} onClose={()=>setFormOpen(false)} onSave={(data,start)=>{onAddTask(data);setFormOpen(false);if(start)onStartFocus(data.subjectName)}}/>}
 </section>
};

const MonthPicker:React.FC<{year:number;month:number;selected:string;tasks:TaskItem[];onSelect:(k:string)=>void;onMove:(k:string)=>void}>=({year,month,selected,tasks,onSelect,onMove})=>{const first=jalaliKeyToDate(`${year}/${String(month).padStart(2,'0')}/01`),offset=first?(first.getDay()+1)%7:0,days=month<=6?31:month<=11?30:29,cells=Array.from({length:offset+days},(_,i)=>i<offset?null:i-offset+1);const move=(delta:number)=>{let y=year,m=month+delta;if(m===13){y++;m=1}if(m===0){y--;m=12}onMove(`${y}/${String(m).padStart(2,'0')}/01`)};return <div className="month-picker"><div className="month-picker-nav"><button onClick={()=>move(1)}><ChevronRight/></button><strong>{PERSIAN_MONTHS[month-1]}</strong><button onClick={()=>move(-1)}><ChevronLeft/></button></div><div className="month-weekdays">{['ش','ی','د','س','چ','پ','ج'].map(d=><span key={d}>{d}</span>)}</div><div className="month-grid">{cells.map((day,i)=>{if(!day)return <span key={i}/>;const key=`${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;return <button key={key} className={key===selected?'selected':''} onClick={()=>onSelect(key)}>{toPersianDigits(day)}{tasks.some(t=>t.dateStr===key)&&<i/>}</button>})}</div></div>};

const GRADES:AcademicGrade[] = ['دهم', 'یازدهم', 'دوازدهم', 'کنکور'];

const ActivityForm: React.FC<{ subjects: SubjectItem[]; major:MajorType; dateStr: string; onClose: () => void; onSave: (d: Omit<TaskItem, 'id'>, start: boolean) => void }> = ({ subjects, major, dateStr, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ActivityType>('study');
  const [subjectId, setSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [customSubject, setCustomSubject] = useState(false);
  const [grade, setGrade] = useState<AcademicGrade>('دوازدهم');
  const [bookId, setBookId] = useState('');
  const [chapter, setChapter] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [mode, setMode] = useState<TimeMode>('range');
  const [start, setStart] = useState('08:30');
  const [end, setEnd] = useState('09:30');
  const [duration, setDuration] = useState(60);
  const [more, setMore] = useState(false);
  const [resource, setResource] = useState('');
  const [report, setReport] = useState('درسنامه و تست');
  const [qType, setQType] = useState<'test' | 'written'>('test');
  const [qCount, setQCount] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const finalSubjectName = customSubject ? subjectName.trim() : selectedSubject?.name ?? '';
  const curriculumBooks = finalSubjectName ? getCurriculumBooks(finalSubjectName, grade, major) : [];
  const selectedBook = curriculumBooks.find(book => book.id === bookId) ?? curriculumBooks[0];
  const chapters = selectedBook?.chapters ?? GENERIC;
  const filteredSubjects = subjects.filter(s => s.name.includes(subjectSearch.trim()));
  const filteredChapters = chapters.filter(c => c.includes(chapterSearch.trim()));
  const needsAcademicDetails = type !== 'other';
  const totalSteps = needsAcademicDetails ? 4 : 3;

  const chooseSubject = (id: string, name: string) => {
    setSubjectId(id); setSubjectName(name); setCustomSubject(false); setBookId(''); setChapter(''); setError('');
  };
  const useCustomSubject = () => {
    if (!subjectName.trim()) return setError('نام درس دلخواه را بنویس.');
    setCustomSubject(true); setSubjectId(''); setChapter(''); setError('');
  };
  const nextStep = () => {
    if (step === 1) {
      if (type === 'other') { setStep(2); return; }
      if (!finalSubjectName) return setError('یک درس انتخاب کن یا نام درس دلخواهت را بنویس.');
    }
    if (needsAcademicDetails && step === 2 && !grade) return setError('پایه را انتخاب کن.');
    if (needsAcademicDetails && step === 3 && !chapter) return setError('فصل یا عنوان فعالیت را انتخاب کن.');
    if (!needsAcademicDetails && step === 2 && !chapter) return setError('عنوان فعالیت را بنویس.');
    setError(''); setStep(s => Math.min(totalSteps, s + 1));
  };
  const save = (startNow: boolean) => {
    if (!finalSubjectName) { setStep(1); return setError('یک درس انتخاب کن یا نام درس دلخواهت را بنویس.'); }
    if (!chapter) { setStep(needsAcademicDetails ? 3 : 2); return setError('فصل یا عنوان فعالیت را انتخاب کن.'); }
    let minutes = duration;
    if (mode === 'range') {
      minutes = timeToMinutes(end) - timeToMinutes(start);
      if (minutes <= 0) { setStep(totalSteps); return setError('زمان پایان باید بعد از شروع باشد.'); }
    }
    onSave({
      subjectId: customSubject ? `custom-${finalSubjectName}` : subjectId,
      subjectName: finalSubjectName,
      activityType: type,
      chapter: needsAcademicDetails ? `${selectedBook?.title ?? grade} · ${chapter}` : chapter,
      dateStr,
      startTime: normalizeTime(start),
      durationMinutes: Math.max(5, minutes),
      isCompleted: false,
      notes: notes.trim() || undefined,
      resource: resource.trim() || undefined,
      reportType: type === 'study' ? report : undefined,
      questionType: type === 'study' ? qType : undefined,
      questionCount: qCount ? Math.max(0, Number(qCount)) : undefined,
      color,
      loggedMinutes: 0,
    }, startNow);
  };

  return <div className="activity-form-shell" role="dialog" aria-modal="true">
    <div className="activity-form">
      <header><button onClick={onClose}><X /></button><div><span>فعالیت جدید</span><strong>{formatJalaliKey(dateStr)}</strong></div><div className="form-step">{toPersianDigits(step)}</div></header>
      <div className="form-progress"><i style={{ transform: `scaleX(${step / totalSteps})` }} /></div>
      <main>
        {step === 1 && <div className="form-panel"><div className="form-intro"><span><Layers3 /></span><div><h2>چه فعالیتی؟</h2><p>درس، نوع فعالیت و مسیر مطالعاتی را مشخص کن.</p></div></div><div className="activity-tabs"><button className={type === 'study' ? 'active' : ''} onClick={() => setType('study')}><BookOpen />گزارش مطالعه</button><button className={type === 'class' ? 'active' : ''} onClick={() => setType('class')}><GraduationCap />کلاس درسی</button><button className={type === 'other' ? 'active' : ''} onClick={() => setType('other')}><Sparkles />سایر فعالیت‌ها</button></div><label className="form-label">عنوان درس</label><div className="search-field"><Search /><input value={customSubject ? subjectName : subjectSearch} onChange={e => customSubject ? setSubjectName(e.target.value) : setSubjectSearch(e.target.value)} placeholder="جست‌وجوی درس..." /></div><div className="subject-list">{filteredSubjects.map(s => <button key={s.id} className={!customSubject && subjectId === s.id ? 'selected' : ''} onClick={() => chooseSubject(s.id, s.name)}><i style={{ backgroundColor: s.color }} /><span>{s.name}</span>{!customSubject && subjectId === s.id && <Check />}</button>)}<button className={customSubject ? 'selected' : ''} onClick={useCustomSubject}><i style={{ backgroundColor: '#f0564f' }} /><span>{customSubject && subjectName ? `درس دلخواه: ${subjectName}` : 'نوشتن درس دلخواه'}</span>{customSubject && <Check />}</button></div>{error && <div className="form-error">{error}</div>}</div>}
        {needsAcademicDetails && step === 2 && <div className="form-panel"><div className="form-intro"><span><GraduationCap /></span><div><h2>پایه و کتاب</h2><p>{finalSubjectName} را از منبع درست انتخاب کن.</p></div></div><div className="grade-pills">{GRADES.map(item=><button key={item} className={grade===item?'selected':''} onClick={()=>{setGrade(item);setBookId('');setChapter('')}}>{item}</button>)}</div><div className="curriculum-source"><ShieldCheck/><span><b>سال تحصیلی {CURRENT_ACADEMIC_YEAR}</b><small>منابع ۱۴۰۵: چاپ ۱۴۰۲ دهم، ۱۴۰۳ یازدهم، ۱۴۰۴ دوازدهم</small></span></div>{curriculumBooks.length>0?<div className="book-list">{curriculumBooks.map(book=><button key={book.id} className={(bookId||curriculumBooks[0]?.id)===book.id?'selected':''} onClick={()=>{setBookId(book.id);setChapter('')}}><BookOpen/><span><b>{book.title}</b><small>کد {book.code??'سرفصل آزمون'} · چاپ {book.printYear}</small></span><CheckCircle2/></button>)}</div>:<div className="academic-preview"><BookOpen/><span><b>{finalSubjectName}</b><small>برای این ترکیب، مبحث دلخواه هم قابل ثبت است.</small></span></div>}{error && <div className="form-error">{error}</div>}</div>}
        {((needsAcademicDetails && step === 3) || (!needsAcademicDetails && step === 2)) && <div className="form-panel"><div className="form-intro"><span><BookOpen /></span><div><h2>{type === 'other' ? 'عنوان فعالیت' : 'کدام فصل؟'}</h2><p>{type==='other'?finalSubjectName:(selectedBook?.title??`${finalSubjectName} · ${grade}`)}</p></div></div>{type === 'other' ? <div className="free-chapter"><label className="form-label">عنوان فعالیت</label><input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="مثلاً جلسه مشاوره" /></div> : <><div className="search-field"><Search /><input value={chapterSearch} onChange={e => setChapterSearch(e.target.value)} placeholder="جست‌وجو یا نوشتن مبحث دلخواه..." /></div><div className="chapter-list">{filteredChapters.map((c, i) => <button key={c} className={chapter === c ? 'selected' : ''} onClick={() => { setChapter(c); setError(''); }}><span>{toPersianDigits(i + 1)}</span><strong>{c}</strong>{chapter === c && <CheckCircle2 />}</button>)}{chapterSearch.trim()&&!chapters.includes(chapterSearch.trim())&&<button className={chapter===chapterSearch.trim()?'selected':''} onClick={()=>{setChapter(chapterSearch.trim());setError('')}}><span><Plus/></span><strong>ثبت «{chapterSearch.trim()}»</strong>{chapter===chapterSearch.trim()&&<CheckCircle2/>}</button>}</div></>}{error && <div className="form-error">{error}</div>}</div>}
        {step === totalSteps && <div className="form-panel"><div className="form-intro"><span><Clock3 /></span><div><h2>زمان‌بندی</h2><p>بازه‌ی فعالیت را دقیق مشخص کن.</p></div></div><div className="time-mode"><button className={mode === 'range' ? 'active' : ''} onClick={() => setMode('range')}>بازه زمانی</button><button className={mode === 'duration' ? 'active' : ''} onClick={() => setMode('duration')}>حجم زمانی</button></div><div className="time-fields"><label><span>زمان شروع</span><input type="time" value={start} onChange={e => setStart(e.target.value)} /></label>{mode === 'range' ? <label><span>زمان پایان</span><input type="time" value={end} onChange={e => setEnd(e.target.value)} /></label> : <label><span>مدت مطالعه</span><select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[30, 45, 60, 75, 90, 120, 180].map(m => <option key={m} value={m}>{durationLabel(m)}</option>)}</select></label>}</div><button className="more-settings" onClick={() => setMore(v => !v)}><span><MoreHorizontal /> تنظیمات بیشتر</span><ChevronDown className={more ? 'rotated' : ''} /></button>{more && <div className="more-fields"><label><span>منبع درسی</span><input value={resource} onChange={e => setResource(e.target.value)} placeholder="مثلاً کتاب درسی" /></label>{type === 'study' && <><label><span>نوع گزارش</span><select value={report} onChange={e => setReport(e.target.value)}><option>درسنامه و تست</option><option>مرور و جمع‌بندی</option><option>آزمون و تحلیل</option><option>حل تمرین</option></select></label><div className="question-row"><label><span>نوع سوال</span><select value={qType} onChange={e => setQType(e.target.value as 'test' | 'written')}><option value="test">تستی</option><option value="written">تشریحی</option></select></label><label><span>تعداد سوال</span><input type="number" min="0" value={qCount} onChange={e => setQCount(e.target.value)} placeholder="۰" /></label></div></>}<label><span>توضیحات</span><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="جزئیات مهم..." /></label><div><span className="field-caption"><Palette /> رنگ فعالیت</span><div className="color-picker">{COLORS.map(c => <button key={c} style={{ backgroundColor: c }} className={color === c ? 'selected' : ''} onClick={() => setColor(c)}>{color === c && <Check />}</button>)}</div></div></div>}{error && <div className="form-error">{error}</div>}</div>}
      </main>
      <footer>{step > 1 ? <button className="back" onClick={() => { setStep(s => s - 1); setError(''); }}><ChevronRight /> قبلی</button> : <span />}{step < totalSteps ? <button className="next" onClick={nextStep}>ادامه <ChevronLeft /></button> : <div className="save-actions"><button className="timer-save" onClick={() => save(true)}><TimerReset /> ذخیره و شروع</button><button className="save" onClick={() => save(false)}><Check /> تایید و ذخیره</button></div>}</footer>
    </div>
  </div>;
};
