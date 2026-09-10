import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, FileText, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import { NoteItem } from '../types/konkur';
import { toPersianDigits } from '../utils/jalali';

const colors=['peach','lavender','lilac','butter','sky','rose'];
const dateLabel=(iso:string)=>new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric'}).format(new Date(iso));

interface Props { notes:NoteItem[]; onAdd:(note:Omit<NoteItem,'id'|'createdAt'|'updatedAt'>)=>void; onUpdate:(note:NoteItem)=>void; onDelete:(id:string)=>void; onClose?:()=>void }

export const NotesView:React.FC<Props>=({notes,onAdd,onUpdate,onDelete,onClose})=>{
 const [query,setQuery]=useState(''); const [active,setActive]=useState<NoteItem|null>(null); const [creating,setCreating]=useState(false);
 const visible=useMemo(()=>notes.filter(n=>`${n.title} ${n.content}`.includes(query.trim())),[notes,query]);
 const openNew=()=>{setCreating(true);setActive({id:'draft',title:'یادداشت تازه',content:'',color:colors[notes.length%colors.length],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})};
 const save=(note:NoteItem)=>{if(!note.title.trim()&&!note.content.trim())return; if(note.id==='draft') onAdd({title:note.title.trim()||'یادداشت بدون عنوان',content:note.content,color:note.color}); else onUpdate({...note,title:note.title.trim()||'یادداشت بدون عنوان',updatedAt:new Date().toISOString()}); setActive(null);setCreating(false)};
 if(active)return <NoteEditor note={active} onBack={()=>{setActive(null);setCreating(false)}} onSave={save} onDelete={active.id==='draft'?undefined:()=>{onDelete(active.id);setActive(null)}}/>;
 return <section className="notes-page" dir="rtl">
  <header className="notes-header"><div><span className="notes-kicker"><Pin/> دفترچه شخصی</span><h1>یادداشت‌ها</h1><p>ایده‌ها، نکته‌ها و چیزهایی که نباید از ذهنت فرار کنند.</p></div>{onClose&&<button onClick={onClose} aria-label="بستن"><X/></button>}</header>
  <label className="notes-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجو در یادداشت‌ها..."/></label>
  {!visible.length?<div className="notes-empty"><FileText/><strong>{query?'چیزی پیدا نشد':'دفترت هنوز سفید است'}</strong><span>{query?'عنوان یا متن دیگری را امتحان کن.':'اولین کارتت را سنجاق کن و ایده‌ات را نگه دار.'}</span><button onClick={openNew}><Plus/> ساخت اولین یادداشت</button></div>:<div className="notes-board">{visible.map((note,i)=><button key={note.id} className={`note-card ${note.color}`} style={{'--note-i':i} as React.CSSProperties} onClick={()=>setActive(note)}><span className="note-pin"><Pin/></span><span className="note-index">{toPersianDigits(String(i+1).padStart(2,'0'))}</span><strong>{note.title}</strong><small>{note.content.trim()||'برای این یادداشت چیزی بنویس...'}</small><em>{dateLabel(note.updatedAt)}</em></button>)}</div>}
  <button className="notes-fab" onClick={openNew}><Plus/><span>یادداشت تازه</span></button>
 </section>;
};

const NoteEditor:React.FC<{note:NoteItem;onBack:()=>void;onSave:(note:NoteItem)=>void;onDelete?:()=>void}>=({note,onBack,onSave,onDelete})=>{
 const [draft,setDraft]=useState(note);
 return <section className={`note-editor ${draft.color}`} dir="rtl"><header><button onClick={onBack}><ArrowRight/></button><span>ویرایش یادداشت</span><button onClick={()=>onSave(draft)}><Check/></button></header><div className="editor-paper"><span className="editor-pin"><Pin/></span><input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="عنوان یادداشت" autoFocus/><div className="editor-rule"/><textarea value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})} placeholder="اینجا بنویس...\n\nایده‌ات را باز بگذار، بعداً مرتبش می‌کنیم."/><footer><span>ذخیره محلی و خصوصی</span>{onDelete&&<button onClick={onDelete}><Trash2/> حذف یادداشت</button>}</footer></div><button className="editor-save" onClick={()=>onSave(draft)}>ذخیره یادداشت <ChevronLeft/></button></section>;
};
