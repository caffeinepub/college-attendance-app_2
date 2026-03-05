// ── Attendance domain types ─────────────────────────────────
// These are local frontend type definitions that mirror the Motoko backend types.

export type RegistrationNumber = string;
export type SubjectId = string;
export type SessionToken = string;

export enum AttendanceStatus {
  present = "present",
  absent = "absent",
  onDuty = "onDuty",
}

export interface AttendanceInput {
  regNo: RegistrationNumber;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  regNo: RegistrationNumber;
  subjectId: SubjectId;
  date: string;
  status: AttendanceStatus;
  staffUsername: string;
  dept?: string;
  year?: number;
}

export interface StudentAttendanceSummary {
  subjectName: string;
  totalClasses: bigint | number;
  presentCount: bigint | number;
  absentCount: bigint | number;
  onDutyCount: bigint | number;
  percentage: number;
}

export interface OverallAttendanceSummary {
  regNo: RegistrationNumber;
  name: string;
  subjectSummaries: StudentAttendanceSummary[];
  overallPercentage: number;
}
