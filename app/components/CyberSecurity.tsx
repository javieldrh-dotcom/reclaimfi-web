"use client";

import { useEffect, useState } from "react";

interface ThreatEvent {

  id: number;

  title: string;

  severity: string;

  source: string;

  timestamp: string;

}

export default function CyberSecurity() {

  const [events, setEvents] =
    useState<ThreatEvent[]>([]);

  useEffect(() => {

    const titles = [

      "Unauthorized lateral movement detected",

      "Endpoint anomaly escalation",

      "Suspicious PowerShell execution",

      "Zero-day behavioral pattern identified",

      "Credential dumping attempt blocked",

      "Firewall anomaly correlation",

      "Abnormal outbound traffic detected",

      "Privilege escalation attempt",

      "Malicious IP communication blocked",

      "SOC threat escalation triggered",

    ];

    const sources = [

      "FIREWALL",

      "SIEM",

      "ENDPOINT",

      "THREAT ENGINE",

      "SOC CORE",

      "NETWORK MONITOR",

    ];

    const severities = [

      "LOW",

      "MEDIUM",

      "HIGH",

      "CRITICAL",

    ];

    const interval =
      setInterval(() => {

        const event: ThreatEvent = {

          id: Date.now(),

          title:
            titles[
              Math.floor(
                Math.random() *
                  titles.length
              )
            ],

          severity:
            severities[
              Math.floor(
                Math.random() *
                  severities.length
              )
            ],

          source:
            sources[
              Math.floor(
                Math.random() *
                  sources.length
              )
            ],

          timestamp:
            new Date().toLocaleTimeString(),

        };

        setEvents((prev) => [

          event,
          ...prev.slice(0, 10),

        ]);

      }, 2200);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      {/* HEADER */}

      <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(239,68,68,0.08)]">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-red-400">

              CYBER DEFENSE CENTER

            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">

              Enterprise cybersecurity operations center
              for live threat intelligence,
              SIEM monitoring,
              incident response,
              endpoint telemetry,
              and operational cyber defense.

            </p>

          </div>

          <div className="rounded-3xl border border-red-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(239,68,68,0.15)]">

            <p className="text-xs tracking-[0.35em] text-red-400">

              SOC STATUS

            </p>

            <h2 className="mt-4 text-5xl font-black text-red-300">

              ACTIVE

            </h2>

          </div>

        </div>

      </div>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            LIVE THREATS

          </p>

          <h2 className="mt-5 text-6xl font-black text-red-300">

            17

          </h2>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            INCIDENTS

          </p>

          <h2 className="mt-5 text-6xl font-black text-yellow-300">

            42

          </h2>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ENDPOINTS

          </p>

          <h2 className="mt-5 text-6xl font-black text-cyan-300">

            912

          </h2>

        </div>

        <div className="rounded-3xl border border-green-500/20 bg-[#0d1117]/90 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            RESPONSE RATE

          </p>

          <h2 className="mt-5 text-6xl font-black text-green-300">

            98%

          </h2>

        </div>

      </div>

      {/* THREAT MATRIX */}

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-red-300">

            THREAT LEVEL

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[82%] rounded-full bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Elevated threat activity detected

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-yellow-300">

            NETWORK HEALTH

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[91%] rounded-full bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Infrastructure stable

            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-8">

          <h2 className="text-2xl font-black text-cyan-300">

            AI DETECTION

          </h2>

          <div className="mt-8">

            <div className="h-5 rounded-full bg-black">

              <div className="h-5 w-[97%] rounded-full bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]" />

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Autonomous defense operational

            </p>

          </div>

        </div>

      </div>

      {/* LIVE EVENTS */}

      <div className="mt-10 rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-red-300">

              LIVE THREAT STREAM

            </h2>

            <p className="mt-3 text-gray-500">

              Realtime cybersecurity telemetry

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-red-400" />

            <span className="text-sm font-black tracking-[0.25em] text-red-300">

              LIVE

            </span>

          </div>

        </div>

        {/* EVENTS */}

        <div className="mt-10 space-y-5">

          {events.map((event) => (

            <div
              key={event.id}
              className="rounded-2xl border border-red-500/10 bg-black/30 p-6 transition-all hover:border-red-400/20 hover:bg-red-500/5"
            >

              <div className="flex items-center justify-between">

                {/* LEFT */}

                <div>

                  <div className="flex items-center gap-4">

                    <span className="rounded-full bg-red-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-red-300">

                      {event.source}

                    </span>

                    <span className="text-sm text-gray-500">

                      {event.timestamp}

                    </span>

                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">

                    {event.title}

                  </h3>

                </div>

                {/* RIGHT */}

                <div>

                  <span className={`rounded-full px-5 py-3 text-xs font-black tracking-[0.2em] ${
                    event.severity ===
                    "CRITICAL"
                      ? "bg-red-500/20 text-red-300"

                      : event.severity ===
                        "HIGH"
                      ? "bg-orange-500/20 text-orange-300"

                      : event.severity ===
                        "MEDIUM"
                      ? "bg-yellow-500/20 text-yellow-300"

                      : "bg-green-500/20 text-green-300"
                  }`}>

                    {event.severity}

                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

