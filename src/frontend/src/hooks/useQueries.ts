import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceInput,
  AttendanceRecord,
  RegistrationNumber,
  SessionToken,
  SubjectId,
} from "../types/attendance";
import type { AttendanceStatus } from "../types/attendance";

// ── Local storage keys ────────────────────────────────────────
const RECORDS_KEY = "attendance_records_v1";
const SESSION_KEY = "staff_session_v1";
const ACCOUNTS_KEY = "staff_accounts_v1";

// Seed default account: username "staff", password "2026"
const DEFAULT_ACCOUNTS: Record<string, string> = { staff: "2026" };

function loadAccounts(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return { ...DEFAULT_ACCOUNTS };
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return { ...DEFAULT_ACCOUNTS };
  }
}

function saveAccounts(accounts: Record<string, string>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttendanceRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: AttendanceRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function getSession(): { token: string; username: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; username: string };
  } catch {
    return null;
  }
}

function createSession(username: string): string {
  const token = `${username}_${Date.now()}`;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, username }));
  return token;
}

function destroySession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

function validateSession(token: string): string | null {
  const session = getSession();
  if (!session || session.token !== token) return null;
  return session.username;
}

// ── Staff Attendance Records ─────────────────────────────────
export function useAttendanceByStaff(token: SessionToken | null) {
  return useQuery({
    queryKey: ["staffRecords", token],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!token) return [];
      const username = validateSession(token);
      if (!username) throw new Error("Invalid session");
      return loadRecords().filter((r) => r.staffUsername === username);
    },
    enabled: !!token,
  });
}

// ── Student Attendance Records (raw, for frontend calculations) ──
export function useStudentAttendanceRecords(regNo: RegistrationNumber | null) {
  return useQuery({
    queryKey: ["studentRecords", regNo],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!regNo) return [];
      return loadRecords().filter((r) => r.regNo === regNo);
    },
    enabled: !!regNo,
    retry: false,
  });
}

// ── Login ────────────────────────────────────────────────────
export function useLogin() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<SessionToken> => {
      const accounts = loadAccounts();
      if (!accounts[username] || accounts[username] !== password) {
        throw new Error("Invalid username or password");
      }
      return createSession(username);
    },
  });
}

// ── Create Staff Account ─────────────────────────────────────
export function useCreateStaffAccount() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<void> => {
      const accounts = loadAccounts();
      if (accounts[username]) {
        throw new Error(
          `Username "${username}" is already taken. Choose a different one.`,
        );
      }
      accounts[username] = password;
      saveAccounts(accounts);
    },
  });
}

// ── Logout ───────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_token: SessionToken): Promise<void> => {
      destroySession();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["staffRecords"] });
    },
  });
}

// ── Mark Attendance ──────────────────────────────────────────
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      subjectId,
      date,
      attendanceList,
    }: {
      token: SessionToken;
      subjectId: SubjectId;
      date: string;
      attendanceList: AttendanceInput[];
    }): Promise<void> => {
      const username = validateSession(token);
      if (!username) throw new Error("Invalid session");

      const existing = loadRecords();
      // Remove prior records for same subject+date (allow re-submission)
      const filtered = existing.filter(
        (r) => !(r.subjectId === subjectId && r.date === date),
      );
      const newRecords: AttendanceRecord[] = attendanceList.map((entry) => ({
        regNo: entry.regNo,
        subjectId,
        date,
        status: entry.status as AttendanceStatus,
        staffUsername: username,
      }));
      saveRecords([...filtered, ...newRecords]);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["staffRecords", variables.token],
      });
      queryClient.invalidateQueries({ queryKey: ["studentRecords"] });
    },
  });
}
