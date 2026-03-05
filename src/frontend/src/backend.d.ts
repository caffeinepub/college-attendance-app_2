import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface OverallAttendanceSummary {
    name: string;
    overallPercentage: number;
    subjectSummaries: Array<StudentAttendanceSummary>;
    regNo: RegistrationNumber;
}
export type RegistrationNumber = string;
export type SessionToken = string;
export interface StudentAttendanceSummary {
    totalClasses: bigint;
    subjectName: string;
    presentCount: bigint;
    absentCount: bigint;
    percentage: number;
}
export interface AttendanceInput {
    status: AttendanceStatus;
    regNo: RegistrationNumber;
}
export interface AttendanceRecord {
    status: AttendanceStatus;
    date: string;
    staffUsername: string;
    subjectId: SubjectId;
    regNo: RegistrationNumber;
}
export type SubjectId = string;
export interface Subject {
    id: SubjectId;
    name: string;
}
export interface Student {
    name: string;
    registrationNumber: RegistrationNumber;
}
export enum AttendanceStatus {
    present = "present",
    absent = "absent"
}
export interface backendInterface {
    getAttendanceByStaff(token: SessionToken): Promise<Array<AttendanceRecord>>;
    getStudentAttendanceRecords(regNo: RegistrationNumber): Promise<Array<AttendanceRecord>>;
    getStudentAttendanceSummary(regNo: RegistrationNumber): Promise<OverallAttendanceSummary>;
    getStudents(): Promise<Array<Student>>;
    getSubjects(): Promise<Array<Subject>>;
    initiateSeedData(): Promise<void>;
    login(username: string, password: string): Promise<SessionToken>;
    logout(token: SessionToken): Promise<void>;
    markAttendance(token: SessionToken, subjectId: SubjectId, date: string, attendanceList: Array<AttendanceInput>): Promise<void>;
    resetAttendanceData(): Promise<void>;
}
