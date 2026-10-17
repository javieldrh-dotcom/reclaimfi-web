"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

// Pantalla de administracion para jurisdiction_modules: hasta ahora, cada
// jurisdiccion nueva (INCOME_TAX, LABOR_COST_FORMULA, PAYROLL_CHARGES,
// SALES_TAX) requeria que Javiel me pidiera un INSERT por SQL. El motor
// (ISLR, FSCL, nomina) ya es generico por jurisdiction_code -- lo unico
// que faltaba era una forma de cargar datos sin pasar por un despliegue
// de codigo cada vez. Esta pantalla es ese CRUD: cualquier Admin de
// plataforma puede registrar/editar/activar-desactivar la configuracion
// de un pais sin tocar SQL ni esperar un commit.
//
// TODOS los modulos conocidos tienen ahora un FORMULARIO GUIADO -- Javiel
// pidio explicitamente poder cargar la configuracion de cualquier pais
// "libremente...sin necesidad de que nosotros aca estemos haciendo
// todo", es decir sin depender de que el o yo escribamos JSON a mano por
// cada pais. Empezo solo en PAYROLL_CHARGES (el modulo mas usado, que
// ademas dispara la generacion automatica de cuentas contables de
// app/admin/companies/new/page.tsx) y se extendio a INCOME_TAX,
// SALES_TAX y LABOR_COST_FORMULA. El modo JSON sigue disponible como
// escape hatch en los 4 -- y es el unico modo para un module_key
// personalizado, ya que ese no tiene forma fija conocida.
const KNOWN_MODULE_KEYS = ["INCOME_TAX", "LABOR_COST_FORMULA", "PAYROLL_CHARGES", "SALES_TAX"];

const EXAMPLE_CONFIG: Record<string, string> = {
  INCOME_TAX: JSON.stringify({
    name: "Ejemplo: Impuesto sobre la Renta",
    unit: "moneda_local",
    unit_value_required: false,
    brackets: [
      { upTo_UT: 10000, rate_pct: 10, sustraendo_UT: 0 },
      { upTo_UT: null, rate_pct: 25, sustraendo_UT: 1500 },
    ],
  }, null, 2),
  LABOR_COST_FORMULA: JSON.stringify({
    name: "Ejemplo: Cargas sobre Sub Total A",
    calendar_days_default: 30,
    third_party_charges_pct_of_subtotal_a: { seguro_social: 11, otro_cargo: 2 },
  }, null, 2),
  PAYROLL_CHARGES: JSON.stringify({
    name: "Ejemplo: Cargas de Nomina",
    employee_pct: { seguro_social_empleado: 4 },
    employer_pct: { seguro_social_patronal: 9, otro_cargo_patronal: 2 },
    provision_pct: { vacaciones: 4.17, aguinaldo: 8.33 },
    overtime_rules: { extra_diurna_multiplier: 1.5, extra_nocturna_multiplier: 1.5, feriado_descanso_multiplier: 2 },
    labels: {
      id_document: "DOCUMENTO DE IDENTIDAD",
      concepts: {
        base_salary: { code: "001", label: "Salario Basico" },
        overtime_day: { code: "002", label: "Horas Extras" },
        holiday_worked: { code: "009", label: "Dias Feriados Trabajados" },
        absence: { code: "101", label: "Faltas" },
        income_tax: { code: "151", label: "Retencion de Impuesto a la Renta" },
      },
      deduction_codes: {
        seguro_social_empleado: { code: "152", label: "Seguro Social" },
      },
    },
  }, null, 2),
  SALES_TAX: JSON.stringify({
    name: "Ejemplo: Impuesto sobre Ventas",
    model: "FLAT_SALES_TAX",
    rate_pct: 7,
    form_label: "Resumen informativo de impuesto de ventas (verificar formulario oficial del estado)",
  }, null, 2),
};

// ---- Formulario guiado: tipos y helpers compartidos ----

interface SimpleChargeRow {
  key: string;      // clave interna (ej. "imss_patronal") -- en minusculas, sin espacios
  pct: string;
  code: string;      // solo para cargas de EMPLEADO (PAYROLL_CHARGES): codigo que aparece en el recibo
  label: string;     // solo para cargas de EMPLEADO (PAYROLL_CHARGES): nombre que aparece en el recibo
  minEmployees: string; // solo para cargas PATRONALES (PAYROLL_CHARGES): minimo de empleados para que aplique
}
interface SimpleKeyPctRow { key: string; pct: string }
interface SimpleConceptRow { code: string; label: string }
interface SimpleExtraId { code: string; label: string }
interface SimpleBracketRow { upTo: string; rate: string; sustraendo: string }

const EMPTY_CHARGE_ROW: SimpleChargeRow = { key: "", pct: "", code: "", label: "", minEmployees: "" };
const EMPTY_KEYPCT_ROW: SimpleKeyPctRow = { key: "", pct: "" };
const EMPTY_BRACKET_ROW: SimpleBracketRow = { upTo: "", rate: "", sustraendo: "" };
const DEFAULT_CONCEPTS = {
  base_salary: { code: "001", label: "Salario Basico" },
  overtime_day: { code: "002", label: "Horas Extras Diurnas" },
  overtime_night: { code: "004", label: "Horas Extras Nocturnas" },
  holiday_worked: { code: "009", label: "Dias Feriados/Descanso Trabajados" },
  absence: { code: "101", label: "Faltas al Trabajo" },
  income_tax: { code: "151", label: "Retencion de Impuesto a la Renta" },
};

function slugifyKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function humanizeChargeKeyLocal(key: string): string {
  return key.replace(/_/g, " ").toUpperCase();
}

export default function JurisdictionModulesAdminPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [jurisdictionCode, setJurisdictionCode] = useState("");
  const [moduleKey, setModuleKey] = useState(KNOWN_MODULE_KEYS[0]);
  const [moduleKeyCustom, setModuleKeyCustom] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [configText, setConfigText] = useState(EXAMPLE_CONFIG[KNOWN_MODULE_KEYS[0]]);
  const [configError, setConfigError] = useState("");

  // "simple" = formulario guiado (para los 4 modulos conocidos); "json" =
  // editor de texto crudo (disponible siempre, y el unico modo para un
  // module_key personalizado).
  const [formMode, setFormMode] = useState<"simple" | "json">("simple");

  // -- PAYROLL_CHARGES --
  const [pcName, setPcName] = useState("");
  const [pcIdDocLabel, setPcIdDocLabel] = useState("CEDULA");
  const [pcTaxIdLabel, setPcTaxIdLabel] = useState("");
  const [pcOvertime, setPcOvertime] = useState({ diurna: "1.5", nocturna: "1.5", feriado: "2" });
  const [pcEmployeeCharges, setPcEmployeeCharges] = useState<SimpleChargeRow[]>([{ ...EMPTY_CHARGE_ROW }]);
  const [pcEmployerCharges, setPcEmployerCharges] = useState<SimpleChargeRow[]>([{ ...EMPTY_CHARGE_ROW }]);
  // Provisiones de prestaciones futuras del mismo empleado (vacaciones,
  // aguinaldo, etc.) -- clave/porcentaje simple, sin codigo de recibo ni
  // minimo de empleados (eso es especifico de employee_pct/employer_pct).
  // Vacio por defecto: el contador decide si quiere activar esto.
  const [pcProvisions, setPcProvisions] = useState<SimpleKeyPctRow[]>([]);
  const [pcExtraIds, setPcExtraIds] = useState<SimpleExtraId[]>([]);
  const [pcConcepts, setPcConcepts] = useState<Record<string, SimpleConceptRow>>(DEFAULT_CONCEPTS);

  // -- INCOME_TAX --
  const [itName, setItName] = useState("");
  const [itUnit, setItUnit] = useState("moneda_local");
  const [itUnitRequired, setItUnitRequired] = useState(false);
  const [itBrackets, setItBrackets] = useState<SimpleBracketRow[]>([{ ...EMPTY_BRACKET_ROW }]);

  // -- SALES_TAX --
  const [stName, setStName] = useState("");
  const [stModel, setStModel] = useState<"VAT_CREDIT" | "FLAT_SALES_TAX">("FLAT_SALES_TAX");
  const [stRate, setStRate] = useState("");
  const [stFormLabel, setStFormLabel] = useState("");

  // -- LABOR_COST_FORMULA --
  const [lcName, setLcName] = useState("");
  const [lcCalendarDays, setLcCalendarDays] = useState("30");
  const [lcCharges, setLcCharges] = useState<SimpleKeyPctRow[]>([{ ...EMPTY_KEYPCT_ROW }]);

  async function loadRows() {
    const { data } = await supabase
      .from("jurisdiction_modules")
      .select("*")
      .order("jurisdiction_code", { ascending: true })
      .order("module_key", { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  function resetAllSimpleForms() {
    setPcName(""); setPcIdDocLabel("CEDULA"); setPcTaxIdLabel("");
    setPcOvertime({ diurna: "1.5", nocturna: "1.5", feriado: "2" });
    setPcEmployeeCharges([{ ...EMPTY_CHARGE_ROW }]);
    setPcEmployerCharges([{ ...EMPTY_CHARGE_ROW }]);
    setPcProvisions([]);
    setPcExtraIds([]);
    setPcConcepts(DEFAULT_CONCEPTS);

    setItName(""); setItUnit("moneda_local"); setItUnitRequired(false);
    setItBrackets([{ ...EMPTY_BRACKET_ROW }]);

    setStName(""); setStModel("FLAT_SALES_TAX"); setStRate(""); setStFormLabel("");

    setLcName(""); setLcCalendarDays("30"); setLcCharges([{ ...EMPTY_KEYPCT_ROW }]);
  }

  function resetForm() {
    setEditingId(null);
    setJurisdictionCode("");
    setModuleKey(KNOWN_MODULE_KEYS[0]);
    setModuleKeyCustom("");
    setEnabled(true);
    setConfigText(EXAMPLE_CONFIG[KNOWN_MODULE_KEYS[0]]);
    setConfigError("");
    setMessage("");
    setFormMode("simple");
    resetAllSimpleForms();
  }

  // ---- Reconstruir el formulario guiado a partir de un config ya
  // guardado (para "Editar"). Tolerante a campos faltantes -- un config
  // viejo o escrito a mano en modo JSON simplemente deja esos campos en
  // blanco/por defecto, nunca rompe la pantalla.

  function loadPayrollChargesFromConfig(config: any) {
    setPcName(config?.name ?? "");
    setPcIdDocLabel(config?.labels?.id_document ?? "CEDULA");
    setPcTaxIdLabel(config?.labels?.tax_id_label ?? "");
    setPcOvertime({
      diurna: String(config?.overtime_rules?.extra_diurna_multiplier ?? 1.5),
      nocturna: String(config?.overtime_rules?.extra_nocturna_multiplier ?? 1.5),
      feriado: String(config?.overtime_rules?.feriado_descanso_multiplier ?? 2),
    });
    const dedCodes = config?.labels?.deduction_codes ?? {};
    const employeeEntries = Object.entries(config?.employee_pct ?? {});
    setPcEmployeeCharges(
      employeeEntries.length > 0
        ? employeeEntries.map(([key, pct]) => ({
            key, pct: String(pct),
            code: dedCodes[key]?.code ?? "", label: dedCodes[key]?.label ?? "",
            minEmployees: "",
          }))
        : [{ ...EMPTY_CHARGE_ROW }]
    );
    const minEmp = config?.employer_pct_min_employees ?? {};
    const employerEntries = Object.entries(config?.employer_pct ?? {});
    setPcEmployerCharges(
      employerEntries.length > 0
        ? employerEntries.map(([key, pct]) => ({
            key, pct: String(pct), code: "", label: "",
            minEmployees: minEmp[key] != null ? String(minEmp[key]) : "",
          }))
        : [{ ...EMPTY_CHARGE_ROW }]
    );
    const provisionEntries = Object.entries(config?.provision_pct ?? {});
    setPcProvisions(provisionEntries.map(([key, pct]) => ({ key, pct: String(pct) })));
    setPcExtraIds(Array.isArray(config?.labels?.extra_employee_ids) ? config.labels.extra_employee_ids : []);
    setPcConcepts({
      base_salary: config?.labels?.concepts?.base_salary ?? DEFAULT_CONCEPTS.base_salary,
      overtime_day: config?.labels?.concepts?.overtime_day ?? DEFAULT_CONCEPTS.overtime_day,
      overtime_night: config?.labels?.concepts?.overtime_night ?? DEFAULT_CONCEPTS.overtime_night,
      holiday_worked: config?.labels?.concepts?.holiday_worked ?? DEFAULT_CONCEPTS.holiday_worked,
      absence: config?.labels?.concepts?.absence ?? DEFAULT_CONCEPTS.absence,
      income_tax: config?.labels?.concepts?.income_tax ?? DEFAULT_CONCEPTS.income_tax,
    });
  }

  function loadIncomeTaxFromConfig(config: any) {
    setItName(config?.name ?? "");
    setItUnit(config?.unit ?? "moneda_local");
    setItUnitRequired(config?.unit_value_required === true);
    const brackets = Array.isArray(config?.brackets) ? config.brackets : [];
    setItBrackets(
      brackets.length > 0
        ? brackets.map((b: any) => ({
            upTo: b.upTo_UT == null ? "" : String(b.upTo_UT),
            rate: String(b.rate_pct ?? ""),
            sustraendo: String(b.sustraendo_UT ?? ""),
          }))
        : [{ ...EMPTY_BRACKET_ROW }]
    );
  }

  function loadSalesTaxFromConfig(config: any) {
    setStName(config?.name ?? "");
    setStModel(config?.model === "VAT_CREDIT" ? "VAT_CREDIT" : "FLAT_SALES_TAX");
    setStRate(config?.rate_pct != null ? String(config.rate_pct) : "");
    setStFormLabel(config?.form_label ?? "");
  }

  function loadLaborCostFromConfig(config: any) {
    setLcName(config?.name ?? "");
    setLcCalendarDays(config?.calendar_days_default != null ? String(config.calendar_days_default) : "30");
    const entries = Object.entries(config?.third_party_charges_pct_of_subtotal_a ?? {});
    setLcCharges(
      entries.length > 0
        ? entries.map(([key, pct]) => ({ key, pct: String(pct) }))
        : [{ ...EMPTY_KEYPCT_ROW }]
    );
  }

  // ---- Construir el config final a partir del formulario guiado, segun
  // cual modulo este activo. Misma forma que las interfaces en
  // app/lib/jurisdictionTax.ts. Filas sin "key"/tasa se ignoran.

  function buildPayrollChargesFromSimple(): any {
    const employee_pct: Record<string, number> = {};
    const deduction_codes: Record<string, { code: string; label: string }> = {};
    pcEmployeeCharges.forEach((row) => {
      const key = slugifyKey(row.key);
      if (!key) return;
      employee_pct[key] = parseFloat(row.pct) || 0;
      if (row.code.trim() || row.label.trim()) {
        deduction_codes[key] = { code: row.code.trim() || "-", label: row.label.trim() || humanizeChargeKeyLocal(key) };
      }
    });

    const employer_pct: Record<string, number> = {};
    const employer_pct_min_employees: Record<string, number> = {};
    pcEmployerCharges.forEach((row) => {
      const key = slugifyKey(row.key);
      if (!key) return;
      employer_pct[key] = parseFloat(row.pct) || 0;
      const min = parseFloat(row.minEmployees);
      if (min > 0) employer_pct_min_employees[key] = min;
    });

    const provision_pct: Record<string, number> = {};
    pcProvisions.forEach((row) => {
      const key = slugifyKey(row.key);
      if (!key) return;
      provision_pct[key] = parseFloat(row.pct) || 0;
    });

    const extra_employee_ids = pcExtraIds
      .map((e) => ({ code: slugifyKey(e.code), label: e.label.trim() }))
      .filter((e) => e.code && e.label);

    const config: any = {
      name: pcName.trim() || "Cargas de Nomina",
      employee_pct,
      employer_pct,
      overtime_rules: {
        extra_diurna_multiplier: parseFloat(pcOvertime.diurna) || 1.5,
        extra_nocturna_multiplier: parseFloat(pcOvertime.nocturna) || 1.5,
        feriado_descanso_multiplier: parseFloat(pcOvertime.feriado) || 2,
      },
      labels: {
        id_document: pcIdDocLabel.trim() || "CEDULA",
        concepts: pcConcepts,
      },
    };
    if (Object.keys(employer_pct_min_employees).length > 0) config.employer_pct_min_employees = employer_pct_min_employees;
    if (Object.keys(provision_pct).length > 0) config.provision_pct = provision_pct;
    if (pcTaxIdLabel.trim()) config.labels.tax_id_label = pcTaxIdLabel.trim();
    if (extra_employee_ids.length > 0) config.labels.extra_employee_ids = extra_employee_ids;
    if (Object.keys(deduction_codes).length > 0) config.labels.deduction_codes = deduction_codes;
    return config;
  }

  function buildIncomeTaxFromSimple(): any {
    return {
      name: itName.trim() || "Impuesto sobre la Renta",
      unit: itUnit.trim() || "moneda_local",
      unit_value_required: itUnitRequired,
      brackets: itBrackets
        .filter((b) => b.rate.trim() !== "")
        .map((b) => ({
          upTo_UT: b.upTo.trim() === "" ? null : parseFloat(b.upTo),
          rate_pct: parseFloat(b.rate) || 0,
          sustraendo_UT: parseFloat(b.sustraendo) || 0,
        })),
    };
  }

  function buildSalesTaxFromSimple(): any {
    const config: any = {
      name: stName.trim() || "Impuesto sobre Ventas",
      model: stModel,
      rate_pct: parseFloat(stRate) || 0,
    };
    if (stFormLabel.trim()) config.form_label = stFormLabel.trim();
    return config;
  }

  function buildLaborCostFromSimple(): any {
    const third_party_charges_pct_of_subtotal_a: Record<string, number> = {};
    lcCharges.forEach((row) => {
      const key = slugifyKey(row.key);
      if (!key) return;
      third_party_charges_pct_of_subtotal_a[key] = parseFloat(row.pct) || 0;
    });
    return {
      name: lcName.trim() || "Cargas sobre Sub Total A",
      calendar_days_default: parseFloat(lcCalendarDays) || 30,
      third_party_charges_pct_of_subtotal_a,
    };
  }

  function buildCurrentSimpleConfig(effectiveModuleKey: string): any {
    if (effectiveModuleKey === "PAYROLL_CHARGES") return buildPayrollChargesFromSimple();
    if (effectiveModuleKey === "INCOME_TAX") return buildIncomeTaxFromSimple();
    if (effectiveModuleKey === "SALES_TAX") return buildSalesTaxFromSimple();
    if (effectiveModuleKey === "LABOR_COST_FORMULA") return buildLaborCostFromSimple();
    return {};
  }

  function startEdit(row: any) {
    setEditingId(row.jurisdiction_code + ":" + row.module_key);
    setJurisdictionCode(row.jurisdiction_code);
    if (KNOWN_MODULE_KEYS.includes(row.module_key)) {
      setModuleKey(row.module_key);
      setModuleKeyCustom("");
    } else {
      setModuleKey("__custom__");
      setModuleKeyCustom(row.module_key);
    }
    setEnabled(row.enabled !== false);
    setConfigText(JSON.stringify(row.config ?? {}, null, 2));
    setConfigError("");
    setMessage("");
    if (row.module_key === "PAYROLL_CHARGES") { loadPayrollChargesFromConfig(row.config ?? {}); setFormMode("simple"); }
    else if (row.module_key === "INCOME_TAX") { loadIncomeTaxFromConfig(row.config ?? {}); setFormMode("simple"); }
    else if (row.module_key === "SALES_TAX") { loadSalesTaxFromConfig(row.config ?? {}); setFormMode("simple"); }
    else if (row.module_key === "LABOR_COST_FORMULA") { loadLaborCostFromConfig(row.config ?? {}); setFormMode("simple"); }
    else { setFormMode("json"); }
  }

  async function handleSave() {
    setMessage("");
    setConfigError("");

    const effectiveModuleKey = moduleKey === "__custom__" ? moduleKeyCustom.trim().toUpperCase() : moduleKey;
    const effectiveJurisdictionCode = jurisdictionCode.trim().toUpperCase();

    if (!effectiveJurisdictionCode) { setMessage("Error: el codigo de jurisdiccion es obligatorio (ej. VE, CO, US-FL)."); return; }
    if (!effectiveModuleKey) { setMessage("Error: el module_key es obligatorio."); return; }

    let parsedConfig: any;
    if (formMode === "simple" && KNOWN_MODULE_KEYS.includes(effectiveModuleKey)) {
      const built = buildCurrentSimpleConfig(effectiveModuleKey);
      if (effectiveModuleKey === "PAYROLL_CHARGES" && Object.keys(built.employee_pct).length === 0 && Object.keys(built.employer_pct).length === 0) {
        setMessage("Error: agrega al menos una carga de empleado o patronal (con su clave y porcentaje).");
        return;
      }
      if (effectiveModuleKey === "INCOME_TAX" && built.brackets.length === 0) {
        setMessage("Error: agrega al menos un tramo con su tasa.");
        return;
      }
      parsedConfig = built;
    } else {
      try {
        parsedConfig = JSON.parse(configText);
      } catch (e: any) {
        setConfigError("El JSON no es valido: " + e.message);
        return;
      }
      if (!parsedConfig.name) {
        setMessage("Advertencia: se recomienda incluir un campo \"name\" legible en el config (es lo que se muestra al contador en pantalla).");
      }
    }

    setSaving(true);
    // La escritura pasa por esta ruta (service_role, gateada al propietario)
    // porque jurisdiction_modules a proposito no tiene politica de RLS de
    // escritura -- ver app/api/admin/jurisdiction-modules/route.ts.
    const res = await fetch("/api/admin/jurisdiction-modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jurisdiction_code: effectiveJurisdictionCode, module_key: effectiveModuleKey, config: parsedConfig, enabled }),
    });
    const data = await res.json().catch(() => ({ success: false, error: "Respuesta invalida del servidor." }));

    if (!data.success) {
      setMessage("Error al guardar: " + (data.error || "desconocido"));
    } else {
      setMessage((editingId ? "Modulo actualizado" : "Modulo creado") + " correctamente para " + effectiveJurisdictionCode + " / " + effectiveModuleKey + ".");
      resetForm();
      await loadRows();
    }
    setSaving(false);
  }

  async function handleToggleEnabled(row: any) {
    await fetch("/api/admin/jurisdiction-modules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jurisdiction_code: row.jurisdiction_code, module_key: row.module_key, enabled: !row.enabled }),
    });
    await loadRows();
  }

  async function handleDelete(row: any) {
    if (!window.confirm("Eliminar " + row.jurisdiction_code + " / " + row.module_key + "? Las empresas de esa jurisdiccion pasaran a usar el respaldo (VE) hasta que se cargue otra fila.")) return;
    await fetch(
      "/api/admin/jurisdiction-modules?jurisdiction_code=" + encodeURIComponent(row.jurisdiction_code) + "&module_key=" + encodeURIComponent(row.module_key),
      { method: "DELETE" }
    );
    await loadRows();
  }

  const inputStyle = { width: "100%", padding: 12, background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 8, color: "white", fontSize: 14, marginBottom: 14 };
  const smallInput = { padding: 8, background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: 6, color: "white", fontSize: 13 };
  const sectionLabel = { fontSize: 13, color: "#FACC15", fontWeight: 700, marginTop: 18, marginBottom: 8, display: "block" };
  const helpText = { fontSize: 11, color: "#8FA3C4", marginTop: -4, marginBottom: 10 };

  const effectiveModuleKeyLive = moduleKey === "__custom__" ? moduleKeyCustom.trim().toUpperCase() : moduleKey;
  const hasGuidedForm = KNOWN_MODULE_KEYS.includes(effectiveModuleKeyLive);

  function chargeRowsEditor(
    title: string,
    rowsArg: SimpleChargeRow[],
    setRowsArg: (r: SimpleChargeRow[]) => void,
    kind: "employee" | "employer"
  ) {
    return (
      <div>
        <label style={sectionLabel}>{title}</label>
        <p style={helpText}>
          {kind === "employee"
            ? "Cada fila es un descuento al salario del trabajador. \"Codigo\" y \"Nombre en recibo\" son opcionales -- se muestran en el PDF del recibo de pago."
            : "Cada fila es un costo adicional que paga la empresa (no se descuenta del sueldo). La cuenta contable (Gasto / Por Pagar) se genera sola a partir de la CLAVE al crear o sincronizar una empresa."}
        </p>
        {rowsArg.map((row, idx) => (
          <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={row.key}
              onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, key: e.target.value }; setRowsArg(next); }}
              placeholder={kind === "employee" ? "clave_interna (ej. seguro_social_empleado)" : "clave_interna (ej. imss_patronal)"}
              style={{ ...smallInput, flex: 2, minWidth: 180 }}
            />
            <input
              type="number" step="0.01" value={row.pct}
              onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, pct: e.target.value }; setRowsArg(next); }}
              placeholder="%"
              style={{ ...smallInput, width: 70 }}
            />
            {kind === "employee" && (
              <>
                <input
                  value={row.code}
                  onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, code: e.target.value }; setRowsArg(next); }}
                  placeholder="Codigo recibo (ej. 152)"
                  style={{ ...smallInput, width: 110 }}
                />
                <input
                  value={row.label}
                  onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, label: e.target.value }; setRowsArg(next); }}
                  placeholder="Nombre en recibo"
                  style={{ ...smallInput, flex: 2, minWidth: 160 }}
                />
              </>
            )}
            {kind === "employer" && (
              <input
                type="number" min="0" step="1" value={row.minEmployees}
                onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, minEmployees: e.target.value }; setRowsArg(next); }}
                placeholder="Min. empleados (opcional)"
                style={{ ...smallInput, width: 150 }}
              />
            )}
            <button
              onClick={() => setRowsArg(rowsArg.filter((_, i) => i !== idx))}
              style={{ background: "none", border: "1px solid #F87171", color: "#F87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}
            >
              Quitar
            </button>
            {kind === "employer" && row.key.trim() && (
              <span style={{ fontSize: 11, color: "#4ade80", width: "100%" }}>
                → cuenta generada: &quot;Gasto {humanizeChargeKeyLocal(slugifyKey(row.key))}&quot; / &quot;{humanizeChargeKeyLocal(slugifyKey(row.key))} por Pagar&quot;
              </span>
            )}
          </div>
        ))}
        <button
          onClick={() => setRowsArg([...rowsArg, { ...EMPTY_CHARGE_ROW }])}
          style={{ background: "none", border: "1px dashed #1E3A5F", color: "#8FA3C4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, marginTop: 2 }}
        >
          + Agregar {kind === "employee" ? "carga de empleado" : "carga patronal"}
        </button>
      </div>
    );
  }

  function keyPctRowsEditor(title: string, help: string, rowsArg: SimpleKeyPctRow[], setRowsArg: (r: SimpleKeyPctRow[]) => void, keyPlaceholder: string) {
    return (
      <div>
        <label style={sectionLabel}>{title}</label>
        <p style={helpText}>{help}</p>
        {rowsArg.map((row, idx) => (
          <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              value={row.key}
              onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, key: e.target.value }; setRowsArg(next); }}
              placeholder={keyPlaceholder}
              style={{ ...smallInput, flex: 2, minWidth: 180 }}
            />
            <input
              type="number" step="0.01" value={row.pct}
              onChange={(e) => { const next = [...rowsArg]; next[idx] = { ...row, pct: e.target.value }; setRowsArg(next); }}
              placeholder="%"
              style={{ ...smallInput, width: 90 }}
            />
            <button onClick={() => setRowsArg(rowsArg.filter((_, i) => i !== idx))} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>
              Quitar
            </button>
          </div>
        ))}
        <button onClick={() => setRowsArg([...rowsArg, { ...EMPTY_KEYPCT_ROW }])} style={{ background: "none", border: "1px dashed #1E3A5F", color: "#8FA3C4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
          + Agregar
        </button>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, color: "#8FA3C4", background: "#0A1628", minHeight: "100vh" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#0A1628", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FACC15", fontFamily: "'IBM Plex Serif', serif" }}>Modulos por Jurisdiccion</h1>
      <p style={{ color: "#8FA3C4", marginTop: 8, maxWidth: 760 }}>
        ISLR, el factor FSCL, IVA/Sales Tax y las cargas de nomina leen sus porcentajes y tramos de aqui segun el pais/estado (jurisdiction_code) de cada empresa.
        Carga una fila nueva para operar en un pais sin esperar un despliegue de codigo. Si una jurisdiccion no tiene fila aqui, el sistema usa las tasas de Venezuela como respaldo.
      </p>

      <div style={{ marginTop: 32, padding: 24, background: "#12213B", borderRadius: 16, border: "1px solid #1E3A5F", maxWidth: 760 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editingId ? "Editar Modulo" : "Nuevo Modulo"}</h2>

        <label style={{ fontSize: 12, color: "#8FA3C4" }}>CODIGO DE JURISDICCION (ej. VE, CO, US-FL, PA, DO)</label>
        <input type="text" value={jurisdictionCode} onChange={(e) => setJurisdictionCode(e.target.value)} style={inputStyle} placeholder="VE" />

        <label style={{ fontSize: 12, color: "#8FA3C4" }}>MODULO</label>
        <select
          value={moduleKey}
          onChange={(e) => {
            setModuleKey(e.target.value);
            if (!editingId && e.target.value !== "__custom__") setConfigText(EXAMPLE_CONFIG[e.target.value] ?? "{}");
            setFormMode(e.target.value !== "__custom__" ? "simple" : "json");
          }}
          style={inputStyle}
        >
          {KNOWN_MODULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          <option value="__custom__">Otro (module_key personalizado)</option>
        </select>
        {moduleKey === "__custom__" && (
          <input type="text" value={moduleKeyCustom} onChange={(e) => setModuleKeyCustom(e.target.value)} style={inputStyle} placeholder="NOMBRE_DEL_MODULO" />
        )}

        {hasGuidedForm && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => setFormMode("simple")}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid " + (formMode === "simple" ? "#FACC15" : "#1E3A5F"), background: formMode === "simple" ? "#FACC1522" : "none", color: formMode === "simple" ? "#FACC15" : "#8FA3C4", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >
              Formulario Guiado
            </button>
            <button
              onClick={() => { setConfigText(JSON.stringify(buildCurrentSimpleConfig(effectiveModuleKeyLive), null, 2)); setFormMode("json"); }}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid " + (formMode === "json" ? "#FACC15" : "#1E3A5F"), background: formMode === "json" ? "#FACC1522" : "none", color: formMode === "json" ? "#FACC15" : "#8FA3C4", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >
              JSON Avanzado
            </button>
          </div>
        )}

        {hasGuidedForm && formMode === "simple" ? (
          <div>
            {effectiveModuleKeyLive === "PAYROLL_CHARGES" && (
              <div>
                <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DESCRIPTIVO</label>
                <input value={pcName} onChange={(e) => setPcName(e.target.value)} style={inputStyle} placeholder="Ej. Cargas de Nomina Kenia (NSSF/NHIF)" />

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DEL DOCUMENTO DE IDENTIDAD</label>
                    <input value={pcIdDocLabel} onChange={(e) => setPcIdDocLabel(e.target.value)} style={inputStyle} placeholder="Ej. CEDULA, CURP, SSN, ID Number" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DEL RIF/ID FISCAL DE LA EMPRESA</label>
                    <input value={pcTaxIdLabel} onChange={(e) => setPcTaxIdLabel(e.target.value)} style={inputStyle} placeholder="Ej. RIF, RFC, EIN, Tax PIN" />
                  </div>
                </div>

                {chargeRowsEditor("CARGAS AL EMPLEADO (se descuentan del sueldo)", pcEmployeeCharges, setPcEmployeeCharges, "employee")}
                {chargeRowsEditor("CARGAS PATRONALES (las paga la empresa, no se descuentan)", pcEmployerCharges, setPcEmployerCharges, "employer")}
                {keyPctRowsEditor(
                  "PROVISIONES DE PRESTACIONES FUTURAS (opcional: vacaciones, aguinaldo, etc.)",
                  "Reconocen el gasto HOY por un beneficio que se le pagara despues al MISMO trabajador (no un tercero) -- no afecta el sueldo ni el neto del recibo. Deja esto vacio si prefieres seguir calculando/pagando estos beneficios por fuera del sistema, como hasta ahora.",
                  pcProvisions, setPcProvisions, "clave_interna (ej. vacaciones, aguinaldo)"
                )}

                <label style={sectionLabel}>IDENTIFICADORES ADICIONALES DEL EMPLEADO (opcional)</label>
                <p style={helpText}>Si este pais exige mas de un documento por trabajador (ej. Mexico: RFC + NSS ademas de la CURP).</p>
                {pcExtraIds.map((e, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={e.code} onChange={(ev) => { const next = [...pcExtraIds]; next[idx] = { ...e, code: ev.target.value }; setPcExtraIds(next); }} placeholder="clave (ej. nss)" style={{ ...smallInput, width: 140 }} />
                    <input value={e.label} onChange={(ev) => { const next = [...pcExtraIds]; next[idx] = { ...e, label: ev.target.value }; setPcExtraIds(next); }} placeholder="Etiqueta (ej. NSS)" style={{ ...smallInput, flex: 1 }} />
                    <button onClick={() => setPcExtraIds(pcExtraIds.filter((_, i) => i !== idx))} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Quitar</button>
                  </div>
                ))}
                <button onClick={() => setPcExtraIds([...pcExtraIds, { code: "", label: "" }])} style={{ background: "none", border: "1px dashed #1E3A5F", color: "#8FA3C4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
                  + Agregar identificador
                </button>

                <label style={sectionLabel}>RECARGOS DE HORAS EXTRA / FERIADOS</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#8FA3C4" }}>Hora extra diurna (x)</label>
                    <input type="number" step="0.01" value={pcOvertime.diurna} onChange={(e) => setPcOvertime({ ...pcOvertime, diurna: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#8FA3C4" }}>Hora extra nocturna (x)</label>
                    <input type="number" step="0.01" value={pcOvertime.nocturna} onChange={(e) => setPcOvertime({ ...pcOvertime, nocturna: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#8FA3C4" }}>Feriado/descanso trabajado (x)</label>
                    <input type="number" step="0.01" value={pcOvertime.feriado} onChange={(e) => setPcOvertime({ ...pcOvertime, feriado: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                  </div>
                </div>

                <label style={sectionLabel}>CODIGOS Y NOMBRES EN EL RECIBO DE PAGO</label>
                <p style={helpText}>Como se llama cada concepto en el recibo oficial de este pais.</p>
                {Object.entries(pcConcepts).map(([conceptKey, row]) => (
                  <div key={conceptKey} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#8FA3C4", width: 150, flexShrink: 0 }}>{conceptKey.replace(/_/g, " ")}</span>
                    <input value={row.code} onChange={(e) => setPcConcepts({ ...pcConcepts, [conceptKey]: { ...row, code: e.target.value } })} placeholder="Codigo" style={{ ...smallInput, width: 90 }} />
                    <input value={row.label} onChange={(e) => setPcConcepts({ ...pcConcepts, [conceptKey]: { ...row, label: e.target.value } })} placeholder="Nombre" style={{ ...smallInput, flex: 1 }} />
                  </div>
                ))}
              </div>
            )}

            {effectiveModuleKeyLive === "INCOME_TAX" && (
              <div>
                <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DESCRIPTIVO</label>
                <input value={itName} onChange={(e) => setItName(e.target.value)} style={inputStyle} placeholder="Ej. Impuesto Sobre la Renta Kenia" />

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#8FA3C4" }}>UNIDAD (ej. moneda_local, UT, UVT)</label>
                    <input value={itUnit} onChange={(e) => setItUnit(e.target.value)} style={inputStyle} placeholder="moneda_local" />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 20 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8FA3C4" }}>
                      <input type="checkbox" checked={itUnitRequired} onChange={(e) => setItUnitRequired(e.target.checked)} />
                      Requiere valor de unidad (ej. valor de la UT del dia) -- desmarcado si la unidad ya es moneda local
                    </label>
                  </div>
                </div>

                <label style={sectionLabel}>TRAMOS (BRACKETS)</label>
                <p style={helpText}>
                  Cada tramo: "Hasta" (deja vacio SOLO en el ultimo tramo, para "sin limite"), "Tasa %" y "Sustraendo" (monto fijo a restar del impuesto calculado, 0 si el tramo no tiene). Ordena de menor a mayor.
                </p>
                {itBrackets.map((b, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input type="number" step="0.01" value={b.upTo} onChange={(e) => { const next = [...itBrackets]; next[idx] = { ...b, upTo: e.target.value }; setItBrackets(next); }} placeholder="Hasta (vacio = sin limite)" style={{ ...smallInput, flex: 1 }} />
                    <input type="number" step="0.01" value={b.rate} onChange={(e) => { const next = [...itBrackets]; next[idx] = { ...b, rate: e.target.value }; setItBrackets(next); }} placeholder="Tasa %" style={{ ...smallInput, width: 90 }} />
                    <input type="number" step="0.01" value={b.sustraendo} onChange={(e) => { const next = [...itBrackets]; next[idx] = { ...b, sustraendo: e.target.value }; setItBrackets(next); }} placeholder="Sustraendo" style={{ ...smallInput, width: 110 }} />
                    <button onClick={() => setItBrackets(itBrackets.filter((_, i) => i !== idx))} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Quitar</button>
                  </div>
                ))}
                <button onClick={() => setItBrackets([...itBrackets, { ...EMPTY_BRACKET_ROW }])} style={{ background: "none", border: "1px dashed #1E3A5F", color: "#8FA3C4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
                  + Agregar tramo
                </button>
              </div>
            )}

            {effectiveModuleKeyLive === "SALES_TAX" && (
              <div>
                <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DESCRIPTIVO</label>
                <input value={stName} onChange={(e) => setStName(e.target.value)} style={inputStyle} placeholder="Ej. Impuesto sobre Ventas Kenia (VAT)" />

                <label style={{ fontSize: 12, color: "#8FA3C4" }}>MODELO</label>
                <select value={stModel} onChange={(e) => setStModel(e.target.value === "VAT_CREDIT" ? "VAT_CREDIT" : "FLAT_SALES_TAX")} style={inputStyle}>
                  <option value="VAT_CREDIT">VAT_CREDIT -- IVA con credito/debito fiscal (como VE y la mayoria de LatAm)</option>
                  <option value="FLAT_SALES_TAX">FLAT_SALES_TAX -- impuesto de venta de una sola etapa, sin credito fiscal (como los sales tax estadales de EEUU)</option>
                </select>

                <label style={{ fontSize: 12, color: "#8FA3C4" }}>TASA (%)</label>
                <input type="number" step="0.01" value={stRate} onChange={(e) => setStRate(e.target.value)} style={inputStyle} placeholder="16" />

                <label style={{ fontSize: 12, color: "#8FA3C4" }}>SUBTITULO EN RESUMEN DE IVA/SALES TAX (opcional)</label>
                <input value={stFormLabel} onChange={(e) => setStFormLabel(e.target.value)} style={inputStyle} placeholder="Ej. Verificar formulario oficial de la autoridad tributaria" />
              </div>
            )}

            {effectiveModuleKeyLive === "LABOR_COST_FORMULA" && (
              <div>
                <label style={{ fontSize: 12, color: "#8FA3C4" }}>NOMBRE DESCRIPTIVO</label>
                <input value={lcName} onChange={(e) => setLcName(e.target.value)} style={inputStyle} placeholder="Ej. Cargas sobre Sub Total A Kenia" />

                <label style={{ fontSize: 12, color: "#8FA3C4" }}>DIAS CALENDARIO POR DEFECTO (para el calculo FSCL)</label>
                <input type="number" value={lcCalendarDays} onChange={(e) => setLcCalendarDays(e.target.value)} style={inputStyle} placeholder="30" />

                {keyPctRowsEditor(
                  "CARGAS SOBRE SUB TOTAL A",
                  "Cada fila es un cargo adicional (seguridad social, fondos, etc.) que se suma al costo de mano de obra en el calculo FSCL de APU.",
                  lcCharges, setLcCharges, "clave_interna (ej. seguro_social)"
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <label style={{ fontSize: 12, color: "#8FA3C4" }}>CONFIG (JSON)</label>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={14}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
            />
            {configError && <p style={{ color: "#F87171", fontSize: 13, marginTop: -8, marginBottom: 12 }}>{configError}</p>}
          </>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 16, fontSize: 14, color: "#8FA3C4" }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Habilitado (si se desmarca, las empresas de esta jurisdiccion usan el respaldo VE)
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 14, background: "#FACC15", color: "#0A1628", fontWeight: 800, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Modulo"}
          </button>
          {editingId && (
            <button onClick={resetForm} style={{ padding: "14px 20px", background: "none", border: "1px solid #1E3A5F", color: "#8FA3C4", borderRadius: 10, cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </div>
        {message && <p style={{ marginTop: 12, fontSize: 14, color: message.startsWith("Error") ? "#F87171" : "#34D399" }}>{message}</p>}
      </div>

      <h2 style={{ marginTop: 40, fontSize: 18, color: "#8FA3C4" }}>Modulos Cargados ({rows.length})</h2>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
        {rows.length === 0 && <p style={{ color: "#8FA3C4" }}>Sin modulos cargados todavia.</p>}
        {rows.map((r) => (
          <div key={r.jurisdiction_code + ":" + r.module_key} style={{ padding: 18, background: "#12213B", borderRadius: 12, border: "1px solid " + (r.enabled === false ? "#F8717160" : "#1E3A5F"), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <p style={{ fontWeight: 700 }}>
                {r.jurisdiction_code} <span style={{ color: "#8FA3C4", fontWeight: 400 }}>/ {r.module_key}</span>
                {r.enabled === false && <span style={{ color: "#F87171", fontSize: 12, marginLeft: 10 }}>DESHABILITADO</span>}
              </p>
              <p style={{ fontSize: 13, color: "#8FA3C4", marginTop: 4 }}>{r.config?.name ?? "(sin nombre descriptivo en el config)"}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => startEdit(r)} style={{ background: "none", border: "1px solid #818CF8", color: "#818CF8", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Editar
              </button>
              <button onClick={() => handleToggleEnabled(r)} style={{ background: "none", border: "1px solid #FACC15", color: "#FACC15", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                {r.enabled === false ? "Habilitar" : "Deshabilitar"}
              </button>
              <button onClick={() => handleDelete(r)} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
