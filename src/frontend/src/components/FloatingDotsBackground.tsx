import { useMemo } from "react";

interface Dot {
  id: number;
  x: number; // percentage
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  opacity: number;
}

function generateDots(count: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      id: i,
      x: Math.random() * 100,
      size: 3 + Math.random() * 4, // 3–7px
      duration: 8 + Math.random() * 12, // 8–20s
      delay: -(Math.random() * 12), // stagger starts (negative for immediate float)
      opacity: 0.18 + Math.random() * 0.22, // 0.18–0.40
    });
  }
  return dots;
}

export default function FloatingDotsBackground() {
  const dots = useMemo(() => generateDots(30), []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        background: "#ffffff",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes float-dot {
          0% {
            transform: translateY(110vh) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: var(--dot-opacity);
          }
          85% {
            opacity: var(--dot-opacity);
          }
          100% {
            transform: translateY(-10vh) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
      {dots.map((dot) => (
        <div
          key={dot.id}
          style={
            {
              position: "absolute",
              bottom: 0,
              left: `${dot.x}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              "--dot-opacity": dot.opacity,
              animation: `float-dot ${dot.duration}s ${dot.delay}s infinite linear`,
            } as React.CSSProperties & { "--dot-opacity": number }
          }
        />
      ))}
    </div>
  );
}
