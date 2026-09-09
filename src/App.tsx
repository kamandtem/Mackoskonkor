import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AmbientSoundId,
  AppBackup,
  MockExam,
  NavTab,
  StudySession,
  SubjectItem,
  TaskItem,
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

import { AboutModal } from './components/AboutModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { BackupModal } from './components/BackupModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CountdownDial } from './components/CountdownDial';
import { ExamsView } from './components/ExamsView';
import { FocusTimer } from './components/FocusTimer';
import { Header } from './components/Header';
import { HomeTimeline } from './components/HomeTimeline';
import { ManualLogModal } from './components/ManualLogModal';
import { Navbar } from './components/Navbar';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PlannerView } from './components/PlannerView';
import { ProgressView } from './components/ProgressView';
import { QuickActionModal } from './components/QuickActionModal';
import { SettingsModal } from './components/SettingsModal';
import { SideMenu } from './components/SideMenu';
import { SpeedDrillView } from './components/SpeedDrillView';
import { StatCards } from './components/StatCards';
import { UpcomingExamCard } from './components/UpcomingExamCard';

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

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [preselectedFocusSubject, setPreselectedFocusSubject] = useState<string | undefined>();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSoundsOpen, setIsSoundsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const [currentSound, setCurrentSound] = useState<AmbientSoundId>('none');

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

  const handleToggleTask = (taskId: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
    );

  const handleAddTask = (data: Omit<TaskItem, 'id'>) =>
    setTasks((prev) => [...prev, { ...data, id: uid('task') }]);

  const handleDeleteTask = (taskId: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  const handleAddExam = (data: Omit<MockExam, 'id'>) =>
    setExams((prev) => [...prev, { ...data, id: uid('exam') }]);

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
    setCurrentSound('none');
    setCurrentTab('home');
    setIsResetConfirmOpen(false);
  };

  const handleStartFocusSubject = (subjectName: string) => {
    setPreselectedFocusSubject(subjectName);
    setCurrentTab('focus');
  };

  const goToTab = (tab: NavTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const makeBackup = (): AppBackup =>
    buildBackup({ profile, subjects, tasks, sessions, exams, drills });

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
      <Header profile={profile} streak={stats.streak} onOpenMenu={() => setIsMenuOpen(true)} />

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {currentTab === 'home' && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <CountdownDial
              daysRemaining={daysRemaining ?? 0}
              progressPercent={progressPercent}
              examName={profile.examName}
              dailyGoalMinutes={profile.dailyGoalMinutes}
              onStartFocus={() => goToTab('focus')}
              onOpenDatePicker={() => setIsSettingsOpen(true)}
            />

            <StatCards
              todayStudyMinutes={stats.todayMinutes}
              dailyGoalMinutes={profile.dailyGoalMinutes}
              streakDays={stats.streak}
              goalPct={stats.goalPct}
              onCardClick={(card) => {
                if (card === 'goal') setIsSettingsOpen(true);
                else goToTab('progress');
              }}
            />

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

        {currentTab === 'planner' && (
          <div className="animate-in fade-in duration-200">
            <PlannerView
              tasks={tasks}
              subjects={subjects}
              subjectStats={stats.subjects}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
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

        {currentTab === 'progress' && (
          <div className="animate-in fade-in duration-200">
            <ProgressView
              stats={stats}
              drillStats={drillStats}
              drills={drills}
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
            />
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
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      {/* منوی اصلی — با لمس عکس کاربر در هدر باز می‌شود */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        profile={profile}
        streak={stats.streak}
        todayMinutes={stats.todayMinutes}
        daysRemaining={daysRemaining}
        onNavigate={goToTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSounds={() => setIsSoundsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onResetData={() => setIsResetConfirmOpen(true)}
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

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenAddPlan={() => goToTab('planner')}
        onOpenManualLog={() => setIsManualLogOpen(true)}
        onStartFocus={() => goToTab('focus')}
        onStartDrill={() => goToTab('drill')}
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
