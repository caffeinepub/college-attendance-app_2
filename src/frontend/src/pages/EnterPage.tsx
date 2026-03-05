import { GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface EnterPageProps {
  onEnter: () => void;
}

export default function EnterPage({ onEnter }: EnterPageProps) {
  const [ripples, setRipples] = useState<number[]>([]);

  // Auto-add ripple pulses
  useEffect(() => {
    const id = setInterval(() => {
      setRipples((prev) => [...prev.slice(-4), Date.now()]);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sky-gradient min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* ── Decorative floating orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large orb top-left */}
        <div
          className="float-slow absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        {/* Medium orb bottom-right */}
        <div
          className="float-medium absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
        {/* Small orb top-right */}
        <div
          className="float-fast absolute top-12 right-16 w-32 h-32 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.9 0.06 218) 0%, transparent 70%)",
          }}
        />
        {/* Tiny orb bottom-left */}
        <div
          className="float-medium absolute bottom-24 left-12 w-20 h-20 rounded-full opacity-25"
          style={{
            animationDelay: "2s",
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-white text-center px-6">
        {/* Ripple logo */}
        <div className="relative mb-10">
          {/* Ripple rings */}
          {ripples.map((key) => (
            <motion.div
              key={key}
              className="absolute inset-0 rounded-full border-2 border-white/40"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          ))}

          {/* Outer glow ring */}
          <motion.div
            className="pulse-ring absolute -inset-4 rounded-full bg-white/10"
            style={{ zIndex: 0 }}
          />

          {/* Icon circle */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-2xl"
          >
            <GraduationCap className="w-12 h-12 text-white" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="font-display text-5xl sm:text-6xl font-bold mb-3 shimmer-text"
        >
          AttendanceIQ
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="text-white/80 text-lg sm:text-xl font-medium mb-2 tracking-wide"
        >
          College Attendance Portal
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-white/55 text-sm mb-12 tracking-widest uppercase"
        >
          Batch 711625AM · 2025–26
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="flex items-center gap-10 mb-12"
        >
          {[
            { label: "Students", value: "63" },
            { label: "Subjects", value: "6" },
            { label: "Secure", value: "100%" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.85 + i * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="font-display text-3xl font-bold text-white">
                {stat.value}
              </span>
              <span className="text-white/60 text-xs uppercase tracking-wider mt-0.5">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Enter button */}
        <motion.button
          data-ocid="enter.primary_button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 1.0,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          whileHover={{ scale: 1.06, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          className="group relative px-12 py-4 rounded-full bg-white text-sky-600 font-bold text-lg shadow-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 overflow-hidden"
        >
          {/* Shimmer sweep on hover */}
          <span className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-sky-100/60 to-transparent skew-x-12" />
          <span className="relative z-10 tracking-wide">Enter Portal</span>
        </motion.button>

        {/* Scroll hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-8 text-white/40 text-xs tracking-widest uppercase"
        >
          Tap to continue
        </motion.p>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          aria-hidden="true"
        >
          <path
            d="M0 40 C360 80, 1080 0, 1440 40 L1440 80 L0 80 Z"
            fill="white"
            fillOpacity="0.08"
          />
          <path
            d="M0 55 C400 20, 1050 75, 1440 50 L1440 80 L0 80 Z"
            fill="white"
            fillOpacity="0.05"
          />
        </svg>
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 w-full text-center">
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60 transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
