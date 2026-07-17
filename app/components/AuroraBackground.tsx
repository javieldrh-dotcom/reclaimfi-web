"use client";

export default function AuroraBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{`
        @keyframes auroraMove1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, 60px) scale(1.15); }
        }
        @keyframes auroraMove2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-100px, 40px) scale(1.1); }
        }
        @keyframes auroraMove3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -80px) scale(1.2); }
        }
      `}</style>
      <div style={{
        position: "absolute", top: "-10%", left: "5%", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, #2DD4BF33 0%, transparent 70%)",
        animation: "auroraMove1 18s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", top: "20%", right: "0%", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, #818CF833 0%, transparent 70%)",
        animation: "auroraMove2 22s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "30%", width: 650, height: 650, borderRadius: "50%",
        background: "radial-gradient(circle, #FB923C22 0%, transparent 70%)",
        animation: "auroraMove3 20s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
    </div>
  );
}