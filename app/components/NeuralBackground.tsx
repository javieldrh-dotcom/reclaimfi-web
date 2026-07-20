"use client";
import { useEffect, useRef } from "react";

interface Props {
  color?: string;
  particleCount?: number;
  contained?: boolean;
}

export default function NeuralBackground({ color = "#2DD4BF", particleCount = 140, contained = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    let animationId: number;

    function getSize() {
      if (contained && containerRef.current) {
        return { w: containerRef.current.clientWidth, h: containerRef.current.clientHeight };
      }
      return { w: window.innerWidth, h: window.innerHeight };
    }

    function init() {
      const { w, h } = getSize();
      canvas!.width = w;
      canvas!.height = h;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, contained ? 2 : 2.5, 0, Math.PI * 2);
        ctx!.shadowBlur = contained ? 12 : 20;
        ctx!.shadowColor = color;
        ctx!.fillStyle = color;
        ctx!.fill();
        ctx!.shadowBlur = 0;

        for (let j = idx + 1; j < particles.length; j++) {
          const d = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
          const maxDist = contained ? 90 : 200;
          if (d < maxDist) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.lineWidth = 1;
            ctx!.strokeStyle = color + Math.floor((1 - d / maxDist) * 60).toString(16).padStart(2, "0");
            ctx!.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationId);
    };
  }, [color, particleCount, contained]);

  if (contained) {
    return (
      <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, opacity: 0.7 }} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, zIndex: 0, opacity: 0.5, pointerEvents: "none" }}
    />
  );
}