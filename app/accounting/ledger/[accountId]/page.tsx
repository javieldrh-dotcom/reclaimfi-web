"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function LedgerPage() {
  const params = useParams();
  const accountId = params?.accountId as string;
  const [account, setAccount] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: acc } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, account_type")
        .eq("id", accountId)
        .single();
      setAccount(acc);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, journal_entries!inner(description, entry_date, status)")
        .eq("account_id", accountId)
        .eq("journal_entries.status", "ACTIVE")
        .order("journal_entries(entry_date)", { ascending: true });

      let runningBalance = 0;
      const rows = (lines ?? []).map((l: any) => {
        runningBalance += (l.debit || 0) - (l.credit || 0);
        return {
          date: l.journal_entries?.entry_date,
          description: l.journal_entries?.description,
          debit: l.debit || 0,
          credit: l.credit || 0,
          balance: runningBalance,
        };
      });

      setMovements(rows);
      setLoading(false);
    }
    if (accountId) load();
  }, [accountId]);

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <Link href="/accounting/trial-balance" style={{ color: "#7dd3fc", fontSize: 13 }}>Volver al Balance</Link>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc", marginTop: 12 }}>Mayor Auxiliar: {account?.account_code} - {account?.account_name}</h1>
      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
            <th style={{ padding: 8 }}>Fecha</th>
            <th style={{ padding: 8 }}>Descripcion</th>
            <th style={{ padding: 8 }}>Debe</th>
            <th style={{ padding: 8 }}>Haber</th>
            <th style={{ padding: 8 }}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #1a3050" }}>
              <td style={{ padding: 8 }}>{m.date}</td>
              <td style={{ padding: 8 }}>{m.description}</td>
              <td style={{ padding: 8 }}>{m.debit > 0 ? m.debit.toLocaleString() : ""}</td>
              <td style={{ padding: 8 }}>{m.credit > 0 ? m.credit.toLocaleString() : ""}</td>
              <td style={{ padding: 8, fontWeight: 700 }}>{m.balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {movements.length === 0 && (
        <p style={{ marginTop: 20, color: "#9ca3af" }}>No hay movimientos registrados.</p>
      )}
    </div>
  );
}

