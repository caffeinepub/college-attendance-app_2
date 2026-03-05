import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  DEPT_CONFIG,
  getDeptYearLabel,
  getStudentsForDept,
} from "../utils/attendanceData";

interface DepartmentYearPageProps {
  mode: "staff" | "student";
  onConfirm: (deptKey: string, year: number) => void;
  onBack: () => void;
}

const YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

const DEPT_ORDER = ["AIDS", "AIML", "CSE", "ECE", "EEE"];

const DEPT_COLORS: Record<string, string> = {
  AIDS: "from-violet-500/20 to-purple-500/10 border-violet-200",
  AIML: "from-sky-500/20 to-cyan-500/10 border-sky-200",
  CSE: "from-emerald-500/20 to-green-500/10 border-emerald-200",
  ECE: "from-orange-500/20 to-amber-500/10 border-orange-200",
  EEE: "from-rose-500/20 to-red-500/10 border-rose-200",
};

const DEPT_ICON_COLORS: Record<string, string> = {
  AIDS: "text-violet-600 bg-violet-100",
  AIML: "text-sky-600 bg-sky-100",
  CSE: "text-emerald-600 bg-emerald-100",
  ECE: "text-orange-600 bg-orange-100",
  EEE: "text-rose-600 bg-rose-100",
};

export default function DepartmentYearPage({
  mode,
  onConfirm,
  onBack,
}: DepartmentYearPageProps) {
  const [step, setStep] = useState<"dept" | "year">("dept");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const handleDeptSelect = (deptKey: string) => {
    setSelectedDept(deptKey);
    setSelectedYear(null);
    setStep("year");
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleContinue = () => {
    if (selectedDept && selectedYear) {
      onConfirm(selectedDept, selectedYear);
    }
  };

  const handleBackToStep1 = () => {
    setStep("dept");
    setSelectedYear(null);
  };

  const studentCount =
    selectedDept && selectedYear
      ? getStudentsForDept(selectedDept, selectedYear).length
      : null;

  const modeLabel = mode === "staff" ? "Staff Portal" : "Student Lookup";
  const modeIcon =
    mode === "staff" ? (
      <Users className="w-5 h-5 text-primary" />
    ) : (
      <BookOpen className="w-5 h-5 text-primary" />
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="dept-year.back_button"
          onClick={step === "year" ? handleBackToStep1 : onBack}
          className="shrink-0 rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-base">
            {modeLabel}
          </span>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={`w-6 h-1.5 rounded-full transition-colors ${step === "dept" ? "bg-primary" : "bg-primary/80"}`}
          />
          <div
            className={`w-6 h-1.5 rounded-full transition-colors ${step === "year" ? "bg-primary" : "bg-primary/20"}`}
          />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1 — Select Department */}
          {step === "dept" && (
            <motion.div
              key="dept-step"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  {modeIcon}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 1 of 2
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Select Department
                </h1>
                <p className="text-black text-sm mt-1">
                  Choose your department to continue.
                </p>
              </div>

              {/* Department cards */}
              <div
                className="grid grid-cols-1 gap-3"
                data-ocid="dept-year.dept_list"
              >
                {DEPT_ORDER.map((deptKey, idx) => {
                  const dept = DEPT_CONFIG[deptKey];
                  if (!dept) return null;
                  const colorClass =
                    DEPT_COLORS[deptKey] ??
                    "from-gray-500/20 to-gray-500/10 border-gray-200";
                  const iconClass =
                    DEPT_ICON_COLORS[deptKey] ?? "text-gray-600 bg-gray-100";

                  return (
                    <motion.button
                      key={deptKey}
                      data-ocid={`dept-year.dept_button.${idx + 1}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.06 }}
                      whileHover={{
                        scale: 1.01,
                        transition: { duration: 0.15 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeptSelect(deptKey)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 bg-gradient-to-r text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${colorClass} hover:shadow-md`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${iconClass}`}
                      >
                        {dept.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {dept.label}
                        </p>
                        <p className="text-black text-xs mt-0.5">
                          Code: 71XXXX{dept.code}XXX
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Select Year */}
          {step === "year" && selectedDept && (
            <motion.div
              key="year-step"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  {modeIcon}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 2 of 2
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Select Year
                </h1>
                <p className="text-black text-sm mt-1">
                  Department:{" "}
                  <span className="font-semibold text-foreground">
                    {DEPT_CONFIG[selectedDept]?.label}
                  </span>
                </p>
              </div>

              {/* Year cards */}
              <div
                className="grid grid-cols-2 gap-3 mb-6"
                data-ocid="dept-year.year_list"
              >
                {YEARS.map((yr, idx) => {
                  const count = getStudentsForDept(
                    selectedDept,
                    yr.value,
                  ).length;
                  const isSelected = selectedYear === yr.value;
                  const range = DEPT_CONFIG[selectedDept]?.ranges[yr.value];
                  const code = DEPT_CONFIG[selectedDept]?.code ?? "";
                  const yearCode =
                    { 1: "25", 2: "24", 3: "23", 4: "22" }[yr.value] ?? "";
                  const startNo = range
                    ? `7116${yearCode}${code}${range[0]}`
                    : "";
                  const endNo = range
                    ? `7116${yearCode}${code}${range[1]}`
                    : "";

                  return (
                    <motion.button
                      key={yr.value}
                      data-ocid={`dept-year.year_button.${idx + 1}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.06 }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.15 },
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleYearSelect(yr.value)}
                      className={`relative flex flex-col items-start gap-2 px-4 py-4 rounded-xl border-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                      <span
                        className={`font-display text-xl font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {yr.label}
                      </span>
                      <span className="text-black text-xs font-semibold">
                        {count} students
                      </span>
                      {range && (
                        <span className="text-black/60 text-[10px] font-mono leading-tight">
                          {startNo}
                          <br />
                          to {endNo}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Summary + Continue */}
              <AnimatePresence>
                {selectedYear && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {/* Selection summary card */}
                    <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {getDeptYearLabel(selectedDept, selectedYear)}
                        </p>
                        <p className="text-black text-xs mt-0.5">
                          {studentCount} students in this batch
                        </p>
                      </div>
                    </div>

                    <Button
                      data-ocid="dept-year.confirm_button"
                      onClick={handleContinue}
                      className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
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
