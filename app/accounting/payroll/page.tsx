"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function PayrollPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [empName, setEmpName] = useState("");
  const [empPosition, setEmpPosition] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [message, setMessage] = useState("");

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [salaryExpenseAccount, setSalaryExpenseAccount] = useState("");
  const [cashAccount, setCashAccount] = useState("");
  const [processing, setProcessing] = useState(false);

  async function loadEmployees(cid: string) {
    const { data } = await supabase.from("employees").select("*").eq("company_id", cid).eq("status", "ACTIVE").order("full_name");
    setEmployees(data ?? []);
  }

  async function loadRuns(cid: string) {
    const { data } = await supabase.from("payroll_runs").select("*").eq("company_id", cid).order("period_end", { ascending: false });
    setRuns(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "EXPENSE"]);
        setAccounts(acc ?? []);
        await loadEmployees(cid);
        await loadRuns(cid);
      }
    }
    load();
  }, []);

  async function createEmployee() {
    setMessage("");
    if (!companyId || !empName || !empSalary) { setMessage("Completa nombre y salario."); return; }

    const { error } = await supabase.from("employees").insert([{
      company_id: companyId,
      full_name: empName,
      position: empPosition,
      daily_salary: parseFloat(empSalary),
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Empleado registrado correctamente.");
    setEmpName(""); setEmpPosition(""); setEmpSalary("");
    if (companyId) await loadEmployees(companyId);
  }
  async function processPayroll() {
    setMessage("");
    if (!companyId || !periodStart || !periodEnd || !salaryExpenseAccount || !cashAccount) {
      setMessage("Completa las fechas y selecciona ambas cuentas contables.");
      return;
    }
    if (employees.length === 0) { setMessage("No hay empleados activos registrados."); return; }

    setProcessing(true);

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const daysInPeriod = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const details = employees.map((emp) => {
      const gross = emp.daily_salary * daysInPeriod;
      const socialSecurity = gross * 0.04;
      const net = gross - socialSecurity;
      return { employee_id: emp.id, days_worked: daysInPeriod, gross_amount: gross, social_security: socialSecurity, other_deductions: 0, net_amount: net };
    });

    const totalGross = details.reduce((s, d) => s + d.gross_amount, 0);
    const totalDeductions = details.reduce((s, d) => s + d.social_security, 0);
    const totalNet = details.reduce((s, d) => s + d.net_amount, 0);

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Nomina " + periodStart + " a " + periodEnd,
      entry_date: periodEnd,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); setProcessing(false); return; }

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: salaryExpenseAccount, debit: totalGross, credit: 0 },
      { journal_entry_id: entry.id, account_id: cashAccount, debit: 0, credit: totalNet },
    ]);

    const { data: run, error: runError } = await supabase.from("payroll_runs").insert([{
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      journal_entry_id: entry.id,
      status: "PAID",
    }]).select("id").single();

    if (runError || !run) { setMessage("Error al guardar nomina: " + runError?.message); setProcessing(false); return; }

    await supabase.from("payroll_details").insert(details.map((d) => ({ ...d, payroll_run_id: run.id })));

    setMessage("Nomina procesada. Total Neto: " + totalNet.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ". Asiento contable generado automaticamente.");
    setProcessing(false);
    await loadRuns(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Nomina" subtitle="Registro de empleados y procesamiento de pago con asiento contable automatico" fullWidth>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={theme.cardStyle}>
          <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Registrar Empleado</h3>
          <input value={empName} onChange={(e) => setEmpName(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
          <input value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Cargo" />
          <input type="number" value={empSalary} onChange={(e) => setEmpSalary(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Salario Diario" />
          <button onClick={createEmployee} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16, width: "100%" }}>
            REGISTRAR EMPLEADO
          </button>
          {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("No hay") ? "#f87171" : theme.accent }}>{message}</p>}

          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Empleados Activos ({employees.length})</h3>
          {employees.map((e) => (
            <div key={e.id} style={{ padding: 10, borderBottom: "1px solid #1F2937", fontSize: 16 }}>
              {e.full_name} - {e.position} - {e.daily_salary.toLocaleString()}/dia
            </div>
          ))}
        </div>

        <div style={theme.cardStyle}>
          <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Procesar Nomina</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
          </div>
          <select value={salaryExpenseAccount} onChange={(e) => setSalaryExpenseAccount(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">Cuenta de Gasto de Sueldos</option>
            {accounts.filter(a => a.account_type === "EXPENSE").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <select value={cashAccount} onChange={(e) => setCashAccount(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">Cuenta de Banco/Caja</option>
            {accounts.filter(a => a.account_type === "ASSET").map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <button onClick={processPayroll} disabled={processing} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16, width: "100%", background: "#f87171" }}>
            {processing ? "PROCESANDO..." : "PROCESAR NOMINA"}
          </button>

          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Nominas Procesadas</h3>
          {runs.map((r) => (
            <div key={r.id} style={{ padding: 10, borderBottom: "1px solid #1F2937", fontSize: 16 }}>
              {r.period_start} a {r.period_end} - Neto: <span style={theme.numberStyle}>{r.total_net?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </VerticalPageLayout>
  );
}
