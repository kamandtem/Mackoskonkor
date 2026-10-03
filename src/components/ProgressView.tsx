import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarCheck2,
  ChartColumnStacked,
  ChartPie,
  ChartScatter,
  ChartSpline,
  ChevronDown,
  Clock3,
  Flame,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react';
import { ActivityKind, StudySession, SubjectItem, TaskItem, TestDrill, UserProfile } from '../types/konkur';
import { DrillStats, StudyStats } from '../utils/stats';
import { formatMinutesShort, formatMinutesToPersian, minutesToTime, toPersianDigits } from '../utils/jalali';
import {
  KIND_META,
  PERIOD_LABELS,
  PeriodReport,
  ReportDay,
  ReportPeriod,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  buildPeriodReport,
  buildPreviousTotals,
  lifetimeSummary,
} from '../utils/reportStats';
import './progress-report.css';

interface Props {
  stats: StudyStats;
  drillStats: DrillStats;
  drills: TestDrill[];
  sessions: StudySession[];
  tasks: TaskItem[];
  subjects: SubjectItem[];
  profile: UserProfile;
  onStartFocus: () => void;
}

const fa = toPersianDigits;
const PERIODS: ReportPeriod[] = ['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];
const KINDS: ActivityKind[] = ['study', 'class', 'other'];

/** «۲.۵» ساعت — برای برچسب نمودارها */
const hoursLabel = (m: number) => {
  if (m <= 0) return '';
  if (m < 60) return `${fa(m)}د`;
  const h = Math.round((m / 60) * 10) / 10;
  return `${fa(h)}س`;
};

type Inputs = { sessions: StudySession[]; drills: TestDrill[]; tasks: TaskItem[]; subjects: SubjectItem[] };

/** هر بخش بازه‌ی خودش را دارد؛ گزارش‌ها کش می‌شوند تا تب‌ها سبک بمانند */
function useReports(inputs: Inputs) {
  return useMemo(() => {
    const map = {} as Record<ReportPeriod, PeriodReport>;
    for (const p of PERIODS) map[p] = buildPeriodReport(p, inputs);
    return map;
  }, [inputs.sessions, inputs.drills, inputs.tasks, inputs.subjects]);
}

export const ProgressView: React.FC<Props> = ({ stats, sessions, drills, tasks, subjects, profile, onStartFocus }) => {
  const inputs = useMemo(() => ({ sessions, drills, tasks, subjects }), [sessions, drills, tasks, subjects]);
  const reports = useReports(inputs);
  const life = useMemo(() => lifetimeSummary(sessions), [sessions]);

  const [overviewP, setOverviewP] = useState<ReportPeriod>('thisWeek');
  const [dailyP, setDailyP] = useState<ReportPeriod>('thisWeek');
  const [subjectP, setSubjectP] = useState<ReportPeriod>('thisWeek');
  const [streakP, setStreakP] = useState<ReportPeriod>('thisWeek');
  const [trendP, setTrendP] = useState<ReportPeriod>('thisWeek');
  const [scatterP, setScatterP] = useState<ReportPeriod>('thisWeek');

  const initial = (profile.name || 'ک').trim().charAt(0);

  return (
    <section className="rp-page" dir="rtl">
      {/* ---------- پروفایل ---------- */}
      <header className="rp-profile">
        <div className="rp-avatar">
          {profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" /> : <span>{initial}</span>}
        </div>
        <div className="rp-profile-main">
          <h1>{profile.name || 'داوطلب کنکور'}</h1>
          <p>
            رشته {profile.major}
            {profile.examName ? ` · ${profile.examName}` : ''}
          </p>
          <div className="rp-profile-stats">
            <div>
              <b>
                <Flame className="flame" /> {fa(stats.streak)}
              </b>
              <small>تداوم مطالعه</small>
            </div>
            <div>
              <b>{fa(stats.longestStreak)}</b>
              <small>رکورد تداوم</small>
            </div>
            <div>
              <b>{fa(life.activeDays)}</b>
              <small>روز فعال</small>
            </div>
            <div>
              <b>{fa(Math.round(life.minutes / 6) / 10)}</b>
              <small>ساعت کل</small>
            </div>
          </div>
        </div>
      </header>

      <Overview report={reports[overviewP]} period={overviewP} onPeriod={setOverviewP} inputs={inputs} />

      <Section title="تفکیک روزانه" icon={ChartColumnStacked} period={dailyP} onPeriod={setDailyP}>
        <DailyBreakdown report={reports[dailyP]} />
      </Section>

      <Section title="تفکیک درسی" icon={ChartPie} period={subjectP} onPeriod={setSubjectP}>
        <SubjectDonut report={reports[subjectP]} />
      </Section>

      <Section title="پایداری مطالعه" icon={CalendarCheck2} period={streakP} onPeriod={setStreakP}>
        <Consistency report={reports[streakP]} goal={profile.dailyGoalMinutes} />
      </Section>

      <Section title="روند فعالیت" icon={ChartSpline} period={trendP} onPeriod={setTrendP}>
        <Trend report={reports[trendP]} />
      </Section>

      <Section title="نمودار پراکندگی مطالعه" icon={ChartScatter} period={scatterP} onPeriod={setScatterP}>
        <Scatter report={reports[scatterP]} />
      </Section>

      <button className="rp-cta" onClick={onStartFocus}>
        <BookOpen />
        <span>
          <b>جلسه بعدی را شروع کن</b>
          <small>هر دقیقه‌ای که ثبت کنی همین‌جا در نمودارها می‌نشیند</small>
        </span>
      </button>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* اسکلت مشترک                                                         */
/* ------------------------------------------------------------------ */

const PeriodTabs: React.FC<{ value: ReportPeriod; onChange: (p: ReportPeriod) => void }> = ({ value, onChange }) => (
  <div className="rp-tabs" role="tablist">
    {PERIODS.map((p) => (
      <button key={p} role="tab" aria-selected={value === p} className={value === p ? 'active' : ''} onClick={() => onChange(p)}>
        {PERIOD_LABELS[p]}
      </button>
    ))}
  </div>
);

const Section: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  period: ReportPeriod;
  onPeriod: (p: ReportPeriod) => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon: Icon, period, onPeriod, extra, children }) => (
  <section className="rp-section">
    <div className="rp-section-head">
      <h2>
        <span className="rp-section-icon">
          <Icon />
        </span>
        {title}
      </h2>
      {extra}
    </div>
    <PeriodTabs value={period} onChange={onPeriod} />
    {children}
  </section>
);

const Empty: React.FC<{ text: string; tall?: boolean }> = ({ text, tall }) => (
  <div className={`rp-empty ${tall ? 'tall' : ''}`}>
    <Sparkles />
    <span>{text}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* نمای کلی                                                            */
/* ------------------------------------------------------------------ */

const Overview: React.FC<{
  report: PeriodReport;
  period: ReportPeriod;
  onPeriod: (p: ReportPeriod) => void;
  inputs: Inputs;
}> = ({ report, period, onPeriod, inputs }) => {
  const [mode, setMode] = useState<'sum' | 'avg'>('sum');
  const prev = useMemo(() => buildPreviousTotals(period, inputs), [period, inputs]);
  const t = report.totals;
  const div = mode === 'avg' ? Math.max(1, report.elapsedDays) : 1;
  const pdiv = mode === 'avg' ? prev.elapsedDays : 1;

  const cards: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    cur: number;
    prev: number;
    format: (v: number) => string;
  }[] = [
    { label: 'مدت زمان مطالعه', icon: Clock3, tone: 'violet', cur: t.study / div, prev: prev.study / pdiv, format: (v) => formatMinutesShort(v) },
    { label: 'تعداد تست', icon: ListChecks, tone: 'orange', cur: t.tests / div, prev: prev.tests / pdiv, format: (v) => fa(Math.round(v)) },
    { label: 'مدت کلاس', icon: GraduationCap, tone: 'amber', cur: t.class / div, prev: prev.class / pdiv, format: (v) => formatMinutesShort(v) },
    { label: 'سایر فعالیت‌ها', icon: Sparkles, tone: 'green', cur: t.other / div, prev: prev.other / pdiv, format: (v) => formatMinutesShort(v) },
    { label: 'تعداد جلسات', icon: Timer, tone: 'blue', cur: t.sessions / div, prev: prev.sessions / pdiv, format: (v) => fa(Math.round(v * 10) / 10) },
    {
      label: 'روزهای فعال',
      icon: Target,
      tone: 'pink',
      cur: mode === 'avg' ? (t.activeDays / div) * 100 : t.activeDays,
      prev: mode === 'avg' ? (prev.activeDays / pdiv) * 100 : prev.activeDays,
      format: (v) => (mode === 'avg' ? `${fa(Math.round(v))}٪` : `${fa(v)} از ${fa(report.elapsedDays)}`),
    },
  ];

  return (
    <section className="rp-section">
      <div className="rp-section-head">
        <h2>
          <span className="rp-section-icon">
            <LayoutGrid />
          </span>
          نمای کلی
        </h2>
        <label className="rp-mode">
          <select value={mode} onChange={(e) => setMode(e.target.value as 'sum' | 'avg')}>
            <option value="sum">مجموع</option>
            <option value="avg">میانگین روزانه</option>
          </select>
          <ChevronDown />
        </label>
      </div>
      <PeriodTabs value={period} onChange={onPeriod} />
      <p className="rp-range-title">{report.title}</p>
      <div className="rp-cards">
        {cards.map((c) => {
          const Icon = c.icon;
          const has = c.cur > 0;
          let chip: React.ReactNode = <em className="rp-chip none">بدون داده</em>;
          if (has && c.prev <= 0) chip = <em className="rp-chip new">اولین داده</em>;
          else if (has || c.prev > 0) {
            const diff = Math.round(((c.cur - c.prev) / Math.max(c.prev, 0.0001)) * 100);
            chip = (
              <em className={`rp-chip ${diff >= 0 ? 'up' : 'down'}`}>
                {diff >= 0 ? '▲' : '▼'} {fa(Math.abs(diff))}٪
              </em>
            );
          }
          return (
            <article key={c.label} className={`rp-card tone-${c.tone}`}>
              <span className="rp-card-icon">
                <Icon />
              </span>
              <small>{c.label}</small>
              <b>{has ? c.format(c.cur) : '—'}</b>
              {chip}
            </article>
          );
        })}
      </div>
      <p className="rp-foot-note">مقایسه با همین تعداد روز از دوره‌ی قبل{mode === 'avg' ? '، بر اساس میانگین هر روز سپری‌شده' : ''}</p>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* تفکیک روزانه — ستون‌های انباشته                                      */
/* ------------------------------------------------------------------ */

const DailyBreakdown: React.FC<{ report: PeriodReport }> = ({ report }) => {
  const [sel, setSel] = useState<number | null>(null);
  const cols = report.byWeekday;
  const max = Math.max(60, ...cols.map((c) => c.total));
  const has = report.totals.all > 0;
  const selected = sel !== null ? cols[sel] : null;

  return (
    <div className="rp-chart-card">
      {!has ? (
        <Empty text="هنوز فعالیتی برای تفکیک ثبت نشده است" tall />
      ) : (
        <>
          {!report.isWeek && <p className="rp-chart-caption">مجموع هر روز هفته در {report.title}</p>}
          <div className="rp-stack">
            {cols.map((c) => (
              <button key={c.idx} className={`rp-stack-col ${sel === c.idx ? 'sel' : ''}`} onClick={() => setSel(sel === c.idx ? null : c.idx)}>
                <span className="rp-stack-val">{hoursLabel(c.total)}</span>
                <div className="rp-stack-bar">
                  <div className="rp-stack-fill" style={{ height: `${(c.total / max) * 100}%` }}>
                    {KINDS.map((k) =>
                      c[k] > 0 ? <i key={k} style={{ flexGrow: c[k], background: KIND_META[k].color }} /> : null,
                    )}
                  </div>
                </div>
                <small>{WEEKDAY_LABELS[c.idx]}</small>
              </button>
            ))}
          </div>
          {selected && (
            <div className="rp-tip">
              <b>{WEEKDAY_LABELS[selected.idx]}</b>
              {KINDS.map((k) => (
                <span key={k}>
                  <i style={{ background: KIND_META[k].color }} />
                  {KIND_META[k].label}: {formatMinutesShort(selected[k])}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <div className="rp-legend">
        {KINDS.map((k) => (
          <span key={k}>
            <i style={{ background: KIND_META[k].color }} />
            {KIND_META[k].label} {fa(report.kindPct[k])}٪
          </span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* تفکیک درسی — دونات                                                  */
/* ------------------------------------------------------------------ */

const SubjectDonut: React.FC<{ report: PeriodReport }> = ({ report }) => {
  const [active, setActive] = useState<string | null>(null);
  const slices = report.subjects;
  const total = slices.reduce((n, s) => n + s.minutes, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const focus = slices.find((s) => s.key === active);

  return (
    <div className="rp-chart-card rp-donut-card">
      <div className="rp-donut-wrap">
        <svg viewBox="0 0 140 140" className="rp-donut">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--rp-track)" strokeWidth="18" />
          {total > 0 &&
            slices.map((s) => {
              const len = (s.minutes / total) * C;
              const gap = slices.length > 1 ? Math.min(2.5, len * 0.25) : 0;
              const el = (
                <circle
                  key={s.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === s.key ? 22 : 18}
                  strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  transform="rotate(-90 70 70)"
                  style={{ opacity: active && active !== s.key ? 0.35 : 1, transition: 'all .25s', cursor: 'pointer' }}
                  onClick={() => setActive(active === s.key ? null : s.key)}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="rp-donut-center">
          {total > 0 ? (
            <>
              <b>{focus ? `${fa(focus.pct)}٪` : formatMinutesShort(total)}</b>
              <small>{focus ? focus.name : 'مجموع درس‌ها'}</small>
            </>
          ) : (
            <small>—</small>
          )}
        </div>
      </div>
      {total > 0 ? (
        <ul className="rp-donut-legend">
          {slices.slice(0, 8).map((s) => (
            <li key={s.key} className={active === s.key ? 'active' : ''} onClick={() => setActive(active === s.key ? null : s.key)}>
              <i style={{ background: s.color }} />
              <span>{s.name}</span>
              <b>{fa(s.pct)}٪</b>
              <small>{formatMinutesShort(s.minutes)}</small>
            </li>
          ))}
          {slices.length > 8 && <li className="more">+ {fa(slices.length - 8)} درس دیگر</li>}
        </ul>
      ) : (
        <p className="rp-donut-empty">هنوز مطالعه‌ای با درس مشخص ثبت نشده است</p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* پایداری مطالعه — تقویم فعالیت                                        */
/* ------------------------------------------------------------------ */

const Consistency: React.FC<{ report: PeriodReport; goal: number }> = ({ report, goal }) => {
  const t = report.totals;
  const target = Math.max(30, goal || 120);
  const level = (d: ReportDay) => (d.total <= 0 ? 0 : d.total < target * 0.34 ? 1 : d.total < target * 0.67 ? 2 : d.total < target ? 3 : 4);
  const lead = report.isWeek ? 0 : report.days[0]?.weekdayIdx ?? 0;

  return (
    <div className="rp-chart-card">
      <div className="rp-streak-summary">
        <span>
          <b>{formatMinutesToPersian(t.all)}</b> فعالیت در طول <b>{fa(t.activeDays)}</b> روز فعال
        </span>
        <span className="muted">
          <b>{fa(t.inactiveDays)}</b> روز بدون مطالعه
        </span>
      </div>
      <div className="rp-streak-meta">
        <span>
          <Flame /> بیشترین پیوستگی: {fa(t.longestRun)} روز
        </span>
        <span>
          <Target /> هدف روزانه: {formatMinutesShort(target)}
        </span>
      </div>

      {report.isWeek ? (
        <div className="rp-week-cells">
          {report.days.map((d) => (
            <div key={d.iso} className="rp-week-cell">
              <div className={`rp-cell lv-${level(d)} ${d.isFuture ? 'future' : ''} ${d.isToday ? 'today' : ''}`}>
                {d.isFuture ? '' : d.total > 0 ? hoursLabel(d.total) : 'بدون مطالعه'}
              </div>
              <small>{WEEKDAY_LABELS[d.weekdayIdx]}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="rp-month-grid">
          {WEEKDAY_SHORT.map((w) => (
            <small key={w} className="rp-month-head">
              {w}
            </small>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {report.days.map((d) => (
            <div
              key={d.iso}
              title={`${fa(d.jDay)} — ${formatMinutesShort(d.total)}`}
              className={`rp-cell mini lv-${level(d)} ${d.isFuture ? 'future' : ''} ${d.isToday ? 'today' : ''}`}
            >
              {fa(d.jDay)}
            </div>
          ))}
        </div>
      )}

      <div className="rp-legend">
        <span>
          <i className="lg-active" /> فعال
        </span>
        <span>
          <i className="lg-none" /> بدون مطالعه
        </span>
        <span>
          <i className="lg-future" /> روزهای پیش‌رو
        </span>
        <span className="rp-scale">
          کم <i className="lv-1" />
          <i className="lv-2" />
          <i className="lv-3" />
          <i className="lv-4" /> زیاد
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* روند فعالیت — نمودار خطی                                            */
/* ------------------------------------------------------------------ */

const W = 320;

const Trend: React.FC<{ report: PeriodReport }> = ({ report }) => {
  const [kind, setKind] = useState<ActivityKind>('study');
  const [sel, setSel] = useState<number | null>(null);
  const days = report.days;
  const H = 170;
  const padX = 18;
  const top = 22;
  const bottom = 128;
  const values = days.map((d) => d[kind]);
  const max = Math.max(30, ...values);
  const has = values.some((v) => v > 0);
  const color = KIND_META[kind].color;
  const n = days.length;
  // راست‌به‌چپ: اولین روز سمت راست
  const xOf = (i: number) => (n === 1 ? W / 2 : W - padX - (i * (W - padX * 2)) / (n - 1));
  const yOf = (v: number) => bottom - (v / max) * (bottom - top);
  const lastIdx = days.reduce((acc, d, i) => (!d.isFuture ? i : acc), -1);
  const pts = days.slice(0, lastIdx + 1).map((d, i) => [xOf(i), yOf(d[kind])] as const);

  const path = smoothPath(pts);
  const area = pts.length ? `${path} L ${pts[pts.length - 1][0]} ${bottom} L ${pts[0][0]} ${bottom} Z` : '';
  const gid = `rp-trend-${kind}`;
  const labelEvery = report.isWeek ? 1 : 5;

  return (
    <div className="rp-chart-card">
      {!has && <Empty text={`داده‌ای برای ${KIND_META[kind].label} در این بازه ثبت نشده است`} />}
      <svg viewBox={`0 0 ${W} ${H}`} className="rp-svg" style={{ display: has ? undefined : 'none' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padX} x2={W - padX} y1={bottom - f * (bottom - top)} y2={bottom - f * (bottom - top)} className="rp-grid" />
        ))}
        <line x1={padX} x2={W - padX} y1={bottom} y2={bottom} className="rp-axis" />
        {area && <path d={area} fill={`url(#${gid})`} />}
        {path && <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        {days.map((d, i) => {
          if (d.isFuture) return null;
          const x = xOf(i);
          const y = yOf(d[kind]);
          const isSel = sel === i;
          return (
            <g key={d.iso} onClick={() => setSel(isSel ? null : i)} style={{ cursor: 'pointer' }}>
              <rect x={x - 8} y={top - 10} width="16" height={bottom - top + 14} fill="transparent" />
              {(report.isWeek || d[kind] > 0 || isSel) && (
                <circle cx={x} cy={y} r={isSel ? 5.5 : report.isWeek ? 4 : 2.6} fill="var(--rp-surface)" stroke={color} strokeWidth="2.4" />
              )}
              {report.isWeek && d[kind] > 0 && (
                <text x={x} y={y - 9} className="rp-val" textAnchor="middle">
                  {hoursLabel(d[kind])}
                </text>
              )}
            </g>
          );
        })}
        {days.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={`l-${d.iso}`}
              x={xOf(i)}
              y={bottom + 16}
              className={`rp-xlabel ${d.isToday ? 'today' : ''}`}
              textAnchor={report.isWeek ? 'end' : 'middle'}
              transform={report.isWeek ? `rotate(-35 ${xOf(i)} ${bottom + 16})` : undefined}
            >
              {report.isWeek ? WEEKDAY_LABELS[d.weekdayIdx] : fa(d.jDay)}
            </text>
          ) : null,
        )}
      </svg>
      {sel !== null && days[sel] && (
        <div className="rp-tip">
          <b>
            {WEEKDAY_LABELS[days[sel].weekdayIdx]} {fa(days[sel].jDay)}
          </b>
          <span>
            <i style={{ background: color }} />
            {KIND_META[kind].label}: {formatMinutesShort(days[sel][kind])}
          </span>
        </div>
      )}
      <div className="rp-kind-switch">
        {KINDS.map((k) => (
          <button
            key={k}
            className={kind === k ? 'active' : ''}
            style={kind === k ? { background: KIND_META[k].color } : undefined}
            onClick={() => {
              setKind(k);
              setSel(null);
            }}
          >
            {KIND_META[k].label}
          </button>
        ))}
      </div>
    </div>
  );
};

function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] ?? pts[i + 1];
    const t = 0.18;
    d += ` C ${x1 + (x2 - x0) * t} ${y1 + (y2 - y0) * t}, ${x2 - (x3 - x1) * t} ${y2 - (y3 - y1) * t}, ${x2} ${y2}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* پراکندگی مطالعه — ساعت شروع و پایان جلسه‌ها                          */
/* ------------------------------------------------------------------ */

const Scatter: React.FC<{ report: PeriodReport }> = ({ report }) => {
  const [sel, setSel] = useState<number | null>(null);
  const days = report.days;
  const all = days.flatMap((d) => d.windows);

  if (!all.length) {
    return (
      <div className="rp-chart-card">
        <Empty text="برای رسم این نمودار به جلسه‌هایی با ساعت شروع و پایان مشخص نیاز است. از تایمر تمرکز یا «ثبت دستی» با ساعت شروع استفاده کن." tall />
        <ScatterLegend />
      </div>
    );
  }

  const minH = Math.max(0, Math.floor(Math.min(...all.map((w) => w.start)) / 60) - 1);
  const maxH = Math.min(24, Math.ceil(Math.max(...all.map((w) => w.end)) / 60) + 1);
  const span = Math.max(4, maxH - minH);
  const H = 250;
  const top = 14;
  const bottom = 214;
  const axisW = 34;
  const padL = 10;
  const n = days.length;
  const colW = (W - axisW - padL) / n;
  // راست‌به‌چپ: محور ساعت سمت راست، اولین روز کنارش
  const xOf = (i: number) => W - axisW - colW * (i + 0.5);
  const yOf = (m: number) => top + ((m / 60 - minH) / span) * (bottom - top);
  const step = span > 12 ? 3 : span > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let h = minH; h <= minH + span; h += step) ticks.push(h);

  const avgStart = Math.round(all.reduce((n2, w) => n2 + w.start, 0) / all.length);
  const avgEnd = Math.round(all.reduce((n2, w) => n2 + w.end, 0) / all.length);
  const selDay = sel !== null ? days[sel] : null;

  return (
    <div className="rp-chart-card">
      <div className="rp-scatter-stats">
        <span>
          میانگین شروع <b>{fa(minutesToTime(avgStart))}</b>
        </span>
        <span>
          میانگین پایان <b>{fa(minutesToTime(avgEnd))}</b>
        </span>
        <span>
          <b>{fa(all.length)}</b> جلسه
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="rp-svg">
        <defs>
          <linearGradient id="rp-sc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfa" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        {ticks.map((h) => (
          <g key={h}>
            <line x1={padL} x2={W - axisW} y1={yOf(h * 60)} y2={yOf(h * 60)} className="rp-grid" />
            <text x={W - axisW + 6} y={yOf(h * 60) + 3} className="rp-ylabel" textAnchor="start">
              {fa(`${h < 10 ? '0' : ''}${h}:00`)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = xOf(i);
          const isSel = sel === i;
          return (
            <g key={d.iso} onClick={() => setSel(isSel ? null : i)} style={{ cursor: 'pointer' }}>
              <rect x={x - colW / 2} y={top} width={colW} height={bottom - top} fill={isSel ? 'var(--rp-soft)' : 'transparent'} rx="6" />
              {d.windows.map((w, j) => {
                const lw = Math.min(8, Math.max(3, colW * 0.32));
                const off = d.windows.length > 1 ? ((j % 2) * 2 - 1) * Math.min(colW * 0.16, 4) : 0;
                return (
                  <g key={j}>
                    <line x1={x + off} x2={x + off} y1={yOf(w.start)} y2={yOf(w.end)} stroke="url(#rp-sc-grad)" strokeOpacity="0.28" strokeWidth={lw} strokeLinecap="round" />
                    <circle cx={x + off} cy={yOf(w.start)} r={report.isWeek ? 4.2 : 2.8} fill="#7c5cfa" stroke="var(--rp-surface)" strokeWidth="1.4" />
                    <circle cx={x + off} cy={yOf(w.end)} r={report.isWeek ? 4.2 : 2.8} fill="#334155" stroke="var(--rp-surface)" strokeWidth="1.4" />
                  </g>
                );
              })}
              {(report.isWeek || i % 5 === 0 || i === n - 1) && (
                <text x={x} y={bottom + 18} className={`rp-xlabel ${d.isToday ? 'today' : ''}`} textAnchor="middle">
                  {report.isWeek ? WEEKDAY_SHORT[d.weekdayIdx] : fa(d.jDay)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {selDay && (
        <div className="rp-tip column">
          <b>
            {WEEKDAY_LABELS[selDay.weekdayIdx]} {fa(selDay.jDay)}
          </b>
          {selDay.windows.length ? (
            selDay.windows.map((w, j) => (
              <span key={j}>
                <i style={{ background: KIND_META[w.kind].color }} />
                {w.subjectName}: {fa(minutesToTime(w.start))} تا {fa(minutesToTime(w.end))}
              </span>
            ))
          ) : (
            <span>جلسه‌ای با ساعت مشخص ثبت نشده</span>
          )}
        </div>
      )}
      <ScatterLegend />
    </div>
  );
};

const ScatterLegend = () => (
  <div className="rp-legend">
    <span>
      <i style={{ background: '#7c5cfa' }} /> زمان شروع
    </span>
    <span>
      <i style={{ background: '#334155' }} /> زمان پایان
    </span>
  </div>
);
