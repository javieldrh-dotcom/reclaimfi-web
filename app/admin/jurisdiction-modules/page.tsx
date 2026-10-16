"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

// Pantalla de administracion para jurisdiction_modules: hasta ahora, cada
// jurisdiccion nueva (INCOME_TAX, LABOR_COST_FORMULA, PAYROLL_CHARGES)
// requeria que Javiel me pidiera un INSERT por SQL. El motor (ISLR,
// FSCL, nomina) ya es generico por jurisdiction_code -- lo unico que
// faltaba era una forma de cargar datos sin pasar por un despliegue de
// codigo cada vez. Esta pantalla es ese CRUD: cualquier Admin de
// plataforma puede registrar/editar/activar-desactivar la configuracion
// de un pais sin tocar SQL ni esperar un commit.
//
// El "config" se edita como JSON crudo (no un formulario por campo)
// porque la forma del JSON varia segun el module_key (brackets de ISLR,
// porcentajes de FSCL, employee_pct/employer_pct de nomina, y los que se
// agreguen despues) -- un editor generico es mas sostenible que un
// formulario distinto por cada modulo.
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
  }, null, 2),
  // model: "VAT_CREDIT" (IVA con credito/debito fiscal, como VE y la
  // mayoria de LatAm) o "FLAT_SALES_TAX" (impuesto de venta de una sola
  // etapa sin credito fiscal, como los sales tax estadales de EEUU).
  // form_label se muestra como subtitulo en Resumen de IVA/Sales Tax.
  SALES_TAX: JSON.stringify({
    name: "Ejemplo: Impuesto sobre Ventas",
    model: "FLAT_SALES_TAX",
    rate_pct: 7,
    form_label: "Resumen informativo de impuesto de ventas (verificar formulario oficial del estado)",
  }, null, 2),
};

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

  function resetForm() {
    setEditingId(null);
    setJurisdictionCode("");
    setModuleKey(KNOWN_MODULE_KEYS[0]);
    setModuleKeyCustom("");
    setEnabled(true);
    setConfigText(EXAMPLE_CONFIG[KNOWN_MODULE_KEYS[0]]);
    setConfigError("");
    setMessage("");
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
  }

  async function handleSave() {
    setMessage("");
    setConfigError("");

    const effectiveModuleKey = moduleKey === "__custom__" ? moduleKeyCustom.trim().toUpperCase() : moduleKey;
    const effectiveJurisdictionCode = jurisdictionCode.trim().toUpperCase();

    if (!effectiveJurisdictionCode) { setMessage("Error: el codigo de jurisdiccion es obligatorio (ej. VE, CO, US-FL)."); return; }
    if (!effectiveModuleKey) { setMessage("Error: el module_key es obligatorio."); return; }

    let parsedConfig: any;
    try {
      parsedConfig = JSON.parse(configText);
    } catch (e: any) {
      setConfigError("El JSON no es valido: " + e.message);
      return;
    }
    if (!parsedConfig.name) {
      setMessage("Advertencia: se recomienda incluir un campo \"name\" legible en el config (es lo que se muestra al contador en pantalla).");
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

  if (loading) return <div style={{ padding: 40, color: "#8FA3C4", background: "#0A1628", minHeight: "100vh" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#0A1628", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FACC15", fontFamily: "'IBM Plex Serif', serif" }}>Modulos por Jurisdiccion</h1>
      <p style={{ color: "#8FA3C4", marginTop: 8, maxWidth: 760 }}>
        ISLR, el factor FSCL y las cargas de nomina leen sus porcentajes y tramos de aqui segun el pais/estado (jurisdiction_code) de cada empresa.
        Carga una fila nueva para operar en un pais sin esperar un despliegue de codigo. Si una jurisdiccion no tiene fila aqui, el sistema usa las tasas de Venezuela como respaldo.
      </p>

      <div style={{ marginTop: 32, padding: 24, background: "#12213B", borderRadius: 16, border: "1px solid #1E3A5F", maxWidth: 680 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editingId ? "Editar Modulo" : "Nuevo Modulo"}</h2>

        <label style={{ fontSize: 12, color: "#8FA3C4" }}>CODIGO DE JURISDICCION (ej. VE, CO, US-FL, PA, DO)</label>
        <input type="text" value={jurisdictionCode} onChange={(e) => setJurisdictionCode(e.target.value)} style={inputStyle} placeholder="VE" />

        <label style={{ fontSize: 12, color: "#8FA3C4" }}>MODULO</label>
        <select
          value={moduleKey}
          onChange={(e) => {
            setModuleKey(e.target.value);
            if (!editingId && e.target.value !== "__custom__") setConfigText(EXAMPLE_CONFIG[e.target.value] ?? "{}");
          }}
          style={inputStyle}
        >
          {KNOWN_MODULE_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          <option value="__custom__">Otro (module_key personalizado)</option>
        </select>
        {moduleKey === "__custom__" && (
          <input type="text" value={moduleKeyCustom} onChange={(e) => setModuleKeyCustom(e.target.value)} style={inputStyle} placeholder="NOMBRE_DEL_MODULO" />
        )}

        <label style={{ fontSize: 12, color: "#8FA3C4" }}>CONFIG (JSON)</label>
        <textarea
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          rows={10}
          style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
        />
        {configError && <p style={{ color: "#F87171", fontSize: 13, marginTop: -8, marginBottom: 12 }}>{configError}</p>}

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14, color: "#8FA3C4" }}>
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
