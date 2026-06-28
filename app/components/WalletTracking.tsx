"use client";

import { useEffect, useState } from "react";

interface WalletEvent {

  id: number;

  message: string;

  level: string;

}

export default function WalletTracking() {

  const [events, setEvents] =
    useState<WalletEvent[]>([]);

  useEffect(() => {

    const messages = [

      "[LIVE] Tracking Binance Wallet...",
      "[LIVE] Ethereum Node Synchronized...",
      "[LIVE] Suspicious Wallet Pattern Detected...",
      "[LIVE] AML Engine Operational...",
      "[LIVE] Mixer Interaction Identified...",
      "[LIVE] AI Behavioral Analysis Running...",
      "[LIVE] Cross-chain Transaction Identified...",
      "[LIVE] Compliance Verification Active...",
      "[LIVE] Wallet Risk Scoring Updated...",
      "[LIVE] Blockchain Node Stable...",

    ];

    let counter = 0;

    const interval =
      setInterval(() => {

        const randomMessage =
          messages[
            Math.floor(
              Math.random() *
                messages.length
            )
          ];

        const newEvent = {

          id: Date.now(),

          message:
            randomMessage,

          level:
            Math.random() > 0.7
              ? "HIGH"
              : "NORMAL",

        };

        setEvents((prev) => [

          newEvent,
          ...prev.slice(0, 8),

        ]);

        counter++;

      }, 2500);

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div>

      <h1 className="text-5xl font-black text-cyan-300">

        WALLET TRACKING

      </h1>

      <p className="mt-4 text-gray-400">

        Blockchain Intelligence Monitoring System

      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            ACTIVE NODES

          </p>

          <h2 className="mt-4 text-5xl font-black text-cyan-300">

            12

          </h2>

        </div>

        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            TRACKED WALLETS

          </p>

          <h2 className="mt-4 text-5xl font-black text-green-400">

            182

          </h2>

        </div>

        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-4 text-5xl font-black text-red-400">

            7

          </h2>

        </div>

      </div>

      {/* LIVE FEED */}

      <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

        <h2 className="mb-6 text-2xl font-bold text-cyan-300">

          LIVE BLOCKCHAIN FEED

        </h2>

        <div className="space-y-4">

          {events.map((event) => (

            <div
              key={event.id}
              className="rounded-lg border border-cyan-400/10 bg-black/30 p-4"
            >

              <div className="flex items-center justify-between">

                <p className="font-mono text-sm text-cyan-300">

                  {event.message}

                </p>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    event.level === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >

                  {event.level}

                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

