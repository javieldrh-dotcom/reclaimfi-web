"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "../components/NeuralBackground";
export default function HistoryPage() {

  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchWallets() {

      const { data, error } = await supabase
        .from("wallet_addresses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {

        console.error(error);

      } else {

        setWallets(data || []);

      }

      setLoading(false);

    }

    fetchWallets();

  }, []);

  return (

    <main className="min-h-screen bg-black p-10 text-white">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold text-cyan-400">
              Historial de Wallets
            </h1>

            <p className="mt-4 text-gray-500">
              Inteligencia historica de blockchain y analisis forense.
            </p>

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            SEGUIMIENTO EN VIVO
          </div>

        </div>

        {/* TABLE */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03]">

          <table className="w-full">

            <thead className="border-b border-white/5 bg-black/40">

              <tr>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Wallet
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Risk
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Score
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Behavior
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Activity
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Connections
                </th>

                <th className="px-6 py-5 text-left text-sm font-medium text-gray-400">
                  Timestamp
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Cargando inteligencia de wallets...
                  </td>

                </tr>

              ) : wallets.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No se encontro inteligencia de wallets.
                  </td>

                </tr>

              ) : (

                wallets.map((wallet) => (

                  <tr
                    key={wallet.id}
                    className="border-b border-white/5"
                  >

                    <td className="px-6 py-5 text-cyan-300">
                      {wallet.address}
                    </td>

                    <td
                      className={
                        "px-6 py-5 font-semibold " +

                        (wallet.risk_level === "HIGH"
                          ? "text-red-400"
                          : wallet.risk_level === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-green-400")
                      }
                    >
                      {wallet.risk_level}
                    </td>

                    <td className="px-6 py-5">
                      {wallet.metadata?.score}
                    </td>

                    <td className="px-6 py-5">
                      {wallet.metadata?.behavior}
                    </td>

                    <td className="px-6 py-5">
                      {wallet.metadata?.activity}
                    </td>

                    <td className="px-6 py-5">
                      {wallet.metadata?.connections}
                    </td>

                    <td className="px-6 py-5 text-gray-500">
                      {new Date(wallet.created_at).toLocaleString()}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>

  );
}

