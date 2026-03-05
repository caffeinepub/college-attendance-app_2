import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useStudentAttendanceRecords } from "../hooks/useQueries";
import { AttendanceStatus } from "../types/attendance";
import {
  DEPT_CONFIG,
  YEAR_CODE,
  getDeptYearLabel,
  getSubjectsForDept,
  isValidRegNoForDept,
} from "../utils/attendanceData";

interface StudentLookupPageProps {
  dept: string;
  year: number;
  onBack: () => void;
}

// ── Gauge component ───────────────────────────────────────────

function AttendanceGauge({ percentage }: { percentage: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  const color =
    clampedPct >= 75
      ? "oklch(var(--success))"
      : clampedPct >= 60
        ? "oklch(var(--warning))"
        : "oklch(var(--destructive))";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg
        className="w-full h-full attendance-gauge"
        viewBox="0 0 110 110"
        role="img"
        aria-label={`Attendance: ${clampedPct.toFixed(0)}%`}
      >
        <circle className="track" cx="55" cy="55" r={radius} />
        <circle
          className="fill"
          cx="55"
          cy="55"
          r={radius}
          stroke={color}
          style={{
            strokeDashoffset: dashOffset,
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-foreground">
          {clampedPct.toFixed(0)}%
        </span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          Overall
        </span>
      </div>
    </div>
  );
}

// ── Per-subject stats type ────────────────────────────────────

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  presentCount: number;
  absentCount: number;
  onDutyCount: number;
  totalClasses: number;
  percentage: number;
}

// ── Main page ─────────────────────────────────────────────────

export default function StudentLookupPage({
  dept,
  year,
  onBack,
}: StudentLookupPageProps) {
  const [regInput, setRegInput] = useState("");
  const [submittedReg, setSubmittedReg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const subjects = useMemo(() => getSubjectsForDept(dept), [dept]);

  const {
    data: rawRecords,
    isLoading,
    isError,
  } = useStudentAttendanceRecords(submittedReg, dept, year);

  // ── Build range description for error messages ─────────────
  const rangeDescription = useMemo(() => {
    const deptCfg = DEPT_CONFIG[dept];
    if (!deptCfg) return "";
    const range = deptCfg.ranges[year];
    const yearCode = YEAR_CODE[year];
    if (!range || !yearCode) return "";
    return `7116${yearCode}${deptCfg.code}${range[0]} – 7116${yearCode}${deptCfg.code}${range[1]}`;
  }, [dept, year]);

  const deptYearLabel = getDeptYearLabel(dept, year);

  // ── Calculate per-subject stats from backend records ─────
  const { subjectStats, overallPercentage } = useMemo(() => {
    if (!submittedReg || !rawRecords) {
      return { subjectStats: [], overallPercentage: 0 };
    }

    const stats: SubjectStats[] = subjects.map((subj) => {
      const subjRecords = rawRecords.filter((r) => r.subjectId === subj.id);

      const presentCount = subjRecords.filter(
        (r) => r.status === AttendanceStatus.present,
      ).length;
      const absentCount = subjRecords.filter(
        (r) => r.status === AttendanceStatus.absent,
      ).length;
      const onDutyCount = subjRecords.filter(
        (r) => r.status === AttendanceStatus.onDuty,
      ).length;
      const totalClasses = presentCount + absentCount + onDutyCount;

      // Percentage = present / (present + absent), on-duty excluded
      const denominator = presentCount + absentCount;
      const percentage =
        denominator === 0 ? 0 : (presentCount / denominator) * 100;

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        presentCount,
        absentCount,
        onDutyCount,
        totalClasses,
        percentage,
      };
    });

    // Only include subjects with at least one class recorded
    const withData = stats.filter((s) => s.totalClasses > 0);

    const totalPresent = withData.reduce((sum, s) => sum + s.presentCount, 0);
    const totalAbsent = withData.reduce((sum, s) => sum + s.absentCount, 0);
    const overallDenominator = totalPresent + totalAbsent;
    const overall =
      overallDenominator === 0 ? 0 : (totalPresent / overallDenominator) * 100;

    return { subjectStats: withData, overallPercentage: overall };
  }, [submittedReg, rawRecords, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = regInput.trim().toUpperCase();
    if (!trimmed) return;

    if (!isValidRegNoForDept(trimmed, dept, year)) {
      setValidationError(
        `"${trimmed}" is not a valid registration number for ${deptYearLabel}. Valid range: ${rangeDescription}.`,
      );
      return;
    }

    setValidationError(null);
    setSubmittedReg(trimmed);
  };

  const handleSearchAgain = () => {
    setSubmittedReg(null);
    setRegInput("");
    setValidationError(null);
  };

  const hasNoRecords =
    !isLoading && submittedReg && !isError && subjectStats.length === 0;
  const showResults =
    !isLoading && submittedReg && !isError && subjectStats.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="student.back_button"
          onClick={onBack}
          className="shrink-0 rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="w-5 h-5 text-primary shrink-0" />
          <span className="font-display font-semibold text-base truncate">
            Student Lookup
          </span>
        </div>
        <div className="ml-auto shrink-0">
          <span className="text-xs text-black bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 font-medium">
            {deptYearLabel}
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Search form */}
          {!submittedReg && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="page-enter"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Check Attendance
                </h1>
                <p className="text-black text-sm">
                  Enter your registration number to view your attendance records
                  {subjects.length > 0
                    ? ` across ${subjects.length} subject${subjects.length !== 1 ? "s" : ""}.`
                    : "."}
                </p>
                <p className="text-black/70 text-xs mt-1 font-medium">
                  {deptYearLabel} · {rangeDescription}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="reg-input"
                    className="text-sm font-medium text-black"
                  >
                    Registration Number
                  </Label>
                  <Input
                    id="reg-input"
                    data-ocid="student.reg_input"
                    value={regInput}
                    onChange={(e) => {
                      setRegInput(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder={`e.g. ${rangeDescription.split(" – ")[0] ?? "711625AM101"}`}
                    autoFocus
                    autoComplete="off"
                    className={`h-12 text-base rounded-xl border-border bg-card shadow-xs focus-visible:ring-primary font-mono tracking-wide ${
                      validationError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                  {validationError ? (
                    <p
                      data-ocid="student.reg_error"
                      className="text-destructive text-xs font-medium"
                    >
                      {validationError}
                    </p>
                  ) : (
                    <p className="text-black text-xs">
                      Valid range: {rangeDescription}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  data-ocid="student.submit_button"
                  disabled={!regInput.trim()}
                  className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Attendance
                </Button>
              </form>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {submittedReg && isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="student.loading_state"
              className="space-y-5"
            >
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <div className="space-y-2 text-center">
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                </div>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-12 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Error state */}
          {submittedReg && isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              data-ocid="student.error_state"
              className="flex flex-col items-center justify-center gap-5 py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  Error Loading Records
                </h2>
                <p className="text-black text-sm max-w-xs">
                  Could not fetch records for{" "}
                  <strong className="text-foreground font-mono">
                    {submittedReg}
                  </strong>
                  . Please try again.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSearchAgain}
                className="rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* No records found */}
          {hasNoRecords && (
            <motion.div
              key="no-records"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              data-ocid="student.empty_state"
              className="flex flex-col items-center justify-center gap-5 py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  No Records Yet
                </h2>
                <p className="text-black text-sm max-w-xs">
                  No attendance has been recorded for{" "}
                  <strong className="text-foreground font-mono">
                    {submittedReg}
                  </strong>{" "}
                  in <strong>{deptYearLabel}</strong> yet.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSearchAgain}
                className="rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Search Again
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              data-ocid="student.result_panel"
              className="space-y-5"
            >
              {/* Hero card */}
              <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-elevated">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <AttendanceGauge percentage={overallPercentage} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-primary-foreground/70 text-xs font-mono font-medium uppercase tracking-widest mb-1">
                      {submittedReg}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-primary-foreground mb-1">
                      Attendance Summary
                    </h2>
                    <p className="text-primary-foreground/75 text-sm mb-1">
                      {deptYearLabel}
                    </p>
                    <p className="text-primary-foreground/60 text-xs mb-3">
                      {subjectStats.length} subject
                      {subjectStats.length !== 1 ? "s" : ""} with records
                    </p>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        overallPercentage >= 75
                          ? "bg-white/20 text-primary-foreground"
                          : overallPercentage >= 60
                            ? "bg-warning/30 text-primary-foreground"
                            : "bg-destructive/30 text-primary-foreground"
                      }`}
                    >
                      {overallPercentage >= 75 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                        </>
                      ) : overallPercentage >= 60 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Borderline
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Below Threshold
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-1 flex-wrap text-xs text-black">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-success/70 inline-block" />
                  Present (P)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/70 inline-block" />
                  Absent (A)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-onduty/70 inline-block" />
                  On-Duty (OD) — not counted in %
                </span>
              </div>

              {/* Subject-wise table */}
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground px-1 mb-3">
                  Subject-wise Breakdown
                </h3>

                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
                  {/* Table header */}
                  <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-muted/40 border-b border-border text-[11px] font-semibold text-black uppercase tracking-wide">
                    <div className="col-span-2">Subject</div>
                    <div className="text-center">P</div>
                    <div className="text-center">A</div>
                    <div className="text-center">OD</div>
                    <div className="text-center">%</div>
                  </div>

                  {/* Rows */}
                  {subjectStats.map((subj, i) => {
                    const pct = subj.percentage;
                    const barColor =
                      pct >= 75
                        ? "bg-success"
                        : pct >= 60
                          ? "bg-warning"
                          : "bg-destructive";

                    return (
                      <motion.div
                        key={subj.subjectId}
                        data-ocid={`student.subject_row.${i + 1}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-border last:border-b-0"
                      >
                        <div className="grid grid-cols-6 gap-2 px-4 py-3 items-center">
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-black leading-snug font-body">
                              {subj.subjectName}
                            </p>
                            <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(100, pct)}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                  delay: i * 0.06 + 0.2,
                                  ease: "easeOut",
                                }}
                                className={`h-full rounded-full ${barColor}`}
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-semibold text-green-600">
                              {subj.presentCount}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-semibold text-red-600">
                              {subj.absentCount}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {subj.onDutyCount}
                            </span>
                          </div>
                          <div className="text-center">
                            {pct >= 75 ? (
                              <Badge className="bg-success/15 text-black border border-success/20 text-xs px-1.5 py-0.5">
                                {pct.toFixed(0)}%
                              </Badge>
                            ) : pct >= 60 ? (
                              <Badge className="bg-warning/15 text-black border border-warning/20 text-xs px-1.5 py-0.5">
                                {pct.toFixed(0)}%
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/15 text-black border border-destructive/20 text-xs px-1.5 py-0.5">
                                {pct.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Overall total row */}
                  <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-muted/30 border-t-2 border-border items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-black">Overall</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-green-600">
                        {subjectStats.reduce((s, r) => s + r.presentCount, 0)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-red-600">
                        {subjectStats.reduce((s, r) => s + r.absentCount, 0)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-blue-600">
                        {subjectStats.reduce((s, r) => s + r.onDutyCount, 0)}
                      </span>
                    </div>
                    <div className="text-center">
                      {overallPercentage >= 75 ? (
                        <Badge className="bg-success/20 text-black border border-success/30 font-bold text-xs px-1.5 py-0.5">
                          {overallPercentage.toFixed(0)}%
                        </Badge>
                      ) : overallPercentage >= 60 ? (
                        <Badge className="bg-warning/20 text-black border border-warning/30 font-bold text-xs px-1.5 py-0.5">
                          {overallPercentage.toFixed(0)}%
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-black border border-destructive/30 font-bold text-xs px-1.5 py-0.5">
                          {overallPercentage.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility note */}
              <div
                className={`rounded-xl p-4 text-sm flex items-start gap-3 border ${
                  overallPercentage >= 75
                    ? "bg-success/10 border-success/20 text-success-foreground"
                    : overallPercentage >= 60
                      ? "bg-warning/10 border-warning/20 text-warning-foreground"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {overallPercentage >= 75 ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                ) : overallPercentage >= 60 ? (
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {overallPercentage >= 75
                      ? "Attendance Eligible"
                      : overallPercentage >= 60
                        ? "Borderline — Improvement Needed"
                        : "Below Required Threshold (75%)"}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {overallPercentage >= 75
                      ? "Your attendance meets the 75% requirement."
                      : overallPercentage >= 60
                        ? "You are close to the minimum requirement. Attend more classes."
                        : "Your attendance is below 75%. You may not be eligible for exams."}
                  </p>
                </div>
              </div>

              {/* On-duty note */}
              <div className="rounded-xl p-3 bg-onduty/8 border border-onduty/20 flex items-center gap-2.5 text-xs text-onduty-foreground">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  On-Duty days are shown separately and are{" "}
                  <strong>not counted</strong> in your attendance percentage.
                </span>
              </div>

              {/* Search again */}
              <Button
                variant="outline"
                data-ocid="student.search_again_button"
                onClick={handleSearchAgain}
                className="w-full h-11 rounded-xl border-border"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Search Another Student
              </Button>
            </motion.div>
          )}
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
