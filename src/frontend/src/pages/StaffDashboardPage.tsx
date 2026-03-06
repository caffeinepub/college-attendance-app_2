import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAttendanceByStaff,
  useGetSubjectsForDept,
  useLogout,
  useMarkAttendance,
  useSaveSubjectsForDept,
} from "../hooks/useQueries";
import { AttendanceStatus } from "../types/attendance";
import type { SessionToken } from "../types/attendance";
import { getDeptYearLabel, getStudentsForDept } from "../utils/attendanceData";
import type { SubjectEntry } from "../utils/attendanceData";

interface StaffDashboardPageProps {
  token: SessionToken;
  dept: string;
  year: number;
  onLogout: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type StudentStatus = "present" | "absent" | "onduty";

// ── Mark Attendance Tab ───────────────────────────────────────────────────────

function MarkAttendanceTab({
  token,
  dept,
  year,
  subjects,
}: {
  token: SessionToken;
  dept: string;
  year: number;
  subjects: SubjectEntry[];
}) {
  const { mutate: markAttendance, isPending: isSubmitting } =
    useMarkAttendance();

  const students = useMemo(() => getStudentsForDept(dept, year), [dept, year]);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayDate());
  const [statusMap, setStatusMap] = useState<Record<string, StudentStatus>>({});
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const getStatus = (regNo: string): StudentStatus =>
    statusMap[regNo] ?? "absent";

  const setStatus = (regNo: string, status: StudentStatus) => {
    setStatusMap((prev) => ({ ...prev, [regNo]: status }));
  };

  const setAll = (status: StudentStatus) => {
    const next: Record<string, StudentStatus> = {};
    for (const reg of students) next[reg] = status;
    setStatusMap(next);
  };

  const presentCount = students.filter(
    (r) => getStatus(r) === "present",
  ).length;
  const absentCount = students.filter((r) => getStatus(r) === "absent").length;
  const onDutyCount = students.filter((r) => getStatus(r) === "onduty").length;

  const handleSubmit = () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const attendanceList = students.map((regNo) => {
      const s = getStatus(regNo);
      return {
        regNo,
        status:
          s === "present"
            ? AttendanceStatus.present
            : s === "onduty"
              ? AttendanceStatus.onDuty
              : AttendanceStatus.absent,
      };
    });

