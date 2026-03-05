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
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useStudentAttendanceSummary } from "../hooks/useQueries";

interface StudentLookupPageProps {
  onBack: () => void;
}

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

function AttendanceBadge({ percentage }: { percentage: number }) {
  if (percentage >= 75) {
    return (
      <Badge className="bg-success/15 text-success-foreground border border-success/30 font-medium">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {percentage.toFixed(1)}%
      </Badge>
    );
  }
  if (percentage >= 60) {
    return (
      <Badge className="bg-warning/15 text-warning-foreground border border-warning/30 font-medium">
        <AlertCircle className="w-3 h-3 mr-1" />
        {percentage.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/15 text-destructive border border-destructive/30 font-medium">
      <XCircle className="w-3 h-3 mr-1" />
      {percentage.toFixed(1)}%
    </Badge>
  );
}

export default function StudentLookupPage({ onBack }: StudentLookupPageProps) {
  const [regInput, setRegInput] = useState("");
  const [submittedReg, setSubmittedReg] = useState<string | null>(null);

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useStudentAttendanceSummary(submittedReg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = regInput.trim().toUpperCase();
    if (!trimmed) return;
    setSubmittedReg(trimmed);
  };

  const handleSearchAgain = () => {
    setSubmittedReg(null);
    setRegInput("");
  };

  const hasNoStudent =
    !isLoading && submittedReg && (isError || (summary && !summary.name));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-base">
            Student Attendance Lookup
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Search form — show when no submitted reg or when we have results and want to search again */}
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
                  Find Your Attendance
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your registration number to view attendance records
                  across all subjects.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-input" className="text-sm font-medium">
                    Registration Number
                  </Label>
                  <Input
                    id="reg-input"
                    data-ocid="student.reg_input"
                    value={regInput}
                    onChange={(e) => setRegInput(e.target.value)}
                    placeholder="e.g. CS2021001"
                    autoFocus
                    autoComplete="off"
                    className="h-12 text-base rounded-xl border-border bg-card shadow-xs focus-visible:ring-primary"
                  />
                  <p className="text-muted-foreground text-xs">
                    Registration number is case-insensitive.
                  </p>
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
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-12 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Error / not found */}
          {hasNoStudent && (
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
                  Student Not Found
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  No student found with registration number{" "}
                  <strong className="text-foreground">{submittedReg}</strong>.
                  Please check the number and try again.
                </p>
                {isError && (
                  <p className="text-destructive text-xs mt-1 opacity-70">
                    {(error as Error)?.message || "An error occurred."}
                  </p>
                )}
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

          {/* Results */}
          {submittedReg && !isLoading && summary && summary.name && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              data-ocid="student.result_panel"
              className="space-y-5"
            >
              {/* Student hero card */}
              <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-elevated">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <AttendanceGauge percentage={summary.overallPercentage} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest mb-1">
                      {summary.regNo}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">
                      {summary.name}
                    </h2>
                    <p className="text-primary-foreground/75 text-sm">
                      Overall attendance across{" "}
                      {summary.subjectSummaries.length} subject
                      {summary.subjectSummaries.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-primary-foreground">
                      {summary.overallPercentage >= 75 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attendance
                          Eligible
                        </>
                      ) : summary.overallPercentage >= 60 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Borderline —
                          Needs Improvement
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Below Required
                          Threshold
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject cards */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-foreground px-1">
                  Subject-wise Breakdown
                </h3>
                {summary.subjectSummaries.length === 0 ? (
                  <div
                    data-ocid="student.empty_state"
                    className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground"
                  >
                    No subject records found.
                  </div>
                ) : (
                  summary.subjectSummaries.map((subj, i) => {
                    const pct = subj.percentage;
                    const barColor =
                      pct >= 75
                        ? "bg-success"
                        : pct >= 60
                          ? "bg-warning"
                          : "bg-destructive";

                    return (
                      <motion.div
                        key={subj.subjectName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-card rounded-xl border border-border p-4 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="font-medium text-foreground text-sm leading-snug">
                            {subj.subjectName}
                          </h4>
                          <AttendanceBadge percentage={pct} />
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, pct)}%` }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.06 + 0.2,
                              ease: "easeOut",
                            }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-success/10 rounded-lg py-2 px-1">
                            <div className="font-display text-lg font-bold text-success-foreground">
                              {subj.presentCount.toString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              Present
                            </div>
                          </div>
                          <div className="bg-destructive/10 rounded-lg py-2 px-1">
                            <div className="font-display text-lg font-bold text-destructive">
                              {subj.absentCount.toString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              Absent
                            </div>
                          </div>
                          <div className="bg-muted rounded-lg py-2 px-1">
                            <div className="font-display text-lg font-bold text-foreground">
                              {subj.totalClasses.toString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              Total
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Search again button */}
              <Button
                variant="outline"
                data-ocid="student.search_again_button"
                onClick={handleSearchAgain}
                className="w-full h-11 rounded-xl border-border mt-2"
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
