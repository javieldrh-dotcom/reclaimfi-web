"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function DeferredTaxPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [differenceType, setDifferenceType] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState("ASSET");
  const [message, setMessage] = useState("");

  async function loadEntries(cid: string) {
    const { data } = await supabase.from("deferred_tax_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: false });
    setEntries(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadEntries(cid);
    }
    load();
  }, []);

  async function createEntry() {
    setMessage("");
    if (!companyId || !description || !amount) { setMessage("Completa descripcion y monto."); return; }

    const amt = parseFloat(amount);

    const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_name").eq("company_id", companyId);
    const deferredAssetAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase().includes("activo por impuesto diferido"));
    const deferredLiabilityAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase().includes("pasivo por impuesto diferido"));
    const deferredExpenseAccount = (accounts ?? []).find((a: any) => a.account_name.toLowerCase().includes("gasto (ingreso) por impuesto diferido"));

    if (!deferredAssetAccount || !deferredLiabilityAccount || !deferredExpenseAccount) {
      setMessage("Error: no se encontraron las cuentas de Impuesto Diferido en el plan de cuentas.");
      return;
    }

    const { data: entry } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Impuesto Diferido - " + description,
      entry_date: entryDate,
    }]).select("id").single();

    if (!entry) { setMessage("Error al crear el asiento."); return; }

    const lines = entryType === "ASSET"
      ? [
          { journal_entry_id: entry.id, account_id: deferredAssetAccount.id, debit: amt, credit: 0 },
          { journal_entry_id: entry.id, account_id: deferredExpenseAccount.id, debit: 0, credit: amt },
        ]
      : [
          { journal_entry_id: entry.id, account_id: deferredExpenseAccount.id, debit: amt, credit: 0 },
          { journal_entry_id: entry.id, account_id: deferredLiabilityAccount.id, debit: 0, credit: amt },
        ];

    await supabase.from("journal_lines").insert(lines);

    await supabase.from("deferred_tax_entries").insert([{
      company_id: companyId,
      entry_date: entryDate,
      description,
      temporary_difference_type: differenceType,
      amount: amt,
      entry_type: entryType,
      journal_entry_id: entry.id,
    }]);

    setMessage("Movimiento de Impuesto Diferido registrado y asiento contable generado.");
    setDescription(""); setDifferenceType(""); setAmount("");
    await loadEntries(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 22 };
  return (
    <VerticalPageLayout vertical="accounting" title="Impuesto Diferido" subtitle="Registro de diferencias temporarias segun NIC 12 - Captura manual, calculo determinado por el contador" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 17, color: "#8B93A7", lineHeight: 1.7 }}>
          El Impuesto Diferido surge cuando hay diferencias entre la base contable y la base fiscal de un activo o pasivo
          (ej. depreciacion, provisiones no deducibles, perdidas fiscales trasladables). Registra aqui el monto que tu
          contador haya determinado; el sistema genera el asiento contable correspondiente automaticamente.
        </p>

        <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={{ ...inputStyle, marginTop: 16 }} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Descripcion (ej. Diferencia por depreciacion)" />
        <input value={differenceType} onChange={(e) => setDifferenceType(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Tipo de diferencia temporaria (opcional)" />
        <select value={entryType} onChange={(e) => setEntryType(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          <option value="ASSET">Activo por Impuesto Diferido</option>
          <option value="LIABILITY">Pasivo por Impuesto Diferido</option>
        </select>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Monto" />

        <button onClick={createEntry} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          REGISTRAR MOVIMIENTO
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 26, color: theme.accent, fontWeight: 700 }}>Movimientos Registrados</h2>
          {entries.map((e) => (
            <div key={e.id} style={{ ...theme.cardStyle, marginTop: 12, fontSize: 20 }}>
              {e.entry_date} - {e.description} ({e.entry_type === "ASSET" ? "Activo" : "Pasivo"}): <span style={theme.numberStyle}>{e.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </VerticalPageLayout>
  );
}