    markAttendance(
      {
        token,
        subjectId: selectedSubject,
        date: selectedDate,
        attendanceList,
        dept,
        year,
      },
      {
        onSuccess: () => {
          toast.success("Attendance submitted", {
            description: `${presentCount} present · ${absentCount} absent · ${onDutyCount} on-duty`,
          });
          setStatusMap({});
          setConfirmed(false);
        },
        onError: (err) => {
          toast.error("Failed to submit attendance", {
            description: (err as Error)?.message || "Please try again.",
          });
        },
      },
    );
  };

  if (subjects.length === 0) {
    return (
      <div
        data-ocid="staff.mark.empty_state"
        className="flex flex-col items-center gap-4 py-16 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">No Subjects Added</p>
          <p className="text-black text-sm max-w-xs">
            Go to the <strong>Manage Subjects</strong> tab to add subjects for
            this department before marking attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-black uppercase tracking-wide">
              Subject
            </Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger
                data-ocid="staff.subject_select"
                className="h-11 rounded-xl border-border bg-background focus:ring-primary"
              >
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.id}>
                    {subj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-black uppercase tracking-wide">
              Date
            </Label>
            <input
              data-ocid="staff.date_input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={todayDate()}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border text-sm">
          <span className="text-black font-medium">
            {students.length} students
          </span>
          <span className="flex items-center gap-1.5 text-green-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            {presentCount} Present
          </span>
          <span className="flex items-center gap-1.5 text-red-600 font-semibold">
            <XCircle className="w-4 h-4 text-red-600" />
            {absentCount} Absent
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            {onDutyCount} On-Duty
          </span>

          {/* Bulk actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAll("present")}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-success/10 text-success-foreground hover:bg-success/20 transition-colors font-medium"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => setAll("absent")}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student list + submit button */}
      <ScrollArea className="max-h-[580px]">
        <div className="space-y-1.5 pr-1">
          {students.map((regNo, index) => {
            const status = getStatus(regNo);
            const isPresent = status === "present";
            const isAbsent = status === "absent";
            const isOnDuty = status === "onduty";

            return (
              <motion.div
                key={regNo}
                data-ocid={`staff.student_item.${index + 1}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.008, 0.3) }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  isPresent
                    ? "bg-success/8 border-success/25"
                    : isOnDuty
                      ? "bg-onduty/8 border-onduty/25"
                      : "bg-card border-border"
                }`}
              >
                {/* Index badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isPresent
                      ? "bg-success/20 text-green-600"
                      : isOnDuty
                        ? "bg-onduty/20 text-blue-600"
                        : "bg-muted text-red-600"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Reg number */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold font-mono tracking-tight ${
                      isPresent
                        ? "text-green-600"
                        : isOnDuty
                          ? "text-blue-600"
                          : "text-red-600"
                    }`}
                  >
                    {regNo}
                  </p>
                </div>

                {/* Toggle buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-ocid={`staff.present_toggle.${index + 1}`}
                    onClick={() => setStatus(regNo, "present")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isPresent
                        ? "bg-success text-success-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-success/15 hover:text-success-foreground"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">P</span>
                  </button>
                  <button
                    type="button"
                    data-ocid={`staff.absent_toggle.${index + 1}`}
                    onClick={() => setStatus(regNo, "absent")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isAbsent
                        ? "bg-destructive/20 text-red-600 shadow-xs border border-destructive/40"
                        : "bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-red-600"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">A</span>
                  </button>
                  <button
                    type="button"
                    data-ocid={`staff.onduty_toggle.${index + 1}`}
                    onClick={() => setStatus(regNo, "onduty")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isOnDuty
                        ? "bg-onduty text-blue-600 shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-onduty/15 hover:text-blue-600"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">OD</span>
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Confirmation checkbox + Submit button — shown below last student */}
          <div className="pt-4 pb-2 space-y-3">
            <label
              htmlFor="confirm-submit"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border bg-card cursor-pointer select-none hover:bg-muted/40 transition-colors"
            >
              <input
                id="confirm-submit"
                type="checkbox"
                data-ocid="staff.confirm_checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-sm text-black">
                I have reviewed all attendance entries and confirm they are
                correct.
              </span>
            </label>

            <Button
              data-ocid="staff.submit_button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || !selectedSubject || !selectedDate || !confirmed
              }
              className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Submit Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ── View Records Tab ──────────────────────────────────────────────────────────

function ViewRecordsTab({
  token,
  dept,
  year,
  subjects,
}: {
  token: SessionToken;
  dept: string;
  year: number;
  subjects: SubjectEntry[];
}) {
  const {
    data: records,
    isLoading,
    isError,
  } = useAttendanceByStaff(token, dept, year);

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const grouped = useMemo(() => {
    if (!records) return [];

    const filtered = records.filter((r) => {
      if (filterSubject !== "all" && r.subjectId !== filterSubject)
        return false;
      if (filterDate && r.date !== filterDate) return false;
      return true;
    });

    const byDate: Record<string, typeof records> = {};
    for (const r of filtered) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, recs]) => {
        const bySubject: Record<string, typeof records> = {};
        for (const r of recs) {
          if (!bySubject[r.subjectId]) bySubject[r.subjectId] = [];
          bySubject[r.subjectId].push(r);
        }
        return { date, subjectGroups: bySubject };
      });
  }, [records, filterSubject, filterDate]);

  if (isLoading) {
    return (
      <div data-ocid="staff.records.loading_state" className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="staff.records.error_state"
        className="flex flex-col items-center gap-3 py-16 text-center"
      >
        <AlertCircle className="w-10 h-10 text-destructive/60" />
        <p className="text-black text-sm">
          Failed to load records. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-black uppercase tracking-wide">
              Filter by Subject
            </Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger
                data-ocid="staff.records.subject_select"
                className="h-10 rounded-xl border-border bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-black uppercase tracking-wide">
              Filter by Date
            </Label>
            <input
              data-ocid="staff.records.date_input"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            />
          </div>
        </div>
        {(filterSubject !== "all" || filterDate) && (
          <button
            type="button"
            onClick={() => {
              setFilterSubject("all");
              setFilterDate("");
            }}
            className="mt-3 text-xs text-primary hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <div
          data-ocid="staff.records.empty_state"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">No records found</p>
            <p className="text-black text-sm">
              {filterSubject !== "all" || filterDate
                ? "No records match the current filters."
                : "Submitted attendance will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, subjectGroups }, dateIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIdx * 0.05 }}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
            >
              {/* Date header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold text-sm text-foreground">
                  {formatDate(date)}
                </span>
                <span className="ml-auto text-xs text-black">
                  {Object.values(subjectGroups).flat().length} records
                </span>
              </div>

              {/* Subjects within date */}
              {Object.entries(subjectGroups).map(([subjectId, recs]) => {
                const subjectName = subjectMap[subjectId] ?? subjectId;

                const presentCount = recs.filter(
                  (r) => r.status === AttendanceStatus.present,
                ).length;
                const onDutyCount = recs.filter(
                  (r) => r.status === AttendanceStatus.onDuty,
                ).length;
                const absentCount = recs.filter(
                  (r) => r.status === AttendanceStatus.absent,
                ).length;

                return (
                  <div
                    key={subjectId}
                    className="px-4 py-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {subjectName}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Badge className="bg-success/15 text-green-600 border border-success/20 text-xs px-2 py-0.5">
                          {presentCount} P
                        </Badge>
                        <Badge className="bg-destructive/15 text-red-600 border border-destructive/20 text-xs px-2 py-0.5">
                          {absentCount} A
                        </Badge>
                        {onDutyCount > 0 && (
                          <Badge className="bg-onduty/15 text-blue-600 border border-onduty/20 text-xs px-2 py-0.5">
                            {onDutyCount} OD
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {recs.map((rec) => {
                        const isOD = rec.status === AttendanceStatus.onDuty;
                        const isPresent =
                          rec.status === AttendanceStatus.present;
                        return (
                          <div
                            key={`${rec.regNo}-${rec.subjectId}-${rec.date}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-medium ${
                              isOD
                                ? "bg-onduty/10 text-blue-600"
                                : isPresent
                                  ? "bg-success/10 text-green-600"
                                  : "bg-destructive/10 text-red-600"
                            }`}
                          >
                            {isOD ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : isPresent ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {rec.regNo}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Manage Subjects Tab ───────────────────────────────────────────────────────

function ManageSubjectsTab({
  token,
  dept,
  subjects,
}: {
  token: SessionToken;
  dept: string;
  subjects: SubjectEntry[];
}) {
  const [newSubjectName, setNewSubjectName] = useState("");
  const { mutate: saveSubjects, isPending: isSaving } =
    useSaveSubjectsForDept();

  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    const id = `SUBJ_${Date.now()}`;
    const updated = [...subjects, { id, name }];
    saveSubjects(
      { token, deptKey: dept, subjects: updated },
      {
        onSuccess: () => {
          setNewSubjectName("");
          toast.success(`Subject "${name}" added`);
        },
        onError: (err) => {
          toast.error("Failed to add subject", {
            description: (err as Error)?.message,
          });
        },
      },
    );
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    saveSubjects(
      { token, deptKey: dept, subjects: updated },
      {
        onSuccess: () => {
          toast.success("Subject removed");
        },
        onError: (err) => {
          toast.error("Failed to remove subject", {
            description: (err as Error)?.message,
          });
        },
      },
    );
  };

  const handleClearAll = () => {
    saveSubjects(
      { token, deptKey: dept, subjects: [] },
      {
        onSuccess: () => {
          toast.success("All subjects cleared");
        },
        onError: (err) => {
          toast.error("Failed to clear subjects", {
            description: (err as Error)?.message,
          });
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Add subject */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Add Subject
        </h3>
        <div className="flex gap-2">
          <Input
            data-ocid="staff.subjects.name_input"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubject();
              }
            }}
            placeholder="e.g. Maths, Physics, Java…"
            className="h-10 rounded-xl border-border bg-background focus-visible:ring-primary flex-1"
          />
          <Button
            data-ocid="staff.subjects.add_button"
            onClick={handleAddSubject}
            disabled={!newSubjectName.trim() || isSaving}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-1.5" />
            )}
            Add
          </Button>
        </div>
      </div>

      {/* Subject list */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-foreground">
            Current Subjects ({subjects.length})
          </h3>
          {subjects.length > 0 && (
            <button
              type="button"
              data-ocid="staff.subjects.clear_button"
              onClick={handleClearAll}
              className="text-xs text-destructive hover:underline font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {subjects.length === 0 ? (
          <div
            data-ocid="staff.subjects.empty_state"
            className="flex flex-col items-center gap-3 py-12 text-center bg-card border border-dashed border-border rounded-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-1">
                No subjects added yet
              </p>
              <p className="text-black text-xs max-w-xs">
                Use the form above to add subjects for this department.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map((subj, idx) => (
              <motion.div
                key={subj.id}
                data-ocid={`staff.subjects.item.${idx + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {idx + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {subj.name}
                </span>
                <span className="text-[10px] text-black/40 font-mono hidden sm:block">
                  {subj.id}
                </span>
                <button
                  type="button"
                  data-ocid={`staff.subjects.delete_button.${idx + 1}`}
                  onClick={() => handleDeleteSubject(subj.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label={`Remove ${subj.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function StaffDashboardPage({
  token,
  dept,
  year,
  onLogout,
}: StaffDashboardPageProps) {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const { data: subjects = [] } = useGetSubjectsForDept(dept);

  const deptYearLabel = getDeptYearLabel(dept, year);

  const handleLogout = () => {
    logout(token, {
      onSuccess: () => {
        toast.success("Logged out successfully");
        onLogout();
      },
      onError: () => {
        toast.info("Logged out");
        onLogout();
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="font-display font-semibold text-sm text-foreground block truncate">
                Staff Dashboard
              </span>
              <p className="text-black text-[10px] leading-tight truncate">
                {deptYearLabel}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-ocid="staff.logout_button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl h-9 text-xs border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
            )}
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Tabs defaultValue="mark">
              <TabsList className="w-full h-11 rounded-xl bg-muted p-1 mb-6">
                <TabsTrigger
                  value="mark"
                  data-ocid="staff.mark_tab"
                  className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs"
                >
                  <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                  Mark
                </TabsTrigger>
                <TabsTrigger
                  value="records"
                  data-ocid="staff.records_tab"
                  className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Records
                </TabsTrigger>
                <TabsTrigger
                  value="subjects"
                  data-ocid="staff.subjects_tab"
                  className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Subjects
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mark" className="mt-0">
                <MarkAttendanceTab
                  token={token}
                  dept={dept}
                  year={year}
                  subjects={subjects}
                />
              </TabsContent>

              <TabsContent value="records" className="mt-0">
                <ViewRecordsTab
                  token={token}
                  dept={dept}
                  year={year}
                  subjects={subjects}
                />
              </TabsContent>

              <TabsContent value="subjects" className="mt-0">
                <ManageSubjectsTab
                  token={token}
                  dept={dept}
                  subjects={subjects}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-black text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
