"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";
import { logCompanyLedgerEvent } from "@/app/lib/logLedgerEvent";

// Cuentas de Orden (memorandum accounts): registran compromisos fuera de
// balance (avales otorgados, bienes en custodia, litigios, arrendamientos,
// contratos por ejecutar, etc.) que NO afectan el resultado del ejercicio
// y por eso quedan fuera del cierre contable -- no hay un estandar NIIF
// que las exija como asiento de partida doble (la exigencia real es NIC 37,
// revelacion en notas de contingencias y compromisos), pero mantenerlas
// como libro de control interno es practica profesional habitual y es lo
// que alimenta esas notas. Por eso este modulo vive aparte del Diario
// "real": usa el mismo motor de asientos (journal_entries/journal_lines,
// con su cadena de hashes y el bloqueo de periodo), pero cada movimiento
// SOLO puede enlazar una cuenta ORDER_DEBTOR con una ORDER_CREDITOR -- nunca
// con una cuenta de balance/resultados -- para que el saldo deudor y el
// acreedor de este libro siempre cuadren entre si, sin mezclarse con el
// resultado del ejercicio. chart_of_accounts.account_type ya admite estos
// dos valores (lo uso tambien, desde antes, app/apu/projects/page.tsx para
// registrar el compromiso contractual al adjudicar una licitacion); este
// modulo es el lugar general para cualquier otro caso.
interface Account { id: string; account_code: string; account_name: string; account_type: string; }

