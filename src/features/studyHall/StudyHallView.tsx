import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair, ArrowRight, BarChart3, BookOpen, Building2, Camera, Check, ChevronLeft, LockKeyhole, MessageCircle, Trophy, UserPlus, Plus, Settings2, XCircle,
  CircleStop, Clock3, DoorOpen, Map, Pause, Play, QrCode, RefreshCw, ScanLine,
  ShieldCheck, Sparkles, UserRound, Users, Wrench, X,
} from 'lucide-react';
import { SubjectItem } from '../../types/konkur';
import { celebrateAchievement } from '../../utils/celebrate';
import { LOCAL_STUDENT_ID, localStudyHallRepository } from './repository';
import { QrValidationResult, Seat, SeatStatus, StudyHallLocation, StudyHallSession, StudyHallSnapshot, VirtualStudyRoom } from './types';

type Experience = 'virtual' | 'physical';
type PhysicalView = 'student' | 'manager';
type ScanState = 'idle' | 'scanning' | 'checking' | 'error';

interface Props {
  subjects: SubjectItem[];
  dailyGoalMinutes: number;
  todayMinutes: number;
  streak: number;
  onRecordStudy: (subjectId: string, subjectName: string, minutes: number, mode: Experience) => void;
}

const fa = (value: number | string) => String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const pad = (value: number) => String(value).padStart(2, '0');
const formatDuration = (seconds: number) => `${fa(pad(Math.floor(seconds / 3600)))}:${fa(pad(Math.floor((seconds % 3600) / 60)))}:${fa(pad(seconds % 60))}`;
const minuteLabel = (seconds: number) => `${fa(Math.floor(seconds / 3600))} ساعت و ${fa(Math.floor((seconds % 3600) / 60))} دقیقه`;
const nowIso = () => new Date().toISOString();
const uid = () => `hall-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const seatLabels: Record<SeatStatus, string> = {
  available: 'آزاد', occupied: 'مشغول', reserved: 'رزرو', 'my-seat': 'صندلی من', disabled: 'غیرفعال', maintenance: 'تعمیرات',
};

export const StudyHallView: React.FC<Props> = ({ subjects, dailyGoalMinutes, todayMinutes, streak, onRecordStudy }) => {
  const [experience, setExperience] = useState<Experience>('virtual');
  const [physicalView, setPhysicalView] = useState<PhysicalView>('student');
  const [snapshot, setSnapshot] = useState<StudyHallSnapshot | null>(null);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [activeSession, setActiveSession] = useState<StudyHallSession | null>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [attendanceSeconds, setAttendanceSeconds] = useState(0);
  const studySecondsRef = useRef(0);
  const attendanceSecondsRef = useRef(0);
  const clockRef = useRef(Date.now());
  const [summary, setSummary] = useState<StudyHallSession | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [validatedQr, setValidatedQr] = useState<QrValidationResult | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [locations, setLocations] = useState<StudyHallLocation[]>([]);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const reload = async () => {
    const data = await localStudyHallRepository.getSnapshot();
    setSnapshot(data);
    const open = data.sessions.find(s => s.studentId === LOCAL_STUDENT_ID && (s.status === 'active' || s.status === 'paused'));
    if (open) {
      setActiveSession(open);
      setExperience(open.mode);
      setStudySeconds(open.studySeconds); studySecondsRef.current = open.studySeconds;
      setAttendanceSeconds(open.attendanceSeconds); attendanceSecondsRef.current = open.attendanceSeconds;
    }
  };

  useEffect(() => { void reload(); void localStudyHallRepository.listLocations().then(setLocations); }, []);
  useEffect(() => {
    if (!subjects.some(s => s.id === subjectId)) setSubjectId(subjects[0]?.id ?? '');
  }, [subjects, subjectId]);

  useEffect(() => {
    if (!activeSession) return;
    clockRef.current = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - clockRef.current) / 1000);
      if (elapsed < 1) return;
      clockRef.current += elapsed * 1000;
      if (activeSession.mode === 'physical') {
        attendanceSecondsRef.current += elapsed;
        setAttendanceSeconds(attendanceSecondsRef.current);
      }
      if (activeSession.status === 'active') {
        studySecondsRef.current += elapsed;
        setStudySeconds(studySecondsRef.current);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [activeSession?.id, activeSession?.status, activeSession?.mode]);

  useEffect(() => {
    if (!activeSession) return;
    const persist = () => void localStudyHallRepository.saveSession({ ...activeSession, studySeconds: studySecondsRef.current, attendanceSeconds: attendanceSecondsRef.current, updatedAt: nowIso(), syncStatus: 'pending' });
    const timer = window.setInterval(persist, 15000);
    const onHidden = () => { if (document.visibilityState === 'hidden') persist(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', persist);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onHidden); window.removeEventListener('pagehide', persist); };
  }, [activeSession?.id, activeSession?.status]);

  const selectedSubject = subjects.find(s => s.id === subjectId) ?? subjects[0];
  const activeSubject = subjects.find(s => s.id === activeSession?.subjectId);
  const goalPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoalMinutes)) * 100));
  const occupied = snapshot?.seats.filter(s => s.status === 'occupied').length ?? 0;
  const available = snapshot?.seats.filter(s => ['available', 'my-seat'].includes(s.status)).length ?? 0;
  const mySeat = snapshot?.seats.find(s => s.assignedStudentId === LOCAL_STUDENT_ID);
  const selectLocation = async (location: StudyHallLocation) => { setSnapshot(await localStudyHallRepository.selectLocation(location.branch.id, location.hall.id)); setLocationPickerOpen(false); setSelectedSeat(null); };

  const startSession = async (mode: Experience, qr?: QrValidationResult, roomId?: string) => {
    if (!selectedSubject) return;
    const timestamp = nowIso();
    const session: StudyHallSession = {
      id: uid(), studentId: LOCAL_STUDENT_ID, roomId,
      organizationId: qr?.organization?.id, branchId: qr?.branch?.id, hallId: qr?.hall?.id,
      sectionId: qr?.section?.id, seatId: qr?.seat?.id, qrId: qr?.qr?.id,
      subjectId: selectedSubject.id, subjectName: selectedSubject.name, mode,
      checkInTime: timestamp, attendanceSeconds: 0, studySeconds: 0, status: 'active',
      date: timestamp.slice(0, 10), syncStatus: 'pending', createdAt: timestamp, updatedAt: timestamp,
    };
    await localStudyHallRepository.saveSession(session);
    if (mode === 'physical' && qr?.seat) {
      await localStudyHallRepository.updateSeat({ ...qr.seat, status: 'occupied', occupantName: 'شما', subjectName: selectedSubject.name, checkedInAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) });
    }
    studySecondsRef.current = 0; attendanceSecondsRef.current = 0; clockRef.current = Date.now();
    setSummary(null); setStudySeconds(0); setAttendanceSeconds(0); setActiveSession(session); setValidatedQr(null); setScanState('idle');
    await reload();
  };

  const togglePause = async () => {
    if (!activeSession) return;
    const next = { ...activeSession, studySeconds: studySecondsRef.current, attendanceSeconds: attendanceSecondsRef.current, status: activeSession.status === 'active' ? 'paused' : 'active', updatedAt: nowIso(), syncStatus: 'pending' } as StudyHallSession;
    setActiveSession(next);
    await localStudyHallRepository.saveSession(next);
  };

  const finishSession = async () => {
    if (!activeSession) return;
    const finalStudySeconds = studySecondsRef.current;
    const finalAttendanceSeconds = activeSession.mode === 'physical' ? attendanceSecondsRef.current : finalStudySeconds;
    const done: StudyHallSession = { ...activeSession, studySeconds: finalStudySeconds, attendanceSeconds: finalAttendanceSeconds, checkOutTime: nowIso(), status: 'completed', syncStatus: 'pending', updatedAt: nowIso() };
    await localStudyHallRepository.saveSession(done);
    if (done.seatId && snapshot) {
      const seat = snapshot.seats.find(s => s.id === done.seatId);
      if (seat) await localStudyHallRepository.updateSeat({ ...seat, status: seat.assignedStudentId === LOCAL_STUDENT_ID ? 'my-seat' : 'available', occupantName: undefined, subjectName: undefined, checkedInAt: undefined });
    }
    if (finalStudySeconds >= 30) {
      onRecordStudy(done.subjectId, done.subjectName, Math.max(1, Math.round(finalStudySeconds / 60)), done.mode);
      if (done.roomId) await localStudyHallRepository.recordRoomStudy(done.roomId, LOCAL_STUDENT_ID, finalStudySeconds);
    }
    celebrateAchievement();
    setSummary(done); setActiveSession(null); studySecondsRef.current = 0; attendanceSecondsRef.current = 0; setStudySeconds(0); setAttendanceSeconds(0); await reload();
  };

  const validateToken = async (token: string) => {
    setScanState('checking'); setScanMessage('در حال بررسی دسترسی و وضعیت صندلی...');
    const result = await localStudyHallRepository.validateQr({ studentId: LOCAL_STUDENT_ID, token, now: nowIso() });
    if (result.valid) { setValidatedQr(result); setScanState('idle'); setScanMessage(''); stopCamera(); }
    else { setScanState('error'); setScanMessage(result.message); }
  };

  const stopCamera = () => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
  };

  const openScanner = async () => {
    setScanState('scanning'); setScanMessage('QR روی میز را داخل کادر بگیر.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!Detector) { setScanMessage('اسکن خودکار روی این دستگاه در دسترس نیست؛ از کد آزمایشی پایین استفاده کن.'); return; }
      const detector = new Detector({ formats: ['qr_code'] });
      const detect = async () => {
        if (!videoRef.current || scanState === 'checking') return;
        try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) { await validateToken(codes[0].rawValue); return; } } catch {}
        scanFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch { setScanState('error'); setScanMessage('دسترسی دوربین فعال نشد. می‌توانی با کد آزمایشی ادامه بدهی.'); }
  };

  useEffect(() => () => stopCamera(), []);

  if (!snapshot) return <div className="hall-loading" dir="rtl"><span /><span /><span /></div>;

  if (activeSession) {
    const physical = activeSession.mode === 'physical';
    return <section className={`hall-session ${physical ? 'is-physical' : ''}`} dir="rtl">
      <div className="hall-session-top">
        <span className="hall-live"><i /> {physical ? 'حضور ثبت شده' : 'نشست در حال اجرا'}</span>
        <span>{physical ? `صندلی ${fa(snapshot.seats.find(s => s.id === activeSession.seatId)?.number ?? '')}` : 'سالن مجازی'}</span>
      </div>
      <div className="hall-focus-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="hall-session-core">
        <span>{activeSession.status === 'paused' ? 'مکث' : activeSubject?.name ?? activeSession.subjectName}</span>
        <strong dir="ltr">{formatDuration(studySeconds)}</strong>
        <small>{activeSession.status === 'paused' ? 'تایمر مطالعه متوقف است' : 'زمان مطالعه مفید'}</small>
      </div>
      {physical && <div className="hall-attendance"><Clock3 /><span>حضور در سالن</span><strong dir="ltr">{formatDuration(attendanceSeconds)}</strong></div>}
      <div className="hall-session-actions">
        <button className="hall-control secondary" onClick={togglePause}>{activeSession.status === 'active' ? <Pause /> : <Play />}<span>{activeSession.status === 'active' ? 'مکث' : 'ادامه'}</span></button>
        <button className="hall-control primary" onClick={finishSession}><CircleStop /><span>پایان مطالعه</span></button>
      </div>
      <p className="hall-sync-note">ذخیره خودکار فعال است؛ قطع اینترنت زمانت را از بین نمی‌برد.</p>
    </section>;
  }

  if (summary) {
    return <section className="hall-summary-page" dir="rtl">
      <button className="hall-back" onClick={() => setSummary(null)}><ArrowRight /></button>
      <span className="hall-success-mark"><Check /></span>
      <p>نشست با موفقیت ثبت شد</p>
      <h2>{summary.subjectName}</h2>
      <strong dir="ltr">{formatDuration(summary.studySeconds)}</strong>
      <div className="hall-summary-lines">
        <span><BookOpen /> مطالعه مفید <b>{minuteLabel(summary.studySeconds)}</b></span>
        {summary.mode === 'physical' && <span><DoorOpen /> حضور در سالن <b>{minuteLabel(summary.attendanceSeconds)}</b></span>}
        <span><RefreshCw /> همگام‌سازی <b>در صف ارسال</b></span>
      </div>
      <button className="hall-primary-action" onClick={() => setSummary(null)}>بازگشت به سالن</button>
    </section>;
  }

  return <section className="study-hall" dir="rtl">
    <header className="hall-heading">
      <div><span><Sparkles /> فضای مطالعه پازل</span><h1>سالن مطالعه</h1></div>
      <button onClick={() => setPhysicalView(v => v === 'student' ? 'manager' : 'student')} aria-label="تغییر نمای کاربری">
        {physicalView === 'student' ? <ShieldCheck /> : <UserRound />}
      </button>
    </header>

    <div className="hall-experience-switch" role="tablist">
      <button className={experience === 'virtual' ? 'active' : ''} onClick={() => setExperience('virtual')}><Clock3 /> مجازی</button>
      <button className={experience === 'physical' ? 'active' : ''} onClick={() => setExperience('physical')}><Building2 /> حضوری</button>
    </div>

    {experience === 'virtual' && <VirtualRooms subjects={subjects} selectedSubjectId={subjectId} onSubjectChange={setSubjectId} onStart={(roomId) => void startSession('virtual', undefined, roomId)} />}

    {experience === 'physical' && physicalView === 'student' && <div className="hall-physical-student">
      <div className="hall-location-line"><div><span><Building2 /></span><p><b>{snapshot.branch.name}</b><small>{snapshot.hall.name}، {snapshot.sections[0].floorName}</small></p></div><button onClick={() => setLocationPickerOpen(true)}>تغییر <ChevronLeft /></button></div>
      {mySeat && <div className="hall-my-seat"><div><span>صندلی ثابت من</span><strong>{fa(mySeat.number)}</strong></div><p>{snapshot.sections[0].name}<small>آماده برای ورود</small></p><Armchair /></div>}
      <button className="hall-scan-action" onClick={openScanner}><span><ScanLine /></span><div><strong>اسکن QR صندلی</strong><small>ورود و شروع نشست حضوری</small></div><ChevronLeft /></button>
      <div className="hall-capacity"><div><b>{fa(available)}</b><span>صندلی آزاد</span></div><div className="hall-capacity-track"><i style={{ transform: `scaleX(${occupied / Math.max(1, snapshot.seats.length)})` }} /></div><div><b>{fa(occupied)}</b><span>در حال مطالعه</span></div></div>
      <div className="hall-mini-map-head"><div><span>وضعیت سالن</span><small>به‌روزرسانی لحظه‌ای محلی</small></div><Map /></div>
      <div className="hall-mini-map">{snapshot.seats.map(seat => <i key={seat.id} className={seat.status} title={`صندلی ${seat.number}`} />)}</div>
    </div>}

    {experience === 'physical' && physicalView === 'manager' && <ManagerHall snapshot={snapshot} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} onUpdated={reload} />}

    {locationPickerOpen && <div className="hall-sheet-shell" role="dialog" aria-modal="true" onClick={() => setLocationPickerOpen(false)}><div className="hall-sheet location-picker" onClick={e => e.stopPropagation()}><header><div><span>انتخاب محل مطالعه</span><small>شعبه و پانسیون موردنظرت را انتخاب کن</small></div><button onClick={() => setLocationPickerOpen(false)}><X /></button></header><div className="location-options">{locations.map(location => <button key={location.hall.id} className={snapshot.branch.id === location.branch.id && snapshot.hall.id === location.hall.id ? 'selected' : ''} onClick={() => void selectLocation(location)}><span><Building2 /></span><div><b>{location.branch.name}</b><small>{location.hall.name}، {location.branch.address}</small><em>{location.hall.opensAt} تا {location.hall.closesAt}</em></div><ChevronLeft /></button>)}</div></div></div>}

    {(scanState !== 'idle' || validatedQr) && <div className="hall-sheet-shell" role="dialog" aria-modal="true">
      <div className="hall-sheet">
        <header><div><span>{validatedQr ? 'تأیید ورود' : 'اسکن صندلی'}</span><small>{validatedQr ? 'اطلاعات QR با سالن تطبیق دارد' : 'دوربین را روبه‌روی کد نگه دار'}</small></div><button onClick={() => { stopCamera(); setScanState('idle'); setValidatedQr(null); }}><X /></button></header>
        {!validatedQr && <><div className="hall-camera"><video ref={videoRef} muted playsInline /><span><i /><i /><i /><i /></span><ScanLine /></div><p className={scanState === 'error' ? 'error' : ''}>{scanState === 'checking' && <RefreshCw className="spin" />}{scanMessage}</p><button className="hall-demo-code" onClick={() => void validateToken(`PZL:${mySeat?.id ?? 'seat-05'}:v1`)}><QrCode /> استفاده از QR آزمایشی صندلی {fa(mySeat?.number ?? '۰۵')}</button></>}
        {validatedQr?.seat && <div className="hall-checkin-confirm"><span className="hall-verified"><ShieldCheck /></span><strong>صندلی {fa(validatedQr.seat.number)}</strong><p>{validatedQr.branch?.name}، {validatedQr.hall?.name}<br />{validatedQr.section?.floorName}، {validatedQr.section?.name}</p><label className="hall-subject-select"><span>درس این نشست</span><select value={subjectId} onChange={e => setSubjectId(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="hall-primary-action" onClick={() => void startSession('physical', validatedQr)}><Check /> ثبت ورود و شروع</button></div>}
      </div>
    </div>}
  </section>;
};

const orbitMembers=[
  {name:'آرین',time:'۰۳:۲۱:۵۵',image:'/avatars/student-1.webp',status:'تمرکز'},
  {name:'سارا',time:'۰۲:۴۸:۰۱',image:'/avatars/student-2.webp',status:'تمرکز'},
  {name:'مانی',time:'۰۱:۳۵:۲۰',image:'/avatars/student-3.webp',status:'مرور'},
  {name:'رها',time:'۰۰:۵۹:۱۷',image:'/avatars/student-4.webp',status:'تمرکز'},
  {name:'نیما',time:'۰۴:۲۷:۵۷',image:'/avatars/student-5.webp',status:'استراحت'},
  {name:'یلدا',time:'۰۲:۰۹:۴۰',image:'/avatars/student-6.webp',status:'تمرکز'},
];
const roomDuration=(seconds:number)=>formatDuration(seconds);
const VirtualRooms: React.FC<{ subjects: SubjectItem[]; selectedSubjectId: string; onSubjectChange: (value: string) => void; onStart: (roomId:string) => void }> = ({ subjects, selectedSubjectId, onSubjectChange, onStart }) => {
  const [mode,setMode]=useState<'all'|'mine'>('all');
  const [rooms,setRooms]=useState<VirtualStudyRoom[]>([]);
  const [roomId,setRoomId]=useState<string|null>(null);
  const [createOpen,setCreateOpen]=useState(false);
  const [manageOpen,setManageOpen]=useState(false);
  const [name,setName]=useState(''); const [handle,setHandle]=useState(''); const [category,setCategory]=useState('مطالعه گروهی'); const [capacity,setCapacity]=useState(20); const [isPrivate,setIsPrivate]=useState(true); const [memberName,setMemberName]=useState(''); const [error,setError]=useState('');
  const reload=async()=>setRooms(await localStudyHallRepository.listVirtualRooms());
  useEffect(()=>{void reload()},[]);
  const room=rooms.find(r=>r.id===roomId)??null;
  const membership=room?.members.find(m=>m.id===LOCAL_STUDENT_ID);
  const activeMembers=(r:VirtualStudyRoom)=>r.members.filter(m=>m.status==='active');
  const canManage=Boolean(room&&(room.ownerId===LOCAL_STUDENT_ID||membership?.role==='manager'));
  const enter=async()=>{if(!room)return; if(!membership||membership.status==='rejected'){const updated=await localStudyHallRepository.requestRoomMembership(room.id,LOCAL_STUDENT_ID,'شما'); setRooms(v=>v.map(r=>r.id===updated.id?updated:r)); if(updated.isPrivate)return;} if(membership?.status==='pending')return; onStart(room.id)};
  const create=async()=>{setError(''); try{const clean=handle.trim().replace(/^@/,''); if(name.trim().length<3||clean.length<3){setError('نام و شناسه حداقل ۳ حرف باشند.');return} const created=await localStudyHallRepository.createVirtualRoom({name:name.trim(),handle:`@${clean}`,category,capacity,isPrivate,ownerId:LOCAL_STUDENT_ID,ownerName:'شما'}); setRooms(v=>[created,...v]); celebrateAchievement(); setRoomId(created.id); setCreateOpen(false); setName('');setHandle('');}catch(e){setError(e instanceof Error?e.message:'ساخت اتاق انجام نشد.')}};
  const addMember=async()=>{if(!room||!memberName.trim())return; const updated=await localStudyHallRepository.addRoomMember(room.id,`member-${Date.now()}`,memberName.trim()); setRooms(v=>v.map(r=>r.id===updated.id?updated:r)); setMemberName('')};
  const review=async(id:string,approve:boolean)=>{if(!room)return; const updated=await localStudyHallRepository.reviewRoomMembership(room.id,id,approve); setRooms(v=>v.map(r=>r.id===updated.id?updated:r))};
  const visible=rooms.filter(r=>mode==='all'||r.members.some(m=>m.id===LOCAL_STUDENT_ID&&m.status==='active'));
  if(room) {const members=activeMembers(room); const pending=room.members.filter(m=>m.status==='pending'); const leaderboard=[...members].sort((a,b)=>b.studySeconds-a.studySeconds); return <div className="virtual-room-detail">
    <button className="virtual-back" onClick={()=>{setRoomId(null);setManageOpen(false)}}><ArrowRight/><span>بازگشت به اتاق‌ها</span></button>
    <div className={`virtual-profile-hero ${room.pattern}`}><div className="virtual-hero-actions">{canManage&&<button onClick={()=>setManageOpen(v=>!v)} aria-label="مدیریت اتاق"><Settings2/></button>}<button><ChevronLeft/></button></div><div className="virtual-room-avatar">{room.name.slice(0,1)}<i><Trophy/></i></div><span className="virtual-handle" dir="ltr">{room.handle}</span><h2>{room.name}</h2><div className="virtual-profile-tabs"><button className="active">جزئیات</button><button>اتاق مطالعه</button><button>رتبه‌بندی</button></div></div>
    {manageOpen&&canManage&&<div className="virtual-manager-panel"><header><div><b>مدیریت اتاق</b><small>{fa(pending.length)} درخواست در انتظار</small></div><button onClick={()=>setManageOpen(false)}><X/></button></header><label><UserPlus/><input value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="نام دانش‌آموز برای افزودن"/><button onClick={()=>void addMember()}>افزودن</button></label>{pending.map(m=><div className="virtual-request-row" key={m.id}><span>{m.name}</span><button className="approve" onClick={()=>void review(m.id,true)}><Check/></button><button onClick={()=>void review(m.id,false)}><XCircle/></button></div>)}</div>}
    <div className="virtual-quote"><span>❝</span><p>با هم شروع می‌کنیم، با تمرکز ادامه می‌دیم.</p></div>
    <div className="virtual-room-facts"><span><Users/><b>{fa(members.length)}</b> نفر</span><span><Clock3/><b>{roomDuration(members.reduce((n,m)=>n+m.studySeconds,0))}</b> مطالعه ثبت‌شده</span></div>
    <div className="virtual-live-map"><div className="virtual-orbit-line orbit-one"/><div className="virtual-orbit-line orbit-two"/><div className="virtual-live-center"><span className="virtual-pulse"/><strong>{fa(members.length)}</strong><span>عضو فعال</span><small>زمان‌ها برای رتبه‌بندی ذخیره می‌شوند</small></div>{orbitMembers.map((member,i)=><button key={member.name} className={`virtual-node node-${i}`} aria-label={`${member.name}، ${member.status}`}><i><img src={member.image} alt=""/></i><b>{member.name}</b><small>{leaderboard[i]?roomDuration(leaderboard[i].studySeconds):member.time}</small></button>)}</div>
    <div className="virtual-leaderboard">{leaderboard.slice(0,5).map((m,i)=><div key={m.id}><b>{fa(i+1)}</b><span>{m.name}</span><strong dir="ltr">{roomDuration(m.studySeconds)}</strong></div>)}</div>
    <label className="hall-subject-select virtual-subject"><span>درس این نشست</span><select value={selectedSubjectId} onChange={e=>onSubjectChange(e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {membership?.status==='pending'?<div className="virtual-requested"><Check/><span><b>درخواستت ثبت شد</b><small>با تأیید مدیر اتاق، ورود برایت باز می‌شود.</small></span></div>:<button className="hall-primary-action virtual-join" onClick={()=>void enter()}>{room.isPrivate&&membership?.status!=='active'?<><LockKeyhole/> درخواست عضویت</>:<><Play/> ورود و شروع مطالعه</>}</button>}
  </div>}
  return <div className="virtual-rooms" dir="rtl">
    <div className="virtual-create-line"><button onClick={()=>setCreateOpen(true)}><Plus/> ساخت اتاق</button></div>
    <div className="virtual-tabs"><button className={mode==='all'?'active':''} onClick={()=>setMode('all')}><Users/> همه اتاق‌ها</button><button className={mode==='mine'?'active':''} onClick={()=>setMode('mine')}><ShieldCheck/> اتاق‌های من</button></div>
    <div className="virtual-featured"><div className="virtual-featured-pattern"><Trophy/></div><div><span>پیشنهاد امروز پازل</span><strong>اتاق‌های پرتلاش‌ها</strong><small>با آدم‌هایی که همین حالا مشغول‌اند همراه شو</small></div><ChevronLeft/></div>
    <div className="virtual-list-heading"><div><span>اتاق‌های مطالعه کاربران</span><small>{fa(visible.length)} اتاق فعال</small></div></div>
    <div className="virtual-room-list">{visible.map(item=>{const members=activeMembers(item);return <button key={item.id} className={`virtual-room-card ${item.accent} ${item.pattern}`} onClick={()=>setRoomId(item.id)}><div className="virtual-card-art"><span className="virtual-card-avatar">{item.name.slice(0,1)}</span><span className="virtual-card-handle" dir="ltr">{item.handle}</span>{item.isPrivate&&<LockKeyhole/>}</div><div className="virtual-card-body"><div><strong>{item.name}</strong><small>{item.category}</small></div><span className="virtual-card-score">{fa(members.length)} | {fa(item.capacity)}</span></div><div className="virtual-card-foot"><span><i/> {fa(members.length)} عضو</span><span><MessageCircle/> گفتگو</span></div></button>})}</div>
    {createOpen&&<div className="hall-sheet-shell" role="dialog" aria-modal="true" onClick={()=>setCreateOpen(false)}><div className="hall-sheet virtual-create-sheet" onClick={e=>e.stopPropagation()}><header><div><span>ساخت اتاق مطالعه</span><small>آماده اتصال مستقیم به API سرور</small></div><button onClick={()=>setCreateOpen(false)}><X/></button></header><label><span>نام اتاق</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً جمع‌بندی دوازدهم"/></label><label><span>شناسه یکتا</span><input dir="ltr" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@room_id"/></label><label><span>موضوع</span><input value={category} onChange={e=>setCategory(e.target.value)}/></label><label><span>ظرفیت</span><input type="number" min="2" max="100" value={capacity} onChange={e=>setCapacity(Math.max(2,Math.min(100,Number(e.target.value))))}/></label><button className={`virtual-private-toggle ${isPrivate?'active':''}`} onClick={()=>setIsPrivate(v=>!v)}><LockKeyhole/><span>{isPrivate?'خصوصی، ورود با تأیید مدیر':'عمومی، ورود آزاد'}</span></button>{error&&<p className="virtual-form-error">{error}</p>}<button className="hall-primary-action" onClick={()=>void create()}><Plus/> ساخت اتاق</button></div></div>}
  </div>
};
const BellIcon: React.FC<{className?:string}> = ({className}) => <span className={className}>♧</span>;

const ManagerHall: React.FC<{ snapshot: StudyHallSnapshot; selectedSeat: Seat | null; setSelectedSeat: (seat: Seat | null) => void; onUpdated: () => Promise<void> }> = ({ snapshot, selectedSeat, setSelectedSeat, onUpdated }) => {
  const occupied = snapshot.seats.filter(s => s.status === 'occupied').length;
  const setStatus = async (status: SeatStatus) => { if (!selectedSeat) return; await localStudyHallRepository.updateSeat({ ...selectedSeat, status, occupantName: undefined, subjectName: undefined, checkedInAt: undefined }); setSelectedSeat(null); await onUpdated(); };
  const regenerate = async () => { if (!selectedSeat) return; await localStudyHallRepository.regenerateSeatQr(selectedSeat.id); setSelectedSeat(null); await onUpdated(); };
  return <div className="hall-manager">
    <div className="hall-manager-title"><div><span><i /> نمای زنده</span><h2>{snapshot.hall.name}</h2><small>{snapshot.branch.name}، {snapshot.sections[0].name}</small></div><button><Wrench /> مدیریت</button></div>
    <div className="hall-manager-metrics"><span><b>{fa(occupied)}</b> حاضر</span><span><b>{fa(snapshot.seats.length - occupied)}</b> خالی</span><span><b>{fa(Math.round(occupied / snapshot.seats.length * 100))}٪</b> ظرفیت</span></div>
    <div className="hall-map-legend">{(['available','occupied','reserved','maintenance'] as SeatStatus[]).map(s => <span key={s}><i className={s} />{seatLabels[s]}</span>)}</div>
    <div className="hall-live-map"><span className="hall-map-door">ورودی</span>{snapshot.seats.map(seat => <button key={seat.id} className={`${seat.status} ${selectedSeat?.id === seat.id ? 'selected' : ''}`} onClick={() => setSelectedSeat(seat)}><Armchair /><b>{fa(seat.number)}</b>{seat.status === 'occupied' && <i />}</button>)}</div>
    {selectedSeat && <div className="hall-seat-inspector"><header><div><span>صندلی {fa(selectedSeat.number)}</span><small>{seatLabels[selectedSeat.status]}</small></div><button onClick={() => setSelectedSeat(null)}><X /></button></header>{selectedSeat.occupantName ? <div className="hall-occupant"><UserRound /><p><b>{selectedSeat.occupantName}</b><small>ورود {fa(selectedSeat.checkedInAt ?? '')}، {selectedSeat.subjectName}</small></p></div> : <p className="hall-seat-empty">این صندلی کاربر فعال ندارد.</p>}<div className="hall-seat-actions"><button onClick={() => void setStatus(selectedSeat.status === 'maintenance' ? 'available' : 'maintenance')}><Wrench />{selectedSeat.status === 'maintenance' ? 'فعال‌سازی' : 'تعمیرات'}</button><button onClick={regenerate}><QrCode />QR جدید</button></div></div>}
    <p className="hall-manager-note"><BarChart3 /> تغییرات نقشه روی همین دستگاه ذخیره می‌شوند و با انتخاب محل جدید قابل بازیابی‌اند.</p>
  </div>;
};
