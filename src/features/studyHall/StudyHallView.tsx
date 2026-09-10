import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair, ArrowRight, BarChart3, BookOpen, Building2, Camera, Check, ChevronLeft, Filter, LockKeyhole, MessageCircle, Search, Trophy,
  CircleStop, Clock3, DoorOpen, Map, Pause, Play, QrCode, RefreshCw, ScanLine,
  ShieldCheck, Sparkles, UserRound, Users, Wrench, X,
} from 'lucide-react';
import { SubjectItem } from '../../types/konkur';
import { LOCAL_STUDENT_ID, localStudyHallRepository } from './repository';
import { QrValidationResult, Seat, SeatStatus, StudyHallSession, StudyHallSnapshot } from './types';

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
  const [summary, setSummary] = useState<StudyHallSession | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [validatedQr, setValidatedQr] = useState<QrValidationResult | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
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
      setStudySeconds(open.studySeconds);
      setAttendanceSeconds(open.attendanceSeconds);
    }
  };

  useEffect(() => { void reload(); }, []);
  useEffect(() => {
    if (!subjects.some(s => s.id === subjectId)) setSubjectId(subjects[0]?.id ?? '');
  }, [subjects, subjectId]);

  useEffect(() => {
    if (!activeSession) return;
    const timer = window.setInterval(() => {
      setAttendanceSeconds(value => activeSession.mode === 'physical' ? value + 1 : value);
      if (activeSession.status === 'active') setStudySeconds(value => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession?.id, activeSession?.status, activeSession?.mode]);

  useEffect(() => {
    if (!activeSession) return;
    const timer = window.setInterval(() => {
      void localStudyHallRepository.saveSession({ ...activeSession, studySeconds, attendanceSeconds, updatedAt: nowIso(), syncStatus: 'pending' });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [activeSession, studySeconds, attendanceSeconds]);

  const selectedSubject = subjects.find(s => s.id === subjectId) ?? subjects[0];
  const activeSubject = subjects.find(s => s.id === activeSession?.subjectId);
  const goalPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoalMinutes)) * 100));
  const occupied = snapshot?.seats.filter(s => s.status === 'occupied').length ?? 0;
  const available = snapshot?.seats.filter(s => ['available', 'my-seat'].includes(s.status)).length ?? 0;
  const mySeat = snapshot?.seats.find(s => s.assignedStudentId === LOCAL_STUDENT_ID);

  const startSession = async (mode: Experience, qr?: QrValidationResult) => {
    if (!selectedSubject) return;
    const timestamp = nowIso();
    const session: StudyHallSession = {
      id: uid(), studentId: LOCAL_STUDENT_ID,
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
    setSummary(null); setStudySeconds(0); setAttendanceSeconds(0); setActiveSession(session); setValidatedQr(null); setScanState('idle');
    await reload();
  };

  const togglePause = async () => {
    if (!activeSession) return;
    const next = { ...activeSession, studySeconds, attendanceSeconds, status: activeSession.status === 'active' ? 'paused' : 'active', updatedAt: nowIso(), syncStatus: 'pending' } as StudyHallSession;
    setActiveSession(next);
    await localStudyHallRepository.saveSession(next);
  };

  const finishSession = async () => {
    if (!activeSession) return;
    const done: StudyHallSession = { ...activeSession, studySeconds, attendanceSeconds: activeSession.mode === 'physical' ? attendanceSeconds : studySeconds, checkOutTime: nowIso(), status: 'completed', syncStatus: 'pending', updatedAt: nowIso() };
    await localStudyHallRepository.saveSession(done);
    if (done.seatId && snapshot) {
      const seat = snapshot.seats.find(s => s.id === done.seatId);
      if (seat) await localStudyHallRepository.updateSeat({ ...seat, status: seat.assignedStudentId === LOCAL_STUDENT_ID ? 'my-seat' : 'available', occupantName: undefined, subjectName: undefined, checkedInAt: undefined });
    }
    if (studySeconds >= 30) onRecordStudy(done.subjectId, done.subjectName, Math.max(1, Math.round(studySeconds / 60)), done.mode);
    setSummary(done); setActiveSession(null); setStudySeconds(0); setAttendanceSeconds(0); await reload();
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

    {experience === 'virtual' && <VirtualRooms subjects={subjects} selectedSubjectId={subjectId} onSubjectChange={setSubjectId} onStart={() => void startSession('virtual')} />}

    {experience === 'physical' && physicalView === 'student' && <div className="hall-physical-student">
      <div className="hall-location-line"><div><span><Building2 /></span><p><b>{snapshot.branch.name}</b><small>{snapshot.hall.name}، {snapshot.sections[0].floorName}</small></p></div><button>تغییر <ChevronLeft /></button></div>
      {mySeat && <div className="hall-my-seat"><div><span>صندلی ثابت من</span><strong>{fa(mySeat.number)}</strong></div><p>{snapshot.sections[0].name}<small>آماده برای ورود</small></p><Armchair /></div>}
      <button className="hall-scan-action" onClick={openScanner}><span><ScanLine /></span><div><strong>اسکن QR صندلی</strong><small>ورود و شروع نشست حضوری</small></div><ChevronLeft /></button>
      <div className="hall-capacity"><div><b>{fa(available)}</b><span>صندلی آزاد</span></div><div className="hall-capacity-track"><i style={{ transform: `scaleX(${occupied / Math.max(1, snapshot.seats.length)})` }} /></div><div><b>{fa(occupied)}</b><span>در حال مطالعه</span></div></div>
      <div className="hall-mini-map-head"><div><span>وضعیت سالن</span><small>به‌روزرسانی لحظه‌ای محلی</small></div><Map /></div>
      <div className="hall-mini-map">{snapshot.seats.map(seat => <i key={seat.id} className={seat.status} title={`صندلی ${seat.number}`} />)}</div>
    </div>}

    {experience === 'physical' && physicalView === 'manager' && <ManagerHall snapshot={snapshot} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} onUpdated={reload} />}

    {(scanState !== 'idle' || validatedQr) && <div className="hall-sheet-shell" role="dialog" aria-modal="true">
      <div className="hall-sheet">
        <header><div><span>{validatedQr ? 'تأیید ورود' : 'اسکن صندلی'}</span><small>{validatedQr ? 'اطلاعات QR با سالن تطبیق دارد' : 'دوربین را روبه‌روی کد نگه دار'}</small></div><button onClick={() => { stopCamera(); setScanState('idle'); setValidatedQr(null); }}><X /></button></header>
        {!validatedQr && <><div className="hall-camera"><video ref={videoRef} muted playsInline /><span><i /><i /><i /><i /></span><ScanLine /></div><p className={scanState === 'error' ? 'error' : ''}>{scanState === 'checking' && <RefreshCw className="spin" />}{scanMessage}</p><button className="hall-demo-code" onClick={() => void validateToken(`PZL:${mySeat?.id ?? 'seat-05'}:v1`)}><QrCode /> استفاده از QR آزمایشی صندلی {fa(mySeat?.number ?? '۰۵')}</button></>}
        {validatedQr?.seat && <div className="hall-checkin-confirm"><span className="hall-verified"><ShieldCheck /></span><strong>صندلی {fa(validatedQr.seat.number)}</strong><p>{validatedQr.branch?.name}، {validatedQr.hall?.name}<br />{validatedQr.section?.floorName}، {validatedQr.section?.name}</p><label className="hall-subject-select"><span>درس این نشست</span><select value={subjectId} onChange={e => setSubjectId(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="hall-primary-action" onClick={() => void startSession('physical', validatedQr)}><Check /> ثبت ورود و شروع</button></div>}
      </div>
    </div>}
  </section>;
};

type VirtualRoom = { id: string; title: string; handle: string; category: string; members: number; capacity: number; accent: string; pattern: string; private?: boolean; leader: string; minutes: string; avatar: string };
const orbitMembers=[
  {name:'آرین',time:'۰۳:۲۱:۵۵',image:'/avatars/student-1.webp',status:'تمرکز'},
  {name:'سارا',time:'۰۲:۴۸:۰۱',image:'/avatars/student-2.webp',status:'تمرکز'},
  {name:'مانی',time:'۰۱:۳۵:۲۰',image:'/avatars/student-3.webp',status:'مرور'},
  {name:'رها',time:'۰۰:۵۹:۱۷',image:'/avatars/student-4.webp',status:'تمرکز'},
  {name:'نیما',time:'۰۴:۲۷:۵۷',image:'/avatars/student-5.webp',status:'استراحت'},
  {name:'یلدا',time:'۰۲:۰۹:۴۰',image:'/avatars/student-6.webp',status:'تمرکز'},
];
const virtualRooms: VirtualRoom[] = [
  { id: 'deep', title: 'اتاق مطالعه عمیق', handle: '@puzzle_focus', category: 'کنکور تجربی', members: 18, capacity: 30, accent: 'violet', pattern: 'orbital', leader: 'رها', minutes: '۰۳:۲۱:۵۵', avatar: 'ر', },
  { id: 'biology', title: 'زیست‌شناسی، آرام و پیوسته', handle: '@bio_room', category: 'مطالعه گروهی', members: 8, capacity: 20, accent: 'mint', pattern: 'leaf', leader: 'سارا', minutes: '۰۱:۴۵:۲۰', avatar: 'س', private: true },
  { id: 'math', title: 'ریاضی بدون حواس‌پرتی', handle: '@math_lab', category: 'آزمون و تحلیل', members: 12, capacity: 25, accent: 'coral', pattern: 'grid', leader: 'علی', minutes: '۰۲:۱۲:۴۰', avatar: 'ع', },
  { id: 'night', title: 'شب‌خوان‌های پازل', handle: '@night_readers', category: 'سکوت شبانه', members: 24, capacity: 40, accent: 'ink', pattern: 'stars', leader: 'نیلا', minutes: '۰۴:۰۸:۰۹', avatar: 'ن', private: true },
];

const VirtualRooms: React.FC<{ subjects: SubjectItem[]; selectedSubjectId: string; onSubjectChange: (value: string) => void; onStart: () => void }> = ({ subjects, selectedSubjectId, onSubjectChange, onStart }) => {
  const [mode, setMode] = useState<'all' | 'mine'>('all');
  const [query, setQuery] = useState('');
  const [room, setRoom] = useState<VirtualRoom | null>(null);
  const [requested, setRequested] = useState(false);
  const visibleRooms = virtualRooms.filter(item => mode === 'all' || item.id === 'deep').filter(item => `${item.title} ${item.category}`.includes(query.trim()));
  if (room) return <div className="virtual-room-detail">
    <button className="virtual-back" onClick={() => { setRoom(null); setRequested(false); }}><ArrowRight /><span>بازگشت به اتاق‌ها</span></button>
    <div className={`virtual-profile-hero ${room.pattern}`}><div className="virtual-hero-actions"><button><ShieldCheck /></button><button><ChevronLeft /></button></div><div className="virtual-room-avatar">{room.avatar}<i><Trophy /></i></div><span className="virtual-handle">{room.handle}</span><h2>{room.title}</h2><div className="virtual-profile-tabs"><button className="active">جزئیات</button><button>اتاق مطالعه</button><button>رتبه‌بندی</button></div></div>
    <div className="virtual-quote"><span>❝</span><p>با هم شروع می‌کنیم، با تمرکز ادامه می‌دیم.</p></div>
    <div className="virtual-room-facts"><span><Users /><b>{fa(room.members)}</b> نفر</span><span><Clock3 /><b>{room.minutes}</b> زمان فعال</span></div>
    <div className="virtual-live-map"><div className="virtual-orbit-line orbit-one"/><div className="virtual-orbit-line orbit-two"/><div className="virtual-live-center"><span className="virtual-pulse"/><strong>{fa(room.members)}</strong><span>همین حالا متمرکزند</span><small>هدف جمعی امروز: ۴۲ ساعت</small></div>{orbitMembers.map((member,i)=><button key={member.name} className={`virtual-node node-${i}`} aria-label={`${member.name}، ${member.status}`}><i><img src={member.image} alt=""/></i><b>{member.name}</b><small>{member.time}</small></button>)}</div>
    <label className="hall-subject-select virtual-subject"><span>درس این نشست</span><select value={selectedSubjectId} onChange={e => onSubjectChange(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {requested?<div className="virtual-requested"><Check/><span><b>درخواستت ثبت شد</b><small>با تأیید مدیر اتاق، ورود برایت باز می‌شود.</small></span></div>:<button className="hall-primary-action virtual-join" onClick={()=>room.private?setRequested(true):onStart()}>{room.private?<><LockKeyhole/> درخواست عضویت</>:<><Play/> ورود و شروع مطالعه</>}</button>}
  </div>;
  return <div className="virtual-rooms" dir="rtl">
    <div className="virtual-room-heading"><div><span><Sparkles /> تمرکز اجتماعی، بدون شلوغی</span><h2>اتاق‌های مطالعه</h2></div><div className="virtual-heading-actions"><button><Filter /></button><button><BellIcon /></button></div></div>
    <label className="virtual-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی اتاق، سازنده..." /></label>
    <div className="virtual-tabs"><button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}><Users /> همه اتاق‌ها</button><button className={mode === 'mine' ? 'active' : ''} onClick={() => setMode('mine')}><ShieldCheck /> اتاق‌های من</button></div>
    <div className="virtual-featured"><div className="virtual-featured-pattern"><Trophy /></div><div><span>پیشنهاد امروز پازل</span><strong>اتاق‌های پرتلاش‌ها</strong><small>با آدم‌هایی که همین حالا مشغول‌اند همراه شو</small></div><ChevronLeft /></div>
    <div className="virtual-list-heading"><div><span>اتاق‌های مطالعه کاربران</span><small>{fa(visibleRooms.length)} اتاق فعال</small></div><button>مرتب‌سازی <ChevronLeft /></button></div>
    <div className="virtual-room-list">{visibleRooms.map(item => <button key={item.id} className={`virtual-room-card ${item.accent} ${item.pattern}`} onClick={() => setRoom(item)}><div className="virtual-card-art"><span className="virtual-card-avatar">{item.avatar}</span><span className="virtual-card-handle">{item.handle}</span>{item.private && <LockKeyhole />}</div><div className="virtual-card-body"><div><strong>{item.title}</strong><small>{item.category}</small></div><span className="virtual-card-score">{fa(item.members)} | {fa(item.capacity)}</span></div><div className="virtual-card-foot"><span><i /> {fa(item.members)} نفر در حال مطالعه</span><span><MessageCircle /> گفتگو</span></div></button>)}</div>
  </div>;
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
    <p className="hall-manager-note"><BarChart3 /> تغییرات نقشه در Repository ذخیره می‌شوند و آماده اتصال به API هستند.</p>
  </div>;
};
