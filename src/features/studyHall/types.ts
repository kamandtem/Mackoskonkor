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
  id: string; studentId: string; roomId?: string; organizationId?: string; branchId?: string; hallId?: string; sectionId?: string; seatId?: string; qrId?: string;
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

export type RoomRole = 'owner' | 'manager' | 'member';
export type MembershipStatus = 'active' | 'pending' | 'rejected';
export interface VirtualRoomMember { id: string; name: string; role: RoomRole; status: MembershipStatus; joinedAt: string; studySeconds: number; avatar?: string; }
export interface VirtualStudyRoom {
  id: string; name: string; handle: string; category: string; capacity: number; isPrivate: boolean;
  ownerId: string; ownerName: string; accent: string; pattern: string; createdAt: string; updatedAt: string;
  members: VirtualRoomMember[];
}
export interface CreateVirtualRoomInput { name: string; handle: string; category: string; capacity: number; isPrivate: boolean; ownerId: string; ownerName: string; }

export interface StudyHallRepository {
  getSnapshot(): Promise<StudyHallSnapshot>;
  listLocations(): Promise<StudyHallLocation[]>;
  selectLocation(branchId: string, hallId: string): Promise<StudyHallSnapshot>;
  validateQr(context: QrValidationContext): Promise<QrValidationResult>;
  saveSession(session: StudyHallSession): Promise<StudyHallSession>;
  updateSeat(seat: Seat): Promise<Seat>;
  regenerateSeatQr(seatId: string): Promise<SeatQr>;
  listVirtualRooms(): Promise<VirtualStudyRoom[]>;
  createVirtualRoom(input: CreateVirtualRoomInput): Promise<VirtualStudyRoom>;
  requestRoomMembership(roomId: string, studentId: string, studentName: string): Promise<VirtualStudyRoom>;
  reviewRoomMembership(roomId: string, memberId: string, approve: boolean): Promise<VirtualStudyRoom>;
  addRoomMember(roomId: string, studentId: string, studentName: string): Promise<VirtualStudyRoom>;
  recordRoomStudy(roomId: string, studentId: string, seconds: number): Promise<void>;
}
