import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Info, Layers3, LockKeyhole, Pin, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react';
import { FLASHCARD_DECKS, FLASHCARD_SEEDS, FlashcardGrade, FlashcardLanguage } from '../data/flashcards';
import { toPersianDigits } from '../utils/jalali';

type Progress={known:string[];starred:string[]};
const KEY='konkur_flashcards_progress_v1';
const read=():Progress=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {known:[],starred:[]}}};
const save=(p:Progress)=>{try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}};
const fa=(n:number|string)=>toPersianDigits(String(n));
interface Props{onClose?:()=>void}

export const FlashcardsView:React.FC<Props>=({onClose})=>{
 const [deck,setDeck]=useState<FlashcardLanguage>('english'); const [grade,setGrade]=useState<FlashcardGrade|'همه'>('همه'); const [query,setQuery]=useState(''); const [index,setIndex]=useState(0); const [flipped,setFlipped]=useState(false); const [progress,setProgress]=useState<Progress>(read); const [showInfo,setShowInfo]=useState(false);
 const cards=useMemo(()=>FLASHCARD_SEEDS.filter(c=>c.language===deck&&(grade==='همه'||c.grade===grade)&&`${c.front} ${c.back} ${c.example}`.toLowerCase().includes(query.trim().toLowerCase())),[deck,grade,query]);
 const card=cards[index]??cards[0];
 const move=(delta:number)=>{if(!cards.length)return;setIndex((index+delta+cards.length)%cards.length);setFlipped(false)};
 const mark=(kind:'known'|'starred')=>{if(!card)return;const next={...progress,[kind]:progress[kind].includes(card.id)?progress[kind].filter(id=>id!==card.id):[...progress[kind],card.id]};setProgress(next);save(next)};
 const changeDeck=(d:FlashcardLanguage)=>{setDeck(d);setGrade('همه');setIndex(0);setFlipped(false)};
 return <section className="flashcards-page" dir="rtl">
  <header className="flashcards-header"><button onClick={onClose} aria-label="بازگشت"><ArrowRight/></button><div><span className="flashcards-kicker"><Sparkles/> یادگیری فاصله‌دار</span><h1>فلش‌کارت‌ها</h1><p>کوتاه، چرخشی، ماندگار.</p></div><button onClick={()=>setShowInfo(v=>!v)} aria-label="درباره بانک"><Info/></button></header>
  {showInfo&&<div className="flashcards-info"><Info/><span><b>منبع بانک</b><small>واژه‌ها بر اساس کتاب‌های رسمی انگلیسی، عربی و فارسی دوره دوم متوسطه و محورهای پرتکرار آزمون سامان‌دهی شده‌اند.</small></span><button onClick={()=>setShowInfo(false)}><X/></button></div>}
  <div className="flash-deck-stats"><div><Layers3/><b>{fa(FLASHCARD_SEEDS.length)}</b><small>کارت آفلاین</small></div><div><Star/><b>{fa(progress.starred.length)}</b><small>نشان‌دار</small></div><div><Check/><b>{fa(progress.known.length)}</b><small>بلدم</small></div></div>
  <div className="flash-decks">{FLASHCARD_DECKS.map(d=><button key={d.id} className={`${d.color} ${deck===d.id?'active':''}`} onClick={()=>changeDeck(d.id as FlashcardLanguage)}><span>{d.icon}</span><strong>{d.label}</strong><small>{d.description}</small></button>)}</div>
  <div className="flash-section-title"><div><span>دسته‌بندی پایه</span><small>واژه‌های همان سال را تمرین کن</small></div><div className="flash-grades">{(['همه','دهم','یازدهم','دوازدهم'] as const).map(g=><button key={g} className={grade===g?'active':''} onClick={()=>{setGrade(g);setIndex(0);setFlipped(false)}}>{g}</button>)}</div></div>
  <label className="flash-search"><Search/><input value={query} onChange={e=>{setQuery(e.target.value);setIndex(0);setFlipped(false)}} placeholder="جست‌وجوی واژه، ترجمه یا مثال..."/></label>
  {!card?<div className="flash-empty"><Layers3/><b>کارت دیگری اینجا نیست</b><span>فیلتر پایه یا جست‌وجو را تغییر بده.</span></div>:<>
   <div className={`flash-progress-line ${deck}`}><i style={{width:`${((index+1)/cards.length)*100}%`}}/></div>
   <div className={`flash-card-stage ${flipped?'flipped':''}`} onClick={()=>setFlipped(v=>!v)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setFlipped(v=>!v)}>
    <div className="flash-card-face flash-front"><span className="flash-card-corner"><Pin/><small>{card.grade}</small></span><span className="flash-card-kind">{card.deck}</span><strong>{card.front}</strong>{card.pronunciation&&<small>{card.pronunciation}</small>}<span className="flash-hint">برای دیدن ترجمه، کارت را برگردان</span><span className="flash-flip-icon"><RotateCcw/></span></div>
    <div className="flash-card-face flash-back"><span className="flash-card-corner"><Check/><small>پاسخ</small></span><span className="flash-card-kind">ترجمه و کاربرد</span><strong>{card.back}</strong><p>{card.example}</p><small className="flash-source">منبع: {card.source}</small></div>
   </div>
   <div className="flash-card-actions"><button className={progress.starred.includes(card.id)?'selected':''} onClick={e=>{e.stopPropagation();mark('starred')}}><Star/> {progress.starred.includes(card.id)?'نشان‌دار شد':'نشان‌دار کردن'}</button><span>{fa(index+1)} / {fa(cards.length)}</span><button className={progress.known.includes(card.id)?'selected':''} onClick={e=>{e.stopPropagation();mark('known')}}><Check/> {progress.known.includes(card.id)?'بلدم':'بلدم'}</button></div>
   <div className="flash-nav"><button onClick={()=>move(-1)}><ChevronRight/></button><span>برای کارت بعدی ورق بزن</span><button onClick={()=>move(1)}><ChevronLeft/></button></div>
  </>}
  <div className="flash-footnote"><LockKeyhole/> پیشرفتت فقط روی همین دستگاه ذخیره می‌شود.</div>
 </section>;
};
