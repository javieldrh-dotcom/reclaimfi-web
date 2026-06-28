"use client";

import { useEffect, useRef } from "react";

export default function InvestigationGraph() {

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = 700;

    const nodes = [];

    for (let i = 0; i < 24; i++) {

      nodes.push({

        x:
          Math.random() *
          canvas.width,

        y:
          Math.random() *
          canvas.height,

        vx:
          (Math.random() - 0.5) *
          0.8,

        vy:
          (Math.random() - 0.5) *
          0.8,

        risk:
          Math.random() > 0.7,

      });

    }

    const animate = () => {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      nodes.forEach((node, i) => {

        node.x += node.vx;
        node.y += node.vy;

        if (
          node.x < 0 ||
          node.x > canvas.width
        )
          node.vx *= -1;

        if (
          node.y < 0 ||
          node.y > canvas.height
        )
          node.vy *= -1;

        ctx.beginPath();

        ctx.arc(
          node.x,
          node.y,
          node.risk ? 8 : 5,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          node.risk
            ? "#ef4444"
            : "#22d3ee";

        ctx.shadowBlur = 25;

        ctx.shadowColor =
          node.risk
            ? "#ef4444"
            : "#22d3ee";

        ctx.fill();

        ctx.shadowBlur = 0;

        for (
          let j = i + 1;
          j < nodes.length;
          j++
        ) {

          const other =
            nodes[j];

          const dist =
            Math.hypot(
              node.x - other.x,
              node.y - other.y
            );

          if (dist < 220) {

            ctx.beginPath();

            ctx.moveTo(
              node.x,
              node.y
            );

            ctx.lineTo(
              other.x,
              other.y
            );

            ctx.strokeStyle =
              node.risk ||
              other.risk
                ? `rgba(239,68,68,${
                    1 - dist / 220
                  })`
                : `rgba(34,211,238,${
                    1 - dist / 220
                  })`;

            ctx.lineWidth = 1;

            ctx.stroke();

          }

        }

      });

      requestAnimationFrame(
        animate
      );

    };

    animate();

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        INVESTIGATION GRAPH

      </h1>

      <p className="mt-4 text-gray-400">

        Neural intelligence relationship mapping

      </p>

      <div className="mt-10 overflow-hidden rounded-xl border border-cyan-400/20 bg-black/40">

        <canvas
          ref={canvasRef}
          className="w-full"
        />

      </div>

    </div>

  );

}

