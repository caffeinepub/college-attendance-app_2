import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceInput,
  RegistrationNumber,
  SessionToken,
  SubjectId,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Subjects ────────────────────────────────────────────────
export function useSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Students ────────────────────────────────────────────────
export function useStudents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Student Attendance Summary ───────────────────────────────
export function useStudentAttendanceSummary(regNo: RegistrationNumber | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentSummary", regNo],
    queryFn: async () => {
      if (!actor || !regNo) throw new Error("Missing actor or regNo");
      return actor.getStudentAttendanceSummary(regNo);
    },
    enabled: !!actor && !isFetching && !!regNo,
    retry: false,
  });
}

// ── Staff Attendance Records ─────────────────────────────────
export function useAttendanceByStaff(token: SessionToken | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["staffRecords", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      return actor.getAttendanceByStaff(token);
    },
    enabled: !!actor && !isFetching && !!token,
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
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.login(username, password);
    },
  });
}

// ── Logout ───────────────────────────────────────────────────
export function useLogout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: SessionToken) => {
      if (!actor) throw new Error("No actor available");
      return actor.logout(token);
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
    }: {
      token: SessionToken;
      subjectId: SubjectId;
      date: string;
      attendanceList: AttendanceInput[];
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.markAttendance(token, subjectId, date, attendanceList);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["staffRecords", variables.token],
      });
    },
  });
}

// ── Init Seed Data ───────────────────────────────────────────
export function useInitSeedData() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor available");
      return actor.initiateSeedData();
    },
  });
}
