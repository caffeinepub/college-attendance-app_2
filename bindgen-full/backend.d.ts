import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttendanceRecord {
    status: AttendanceStatus;
    date: string;
    dept: string;
    year: bigint;
    staffUsername: string;
    subjectId: string;
    regNo: string;
}
export interface Subject {
    id: string;
    name: string;
}
export interface UserProfile {
    username: string;
    role: string;
}
export interface AttendanceInput {
    status: AttendanceStatus;
    regNo: string;
}
export enum AttendanceStatus {
    present = "present",
    absent = "absent",
    onDuty = "onDuty"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAttendanceByStaff(token: string, dept: string, year: bigint): Promise<{
        __kind__: "ok";
        ok: Array<AttendanceRecord>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getStudentAttendance(regNo: string, dept: string, year: bigint): Promise<Array<AttendanceRecord>>;
    getSubjectsForDept(deptKey: string): Promise<Array<Subject>>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(token: string, subjectId: string, date: string, attendanceList: Array<AttendanceInput>, dept: string, year: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveSubjectsForDept(token: string, deptKey: string, subjects: Array<Subject>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    staffCreateAccount(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    staffLogin(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    staffLogout(token: string): Promise<void>;
}
