import React, { useMemo, useState } from 'react';
import { Award, BarChart3, BookOpen, Check, ChevronDown, Plus, RotateCcw, Target, Trash2, Trophy } from 'lucide-react';
import { SubjectItem, TestDrill } from '../types/konkur';
import { computeDrillPercent } from '../utils/storage';
import { toPersianDigits } from '../utils/jalali';

interface Props { drills: TestDrill[]; subjects: SubjectItem[] }
type Grade = { id: string; name: string; score: string; coefficient: string };
const uid=()=>`grade-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const pct=(v:number)=>Math.round(v*10)/10;

export const ReportCardView:React.FC<Props>=({drills,subjects})=>{
 const [grades,setGrades]=useState<Grade[]>(()=>{try{return JSON.parse(localStorage.getItem('konkur_grades_v1')||'[]')}catch{return []}});
 const [name,setName]=useState(''); const [score,setScore]=useState(''); const [coef,setCoef]=useState('1');
 const saveGrades=(next:Grade[])=>{setGrades(next);localStorage.setItem('konkur_grades_v1',JSON.stringify(next))};
 const weighted=useMemo(()=>{const rows=grades.filter(g=>Number(g.score)>0);const den=rows.reduce((n,g)=>n+Math.max(1,Number(g.coefficient)||1),0);return den?rows.reduce((n,g)=>n+Number(g.score)*Math.max(1,Number(g.coefficient)||1),0)/den:0},[grades]);
 const examAverage=drills.length?drills.reduce((n,d)=>n+d.percent,0)/drills.length:0; const best=drills.length?Math.max(...drills.map(d=>d.percent)):0;
 const add=()=>{if(!name.trim()||!score)return;saveGrades([...grades,{id:uid(),name:name.trim(),score,coefficient:coef||'1'}]);setName('');setScore('');setCoef('1')};
 return <section className="report-page" dir="rtl">
  <header className="report-header"><div><span className="report-kicker"><Award/> ارزیابی عملکرد</span><h1>کارنامه و تراز</h1><p>نمره‌ها و درصد آزمون‌هایت را یک‌جا ببین.</p></div><div className="report-badge"><Trophy/></div></header>
  <div className="report-hero"><div><span>معدل فعلی</span><strong>{weighted?toPersianDigits(weighted.toFixed(2)):'--'}</strong><small>{grades.length?'بر اساس نمره‌های ثبت‌شده':'هنوز نمره‌ای ثبت نشده'}</small></div><div className="report-score-ring"><span>{toPersianDigits(pct(examAverage))}٪</span><small>میانگین آزمون</small></div></div>
  <div className="report-stats"><div><BarChart3/><span>بهترین درصد</span><strong>{toPersianDigits(pct(best))}٪</strong></div><div><Target/><span>تعداد آزمون</span><strong>{toPersianDigits(drills.length)}</strong></div><div><BookOpen/><span>تعداد درس</span><strong>{toPersianDigits(grades.length)}</strong></div></div>
  <div className="report-section"><div className="report-title"><div><h2>معدل دروس</h2><small>نمره را از ۲۰ وارد کن</small></div><button onClick={()=>{if(confirm('همه نمره‌ها پاک شوند؟'))saveGrades([])}}><RotateCcw/> پاک‌سازی</button></div>
   <div className="report-add"><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام درس" list="report-subjects"/><datalist id="report-subjects">{subjects.map(s=><option key={s.id} value={s.name}/>)}</datalist><input type="number" min="0" max="20" step=".25" value={score} onChange={e=>setScore(e.target.value)} placeholder="نمره /۲۰"/><input className="coef" type="number" min="1" max="5" value={coef} onChange={e=>setCoef(e.target.value)} aria-label="ضریب"/><button onClick={add}><Plus/> افزودن</button></div>
   {grades.length?<div className="grade-list">{grades.map(g=><div key={g.id}><span>{g.name}</span><small>ضریب {toPersianDigits(g.coefficient)}</small><strong>{toPersianDigits(g.score)} / ۲۰</strong><button onClick={()=>saveGrades(grades.filter(x=>x.id!==g.id))}><Trash2/></button></div>)}</div>:<div className="report-empty"><BookOpen/><span>نمره‌های دروس را اضافه کن تا معدل محاسبه شود.</span></div>}
  </div>
  <div className="report-section"><div className="report-title"><div><h2>درصد آزمون‌ها</h2><small>فرمول: (۳×صحیح − غلط) ÷ (۳×کل) × ۱۰۰</small></div><span className="formula-chip">منفی دارد</span></div>
   {drills.length?<div className="exam-list">{[...drills].sort((a,b)=>b.timestamp-a.timestamp).map(d=><div key={d.id}><div className="exam-dot"/><div><strong>{d.subjectName}</strong><small>{toPersianDigits(d.correct)} صحیح، {toPersianDigits(d.wrong)} غلط، {toPersianDigits(d.totalQuestions)} سؤال</small></div><b className={d.percent>=50?'good':''}>{toPersianDigits(pct(d.percent))}٪</b></div>)}</div>:<div className="report-empty"><BarChart3/><span>نتیجه تست‌زنی ثبت نشده. از بخش تست‌زنی سرعتی شروع کن.</span></div>}
  </div>
 </section>
};
