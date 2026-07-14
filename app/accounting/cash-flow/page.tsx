"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

export default function CashFlowPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }

      const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      setCurrency(companyData?.functional_currency ?? "USD");

      const { data: cashAccounts } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .eq("company_id", cid)
        .or("account_code.ilike.1101%,account_code.ilike.1102%");

      const accountsMap: Record<string, any> = {};
      (cashAccounts ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (cashAccounts ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, journal_entry_id, journal_entries(description, entry_date)")
        .in("account_id", accountIds);

      const rows = (lines ?? []).map((l: any) => {
        const acc = accountsMap[l.account_id];
        const entry = l.journal_entries;
        const net = (l.debit || 0) - (l.credit || 0);
        return {
          date: entry?.entry_date,
          description: entry?.description,
          account: acc?.account_name,
          amount: net,
        };
      }).sort((a: any, b: any) => (a.date > b.date ? 1 : -1));

      setMovements(rows);
      setLoading(false);
    }
    load();
  }, []);

  const totalNet = movements.reduce((s, m) => s + m.amount, 0);

  function downloadPdf() {
    const doc = generateFinancialStatementPdf(
      "ESTADO DE FLUJO DE EFECTIVO",
      companyName,
      [
        { title: "Movimientos de Caja y Bancos", items: movements.map((m) => ({ name: m.description + " (" + m.account + ")", amount: m.amount })), total: totalNet, totalLabel: "Subtotal" },
      ],
      "Flujo de Efectivo Neto del Periodo",
      totalNet,
      currency
    );
    doc.save("estado-flujo-efectivo.pdf");
  }

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Estado de Flujo de Efectivo</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontSize: 13 }}>Movimientos de cuentas de Caja y Bancos</p>

      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
            <th style={{ padding: 8 }}>Fecha</th>
            <th style={{ padding: 8 }}>Descripcion</th>
            <th style={{ padding: 8 }}>Cuenta</th>
            <th style={{ padding: 8 }}>Movimiento Neto</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #1a3050" }}>
              <td style={{ padding: 8 }}>{m.date}</td>
              <td style={{ padding: 8 }}>{m.description}</td>
              <td style={{ padding: 8 }}>{m.account}</td>
              <td style={{ padding: 8, color: m.amount >= 0 ? "#4ade80" : "#f87171" }}>
                {m.amount >= 0 ? "+" : ""}{m.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 30, padding: 16, background: "#0d1117", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: totalNet >= 0 ? "#4ade80" : "#f87171" }}>
        <span>Flujo de Efectivo Neto del Periodo</span>
        <span>{totalNet.toLocaleString()}</span>
      </div>

      <button onClick={downloadPdf} style={{ marginTop: 20, padding: 14, background: "#4ade80", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
        DESCARGAR PDF
      </button>
    </div>
  );
}
