"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";

export default function DefaultAccountsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenseId, setExpenseId] = useState("");
  const [vatCreditId, setVatCreditId] = useState("");
  const [vatWithholdingId, setVatWithholdingId] = useState("");
  const [islrWithholdingId, setIslrWithholdingId] = useState("");
  const [apId, setApId] = useState("");
  const [bankId, setBankId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid);
        setAccounts(acc ?? []);
        const { data: comp } = await supabase.from("companies").select("default_expense_account_id, default_vat_credit_account_id, default_vat_withholding_account_id, default_islr_withholding_account_id, default_ap_account_id, default_bank_account_id").eq("id", cid).single();
        setExpenseId(comp?.default_expense_account_id ?? "");
        setVatCreditId(comp?.default_vat_credit_account_id ?? "");
        setVatWithholdingId(comp?.default_vat_withholding_account_id ?? "");
        setIslrWithholdingId(comp?.default_islr_withholding_account_id ?? "");
        setApId(comp?.default_ap_account_id ?? "");
        setBankId(comp?.default_bank_account_id ?? "");
      }
    }
    load();
  }, []);

  async function save() {
    if (!companyId) return;
    const { error } = await supabase.from("companies").update({
      default_expense_account_id: expenseId || null,
      default_vat_credit_account_id: vatCreditId || null,
      default_vat_withholding_account_id: vatWithholdingId || null,
      default_islr_withholding_account_id: islrWithholdingId || null,
      default_ap_account_id: apId || null,
      default_bank_account_id: bankId || null,
    }).eq("id", companyId);
    setMessage(error ? "Error: " + error.message : "Configuracion guardada correctamente.");
  }

  const row = (label: string, value: string, setValue: (v: string) => void, filterType: string) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 15, color: theme.accent, fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>
      <AccountSearchSelect accounts={accounts.filter((a) => a.account_type === filterType)} value={value} onChange={setValue} placeholder="Buscar cuenta..." />
    </div>
  );

  return (
    <VerticalPageLayout vertical="accounting" title="Configuracion de Cuentas por Defecto" subtitle="Define una vez las cuentas que se usaran automaticamente en Compras, Ventas y otros modulos - evita tener que elegir cuentas en cada transaccion" fullWidth>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...theme.cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 16 }}>Compras y Gastos</h3>
          {row("Cuenta de Gasto por Defecto", expenseId, setExpenseId, "EXPENSE")}
          {row("Cuenta de IVA Credito Fiscal", vatCreditId, setVatCreditId, "ASSET")}
          {row("Cuenta de Retencion de IVA por Enterar", vatWithholdingId, setVatWithholdingId, "LIABILITY")}
          {row("Cuenta de Retencion de ISLR por Enterar", islrWithholdingId, setIslrWithholdingId, "LIABILITY")}
        </div>
        <div style={{ ...theme.cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 16 }}>Pago</h3>
          {row("Cuenta de Proveedores (pago a credito)", apId, setApId, "LIABILITY")}
          {row("Cuenta de Banco (pago inmediato)", bankId, setBankId, "ASSET")}
        </div>
        <button onClick={save} style={{ ...theme.buttonStyle, fontSize: 18, width: "100%" }}>
          GUARDAR CONFIGURACION
        </button>
        {message && <p style={{ marginTop: 12, fontSize: 16, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>
    </VerticalPageLayout>
  );
}