import { HallSection, QrValidationContext, QrValidationResult, Seat, SeatQr, StudyHallRepository, StudyHallSession, StudyHallSnapshot } from './types';

const STORAGE_KEY = 'konkur_study_hall_v1';
export const LOCAL_STUDENT_ID = 'local-student';
const sections: HallSection[] = [{ id: 'section-a', hallId: 'hall-main', floorName: 'طبقه اول', name: 'بخش آرام' }];
const statuses: Seat['status'][] = ['available','occupied','reserved','available','my-seat','occupied','available','maintenance','available','occupied','available','available','disabled','available','occupied','available','available','reserved','available','available'];
const createInitialSnapshot = (): StudyHallSnapshot => ({
  organization: { id: 'org-puzzle', name: 'پازل' },
  branch: { id: 'branch-valiasr', organizationId: 'org-puzzle', name: 'شعبه ولیعصر', address: 'تهران، خیابان ولیعصر' },
  hall: { id: 'hall-main', branchId: 'branch-valiasr', name: 'سالن اصلی', isActive: true, opensAt: '06:30', closesAt: '22:30' },
  sections,
  seats: statuses.map((status, index) => {
    const number = String(index + 1).padStart(2, '0');
    return { id: `seat-${number}`, sectionId: 'section-a', number, row: Math.floor(index / 4), column: index % 4, status, qrId: `qr-${number}`,
      assignedStudentId: status === 'my-seat' ? LOCAL_STUDENT_ID : undefined,
      occupantName: status === 'occupied' ? ['سارا محمدی','علی رضایی','هلیا احمدی'][index % 3] : undefined,
      subjectName: status === 'occupied' ? ['زیست‌شناسی','ریاضی','فیزیک'][index % 3] : undefined,
      checkedInAt: status === 'occupied' ? ['08:42','09:15','10:05'][index % 3] : undefined };
  }),
  sessions: [],
});
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class LocalStudyHallRepository implements StudyHallRepository {
  private read(): StudyHallSnapshot { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as StudyHallSnapshot; } catch {} return createInitialSnapshot(); }
  private write(snapshot: StudyHallSnapshot): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch {} }
  async getSnapshot() { return clone(this.read()); }
  async validateQr(context: QrValidationContext): Promise<QrValidationResult> {
    const snapshot = this.read();
    const seat = snapshot.seats.find(item => item.qrId === context.token || `PZL:${item.id}:v1` === context.token);
    if (!seat) return { valid: false, code: 'INVALID_QR', message: 'این کد متعلق به سالن پازل نیست.' };
    if (!snapshot.hall.isActive) return { valid: false, code: 'HALL_CLOSED', message: 'سالن در حال حاضر غیرفعال است.' };
    if (snapshot.sessions.some(item => item.studentId === context.studentId && item.status !== 'completed')) return { valid: false, code: 'ACTIVE_SESSION', message: 'یک نشست فعال داری؛ اول همان را تمام کن.' };
    if (!['available','my-seat'].includes(seat.status)) return { valid: false, code: 'SEAT_UNAVAILABLE', message: 'این صندلی الان قابل استفاده نیست.' };
    if (seat.assignedStudentId && seat.assignedStudentId !== context.studentId) return { valid: false, code: 'NO_ACCESS', message: 'این صندلی به دانش‌آموز دیگری اختصاص دارد.' };
    const qr: SeatQr = { id: seat.qrId, seatId: seat.id, token: `PZL:${seat.id}:v1`, active: true, version: 1 };
    return { valid: true, message: 'صندلی تأیید شد.', organization: snapshot.organization, branch: snapshot.branch, hall: snapshot.hall, section: snapshot.sections.find(item => item.id === seat.sectionId), seat: clone(seat), qr };
  }
  async saveSession(session: StudyHallSession) { const snapshot = this.read(); const i = snapshot.sessions.findIndex(x => x.id === session.id); if (i >= 0) snapshot.sessions[i] = clone(session); else snapshot.sessions.unshift(clone(session)); this.write(snapshot); return clone(session); }
  async updateSeat(seat: Seat) { const snapshot = this.read(); snapshot.seats = snapshot.seats.map(x => x.id === seat.id ? clone(seat) : x); this.write(snapshot); return clone(seat); }
  async regenerateSeatQr(seatId: string) { const snapshot = this.read(); const seat = snapshot.seats.find(x => x.id === seatId); if (!seat) throw new Error('صندلی پیدا نشد.'); const version = Date.now(); seat.qrId = `qr-${seat.number}-${version}`; this.write(snapshot); return { id: seat.qrId, seatId, token: `PZL:${seat.id}:v${version}`, active: true, version }; }
}
export const localStudyHallRepository = new LocalStudyHallRepository();