export default function MemorandumAccountsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [debtorAccounts, setDebtorAccounts] = useState<Account[]>([]);
  const [creditorAccounts, setCreditorAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Nueva cuenta
  const [newAccountType, setNewAccountType] = useState<"ORDER_DEBTOR" | "ORDER_CREDITOR">("ORDER_DEBTOR");
  const [newAccountCode, setNewAccountCode] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  // Nuevo movimiento
  const [moveDate, setMoveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [moveDescription, setMoveDescription] = useState("");
  const [moveDebtorId, setMoveDebtorId] = useState("");
  const [moveCreditorId, setMoveCreditorId] = useState("");
  const [moveAmount, setMoveAmount] = useState("");

  async function loadAll(cid: string) {
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type")
      .eq("company_id", cid)
      .in("account_type", ["ORDER_DEBTOR", "ORDER_CREDITOR"])
      .order("account_code");

    const debtors = (accounts ?? []).filter((a) => a.account_type === "ORDER_DEBTOR");
    const creditors = (accounts ?? []).filter((a) => a.account_type === "ORDER_CREDITOR");
    setDebtorAccounts(debtors);
    setCreditorAccounts(creditors);

    const accountIds = (accounts ?? []).map((a) => a.id);
    if (accountIds.length === 0) { setBalances({}); return; }

    const { data: lines } = await supabase
      .from("journal_lines")
      .select("account_id, debit, credit, journal_entries!inner(status)")
      .in("account_id", accountIds)
      .eq("journal_entries.status", "ACTIVE");

    const byAccount: Record<string, number> = {};
    (lines ?? []).forEach((l: any) => {
      byAccount[l.account_id] = (byAccount[l.account_id] || 0) + (l.debit || 0) - (l.credit || 0);
    });
    setBalances(byAccount);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadAll(cid);
    }
    load();
  }, []);

  async function createAccount() {
    setMessage("");
    if (!companyId || !newAccountCode.trim() || !newAccountName.trim()) {
      setMessage("Completa el codigo y el nombre de la cuenta.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("chart_of_accounts").insert([{
      company_id: companyId,
      account_code: newAccountCode.trim(),
      account_name: newAccountName.trim(),
      account_type: newAccountType,
    }]);
    setLoading(false);
    if (error) { setMessage("Error al crear la cuenta: " + error.message); return; }
    setMessage("Cuenta de orden creada.");
    setNewAccountCode("");
    setNewAccountName("");
    await loadAll(companyId);
  }

  async function registerMovement() {
    setMessage("");
    const amount = parseFloat(moveAmount);
    if (!companyId || !moveDebtorId || !moveCreditorId || !amount || amount <= 0 || !moveDescription.trim()) {
      setMessage("Completa fecha, descripcion, ambas cuentas y un monto mayor a cero.");
      return;
    }
    setLoading(true);

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).eq("status", "ACTIVE").not("entry_number", "is", null).order("entry_number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Cuenta de Orden - " + moveDescription.trim(),
      entry_date: moveDate,
      entry_number: nextNumber,
    }]).select("id").single();

    if (entryError || !entry) { setLoading(false); setMessage("No se pudo registrar el movimiento: " + entryError?.message); return; }

    const { error: linesError } = await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: moveDebtorId, debit: amount, credit: 0 },
      { journal_entry_id: entry.id, account_id: moveCreditorId, debit: 0, credit: amount },
    ]);

    setLoading(false);
    if (linesError) { setMessage("No se pudo registrar el movimiento: " + linesError.message); return; }

    await logCompanyLedgerEvent("rf.memorandum_account.movement_registered", companyId, {
      entry_id: entry.id, entry_number: nextNumber, debtor_account_id: moveDebtorId, creditor_account_id: moveCreditorId, amount,
    });

    setMessage("Movimiento Nº" + nextNumber + " registrado.");
    setMoveDescription("");
    setMoveAmount("");
    await loadAll(companyId);
  }

  const totalDebtor = debtorAccounts.reduce((s, a) => s + (balances[a.id] || 0), 0);
  const totalCreditor = creditorAccounts.reduce((s, a) => s - (balances[a.id] || 0), 0); // creditor balance is naturally negative (credit > debit)
  const balanced = Math.abs(totalDebtor - totalCreditor) < 0.01;
  const inputStyle = { ...theme.inputStyle, fontSize: 16 };
  const allAccounts = [...debtorAccounts, ...creditorAccounts];

  return (
    <VerticalPageLayout vertical="accounting" title="Cuentas de Orden" subtitle="Compromisos y contingencias fuera de balance (soporte para notas NIC 37) -- no afectan el resultado del ejercicio ni entran en el cierre" fullWidth>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <div style={{ ...theme.cardStyle, marginBottom: 24, border: balanced ? "1px solid " + theme.border : "2px solid #f87171" }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Resumen (para notas NIC 37)</h3>
          <p style={{ fontSize: 16 }}>Total Deudoras: <span style={theme.numberStyle}>{totalDebtor.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 16, marginTop: 4 }}>Total Acreedoras: <span style={theme.numberStyle}>{totalCreditor.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 16, marginTop: 10, fontWeight: 700, color: balanced ? "#4ade80" : "#f87171" }}>
            {balanced ? "Cuadra: deudoras = acreedoras" : "No cuadra -- revisa los movimientos, alguna cuenta de orden se cruzo con una cuenta que no es de orden"}
          </p>
          <div style={{ marginTop: 16 }}>
            {debtorAccounts.map((a) => (
              <p key={a.id} style={{ fontSize: 14, color: "#B0B8C8" }}>{a.account_code} {a.account_name} (deudora): {(balances[a.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            ))}
            {creditorAccounts.map((a) => (
              <p key={a.id} style={{ fontSize: 14, color: "#B0B8C8" }}>{a.account_code} {a.account_name} (acreedora): {(-(balances[a.id] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            ))}
            {allAccounts.length === 0 && <p style={{ fontSize: 14, color: "#8B93A7" }}>Todavia no hay cuentas de orden creadas.</p>}
          </div>
        </div>

        <div style={{ ...theme.cardStyle, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Crear Cuenta de Orden</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as any)} style={inputStyle}>
              <option value="ORDER_DEBTOR">Deudora</option>
              <option value="ORDER_CREDITOR">Acreedora (contra)</option>
            </select>
            <input value={newAccountCode} onChange={(e) => setNewAccountCode(e.target.value)} placeholder="Codigo (ej. 8101)" style={{ ...inputStyle, width: 160 }} />
            <input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Nombre (ej. Avales Otorgados)" style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
          </div>
          <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 8 }}>
            Cada compromiso necesita un par: una cuenta deudora (lo que se registra) y su contra acreedora (ej. "Avales Otorgados" / "Avales Otorgados - Responsabilidad por Contra"). Crea las dos antes de registrar movimientos.
          </p>
          <button onClick={createAccount} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 15 }}>Crear Cuenta</button>
        </div>

        <div style={{ ...theme.cardStyle }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Registrar Movimiento</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} style={inputStyle} />
            <input value={moveDescription} onChange={(e) => setMoveDescription(e.target.value)} placeholder="Descripcion del compromiso" style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <AccountSearchSelect accounts={debtorAccounts} value={moveDebtorId} onChange={setMoveDebtorId} placeholder="Cuenta deudora..." />
            <AccountSearchSelect accounts={creditorAccounts} value={moveCreditorId} onChange={setMoveCreditorId} placeholder="Cuenta acreedora (contra)..." />
          </div>
          <input type="number" value={moveAmount} onChange={(e) => setMoveAmount(e.target.value)} placeholder="Monto" style={{ ...inputStyle, width: 200 }} />
          <div>
            <button onClick={registerMovement} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 15 }}>Registrar Movimiento</button>
          </div>
          <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 8 }}>
            Esto crea un asiento en el mismo Diario (con numero de asiento y cadena de hashes), pero solo entre cuentas de orden -- nunca afecta el balance ni el resultado del ejercicio, y las pantallas de estados financieros ya lo excluyen.
          </p>
        </div>

        {message && <p style={{ marginTop: 16, fontSize: 16, color: message.includes("Error") || message.includes("No se pudo") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>
    </VerticalPageLayout>
  );
}
