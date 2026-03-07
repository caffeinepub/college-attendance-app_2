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

// ── Canister error sanitizer ──────────────────────────────────────────────────
function sanitizeCanisterError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes("IC0508") ||
    raw.includes("is stopped") ||
    (raw.includes("Canister") && raw.includes("stopped"))
  ) {
    return new Error(
      "The server is starting up. Please wait a few seconds and try again.",
    );
  }
  if (raw.includes("IC0537") || raw.includes("no wasm module")) {
    return new Error(
      "The server is starting up. Please wait a few seconds and try again.",
    );
  }
  if (raw.includes("IC0503") || raw.includes("out of cycles")) {
    return new Error(
      "Server is temporarily unavailable. Please try again in a moment.",
    );
  }
  if (raw.includes("IC0504") || raw.includes("Reject code: 4")) {
    return new Error("Request was rejected by the server. Please try again.");
  }
  if (
    raw.includes("Not connected") ||
    raw.includes("not connected") ||
    raw.includes("NetworkError") ||
    raw.includes("Failed to fetch")
  ) {
    return new Error(
      "Still connecting to server. Please wait a moment and try again.",
    );
  }
  // Return original error if no known pattern
  return err instanceof Error ? err : new Error(raw);
}

function isTransientCanisterError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("starting up") ||
    msg.includes("Still connecting") ||
    msg.toLowerCase().includes("stopped") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("IC0508") ||
    msg.includes("IC0537") ||
    msg.includes("no wasm module") ||
    msg.includes("IC0503") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("fetch")
  );
}

function shouldRetryOnCanisterError(
  failureCount: number,
  error: unknown,
): boolean {
  // Retry transient errors up to 30 times — silently, no error shown to user
  return isTransientCanisterError(error) && failureCount < 30;
}

function retryDelayForCanister(failureCount: number): number {
  // Fast retries: 500ms, 800ms, 1s, 1.5s … capped at 5s
  return Math.min(500 + failureCount * 300, 5000);
}

// Returns true if the error should be hidden from the user (transient/server startup)
export function isHiddenCanisterError(err: unknown): boolean {
  return isTransientCanisterError(err);
}

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
      if (!actor)
        throw new Error("Not connected to backend. Please wait and try again.");
      try {
        const result = await actor.saveSubjectsForDept(
          token,
          deptKey,
          subjects,
        );
        if ("err" in result) {
          throw new Error(result.err as string);
        }
      } catch (err) {
        throw sanitizeCanisterError(err);
      }
    },
    retry: shouldRetryOnCanisterError,
    retryDelay: retryDelayForCanister,
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
      if (!actor)
        throw new Error("Not connected to backend. Please wait and try again.");
      try {
        const result = await actor.staffLogin(username, password);
        if ("err" in result) {
          throw new Error(
            (result.err as string) || "Invalid username or password",
          );
        }
        const token = result.ok;
        saveTokenToSession(token);
        return token;
      } catch (err) {
        throw sanitizeCanisterError(err);
      }
    },
    retry: shouldRetryOnCanisterError,
    retryDelay: retryDelayForCanister,
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
      if (!actor)
        throw new Error("Not connected to backend. Please wait and try again.");
      try {
        const result = await actor.staffCreateAccount(username, password);
        if ("err" in result) {
          throw new Error((result.err as string) || "Failed to create account");
        }
      } catch (err) {
        throw sanitizeCanisterError(err);
      }
    },
    retry: shouldRetryOnCanisterError,
    retryDelay: retryDelayForCanister,
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
      if (!actor)
        throw new Error("Not connected to backend. Please wait and try again.");
      if (!dept || year === undefined) {
        throw new Error("Department and year are required");
      }
      try {
        const result = await actor.markAttendance(
          token,
          subjectId,
          date,
          attendanceList,
          dept,
          BigInt(year),
        );
        if ("err" in result) {
          throw new Error(
            (result.err as string) || "Failed to mark attendance",
          );
        }
      } catch (err) {
        throw sanitizeCanisterError(err);
      }
    },
    retry: shouldRetryOnCanisterError,
    retryDelay: retryDelayForCanister,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["staffRecords", variables.token],
      });
      void queryClient.invalidateQueries({ queryKey: ["studentRecords"] });
    },
  });
}
