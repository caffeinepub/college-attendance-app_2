import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceStatus } from "../backend.d";
import type { SessionToken } from "../backend.d";
import {
  useAttendanceByStaff,
  useLogout,
  useMarkAttendance,
  useStudents,
  useSubjects,
} from "../hooks/useQueries";

interface StaffDashboardPageProps {
  token: SessionToken;
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

// ── Mark Attendance Tab ───────────────────────────────────────────────────────

function MarkAttendanceTab({ token }: { token: SessionToken }) {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { mutate: markAttendance, isPending: isSubmitting } =
    useMarkAttendance();

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayDate());
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Initialize all students as absent
  const studentList = students ?? [];
  const getStatus = (regNo: string): AttendanceStatus =>
    attendanceMap[regNo] ?? AttendanceStatus.absent;

  const setStatus = (regNo: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [regNo]: status }));
  };

  const presentCount = studentList.filter(
    (s) => getStatus(s.registrationNumber) === AttendanceStatus.present,
  ).length;

  const handleSubmit = () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const attendanceList = studentList.map((s) => ({
      regNo: s.registrationNumber,
      status: getStatus(s.registrationNumber),
    }));

    markAttendance(
      { token, subjectId: selectedSubject, date: selectedDate, attendanceList },
      {
        onSuccess: () => {
          toast.success("Attendance submitted successfully", {
            description: `${presentCount} present, ${studentList.length - presentCount} absent.`,
          });
          // Reset attendance map for next session
          setAttendanceMap({});
        },
        onError: (err) => {
          toast.error("Failed to submit attendance", {
            description: (err as Error)?.message || "Please try again.",
          });
        },
      },
    );
  };

  const isLoading = subjectsLoading || studentsLoading;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Subject
            </Label>
            {subjectsLoading ? (
              <Skeleton className="h-11 w-full rounded-xl" />
            ) : (
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger
                  data-ocid="staff.subject_select"
                  className="h-11 rounded-xl border-border bg-background focus:ring-primary"
                >
                  <SelectValue placeholder="Select subject…" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects ?? []).map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
        {!isLoading && studentList.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm">
            <span className="text-muted-foreground">
              {studentList.length} students
            </span>
            <div className="flex items-center gap-1.5 text-success-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-medium">{presentCount} present</span>
            </div>
            <div className="flex items-center gap-1.5 text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">
                {studentList.length - presentCount} absent
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Student list */}
      {isLoading ? (
        <div data-ocid="staff.loading_state" className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-9 w-40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : studentList.length === 0 ? (
        <div
          data-ocid="staff.student.empty_state"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No students found.</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[480px]">
          <div className="space-y-2 pr-1">
            {studentList.map((student, index) => {
              const status = getStatus(student.registrationNumber);
              const isPresent = status === AttendanceStatus.present;
              const isAbsent = status === AttendanceStatus.absent;

              return (
                <motion.div
                  key={student.registrationNumber}
                  data-ocid={`staff.student_item.${index + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    isPresent
                      ? "bg-success/8 border-success/30"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Student info */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isPresent
                        ? "bg-success/20 text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {student.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.registrationNumber}
                    </p>
                  </div>

                  {/* Toggle buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-ocid={`staff.present_toggle.${index + 1}`}
                      onClick={() =>
                        setStatus(
                          student.registrationNumber,
                          AttendanceStatus.present,
                        )
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isPresent
                          ? "bg-success text-success-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-success/15 hover:text-success-foreground"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Present</span>
                    </button>
                    <button
                      type="button"
                      data-ocid={`staff.absent_toggle.${index + 1}`}
                      onClick={() =>
                        setStatus(
                          student.registrationNumber,
                          AttendanceStatus.absent,
                        )
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isAbsent
                          ? "bg-destructive text-destructive-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Absent</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Submit button */}
      {!isLoading && studentList.length > 0 && (
        <Button
          data-ocid="staff.submit_button"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedSubject || !selectedDate}
          className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card"
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
      )}
    </div>
  );
}

// ── View Records Tab ──────────────────────────────────────────────────────────

function ViewRecordsTab({ token }: { token: SessionToken }) {
  const { data: records, isLoading, isError } = useAttendanceByStaff(token);
  const { data: subjects } = useSubjects();

  const subjectMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of subjects ?? []) {
      m[s.id] = s.name;
    }
    return m;
  }, [subjects]);

  // Group records by date then subject
  const grouped = useMemo(() => {
    if (!records) return [];
    const byDate: Record<string, typeof records> = {};
    for (const r of records) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    }
    // Sort by date descending
    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, recs]) => {
        const bySubject: Record<string, typeof records> = {};
        for (const r of recs) {
          if (!bySubject[r.subjectId]) bySubject[r.subjectId] = [];
          bySubject[r.subjectId].push(r);
        }
        return { date, subjects: bySubject };
      });
  }, [records]);

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
        <p className="text-muted-foreground text-sm">
          Failed to load records. Please try again.
        </p>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div
        data-ocid="staff.records.empty_state"
        className="flex flex-col items-center gap-4 py-16 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <ClipboardList className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">No records yet</p>
          <p className="text-muted-foreground text-sm">
            Submitted attendance will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ date, subjects: subjectGroups }, dateIdx) => (
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
            <span className="ml-auto text-xs text-muted-foreground">
              {Object.values(subjectGroups).flat().length} records
            </span>
          </div>

          {/* Subjects within date */}
          {Object.entries(subjectGroups).map(([subjectId, recs]) => {
            const subjectName = subjectMap[subjectId] || subjectId;
            const presentCount = recs.filter(
              (r) => r.status === AttendanceStatus.present,
            ).length;
            const absentCount = recs.length - presentCount;

            return (
              <div
                key={subjectId}
                className="px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {subjectName}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge className="bg-success/15 text-success-foreground border border-success/20 text-xs px-2 py-0.5">
                      {presentCount} P
                    </Badge>
                    <Badge className="bg-destructive/15 text-destructive border border-destructive/20 text-xs px-2 py-0.5">
                      {absentCount} A
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {recs.map((rec) => (
                    <div
                      key={`${rec.regNo}-${rec.subjectId}-${rec.date}`}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                        rec.status === AttendanceStatus.present
                          ? "bg-success/10 text-success-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {rec.status === AttendanceStatus.present ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {rec.regNo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function StaffDashboardPage({
  token,
  onLogout,
}: StaffDashboardPageProps) {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    logout(token, {
      onSuccess: () => {
        toast.success("Logged out successfully");
        onLogout();
      },
      onError: () => {
        // Log out client-side even if server call fails
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-semibold text-sm text-foreground">
                Staff Dashboard
              </span>
              <p className="text-muted-foreground text-[10px] leading-tight">
                AttendanceIQ
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-ocid="staff.logout_button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl h-9 text-xs border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
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
                  className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Mark Attendance
                </TabsTrigger>
                <TabsTrigger
                  value="records"
                  data-ocid="staff.records_tab"
                  className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Records
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mark" className="mt-0">
                <MarkAttendanceTab token={token} />
              </TabsContent>

              <TabsContent value="records" className="mt-0">
                <ViewRecordsTab token={token} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-muted-foreground text-xs">
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
