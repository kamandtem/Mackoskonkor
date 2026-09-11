import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair, ArrowRight, BarChart3, Bell, BookOpen, Building2, Camera, Check, CheckCircle2, ChevronLeft, Crown, LockKeyhole, MessageCircle, Plus, Trophy, UserPlus, XCircle,
  CircleStop, Clock3, DoorOpen, Map, Pause, Play, QrCode, RefreshCw, ScanLine,
  ShieldCheck, Sparkles, UserRound, Users, Wrench, X,
} from 'lucide-react';
import { SubjectItem } from '../../types/konkur';
import { LOCAL_STUDENT_ID, localStudyHallRepository } from './repository';
import { QrValidationResult, Seat, SeatStatus, StudyHallLocation, StudyHallSession, StudyHallSnapshot, VirtualRoomMember, VirtualStudyRoom } from './types';
import { virtualRoomRepository } from './virtualRoomRepository';
import { celebrateAchievement, notifyUser } from '../../utils/celebration';

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
      setStudySeconds(open.studySeconds);
      setAttendanceSeconds(open.attendanceSeconds);
    }
  };

  useEffect(() => { void reload(); void localStudyHallRepository.listLocations().then(setLocations); }, []);
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
  const selectLocation = async (location: StudyHallLocation) => { setSnapshot(await localStudyHallRepository.selectLocation(location.branch.id, location.hall.id)); setLocationPickerOpen(false); setSelectedSeat(null); };

  const startSession = async (mode: Experience, qr?: QrValidationResult, virtualRoomId?: string) => {
    if (!selectedSubject) return;
    const timestamp = nowIso();
    const session: StudyHallSession = {
      id: uid(), studentId: LOCAL_STUDENT_ID, virtualRoomId,
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
    if (done.virtualRoomId) { try { await virtualRoomRepository.recordStudy(done.virtualRoomId, LOCAL_STUDENT_ID, studySeconds); } catch {} }
    celebrateAchievement({ title: 'نشست مطالعه ثبت شد', message: `${Math.max(1, Math.round(studySeconds / 60))} دقیقه مطالعه به آمار تو اضافه شد.`, notify: true });
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

const secondsLabel = (seconds: number) => `${fa(Math.floor(seconds / 3600))} ساعت و ${fa(Math.floor((seconds % 3600) / 60))} دقیقه`;
const currentMember = (): VirtualRoomMember => ({ studentId: LOCAL_STUDENT_ID, displayName: 'شما', role: 'member', joinedAt: nowIso(), totalStudySeconds: 0, status: 'offline' });

const VirtualRooms: React.FC<{ subjects: SubjectItem[]; selectedSubjectId: string; onSubjectChange: (value: string) => void; onStart: (roomId: string) => void }> = ({ subjects, selectedSubjectId, onSubjectChange, onStart }) => {
  const [rooms,setRooms]=useState<VirtualStudyRoom[]>([]); const [room,setRoom]=useState<VirtualStudyRoom|null>(null); const [mine,setMine]=useState(false);
  const [createOpen,setCreateOpen]=useState(false); const [notice,setNotice]=useState(''); const [name,setName]=useState(''); const [slug,setSlug]=useState(''); const [description,setDescription]=useState(''); const [visibility,setVisibility]=useState<'public'|'private'>('private');
  const [memberName,setMemberName]=useState(''); const load=async()=>{const data=await virtualRoomRepository.listRooms(LOCAL_STUDENT_ID);setRooms(data);if(room)setRoom(data.find(x=>x.id===room.id)??null)};
  useEffect(()=>{void load()},[]);
  const visible=mine?rooms.filter(x=>x.members.some(m=>m.studentId===LOCAL_STUDENT_ID)):rooms;
  const isMember=(value:VirtualStudyRoom)=>value.members.some(m=>m.studentId===LOCAL_STUDENT_ID); const canManage=(value:VirtualStudyRoom)=>value.members.some(m=>m.studentId===LOCAL_STUDENT_ID&&['owner','admin'].includes(m.role));
  const enter=async(value:VirtualStudyRoom)=>{try{if(!isMember(value)){if(value.visibility==='private'){await virtualRoomRepository.requestMembership(value.id,LOCAL_STUDENT_ID,'شما');setNotice('درخواست عضویت ارسال شد؛ مدیر اتاق باید آن را تأیید کند.');notifyUser('درخواست عضویت ثبت شد',`درخواست ورود به ${value.name} در انتظار بررسی است.`);await load();return}await virtualRoomRepository.joinPublicRoom(value.id,currentMember());await load()}onStart(value.id)}catch(error){setNotice(error instanceof Error?error.message:'عملیات انجام نشد.')}};
  const create=async(e:React.FormEvent)=>{e.preventDefault();try{const made=await virtualRoomRepository.createRoom({name:name.trim(),slug,description:description.trim(),visibility,capacity:30},{...currentMember(),role:'owner'});setCreateOpen(false);setName('');setSlug('');setDescription('');setRoom(made);await load();celebrateAchievement({title:'اتاق ساخته شد',message:`${made.name} آماده دعوت اعضاست.`,notify:true})}catch(error){setNotice(error instanceof Error?error.message:'ساخت اتاق انجام نشد.')}};
  const review=async(requestId:string,approve:boolean)=>{if(!room)return;await virtualRoomRepository.reviewMembership(room.id,requestId,LOCAL_STUDENT_ID,approve);await load();setNotice(approve?'عضو جدید به اتاق اضافه شد.':'درخواست رد شد.');if(approve)celebrateAchievement({intensity:'small'})};
  const addMember=async()=>{if(!room||!memberName.trim())return;const id=`student-${Date.now()}`;await virtualRoomRepository.addMember(room.id,{studentId:id,displayName:memberName.trim(),role:'member',joinedAt:nowIso(),totalStudySeconds:0,status:'offline'},LOCAL_STUDENT_ID);setMemberName('');await load();setNotice('عضو با موفقیت اضافه شد.');};
  if(room){const ranking=[...room.members].sort((a,b)=>b.totalStudySeconds-a.totalStudySeconds);return <div className="virtual-room-detail">
    <button className="virtual-back" onClick={()=>{setRoom(null);setNotice('')}}><ArrowRight/><span>بازگشت</span></button>
    <div className="room-identity"><span className="room-monogram">{room.name[0]}</span><div><small dir="ltr">@{room.slug}</small><h2>{room.name}</h2><p>{room.description}</p></div>{room.visibility==='private'&&<LockKeyhole/>}</div>
    <div className="room-meta"><span><Users/>{fa(room.members.length)} عضو</span><span><Crown/>{room.members.find(m=>m.role==='owner')?.displayName}</span></div>
    {notice&&<div className="room-notice"><Bell/><span>{notice}</span></div>}
    <label className="hall-subject-select virtual-subject"><span>درس این نشست</span><select value={selectedSubjectId} onChange={e=>onSubjectChange(e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <button className="hall-primary-action virtual-join" onClick={()=>void enter(room)}>{isMember(room)?<><Play/>شروع مطالعه در اتاق</>:room.visibility==='private'?<><LockKeyhole/>درخواست عضویت</>:<><UserPlus/>عضویت و شروع</>}</button>
    <section className="room-ranking"><header><div><Trophy/><span><b>رتبه‌بندی مطالعه</b><small>بر اساس زمان ثبت‌شده واقعی</small></span></div></header>{ranking.map((m,i)=><div key={m.studentId}><strong>{fa(i+1)}</strong><span><b>{m.displayName}</b><small>{m.role==='owner'?'سازنده اتاق':m.role==='admin'?'مدیر':'عضو'}</small></span><em>{secondsLabel(m.totalStudySeconds)}</em></div>)}</section>
    {canManage(room)&&<section className="room-admin"><header><ShieldCheck/><span><b>مدیریت اتاق</b><small>اعضا و درخواست‌های عضویت</small></span></header><div className="room-add-member"><input value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder="نام عضو جدید"/><button onClick={()=>void addMember()}><UserPlus/>افزودن</button></div>{room.requests.filter(r=>r.status==='pending').map(req=><div className="room-request" key={req.id}><span><b>{req.displayName}</b><small>درخواست عضویت</small></span><button onClick={()=>void review(req.id,true)} aria-label="پذیرش"><CheckCircle2/></button><button onClick={()=>void review(req.id,false)} aria-label="رد"><XCircle/></button></div>)}</section>}
  </div>}
  return <div className="virtual-rooms" dir="rtl">
    <div className="room-actions"><div className="virtual-tabs"><button className={!mine?'active':''} onClick={()=>setMine(false)}><Users/>همه اتاق‌ها</button><button className={mine?'active':''} onClick={()=>setMine(true)}><ShieldCheck/>اتاق‌های من</button></div><button className="room-create-button" onClick={()=>setCreateOpen(true)}><Plus/>ساخت اتاق</button></div>
    <div className="room-feed">{visible.map(item=>{const top=[...item.members].sort((a,b)=>b.totalStudySeconds-a.totalStudySeconds)[0];return <button key={item.id} className="room-feed-item" onClick={()=>setRoom(item)}><span className="room-feed-avatar">{item.name[0]}</span><div><strong>{item.name}</strong><small dir="ltr">@{item.slug}</small><p>{item.description}</p><em><Users/>{fa(item.members.length)} عضو <i/> <Trophy/>{top?.displayName??'بدون رتبه'}</em></div><ChevronLeft/>{item.visibility==='private'&&<LockKeyhole className="room-lock"/>}</button>})}</div>
    {createOpen&&<div className="hall-sheet-shell" role="dialog" aria-modal="true" onClick={()=>setCreateOpen(false)}><form className="hall-sheet room-create-sheet" onSubmit={create} onClick={e=>e.stopPropagation()}><header><div><span>ساخت اتاق جدید</span><small>نام و شناسه بعداً به API سرور متصل می‌شوند</small></div><button type="button" onClick={()=>setCreateOpen(false)}><X/></button></header><label><span>نام اتاق</span><input required value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً جمع‌بندی دوازدهم"/></label><label><span>شناسه یکتا</span><input dir="ltr" required pattern="[A-Za-z0-9_-]+" value={slug} onChange={e=>setSlug(e.target.value)} placeholder="grade12-focus"/></label><label><span>توضیح کوتاه</span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="هدف و قوانین اتاق"/></label><div className="room-visibility"><button type="button" className={visibility==='private'?'active':''} onClick={()=>setVisibility('private')}><LockKeyhole/>خصوصی، با تأیید مدیر</button><button type="button" className={visibility==='public'?'active':''} onClick={()=>setVisibility('public')}><Users/>عمومی</button></div>{notice&&<p className="room-form-error">{notice}</p>}<button className="hall-primary-action" type="submit"><Plus/>ساخت اتاق</button></form></div>}
  </div>;
};

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
