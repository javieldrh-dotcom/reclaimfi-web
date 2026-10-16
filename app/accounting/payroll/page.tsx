"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";
import { applyThirdPartyCharges, fetchPayrollChargesConfig, filterEmployerChargesByHeadcount, VE_DEFAULT_PAYROLL_CHARGES, type PayrollChargesConfig } from "@/app/lib/jurisdictionTax";
// Nota: PAYROLL_CHARGES_REFERENCE_EXAMPLES (otras jurisdicciones) no se
// importa aqui -- vive en jurisdictionTax.ts como plantillas de
// referencia que se cargan manualmente desde Admin -> Jurisdiction
// Modules, nunca de forma automatica.
import { generatePayslipPdf } from "@/app/core/reports/generatePayslipPdf";

// Diferenciador "APU <-> Contabilidad en tiempo real", parte nomina: las
// tasas IVSS/INCES/FAOV ya no estan fijas en el codigo -- se leen de
// jurisdiction_modules (module_key PAYROLL_CHARGES) segun el
// jurisdiction_code de la empresa, con las mismas tasas VE de siempre como
// respaldo (ver VE_DEFAULT_PAYROLL_CHARGES). Ademas, cada empleado puede
// enlazarse opcionalmente a un proyecto APU (employees.apu_project_id) para
// comparar el costo real de nomina contra el costo licitado del proyecto.
export default function PayrollPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyRif, setCompanyRif] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  // Recibos de pago: detalle por empleado de cada corrida, cargado solo
  // cuando el usuario expande esa corrida (no de entrada, para no traer
  // payroll_details de todas las corridas historicas sin necesidad).
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<Record<string, any[]>>({});
  const [loadingDetailsFor, setLoadingDetailsFor] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [apuProjects, setApuProjects] = useState<any[]>([]);
  const [payrollChargesConfig, setPayrollChargesConfig] = useState<PayrollChargesConfig | null>(null);
  const [empName, setEmpName] = useState("");
  const [empCedula, setEmpCedula] = useState("");
  // Identificadores adicionales del empleado mas alla de la cedula
  // principal (ej. RFC/NSS en Mexico) -- keyed por "code" tal como lo
  // declara activeCharges.labels.extra_employee_ids. Se guardan en
  // employees.extra_ids (jsonb). Si la jurisdiccion activa no declara
  // ninguno (caso VE y la mayoria), este objeto queda vacio y no se
  // muestra ningun campo extra en el formulario.
  const [empExtraIds, setEmpExtraIds] = useState<Record<string, string>>({});
  const [empPosition, setEmpPosition] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [empApuProjectId, setEmpApuProjectId] = useState("");
  const [message, setMessage] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [payrollCurrency, setPayrollCurrency] = useState("USD");
  const [payrollExchangeRate, setPayrollExchangeRate] = useState("1");
  const [periodEnd, setPeriodEnd] = useState("");
  const [salaryExpenseAccount, setSalaryExpenseAccount] = useState("");
  const [cashAccount, setCashAccount] = useState("");
  const [employeeWithholdingAccount, setEmployeeWithholdingAccount] = useState("");
  // Obligaciones patronales: antes era una sola cuenta de gasto y una
  // sola cuenta de pasivo para TODA la carga patronal sumada (IVSS +
  // INCES + FAOV + Paro Forzoso, etc). Javiel lleva esas cargas en
  // cuentas separadas en su plan de cuentas (como hace la mayoria de
  // empresas VE reales), asi que ahora hay un par gasto/pasivo POR CADA
  // clave de employer_pct de jurisdiction_modules (ver
  // app/lib/jurisdictionTax.ts) en vez de uno consolidado. Las
  // retenciones al EMPLEADO (employeeWithholdingAccount, arriba) se
  // dejan como una sola cuenta a proposito -- Javiel confirmo que esas
  // si las lleva consolidadas.
  const [patronalExpenseAccounts, setPatronalExpenseAccounts] = useState<Record<string, string>>({});
  const [patronalPayableAccounts, setPatronalPayableAccounts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Ajustes opcionales por empleado para esta corrida especifica (horas
  // extra, dias feriados/descanso trabajados, dias de falta, ISLR). Antes
  // la nomina solo calculaba dias_trabajados x salario_diario para todos
  // los empleados por igual -- Javiel pidio que el recibo pueda reflejar
  // estos conceptos como es uso cotidiano en Venezuela. Se guardan por
  // employee_id, vacios por defecto (0), y se reinician despues de cada
  // corrida procesada.
  type EmployeeAdjustment = { hed: string; hen: string; fd: string; falta: string; islr: string };
  const [employeeAdjustments, setEmployeeAdjustments] = useState<Record<string, EmployeeAdjustment>>({});
  const EMPTY_ADJ: EmployeeAdjustment = { hed: "", hen: "", fd: "", falta: "", islr: "" };
  function getAdj(empId: string): EmployeeAdjustment {
    return employeeAdjustments[empId] || EMPTY_ADJ;
  }
  function setAdjField(empId: string, field: keyof EmployeeAdjustment, value: string) {
    setEmployeeAdjustments((prev) => ({ ...prev, [empId]: { ...getAdj(empId), [field]: value } }));
  }

  const activeCharges = payrollChargesConfig ?? VE_DEFAULT_PAYROLL_CHARGES;
  const employerChargeKeys = Object.keys(activeCharges.employer_pct || {});
  function chargeLabel(key: string) {
    return key.replace(/_/g, " ").toUpperCase();
  }

  // Filtra la lista de cuentas que ofrece cada selector a las que
  // probablemente correspondan, en vez de mostrar TODO el plan de
  // cuentas de ese tipo (gasto o pasivo) -- Javiel reporto que el
  // selector de obligaciones patronales mostraba cuentas que no tenian
  // nada que ver (alquiler, inventario, etc.). Si el filtro no encuentra
  // ninguna coincidencia (porque la cuenta se llama distinto a lo
  // esperado), se muestra la lista completa de respaldo -- nunca deja a
  // Javiel sin poder elegir una cuenta que si existe.
  function filterAccountsByKeywords(list: any[], keywords: string[]) {
    const matches = list.filter((a) =>
      keywords.some((k) => (a.account_name || "").toLowerCase().includes(k))
    );
    return matches.length > 0 ? matches : list;
  }
  const expenseAccounts = accounts.filter((a) => a.account_type === "EXPENSE");
  const liabilityAccounts = accounts.filter((a) => a.account_type === "LIABILITY");
  const assetAccounts = accounts.filter((a) => a.account_type === "ASSET");
  const salaryExpenseOptions = filterAccountsByKeywords(expenseAccounts, ["sueldo", "salario", "nomina"]);
  const cashOptions = filterAccountsByKeywords(assetAccounts, ["banco", "caja", "efectivo"]);
  const employeeWithholdingOptions = filterAccountsByKeywords(liabilityAccounts, ["retenc", "nomina", "empleado"]);
  // Para cada carga patronal, las palabras clave son las mismas palabras
  // de su module_key (ej. "ivss_patronal" -> ["ivss","patronal"]) -- no
  // se hardcodea un diccionario de sinonimos en espanol para no romper
  // si otra jurisdiccion usa otras claves.
  function patronalOptions(list: any[], key: string) {
    return filterAccountsByKeywords(list, key.split("_"));
  }

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
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        const { data: projects } = await supabase.from("apu_projects").select("id, project_description").eq("company_id", cid).order("created_at", { ascending: false });
        setApuProjects(projects ?? []);
        const { data: company } = await supabase.from("companies").select("name, tax_id, jurisdiction_code").eq("id", cid).maybeSingle();
        setCompanyName(company?.name ?? "");
        setCompanyRif(company?.tax_id ?? "");
        const jCode = company?.jurisdiction_code || "VE";
        const config = await fetchPayrollChargesConfig(supabase, jCode);
        setPayrollChargesConfig(config);
        await loadEmployees(cid);
        await loadRuns(cid);
      }
    }
    load();
  }, []);

  async function createNewAccount(type: string, target: string) {
    const name = window.prompt("Nombre de la nueva cuenta:");
    if (!name || !companyId) return;
    const prefix = type === "ASSET" ? "1199" : type === "LIABILITY" ? "2199" : "5199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (target === "salary") setSalaryExpenseAccount(newAcc.id);
    if (target === "cash") setCashAccount(newAcc.id);
    if (target === "empwith") setEmployeeWithholdingAccount(newAcc.id);
    // "patronalexp:<key>" / "patronalpay:<key>" -- un par gasto/pasivo
    // por cada carga patronal (ivss_patronal, inces, faov, etc.).
    if (target.startsWith("patronalexp:")) {
      const key = target.slice("patronalexp:".length);
      setPatronalExpenseAccounts((prev) => ({ ...prev, [key]: newAcc.id }));
    }
    if (target.startsWith("patronalpay:")) {
      const key = target.slice("patronalpay:".length);
      setPatronalPayableAccounts((prev) => ({ ...prev, [key]: newAcc.id }));
    }
  }

  async function createEmployee() {
    setMessage("");
    if (!companyId || !empName || !empSalary) { setMessage("Completa nombre y salario."); return; }
    const extraIdsEntries = Object.entries(empExtraIds).filter(([, v]) => v.trim() !== "");
    const { error } = await supabase.from("employees").insert([{
      company_id: companyId,
      full_name: empName,
      cedula: empCedula || null,
      position: empPosition,
      daily_salary: parseFloat(empSalary),
      apu_project_id: empApuProjectId || null,
      extra_ids: extraIdsEntries.length > 0 ? Object.fromEntries(extraIdsEntries) : null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Empleado registrado correctamente.");
    setEmpName(""); setEmpCedula(""); setEmpPosition(""); setEmpSalary(""); setEmpApuProjectId(""); setEmpExtraIds({});
    if (companyId) await loadEmployees(companyId);
  }

  async function fetchBcvRate() {
    setMessage("Consultando tasa BCV...");
    try {
      const res = await fetch("/api/bcv-rate");
      const json = await res.json();
      if (!json.success) { setMessage("No se pudo consultar la tasa BCV: " + json.error); return; }
      setPayrollCurrency("VES");
      setPayrollExchangeRate(String(json.rate));
      setMessage("Tasa BCV de hoy aplicada: " + json.rate + " (" + json.source + ")");
    } catch (err: any) {
      setMessage("Error al consultar la tasa: " + err.message);
    }
  }

  async function toggleRunDetails(runId: string) {
    if (expandedRunId === runId) { setExpandedRunId(null); return; }
    setExpandedRunId(runId);
    if (runDetails[runId]) return;
    setLoadingDetailsFor(runId);
    const { data } = await supabase
      .from("payroll_details")
      .select("*, employees(full_name, cedula, position, hire_date, daily_salary, extra_ids)")
      .eq("payroll_run_id", runId);
    setRunDetails((prev) => ({ ...prev, [runId]: data ?? [] }));
    setLoadingDetailsFor(null);
  }

  function downloadPayslip(run: any, detail: any) {
    // Las etiquetas (nombre del documento de identidad, nombre del
    // impuesto a la renta, codigos de cada concepto) se toman de la
    // configuracion ACTUAL de la jurisdiccion, no de una copia guardada
    // por corrida -- a diferencia de las tasas/montos, son solo texto
    // de presentacion, asi que usar la version vigente es razonable
    // (no cambia ningun monto ya pagado). Si la fila guardada no trae
    // "labels" (config de antes de que existiera este campo), cae de
    // vuelta a las etiquetas VE, igual que el resto de la pantalla.
    const veLabels = VE_DEFAULT_PAYROLL_CHARGES.labels!;
    const labels = activeCharges.labels ?? {};
    const concepts = labels.concepts ?? {};
    const veConcepts = veLabels.concepts!;
    // extra_employee_ids declara QUE identificadores existen (ej. RFC,
    // NSS); extra_ids (jsonb en employees) trae los VALORES guardados
    // para este empleado en particular. Si el empleado no tiene valor
    // guardado para alguno (lo registraron antes de que existiera ese
    // campo, o lo dejaron en blanco), el renglon igual aparece con "-"
    // en vez de desaparecer, para que se note que falta completarlo.
    const extraIdDefs = labels.extra_employee_ids ?? [];
    const employeeExtraIds: Record<string, string> = detail.employees?.extra_ids ?? {};
    const extraEmployeeIds = extraIdDefs.map((def) => ({
      label: def.label,
      value: employeeExtraIds[def.code] ?? "",
    }));
    const doc = generatePayslipPdf({
      companyName,
      companyRif,
      companyTaxIdLabel: labels.tax_id_label ?? veLabels.tax_id_label,
      employeeName: detail.employees?.full_name ?? "Empleado",
      idDocumentLabel: labels.id_document ?? veLabels.id_document,
      employeeCedula: detail.employees?.cedula ?? "",
      extraEmployeeIds,
      employeePosition: detail.employees?.position ?? "",
      employeeHireDate: detail.employees?.hire_date ?? "",
      dailySalary: detail.employees?.daily_salary ?? undefined,
      periodStart: run.period_start,
      periodEnd: run.period_end,
      daysWorked: detail.days_worked,
      // Para el renglon "001 Salario Basico", se usa SOLO el salario base
      // (dias x salario diario), no el bruto total con horas extra ya
      // sumadas -- esas se muestran en sus propios renglones. En corridas
      // anteriores a extra_concepts, no hay forma de separar uno de otro,
      // asi que cae de vuelta al bruto completo tal cual se guardo.
      grossAmount: detail.extra_concepts?.base_salary_amount ?? detail.gross_amount,
      socialSecurity: detail.social_security || 0,
      // Solo existe en corridas procesadas despues de este cambio --
      // payroll_details lo persiste tal cual se calculo al momento de
      // pagar. Recibos de corridas anteriores no lo tienen (columna
      // null) y el PDF cae de vuelta al monto agregado unico.
      employeeDeductionsBreakdown: detail.employee_deductions_breakdown || undefined,
      deductionCodeMap: labels.deduction_codes,
      extraConcepts: detail.extra_concepts || undefined,
      conceptLabels: {
        baseSalary: concepts.base_salary ?? veConcepts.base_salary,
        overtimeDay: concepts.overtime_day ?? veConcepts.overtime_day,
        overtimeNight: concepts.overtime_night ?? veConcepts.overtime_night,
        holidayWorked: concepts.holiday_worked ?? veConcepts.holiday_worked,
        absence: concepts.absence ?? veConcepts.absence,
        incomeTax: concepts.income_tax ?? veConcepts.income_tax,
      },
      islrAmount: detail.islr_amount || 0,
      otherDeductions: detail.other_deductions || 0,
      netAmount: detail.net_amount,
      patronalAmount: detail.patronal_amount || 0,
      // Moneda real con la que se proceso ESA corrida especifica (no la
      // seleccionada ahora mismo en la pantalla, que pudo cambiar desde
      // entonces). Corridas procesadas antes de que payroll_runs
      // guardara esto caen de vuelta a USD, que era el comportamiento
      // anterior.
      currency: run.currency || "USD",
    });
    const fileName = "Recibo_" + (detail.employees?.full_name ?? "empleado").replace(/\s+/g, "_") + "_" + run.period_end + ".pdf";
    doc.save(fileName);
  }

  async function processPayroll() {
    setMessage("");
    if (!companyId || !periodStart || !periodEnd || !salaryExpenseAccount || !cashAccount || !employeeWithholdingAccount) {
      setMessage("Completa las fechas y selecciona las cuentas contables.");
      return;
    }
    if (employees.length === 0) { setMessage("No hay empleados activos registrados."); return; }
    setProcessing(true);

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const daysInPeriod = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Cargas de nomina por jurisdiccion (ver jurisdictionTax.ts). Si la
    // empresa no tiene fila PAYROLL_CHARGES cargada para su
    // jurisdiction_code, se usan las mismas tasas VE de siempre -- ninguna
    // empresa VE existente ve un resultado distinto al de antes.
    const charges = payrollChargesConfig ?? VE_DEFAULT_PAYROLL_CHARGES;
    // Cargos patronales condicionados a cantidad de empleados (ej. INCES
    // en VE solo con 5+ activos, Ley INCES art. 49) -- se evalua una
    // sola vez por corrida, contra la cantidad de empleados activos de
    // la empresa, no por empleado individual.
    const employerPctApplicable = filterEmployerChargesByHeadcount(charges, employees.length);
    const applicableKeys = Object.keys(employerPctApplicable);
    const missingAccounts = applicableKeys.filter((k) => !patronalExpenseAccounts[k] || !patronalPayableAccounts[k]);
    if (missingAccounts.length > 0) {
      setMessage("Falta seleccionar la cuenta de gasto y/o por pagar de: " + missingAccounts.map(chargeLabel).join(", ") + ".");
      setProcessing(false);
      return;
    }

    // patronalByKey acumula cada carga patronal (ivss_patronal, inces,
    // faov, etc.) por separado entre todos los empleados, para poder
    // generar una linea de asiento por cada una -- a diferencia de antes,
    // que sumaba todo en un solo monto "patronal".
    const patronalByKey: Record<string, number> = {};

    const details = employees.map((emp) => {
      const fxRate = parseFloat(payrollExchangeRate) || 1;

      // Ajustes opcionales de esta corrida para este empleado. Los
      // multiplicadores de horas extra y feriado/descanso trabajado se
      // leen de charges.overtime_rules (configurable por jurisdiccion
      // en Admin -> Jurisdiction Modules) -- si la fila guardada es de
      // antes de que este campo existiera, cada multiplicador cae de
      // vuelta AL VALOR VE campo por campo (no el objeto completo), para
      // no perder el comportamiento ya configurado. Los valores VE por
      // defecto (LOTTT): hora extra diurna recargo 50% (Art. 118), hora
      // extra nocturna 50%+30% (x1.95), feriado/descanso trabajado paga
      // doble (Art. 119). ISLR: monto de retencion se ingresa
      // manualmente (la tabla de ISLR por tramos/desgravamenes no se
      // calcula automaticamente).
      const overtimeRules = charges.overtime_rules ?? {};
      const veOvertime = VE_DEFAULT_PAYROLL_CHARGES.overtime_rules!;
      const extraDiurnaMultiplier = overtimeRules.extra_diurna_multiplier ?? veOvertime.extra_diurna_multiplier!;
      const extraNocturnaMultiplier = overtimeRules.extra_nocturna_multiplier ?? veOvertime.extra_nocturna_multiplier!;
      const feriadoDescansoMultiplier = overtimeRules.feriado_descanso_multiplier ?? veOvertime.feriado_descanso_multiplier!;

      const a = getAdj(emp.id);
      const horasExtraDiurnas = parseFloat(a.hed) || 0;
      const horasExtraNocturnas = parseFloat(a.hen) || 0;
      const diasFeriadosDescanso = parseFloat(a.fd) || 0;
      const diasFalta = parseFloat(a.falta) || 0;
      const islrAmount = parseFloat(a.islr) || 0;

      const baseSalaryAmount = emp.daily_salary * daysInPeriod * fxRate;
      const horaNormal = (emp.daily_salary * fxRate) / 8;
      const extraDiurnaMonto = horasExtraDiurnas * horaNormal * extraDiurnaMultiplier;
      const extraNocturnaMonto = horasExtraNocturnas * horaNormal * extraNocturnaMultiplier;
      const feriadoDescansoMonto = diasFeriadosDescanso * emp.daily_salary * fxRate * feriadoDescansoMultiplier;
      const faltasMonto = diasFalta * emp.daily_salary * fxRate;

      const gross = baseSalaryAmount + extraDiurnaMonto + extraNocturnaMonto + feriadoDescansoMonto - faltasMonto;

      // employeeCharges guarda el desglose por clave (ivss_empleado,
      // lph_empleado, paro_forzoso_empleado...) tal como se calculo en
      // este momento con las tasas vigentes de employee_pct -- se
      // persiste en payroll_details para que el recibo de pago pueda
      // mostrar cada retencion por separado (uso cotidiano en Venezuela)
      // sin tener que recalcular despues con tasas que pudieron cambiar.
      const { charges: employeeCharges, subTotalTerceros: socialSecurity } = applyThirdPartyCharges(gross, charges.employee_pct);
      const net = gross - socialSecurity - islrAmount;
      const { charges: patronalCharges, subTotalTerceros: patronal } = applyThirdPartyCharges(gross, employerPctApplicable);
      for (const [key, amount] of Object.entries(patronalCharges)) {
        patronalByKey[key] = (patronalByKey[key] || 0) + amount;
      }
      return {
        employee_id: emp.id,
        apu_project_id: emp.apu_project_id ?? null,
        days_worked: daysInPeriod,
        gross_amount: gross,
        social_security: socialSecurity,
        employee_deductions_breakdown: employeeCharges,
        islr_amount: islrAmount,
        extra_concepts: {
          base_salary_amount: baseSalaryAmount,
          horas_extra_diurnas_horas: horasExtraDiurnas,
          horas_extra_diurnas_monto: extraDiurnaMonto,
          horas_extra_nocturnas_horas: horasExtraNocturnas,
          horas_extra_nocturnas_monto: extraNocturnaMonto,
          feriados_descanso_dias: diasFeriadosDescanso,
          feriados_descanso_monto: feriadoDescansoMonto,
          faltas_dias: diasFalta,
          faltas_monto: faltasMonto,
        },
        other_deductions: 0,
        net_amount: net,
        patronal_amount: patronal,
      };
    });

    const totalGross = details.reduce((s, d) => s + d.gross_amount, 0);
    const totalDeductions = details.reduce((s, d) => s + d.social_security + d.islr_amount, 0);
    const totalNet = details.reduce((s, d) => s + d.net_amount, 0);
    const totalPatronal = details.reduce((s, d) => s + d.patronal_amount, 0);

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).single();
    const nextEntryNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: "Nomina " + periodStart + " a " + periodEnd,
      entry_date: periodEnd,
      entry_number: nextEntryNumber,
    }]).select("id").single();
    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); setProcessing(false); return; }

    // Una linea de gasto y una de pasivo POR CADA carga patronal con
    // monto > 0 (no se postea una clave si quedo en 0, ej. INCES con
    // menos de 5 empleados), en vez de las 2 lineas unicas de antes.
    const patronalLines = Object.entries(patronalByKey)
      .filter(([, amount]) => amount > 0)
      .flatMap(([key, amount]) => [
        { journal_entry_id: entry.id, account_id: patronalExpenseAccounts[key], debit: amount, credit: 0 },
        { journal_entry_id: entry.id, account_id: patronalPayableAccounts[key], debit: 0, credit: amount },
      ]);

    await supabase.from("journal_lines").insert([
      { journal_entry_id: entry.id, account_id: salaryExpenseAccount, debit: totalGross, credit: 0 },
      { journal_entry_id: entry.id, account_id: cashAccount, debit: 0, credit: totalNet },
      { journal_entry_id: entry.id, account_id: employeeWithholdingAccount, debit: 0, credit: totalDeductions },
      ...patronalLines,
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
      // Antes no se guardaba -- el recibo de pago mostraba siempre "USD"
      // sin importar en que moneda se proceso realmente la corrida
      // (Javiel lo detecto: una corrida en VES con tasa BCV mostraba el
      // sufijo "USD" en montos que en realidad eran Bolivares).
      currency: payrollCurrency,
      exchange_rate: parseFloat(payrollExchangeRate) || 1,
    }]).select("id").single();
    if (runError || !run) { setMessage("Error al guardar nomina: " + runError?.message); setProcessing(false); return; }

    await supabase.from("payroll_details").insert(details.map((d) => ({
      employee_id: d.employee_id,
      apu_project_id: d.apu_project_id,
      days_worked: d.days_worked,
      gross_amount: d.gross_amount,
      social_security: d.social_security,
      employee_deductions_breakdown: d.employee_deductions_breakdown,
      islr_amount: d.islr_amount,
      extra_concepts: d.extra_concepts,
      other_deductions: d.other_deductions,
      net_amount: d.net_amount,
      patronal_amount: d.patronal_amount,
      payroll_run_id: run.id,
    })));

    setMessage("Nomina procesada (Nº" + nextEntryNumber + "). Total Neto: " + totalNet.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ". Obligaciones Patronales: " + totalPatronal.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ". Asiento balanceado generado correctamente.");
    setProcessing(false);
    setEmployeeAdjustments({});
    await loadRuns(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  return (
    <VerticalPageLayout vertical="accounting" title="Nomina" subtitle="Registro de empleados y procesamiento de pago con asiento balanceado (incluye retenciones y obligaciones patronales)" fullWidth>
      <div style={{ ...theme.cardStyle, marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Cuentas Contables (requeridas)</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={salaryExpenseOptions} value={salaryExpenseAccount} onChange={setSalaryExpenseAccount} placeholder="Gasto de Sueldos..." />
            <button onClick={() => createNewAccount("EXPENSE", "salary")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={cashOptions} value={cashAccount} onChange={setCashAccount} placeholder="Banco/Caja..." />
            <button onClick={() => createNewAccount("ASSET", "cash")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
            <AccountSearchSelect accounts={employeeWithholdingOptions} value={employeeWithholdingAccount} onChange={setEmployeeWithholdingAccount} placeholder="Retenciones al Empleado por Pagar (consolidada)..." />
            <button onClick={() => createNewAccount("LIABILITY", "empwith")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
        </div>

        <p style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 6 }}>Obligaciones Patronales (una cuenta de gasto y una por pagar para cada carga)</p>
        <p style={{ fontSize: 12, color: "#8B93A7", marginBottom: 10 }}>{activeCharges.name}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {employerChargeKeys.map((key) => (
            <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "8px 10px", background: "#0B0E14", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: theme.accent, fontWeight: 700, minWidth: 140 }}>{chargeLabel(key)}</span>
              <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
                <AccountSearchSelect
                  accounts={patronalOptions(expenseAccounts, key)}
                  value={patronalExpenseAccounts[key] || ""}
                  onChange={(v) => setPatronalExpenseAccounts((prev) => ({ ...prev, [key]: v }))}
                  placeholder={"Gasto " + chargeLabel(key) + "..."}
                />
                <button onClick={() => createNewAccount("EXPENSE", "patronalexp:" + key)} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
              </div>
              <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
                <AccountSearchSelect
                  accounts={patronalOptions(liabilityAccounts, key)}
                  value={patronalPayableAccounts[key] || ""}
                  onChange={(v) => setPatronalPayableAccounts((prev) => ({ ...prev, [key]: v }))}
                  placeholder={chargeLabel(key) + " por Pagar..."}
                />
                <button onClick={() => createNewAccount("LIABILITY", "patronalpay:" + key)} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#8B93A7", marginTop: 10 }}>
          Cada selector solo muestra cuentas cuyo nombre coincide con el rubro. Si no ves la cuenta que buscas, puede que este nombrada distinto en tu plan de cuentas -- en ese caso se muestran todas las cuentas de ese tipo para que la encuentres igual.
        </p>
      </div>

      {employees.length > 0 && (
        <div style={{ ...theme.cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>Ajustes por Empleado (opcional, para esta corrida)</h3>
          <p style={{ fontSize: 12, color: "#8B93A7", marginBottom: 10 }}>
            Deja en blanco lo que no aplique. Horas extra y feriados/descanso trabajados se SUMAN al sueldo basico; faltas e ISLR se RESTAN del neto. Formulas segun LOTTT Venezuela (recargo 50% hora extra diurna, 50%+30% nocturna, dia feriado/descanso trabajado paga doble) -- revisalas con tu criterio profesional si tu convencion colectiva usa otro recargo.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.accent, fontSize: 12, fontWeight: 700 }}>
                  <th style={{ padding: "4px 6px" }}>Empleado</th>
                  <th style={{ padding: "4px 6px", width: 100 }}>Horas Extra Diurnas</th>
                  <th style={{ padding: "4px 6px", width: 100 }}>Horas Extra Nocturnas</th>
                  <th style={{ padding: "4px 6px", width: 110 }}>Dias Feriados/Descanso Trabajados</th>
                  <th style={{ padding: "4px 6px", width: 90 }}>Dias de Falta</th>
                  <th style={{ padding: "4px 6px", width: 100 }}>ISLR (monto)</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const a = getAdj(emp.id);
                  const smallNumInput = { ...theme.inputStyle, fontSize: 13, padding: "4px 8px", width: "100%" };
                  return (
                    <tr key={emp.id} style={{ borderBottom: "1px solid #1F2937" }}>
                      <td style={{ padding: "4px 6px", fontSize: 13 }}>{emp.full_name}</td>
                      <td style={{ padding: "4px 6px" }}><input type="number" min="0" step="0.5" value={a.hed} onChange={(e) => setAdjField(emp.id, "hed", e.target.value)} style={smallNumInput} placeholder="0" /></td>
                      <td style={{ padding: "4px 6px" }}><input type="number" min="0" step="0.5" value={a.hen} onChange={(e) => setAdjField(emp.id, "hen", e.target.value)} style={smallNumInput} placeholder="0" /></td>
                      <td style={{ padding: "4px 6px" }}><input type="number" min="0" step="1" value={a.fd} onChange={(e) => setAdjField(emp.id, "fd", e.target.value)} style={smallNumInput} placeholder="0" /></td>
                      <td style={{ padding: "4px 6px" }}><input type="number" min="0" step="1" value={a.falta} onChange={(e) => setAdjField(emp.id, "falta", e.target.value)} style={smallNumInput} placeholder="0" /></td>
                      <td style={{ padding: "4px 6px" }}><input type="number" min="0" step="0.01" value={a.islr} onChange={(e) => setAdjField(emp.id, "islr", e.target.value)} style={smallNumInput} placeholder="0" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={theme.cardStyle}>
          <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Registrar Empleado</h3>
          <input value={empName} onChange={(e) => setEmpName(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
          <input value={empCedula} onChange={(e) => setEmpCedula(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Cedula (ej. V-12.345.678)" />
          {(activeCharges.labels?.extra_employee_ids ?? []).map((idDef) => (
            <input
              key={idDef.code}
              value={empExtraIds[idDef.code] ?? ""}
              onChange={(e) => setEmpExtraIds((prev) => ({ ...prev, [idDef.code]: e.target.value }))}
              style={{ ...inputStyle, marginTop: 8 }}
              placeholder={idDef.label}
            />
          ))}
          <input value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Cargo" />
          <input type="number" value={empSalary} onChange={(e) => setEmpSalary(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Salario Diario" />
          <select value={empApuProjectId} onChange={(e) => setEmpApuProjectId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">Sin asignar a proyecto APU (administrativo)</option>
            {apuProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_description}</option>
            ))}
          </select>
          <button onClick={createEmployee} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16, width: "100%" }}>
            REGISTRAR EMPLEADO
          </button>
          {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("No hay") || message.includes("Completa") ? "#f87171" : theme.accent }}>{message}</p>}
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Empleados Activos ({employees.length})</h3>
          {employees.map((e) => {
            const proj = apuProjects.find((p) => p.id === e.apu_project_id);
            return (
              <div key={e.id} style={{ padding: 10, borderBottom: "1px solid #1F2937", fontSize: 16 }}>
                {e.full_name} - {e.position} - {e.daily_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/dia
                {proj && <span style={{ color: theme.accent, fontSize: 13 }}> · {proj.project_description}</span>}
              </div>
            );
          })}
        </div>
        <div style={theme.cardStyle}>
          <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Procesar Nomina</h3>
          <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 10 }}>
            {(payrollChargesConfig ?? VE_DEFAULT_PAYROLL_CHARGES).name}
            {employees.length > 0 && employees.length < 5 && (payrollChargesConfig ?? VE_DEFAULT_PAYROLL_CHARGES).employer_pct_min_employees && (
              <span style={{ color: "#facc15" }}> · con {employees.length} empleado(s) activo(s), algunos cargos patronales con minimo de trabajadores (ej. INCES) no se aplican esta corrida.</span>
            )}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <select value={payrollCurrency} onChange={(e) => { setPayrollCurrency(e.target.value); if (e.target.value === "USD") setPayrollExchangeRate("1"); }} style={inputStyle}>
              <option value="USD">USD</option>
              <option value="VES">VES (Bolivares)</option>
            </select>
            <input type="number" step="0.0001" value={payrollExchangeRate} onChange={(e) => setPayrollExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de Cambio" />
              <button onClick={fetchBcvRate} type="button" style={{ padding: "0 14px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Tasa BCV Hoy</button>
          </div>
          <button onClick={processPayroll} disabled={processing} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16, width: "100%", background: "#f87171" }}>
            {processing ? "PROCESANDO..." : "PROCESAR NOMINA"}
          </button>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Nominas Procesadas</h3>
          {runs.map((r) => (
            <div key={r.id} style={{ padding: 10, borderBottom: "1px solid #1F2937", fontSize: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span>
                  {r.period_start} a {r.period_end} - Neto: <span style={theme.numberStyle}>{r.total_net?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
                <button onClick={() => toggleRunDetails(r.id)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "4px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  {expandedRunId === r.id ? "Ocultar Recibos" : "Ver Recibos"}
                </button>
              </div>
              {expandedRunId === r.id && (
                <div style={{ marginTop: 8, paddingLeft: 8 }}>
                  {loadingDetailsFor === r.id && <p style={{ fontSize: 13, color: "#8B93A7" }}>Cargando...</p>}
                  {runDetails[r.id]?.map((d) => (
                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1F2937" }}>
                      <span style={{ fontSize: 14 }}>
                        {d.employees?.full_name ?? "Empleado"} <span style={{ color: "#8B93A7" }}>- Neto {d.net_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </span>
                      <button onClick={() => downloadPayslip(r, d)} style={{ background: "none", border: "1px solid #FACC15", color: "#FACC15", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                        Recibo PDF
                      </button>
                    </div>
                  ))}
                  {runDetails[r.id]?.length === 0 && <p style={{ fontSize: 13, color: "#8B93A7" }}>Sin detalle por empleado para esta corrida.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </VerticalPageLayout>
  );
}
