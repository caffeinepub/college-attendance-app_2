import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

/* ── Graduation hat animation keyframes ── */
const hatKeyframes = `
  @keyframes hat-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes tassel-sway {
    0%, 100% { transform-origin: top center; transform: rotate(-8deg); }
    50%       { transform-origin: top center; transform: rotate(8deg); }
  }
  @keyframes hat-glow {
    0%, 100% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.4)) drop-shadow(0 0 20px rgba(135,206,235,0.3)); }
    50%       { filter: drop-shadow(0 0 20px rgba(255,255,255,0.7)) drop-shadow(0 0 40px rgba(135,206,235,0.5)); }
  }
  @keyframes sparkle-pop {
    0%   { opacity: 0; transform: scale(0) rotate(0deg); }
    50%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: scale(0) rotate(360deg); }
  }
  @keyframes star-twinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.7); }
    50%       { opacity: 1;   transform: scale(1.3); }
  }
`;

/** Sparkle star shape */
function SparkleIcon({
  size,
  style,
}: {
  size: number;
  style: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      role="img"
      aria-label="sparkle"
    >
      <path
        d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill="white"
      />
    </svg>
  );
}

/** The graduation hat SVG with animations */
function GraduationHatAnimation() {
  return (
    <div
      style={{
        position: "relative",
        width: 200,
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{hatKeyframes}</style>

      {/* Sparkle stars around the hat */}
      {[
        {
          id: "s1",
          top: "8%",
          left: "12%",
          size: 14,
          delay: "0s",
          dur: "2.1s",
        },
        {
          id: "s2",
          top: "5%",
          left: "72%",
          size: 10,
          delay: "0.4s",
          dur: "1.8s",
        },
        {
          id: "s3",
          top: "20%",
          left: "85%",
          size: 16,
          delay: "0.8s",
          dur: "2.4s",
        },
        {
          id: "s4",
          top: "70%",
          left: "80%",
          size: 11,
          delay: "0.3s",
          dur: "2.0s",
        },
        {
          id: "s5",
          top: "75%",
          left: "10%",
          size: 13,
          delay: "1.1s",
          dur: "2.2s",
        },
        {
          id: "s6",
          top: "30%",
          left: "2%",
          size: 9,
          delay: "0.6s",
          dur: "1.9s",
        },
        {
          id: "s7",
          top: "55%",
          left: "88%",
          size: 8,
          delay: "1.4s",
          dur: "2.3s",
        },
      ].map((s) => (
        <SparkleIcon
          key={s.id}
          size={s.size}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            animation: `star-twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
            opacity: 0.2,
          }}
        />
      ))}

      {/* The graduation cap SVG — floating & glowing */}
      <div
        style={{
          animation:
            "hat-float 3s ease-in-out infinite, hat-glow 3s ease-in-out infinite",
          position: "relative",
          zIndex: 5,
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Graduation cap"
        >
          {/* ── Board / top face of mortarboard ── */}
          {/* The flat diamond/rhombus on top */}
          <polygon
            points="75,18  138,52  75,72  12,52"
            fill="white"
            stroke="rgba(135,206,235,0.6)"
            strokeWidth="1.5"
            opacity="0.95"
          />
          {/* Subtle highlight on top face */}
          <polygon
            points="75,22  128,52  75,65  22,52"
            fill="rgba(200,235,255,0.35)"
          />

          {/* ── Cap body / underneath edge ── */}
          {/* Left side face depth */}
          <polygon
            points="12,52  12,60  75,80  75,72"
            fill="rgba(180,220,255,0.7)"
            stroke="rgba(135,206,235,0.4)"
            strokeWidth="1"
          />
          {/* Right side face depth */}
          <polygon
            points="138,52  138,60  75,80  75,72"
            fill="rgba(160,210,255,0.65)"
            stroke="rgba(135,206,235,0.4)"
            strokeWidth="1"
          />
          {/* Bottom edge line */}
          <line
            x1="12"
            y1="60"
            x2="75"
            y2="80"
            stroke="rgba(135,206,235,0.5)"
            strokeWidth="1"
          />
          <line
            x1="138"
            y1="60"
            x2="75"
            y2="80"
            stroke="rgba(135,206,235,0.5)"
            strokeWidth="1"
          />

          {/* ── Cap body cylinder ── */}
          {/* Cylinder sides */}
          <rect
            x="54"
            y="68"
            width="42"
            height="24"
            rx="2"
            fill="white"
            opacity="0.9"
          />
          {/* Cylinder bottom ellipse */}
          <ellipse
            cx="75"
            cy="92"
            rx="21"
            ry="6"
            fill="rgba(200,230,255,0.8)"
            stroke="rgba(135,206,235,0.4)"
            strokeWidth="1"
          />
          {/* Cylinder top ellipse */}
          <ellipse cx="75" cy="68" rx="21" ry="5" fill="white" opacity="0.6" />

          {/* ── Tassel anchor point & string ── */}
          {/* Tassel base dot on board */}
          <circle cx="108" cy="47" r="4" fill="rgba(255,220,80,0.95)" />
          <circle cx="108" cy="47" r="2.5" fill="rgba(255,240,140,1)" />

          {/* Tassel cord hanging down — animated sway */}
          <g
            style={{
              animation: "tassel-sway 2.5s ease-in-out infinite",
              transformOrigin: "108px 47px",
            }}
          >
            {/* Main cord */}
            <path
              d="M108,51 Q118,75 112,95"
              stroke="rgba(255,215,60,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tassel tuft */}
            <line
              x1="106"
              y1="93"
              x2="103"
              y2="108"
              stroke="rgba(255,215,60,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="109"
              y1="94"
              x2="108"
              y2="110"
              stroke="rgba(255,215,60,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="113"
              y1="93"
              x2="115"
              y2="107"
              stroke="rgba(255,215,60,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Tassel knot */}
            <ellipse
              cx="109"
              cy="95"
              rx="5"
              ry="3.5"
              fill="rgba(255,200,40,0.9)"
            />
          </g>

          {/* ── Shimmer highlight on board ── */}
          <polygon
            points="75,20  95,38  75,30"
            fill="rgba(255,255,255,0.5)"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Circular glow halo behind the hat */}
      <div
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
          animation: "hat-glow 3s ease-in-out infinite",
          zIndex: 2,
        }}
      />
    </div>
  );
}

interface EnterPageProps {
  onEnter: () => void;
}

export default function EnterPage({ onEnter }: EnterPageProps) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const rippleIdRef = useRef(0);

  // Ripple effect on button click
  const handleButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++rippleIdRef.current;

      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 700);

      // Delay navigation for ripple to show
      setTimeout(onEnter, 400);
    },
    [onEnter],
  );

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(145deg, #0369a1 0%, #0284c7 40%, #0369a1 100%)",
      }}
    >
      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Graduation hat animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative mb-6 flex items-center justify-center"
          style={{ width: 200, height: 200 }}
        >
          <GraduationHatAnimation />
        </motion.div>

        {/* College name */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="font-display text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight"
        >
          Kathir College of Engineering
        </motion.h2>

        {/* Address */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="text-white/80 text-xs tracking-wide mb-7"
        >
          Wisdom tree, Neelambur, Coimbatore – 641062
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="w-20 h-px bg-white/40 mb-7"
        />

        {/* App name — static, no typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          className="mb-3"
        >
          <h1
            className="font-display font-bold tracking-wide text-white"
            style={{ fontSize: "clamp(3rem, 10vw, 5rem)" }}
          >
            Attenly
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="text-white/80 text-sm sm:text-base tracking-widest uppercase mb-10 font-body"
          style={{ letterSpacing: "0.2em" }}
        >
          Attendance Management System
        </motion.p>

        {/* Get Started button */}
        <motion.button
          data-ocid="enter.primary_button"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: 1.0,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.97 }}
          onClick={handleButtonClick}
          className="relative overflow-hidden px-10 py-4 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
          style={{
            background: "oklch(0.32 0.1 250)",
            boxShadow:
              "0 4px 24px -4px oklch(0.32 0.1 250 / 0.35), 0 1px 4px oklch(0 0 0 / 0.12)",
          }}
        >
          {/* Button shimmer sweep on hover */}
          <span className="absolute inset-0 translate-x-[-110%] hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="absolute rounded-full bg-white/30 pointer-events-none"
                initial={{
                  width: 0,
                  height: 0,
                  x: ripple.x,
                  y: ripple.y,
                  translateX: "0%",
                  translateY: "0%",
                  opacity: 0.6,
                }}
                animate={{
                  width: 300,
                  height: 300,
                  x: ripple.x - 150,
                  y: ripple.y - 150,
                  opacity: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>

          <span className="relative z-10 font-body font-semibold text-white text-base tracking-wide">
            Get Started
          </span>
        </motion.button>

        {/* Tap to continue hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-8 text-white/60 text-xs tracking-widest uppercase"
          style={{ letterSpacing: "0.25em" }}
        >
          ↑ Tap to continue
        </motion.p>
      </div>

      {/* Bottom footer */}
      <div className="absolute bottom-4 w-full text-center z-10">
        <p className="text-white/60 text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
