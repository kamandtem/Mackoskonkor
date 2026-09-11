export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type SessionMode = 'virtual' | 'physical';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'my-seat' | 'disabled' | 'maintenance';
export interface Organization { id: string; name: string; }
export interface Branch { id: string; organizationId: string; name: string; address: string; }
export interface StudyHall { id: string; branchId: string; name: string; isActive: boolean; opensAt: string; closesAt: string; }
export interface HallSection { id: string; hallId: string; floorName: string; name: string; }
export interface Seat { id: string; sectionId: string; number: string; row: number; column: number; status: SeatStatus; qrId: string; assignedStudentId?: string; occupantName?: string; subjectName?: string; checkedInAt?: string; }
export interface SeatQr { id: string; seatId: string; token: string; active: boolean; version: number; }
export interface StudyHallSession {
  id: string; studentId: string; virtualRoomId?: string; organizationId?: string; branchId?: string; hallId?: string; sectionId?: string; seatId?: string; qrId?: string;
  subjectId: string; subjectName: string; mode: SessionMode; checkInTime: string; checkOutTime?: string; attendanceSeconds: number; studySeconds: number;
  status: SessionStatus; date: string; syncStatus: SyncState; createdAt: string; updatedAt: string;
}
export interface QrValidationContext { studentId: string; token: string; now: string; }
export interface QrValidationResult {
  valid: boolean; code?: 'INVALID_QR' | 'INACTIVE_QR' | 'HALL_CLOSED' | 'NO_ACCESS' | 'SUBSCRIPTION_INACTIVE' | 'SEAT_UNAVAILABLE' | 'ACTIVE_SESSION';
  message: string; organization?: Organization; branch?: Branch; hall?: StudyHall; section?: HallSection; seat?: Seat; qr?: SeatQr;
}
export interface StudyHallSnapshot { organization: Organization; branch: Branch; hall: StudyHall; sections: HallSection[]; seats: Seat[]; sessions: StudyHallSession[]; }
export interface StudyHallLocation { organization: Organization; branch: Branch; hall: StudyHall; sections: HallSection[]; }
export interface StudyHallRepository {
  getSnapshot(): Promise<StudyHallSnapshot>;
  listLocations(): Promise<StudyHallLocation[]>;
  selectLocation(branchId: string, hallId: string): Promise<StudyHallSnapshot>;
  validateQr(context: QrValidationContext): Promise<QrValidationResult>;
  saveSession(session: StudyHallSession): Promise<StudyHallSession>;
  updateSeat(seat: Seat): Promise<Seat>;
  regenerateSeatQr(seatId: string): Promise<SeatQr>;
}

export type VirtualRoomRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export interface VirtualRoomMember { studentId: string; displayName: string; role: VirtualRoomRole; joinedAt: string; totalStudySeconds: number; status: 'studying' | 'break' | 'offline'; }
export interface VirtualRoomRequest { id: string; roomId: string; studentId: string; displayName: string; status: MembershipStatus; createdAt: string; reviewedAt?: string; reviewedBy?: string; }
export interface VirtualStudyRoom { id: string; slug: string; name: string; description: string; ownerId: string; visibility: 'public' | 'private'; capacity: number; createdAt: string; updatedAt: string; members: VirtualRoomMember[]; requests: VirtualRoomRequest[]; }
export interface VirtualRoomRepository {
  listRooms(studentId: string): Promise<VirtualStudyRoom[]>;
  createRoom(input: Pick<VirtualStudyRoom, 'name'|'slug'|'description'|'visibility'|'capacity'>, owner: VirtualRoomMember): Promise<VirtualStudyRoom>;
  joinPublicRoom(roomId: string, member: VirtualRoomMember): Promise<VirtualStudyRoom>;
  requestMembership(roomId: string, studentId: string, displayName: string): Promise<VirtualRoomRequest>;
  reviewMembership(roomId: string, requestId: string, reviewerId: string, approve: boolean): Promise<VirtualStudyRoom>;
  addMember(roomId: string, member: VirtualRoomMember, actorId: string): Promise<VirtualStudyRoom>;
  recordStudy(roomId: string, studentId: string, seconds: number): Promise<VirtualStudyRoom>;
}
