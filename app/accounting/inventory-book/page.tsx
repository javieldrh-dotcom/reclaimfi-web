"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function InventoryBookPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("inventory_book_entries").select("*").eq("company_id", cid).order("entry_number", { ascending: false });
    setEntries(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        await loadEntries(cid);
      }
    }
    load();
  }, []);

  async function archivePeriod() {
    setMessage("");
    if (!companyId) return;
    setLoading(true);

    const { data: inventoryItems } = await supabase.from("inventory_items").select("sku, item_name, unit, current_quantity, current_avg_cost").eq("company_id", companyId);

    const { data: accountsData } = await supabase.from("chart_of_accounts").select("id, account_type").eq("company_id", companyId).in("account_type", ["ASSET", "LIABILITY"]);
    const accountsMap: Record<string, string> = {};
    (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a.account_type; });
    const accountIds = (accountsData ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase.from("journal_lines").select("debit, credit, account_id").in("account_id", accountIds);

    let totalAssets = 0, totalLiabilities = 0;
    (lines ?? []).forEach((l: any) => {
      const type = accountsMap[l.account_id];
      if (type === "ASSET") totalAssets += (l.debit || 0) - (l.credit || 0);
      if (type === "LIABILITY") totalLiabilities += (l.credit || 0) - (l.debit || 0);
    });
    const totalEquity = totalAssets - totalLiabilities;

    const inventorySnapshot = (inventoryItems ?? []).map((i: any) => ({
      sku: i.sku, name: i.item_name, unit: i.unit, quantity: i.current_quantity, avgCost: i.current_avg_cost, totalValue: i.current_quantity * i.current_avg_cost,
    }));

    const nextNumber = entries.length > 0 ? Math.max(...entries.map((e) => e.entry_number)) + 1 : 1;

    const { error } = await supabase.from("inventory_book_entries").insert([{
      company_id: companyId,
      entry_number: nextNumber,
      period_end: periodEnd,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      inventory_snapshot: inventorySnapshot,
    }]);

    if (error) { setMessage("Error: " + error.message); setLoading(false); return; }

    setMessage("Periodo archivado correctamente en el Libro de Inventario (Nº " + nextNumber + ").");
    setLoading(false);
    await loadEntries(companyId);
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Libro de Inventario" subtitle="Registro legal obligatorio - Archiva el detalle de inventario y balance al cierre de cada periodo (Codigo de Comercio)" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 16, color: "#8B93A7", lineHeight: 1.7, ...theme.cardStyle }}>
          Este libro archiva de forma secuencial e inalterable el detalle completo de tu inventario de mercancia
          y el resumen de Activos/Pasivos/Patrimonio al cierre de cada periodo. Una vez archivado, un registro
          no puede modificarse ni eliminarse.
        </p>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>Fecha de Cierre del Periodo</label>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        <button onClick={archivePeriod} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "ARCHIVANDO..." : "ARCHIVAR PERIODO EN EL LIBRO"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>{companyName} - Registros Archivados</h2>
          {entries.map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 16 }}>
              <div onClick={() => setExpandedEntry(expandedEntry === e.id ? null : e.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>Nº {e.entry_number} - Cierre al {e.period_end}</span>
                <span style={{ fontSize: 16, color: theme.accent }}>{expandedEntry === e.id ? "▲ Ocultar" : "▼ Ver Detalle"}</span>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 10, fontSize: 16 }}>
                <span>Activos: <span style={theme.numberStyle}>{e.total_assets?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                <span>Pasivos: <span style={theme.numberStyle}>{e.total_liabilities?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                <span>Patrimonio: <span style={theme.numberStyle}>{e.total_equity?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
              </div>

              {expandedEntry === e.id && (
                <div style={{ marginTop: 16, borderTop: "1px solid #1F2937", paddingTop: 16 }}>
                  <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>Detalle de Inventario ({(e.inventory_snapshot ?? []).length} items)</h3>
                  {(e.inventory_snapshot ?? []).length === 0 && <p style={{ fontSize: 15, color: "#8B93A7" }}>Sin items de inventario registrados en esta fecha.</p>}
                  {(e.inventory_snapshot ?? []).map((item: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: 6, fontSize: 15, borderBottom: "1px solid #1F2937" }}>
                      <span>{item.sku} - {item.name} ({item.quantity} {item.unit})</span>
                      <span style={theme.numberStyle}>{item.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
