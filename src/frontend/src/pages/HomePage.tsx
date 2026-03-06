import { BookOpen, ChevronRight, GraduationCap, Users } from "lucide-react";
import { motion } from "motion/react";

interface HomePageProps {
  onStaffClick: () => void;
  onStudentClick: () => void;
}

export default function HomePage({
  onStaffClick,
  onStudentClick,
}: HomePageProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #38bdf8 0%, #0ea5e9 40%, #7dd3fc 100%)",
      }}
    >
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-card">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-semibold text-lg text-black tracking-tight">
          AttendanceIQ
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-14 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-black text-xs font-medium tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Academic Attendance Portal
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-black leading-tight mb-3">
            Track Attendance,
            <br />
            <span className="text-primary">Achieve Excellence</span>
          </h1>
          <p className="text-black text-xs tracking-wide lowercase">
            kathir college attendance registration app
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Staff Card */}
          <motion.button
            data-ocid="home.staff_button"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onStaffClick}
            className="group relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-7 text-left shadow-elevated cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Staff Panel
              </h2>
              <p className="text-primary-foreground/75 text-sm leading-relaxed mb-6">
                Mark attendance per subject and date for your department.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                Login as Staff
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Student Card */}
          <motion.button
            data-ocid="home.student_button"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={onStudentClick}
            className="group relative overflow-hidden rounded-2xl bg-white/30 border border-white/50 text-black p-7 text-left shadow-card hover:shadow-card-hover transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* Decorative accent */}
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-accent/10" />
            <div className="absolute right-4 -bottom-10 w-36 h-36 rounded-full bg-primary/5" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center mb-5 group-hover:bg-white/50 transition-colors">
                <BookOpen className="w-6 h-6 text-black" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Student Lookup
              </h2>
              <p className="text-black/70 text-sm leading-relaxed mb-6">
                Check your attendance percentage across all subjects. No login
                required.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-black">
                View Attendance
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
              </div>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center">
        <p className="text-black/70 text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
