"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

// Plan de Cuentas: hasta ahora no existia ninguna pantalla para ver o
// corregir el plan de cuentas completo -- las cuentas solo se creaban al
// vuelo desde botones "+ Nueva" dispersos en Nomina, AR, AP, etc, y una
// vez creadas no habia forma de arreglar un codigo o nombre mal escrito
// (Javiel reporto exactamente ese problema). Esta pantalla cubre eso:
// listar, crear, editar codigo/nombre/tipo, y desactivar (nunca borrar
// de verdad -- demasiadas tablas tienen foreign keys a chart_of_accounts
// como para permitir un delete real sin romper historico).
const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "ORDER_DEBTOR", "ORDER_CREDITOR"];
const TYPE_LABELS: Record<string, string> = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Patrimonio",
  REVENUE: "Ingreso",
  EXPENSE: "Gasto",
  ORDER_DEBTOR: "Orden Deudora",
  ORDER_CREDITOR: "Orden Acreedora",
};

export default function ChartOfAccountsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [message, setMessage] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("ASSET");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("ASSET");
  const [saving, setSaving] = useState(false);

  async function loadAccounts(cid: string) {
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type, is_active")
      .eq("company_id", cid)
      .order("account_code");
    setAccounts(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadAccounts(cid);
    }
    load();
  }, []);

  async function createAccount() {
    setMessage("");
    if (!companyId || !newCode.trim() || !newName.trim()) {
      setMessage("Completa el codigo y el nombre de la cuenta.");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("chart_of_accounts").insert([{
      company_id: companyId,
      account_code: newCode.trim(),
      account_name: newName.trim(),
      account_type: newType,
    }]);
    if (error) {
      setMessage(error.message.includes("duplicate") || error.message.includes("unique")
        ? "Ya existe una cuenta con el codigo " + newCode.trim() + "."
        : "Error al crear: " + error.message);
      setCreating(false);
      return;
    }
    setMessage("Cuenta creada correctamente.");
    setNewCode(""); setNewName(""); setNewType("ASSET");
    setCreating(false);
    await loadAccounts(companyId);
  }

  function startEdit(acc: any) {
    setEditingId(acc.id);
    setEditCode(acc.account_code);
    setEditName(acc.account_name);
    setEditType(acc.account_type);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!companyId || !editingId || !editCode.trim() || !editName.trim()) {
      setMessage("Completa el codigo y el nombre.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("chart_of_accounts").update({
      account_code: editCode.trim(),
      account_name: editName.trim(),
      account_type: editType,
    }).eq("id", editingId);
    if (error) {
      setMessage(error.message.includes("duplicate") || error.message.includes("unique")
        ? "Ya existe otra cuenta con el codigo " + editCode.trim() + "."
        : "Error al guardar: " + error.message);
      setSaving(false);
      return;
    }
    setMessage("Cuenta actualizada correctamente.");
    setEditingId(null);
    setSaving(false);
    await loadAccounts(companyId);
  }

  async function toggleActive(acc: any) {
    if (!companyId) return;
    await supabase.from("chart_of_accounts").update({ is_active: !acc.is_active }).eq("id", acc.id);
    await loadAccounts(companyId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 16 };
  const smallInputStyle = { ...theme.inputStyle, fontSize: 14, padding: "6px 10px" };

  const filtered = accounts
    .filter((a) => showInactive || a.is_active !== false)
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return a.account_code.toLowerCase().includes(q) || a.account_name.toLowerCase().includes(q);
    });

  return (
    <VerticalPageLayout vertical="accounting" title="Plan de Cuentas" subtitle="Crea, corrige y desactiva las cuentas de tu plan contable" fullWidth>
      <div style={{ ...theme.cardStyle, marginBottom: 20, maxWidth: 900 }}>
        <p style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Nueva Cuenta</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={newCode} onChange={(e) => setNewCode(e.target.value)} style={{ ...inputStyle, width: 140 }} placeholder="Codigo (ej. 1101)" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 220 }} placeholder="Nombre de la cuenta" />
          <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, width: 170 }}>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <button onClick={createAccount} disabled={creating} style={{ ...theme.buttonStyle, fontSize: 15 }}>
            {creating ? "CREANDO..." : "CREAR CUENTA"}
          </button>
        </div>
        {message && <p style={{ marginTop: 10, fontSize: 14, color: message.includes("Error") || message.includes("Ya existe") || message.includes("Completa") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 300 }} placeholder="Buscar por codigo o nombre..." />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#8B93A7" }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar cuentas desactivadas
        </label>
        <span style={{ fontSize: 13, color: "#8B93A7" }}>{filtered.length} de {accounts.length} cuenta(s)</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: theme.accent, fontSize: 14, fontWeight: 700 }}>
            <th style={{ padding: 8, width: 120 }}>Codigo</th>
            <th style={{ padding: 8 }}>Nombre</th>
            <th style={{ padding: 8, width: 160 }}>Tipo</th>
            <th style={{ padding: 8, width: 100 }}>Estado</th>
            <th style={{ padding: 8, width: 180 }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((acc) => (
            <tr key={acc.id} style={{ borderBottom: "1px solid #1F2937", opacity: acc.is_active === false ? 0.55 : 1 }}>
              {editingId === acc.id ? (
                <>
                  <td style={{ padding: 8 }}>
                    <input value={editCode} onChange={(e) => setEditCode(e.target.value)} style={{ ...smallInputStyle, width: 100 }} />
                  </td>
                  <td style={{ padding: 8 }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...smallInputStyle, width: "100%" }} />
                  </td>
                  <td style={{ padding: 8 }}>
                    <select value={editType} onChange={(e) => setEditType(e.target.value)} style={{ ...smallInputStyle, width: "100%" }}>
                      {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 8, fontSize: 13, color: acc.is_active === false ? "#8B93A7" : "#4ade80" }}>
                    {acc.is_active === false ? "Inactiva" : "Activa"}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={saveEdit} disabled={saving} style={{ background: "none", border: "1px solid #4ade80", color: "#4ade80", padding: "4px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer", marginRight: 6 }}>
                      {saving ? "..." : "Guardar"}
                    </button>
                    <button onClick={cancelEdit} style={{ background: "none", border: "1px solid #8B93A7", color: "#8B93A7", padding: "4px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: 8, fontSize: 15, fontFamily: "monospace" }}>{acc.account_code}</td>
                  <td style={{ padding: 8, fontSize: 15 }}>{acc.account_name}</td>
                  <td style={{ padding: 8, fontSize: 14, color: "#8B93A7" }}>{TYPE_LABELS[acc.account_type] ?? acc.account_type}</td>
                  <td style={{ padding: 8, fontSize: 13, color: acc.is_active === false ? "#8B93A7" : "#4ade80" }}>
                    {acc.is_active === false ? "Inactiva" : "Activa"}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => startEdit(acc)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "4px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer", marginRight: 6 }}>
                      Editar
                    </button>
                    <button onClick={() => toggleActive(acc)} style={{ background: "none", border: "1px solid #FB923C", color: "#FB923C", padding: "4px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                      {acc.is_active === false ? "Activar" : "Desactivar"}
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 16, color: "#8B93A7", textAlign: "center" }}>No hay cuentas que coincidan.</td></tr>
          )}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 16 }}>
        "Desactivar" no borra la cuenta ni su historial (otros modulos ya tienen movimientos enlazados a ella) -- la marca como inactiva para referencia, pero por ahora los selectores de cuenta en el resto de la plataforma todavia pueden mostrarla (ese filtro es un siguiente paso, no esta hecho en todos los modulos aun). Cambiar el codigo o el nombre aqui no afecta los asientos ya registrados con esa cuenta.
      </p>
    </VerticalPageLayout>
  );
}
