import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AmbientSoundId,
  AppBackup,
  MockExam,
  NavTab,
  StudySession,
  SubjectItem,
  TaskItem,
  NoteItem,
  TestDrill,
  UserProfile,
} from './types/konkur';
import {
  EMPTY_PROFILE,
  ParsedBackup,
  buildBackup,
  clearAllData,
  computeDrillPercent,
  getDefaultSubjects,
  loadDrills,
  loadExams,
  loadProfile,
  loadSessions,
  loadSubjects,
  loadTasks,
  saveDrills,
  saveExams,
  saveProfile,
  saveSessions,
  saveSubjects,
  saveTasks,
  loadNotes,
  saveNotes,
} from './utils/storage';
import {
  calculateDaysRemaining,
  calculateProgressPercentage,
  toLocalIso,
  todayJalaliKey,
} from './utils/jalali';
import {
  computeDrillStats,
  computeStudyStats,
  nextExam,
  tasksForDay,
} from './utils/stats';
import { soundEngine } from './utils/soundEngine';
import { celebrateAchievement } from './utils/celebration';

import { applyTheme, loadTheme, saveTheme, ThemeMode } from './utils/theme';

import { AboutModal } from './components/AboutModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { ArcWheelMenu } from './components/ArcWheelMenu';
import { BackupModal } from './components/BackupModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CountdownDial } from './components/CountdownDial';
import { ExamsView } from './components/ExamsView';
import { FocusTimer } from './components/FocusTimer';
import { Header, HeaderNotification } from './components/Header';
import { HomeTimeline } from './components/HomeTimeline';
import { ManualLogModal } from './components/ManualLogModal';
import { Navbar } from './components/Navbar';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CalendarView } from './components/CalendarView';
import { ProfileModal } from './components/ProfileModal';
import { ProgressView } from './components/ProgressView';
import { ReportCardView } from './components/ReportCardView';
import { QuickActionMenu } from './components/QuickActionMenu';
import { SettingsModal } from './components/SettingsModal';
import { SpeedDrillView } from './components/SpeedDrillView';
import { UpcomingExamCard } from './components/UpcomingExamCard';
import { StudyHallView } from './features/studyHall/StudyHallView';
import { StudyScheduleView } from './components/StudyScheduleView';
import { AdvisorsView } from './components/AdvisorsView';
import { NotesView } from './components/NotesView';
import { FlashcardsView } from './components/FlashcardsView';
import { HomeUpdates, MotivationStrip } from './components/HomeUpdates';

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  /* ---------------------------------------------------------------- */
  /* بارگذاری                                                          */
  /* ---------------------------------------------------------------- */
  // تا وقتی حافظه‌ی محلی خوانده نشده هیچ‌چیز رندر نمی‌شود، وگرنه یک لحظه
  // صفحه‌ی ثبت‌نام به کاربرِ قبلاً ثبت‌شده نشان داده می‌شد.
  const [isHydrated, setIsHydrated] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [exams, setExams] = useState<MockExam[]>([]);
  const [drills, setDrills] = useState<TestDrill[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const navigationStackRef = useRef<NavTab[]>([]);
  const [preselectedFocusSubject, setPreselectedFocusSubject] = useState<string | undefined>();

  const [isArcMenuOpen, setIsArcMenuOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  // با دکمه‌ی + نوار پایین، فرم مربوطه در صفحه‌ی مقصد خودکار باز می‌شود
  const [autoOpenAddTask, setAutoOpenAddTask] = useState(false);
  const [autoOpenAddExam, setAutoOpenAddExam] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSoundsOpen, setIsSoundsOpen] = useState(false);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const lastBackPressRef = useRef(0);

  const [currentSound, setCurrentSound] = useState<AmbientSoundId>('none');
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const storedTheme = loadTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const storedProfile = loadProfile();
    const storedSubjects = loadSubjects();

    setProfile(storedProfile);
    setSubjects(
      storedSubjects && storedSubjects.length > 0
        ? storedSubjects
        : storedProfile.isOnboarded
          ? getDefaultSubjects(storedProfile.major)
          : [],
    );
    setTasks(loadTasks());
    setSessions(loadSessions());
    setExams(loadExams());
    setDrills(loadDrills());
    setNotes(loadNotes());
    setIsHydrated(true);
  }, []);

  /* ---------------------------------------------------------------- */
  /* ذخیره‌سازی — هرگز پیش از پایان بارگذاری اجرا نمی‌شود                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (isHydrated) saveProfile(profile);
  }, [isHydrated, profile]);

  useEffect(() => {
    if (isHydrated) saveSubjects(subjects);
  }, [isHydrated, subjects]);

  useEffect(() => {
    if (isHydrated) saveTasks(tasks);
  }, [isHydrated, tasks]);

  useEffect(() => {
    if (isHydrated) saveSessions(sessions);
  }, [isHydrated, sessions]);

  useEffect(() => {
    if (isHydrated) saveExams(exams);
  }, [isHydrated, exams]);

  useEffect(() => {
    if (isHydrated) saveDrills(drills);
  }, [isHydrated, drills]);

  useEffect(() => {
    if (isHydrated) saveNotes(notes);
  }, [isHydrated, notes]);

  // برگشت پایدار: اول لایه باز بسته می‌شود، بعد صفحه قبلی؛ در خانه دوبار برگشت خروج را می‌پرسد.
  const uiStateRef = useRef({ currentTab, isQuickMenuOpen, isArcMenuOpen, isSettingsOpen, isProfileOpen, isSoundsOpen, isManualLogOpen, isBackupOpen, isAboutOpen, isNotesOpen, isResetConfirmOpen, isExitConfirmOpen });
  useEffect(() => {
    uiStateRef.current = { currentTab, isQuickMenuOpen, isArcMenuOpen, isSettingsOpen, isProfileOpen, isSoundsOpen, isManualLogOpen, isBackupOpen, isAboutOpen, isNotesOpen, isResetConfirmOpen, isExitConfirmOpen };
  }, [currentTab, isQuickMenuOpen, isArcMenuOpen, isSettingsOpen, isProfileOpen, isSoundsOpen, isManualLogOpen, isBackupOpen, isAboutOpen, isNotesOpen, isResetConfirmOpen, isExitConfirmOpen]);
  useEffect(() => {
    window.history.replaceState({ konkurRoot: true }, '', window.location.href);
    const onBack = () => {
      window.history.pushState({ konkurRoot: true }, '', window.location.href);
      const now = Date.now();
      const isDoubleBack = now - lastBackPressRef.current < 1500;
      lastBackPressRef.current = now;
      const state = uiStateRef.current;
      if (state.isQuickMenuOpen || state.isArcMenuOpen || state.isSettingsOpen || state.isProfileOpen || state.isSoundsOpen || state.isManualLogOpen || state.isBackupOpen || state.isAboutOpen || state.isNotesOpen) {
        setIsQuickMenuOpen(false); setIsArcMenuOpen(false); setIsSettingsOpen(false); setIsProfileOpen(false); setIsSoundsOpen(false); setIsManualLogOpen(false); setIsBackupOpen(false); setIsAboutOpen(false); setIsNotesOpen(false); return;
      }
      if (state.isResetConfirmOpen || state.isExitConfirmOpen) return;
      if (state.currentTab !== 'home') {
        const previous = navigationStackRef.current.pop() ?? 'home';
        setCurrentTab(previous); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
      }
      if (isDoubleBack) setIsExitConfirmOpen(true);
    };
    window.addEventListener('popstate', onBack);
    document.addEventListener('backbutton', onBack as EventListener);
    return () => { window.removeEventListener('popstate', onBack); document.removeEventListener('backbutton', onBack as EventListener); };
  }, []);

  // صدای محیط را با بسته شدن برنامه رها کن
  useEffect(() => () => soundEngine.stop(), []);

  /* ---------------------------------------------------------------- */
  /* محاسبات مشتق‌شده                                                  */
  /* ---------------------------------------------------------------- */
  const stats = useMemo(
    () => computeStudyStats(sessions, subjects, profile),
    [sessions, subjects, profile],
  );
  const drillStats = useMemo(() => computeDrillStats(drills), [drills]);
  const todayTasks = useMemo(() => tasksForDay(tasks, todayJalaliKey()), [tasks]);
  const upcomingExam = useMemo(() => nextExam(exams), [exams]);

  const enableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') new Notification('اعلان‌های کنکور من فعال شد', { body: 'یادآوری‌های برنامه و آزمون‌ها را از دست نمی‌دهی.' });
  }, []);

  useEffect(() => {
    if (!isHydrated || !profile.notificationsEnabled || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const pending = todayTasks.filter(t => !t.isCompleted);
    if (pending.length > 0) {
      const key = `konkur-notified-${todayJalaliKey()}-${pending.length}`;
      if (localStorage.getItem(key) !== '1') {
        new Notification('برنامه امروزت آماده است', { body: `${pending.length} فعالیت برای امروز باقی مانده.` });
        localStorage.setItem(key, '1');
      }
    }
  }, [isHydrated, profile.notificationsEnabled, todayTasks]);

  const notifications = useMemo<HeaderNotification[]>(() => {
    const items: HeaderNotification[] = [];

    const pending = todayTasks.filter((t) => !t.isCompleted);
    if (pending.length > 0) {
      items.push({
        id: 'today-tasks',
        title: `${pending.length} کار امروز باقی مانده`,
        description: pending
          .slice(0, 3)
          .map((t) => `${t.startTime} · ${t.subjectName}`)
          .join('، '),
        targetTab: 'planner',
      });
    }

    if (upcomingExam) {
      items.push({
        id: `exam-${upcomingExam.id}`,
        title: `آزمون نزدیک: ${upcomingExam.title}`,
        description: `تاریخ ${upcomingExam.dateJalali}`,
        targetTab: 'exams',
      });
    }

    if (stats.todayMinutes < profile.dailyGoalMinutes) {
      items.push({
        id: 'daily-goal',
        title: 'هدف امروز کامل نشده',
        description: `${Math.max(0, profile.dailyGoalMinutes - stats.todayMinutes)} دقیقه تا هدف روزانه`,
        targetTab: 'progress',
      });
    }

    return items;
  }, [todayTasks, upcomingExam, stats.todayMinutes, profile.dailyGoalMinutes]);

  const hasExamDate = profile.examTargetDate !== '';
  const daysRemaining = hasExamDate ? calculateDaysRemaining(profile.examTargetDate) : null;
  const progressPercent = calculateProgressPercentage(
    profile.startDate,
    profile.examTargetDate,
  );

  /* ---------------------------------------------------------------- */
  /* عملیات                                                            */
  /* ---------------------------------------------------------------- */
  const recordSession = useCallback(
    (
      subjectId: string,
      subjectName: string,
      durationMinutes: number,
      type: StudySession['type'],
    ) => {
      if (durationMinutes <= 0) return;
      setSessions((prev) => [
        {
          id: uid('sess'),
          subjectId,
          subjectName,
          durationMinutes,
          dateStr: todayJalaliKey(),
          isoDate: toLocalIso(),
          timestamp: Date.now(),
          type,
        },
        ...prev,
      ]);
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* تیک «انجام شد» = ثبت یک مطالعه‌ی موفق در آمار                       */
  /* دقیقه‌هایی که پیش‌تر با تایمر یا پومودورو ثبت شده دوباره حساب نمی‌شود */
  /* ---------------------------------------------------------------- */
  const handleToggleTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (!task.isCompleted) {
        const remaining = Math.max(0, task.durationMinutes - (task.loggedMinutes ?? 0));
        if (remaining > 0) {
          recordSession(task.subjectId, task.subjectName, remaining, 'manual');
        }
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  isCompleted: true,
                  loggedMinutes: Math.max(t.durationMinutes, t.loggedMinutes ?? 0),
                }
              : t,
          ),
        );
        celebrateAchievement({ title: 'کار انجام شد', message: `${task.subjectName} با موفقیت به پایان رسید.`, notify: profile.notificationsEnabled, intensity: 'small' });
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: false } : t)),
      );
    },
    [tasks, recordSession, profile.notificationsEnabled],
  );

  /** ثبت دقیقه‌های تایمر یا پومودورو روی یک ردیف برنامه */
  const handleLogTaskMinutes = useCallback(
    (taskId: string, minutes: number, type: 'timer' | 'pomodoro') => {
      if (minutes <= 0) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      recordSession(task.subjectId, task.subjectName, minutes, type);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const logged = (t.loggedMinutes ?? 0) + minutes;
          return {
            ...t,
            loggedMinutes: logged,
            // به مدتی که خودش تعیین کرده رسید؟ خودکار انجام‌شده می‌شود
            isCompleted: t.isCompleted || logged >= t.durationMinutes,
          };
        }),
      );
    },
    [tasks, recordSession],
  );

  const handleAddTask = (data: Omit<TaskItem, 'id'>) =>
    setTasks((prev) => [...prev, { ...data, id: uid('task') }]);

  const handleAddTasks = (items: Omit<TaskItem, 'id'>[]) =>
    setTasks((prev) => [...prev, ...items.map((item) => ({ ...item, id: uid('task') }))]);

  const handleDeleteTask = (taskId: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  const handleAddExam = (data: Omit<MockExam, 'id'>) =>
    setExams((prev) => [...prev, { ...data, id: uid('exam') }]);

  const handleAddNote = (note: Omit<NoteItem, 'id'|'createdAt'|'updatedAt'>) => {
    const now = new Date().toISOString();
    setNotes(prev => [{ ...note, id: uid('note'), createdAt: now, updatedAt: now }, ...prev]);
  };
  const handleUpdateNote = (note: NoteItem) => setNotes(prev => prev.map(item => item.id === note.id ? note : item));
  const handleDeleteNote = (id: string) => setNotes(prev => prev.filter(note => note.id !== id));

  const handleDeleteExam = (examId: string) =>
    setExams((prev) => prev.filter((e) => e.id !== examId));

  const handleDeleteDrill = (drillId: string) =>
    setDrills((prev) => prev.filter((d) => d.id !== drillId));

  const handleSaveDrill = (
    data: Omit<TestDrill, 'id' | 'dateStr' | 'isoDate' | 'timestamp'>,
  ) => {
    const drill: TestDrill = {
      ...data,
      percent: computeDrillPercent(data.totalQuestions, data.correct, data.wrong),
      id: uid('drill'),
      dateStr: todayJalaliKey(),
      isoDate: toLocalIso(),
      timestamp: Date.now(),
    };
    setDrills((prev) => [drill, ...prev]);

    // تست‌زنی هم مطالعه است: در آمار ثبت می‌شود
    const minutes = Math.round(drill.durationSeconds / 60);
    if (minutes > 0) {
      recordSession(drill.subjectId, drill.subjectName, minutes, 'drill');
    }
  };

  const handleSelectSound = (sound: AmbientSoundId) => {
    setCurrentSound(sound);
    soundEngine.playSound(sound);
  };

  const handleSaveProfile = (updated: UserProfile, resetSubjectsForMajor: boolean) => {
    setProfile(updated);
    if (resetSubjectsForMajor) {
      setSubjects(getDefaultSubjects(updated.major));
    }
  };

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setSubjects(getDefaultSubjects(newProfile.major));
    setCurrentTab('home');
  };

  const handleRestoreBackup = (data: ParsedBackup) => {
    setProfile(data.profile);
    setSubjects(data.subjects);
    setTasks(data.tasks);
    setSessions(data.sessions);
    setExams(data.exams);
    setDrills(data.drills);
    setNotes(data.notes ?? []);
    setIsBackupOpen(false);
    setCurrentTab('home');
  };

  const handleResetAllData = () => {
    soundEngine.stop();
    clearAllData();
    setProfile({ ...EMPTY_PROFILE });
    setSubjects([]);
    setTasks([]);
    setSessions([]);
    setExams([]);
    setDrills([]);
    setNotes([]);
    setCurrentSound('none');
    setCurrentTab('home');
    setIsResetConfirmOpen(false);
  };

  const handleStartFocusSubject = (subjectName: string) => {
    setPreselectedFocusSubject(subjectName);
    setCurrentTab('focus');
  };

  const goToTab = (tab: NavTab) => {
    if (tab !== currentTab) {
      if (tab === 'home') navigationStackRef.current = [];
      else navigationStackRef.current.push(currentTab);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const makeBackup = (): AppBackup =>
    buildBackup({ profile, subjects, tasks, sessions, exams, drills, notes });

  /* ---------------------------------------------------------------- */
  /* دو دروازه‌ی اول: بارگذاری، سپس ورود اطلاعات کاربر                   */
  /* ---------------------------------------------------------------- */
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#f2f5f9] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!profile.isOnboarded) {
    return (
      <OnboardingScreen
        onComplete={handleCompleteOnboarding}
        onRestoreBackup={handleRestoreBackup}
      />
    );
  }

  /* ---------------------------------------------------------------- */
  /* برنامه                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#f2f5f9] text-slate-800 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      <Header
        notifications={notifications}
        onOpenMenu={() => setIsArcMenuOpen(true)}
        onOpenHome={() => goToTab('home')}
        onNotificationClick={(item) => goToTab(item.targetTab)}
        onEnableNotifications={enableNotifications}
      />

      {/* هدر و نوار پایین شناورند؛ فاصله‌ی امن بالا و پایین برای محتوا لازم است */}
      <main className="flex-1 safe-main overflow-y-auto no-scrollbar">
        {currentTab === 'home' && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <MotivationStrip />
            <CountdownDial
              daysRemaining={daysRemaining ?? 0}
              progressPercent={progressPercent}
              examName={profile.examName}
              dailyGoalMinutes={profile.dailyGoalMinutes}
              todayStudyMinutes={stats.todayMinutes}
              streakDays={stats.streak}
              goalPct={stats.goalPct}
              onOpenDatePicker={() => setIsSettingsOpen(true)}
              onStatClick={(card) => {
                if (card === 'goal') setIsSettingsOpen(true);
                else goToTab('progress');
              }}
            />

            <HomeUpdates />

            <UpcomingExamCard exam={upcomingExam} onViewAllExams={() => goToTab('exams')} />

            <HomeTimeline
              tasks={todayTasks}
              onToggleTask={handleToggleTask}
              onAddTask={() => goToTab('planner')}
              onViewAllPlanner={() => goToTab('planner')}
              onStartFocusSubject={handleStartFocusSubject}
            />
          </div>
        )}

        {currentTab === 'flashcards' && (
          <div className="animate-in fade-in duration-200">
            <FlashcardsView onClose={() => goToTab('home')} />
          </div>
        )}

        {currentTab === 'planner' && (
          <div className="animate-in fade-in duration-200">
            <CalendarView
              tasks={tasks}
              subjects={subjects}
              major={profile.major}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onStartFocus={handleStartFocusSubject}
              onOpenSchedules={() => goToTab('schedule')}
              autoOpenAdd={autoOpenAddTask}
              onAutoOpenAddHandled={() => setAutoOpenAddTask(false)}
            />
          </div>
        )}

        {currentTab === 'focus' && (
          <div className="animate-in fade-in duration-200">
            <FocusTimer
              subjects={subjects}
              preselectedSubject={preselectedFocusSubject}
              workMinutes={profile.pomodoroWorkMinutes}
              breakMinutes={profile.pomodoroBreakMinutes}
              onSessionComplete={(id, name, minutes) =>
                recordSession(id, name, minutes, 'pomodoro')
              }
              onOpenSounds={() => setIsSoundsOpen(true)}
              currentSound={currentSound}
            />
          </div>
        )}

        {currentTab === 'schedule' && (
          <div className="animate-in fade-in duration-200">
            <StudyScheduleView
              subjects={subjects}
              onAddTasks={handleAddTasks}
              onOpenCalendar={() => goToTab('planner')}
              onClose={() => goToTab('home')}
            />
          </div>
        )}

        {currentTab === 'advisors' && (
          <div className="animate-in fade-in duration-200">
            <AdvisorsView onClose={() => goToTab('home')} />
          </div>
        )}

        {currentTab === 'studyHall' && (
          <div className="animate-in fade-in duration-200">
            <StudyHallView
              subjects={subjects}
              dailyGoalMinutes={profile.dailyGoalMinutes}
              todayMinutes={stats.todayMinutes}
              streak={stats.streak}
              onRecordStudy={(id, name, minutes, mode) =>
                recordSession(id, name, minutes, mode)
              }
            />
          </div>
        )}

        {currentTab === 'report' && (
          <div className="animate-in fade-in duration-200">
            <ReportCardView drills={drills} subjects={subjects} />
          </div>
        )}

        {currentTab === 'progress' && (
          <div className="animate-in fade-in duration-200">
            <ProgressView
              stats={stats}
              drillStats={drillStats}
              drills={drills}
              sessions={sessions}
              profile={profile}
              onStartFocus={() => goToTab('focus')}
            />
          </div>
        )}

        {currentTab === 'exams' && (
          <div className="animate-in fade-in duration-200">
            <ExamsView
              exams={exams}
              onAddExam={handleAddExam}
              onDeleteExam={handleDeleteExam}
              autoOpenAdd={autoOpenAddExam}
              onAutoOpenAddHandled={() => setAutoOpenAddExam(false)}
            />
          </div>
        )}

        {isNotesOpen && (
          <div className="animate-in fade-in duration-200">
            <NotesView notes={notes} onAdd={handleAddNote} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} onClose={() => setIsNotesOpen(false)} />
          </div>
        )}

        {currentTab === 'drill' && (
          <div className="animate-in fade-in duration-200">
            <SpeedDrillView
              subjects={subjects}
              drills={drills}
              onSaveDrill={handleSaveDrill}
              onDeleteDrill={handleDeleteDrill}
            />
          </div>
        )}
      </main>

      <Navbar
        currentTab={currentTab}
        onSelectTab={goToTab}
        onQuickAdd={() => setIsQuickMenuOpen(true)}
      />

      {/* منوی دکمه‌ی + نوار پایین */}
      <QuickActionMenu
        isOpen={isQuickMenuOpen}
        onClose={() => setIsQuickMenuOpen(false)}
        onAddTask={() => {
          goToTab('planner');
          setAutoOpenAddTask(true);
        }}
        onStartDrill={() => goToTab('drill')}
        onAddExam={() => {
          goToTab('exams');
          setAutoOpenAddExam(true);
        }}
        onStartFocus={() => goToTab('focus')}
        onOpenNotes={() => setIsNotesOpen(true)}
      />

      {/* تنها منوی برنامه — با آیکن منو در هدر باز می‌شود */}
      <ArcWheelMenu
        isOpen={isArcMenuOpen}
        onClose={() => setIsArcMenuOpen(false)}
        profile={profile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigateTab={goToTab}
        onStartFocusSubject={handleStartFocusSubject}
        onOpenSounds={() => setIsSoundsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenManualLog={() => setIsManualLogOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onResetData={() => setIsResetConfirmOpen(true)}
        telegramUrl="#"
        instagramUrl="#"
      />

      <AmbientSoundModal
        isOpen={isSoundsOpen}
        onClose={() => setIsSoundsOpen(false)}
        currentSound={currentSound}
        onSelectSound={handleSelectSound}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <ManualLogModal
        isOpen={isManualLogOpen}
        onClose={() => setIsManualLogOpen(false)}
        subjects={subjects}
        onLogStudy={(id, name, minutes) => recordSession(id, name, minutes, 'manual')}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        buildBackup={makeBackup}
        onRestore={handleRestoreBackup}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <ConfirmDialog
        isOpen={isExitConfirmOpen}
        title="می‌خواهی از برنامه خارج شوی؟"
        message="برای خروج از برنامه تأیید کن."
        confirmLabel="خروج"
        cancelLabel="بمان"
        onConfirm={() => {
          setIsExitConfirmOpen(false);
          window.close();
          setTimeout(() => window.history.back(), 80);
        }}
        onCancel={() => setIsExitConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="پاک کردن همه‌ی اطلاعات؟"
        message="پروفایل، برنامه، جلسات مطالعه، آزمون‌ها و تست‌زنی‌ها حذف می‌شوند و برنامه به حالت روز اول برمی‌گردد. این کار قابل بازگشت نیست."
        confirmLabel="پاک کن"
        onConfirm={handleResetAllData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
