import type {
  AttendanceInput,
  AttendanceRecord,
  RegistrationNumber,
  SessionToken,
  SubjectId,
} from "./types/attendance";

declare module "./backend" {
  interface backendInterface {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;

    // ── Auth ──────────────────────────────────────────────────
    login(username: string, password: string): Promise<SessionToken>;
    logout(token: SessionToken): Promise<void>;

    // ── Attendance ────────────────────────────────────────────
    markAttendance(
      token: SessionToken,
      subjectId: SubjectId,
      date: string,
      attendanceList: AttendanceInput[],
    ): Promise<void>;

    getAttendanceByStaff(token: SessionToken): Promise<AttendanceRecord[]>;

    getStudentAttendanceRecords(
      regNo: RegistrationNumber,
    ): Promise<AttendanceRecord[]>;
  }
  interface Backend {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;

    // ── Auth ──────────────────────────────────────────────────
    login(username: string, password: string): Promise<SessionToken>;
    logout(token: SessionToken): Promise<void>;

    // ── Attendance ────────────────────────────────────────────
    markAttendance(
      token: SessionToken,
      subjectId: SubjectId,
      date: string,
      attendanceList: AttendanceInput[],
    ): Promise<void>;

    getAttendanceByStaff(token: SessionToken): Promise<AttendanceRecord[]>;

    getStudentAttendanceRecords(
      regNo: RegistrationNumber,
    ): Promise<AttendanceRecord[]>;
  }
}
