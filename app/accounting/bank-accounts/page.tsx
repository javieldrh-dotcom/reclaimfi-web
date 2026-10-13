"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const ACCOUNT_TYPES = ["CORRIENTE", "AHORRO", "OTRA"];

export default function BankAccountsPage() {
  const theme = getVerticalTheme("accounting");
  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // formulario de nueva cuenta bancaria
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("CORRIENTE");
  const [currency, setCurrency] = useState("VES");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  // panel de movimientos de la cuenta seleccionada
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [reconciling, setReconciling] = useState(false);

  async function loadBankAccounts(cid: string) {
    const { data } = await supabase.from("bank_accounts").select("*, chart_of_accounts(account_code, account_name)").eq("company_id", cid).order("created_at", { ascending: false });
    setBankAccounts(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).eq("account_type", "ASSET");
        setGlAccounts(acc ?? []);
        await loadBankAccounts(cid);
      }
    }
    load();
  }, []);

  async function createBankAccount() {
    setMessage("");
    if (!companyId || !bankName || !accountNumber) {
      setMessage("Completa al menos el banco y el numero de cuenta.");
      return;
    }
    const { error } = await supabase.from("bank_accounts").insert([{
      company_id: companyId,
      bank_name: bankName,
      account_number: accountNumber,
      account_type: accountType,
      currency,
      linked_account_id: linkedAccountId || null,
      opening_balance: openingBalance ? parseFloat(openingBalance) : 0,
    }]);
    if (error) { setMessage("Error al crear la cuenta: " + error.message); return; }
    setMessage("Cuenta bancaria creada.");
    setBankName(""); setAccountNumber(""); setLinkedAccountId(""); setOpeningBalance("");
    await loadBankAccounts(companyId);
  }

  async function toggleActive(accountId: string, isActive: boolean) {
    if (!companyId) return;
    await supabase.from("bank_accounts").update({ is_active: !isActive }).eq("id", accountId);
    await loadBankAccounts(companyId);
  }

  async function openAccount(acc: any) {
    setSelectedAccount(acc);
    setDisplayLimit(50);
    setImportText(""); setImportMessage("");
    const { data } = await supabase.from("bank_transactions").select("*").eq("bank_account_id", acc.id).order("transaction_date", { ascending: false });
    setTransactions(data ?? []);
  }

  async function refreshTransactions() {
    if (!selectedAccount) return;
    const { data } = await supabase.from("bank_transactions").select("*").eq("bank_account_id", selectedAccount.id).order("transaction_date", { ascending: false });
    setTransactions(data ?? []);
  }

  // Formato esperado, una linea por movimiento: AAAA-MM-DD, descripcion, monto[, referencia]
  // El monto se interpreta con el signo dado: positivo = deposito/abono,
  // negativo = cargo/retiro. La referencia (si existe) es la clave de
  // deduplicacion (external_id) -- pegar el mismo extracto dos veces no
  // duplica movimientos gracias al indice unico de la migracion.
  async function importTransactions() {
    if (!companyId || !selectedAccount) return;
    setImportMessage("");
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) { setImportMessage("Pega al menos un movimiento."); return; }

    const rows: any[] = [];
    const errors: string[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(",").map((p) => p.trim());
      const [date, description, amountStr, reference] = parts;
      const amount = parseFloat(amountStr);
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(amount)) {
        errors.push("Linea " + (idx + 1) + ": formato invalido (" + line + ")");
        return;
      }
      rows.push({
        company_id: companyId,
        bank_account_id: selectedAccount.id,
        transaction_date: date,
        description: description || null,
        amount,
        reference: reference || null,
        external_id: reference || null,
      });
    });

    if (rows.length > 0) {
      const { error } = await supabase.from("bank_transactions").insert(rows);
      if (error) {
        // El indice unico (bank_account_id, external_id) rechaza duplicados
        // con referencia repetida -- no es un fallo real, es la proteccion
        // funcionando. Se informa sin alarmar.
        if (error.message.includes("duplicate key")) {
          setImportMessage("Algunos movimientos ya existian (misma referencia) y no se duplicaron. " + (errors.length ? errors.length + " linea(s) con formato invalido." : ""));
        } else {
          setImportMessage("Error al importar: " + error.message);
        }
      } else {
        setImportMessage(rows.length + " movimiento(s) importado(s)." + (errors.length ? " " + errors.length + " linea(s) con formato invalido, omitidas." : ""));
        setImportText("");
      }
    } else {
      setImportMessage("Ningun movimiento con formato valido. " + errors.join(" | "));
    }
    await refreshTransactions();
  }

  // Conciliacion automatica: para cada movimiento UNMATCHED del extracto,
  // busca una linea de journal_lines sobre la cuenta contable enlazada
  // (linked_account_id) con el mismo monto (considerando signo: debito para
  // depositos, credito para cargos) y la misma fecha, que no este ya
  // reconciliada por otro movimiento. Si hay exactamente una candidata, se
  // marca MATCHED. Ambiguo (0 o 2+) se deja UNMATCHED para conciliacion manual.
  async function autoReconcile() {
    if (!companyId || !selectedAccount?.linked_account_id) {
      setImportMessage("Esta cuenta bancaria no tiene una cuenta contable enlazada; no se puede conciliar automaticamente.");
      return;
    }
    setReconciling(true);
    const { data: unmatched } = await supabase.from("bank_transactions").select("*").eq("bank_account_id", selectedAccount.id).eq("status", "UNMATCHED");
    const { data: usedLines } = await supabase.from("bank_transactions").select("matched_journal_line_id").eq("bank_account_id", selectedAccount.id).not("matched_journal_line_id", "is", null);
    const usedIds = new Set((usedLines ?? []).map((u: any) => u.matched_journal_line_id));

    let matchedCount = 0;
    for (const tx of unmatched ?? []) {
      const isDeposit = tx.amount >= 0;
      const { data: candidates } = await supabase
        .from("journal_lines")
        .select("id, debit, credit, journal_entries!inner(entry_date, status)")
        .eq("account_id", selectedAccount.linked_account_id)
        .eq("journal_entries.entry_date", tx.transaction_date)
        .eq("journal_entries.status", "ACTIVE")
        .eq(isDeposit ? "debit" : "credit", Math.abs(tx.amount));

      const free = (candidates ?? []).filter((c: any) => !usedIds.has(c.id));
      if (free.length === 1) {
        await supabase.from("bank_transactions").update({ matched_journal_line_id: free[0].id, status: "MATCHED" }).eq("id", tx.id);
        usedIds.add(free[0].id);
        matchedCount++;
      }
    }
    setImportMessage(matchedCount + " de " + (unmatched?.length ?? 0) + " movimiento(s) sin conciliar fueron conciliados automaticamente (monto y fecha exactos, sin ambiguedad). El resto requiere revision manual.");
    setReconciling(false);
    await refreshTransactions();
  }

  async function markIgnored(txId: string) {
    await supabase.from("bank_transactions").update({ status: "IGNORED" }).eq("id", txId);
    await refreshTransactions();
  }

  async function unmatch(txId: string) {
    await supabase.from("bank_transactions").update({ status: "UNMATCHED", matched_journal_line_id: null }).eq("id", txId);
    await refreshTransactions();
  }

  const statusColor: Record<string, string> = { MATCHED: "#4ade80", UNMATCHED: "#facc15", IGNORED: "#8B93A7" };
  const statusLabel: Record<string, string> = { MATCHED: "Conciliado", UNMATCHED: "Sin conciliar", IGNORED: "Ignorado" };

  return (
    <VerticalPageLayout vertical="accounting" title="Cuentas Bancarias" subtitle="Registro de cuentas, carga de extractos y conciliacion contra el Libro Diario" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <input value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputStyle} placeholder="Nombre del banco" />
        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Numero de cuenta" />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={inputStyle}>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle} placeholder="Moneda (VES, USD...)" />
        </div>
        <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
          <option value="">Cuenta contable enlazada (opcional, requerida para conciliar)</option>
          {glAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
        </select>
        <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Saldo inicial" />
        <button onClick={createBankAccount} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          CREAR CUENTA BANCARIA
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {bankAccounts.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Cuentas Registradas</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                <th style={{ padding: 10 }}>Banco</th>
                <th style={{ padding: 10 }}>Cuenta</th>
                <th style={{ padding: 10 }}>Tipo</th>
                <th style={{ padding: 10 }}>Moneda</th>
                <th style={{ padding: 10 }}>Cuenta Contable</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.bank_name}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.account_number}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.account_type}</td>
                  <td style={{ padding: 10, fontSize: 20 }}>{b.currency}</td>
                  <td style={{ padding: 10, fontSize: 16 }}>{b.chart_of_accounts ? b.chart_of_accounts.account_code + " - " + b.chart_of_accounts.account_name : "— sin enlazar —"}</td>
                  <td style={{ padding: 10, fontSize: 18, color: b.is_active ? "#4ade80" : "#8B93A7" }}>{b.is_active ? "Activa" : "Inactiva"}</td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => openAccount(b)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "6px 14px", borderRadius: 8, fontSize: 15, marginRight: 6 }}>
                      Ver Movimientos
                    </button>
                    <button onClick={() => toggleActive(b.id, b.is_active)} style={{ background: "none", border: "1px solid #8B93A7", color: "#8B93A7", padding: "6px 14px", borderRadius: 8, fontSize: 15 }}>
                      {b.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAccount && (
        <div style={{ marginTop: 48, borderTop: "1px solid #1F2937", paddingTop: 32 }}>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>
            Movimientos — {selectedAccount.bank_name} ({selectedAccount.account_number})
          </h2>

          <div style={{ maxWidth: 700, marginTop: 20 }}>
            <label style={{ fontSize: 16, color: "#8B93A7" }}>
              Pega el extracto: una linea por movimiento — AAAA-MM-DD, descripcion, monto, referencia (opcional). Monto negativo = cargo/retiro, positivo = deposito.
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              style={{ ...theme.inputStyle, marginTop: 10, fontSize: 16, fontFamily: "monospace" }}
              placeholder={"2026-10-01, Pago de nomina, -15000.00, REF123\n2026-10-03, Deposito cliente, 8000.00, REF124"}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={importTransactions} style={{ ...theme.buttonStyle, fontSize: 16 }}>
                IMPORTAR MOVIMIENTOS
              </button>
              <button onClick={autoReconcile} disabled={reconciling} style={{ ...theme.buttonStyle, fontSize: 16, background: "none", border: "1px solid " + theme.accent, opacity: reconciling ? 0.6 : 1 }}>
                {reconciling ? "CONCILIANDO..." : "CONCILIAR AUTOMATICAMENTE"}
              </button>
            </div>
            {importMessage && <p style={{ marginTop: 8, fontSize: 16, color: importMessage.includes("Error") ? "#f87171" : theme.accent }}>{importMessage}</p>}
          </div>

          {transactions.length > 0 && (
            <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                  <th style={{ padding: 10 }}>Fecha</th>
                  <th style={{ padding: 10 }}>Descripcion</th>
                  <th style={{ padding: 10 }}>Referencia</th>
                  <th style={{ padding: 10 }}>Monto</th>
                  <th style={{ padding: 10 }}>Estado</th>
                  <th style={{ padding: 10 }}></th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, displayLimit).map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 18 }}>{t.transaction_date}</td>
                    <td style={{ padding: 10, fontSize: 18 }}>{t.description ?? "—"}</td>
                    <td style={{ padding: 10, fontSize: 16, color: "#8B93A7" }}>{t.reference ?? "—"}</td>
                    <td style={{ padding: 10, fontSize: 18, ...theme.numberStyle, color: t.amount < 0 ? "#f87171" : "#4ade80" }}>{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: 10, fontSize: 16, color: statusColor[t.status] ?? "white", fontWeight: 700 }}>{statusLabel[t.status] ?? t.status}</td>
                    <td style={{ padding: 10 }}>
                      {t.status === "UNMATCHED" && (
                        <button onClick={() => markIgnored(t.id)} style={{ background: "none", border: "1px solid #8B93A7", color: "#8B93A7", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                          Ignorar
                        </button>
                      )}
                      {t.status !== "UNMATCHED" && (
                        <button onClick={() => unmatch(t.id)} style={{ background: "none", border: "1px solid #FB923C", color: "#FB923C", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>
                          Revertir a sin conciliar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {transactions.length > displayLimit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => setDisplayLimit(displayLimit + 50)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "10px 24px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
                Cargar 50 mas (mostrando {displayLimit} de {transactions.length})
              </button>
            </div>
          )}
        </div>
      )}
    </VerticalPageLayout>
  );
}
