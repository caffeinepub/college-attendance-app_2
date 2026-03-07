import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceInput,
  AttendanceRecord,
  RegistrationNumber,
  SessionToken,
  SubjectId,
} from "../types/attendance";
import type { AttendanceStatus } from "../types/attendance";
import type { SubjectEntry } from "../utils/attendanceData";
import { useActor } from "./useActor";

// ── Session token helpers (sessionStorage only — not attendance data) ─────────
function saveTokenToSession(token: string): void {
  sessionStorage.setItem("staff_session_token", token);
}
function getTokenFromSession(): string | null {
  return sessionStorage.getItem("staff_session_token");
}
function clearTokenFromSession(): void {
  sessionStorage.removeItem("staff_session_token");
}

export { getTokenFromSession };

// ── Subjects (backend canister) ───────────────────────────────────────────────
export function useGetSubjectsForDept(deptKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SubjectEntry[]>({
    queryKey: ["subjects", deptKey],
    queryFn: async (): Promise<SubjectEntry[]> => {
      if (!actor || !deptKey) return [];
      try {
        const result = await actor.getSubjectsForDept(deptKey);
        return result as SubjectEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!deptKey,
  });
}

export function useSaveSubjectsForDept() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      deptKey,
      subjects,
    }: {
      token: SessionToken;
      deptKey: string;
      subjects: SubjectEntry[];
    }): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.saveSubjectsForDept(token, deptKey, subjects);
      if ("err" in result) {
        throw new Error(result.err as string);
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["subjects", variables.deptKey],
      });
    },
  });
}

// ── Staff Attendance Records ─────────────────────────────────
export function useAttendanceByStaff(
  token: SessionToken | null,
  deptKey?: string,
  year?: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["staffRecords", token, deptKey, year],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!actor || !token || !deptKey || year === undefined) return [];
      const result = await actor.getAttendanceByStaff(
        token,
        deptKey,
        BigInt(year),
      );
      if ("err" in result) {
        throw new Error(result.err as string);
      }
      return result.ok.map((r) => ({
        ...r,
        status: r.status as unknown as AttendanceStatus,
        year: r.year,
      })) as AttendanceRecord[];
    },
    enabled:
      !!actor && !isFetching && !!token && !!deptKey && year !== undefined,
  });
}

// ── Student Attendance Records (raw, for frontend calculations) ──
export function useStudentAttendanceRecords(
  regNo: RegistrationNumber | null,
  deptKey?: string,
  year?: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentRecords", regNo, deptKey, year],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!actor || !regNo || !deptKey || year === undefined) return [];
      try {
        const result = await actor.getStudentAttendance(
          regNo,
          deptKey,
          BigInt(year),
        );
        return result.map((r) => ({
          ...r,
          status: r.status as unknown as AttendanceStatus,
          year: r.year,
        })) as AttendanceRecord[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!regNo,
    retry: false,
  });
}

// ── Login ────────────────────────────────────────────────────
export function useLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<SessionToken> => {
      if (!actor) throw new Error("Not connected to backend");
      const result = await actor.staffLogin(username, password);
      if ("err" in result) {
        throw new Error(
          (result.err as string) || "Invalid username or password",
        );
      }
      const token = result.ok;
      saveTokenToSession(token);
      return token;
    },
  });
}

// ── Create Staff Account ─────────────────────────────────────
export function useCreateStaffAccount() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<void> => {
      if (!actor) throw new Error("Not connected to backend");
      const result = await actor.staffCreateAccount(username, password);
      if ("err" in result) {
        throw new Error((result.err as string) || "Failed to create account");
      }
    },
  });
}

// ── Logout ───────────────────────────────────────────────────
export function useLogout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: SessionToken): Promise<void> => {
      if (actor) {
        await actor.staffLogout(token);
      }
      clearTokenFromSession();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["staffRecords"] });
    },
  });
}

// ── Mark Attendance ──────────────────────────────────────────
export function useMarkAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      subjectId,
      date,
      attendanceList,
      dept,
      year,
    }: {
      token: SessionToken;
      subjectId: SubjectId;
      date: string;
      attendanceList: AttendanceInput[];
      dept?: string;
      year?: number;
    }): Promise<void> => {
      if (!actor) throw new Error("Not connected to backend");
      if (!dept || year === undefined) {
        throw new Error("Department and year are required");
      }
      const result = await actor.markAttendance(
        token,
        subjectId,
        date,
        attendanceList,
        dept,
        BigInt(year),
      );
      if ("err" in result) {
        throw new Error((result.err as string) || "Failed to mark attendance");
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["staffRecords", variables.token],
      });
      void queryClient.invalidateQueries({ queryKey: ["studentRecords"] });
    },
  });
}
