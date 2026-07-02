"use client";

import { useEffect, useRef } from "react";

export default function NeuralBackground() {

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas!.getContext("2d");

    if (!ctx) return;

    let particles: any[] = [];

    function init() {

      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;

      particles = [];

      for (let i = 0; i < 180; i++) {

        particles.push({

          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,

          vx: (Math.random() - 0.5) * 1.1,
          vy: (Math.random() - 0.5) * 1.1,

        });

      }

    }

    function draw() {

      ctx!.clearRect(
        0,
        0,
        canvas!.width,
        canvas!.height
      );

      particles.forEach((p, idx) => {

        p.x += p.vx;
        p.y += p.vy;

        if (
          p.x < 0 ||
          p.x > canvas!.width
        ) p.vx *= -1;

        if (
          p.y < 0 ||
          p.y > canvas!.height
        ) p.vy *= -1;

        ctx!.beginPath();

        ctx!.arc(
          p.x,
          p.y,
          2,
          0,
          Math.PI * 2
        );

        ctx!.fillStyle = "#38bdf8";

        ctx!.shadowBlur = 18;
        ctx!.shadowColor = "#38bdf8";

        ctx!.fill();

        ctx!.shadowBlur = 0;

        for (
          let j = idx + 1;
          j < particles.length;
          j++
        ) {

          const d = Math.hypot(
            p.x - particles[j].x,
            p.y - particles[j].y
          );

          if (d < 180) {

            ctx!.beginPath();

            ctx!.moveTo(p.x, p.y);

            ctx!.lineTo(
              particles[j].x,
              particles[j].y
            );

            ctx!.strokeStyle =
              `rgba(56,189,248,${
                1 - d / 180
              })`;

            ctx!.lineWidth = 1;

            ctx!.stroke();

          }

        }

      });

      requestAnimationFrame(draw);

    }

    init();

    draw();

    window.addEventListener(
      "resize",
      init
    );

    return () => {

      window.removeEventListener(
        "resize",
        init
      );

    };

  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
      />

      <div className="absolute inset-0 bg-black/50 z-10" />
    </>
  );

}

